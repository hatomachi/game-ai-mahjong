import { describe, it, expect } from 'vitest';
import {
  createStandardTiles,
  getTileNameJa,
  getTileCode,
  sortTiles,
  isSameTileType,
  getDoraTileFromMarker,
  getTileSvgPath,
} from '../src/core/utils/tileUtils';
import { Tile } from '../src/core/types/tile';

describe('tileUtils', () => {
  it('136枚の麻雀牌を生成できる（赤ドラ3枚含む）', () => {
    const tiles = createStandardTiles();
    expect(tiles.length).toBe(136);

    const redDoras = tiles.filter(t => t.isRedDora);
    expect(redDoras.length).toBe(3);
  });

  it('日本語表記とコード変換が正確である', () => {
    const man1: Tile = { id: '1m_0', suit: 'man', value: 1 };
    expect(getTileNameJa(man1)).toBe('一萬');
    expect(getTileCode(man1)).toBe('1m');

    const red5p: Tile = { id: '5p_0_red', suit: 'pin', value: 5, isRedDora: true };
    expect(getTileNameJa(red5p)).toBe('赤五筒');
    expect(getTileCode(red5p)).toBe('5pr');

    const chun: Tile = { id: '7z_0', suit: 'honor', value: 7 };
    expect(getTileNameJa(chun)).toBe('中');
    expect(getTileCode(chun)).toBe('7z');
  });

  it('手牌の理牌（ソート）が正しく萬子->筒子->索子->字牌の順になる', () => {
    const hand: Tile[] = [
      { id: '1z_0', suit: 'honor', value: 1 },
      { id: '9s_0', suit: 'sou', value: 9 },
      { id: '1m_0', suit: 'man', value: 1 },
      { id: '5p_0', suit: 'pin', value: 5 },
    ];
    const sorted = sortTiles(hand);
    expect(sorted.map(t => t.id)).toEqual(['1m_0', '5p_0', '9s_0', '1z_0']);
  });

  it('同一牌種の判定が正確である', () => {
    const a: Tile = { id: '1m_0', suit: 'man', value: 1 };
    const b: Tile = { id: '1m_1', suit: 'man', value: 1 };
    const c: Tile = { id: '2m_0', suit: 'man', value: 2 };
    expect(isSameTileType(a, b)).toBe(true);
    expect(isSameTileType(a, c)).toBe(false);
  });

  it('ドラ表示牌からのネクストドラ算出が正確である', () => {
    expect(getDoraTileFromMarker({ id: '9m', suit: 'man', value: 9 })).toEqual({
      suit: 'man',
      value: 1,
    });
    expect(getDoraTileFromMarker({ id: '4z', suit: 'honor', value: 4 })).toEqual({
      suit: 'honor',
      value: 1,
    });
    expect(getDoraTileFromMarker({ id: '7z', suit: 'honor', value: 7 })).toEqual({
      suit: 'honor',
      value: 5,
    });
  });

  it('合成済み牌画像パスの取得が正確である（白牌立体背景合成済み・軽量PNG）', () => {
    // 萬子・筒子・索子
    expect(getTileSvgPath({ id: '1m_0', suit: 'man', value: 1 })).toBe('/tiles/Man1.png');
    expect(getTileSvgPath({ id: '9p_0', suit: 'pin', value: 9 })).toBe('/tiles/Pin9.png');
    expect(getTileSvgPath({ id: '1s_0', suit: 'sou', value: 1 })).toBe('/tiles/Sou1.png');

    // 赤ドラ
    expect(getTileSvgPath({ id: '5m_red', suit: 'man', value: 5, isRedDora: true })).toBe('/tiles/Man5-Dora.png');
    expect(getTileSvgPath({ id: '5p_red', suit: 'pin', value: 5, isRedDora: true })).toBe('/tiles/Pin5-Dora.png');
    expect(getTileSvgPath({ id: '5s_red', suit: 'sou', value: 5, isRedDora: true })).toBe('/tiles/Sou5-Dora.png');

    // 字牌
    expect(getTileSvgPath({ id: '1z_0', suit: 'honor', value: 1 })).toBe('/tiles/Ton.png');
    expect(getTileSvgPath({ id: '2z_0', suit: 'honor', value: 2 })).toBe('/tiles/Nan.png');
    expect(getTileSvgPath({ id: '3z_0', suit: 'honor', value: 3 })).toBe('/tiles/Shaa.png');
    expect(getTileSvgPath({ id: '4z_0', suit: 'honor', value: 4 })).toBe('/tiles/Pei.png');
    expect(getTileSvgPath({ id: '5z_0', suit: 'honor', value: 5 })).toBe('/tiles/Haku.png');
    expect(getTileSvgPath({ id: '6z_0', suit: 'honor', value: 6 })).toBe('/tiles/Hatsu.png');
    expect(getTileSvgPath({ id: '7z_0', suit: 'honor', value: 7 })).toBe('/tiles/Chun.png');

    // 裏面
    expect(getTileSvgPath(undefined, true)).toBe('/tiles/Back.png');
  });
});

