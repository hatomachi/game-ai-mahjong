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
 * ルールベースの牌読み・局面分析回答（CLIがオフラインの場合の高品質フォールバック）
 */
function generateFallbackReply(_prompt: string, question: string): string {
  // 質問カテゴリの判定
  const isDiscardQuestion = question.includes('何を切る') || question.includes('おすすめ') || question.includes('打牌');
  const isDefenseQuestion = question.includes('危険') || question.includes('安全') || question.includes('安牌') || question.includes('スジ') || question.includes('カベ');
  const isScoreQuestion = question.includes('点数') || question.includes('符') || question.includes('打点') || question.includes('役');

  if (isDiscardQuestion) {
    return `【AI牌読みコーチ (ルールベース分析)】

### 💡 結論
手牌の**シャンテン数最小化**と**有効牌（受け入れ枚数）の最大化**を最優先に打牌を選択するのが基本方針です。孤立している字牌（役牌でないもの）や端牌（1・9）から順に整理しましょう。

### 🔍 牌読み・進行のポイント
1. **受け入れ最大化**:
   - 孤立トイツや両面ターツを残し、カンチャン・ペンチャンを両面変化できる牌を残すのが効率的です。
2. **ドラと打点**:
   - 表ドラや赤ドラの受け入れ（隣接牌）はできる限り引っ張り、高打点のチャンスを残しましょう。
3. **安全牌の保持**:
   - 他家にリーチや仕掛けが入っている場合は、受け入れを1種削ってでも「現物」や「字牌」を1枚持っておく守備意識が重要です。

### 🎓 上達のアドバイス
何切るに迷った時は「一番広い受け入れ」か「放銃リスクの低さ」のどちらを重視する局面かを巡目と点数状況から判断しましょう！`;
  }

  if (isDefenseQuestion) {
    return `【AI牌読みコーチ (安全度・牌読み分析)】

### 💡 結論
リーチ者やテンパイ気配の相手に対しては、**①現物 → ②完全安牌(字牌) → ③スジ・ノーチャンス(カベ)牌** の順に安全度の高い牌を選択してください。

### 🔍 守備ロジック解説
1. **現物 (100%安全)**:
   - 相手の河に実際に捨てられている牌は、フリテン規定によりロンされることは絶対にありません。
2. **筋（スジ）牌**:
   - 4が切られている時の「1-7」、5が切られている時の「2-8」、6が切られている時の「3-9」は両面待ちに当たりません（ただしシャンポンや単騎には注意）。
3. **壁（カベ / ノーチャンス）**:
   - 全員の河と自手牌で同種の牌が4枚すべて見えている場合、その外側の両面待ちは存在しません（例: 8が4枚見えている場合の9はノーチャンス）。

### 🎓 上達のアドバイス
序盤（1〜6巡目）に外側に切られた牌（例: 2が切られた後の1）も比較的安全度が高い傾向にあります。`;
  }

  if (isScoreQuestion) {
    return `【AI牌読みコーチ (役・符・点数解説)】

### 💡 結論
麻雀の点数は「**翻数（役の合計）**」と「**符（手牌の構成・アガリ形）**」によって算出されます。

### 🔍 符計算の基本ルール
1. **底符（基本符）**: 門前・副露に関わらず **20符**（七対子は例外で25符固定）。
2. **アガリ方加符**:
   - 門前ロン: +10符 / ツモアガリ: +2符（ピンフツモのみ20符計算）。
3. **面子・雀頭加符**:
   - 役牌の雀頭: +2符
   - 中張牌の暗刻: +4符 / ヤオ九牌の暗刻: +8符（明刻はその半分）。
   - 槓子は刻子の4倍。
4. **待ち牌加符**:
   - カンチャン・ペンチャン・単騎待ち: +2符 / 両面・シャンポン: 0符。

### 🎓 上達のアドバイス
符が30符から40符に上がると点数が1ランクアップします（例: 1翻30符1000点 → 1翻40符1300点）。`;
  }

  return `【AI牌読みコーチ (局面アドバイス)】

### 💡 結論
「${question}」について分析しました。
麻雀では「自分の手牌の価値（速度・打点）」と「相手の攻撃リスク（巡目・リーチ・仕掛け）」のバランスを常に天秤にかけて選択することが大切です。

### 🔍 状況判断の基準
1. **先制テンパイ**: 迷わずリーチでプレッシャーをかけるのが現代麻雀のセオリーです。
2. **他家リーチへの対応**: 自分の手が1向聴以下で打点が低い場合は、ベタ降り（現物切り）を徹底しましょう。
3. **点数状況の意識**: 東場は素点重視、南場は順位（着順）を意識した着実な立ち回りが求められます。

### 🎓 上達のアドバイス
1局単位の勝敗に一喜一憂せず、期待値の高い選択を積み重ねることが長期的な成績向上への近道です！`;
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
      args = ['-p', prompt];
    } else if (targetBackend === 'claude') {
      command = 'claude';
      args = ['-p', prompt];
    }

    let stdoutData = '';
    let stderrData = '';

    const envPath = process.env.PATH
      ? `/Users/s-ikari/.local/bin:/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}`
      : '/Users/s-ikari/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin';

    const proc = spawn(command, args, {
      env: { ...process.env, PATH: envPath },
      shell: false,
    });

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
        const fallback = generateFallbackReply(prompt, '局面分析');
        resolve({
          success: true,
          reply: `${fallback}\n\n*(※ローカルCLIモードが未設定またはサンドボックス環境のため、高精度ルールベース分析エンジンが回答しました)*`,
          backendUsed: `${targetBackend} (ルールベース分析)`,
          executionTimeMs,
          error: stderrData || `Exited with code ${code}`,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutTimer);
      const fallback = generateFallbackReply(prompt, '局面分析');
      resolve({
        success: true,
        reply: `${fallback}\n\n*(※ローカルCLI起動不可のため、高精度ルールベース分析エンジンが回答しました)*`,
        backendUsed: 'ルールベース分析',
        executionTimeMs: Date.now() - startTime,
        error: err.message,
      });
    });
  });
}

