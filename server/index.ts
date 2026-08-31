import express from 'express';
import cors from 'cors';
import { runCLI, checkCommandExists, CLIBackend } from './cliRunner';
import { buildMahjongCoachPrompt } from '../src/ai/prompt/contextFormatter';
import { SanitizedPlayerView } from '../src/ai/types/context';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * ヘルスチェック & CLI状態取得
 */
app.get('/api/coach/status', async (_req, res) => {
  const hasAgy = await checkCommandExists('agy');
  const hasClaude = await checkCommandExists('claude');

  res.json({
    status: 'ok',
    availableBackends: {
      agy: hasAgy,
      claude: hasClaude,
      mock: true,
    },
    recommendedBackend: hasAgy ? 'agy' : hasClaude ? 'claude' : 'mock',
  });
});

/**
 * 局面アドバイス & チャットエンドポイント
 */
app.post('/api/coach/chat', async (req, res) => {
  try {
    const { question, context, cliBackend = 'auto' } = req.body as {
      question: string;
      context: SanitizedPlayerView;
      cliBackend?: CLIBackend;
    };

    if (!question || !context) {
      return res.status(400).json({
        success: false,
        error: 'question and context are required',
      });
    }

    // 局面テキスト（プロンプト）を生成
    const prompt = buildMahjongCoachPrompt(context, question);

    // CLI実行 (または高精度盤面分析)
    const result = await runCLI(prompt, question, context, cliBackend);

    res.json({
      ...result,
      promptUsed: prompt,
    });
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
});

const HOST = '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`🀄 AI Mahjong Coach CLI Bridge Server running on http://${HOST}:${PORT}`);
});
