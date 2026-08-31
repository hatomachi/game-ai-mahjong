import { spawn, execSync } from 'child_process';
import fs from 'fs';
import { SanitizedPlayerView } from '../src/ai/types/context';
import { analyzeBoardAndGenerateAdvice } from '../src/ai/engine/ruleBasedCoach';

export type CLIBackend = 'agy' | 'claude' | 'mock' | 'auto';

export interface CLIExecutionResult {
  success: boolean;
  reply: string;
  backendUsed: string;
  executionTimeMs: number;
  error?: string;
}

/**
 * コマンドのフルパスを探索
 */
export function getCommandFullPath(cmd: string): string | null {
  const commonPaths = [
    `/Users/s-ikari/.local/bin/${cmd}`,
    `/usr/local/bin/${cmd}`,
    `/opt/homebrew/bin/${cmd}`,
    `/usr/bin/${cmd}`,
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  try {
    const stdout = execSync(`which ${cmd} 2>/dev/null`, {
      env: {
        ...process.env,
        PATH: `/Users/s-ikari/.local/bin:/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ''}`,
      },
    }).toString().trim();
    if (stdout && fs.existsSync(stdout)) {
      return stdout;
    }
  } catch {
    // which 失敗時は null
  }

  return null;
}

/**
 * コマンドがローカル環境に存在するかチェック
 */
export async function checkCommandExists(cmd: string): Promise<boolean> {
  return getCommandFullPath(cmd) !== null;
}

/**
 * ローカルCLI（agy / claude）を実行、またはフォールバック
 */
export async function runCLI(
  prompt: string,
  question: string,
  context: SanitizedPlayerView,
  preferredBackend: CLIBackend = 'auto'
): Promise<CLIExecutionResult> {
  const startTime = Date.now();

  const agyPath = getCommandFullPath('agy');
  const claudePath = getCommandFullPath('claude');

  let targetBackend = preferredBackend;
  let targetExecutable: string | null = null;

  if (targetBackend === 'auto') {
    if (agyPath) {
      targetBackend = 'agy';
      targetExecutable = agyPath;
    } else if (claudePath) {
      targetBackend = 'claude';
      targetExecutable = claudePath;
    } else {
      targetBackend = 'mock';
    }
  } else if (targetBackend === 'agy') {
    targetExecutable = agyPath;
  } else if (targetBackend === 'claude') {
    targetExecutable = claudePath;
  }

  // 明示的にmock指定された場合
  if (targetBackend === 'mock') {
    const reply = analyzeBoardAndGenerateAdvice(context, question);
    return {
      success: true,
      reply,
      backendUsed: 'ルールベース牌読みエンジン',
      executionTimeMs: Date.now() - startTime,
    };
  }

  // CLIが見つからない場合
  if (!targetExecutable) {
    const reply = analyzeBoardAndGenerateAdvice(context, question);
    return {
      success: true,
      reply: `${reply}\n\n*(※ ${targetBackend} CLI が見つからなかったため、ルールベース分析で回答しました)*`,
      backendUsed: 'ルールベース牌読みエンジン',
      executionTimeMs: Date.now() - startTime,
      error: `Command '${targetBackend}' not found on PATH`,
    };
  }

  console.log(`[CLI Bridge] Executing ${targetBackend} (${targetExecutable})...`);

  return new Promise((resolve) => {
    let args: string[] = [];

    if (targetBackend === 'agy') {
      // agy は --dangerously-skip-permissions と -p で安全かつ非対話に実行
      args = ['--dangerously-skip-permissions', '-p', prompt];
    } else if (targetBackend === 'claude') {
      args = ['-p', prompt];
    } else {
      args = ['-p', prompt];
    }

    let stdoutData = '';
    let stderrData = '';

    const extendedPath = [
      '/Users/s-ikari/.gemini/antigravity/bin',
      '/Users/s-ikari/Library/Application Support/Antigravity/bin',
      '/Users/s-ikari/.local/bin',
      '/usr/local/bin',
      '/opt/homebrew/bin',
      process.env.PATH || '',
    ].join(':');

    const proc = spawn(targetExecutable!, args, {
      env: {
        ...process.env,
        PATH: extendedPath,
        HOME: process.env.HOME || '/Users/s-ikari',
      },
      shell: false,
    });

    const timeoutTimer = setTimeout(() => {
      proc.kill('SIGKILL');
      console.warn(`[CLI Bridge] ${targetBackend} execution timed out (90s)`);
      const fallback = analyzeBoardAndGenerateAdvice(context, question);
      resolve({
        success: true,
        reply: `${fallback}\n\n*(※ AI思考がタイムアウトしたため、ルールベース分析結果を表示しています)*`,
        backendUsed: `${targetBackend} (タイムアウト代替)`,
        executionTimeMs: Date.now() - startTime,
        error: 'Timeout after 90s',
      });
    }, 90000);

    proc.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutTimer);
      const executionTimeMs = Date.now() - startTime;
      console.log(`[CLI Bridge] ${targetBackend} exited with code ${code} in ${executionTimeMs}ms`);

      // stdoutData に有効な回答がある場合（code 0 またはログ警告があっても回答がある場合）
      const trimmedOutput = stdoutData.trim();
      if (trimmedOutput.length > 0) {
        resolve({
          success: true,
          reply: trimmedOutput,
          backendUsed: targetBackend,
          executionTimeMs,
        });
      } else {
        console.warn(`[CLI Bridge] ${targetBackend} returned empty stdout (code ${code}): ${stderrData}`);
        const fallback = analyzeBoardAndGenerateAdvice(context, question);
        resolve({
          success: true,
          reply: `${fallback}\n\n*(※ ${targetBackend} CLI実行エラー[code ${code}: ${stderrData.slice(0, 150)}]のため、ルールベース分析結果を表示しています)*`,
          backendUsed: `${targetBackend} (フォールバック)`,
          executionTimeMs,
          error: stderrData || `Exited with code ${code}`,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutTimer);
      console.error(`[CLI Bridge] Failed to spawn ${targetBackend}:`, err);
      const fallback = analyzeBoardAndGenerateAdvice(context, question);
      resolve({
        success: true,
        reply: `${fallback}\n\n*(※ ${targetBackend} CLI起動エラー[${err.message}]のため、ルールベース分析結果を表示しています)*`,
        backendUsed: `${targetBackend} (エラー代替)`,
        executionTimeMs: Date.now() - startTime,
        error: err.message,
      });
    });
  });
}
