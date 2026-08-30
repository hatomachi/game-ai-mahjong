import { describe, it, expect } from 'vitest';
import { calculateWinningScore } from '../src/core/scoring/scoreCalculator';
import { Tile } from '../src/core/types/tile';
import { WinContext } from '../src/core/scoring/types';

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

describe('yakuEvaluator & scoreCalculator', () => {
  it('リーチ・ピンフ・ツモ（門前 3翻20符）を正しく計算できる', () => {
    // 234m 567m 234p 678s 99s (9sツモ) -> 両面待ち
    const hand = parseTiles('234m567m234p678s99s');
    // 実際には 67s に対して 8s または 5s 待ち
    const context: WinContext = {
      isTsumo: true,
      isRiichi: true,
      roundWind: 'east',
      playerWind: 'south',
      doraMarkers: [{ id: 'd1', suit: 'man', value: 9 }], // ドラ 1m
      winningTile: { id: '8s_w', suit: 'sou', value: 8 },
    };

    const res = calculateWinningScore(hand, [], context, 0, 0, 1, -1);
    expect(res).toBeDefined();
    expect(res?.han).toBe(3); // リーチ, 門前ツモ, 平和
    expect(res?.fu).toBe(20);
    expect(res?.yakuList.map((y) => y.name)).toContain('pinfu');
    expect(res?.yakuList.map((y) => y.name)).toContain('riichi');
    expect(res?.yakuList.map((y) => y.name)).toContain('tsumo');
    // 子の3翻20符ツモ: 親 1300, 子 700 (計 2700点)
    expect(res?.payment.dealerPay).toBe(1300);
    expect(res?.payment.nonDealerPay).toBe(700);
  });

  it('タンヤオ・赤ドラ1（鳴き 2翻30符）のロン和了を計算できる', () => {
    // 234m 345p 55s (8枚) + チー 678p + ポン 222s
    const hand = parseTiles('234m345p55s');
    hand[1].isRedDora = true; // 赤5p
    const melds = [
      {
        type: 'chi' as const,
        tiles: parseTiles('678p'),
        fromPlayerIndex: 3,
        calledTile: { id: '6p', suit: 'pin' as const, value: 6 },
      },
      {
        type: 'pon' as const,
        tiles: parseTiles('222s'),
        fromPlayerIndex: 2,
        calledTile: { id: '2s', suit: 'sou' as const, value: 2 },
      },
    ];

    const context: WinContext = {
      isTsumo: false,
      isRiichi: false,
      roundWind: 'east',
      playerWind: 'south',
      doraMarkers: [{ id: 'd1', suit: 'honor', value: 1 }],
      winningTile: { id: '5s_w', suit: 'sou', value: 5 },
    };

    const res = calculateWinningScore(hand, melds, context, 0, 0, 1, 2);
    expect(res).toBeDefined();
    expect(res?.han).toBe(2); // タンヤオ 1 + 赤ドラ 1
    expect(res?.fu).toBe(30);
    expect(res?.payment.ronPay).toBe(2000);
  });

  it('清一色 (チンイツ・門前 6翻跳満) を正しく計算できる', () => {
    // 123m 456m 789m 234m 88m (14枚清一色)
    const hand = parseTiles('123m456m789m234m88m');
    const context: WinContext = {
      isTsumo: true,
      isRiichi: false,
      roundWind: 'east',
      playerWind: 'east', // 親
      doraMarkers: [{ id: 'd1', suit: 'honor', value: 1 }],
      winningTile: { id: '8m_w', suit: 'man', value: 8 },
    };

    const res = calculateWinningScore(hand, [], context, 0, 0, 0, -1);
    expect(res).toBeDefined();
    // 親の門前清一色ツモ: チンイツ(6) + ツモ(1) + 一盃口(1) = 8翻 (倍満) または 7翻 (跳満)
    expect(res?.han).toBeGreaterThanOrEqual(7);
    expect(res?.yakuList.map((y) => y.name)).toContain('chinitsu');
    expect(res?.yakuList.map((y) => y.name)).toContain('tsumo');
  });

  it('国士無双 (役満 32000点) を正しく計算できる', () => {
    const hand = parseTiles('19m19p19s1234567z1m');
    const context: WinContext = {
      isTsumo: false,
      isRiichi: false,
      roundWind: 'east',
      playerWind: 'south', // 子
      doraMarkers: [],
      winningTile: { id: '9p_w', suit: 'pin', value: 9 },
    };

    const res = calculateWinningScore(hand, [], context, 0, 0, 1, 0);
    expect(res).toBeDefined();
    expect(res?.isYakuman).toBe(true);
    expect(res?.title).toBe('役満');
    expect(res?.payment.ronPay).toBe(32000);
  });

  it('大三元 (役満 48000点 親) を正しく計算できる', () => {
    // 123m 555z 666z 777z 99p (白發中刻子)
    const hand = parseTiles('123m555z666z777z99p');
    const context: WinContext = {
      isTsumo: false,
      isRiichi: false,
      roundWind: 'east',
      playerWind: 'east', // 親
      doraMarkers: [],
      winningTile: { id: '9p_w', suit: 'pin', value: 9 },
    };

    const res = calculateWinningScore(hand, [], context, 0, 0, 0, 1);
    expect(res).toBeDefined();
    expect(res?.isYakuman).toBe(true);
    expect(res?.payment.ronPay).toBe(48000);
  });
});
