import { SanitizedPlayerView } from '../types/context';
import { getTileNameJa, getTileCode, sortTiles, getDoraTileFromMarker } from '../../core/utils/tileUtils';
import { DiscardTile, Meld } from '../../core/types/tile';
import { Wind } from '../../core/types/game';

const WIND_JA: Record<Wind, string> = {
  east: '東',
  south: '南',
  west: '西',
  north: '北',
};

/**
 * 捨て牌リストを分かりやすいテキストにフォーマット
 */
function formatDiscards(discards: DiscardTile[]): string {
  if (discards.length === 0) return 'なし (まだ捨てていません)';

  return discards
    .map((d, index) => {
      const name = getTileNameJa(d.tile);
      const code = getTileCode(d.tile);
      const mark = d.isRiichiDeclaration ? '【リーチ宣言牌】' : '';
      const tsumo = d.isTsumogiri ? '(ツモ切り)' : '(手出し)';
      return `${index + 1}巡目: ${name}[${code}] ${tsumo} ${mark}`.trim();
    })
    .join(', ');
}

/**
 * 副露（鳴き）リストを分かりやすいテキストにフォーマット
 */
function formatMelds(melds: Meld[]): string {
  if (melds.length === 0) return 'なし (門前)';

  const meldNameJa: Record<Meld['type'], string> = {
    chi: 'チー',
    pon: 'ポン',
    daiminkan: '大明槓',
    ankan: '暗槓',
    kakan: '加槓',
  };

  return melds
    .map(m => {
      const tileNames = m.tiles.map(t => getTileNameJa(t)).join(' ');
      return `[${meldNameJa[m.type]}: ${tileNames}]`;
    })
    .join(', ');
}

/**
 * SanitizedPlayerView とユーザーの質問から、LLM向けの総合プロンプトテキストを生成
 */
export function buildMahjongCoachPrompt(
  context: SanitizedPlayerView,
  userQuestion: string
): string {
  const roundJa = `${context.roundWind === 'east' ? '東' : '南'}${context.roundNumber}局`;
  const doraTiles = context.doraMarkers.map(m => {
    const next = getDoraTileFromMarker(m);
    const mName = getTileNameJa(m);
    const nextName = getTileNameJa({ id: 'dora_target', suit: next.suit, value: next.value });
    return `${mName} (ドラ: ${nextName})`;
  }).join(', ');

  const sortedHand = sortTiles(context.myHand);
  const handJa = sortedHand.map(t => `${getTileNameJa(t)}[${getTileCode(t)}]`).join(' ');
  const drawnJa = context.myDrawnTile
    ? ` + ツモ牌: ${getTileNameJa(context.myDrawnTile)}[${getTileCode(context.myDrawnTile)}]`
    : '';

  const myDiscardsText = formatDiscards(context.myDiscards);
  const myMeldsText = formatMelds(context.myMelds);

  const opponentsSection = context.opponents
    .map(op => {
      const riichiInfo = op.isRiichi ? ` 🚨【立直中 / ${op.riichiTurn ?? '?'}巡目】` : '';
      return `### ${WIND_JA[op.seatWind]}家: ${op.name} (${op.score}点)${riichiInfo}
- 手牌枚数: ${op.handTileCount}枚 (内容は伏せられています)
- 副露: ${formatMelds(op.melds)}
- 河(捨て牌): ${formatDiscards(op.discards)}`;
    })
    .join('\n\n');

  return `あなたはプロ競技麻雀雀士であり、初心〜中級者を指導する専属AI牌読みコーチです。
提供された「プレイヤーから見える公開情報（自手牌・全員の河・副露・ドラ・点数状況）」のみを元に、論理的かつ分かりやすくプレイヤーの質問に答えてください。
※重要: 他家の非公開手牌や山牌の情報は伏せられており、あなたもプレイヤーと同じ不完全情報の中で牌読みと分析を行います。

---
## 🀄 現在の対局状況

### 【局情報】
- 局: ${roundJa} ${context.honba}本場
- 供託リーチ棒: ${context.riichiSticks}本
- ドラ表示牌: ${doraTiles || 'なし'}
- 残り山牌: ${context.wallRemainingCount}枚 (現在の巡目: ${context.currentTurn}巡目)

### 【自プレイヤー (${WIND_JA[context.mySeatWind]}家 / ${context.myScore}点)】
- 手牌: ${handJa}${drawnJa}
- 副露: ${myMeldsText}
- 状態: ${context.myIsRiichi ? '立直中' : '門前/非立直'}
- 自分の河: ${myDiscardsText}
${
  context.pendingActionForMe
    ? `\n### ⚡【現在のアクション選択肢 (鳴き・ロン判断待ち)】
- 状況: ${context.pendingActionForMe.fromPlayerName} の打牌 【${context.pendingActionForMe.targetTile ? getTileNameJa(context.pendingActionForMe.targetTile) : '？'}】 に対して宣言可能
- 選択可能なアクション: ${[
        context.pendingActionForMe.canRon ? 'ロン和了' : '',
        context.pendingActionForMe.canChi ? 'チー' : '',
        context.pendingActionForMe.canPon ? 'ポン' : '',
        context.pendingActionForMe.canDaiminkan ? '大明槓' : '',
        'パス (スルー)',
      ]
        .filter(Boolean)
        .join(' / ')}`
    : ''
}

### 【他家の公開情報】
${opponentsSection}

---
## 💬 プレイヤーからの質問
「${userQuestion}」

---
## 💡 回答フォーマットと指導方針
1. **結論 (要約)**:
   - 質問に対する明確な答え（おすすめの打牌、最も安全な牌、テンパイ速度、点数・符計算の結論など）を最初に1〜2行で述べてください。
2. **ロジカルな牌読み・分析根拠**:
   - **現物・筋（スジ）・壁（ノーチャンス/ワンチャンス）**: 全員の河と自分の手牌から見えている枚数を数え、なぜその牌が安全/危険なのかを論理的に解説してください。
   - **手牌の価値と受け入れ**: 自分の手のシャンテン数、受け入れ牌、ドラを使った打点向上ルートを解説してください。
   - **押し引き判断**: 相手のリーチや仕掛けに対する自分の手の価値（打点・巡目・待ちの良さ）を比較してください。
3. **上達のためのワンポイントアドバイス**:
   - 今回の判断から学べる、今後の対局でも使える牌読みのコツを1文で添えてください。

※注意事項: 冗長な全パターン列挙は避け、要点を整理して簡潔かつ論理的に述べてください。回答は途中で切らず、必ず結びまで完全に書き切ってください。
`;
}
