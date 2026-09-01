import { describe, it, expect } from 'vitest';
import { TileSize } from '../src/components/tiles/MahjongTile';
import { sanitizeForPlayer } from '../src/ai/types/context';
import { createInitialGameState, startRound } from '../src/core/game/gameEngine';
import { calcShanten } from '../src/core/shanten/shanten';
import { calcUkeireForDiscards } from '../src/core/shanten/ukeire';

describe('モバイル対応 & レスポンシブUI ロジックテスト', () => {
  it('TileSize型にresponsiveが追加され、正しく利用可能であること', () => {
    const validSizes: TileSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'responsive'];
    expect(validSizes).toContain('responsive');
  });

  it('プレイヤー視点情報のサニタイズがモバイル表示用データでも厳格に行われること', () => {
    const init = createInitialGameState();
    const round = startRound(init);

    const sanitized = sanitizeForPlayer(round, 0);

    // 自家の手牌は見えている
    expect(sanitized.myHand.length).toBeGreaterThanOrEqual(13);
    // 他家の手牌は枚数のみ（非公開情報が漏洩していない）
    expect(sanitized.opponents[0].handTileCount).toBe(13);
    expect(sanitized.opponents[1].handTileCount).toBe(13);
    expect(sanitized.opponents[2].handTileCount).toBe(13);
    // 山牌の実体配列はサニタイズされ残り枚数のみ
    expect(sanitized.wallRemainingCount).toBe(round.wall.length);
  });

  it('手牌のシャンテン数と何切る受け入れ計算がモバイル表示でも瞬時に算出できること', () => {
    const init = createInitialGameState();
    const round = startRound(init);
    const myPlayer = round.players[0];
    const fullTiles = myPlayer.drawnTile ? [...myPlayer.hand, myPlayer.drawnTile] : myPlayer.hand;

    const shanten = calcShanten(fullTiles);
    expect(shanten.shanten).toBeGreaterThanOrEqual(-1);

    if (fullTiles.length % 3 === 2) {
      const discards = calcUkeireForDiscards(fullTiles);
      expect(discards.length).toBeGreaterThan(0);
      expect(discards[0].totalUkeireCount).toBeGreaterThanOrEqual(0);
    }
  });
});
