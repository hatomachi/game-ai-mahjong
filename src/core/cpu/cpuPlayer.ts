import { Tile } from '../types/tile';
import { calcUkeireForDiscards } from '../shanten/ukeire';

export interface CpuDecision {
  discardTile: Tile;
  isTsumogiri: boolean;
  shanten: number;
  totalUkeireCount: number;
}

/**
 * 簡易CPUの打牌選択ロジック
 * 1. シャンテン数が最小になる牌
 * 2. 受け入れ枚数が最大になる牌
 * 3. 受け入れが同じ場合、孤立した字牌(東南西北白發中) -> 1/9端牌 -> その他 の優先度で打牌
 */
export function decideCpuDiscard(
  hand: Tile[],
  drawnTile: Tile,
  visibleCounts?: number[]
): CpuDecision {
  const fullHand = [...hand, drawnTile];
  const candidates = calcUkeireForDiscards(fullHand, visibleCounts);

  if (candidates.length === 0) {
    // フォールバック: ツモ切り
    return {
      discardTile: drawnTile,
      isTsumogiri: true,
      shanten: 8,
      totalUkeireCount: 0,
    };
  }

  // 最良のシャンテン数と受け入れ枚数を取得
  const bestCandidate = candidates[0];
  const topCandidates = candidates.filter(
    (c) =>
      c.shantenAfterDiscard === bestCandidate.shantenAfterDiscard &&
      c.totalUkeireCount === bestCandidate.totalUkeireCount
  );

  // 同点候補の中から不要牌（字牌 > 1,9端牌 > その他）を優先
  const getDiscardWeight = (tile: Tile): number => {
    if (tile.suit === 'honor') return 100;
    if (tile.value === 1 || tile.value === 9) return 50;
    return 10 - Math.abs(5 - tile.value); // 5に近いほど危険・価値が高いのでウェイト低
  };

  let chosen = topCandidates[0];
  let maxWeight = -1;

  for (const cand of topCandidates) {
    const w = getDiscardWeight(cand.discardTile);
    if (w > maxWeight) {
      maxWeight = w;
      chosen = cand;
    }
  }

  const isTsumogiri = chosen.discardTile.id === drawnTile.id;

  return {
    discardTile: chosen.discardTile,
    isTsumogiri,
    shanten: chosen.shantenAfterDiscard,
    totalUkeireCount: chosen.totalUkeireCount,
  };
}
