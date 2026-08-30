import { spawn } from 'child_process';

export type CLIBackend = 'agy' | 'claude' | 'mock' | 'auto';

export interface CLIExecutionResult {
  success: boolean;
  reply: string;
  backendUsed: string;
  executionTimeMs: number;
  error?: string;
}

/**
 * コマンドがローカル環境に存在するかチェック
 */
export async function checkCommandExists(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn('which', [cmd]);
    process.on('close', (code) => {
      resolve(code === 0);
    });
    process.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * ルールベースのモック回答（CLIが使えない場合のフォールバック）
 */
function generateFallbackReply(_prompt: string, question: string): string {
  return `【AI牌読みコーチ (オフライン/モック分析モード)】

### 💡 結論
「${question}」に関する分析です。現時点では手牌の受け入れ最大化、および他家のリーチ・仕掛けに対して現物（相手の河にある牌）やノーチャンス・ワンチャンス牌を優先して対処するのが論理的です。

### 🔍 牌読み・状況分析
1. **安全度分析**:
   - **現物 (100%安全)**: 相手の河に切られている牌はフリテンによりロンされません。
   - **スジ・カベ牌**: 自分の手牌と全員の捨て牌で見えている牌数を確認し、両面待ちが否定されている牌（ノーチャンス）やスジ牌（4が切られている場合の1-7）を比較検討してください。
2. **手牌の進行**:
   - 門前を保てる場合はリーチ・ドラ受けを意識し、孤立している役牌や安牌候補を1枚キープしつつ有効牌を広げましょう。

### 🎓 上達のワンポイント
相手のリーチに対しては「自分の手牌の打点・待ちの良さ」と「放銃時の失点リスク」を常に天秤にかける押し引きが勝率アップの鍵です！`;
}

/**
 * ローカルCLI（agy / claude）を実行して回答を取得
 */
export async function runCLI(
  prompt: string,
  preferredBackend: CLIBackend = 'auto'
): Promise<CLIExecutionResult> {
  const startTime = Date.now();

  let targetBackend = preferredBackend;

  if (targetBackend === 'auto') {
    const hasAgy = await checkCommandExists('agy');
    const hasClaude = await checkCommandExists('claude');

    if (hasAgy) {
      targetBackend = 'agy';
    } else if (hasClaude) {
      targetBackend = 'claude';
    } else {
      targetBackend = 'mock';
    }
  }

  if (targetBackend === 'mock') {
    const reply = generateFallbackReply(prompt, '局面アドバイス');
    return {
      success: true,
      reply,
      backendUsed: 'mock',
      executionTimeMs: Date.now() - startTime,
    };
  }

  return new Promise((resolve) => {
    let command = '';
    let args: string[] = [];

    if (targetBackend === 'agy') {
      command = 'agy';
      // agy は -p または --print でワンショット実行
      args = ['-p', prompt];
    } else if (targetBackend === 'claude') {
      command = 'claude';
      // claude は -p でワンショット実行
      args = ['-p', prompt];
    }

    let stdoutData = '';
    let stderrData = '';

    // shell: false で引数配列を安全にそのままプロセスへ渡す
    const proc = spawn(command, args, {
      env: { ...process.env },
      shell: false,
    });

    // タイムアウト設定 (90秒)
    const timeoutTimer = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve({
        success: false,
        reply: 'AIの応答がタイムアウトしました。',
        backendUsed: targetBackend,
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

      if (code === 0 && stdoutData.trim().length > 0) {
        resolve({
          success: true,
          reply: stdoutData.trim(),
          backendUsed: targetBackend,
          executionTimeMs,
        });
      } else {
        console.warn(`CLI execution failed (${command} code ${code}): ${stderrData}`);
        const fallback = generateFallbackReply(prompt, '局面分析');
        resolve({
          success: true,
          reply: `${fallback}\n\n*(CLI実行エラー[code ${code}: ${stderrData.slice(0, 100)}]のためオフライン分析に切り替えました)*`,
          backendUsed: `${targetBackend} (fallback)`,
          executionTimeMs,
          error: stderrData || `Exited with code ${code}`,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutTimer);
      console.warn(`Failed to start CLI process (${command}): ${err.message}`);
      const fallback = generateFallbackReply(prompt, '局面分析');
      resolve({
        success: true,
        reply: `${fallback}\n\n*(ローカルCLI[${command}]起動エラー: ${err.message})*`,
        backendUsed: 'mock (error fallback)',
        executionTimeMs: Date.now() - startTime,
        error: err.message,
      });
    });
  });
}
