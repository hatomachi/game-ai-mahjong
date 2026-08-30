import { describe, it, expect } from 'vitest';
import { decomposeHand } from '../src/core/scoring/handDecomposer';
import { Tile } from '../src/core/types/tile';

function parseTiles(str: string): Tile[] {
  const tiles: Tile[] = [];
  let currentNums: number[] = [];
  let idCounter = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch >= '1' && ch <= '9') {
      currentNums.push(parseInt(ch, 10));
    } else if (ch === 'm' || ch === 'p' || ch === 's' || ch === 'z') {
      const suit = ch === 'm' ? 'man' : ch === 'p' ? 'pin' : ch === 's' ? 'sou' : 'honor';
      for (const num of currentNums) {
        tiles.push({
          id: `${num}${ch}_${idCounter++}`,
          suit,
          value: num,
        });
      }
      currentNums = [];
    }
  }
  return tiles;
}

describe('handDecomposer', () => {
  it('14枚の門前一般形を正しく分解できる', () => {
    // 123m 456p 789s 111z 55z (白暗刻, 發雀頭)
    const tiles = parseTiles('123m456p789s555z66z');
    const result = decomposeHand(tiles, []);

    expect(result.length).toBeGreaterThan(0);
    const standard = result.find((r) => r.type === 'standard');
    expect(standard).toBeDefined();
    expect(standard?.head?.suit).toBe('honor');
    expect(standard?.head?.value).toBe(6);
    expect(standard?.melds.length).toBe(4);
  });

  it('七対子を正しく検出できる', () => {
    const tiles = parseTiles('11m99m11p99p11s99s77z');
    const result = decomposeHand(tiles, []);

    const chiitoi = result.find((r) => r.type === 'chiitoitsu');
    expect(chiitoi).toBeDefined();
  });

  it('国士無双を正しく検出できる', () => {
    const tiles = parseTiles('19m19p19s1234567z1m');
    const result = decomposeHand(tiles, []);

    const kokushi = result.find((r) => r.type === 'kokushi');
    expect(kokushi).toBeDefined();
    expect(kokushi?.head?.value).toBe(1);
  });

  it('副露（ポン・チー）がある手牌を正しく分解できる', () => {
    // 門前手牌: 123m 456p 55z (8枚) + ポン: 777s + チー: 789p
    const handTiles = parseTiles('123m456p55z');
    const melds = [
      {
        type: 'pon' as const,
        tiles: parseTiles('777s'),
        fromPlayerIndex: 1,
        calledTile: { id: '7s_call', suit: 'sou' as const, value: 7 },
      },
      {
        type: 'chi' as const,
        tiles: parseTiles('789p'),
        fromPlayerIndex: 3,
        calledTile: { id: '7p_call', suit: 'pin' as const, value: 7 },
      },
    ];

    const result = decomposeHand(handTiles, melds);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].melds.length).toBe(4);
    expect(result[0].head?.value).toBe(5);
  });
});
