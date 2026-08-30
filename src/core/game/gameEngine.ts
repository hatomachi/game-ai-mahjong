import { GameState, PlayerState, Wind } from '../types/game';
import { Tile } from '../types/tile';
import { setupRoundWall, drawTileFromWall } from '../wall/wall';
import { sortTiles } from '../utils/tileUtils';
import { decideCpuDiscard } from '../cpu/cpuPlayer';
import { checkWinningHand } from '../winning/winningHand';

const SEAT_WINDS: Wind[] = ['east', 'south', 'west', 'north'];

/**
 * 初期のゲームステートを作成
 */
export function createInitialGameState(): GameState {
  const players: [PlayerState, PlayerState, PlayerState, PlayerState] = [
    {
      id: 'player_0',
      name: '自家 (あなた)',
      isHuman: true,
      seatWind: 'east',
      score: 25000,
      hand: [],
      drawnTile: null,
      discards: [],
      melds: [],
      isRiichi: false,
    },
    {
      id: 'player_1',
      name: '下家 (CPU-1)',
      isHuman: false,
      seatWind: 'south',
      score: 25000,
      hand: [],
      drawnTile: null,
      discards: [],
      melds: [],
      isRiichi: false,
    },
    {
      id: 'player_2',
      name: '対面 (CPU-2)',
      isHuman: false,
      seatWind: 'west',
      score: 25000,
      hand: [],
      drawnTile: null,
      discards: [],
      melds: [],
      isRiichi: false,
    },
    {
      id: 'player_3',
      name: '上家 (CPU-3)',
      isHuman: false,
      seatWind: 'north',
      score: 25000,
      hand: [],
      drawnTile: null,
      discards: [],
      melds: [],
      isRiichi: false,
    },
  ];

  return {
    roundWind: 'east',
    roundNumber: 1,
    honba: 0,
    riichiSticks: 0,
    doraMarkers: [],
    uraDoraMarkers: [],
    wall: [],
    deadWall: [],
    players,
    activePlayerIndex: 0,
    turnCount: 1,
    phase: 'init',
  };
}

/**
 * 局を開始する（牌山シャッフル、配牌、親の第1ツモ）
 */
export function startRound(prevState: GameState, customTiles?: Tile[]): GameState {
  const { wall, deadWall, doraMarkers, uraDoraMarkers, hands } = setupRoundWall(customTiles);

  // 親プレイヤー (東1局: 0, 東2局: 1, 東3局: 2, 東4局: 3)
  const dealerIndex = (prevState.roundNumber - 1) % 4;

  // 各プレイヤーの風・手牌・捨て牌初期化
  const newPlayers: [PlayerState, PlayerState, PlayerState, PlayerState] = (prevState.players.map((p, idx) => {
    // 親から見た相対位置で自風を決定 (親が東)
    const windOffset = (idx - dealerIndex + 4) % 4;
    const seatWind = SEAT_WINDS[windOffset];

    return {
      ...p,
      seatWind,
      hand: sortTiles(hands[idx]),
      drawnTile: null,
      discards: [],
      melds: [],
      isRiichi: false,
      riichiTurn: undefined,
      isTenpai: false,
    };
  }) as unknown) as [PlayerState, PlayerState, PlayerState, PlayerState];

  // 親に第1ツモを引かせる
  const { drawnTile: firstDrawnTile, remainingWall } = drawTileFromWall(wall);

  if (!firstDrawnTile) {
    throw new Error('Wall is empty during initial deal');
  }

  newPlayers[dealerIndex] = {
    ...newPlayers[dealerIndex],
    drawnTile: firstDrawnTile,
  };

  return {
    ...prevState,
    wall: remainingWall,
    deadWall,
    doraMarkers,
    uraDoraMarkers,
    players: newPlayers,
    activePlayerIndex: dealerIndex,
    turnCount: 1,
    phase: 'player_turn',
    lastDiscard: undefined,
    roundResult: undefined,
  };
}

/**
 * プレイヤー（人間またはCPU）の打牌アクションを実行
 */
