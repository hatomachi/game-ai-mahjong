import { Tile } from '../types/tile';
import { calcShanten } from '../shanten/shanten';

export interface WinCheckResult {
  isWin: boolean;
  winType?: 'mentsu' | 'chiitoitsu' | 'kokushi';
}

/**
 * 14枚手牌（または13枚+アガリ牌）が和了形を満たしているかを判定
 */
export function checkWinningHand(tiles: Tile[]): WinCheckResult {
  if (tiles.length !== 14) {
    return { isWin: false };
  }

  const result = calcShanten(tiles);
  if (result.shanten !== -1) {
    return { isWin: false };
  }

  let winType: 'mentsu' | 'chiitoitsu' | 'kokushi' = 'mentsu';
  if (result.kokushiShanten === -1) {
    winType = 'kokushi';
  } else if (result.chiitoiShanten === -1) {
    winType = 'chiitoitsu';
  }

  return {
    isWin: true,
    winType,
  };
}
