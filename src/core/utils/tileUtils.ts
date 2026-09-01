import { Tile } from '../types/tile';
import { HONOR_NAMES, NUMBER_KANJI } from '../constants/tiles';

/**
 * 牌を日本語表記文字列に変換（例: "一萬", "赤五筒", "東", "中"）
 */
export function getTileNameJa(tile: Tile): string {
  if (tile.suit === 'honor') {
    return HONOR_NAMES[tile.value] || `字牌${tile.value}`;
  }
  const prefix = tile.isRedDora ? '赤' : '';
  const num = NUMBER_KANJI[tile.value] || String(tile.value);
  const suitJa = tile.suit === 'man' ? '萬' : tile.suit === 'pin' ? '筒' : '索';
  return `${prefix}${num}${suitJa}`;
}

/**
 * 牌を英数字表記（MSPZ表記）に変換（例: "1m", "5pr", "1z"）
 */
export function getTileCode(tile: Tile): string {
  const suitChar = tile.suit === 'man' ? 'm' : tile.suit === 'pin' ? 'p' : tile.suit === 'sou' ? 's' : 'z';
  return `${tile.value}${suitChar}${tile.isRedDora ? 'r' : ''}`;
}

/**
 * 牌のソート用重み値を算出（萬子 1-9 -> 筒子 1-9 -> 索子 1-9 -> 字牌 1-7）
 */
export function getTileSortKey(tile: Tile): number {
  const suitOrder = { man: 100, pin: 200, sou: 300, honor: 400 };
  const redPenalty = tile.isRedDora ? -0.1 : 0; // 同種なら赤ドラを先に
  return suitOrder[tile.suit] + tile.value * 10 + redPenalty;
}

/**
 * 手牌を一般的な麻雀の並び順にソート（理牌）
 */
export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => getTileSortKey(a) - getTileSortKey(b));
}

/**
 * 2つの牌が同一種別・数値か比較（IDや赤ドラ差異は問わない）
 */
export function isSameTileType(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value;
}

/**
 * 次のドラ牌を取得（萬筒索: 9->1, 字牌: 東->南->西->北->東, 白->發->中->白）
 */
export function getDoraTileFromMarker(marker: Tile): { suit: Tile['suit']; value: number } {
  if (marker.suit === 'honor') {
    if (marker.value >= 1 && marker.value <= 4) {
      return { suit: 'honor', value: marker.value === 4 ? 1 : marker.value + 1 };
    }
    // 白(5) -> 發(6) -> 中(7) -> 白(5)
    return { suit: 'honor', value: marker.value === 7 ? 5 : marker.value + 1 };
  }
  return {
    suit: marker.suit,
    value: marker.value === 9 ? 1 : marker.value + 1,
  };
}

/**
 * 牌に対応する合成済み高品質PNG画像パスを取得（白牌立体背景合成済み・軽量高速）
 */
export function getTileImagePath(tile?: Tile, isBack?: boolean): string {
  if (isBack || !tile) {
    return '/tiles/Back.png';
  }

  if (tile.suit === 'honor') {
    const honorMap: Record<number, string> = {
      1: 'Ton.png',
      2: 'Nan.png',
      3: 'Shaa.png',
      4: 'Pei.png',
      5: 'Haku.png',
      6: 'Hatsu.png',
      7: 'Chun.png',
    };
    return `/tiles/${honorMap[tile.value] || 'Blank.png'}`;
  }

  const prefix = tile.suit === 'man' ? 'Man' : tile.suit === 'pin' ? 'Pin' : 'Sou';
  if (tile.isRedDora && tile.value === 5) {
    return `/tiles/${prefix}5-Dora.png`;
  }
  return `/tiles/${prefix}${tile.value}.png`;
}

// 後方互換ラッパー
export const getTileSvgPath = getTileImagePath;

export { createStandardTiles } from '../constants/tiles';

