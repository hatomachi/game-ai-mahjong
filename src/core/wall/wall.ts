import { Tile } from '../types/tile';
import { createStandardTiles } from '../constants/tiles';

/**
 * Fisher-Yates アルゴリズムによる牌山のシャッフル
 */
export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface WallSetupResult {
  wall: Tile[];             // 残り山牌 (初期 70枚)
  deadWall: Tile[];         // 王牌 (14枚)
  doraMarkers: Tile[];      // 表ドラ表示牌 (初期 1枚)
  uraDoraMarkers: Tile[];   // 裏ドラ表示牌 (初期 1枚)
  hands: [Tile[], Tile[], Tile[], Tile[]]; // 各プレイヤーの配牌 (13枚ずつ)
}

/**
 * 136枚の牌をシャッフルし、王牌・ドラ表示牌・各家の配牌（13枚×4人）を生成
 */
export function setupRoundWall(customTiles?: Tile[]): WallSetupResult {
  const allTiles = customTiles ? [...customTiles] : shuffleTiles(createStandardTiles());
  
  if (allTiles.length !== 136) {
    throw new Error(`Invalid tile count: expected 136, got ${allTiles.length}`);
  }

  // 王牌 14枚を末尾から確保
  const deadWall = allTiles.slice(122, 136);
  // 表ドラ表示牌: 王牌の3枚目 (インデックス2), 裏ドラ表示牌: 王牌の4枚目 (インデックス3)
  const doraMarkers = [deadWall[2]];
  const uraDoraMarkers = [deadWall[3]];

  // 各プレイヤーに13枚ずつ配牌 (計52枚)
  // 0: 東家(自家), 1: 南家(下家), 2: 西家(対面), 3: 北家(上家)
  const hands: [Tile[], Tile[], Tile[], Tile[]] = [
    allTiles.slice(0, 13),
    allTiles.slice(13, 26),
    allTiles.slice(26, 39),
    allTiles.slice(39, 52),
  ];

  // 残り山牌 (インデックス 52..121 の計70枚)
  const wall = allTiles.slice(52, 122);

  return {
    wall,
    deadWall,
    doraMarkers,
    uraDoraMarkers,
    hands,
  };
}

/**
 * 山牌から1枚ツモる
 */
export function drawTileFromWall(wall: Tile[]): { drawnTile: Tile | null; remainingWall: Tile[] } {
  if (wall.length === 0) {
    return { drawnTile: null, remainingWall: [] };
  }
  const [drawnTile, ...remainingWall] = wall;
  return { drawnTile, remainingWall };
}
