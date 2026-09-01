import { SanitizedPlayerView } from '../types/context';
import { buildMahjongCoachPrompt } from '../prompt/contextFormatter';
import { AICoachResponse } from './types';

/**
 * Cloudflare Pages Functions / Workers のプロキシを介してAIコーチングを呼び出す
 */
export async function callCloudflareProxy(
  customProxyUrl: string | undefined,
  context: SanitizedPlayerView,
  question: string
): Promise<AICoachResponse> {
  const startTime = Date.now();
  const prompt = buildMahjongCoachPrompt(context, question);
  const endpoint = customProxyUrl?.trim() || '/api/coach/proxy';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        question,
      }),
      signal: AbortSignal.timeout(20000),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.reply) {
      throw new Error(data.error || 'プロキシから回答が得られませんでした。');
    }

    return {
      success: true,
      reply: data.reply,
      providerUsed: 'クラウドAI (無料共有枠)',
      modelUsed: data.modelUsed || 'gemini-2.5-flash',
      executionTimeMs,
    };
  } catch (err: any) {
    return {
      success: false,
      reply: '',
      providerUsed: 'クラウドAI (プロキシ)',
      executionTimeMs: Date.now() - startTime,
      error: err.message || 'プロキシ接続に失敗しました。',
    };
  }
}
