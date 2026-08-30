import { describe, it, expect } from 'vitest';
import { setupRoundWall, drawTileFromWall, shuffleTiles } from '../src/core/wall/wall';
import { createStandardTiles } from '../src/core/constants/tiles';

describe('Wall (牌山・配牌・ツモ)', () => {
  it('136枚の標準牌を生成できる', () => {
    const tiles = createStandardTiles();
    expect(tiles).toHaveLength(136);

    // 赤ドラが萬筒索に各1枚含まれるか (5mr, 5pr, 5sr)
    const redTiles = tiles.filter((t) => t.isRedDora);
    expect(redTiles).toHaveLength(3);
  });

  it('牌山をシャッフルできる', () => {
    const original = createStandardTiles();
    const shuffled = shuffleTiles(original);
    expect(shuffled).toHaveLength(136);
    // 完全に同じ並び順ではないことを確認
    const sameOrder = original.every((t, i) => t.id === shuffled[i].id);
    expect(sameOrder).toBe(false);
  });

  it('局の牌山セットアップで王牌14枚・ドラ表示牌・4人の配牌13枚・残り山70枚が正しく構成される', () => {
    const setup = setupRoundWall();

    expect(setup.deadWall).toHaveLength(14);
    expect(setup.doraMarkers).toHaveLength(1);
    expect(setup.uraDoraMarkers).toHaveLength(1);
    expect(setup.hands).toHaveLength(4);

    setup.hands.forEach((hand) => {
      expect(hand).toHaveLength(13);
    });

    expect(setup.wall).toHaveLength(70); // 136 - 14 - (13 * 4) = 70
  });

  it('牌山からツモることができる', () => {
    const setup = setupRoundWall();
    const initialWallLength = setup.wall.length;

    const { drawnTile, remainingWall } = drawTileFromWall(setup.wall);
    expect(drawnTile).not.toBeNull();
    expect(remainingWall).toHaveLength(initialWallLength - 1);
  });
});
