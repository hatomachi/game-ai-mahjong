import { describe, it, expect } from 'vitest';
import { checkWinningHand } from '../src/core/winning/winningHand';
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

describe('WinningHand (基本和了形判定)', () => {
  it('4面子1雀頭の和了形を判定できる', () => {
    const hand = makeHand([
      '1m', '2m', '3m',
      '4p', '5p', '6p',
      '7s', '8s', '9s',
      '1z', '1z', '1z',
      '2z', '2z',
    ]);
    const res = checkWinningHand(hand);
    expect(res.isWin).toBe(true);
    expect(res.winType).toBe('mentsu');
  });

  it('七対子の和了形を判定できる', () => {
    const hand = makeHand([
      '1m', '1m', '3m', '3m',
      '2p', '2p', '5p', '5p',
      '7s', '7s', '9s', '9s',
      '1z', '1z',
    ]);
    const res = checkWinningHand(hand);
    expect(res.isWin).toBe(true);
    expect(res.winType).toBe('chiitoitsu');
  });

  it('国士無双の和了形を判定できる', () => {
    const hand = makeHand([
      '1m', '9m', '1p', '9p', '1s', '9s',
      '1z', '2z', '3z', '4z', '5z', '6z', '7z',
      '7z',
    ]);
    const res = checkWinningHand(hand);
    expect(res.isWin).toBe(true);
    expect(res.winType).toBe('kokushi');
  });

  it('ノーテン手牌（14枚）は和了にならない', () => {
    const hand = makeHand([
      '1m', '2m', '4m',
      '4p', '5p', '7p',
      '7s', '8s', '1s',
      '1z', '2z', '3z',
      '5z', '6z',
    ]);
    const res = checkWinningHand(hand);
    expect(res.isWin).toBe(false);
  });
});
