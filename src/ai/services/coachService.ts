import { SanitizedPlayerView } from '../types/context';
import { analyzeBoardAndGenerateAdvice } from '../engine/ruleBasedCoach';
import { AISettings, AICoachResponse, AIProvider } from './types';
import { loadAISettings } from './storage';
import { callGeminiDirect } from './geminiDirectClient';
import { callClaudeDirect } from './claudeDirectClient';
import { callCloudflareProxy } from './proxyClient';

/**
 * ローカルCLIブリッジサーバー（ポート3001）を呼び出す
 */
async function callLocalCLIServer(
  context: SanitizedPlayerView,
  question: string,
  cliBackend: 'agy' | 'claude' | 'auto'
): Promise<AICoachResponse> {
  const startTime = Date.now();
  const endpoints = [
    'http://localhost:3001/api/coach/chat',
    'http://127.0.0.1:3001/api/coach/chat',
    '/api/coach/chat',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context,
          cliBackend,
        }),
        signal: AbortSignal.timeout(95000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          reply: data.reply || '回答が得られませんでした。',
          providerUsed: `ローカルCLI (${data.backendUsed || cliBackend})`,
          executionTimeMs: Date.now() - startTime,
        };
      }
    } catch {
      // 次のエンドポイントを試行
    }
  }

  throw new Error('ローカルCLIサーバー (ポート3001) に接続できませんでした。');
}

/**
 * ローカルサーバーが起動しているか確認
 */
export async function checkLocalServerStatus(): Promise<{
  connected: boolean;
  availableBackends: { agy: boolean; claude: boolean; mock: boolean };
}> {
  const endpoints = [
    'http://localhost:3001/api/coach/status',
    'http://127.0.0.1:3001/api/coach/status',
    '/api/coach/status',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.availableBackends) {
          return {
            connected: true,
            availableBackends: data.availableBackends,
          };
        }
      }
    } catch {
      // 次を試行
    }
  }

  return {
    connected: false,
    availableBackends: { agy: false, claude: false, mock: true },
  };
}

/**
 * 統合AIコーチング呼び出し
 */
