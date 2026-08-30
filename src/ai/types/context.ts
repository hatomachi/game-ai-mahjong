import { Tile, DiscardTile, Meld } from '../../core/types/tile';
import { Wind, GameState } from '../../core/types/game';

export interface OpponentPublicView {
  playerIndex: number;
  name: string;
  seatWind: Wind;
  score: number;
  discards: DiscardTile[];     // 捨て牌履歴
  melds: Meld[];               // 副露
  isRiichi: boolean;           // リーチ成立フラグ
  riichiTurn?: number;         // リーチ宣言巡目
  handTileCount: number;       // 手牌枚数 (内容は非公開)
}

export interface SanitizedPlayerView {
  roundWind: 'east' | 'south';
  roundNumber: number;         // 1-4 (東1局〜東4局)
  honba: number;               // 本場数
  riichiSticks: number;        // 供託リーチ棒数
  doraMarkers: Tile[];         // 表ドラ表示牌
  wallRemainingCount: number;  // 残り山枚数
  currentTurn: number;         // 現在の巡目
  
  // 自プレイヤー情報
  myPlayerIndex: number;
  mySeatWind: Wind;
  myScore: number;
  myHand: Tile[];              // 自分の手牌
  myDrawnTile: Tile | null;    // 現在ツモった牌
  myDiscards: DiscardTile[];
  myMelds: Meld[];
  myIsRiichi: boolean;
  
  // 他家3人の公開情報（手牌の内容は厳格に除外）
  opponents: [OpponentPublicView, OpponentPublicView, OpponentPublicView];
}

/**
 * 完全なGameStateから指定プレイヤー向けの公開視点情報（不完全情報）のみを抽出
 */
export function sanitizeForPlayer(gameState: GameState, playerIndex: number): SanitizedPlayerView {
  const me = gameState.players[playerIndex];
  
  const opponentIndices = [
    (playerIndex + 1) % 4,
    (playerIndex + 2) % 4,
    (playerIndex + 3) % 4,
  ];

  const opponents: [OpponentPublicView, OpponentPublicView, OpponentPublicView] = opponentIndices.map(idx => {
    const p = gameState.players[idx];
    return {
      playerIndex: idx,
      name: p.name,
      seatWind: p.seatWind,
      score: p.score,
      discards: p.discards,
      melds: p.melds,
      isRiichi: p.isRiichi,
      riichiTurn: p.riichiTurn,
      handTileCount: p.hand.length + (p.drawnTile ? 1 : 0),
    };
  }) as [OpponentPublicView, OpponentPublicView, OpponentPublicView];

  return {
    roundWind: gameState.roundWind,
    roundNumber: gameState.roundNumber,
    honba: gameState.honba,
    riichiSticks: gameState.riichiSticks,
    doraMarkers: gameState.doraMarkers,
    wallRemainingCount: gameState.wall.length,
    currentTurn: gameState.turnCount,
    myPlayerIndex: playerIndex,
    mySeatWind: me.seatWind,
    myScore: me.score,
    myHand: me.hand,
    myDrawnTile: me.drawnTile,
    myDiscards: me.discards,
    myMelds: me.melds,
    myIsRiichi: me.isRiichi,
    opponents,
  };
}
