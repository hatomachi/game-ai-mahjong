import { SanitizedPlayerView } from '../types/context';
import { buildMahjongCoachPrompt } from '../prompt/contextFormatter';
import { AICoachResponse } from './types';

/**
 * ブラウザから直接 Google Gemini REST API を呼び出す
 */
export async function callGeminiDirect(
  apiKey: string,
  model: string,
  context: SanitizedPlayerView,
  question: string
): Promise<AICoachResponse> {
  const startTime = Date.now();
  const prompt = buildMahjongCoachPrompt(context, question);
  const targetModel = model || 'gemini-2.5-flash';

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Gemini API エラー: ${errorMsg}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini API から有効な回答テキストが得られませんでした。');
    }

    return {
      success: true,
      reply: candidateText.trim(),
      providerUsed: 'Google Gemini (Direct API)',
      modelUsed: targetModel,
      executionTimeMs,
    };
  } catch (err: any) {
    return {
      success: false,
      reply: '',
      providerUsed: 'Google Gemini (Direct API)',
      modelUsed: targetModel,
      executionTimeMs: Date.now() - startTime,
      error: err.message || 'Gemini API 呼び出しに失敗しました。',
    };
  }
}