export async function askAICoach(
  context: SanitizedPlayerView,
  question: string,
  customSettings?: Partial<AISettings>
): Promise<AICoachResponse> {
  const startTime = Date.now();
  const settings: AISettings = {
    ...loadAISettings(),
    ...customSettings,
  };

  const provider: AIProvider = settings.preferredProvider || 'auto';

  // 1. ルールベース明示指定
  if (provider === 'rule_based') {
    const reply = analyzeBoardAndGenerateAdvice(context, question);
    return {
      success: true,
      reply,
      providerUsed: 'ルールベース牌読みエンジン',
      executionTimeMs: Date.now() - startTime,
    };
  }

  // 2. Gemini Direct API 明示指定
  if (provider === 'gemini_direct') {
    if (!settings.geminiApiKey?.trim()) {
      const fallback = analyzeBoardAndGenerateAdvice(context, question);
      return {
        success: true,
        reply: `${fallback}\n\n*(※ Gemini APIキーが未設定のため、ルールベース牌読みエンジンが回答しました。右上の⚙️設定からAPIキーを入力するとGemini AIをご利用いただけます)*`,
        providerUsed: 'ルールベース (Geminiキー未設定)',
        executionTimeMs: Date.now() - startTime,
      };
    }
    const result = await callGeminiDirect(settings.geminiApiKey, settings.geminiModel, context, question);
    if (result.success) return result;

    // 失敗時はルールベースフォールバック
    const fallback = analyzeBoardAndGenerateAdvice(context, question);
    return {
      success: true,
      reply: `${fallback}\n\n*(※ Gemini API呼び出し失敗[${result.error}]のため、ルールベース牌読みエンジンが代替回答しました)*`,
      providerUsed: 'ルールベース (Geminiエラー代替)',
      executionTimeMs: Date.now() - startTime,
      error: result.error,
    };
  }

  // 3. Claude Direct API 明示指定
  if (provider === 'claude_direct') {
    if (!settings.claudeApiKey?.trim()) {
      const fallback = analyzeBoardAndGenerateAdvice(context, question);
      return {
        success: true,
        reply: `${fallback}\n\n*(※ Claude APIキーが未設定のため、ルールベース牌読みエンジンが回答しました。右上の⚙️設定からAPIキーを入力するとClaude AIをご利用いただけます)*`,
        providerUsed: 'ルールベース (Claudeキー未設定)',
        executionTimeMs: Date.now() - startTime,
      };
    }
    const result = await callClaudeDirect(settings.claudeApiKey, settings.claudeModel, context, question);
    if (result.success) return result;

    // 失敗時はルールベースフォールバック
    const fallback = analyzeBoardAndGenerateAdvice(context, question);
    return {
      success: true,
      reply: `${fallback}\n\n*(※ Claude API呼び出し失敗[${result.error}]のため、ルールベース牌読みエンジンが代替回答しました)*`,
      providerUsed: 'ルールベース (Claudeエラー代替)',
      executionTimeMs: Date.now() - startTime,
      error: result.error,
    };
  }

  // 4. ローカルCLI明示指定 (agy / claude)
  if (provider === 'agy' || provider === 'claude_cli') {
    try {
      const backend = provider === 'agy' ? 'agy' : 'claude';
      return await callLocalCLIServer(context, question, backend);
    } catch (err: any) {
      const fallback = analyzeBoardAndGenerateAdvice(context, question);
      return {
        success: true,
        reply: `${fallback}\n\n*(※ ローカルCLIサーバー未接続[${err.message}]のため、ルールベース牌読みエンジンが代替回答しました。ローカルで動かす場合は \`npm run dev\` を実行してください)*`,
        providerUsed: 'ルールベース (CLI未接続代替)',
        executionTimeMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }

  // 5. プロキシ明示指定
  if (provider === 'proxy') {
    const res = await callCloudflareProxy(settings.customProxyUrl, context, question);
    if (res.success) return res;

    const fallback = analyzeBoardAndGenerateAdvice(context, question);
    return {
      success: true,
      reply: `${fallback}\n\n*(※ クラウドAIプロキシ接続失敗[${res.error}]のため、ルールベース牌読みエンジンが回答しました)*`,
      providerUsed: 'ルールベース (プロキシエラー代替)',
      executionTimeMs: Date.now() - startTime,
      error: res.error,
    };
  }

  // 6. 自動選択 (auto)
  // (a) Gemini APIキーが設定されている場合
  if (settings.geminiApiKey?.trim()) {
    const res = await callGeminiDirect(settings.geminiApiKey, settings.geminiModel, context, question);
    if (res.success) return res;
  }

  // (b) Claude APIキーが設定されている場合
  if (settings.claudeApiKey?.trim()) {
    const res = await callClaudeDirect(settings.claudeApiKey, settings.claudeModel, context, question);
    if (res.success) return res;
  }

  // (c) ローカルCLIサーバーが動いているか確認
  try {
    const serverStatus = await checkLocalServerStatus();
    if (serverStatus.connected && (serverStatus.availableBackends.agy || serverStatus.availableBackends.claude)) {
      return await callLocalCLIServer(context, question, 'auto');
    }
  } catch {
    // ローカルサーバーなし
  }

  // (d) クラウドプロキシ (Pages Functions / Workers) が利用可能か試行
  try {
    const proxyRes = await callCloudflareProxy(settings.customProxyUrl, context, question);
    if (proxyRes.success) return proxyRes;
  } catch {
    // プロキシなし
  }

  // (e) デフォルト: ルールベース牌読みエンジン（オフライン即答）
  const reply = analyzeBoardAndGenerateAdvice(context, question);
  return {
    success: true,
    reply,
    providerUsed: 'ルールベース牌読みエンジン (即時回答)',
    executionTimeMs: Date.now() - startTime,
  };
}
