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

  const requestBody: any = {
    systemInstruction: {
      parts: [
        {
          text: 'あなたは最高位戦やMリーグで活躍するプロ競技麻雀雀士であり、専属AI牌読みコーチです。提示された局面情報と計算済みデータを元に、なぜその牌なのか、受け入れ枚数・打点・筋・現物・安全度の論理的根拠を最後まで詳しく丁寧に解説してください。冗長な全パターン列挙は避け、要点を整理して簡潔かつ論理的に述べ、途中で途切れることなく必ず結びのアドバイスまで完全に書き切ってください。',
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      thinkingConfig: {
        thinkingBudget: 0,
      },
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
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // 思考パート(thought)を除外して本文パートのみを抽出（両方ある場合に対応）
    const contentParts = parts.filter((p: any) => !p.thought);
    const partsToUse = contentParts.length > 0 ? contentParts : parts;
    let candidateText = partsToUse.map((p: any) => p.text || '').join('').trim();

    if (!candidateText) {
      throw new Error('Gemini API から有効な回答テキストが得られませんでした。');
    }

    if (candidate?.finishReason === 'MAX_TOKENS') {
      candidateText += '\n\n*(※ 応答が最大長に達したため一部が省略されました)*';
    }

    return {
      success: true,
      reply: candidateText,
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
