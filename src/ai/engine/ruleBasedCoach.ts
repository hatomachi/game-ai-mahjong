import { SanitizedPlayerView } from '../types/context';
import { calcShanten } from '../../core/shanten/shanten';
import { calcUkeireForDiscards, calcUkeireFor13Tiles } from '../../core/shanten/ukeire';
import { getTileNameJa, getTileCode, isSameTileType } from '../../core/utils/tileUtils';
import { Tile } from '../../core/types/tile';

/**
 * 盤面（SanitizedPlayerView）を精緻に分析し、具体的な牌名とロジックを提示するAI牌読みエンジン
 */
export function analyzeBoardAndGenerateAdvice(
  context: SanitizedPlayerView,
  question: string
): string {
  const isDiscardQuestion = question.includes('何を切る') || question.includes('おすすめ') || question.includes('打牌') || question.includes('何切る');
  const isDefenseQuestion = question.includes('危険') || question.includes('安全') || question.includes('安牌') || question.includes('スジ') || question.includes('カベ') || question.includes('リーチ');
  const isScoreQuestion = question.includes('点数') || question.includes('符') || question.includes('打点') || question.includes('役');

  // 全手牌（手牌 + ツモ牌）
  const fullHand: Tile[] = context.myDrawnTile ? [...context.myHand, context.myDrawnTile] : context.myHand;
  const shantenRes = calcShanten(fullHand);

  // 1. 何切る・受け入れ分析
  if (isDiscardQuestion || (!isDefenseQuestion && !isScoreQuestion && fullHand.length === 14)) {
    const discardsAnalysis = fullHand.length === 14 ? calcUkeireForDiscards(fullHand) : [];
    const best = discardsAnalysis[0];

    if (best) {
      const bestName = getTileNameJa(best.discardTile);
      const bestCode = getTileCode(best.discardTile);
      const ukeireList = best.ukeireTiles.map(t => `${t.tileCode}(${t.remainingCount}枚)`).join(', ');

      const alternatives = discardsAnalysis.slice(1, 4).map(d => {
        return `- 打【${getTileNameJa(d.discardTile)}】: 向聴数 ${d.shantenAfterDiscard} / 受け入れ ${d.totalUkeireCount}枚`;
      }).join('\n');

      return `【🀄 AI牌読みコーチ：おすすめ打牌分析】

### 💡 推奨打牌：【${bestName}】(${bestCode})

### 📊 受け入れ・効率の根拠
- **打牌後の向聴数**: **${best.shantenAfterDiscard === 0 ? 'テンパイ (聴牌)' : `${best.shantenAfterDiscard}向聴`}**
- **最大受け入れ枚数**: **計 ${best.totalUkeireCount} 枚**
- **有効牌（ツモって嬉しい牌）**: ${ukeireList}

### 🔍 他の打牌候補との比較
${alternatives}

### 🎯 局面のアドバイス
現在は第${context.currentTurn}巡目です。受け入れ枚数が最も広い【${bestName}】を切ることで、最も高いアガリ確率を維持できます。ドラ（${context.doraMarkers.map(d => getTileNameJa(d)).join(', ')}）のくっつきも考慮しながら進行してください。`;
    }
  }

  // 2. 守備・安全牌・危険牌分析
  if (isDefenseQuestion) {
    // リーチしている他家を検出
    const riichiPlayers = context.opponents.filter(p => p.isRiichi);

    // 公開されている全ての牌（河 + 自分の手牌 + 副露 + ドラ表示牌）の枚数をカウント
    const visibleTileCounts: Record<string, number> = {};
    const recordTile = (t: Tile) => {
      const code = `${t.value}${t.suit[0]}`;
      visibleTileCounts[code] = (visibleTileCounts[code] || 0) + 1;
    };

    fullHand.forEach(recordTile);
    context.myDiscards.forEach(d => recordTile(d.tile));
    context.doraMarkers.forEach(recordTile);
    context.opponents.forEach(p => {
      p.discards.forEach(d => recordTile(d.tile));
      p.melds.forEach(m => m.tiles.forEach(recordTile));
    });

    // リーチ者がいる場合
    if (riichiPlayers.length > 0) {
      const targetOpponent = riichiPlayers[0];
      const genbutsuSet = new Set(targetOpponent.discards.map(d => `${d.tile.value}${d.tile.suit[0]}`));

      // 手牌の中で現物（100%安全）な牌
      const myGenbutsu = fullHand.filter(t => genbutsuSet.has(`${t.value}${t.suit[0]}`));
      // 手牌の中で字牌（比較的安全）
      const myHonors = fullHand.filter(t => t.suit === 'honor' && !genbutsuSet.has(`${t.value}${t.suit[0]}`));

      // リーチ者の捨て牌からスジを算出 (例: 4が切られていれば1と7がスジ)
      const sujiSafeCodes = new Set<string>();
      targetOpponent.discards.forEach(d => {
        if (d.tile.suit !== 'honor') {
          const v = d.tile.value;
          const s = d.tile.suit[0];
          if (v === 4) { sujiSafeCodes.add(`1${s}`); sujiSafeCodes.add(`7${s}`); }
          if (v === 5) { sujiSafeCodes.add(`2${s}`); sujiSafeCodes.add(`8${s}`); }
          if (v === 6) { sujiSafeCodes.add(`3${s}`); sujiSafeCodes.add(`9${s}`); }
          if (v === 1) { sujiSafeCodes.add(`4${s}`); }
          if (v === 2) { sujiSafeCodes.add(`5${s}`); }
          if (v === 3) { sujiSafeCodes.add(`6${s}`); }
          if (v === 7) { sujiSafeCodes.add(`4${s}`); }
          if (v === 8) { sujiSafeCodes.add(`5${s}`); }
          if (v === 9) { sujiSafeCodes.add(`6${s}`); }
        }
      });

      const mySujiTiles = fullHand.filter(t => sujiSafeCodes.has(`${t.value}${t.suit[0]}`) && !genbutsuSet.has(`${t.value}${t.suit[0]}`));

      // 危険な牌（無筋の4, 5, 6やドラ）
      const dangerousTiles = fullHand.filter(t => {
        const code = `${t.value}${t.suit[0]}`;
        const isDora = context.doraMarkers.some(d => isSameTileType(d, t)) || t.isRedDora;
        return (t.suit !== 'honor' && (t.value >= 4 && t.value <= 6) && !genbutsuSet.has(code) && !sujiSafeCodes.has(code)) || isDora;
      });

      return `【🛡️ AI牌読みコーチ：守備・危険度分析】

### ⚠️ 警戒対象：【${targetOpponent.name}】がリーチ中！ (第${targetOpponent.riichiTurn || '？'}巡目)

### 🟢 手牌にある安全牌（優先度順）
1. **現物 (完全安全 / 放銃率 0%)**:
   - ${myGenbutsu.length > 0 ? myGenbutsu.map(t => `【${getTileNameJa(t)}】`).join(', ') : '※手牌に現物はありません'}
2. **筋（スジ牌 / 両面待ち否定）**:
   - ${mySujiTiles.length > 0 ? mySujiTiles.map(t => `【${getTileNameJa(t)}】`).join(', ') : '※手牌に筋牌はありません'}
3. **字牌（生牌・単騎・シャンポン警戒）**:
   - ${myHonors.length > 0 ? myHonors.map(t => `【${getTileNameJa(t)}】(見え${visibleTileCounts[`${t.value}${t.suit[0]}`] || 0}枚)`).join(', ') : '※手牌に字牌はありません'}

### 🔴 手牌にある高危険牌（放銃リスク高）
- ${dangerousTiles.length > 0 ? dangerousTiles.map(t => `【${getTileNameJa(t)}】`).join(', ') : '特に危険な中央牌はありません'}

### 🎯 押し引き判断
現在の向聴数は **${shantenRes.shanten === 0 ? 'テンパイ' : `${shantenRes.shanten}向聴`}** です。${shantenRes.shanten <= 0 ? '勝負手であれば現物やスジを切りつつ攻め返す価値があります！' : '無理に押さず、現物や安全度の高い牌を切ってベタ降りを推奨します。'}`;
    }

    // リーチ者がいない場合の一般的な危険度分析
    return `【🛡️ AI牌読みコーチ：安全度・場況分析】

### 🔍 場の状況
現在、他家からのリーチ宣言はありません。巡目は第${context.currentTurn}巡目です。

### 📋 手牌の安全度評価
- **孤立字牌**: ${fullHand.filter(t => t.suit === 'honor').map(t => `【${getTileNameJa(t)}】`).join(', ') || 'なし'}
- **端牌 (1・9)**: ${fullHand.filter(t => t.suit !== 'honor' && (t.value === 1 || t.value === 9)).map(t => `【${getTileNameJa(t)}】`).join(', ') || 'なし'}
- **中張牌 (4・5・6)**: ${fullHand.filter(t => t.suit !== 'honor' && t.value >= 4 && t.value <= 6).map(t => `【${getTileNameJa(t)}】`).join(', ') || 'なし'}

### 🎯 進行方針
先制テンパイを目指して最速の手順（受け入れ最大）を進めましょう。`;
  }

  // 3. 点数・符計算・手牌価値分析
  if (isScoreQuestion) {
    const ukeire13 = fullHand.length === 13 ? calcUkeireFor13Tiles(fullHand) : null;

    return `【🧮 AI牌読みコーチ：打点・符計算解説】

### 📊 現在の手牌状況
- **向聴数**: **${shantenRes.shanten === 0 ? 'テンパイ (聴牌)' : `${shantenRes.shanten}向聴`}**
- **ドラ**: ${context.doraMarkers.map(d => `【${getTileNameJa(d)}】`).join(', ')}
${ukeire13 && ukeire13.currentShanten === 0 ? `- **待ち牌**: ${ukeire13.ukeireTiles.map(t => `【${t.tileCode}】(${t.remainingCount}枚)`).join(', ')} (計${ukeire13.totalUkeireCount}枚)` : ''}

### 💡 想定役と打点
1. **立直 (リーチ)**: 門前でテンパイすれば確定1翻。一発・裏ドラ・ツモによる打点アップが見込めます。
2. **ドラの活用**: 手牌内のドラ・赤ドラを活かすことで満貫（8,000点〜）級の高打点に成長します。

### 🔍 符計算のポイント
- 門前ツモなら2符加符、暗刻（特にヤオ九牌暗刻＝8符）や中張牌刻子（4符）、カンチャン/ペンチャン/単騎待ち（2符）によって符が30符〜40符〜50符へと上昇します。`;
  }

  // 一般的な局面分析
  const bestDiscards = fullHand.length === 14 ? calcUkeireForDiscards(fullHand) : [];
  const topChoice = bestDiscards[0];

  return `【🀄 AI牌読みコーチ：局面分析】

### 💡 局面サマリー
- **局**: ${context.roundWind === 'east' ? '東' : '南'}${context.roundNumber}局 (${context.honba}本場)
- **手番**: 第${context.currentTurn}巡目 / 自風: ${context.mySeatWind === 'east' ? '東' : context.mySeatWind === 'south' ? '南' : context.mySeatWind === 'west' ? '西' : '北'}家
- **現在の向聴数**: **${shantenRes.shanten === 0 ? 'テンパイ' : `${shantenRes.shanten}向聴`}**

${topChoice ? `### 🎯 推奨アクション
手牌の受け入れを最大化する【${getTileNameJa(topChoice.discardTile)}】の打牌がおすすめです（受け入れ${topChoice.totalUkeireCount}枚）。` : ''}

「何を切るべき？」「危険牌は？」などのクイックボタンを押すと、さらに詳細な牌読み分析をご覧いただけます！`;
}
