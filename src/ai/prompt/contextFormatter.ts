import { SanitizedPlayerView } from '../types/context';
import { getTileNameJa, getTileCode, sortTiles, getDoraTileFromMarker } from '../../core/utils/tileUtils';
import { DiscardTile, Meld, Tile } from '../../core/types/tile';
import { Wind } from '../../core/types/game';
import { calcShanten } from '../../core/shanten/shanten';
import { calcUkeireForDiscards, calcUkeireFor13Tiles } from '../../core/shanten/ukeire';

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
      return `${index + 1}巡目:${name}[${code}]${tsumo}${mark}`.trim();
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
 * 事前のルールベース計算データを文字列化（LLMの計算ミスを防ぎ高品質な解説を引き出す）
 */
function buildPrecalculatedFacts(context: SanitizedPlayerView): string {
  const fullHand: Tile[] = context.myDrawnTile ? [...context.myHand, context.myDrawnTile] : context.myHand;
  const shantenRes = calcShanten(fullHand);

  let ukeireSection = '';
  if (fullHand.length === 14) {
    const discardsAnalysis = calcUkeireForDiscards(fullHand);
    const topChoices = discardsAnalysis.slice(0, 4).map((d, i) => {
      const name = getTileNameJa(d.discardTile);
      const code = getTileCode(d.discardTile);
      const ukeires = d.ukeireTiles.map(u => `${u.tileCode}(${u.remainingCount}枚)`).join(' ');
      return `  ${i + 1}. 打【${name}[${code}]】 -> 打後向聴数:${d.shantenAfterDiscard}向聴 / 最大受入:${d.totalUkeireCount}枚 (有効牌: ${ukeires})`;
    }).join('\n');
    ukeireSection = `\n- 【打牌候補と受け入れ枚数ランキング（計算済み）】:\n${topChoices}`;
  } else if (fullHand.length === 13) {
    const ukeire13 = calcUkeireFor13Tiles(fullHand);
    const ukeires = ukeire13.ukeireTiles.map(u => `${u.tileCode}(${u.remainingCount}枚)`).join(' ');
    ukeireSection = `\n- 【13枚テンパイ/向聴の受け入れ（計算済み）】: 向聴数:${ukeire13.currentShanten} / 受入:${ukeire13.totalUkeireCount}枚 (待ち/有効牌: ${ukeires})`;
  }

  // 守備・安全牌分析
  const riichiOpponents = context.opponents.filter(p => p.isRiichi);
  let defenseSection = '';
  if (riichiOpponents.length > 0) {
    const target = riichiOpponents[0];
    const genbutsuSet = new Set(target.discards.map(d => `${d.tile.value}${d.tile.suit[0]}`));
    const myGenbutsu = fullHand.filter(t => genbutsuSet.has(`${t.value}${t.suit[0]}`));

    // スジ判定
    const sujiCodes = new Set<string>();
    target.discards.forEach(d => {
      if (d.tile.suit !== 'honor') {
        const v = d.tile.value;
        const s = d.tile.suit[0];
        if (v === 4) { sujiCodes.add(`1${s}`); sujiCodes.add(`7${s}`); }
        if (v === 5) { sujiCodes.add(`2${s}`); sujiCodes.add(`8${s}`); }
        if (v === 6) { sujiCodes.add(`3${s}`); sujiCodes.add(`9${s}`); }
        if (v === 1 || v === 7) { sujiCodes.add(`4${s}`); }
        if (v === 2 || v === 8) { sujiCodes.add(`5${s}`); }
        if (v === 3 || v === 9) { sujiCodes.add(`6${s}`); }
      }
    });
    const mySuji = fullHand.filter(t => sujiCodes.has(`${t.value}${t.suit[0]}`) && !genbutsuSet.has(`${t.value}${t.suit[0]}`));

    defenseSection = `\n- 【警戒対象: ${target.name} (第${target.riichiTurn || '?'}巡目リーチ)】:\n  * 手牌にある現物 (100%安全): ${myGenbutsu.map(t => getTileNameJa(t)).join(', ') || 'なし'}\n  * 手牌にある筋牌 (スジ安全): ${mySuji.map(t => getTileNameJa(t)).join(', ') || 'なし'}`;
  }

  return `- 現在の手牌向聴数: **${shantenRes.shanten === 0 ? 'テンパイ (聴牌)' : `${shantenRes.shanten}向聴`}**${ukeireSection}${defenseSection}`;
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
  const precalculatedFacts = buildPrecalculatedFacts(context);

  const opponentsSection = context.opponents
    .map(op => {
      const riichiInfo = op.isRiichi ? ` 🚨【立直中 / ${op.riichiTurn ?? '?'}巡目】` : '';
      return `### ${WIND_JA[op.seatWind]}家: ${op.name} (${op.score}点)${riichiInfo}
- 手牌枚数: ${op.handTileCount}枚 (他家の手牌は非公開)
- 副露: ${formatMelds(op.melds)}
- 河(捨て牌): ${formatDiscards(op.discards)}`;
    })
    .join('\n\n');

  return `あなたは最高位戦・Mリーグ等のプロ競技麻雀で活躍するプロ雀士であり、初心〜上級者を熱心に育てる専属AI牌読みコーチです。
提供された公開局面情報（不完全情報）と、高精度エンジンによって計算された事前分析データを元に、単なる答え（結論）だけでなく、**「なぜその選択なのか」「受け入れ枚数・打点・安全度の比較根拠」「今後の対局で活かせる牌読みセオリー」**を論理的かつ情熱的に詳しく解説してください。
※他家の手牌や山牌はあなたにも見えておらず、プレイヤーと同じ公開情報のみから推理します。

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

### 【📊 エンジンによる事前分析データ（計算済み事実）】
${precalculatedFacts}

### 【他家の公開情報】
${opponentsSection}

---
## 💬 プレイヤーからの質問
「${userQuestion}」

---
## 💡 回答フォーマットと指導ガイドライン
以下の構成で、丁寧かつ中身の濃い解説を行ってください（回答を途中で省略せず、必ず最後まで書き切ってください）：

1. **💡 結論（推奨アクション）**:
   - おすすめの打牌、安全牌、または押し引きの結論を明快に提示。
2. **📊 論理的な理由と牌効率・安全度の比較**:
   - 事前分析データの受け入れ枚数やシャンテン数を引用し、なぜ他の選択肢より優れているのかを比較解説。
   - 相手の河やリーチに対して、現物・スジ・ワンチャンス等の観点から危険度を考察。
3. **🎯 今後の構想と打点アップへの道筋**:
   - 狙える役（リーチ、タンヤオ、ピンフ、役牌、混一色など）や、ドラ・赤ドラを絡めた最高打点ルート。
4. **✨ プロの一言（牌読み・上達のコツ）**:
   - 実戦で即役立つ牌読みや押し引きの金言・セオリーを1〜2文で伝授。
`;
}
