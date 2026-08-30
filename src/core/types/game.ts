import { Tile, DiscardTile, Meld } from './tile';

export type Wind = 'east' | 'south' | 'west' | 'north';

export type GamePhase =
  | 'init'
  | 'dealing'
  | 'player_turn'
  | 'waiting_action'
  | 'round_end'
  | 'game_over';

export interface PlayerState {
  id: string;
  name: string;
  isHuman: boolean;
  seatWind: Wind;
  score: number;
  hand: Tile[];
  drawnTile: Tile | null;
  discards: DiscardTile[];
  melds: Meld[];
  isRiichi: boolean;
  riichiTurn?: number;
  isTenpai?: boolean;
}

export interface GameState {
  roundWind: 'east' | 'south'; // 東場 / 南場
  roundNumber: number;         // 1-4 (東1局〜東4局)
  honba: number;               // 本場数
  riichiSticks: number;        // 供託リーチ棒数
  doraMarkers: Tile[];         // 表ドラ表示牌
  uraDoraMarkers: Tile[];      // 裏ドラ表示牌
  wall: Tile[];                // 山牌
  deadWall: Tile[];            // 王牌 (14枚)
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  activePlayerIndex: number;   // 手番プレイヤー (0..3)
  turnCount: number;           // 現在の巡目
  phase: GamePhase;
}