export function playerDiscardAction(
  state: GameState,
  playerIndex: number,
  tileId: string
): GameState {
  if (state.phase !== 'player_turn' || state.activePlayerIndex !== playerIndex) {
    return state;
  }

  const player = state.players[playerIndex];
  const isTsumogiri = player.drawnTile?.id === tileId;

  let discardedTile: Tile | null = null;
  let newHand = [...player.hand];
  let newDrawnTile: Tile | null = null;

  if (isTsumogiri && player.drawnTile) {
    discardedTile = player.drawnTile;
    newDrawnTile = null;
  } else {
    const idx = newHand.findIndex((t) => t.id === tileId);
    if (idx !== -1) {
      discardedTile = newHand[idx];
      newHand.splice(idx, 1);
      if (player.drawnTile) {
        newHand.push(player.drawnTile);
      }
      newHand = sortTiles(newHand);
    } else if (player.drawnTile?.id === tileId) {
      discardedTile = player.drawnTile;
      newDrawnTile = null;
    }
  }

  if (!discardedTile) {
    return state;
  }

  const newDiscards = [
    ...player.discards,
    {
      tile: discardedTile,
      isTsumogiri,
      isRiichiDeclaration: false,
    },
  ];

  const updatedPlayer: PlayerState = {
    ...player,
    hand: newHand,
    drawnTile: newDrawnTile,
    discards: newDiscards,
  };

  const updatedPlayers: [PlayerState, PlayerState, PlayerState, PlayerState] = [...state.players] as [
    PlayerState,
    PlayerState,
    PlayerState,
    PlayerState
  ];
  updatedPlayers[playerIndex] = updatedPlayer;

  // 荒野流局判定: 山牌が尽きた場合
  if (state.wall.length === 0) {
    return {
      ...state,
      players: updatedPlayers,
      phase: 'round_end',
      lastDiscard: {
        playerIndex,
        tile: discardedTile,
        isTsumogiri,
      },
      roundResult: {
        type: 'exhaustive_draw',
        message: '流局（荒野流局）',
      },
    };
  }

  // 次のプレイヤーへ手番を移行
  const nextPlayerIndex = (playerIndex + 1) % 4;
  const { drawnTile: nextDrawnTile, remainingWall } = drawTileFromWall(state.wall);

  if (!nextDrawnTile) {
    return {
      ...state,
      players: updatedPlayers,
      wall: remainingWall,
      phase: 'round_end',
      roundResult: {
        type: 'exhaustive_draw',
        message: '流局（荒野流局）',
      },
    };
  }

  const nextPlayer = updatedPlayers[nextPlayerIndex];
  updatedPlayers[nextPlayerIndex] = {
    ...nextPlayer,
    drawnTile: nextDrawnTile,
  };

  const isNewTurnLoop = nextPlayerIndex === 0;
  const newTurnCount = isNewTurnLoop ? state.turnCount + 1 : state.turnCount;

  return {
    ...state,
    wall: remainingWall,
    players: updatedPlayers,
    activePlayerIndex: nextPlayerIndex,
    turnCount: newTurnCount,
    phase: 'player_turn',
    lastDiscard: {
      playerIndex,
      tile: discardedTile,
      isTsumogiri,
    },
  };
}

/**
 * 手番がCPUの場合、1ステップ思考して打牌を実行する
 */
export function cpuStepAction(state: GameState): GameState {
  if (state.phase !== 'player_turn') {
    return state;
  }

  const activePlayer = state.players[state.activePlayerIndex];
  if (activePlayer.isHuman || !activePlayer.drawnTile) {
    return state;
  }

  const decision = decideCpuDiscard(activePlayer.hand, activePlayer.drawnTile);
  return playerDiscardAction(state, state.activePlayerIndex, decision.discardTile.id);
}

/**
 * ツモ和了を宣言する
 */
export function declareTsumoWin(state: GameState, playerIndex: number): GameState {
  if (state.phase !== 'player_turn' || state.activePlayerIndex !== playerIndex) {
    return state;
  }

  const player = state.players[playerIndex];
  if (!player.drawnTile) {
    return state;
  }

  const fullHand = [...player.hand, player.drawnTile];
  const winCheck = checkWinningHand(fullHand);

  if (!winCheck.isWin) {
    return state;
  }

  return {
    ...state,
    phase: 'round_end',
    roundResult: {
      type: 'tsumo',
      winnerIndex: playerIndex,
      message: `${player.name} がツモ和了しました！`,
    },
  };
}

/**
 * 次の局へ進める (例: 東1局 -> 東2局)
 */
export function advanceToNextRound(state: GameState): GameState {
  let nextRoundNumber = state.roundNumber + 1;
  let nextRoundWind = state.roundWind;

  if (nextRoundNumber > 4) {
    nextRoundNumber = 1;
    nextRoundWind = state.roundWind === 'east' ? 'south' : 'east';
  }

  const nextState: GameState = {
    ...state,
    roundWind: nextRoundWind,
    roundNumber: nextRoundNumber,
    honba: state.honba, // 次Phaseで連荘判定を拡張
    phase: 'init',
  };

  return startRound(nextState);
}
