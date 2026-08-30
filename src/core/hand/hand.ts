import { Tile, TileSuit } from '../types/tile';
import { sortTiles } from '../utils/tileUtils';

/**
 * 牌種と数値から34配列のインデックス(0..33)を算出
 * 0..8: 1m..9m
 * 9..17: 1p..9p
 * 18..26: 1s..9s
 * 27..33: 1z..7z (東南西北白發中)
 */
export function tileToIndex(tile: Pick<Tile, 'suit' | 'value'>): number {
  if (tile.suit === 'man') return tile.value - 1;
  if (tile.suit === 'pin') return 9 + (tile.value - 1);
  if (tile.suit === 'sou') return 18 + (tile.value - 1);
  if (tile.suit === 'honor') return 27 + (tile.value - 1);
  throw new Error(`Invalid tile: ${JSON.stringify(tile)}`);
}

/**
 * 34配列インデックス(0..33)から牌種・数値を算出
 */
export function indexToTileInfo(index: number): { suit: TileSuit; value: number } {
  if (index >= 0 && index < 9) {
    return { suit: 'man', value: index + 1 };
  }
  if (index >= 9 && index < 18) {
    return { suit: 'pin', value: index - 9 + 1 };
  }
  if (index >= 18 && index < 27) {
    return { suit: 'sou', value: index - 18 + 1 };
  }
  if (index >= 27 && index < 34) {
    return { suit: 'honor', value: index - 27 + 1 };
  }
  throw new Error(`Invalid tile index: ${index}`);
}

/**
 * 牌コード文字列 (例: "1m", "5p", "1z") から34インデックスを算出
 */
export function codeToIndex(code: string): number {
  const val = parseInt(code[0], 10);
  const suitChar = code[1];
  if (suitChar === 'm') return val - 1;
  if (suitChar === 'p') return 9 + (val - 1);
  if (suitChar === 's') return 18 + (val - 1);
  if (suitChar === 'z') return 27 + (val - 1);
  throw new Error(`Invalid tile code: ${code}`);
}

/**
 * 34インデックスから牌コード文字列 (例: "1m", "5p", "1z") を算出
 */
export function indexToCode(index: number): string {
  const info = indexToTileInfo(index);
  const char = info.suit === 'man' ? 'm' : info.suit === 'pin' ? 'p' : info.suit === 'sou' ? 's' : 'z';
  return `${info.value}${char}`;
}

/**
 * 手牌(Tile[])を長さ34の牌数配列(number[34])に変換
 */
export function tilesToCountArray(tiles: Tile[]): number[] {
  const counts = new Array(34).fill(0);
  for (const tile of tiles) {
    const idx = tileToIndex(tile);
    counts[idx]++;
  }
  return counts;
}

/**
 * 手牌に1枚牌を追加してソート（理牌）する
 */
export function addTileToHand(hand: Tile[], tile: Tile): Tile[] {
  return sortTiles([...hand, tile]);
}

/**
 * 手牌から指定IDの牌を1枚削除する
 */
export function removeTileFromHand(hand: Tile[], tileId: string): { newHand: Tile[]; removedTile: Tile | null } {
  const idx = hand.findIndex((t) => t.id === tileId);
  if (idx === -1) {
    return { newHand: hand, removedTile: null };
  }
  const removedTile = hand[idx];
  const newHand = hand.filter((_, i) => i !== idx);
  return { newHand: sortTiles(newHand), removedTile };
}
