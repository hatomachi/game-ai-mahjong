import { Tile } from '../types/tile';
import { PlayerState } from '../types/game';
import { calcUkeireFor13Tiles } from '../shanten/ukeire';

/**
 * プレイヤーのテンパイ待ち牌一覧を取得
 */
export function getWaitingTiles(playerHand: Tile[]): string[] {
  if (playerHand.length % 3 !== 1) {
    return [];
  }
  const ukeire = calcUkeireFor13Tiles(playerHand);
  if (ukeire.currentShanten !== 0) {
    return [];
  }
  return ukeire.ukeireTiles.map((t) => t.tileCode);
}

/**
 * プレイヤーがフリテン状態かどうかを判定する
 */
export function checkFuriten(
  player: PlayerState,
  _targetTile: Tile
): { isFuriten: boolean; reason?: 'river' | 'temporary' | 'riichi_miss' } {
  // 1. 待ち牌一覧を取得
  const waitingCodes = getWaitingTiles(player.hand);
  if (waitingCodes.length === 0) {
    return { isFuriten: false };
  }

  // 2. 自分の河に待ち牌のいずれかが存在するか（河フリテン）
  // 待ち牌のどれか1つでも自分の河にあれば、すべての待ち牌でロンできない
  for (const discard of player.discards) {
    const isWait = waitingCodes.some((code) => {
      const match = discard.tile.value + (discard.tile.suit === 'man' ? 'm' : discard.tile.suit === 'pin' ? 'p' : discard.tile.suit === 'sou' ? 's' : 'z');
      return code.startsWith(match);
    });
    if (isWait) {
      return { isFuriten: true, reason: 'river' };
    }
  }

  return { isFuriten: false };
}
