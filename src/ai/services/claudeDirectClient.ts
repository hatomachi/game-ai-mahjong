import { SanitizedPlayerView } from '../types/context';
import { buildMahjongCoachPrompt } from '../prompt/contextFormatter';
import { AICoachResponse } from './types';

/**
 * ブラウザから直接 Anthropic Claude Messages API を呼び出す
 */
export async function callClaudeDirect(
  apiKey: string,
  model: string,
  context: SanitizedPlayerView,
  question: string
): Promise<AICoachResponse> {
  const startTime = Date.now();
  const prompt = buildMahjongCoachPrompt(context, question);
  const targetModel = model || 'claude-3-5-haiku-20241022';

  const endpoint = 'https://api.anthropic.com/v1/messages';

  const requestBody = {
    model: targetModel,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Claude API エラー: ${errorMsg}`);
    }

    const data = await response.json();
    const replyText = data?.content?.[0]?.text;

    if (!replyText) {
      throw new Error('Claude API から有効な回答テキストが得られませんでした。');
    }

    return {
      success: true,
      reply: replyText.trim(),
      providerUsed: 'Anthropic Claude (Direct API)',
      modelUsed: targetModel,
      executionTimeMs,
    };
  } catch (err: any) {
    return {
      success: false,
      reply: '',
      providerUsed: 'Anthropic Claude (Direct API)',
      modelUsed: targetModel,
      executionTimeMs: Date.now() - startTime,
      error: err.message || 'Claude API 呼び出しに失敗しました。',
    };
  }
}
