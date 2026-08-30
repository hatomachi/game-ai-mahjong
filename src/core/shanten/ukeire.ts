import { Tile } from '../types/tile';
import { UkeireItem, DiscardAnalysis } from '../types/shanten';
import { tilesToCountArray, indexToCode, indexToTileInfo } from '../hand/hand';
import { calcShanten } from './shanten';

/**
 * 13枚の手牌に対する有効牌（ツモるとシャンテン数が下がる牌）とその残り枚数を計算
 */
export function calcUkeireFor13Tiles(
  hand: Tile[],
  visibleCounts?: number[]
): { ukeireTiles: UkeireItem[]; totalUkeireCount: number; currentShanten: number } {
  const counts = tilesToCountArray(hand);
  const currentShanten = calcShanten(counts).shanten;

  // 既に和了（アガリ形）の場合は受け入れなし
  if (currentShanten === -1) {
    return { ukeireTiles: [], totalUkeireCount: 0, currentShanten: -1 };
  }

  const ukeireTiles: UkeireItem[] = [];
  let totalUkeireCount = 0;

  // 34種すべての牌を1枚引いたと仮定
  for (let i = 0; i < 34; i++) {
    // 既に手牌に4枚ある牌はツモれない
    if (counts[i] >= 4) continue;

    counts[i]++;
    
    let canImprove = false;

    if (currentShanten === 0) {
      // テンパイの場合: 14枚手牌そのものが和了形(shanten === -1)になれば受け入れ牌
      if (calcShanten(counts).shanten === -1) {
        canImprove = true;
      }
    } else {
      // 1向聴以上の場合: 14枚から1枚切った13枚手牌のシャンテン数が currentShanten - 1 になれば改善
      for (let j = 0; j < 34; j++) {
        if (counts[j] > 0) {
          counts[j]--;
          const nextShanten = calcShanten(counts).shanten;
          if (nextShanten < currentShanten) {
            canImprove = true;
            counts[j]++;
            break;
          }
          counts[j]++;
        }
      }
    }

    counts[i]--; // 戻す


    if (canImprove) {
      const tileInfo = indexToTileInfo(i);
      const code = indexToCode(i);
      // 残り枚数の算出 (手牌での使用枚数 + visibleCounts)
      const handUsed = counts[i];
      const otherVisible = visibleCounts ? visibleCounts[i] : handUsed;
      const effectiveVisible = Math.max(handUsed, otherVisible);
      const remainingCount = Math.max(0, 4 - effectiveVisible);

      ukeireTiles.push({
        tileCode: code,
        suit: tileInfo.suit,
        value: tileInfo.value,
        remainingCount,
      });

      totalUkeireCount += remainingCount;
    }
  }

  return { ukeireTiles, totalUkeireCount, currentShanten };
}

/**
 * 14枚の手牌について、各打牌候補の「シャンテン数」「受け入れ枚数」「有効牌」を一覧評価（何切る分析）
 */
export function calcUkeireForDiscards(
  hand14: Tile[],
  visibleCounts?: number[]
): DiscardAnalysis[] {
  const results: DiscardAnalysis[] = [];
  const checkedTileCodes = new Set<string>();

  for (let i = 0; i < hand14.length; i++) {
    const discardTile = hand14[i];
    const key = `${discardTile.suit}_${discardTile.value}_${discardTile.isRedDora ? 'red' : ''}`;
    if (checkedTileCodes.has(key)) {
      continue;
    }
    checkedTileCodes.add(key);

    // discardTile を除いた 13枚の手牌を作成
    const hand13 = hand14.filter((_, idx) => idx !== i);
    const { ukeireTiles, totalUkeireCount, currentShanten } = calcUkeireFor13Tiles(hand13, visibleCounts);

    results.push({
      discardTile,
      shantenAfterDiscard: currentShanten,
      totalUkeireCount,
      ukeireTiles,
    });
  }

  // シャンテン数が小さく、受け入れ枚数が多い順にソート
  results.sort((a, b) => {
    if (a.shantenAfterDiscard !== b.shantenAfterDiscard) {
      return a.shantenAfterDiscard - b.shantenAfterDiscard;
    }
    return b.totalUkeireCount - a.totalUkeireCount;
  });

  return results;
}
