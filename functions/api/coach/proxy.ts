// Cloudflare Pages Functions - /api/coach/proxy
// 環境変数 GEMINI_API_KEY が設定されていれば、安全に Gemini API へ中継します

interface Env {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cloudflare Pages に GEMINI_API_KEY 環境変数が設定されていません。',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json() as { prompt: string; model?: string };
    const prompt = body.prompt;
    const model = body.model || env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'プロンプトが空です。' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errJson = await geminiRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          success: false,
          error: (errJson as any)?.error?.message || `Gemini API HTTP ${geminiRes.status}`,
        }),
        { status: geminiRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiRes.json() as any;
    const replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(
      JSON.stringify({
        success: true,
        reply: replyText.trim(),
        modelUsed: model,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || '内部プロキシエラー' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
