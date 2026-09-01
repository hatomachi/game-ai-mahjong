import { describe, it, expect } from 'vitest';
import { calcUkeireFor13Tiles, calcUkeireForDiscards } from '../src/core/shanten/ukeire';
import { Tile } from '../src/core/types/tile';

function makeHand(codes: string[]): Tile[] {
  return codes.map((code, idx) => {
    const val = parseInt(code[0], 10);
    const sChar = code[1];
    const suit = sChar === 'm' ? 'man' : sChar === 'p' ? 'pin' : sChar === 's' ? 'sou' : 'honor';
    const isRed = code.includes('r');
    return {
      id: `${code}_${idx}`,
      suit,
      value: val,
      isRedDora: isRed,
    };
  });
}

describe('Ukeire (有効牌・受け入れ計算)', () => {
  it('テンパイ形（両面待ち）の受け入れ牌が正確に検出される', () => {
    // 123m 456p 789s 11z 23m (13枚) -> 待ち牌は 1m, 4m
    const hand = makeHand([
      '1m', '2m', '3m',
      '4p', '5p', '6p',
      '7s', '8s', '9s',
      '1z', '1z',
      '2m', '3m',
    ]);

    const res = calcUkeireFor13Tiles(hand);
    expect(res.currentShanten).toBe(0); // テンパイ
    const codes = res.ukeireTiles.map((t) => t.tileCode);
    expect(codes).toContain('1m');
    expect(codes).toContain('4m');

    // 1m は手牌に1枚あるので残り3枚、4m は手牌に0枚なので残り4枚 -> 合計7枚
    expect(res.totalUkeireCount).toBe(7);
  });

  it('14枚手牌の何切る分析で受け入れ最大打牌がトップにソートされる', () => {
    // 123m 456p 789s 11z 23m + 7z (14枚)
    // 7z を切れば 1m/4m の両面テンパイ (受け入れ7枚) になる
    const hand14 = makeHand([
      '1m', '2m', '3m',
      '4p', '5p', '6p',
      '7s', '8s', '9s',
      '1z', '1z',
      '2m', '3m',
      '7z', // 中
    ]);

    const discards = calcUkeireForDiscards(hand14);
    expect(discards.length).toBeGreaterThan(0);
    const top = discards[0];
    expect(top.discardTile.suit).toBe('honor');
    expect(top.discardTile.value).toBe(7);
    expect(top.shantenAfterDiscard).toBe(0);
    expect(top.totalUkeireCount).toBe(7);
  });
});
