import { describe, it, expect } from 'vitest';
import { calcShanten, calcChiitoitsuShanten } from '../src/core/shanten/shanten';
import { codeToIndex } from '../src/core/hand/hand';
import { Tile } from '../src/core/types/tile';

function makeHandFromCodes(codes: string[]): Tile[] {
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

function makeCountsFromCodes(codes: string[]): number[] {
  const counts = new Array(34).fill(0);
  for (const c of codes) {
    counts[codeToIndex(c)]++;
  }
  return counts;
}

describe('Shanten Calculator (シャンテン数計算)', () => {
  describe('面子手 (一般形)', () => {
    it('和了形（4面子1雀頭 14枚）はシャンテン数 -1', () => {
      // 123m 456p 789s 111z 55z (14枚)
      const hand = makeHandFromCodes([
        '1m', '2m', '3m',
        '4p', '5p', '6p',
        '7s', '8s', '9s',
        '1z', '1z', '1z',
        '5z', '5z',
      ]);
      const res = calcShanten(hand);
      expect(res.shanten).toBe(-1);
    });

    it('テンパイ形（3面子1雀頭1両面 13枚）はシャンテン数 0', () => {
      // 123m 456p 789s 11z 23m (待ち: 1m, 4m)
      const hand = makeHandFromCodes([
        '1m', '2m', '3m',
        '4p', '5p', '6p',
        '7s', '8s', '9s',
        '1z', '1z',
        '2m', '3m',
      ]);
      const res = calcShanten(hand);
      expect(res.shanten).toBe(0);
    });

    it('単騎待ちテンパイ形（4面子ノーヘッド 13枚）はシャンテン数 0', () => {
      // 123m 456m 789m 123p 1z (待ち: 1z)
      const hand = makeHandFromCodes([
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '1p', '2p', '3p',
        '1z',
      ]);
      const res = calcShanten(hand);
      expect(res.shanten).toBe(0);
    });

    it('一向聴（13枚）はシャンテン数 1', () => {
      // 123m 456p 78s 11z 23m 5z
      const hand = makeHandFromCodes([
        '1m', '2m', '3m',
        '4p', '5p', '6p',
        '7s', '8s',
        '1z', '1z',
        '2m', '3m',
        '5z',
      ]);
      const res = calcShanten(hand);
      expect(res.shanten).toBe(1);
    });
  });

  describe('七対子', () => {
    it('七対子和了（7対子 14枚）はシャンテン数 -1', () => {
      const hand = makeHandFromCodes([
        '1m', '1m', '3m', '3m',
        '2p', '2p', '5p', '5p',
        '7s', '7s', '9s', '9s',
        '1z', '1z',
      ]);
      const res = calcShanten(hand);
      expect(res.chiitoiShanten).toBe(-1);
      expect(res.shanten).toBe(-1);
      expect(res.isChiitoitsu).toBe(true);
    });

    it('七対子テンパイ（6対子 13枚）はシャンテン数 0', () => {
      const hand = makeHandFromCodes([
        '1m', '1m', '3m', '3m',
        '2p', '2p', '5p', '5p',
        '7s', '7s', '9s', '9s',
        '1z',
      ]);
      const res = calcShanten(hand);
      expect(res.chiitoiShanten).toBe(0);
      expect(res.shanten).toBe(0);
    });

    it('4枚持ちがあっても同一牌は1対子としてしか数えない', () => {
      const counts = makeCountsFromCodes([
        '1m', '1m', '1m', '1m',
        '2m', '2m', '3m', '3m',
        '4m', '4m', '5m', '5m',
        '1z',
      ]);
      const shanten = calcChiitoitsuShanten(counts);
      // 5種類しか対子がないのでテンパイではない (6 - 5 + max(0, 7-6) = 1 + 1 = 2)
      expect(shanten).toBe(2);
    });
  });

  describe('国士無双', () => {
    it('国士無双和了（13種+1対子 14枚）はシャンテン数 -1', () => {
      const hand = makeHandFromCodes([
        '1m', '9m', '1p', '9p', '1s', '9s',
        '1z', '2z', '3z', '4z', '5z', '6z', '7z',
        '1m',
      ]);
      const res = calcShanten(hand);
      expect(res.kokushiShanten).toBe(-1);
      expect(res.shanten).toBe(-1);
      expect(res.isKokushi).toBe(true);
    });

    it('国士無双テンパイ（13面待ち 13枚）はシャンテン数 0', () => {
      const hand = makeHandFromCodes([
        '1m', '9m', '1p', '9p', '1s', '9s',
        '1z', '2z', '3z', '4z', '5z', '6z', '7z',
      ]);
      const res = calcShanten(hand);
      expect(res.kokushiShanten).toBe(0);
      expect(res.shanten).toBe(0);
    });

    it('国士無双一向聴（12種+対子なし 13枚）はシャンテン数 1', () => {
      const hand = makeHandFromCodes([
        '1m', '9m', '1p', '9p', '1s', '9s',
        '1z', '2z', '3z', '4z', '5z', '6z',
        '2m', // 1種足りない
      ]);
      const res = calcShanten(hand);
      expect(res.kokushiShanten).toBe(1);
    });
  });
});
