import { describe, it, expect } from 'vitest';
import { decideCpuDiscard } from '../src/core/cpu/cpuPlayer';
import { Tile } from '../src/core/types/tile';

function makeHand(codes: string[]): Tile[] {
  return codes.map((code, idx) => {
    const val = parseInt(code[0], 10);
    const sChar = code[1];
    const suit = sChar === 'm' ? 'man' : sChar === 'p' ? 'pin' : sChar === 's' ? 'sou' : 'honor';
    return {
      id: `${code}_${idx}`,
      suit,
      value: val,
    };
  });
}

describe('CpuPlayer (簡易CPU打牌決定)', () => {
  it('テンパイとなる打牌（孤立牌）を選択する', () => {
    // 123m 456p 789s 11z 23m (13枚) + 7z (中) をツモ
    const hand = makeHand([
      '1m', '2m', '3m',
      '4p', '5p', '6p',
      '7s', '8s', '9s',
      '1z', '1z',
      '2m', '3m',
    ]);
    const drawnTile: Tile = { id: '7z_0', suit: 'honor', value: 7 };

    const decision = decideCpuDiscard(hand, drawnTile);
    expect(decision.discardTile.suit).toBe('honor');
    expect(decision.discardTile.value).toBe(7);
    expect(decision.isTsumogiri).toBe(true);
    expect(decision.shanten).toBe(0); // テンパイ
  });

  it('不要な字牌を手牌から切って手が進む', () => {
    // 123m 456p 789s 11z 2m 5z (13枚) + 3m をツモ
    const hand = makeHand([
      '1m', '2m', '3m',
      '4p', '5p', '6p',
      '7s', '8s', '9s',
      '1z', '1z',
      '2m',
      '5z', // 白 (孤立)
    ]);
    const drawnTile: Tile = { id: '3m_2', suit: 'man', value: 3 };

    const decision = decideCpuDiscard(hand, drawnTile);
    expect(decision.discardTile.suit).toBe('honor');
    expect(decision.discardTile.value).toBe(5); // 白を切る
    expect(decision.isTsumogiri).toBe(false);
    expect(decision.shanten).toBe(0); // テンパイ
  });
});
