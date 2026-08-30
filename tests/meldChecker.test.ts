import { describe, it, expect } from 'vitest';
import { checkDiscardsMelds, checkTurnMelds } from '../src/core/meld/meldChecker';
import { PlayerState } from '../src/core/types/game';
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

function createDummyPlayer(handTiles: Tile[], melds = []): PlayerState {
  return {
    id: 'p0',
    name: 'test',
    isHuman: true,
    seatWind: 'east',
    score: 25000,
    hand: handTiles,
    drawnTile: null,
    discards: [],
    melds,
    isRiichi: false,
  };
}

describe('meldChecker', () => {
  it('上家からの打牌に対してチー・ポンを検出できる', () => {
    // 手牌: 2m, 3m, 7s, 7s
    const player = createDummyPlayer(parseTiles('23m77s'));
    const targetTile: Tile = { id: '4m_0', suit: 'man', value: 4 };

    // myIndex: 0, fromPlayerIndex: 3 (上家)
    const melds = checkDiscardsMelds(player, targetTile, 3, 0);
    expect(melds.canChi).toBe(true);
    expect(melds.chiOptions.length).toBe(1);
    expect(melds.chiOptions[0].tiles.map((t) => t.value)).toEqual([2, 3]);
    expect(melds.canPon).toBe(false);
  });

  it('対面からの打牌に対してポンのみ可能でチーは不可', () => {
    const player = createDummyPlayer(parseTiles('23m77s'));
    const targetTile: Tile = { id: '7s_0', suit: 'sou', value: 7 };

    // myIndex: 0, fromPlayerIndex: 2 (対面)
    const melds = checkDiscardsMelds(player, targetTile, 2, 0);
    expect(melds.canChi).toBe(false);
    expect(melds.canPon).toBe(true);
  });

  it('暗槓と加槓を検出できる', () => {
    // 手牌に 8s が 4枚
    const hand = parseTiles('123m888s');
    const player = createDummyPlayer(hand);
    player.drawnTile = { id: '8s_3', suit: 'sou', value: 8 };

    const turnMelds = checkTurnMelds(player);
    expect(turnMelds.canAnkan).toBe(true);
    expect(turnMelds.ankanOptions.length).toBe(1);
  });
});
