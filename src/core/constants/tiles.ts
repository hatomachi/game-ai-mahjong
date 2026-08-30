import { Tile, TileSuit } from '../types/tile';

export const SUIT_NAMES: Record<TileSuit, string> = {
  man: '萬子',
  pin: '筒子',
  sou: '索子',
  honor: '字牌',
};

export const HONOR_NAMES: Record<number, string> = {
  1: '東',
  2: '南',
  3: '西',
  4: '北',
  5: '白',
  6: '發',
  7: '中',
};

export const NUMBER_KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/**
 * 136枚の麻雀牌一式を生成する
 */
export function createStandardTiles(): Tile[] {
  const tiles: Tile[] = [];

  const suits: ('man' | 'pin' | 'sou')[] = ['man', 'pin', 'sou'];

  for (const suit of suits) {
    for (let val = 1; val <= 9; val++) {
      for (let copy = 0; copy < 4; copy++) {
        const isRed = val === 5 && copy === 0;
        tiles.push({
          id: `${val}${suit[0]}_${copy}${isRed ? '_red' : ''}`,
          suit,
          value: val,
          isRedDora: isRed,
        });
      }
    }
  }

  // 字牌 (東南西北白發中 = 1..7)
  for (let val = 1; val <= 7; val++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({
        id: `${val}z_${copy}`,
        suit: 'honor',
        value: val,
      });
    }
  }

  return tiles;
}
