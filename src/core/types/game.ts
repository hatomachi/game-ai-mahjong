import { Tile, DiscardTile, Meld } from './tile';
import { ScoreCalculationResult } from '../scoring/types';
import { AvailableMelds } from '../meld/meldChecker';

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
  isIppatsu?: boolean;
  isTenpai?: boolean;
  isFuriten?: boolean;
  isTemporaryFuriten?: boolean;
  isRiichiFuriten?: boolean;
}

export interface RoundResult {
  type: 'exhaustive_draw' | 'tsumo' | 'ron';
  winnerIndex?: number;
  loserIndex?: number;
  message: string;
  scoreResult?: ScoreCalculationResult;
  tenpaiPlayerIndices?: number[];
  scoreChanges?: [number, number, number, number];
}

export interface PendingAction {
  playerIndex: number;
  fromPlayerIndex: number;
  targetTile: Tile;
  availableMelds: AvailableMelds;
  canRon: boolean;
  ronScoreResult?: ScoreCalculationResult;
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
  lastDiscard?: {
    playerIndex: number;
    tile: Tile;
    isTsumogiri: boolean;
  };
  pendingActions?: PendingAction[]; // 他家の打牌に対して鳴き/ロン可能なアクション待ち
  roundResult?: RoundResult;
}
