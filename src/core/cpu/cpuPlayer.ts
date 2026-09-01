import { Tile } from '../types/tile';
import { calcUkeireForDiscards } from '../shanten/ukeire';
import { PlayerState } from '../types/game';
import { PendingAction } from '../types/game';

export interface CpuDecision {
  discardTile: Tile;
  isTsumogiri: boolean;
  shanten: number;
  totalUkeireCount: number;
  declareRiichi?: boolean;
}

/**
 * 簡易CPUの打牌選択ロジック
 * PlayerState または (hand, drawnTile) の両方に対応
 * ポン・チー直後（drawnTile: null で hand が 3n+2 枚）の場合も正常に手牌から打牌
 */
export function decideCpuDiscard(
  playerOrHand: PlayerState | Tile[],
  drawnTileOrVisible?: Tile | number[],
  visibleCounts?: number[]
): CpuDecision {
  let hand: Tile[];
  let drawnTile: Tile | null = null;
  let isRiichi = false;
  let score = 25000;
  let isMenzen = true;
  let actualVisible: number[] | undefined = undefined;

  if (Array.isArray(playerOrHand)) {
    hand = playerOrHand;
    drawnTile = (drawnTileOrVisible as Tile) || null;
    actualVisible = visibleCounts;
  } else {
    const player = playerOrHand;
    hand = player.hand;
    drawnTile = player.drawnTile;
    isRiichi = player.isRiichi;
    score = player.score;
    isMenzen = player.melds.every((m) => m.type === 'ankan');
    actualVisible = Array.isArray(drawnTileOrVisible) ? drawnTileOrVisible : undefined;
  }

  // リーチ中の場合は即ツモ切り (ツモ牌がある場合)
  if (isRiichi && drawnTile) {
    return {
      discardTile: drawnTile,
      isTsumogiri: true,
      shanten: 0,
      totalUkeireCount: 0,
      declareRiichi: false,
    };
  }

  const fullHand = drawnTile ? [...hand, drawnTile] : [...hand];
  if (fullHand.length === 0) {
    throw new Error('CPU has no tiles to discard');
  }

  const candidates = calcUkeireForDiscards(fullHand, actualVisible);

  if (candidates.length === 0) {
    const fallbackTile = drawnTile || fullHand[fullHand.length - 1];
    return {
      discardTile: fallbackTile,
      isTsumogiri: drawnTile ? fallbackTile.id === drawnTile.id : false,
      shanten: 8,
      totalUkeireCount: 0,
      declareRiichi: false,
    };
  }

  const bestCandidate = candidates[0];
  const topCandidates = candidates.filter(
    (c) =>
      c.shantenAfterDiscard === bestCandidate.shantenAfterDiscard &&
      c.totalUkeireCount === bestCandidate.totalUkeireCount
  );

  const getDiscardWeight = (tile: Tile): number => {
    if (tile.suit === 'honor') return 100;
    if (tile.value === 1 || tile.value === 9) return 50;
    return 10 - Math.abs(5 - tile.value);
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

  const isTsumogiri = drawnTile ? chosen.discardTile.id === drawnTile.id : false;

  // リーチ判定: 門前かつシャンテン数0（テンパイ）かつ持ち点1000以上かつツモ番時
  const canRiichi = isMenzen && !isRiichi && chosen.shantenAfterDiscard === 0 && score >= 1000 && drawnTile !== null;

  return {
    discardTile: chosen.discardTile,
    isTsumogiri,
    shanten: chosen.shantenAfterDiscard,
    totalUkeireCount: chosen.totalUkeireCount,
    declareRiichi: canRiichi,
  };
}

/**
 * CPUが他家の打牌に対して鳴き/ロンするかを判断
 */
export function decideCpuAction(action: PendingAction): 'ron' | 'pon' | 'chi' | 'pass' {
  // ロン可能なら必ずロン
  if (action.canRon && action.ronScoreResult) {
    return 'ron';
  }

  // 役牌のポン
  if (action.availableMelds.canPon) {
    const target = action.availableMelds.ponOption?.targetTile;
    if (target && target.suit === 'honor' && target.value >= 5) {
      return 'pon';
    }
  }

  return 'pass';
}
