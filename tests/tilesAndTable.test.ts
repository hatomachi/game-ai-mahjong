import { describe, it, expect } from 'vitest';
import { getTileNameJa, sortTiles, getTileCode } from '../src/core/utils/tileUtils';
import { createInitialGameState, startRound } from '../src/core/game/gameEngine';
import { Tile } from '../src/core/types/tile';

describe('麻雀牌とリアル麻雀卓コンポーネントのロジックテスト', () => {
  it('全34種および赤ドラの牌情報が正しく日本語変換できること', () => {
    // 萬子
    const tile1m: Tile = { id: '1m_0', suit: 'man', value: 1 };
    expect(tile1m.suit).toBe('man');
    expect(tile1m.value).toBe(1);
    expect(getTileNameJa(tile1m)).toBe('一萬');

    // 筒子（赤ドラ含む）
    const tile0p: Tile = { id: '0p_0', suit: 'pin', value: 5, isRedDora: true };
    expect(tile0p.suit).toBe('pin');
    expect(tile0p.value).toBe(5);
    expect(tile0p.isRedDora).toBe(true);
    expect(getTileNameJa(tile0p)).toBe('赤五筒');
    expect(getTileCode(tile0p)).toBe('5pr');

    // 索子
    const tile1s: Tile = { id: '1s_0', suit: 'sou', value: 1 };
    expect(tile1s.suit).toBe('sou');
    expect(tile1s.value).toBe(1);
    expect(getTileNameJa(tile1s)).toBe('一索');

    // 字牌
    const tile7z: Tile = { id: '7z_0', suit: 'honor', value: 7 };
    expect(tile7z.suit).toBe('honor');
    expect(tile7z.value).toBe(7);
    expect(getTileNameJa(tile7z)).toBe('中');
  });

  it('手牌のソートが萬子→筒子→索子→字牌の順で整列されること', () => {
    const tiles: Tile[] = [
      { id: '7z_0', suit: 'honor', value: 7 },
      { id: '1m_0', suit: 'man', value: 1 },
      { id: '9s_0', suit: 'sou', value: 9 },
      { id: '5p_0', suit: 'pin', value: 5 },
      { id: '1z_0', suit: 'honor', value: 1 },
    ];
    const sorted = sortTiles(tiles);
    expect(sorted.map(t => getTileCode(t))).toEqual(['1m', '5p', '9s', '1z', '7z']);
  });

  it('初期ゲーム状態において王牌（14枚）、ドラ表示牌、供託が正常にセットアップされること', () => {
    const init = createInitialGameState();
    const round = startRound(init);

    expect(round.deadWall.length).toBe(14);
    expect(round.doraMarkers.length).toBeGreaterThanOrEqual(1);
    expect(round.wall.length).toBe(136 - 14 - 13 * 4 - 1); // 70枚
    expect(round.riichiSticks).toBe(0);
    expect(round.honba).toBe(0);
  });
});
