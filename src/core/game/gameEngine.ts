import { GameState, PlayerState, Wind, PendingAction } from '../types/game';
import { Tile, Meld, DiscardTile } from '../types/tile';
import { setupRoundWall, drawTileFromWall } from '../wall/wall';
import { sortTiles, isSameTileType } from '../utils/tileUtils';
import { decideCpuDiscard, decideCpuAction } from '../cpu/cpuPlayer';
import { calcShanten } from '../shanten/shanten';
import { checkDiscardsMelds, ChiOption } from '../meld/meldChecker';
import { checkFuriten } from '../furiten/furitenChecker';
import { calculateWinningScore } from '../scoring/scoreCalculator';
import { WinContext, ScoreCalculationResult } from '../scoring/types';

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

  const dealerIndex = (prevState.roundNumber - 1) % 4;

  const newPlayers: [PlayerState, PlayerState, PlayerState, PlayerState] = (prevState.players.map((p, idx) => {
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
      isIppatsu: false,
      isTenpai: false,
      isFuriten: false,
    };
  }) as unknown) as [PlayerState, PlayerState, PlayerState, PlayerState];

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
    pendingActions: undefined,
    roundResult: undefined,
  };
}

/**
 * 流局（荒野流局）時のテンパイ判定とノーテン罰符授受
 */
export function handleExhaustiveDraw(state: GameState): GameState {
  const tenpaiIndices: number[] = [];
  const noTenIndices: number[] = [];

  state.players.forEach((p, idx) => {
    const shanten = calcShanten(p.hand).shanten;
    if (shanten === 0) {
      tenpaiIndices.push(idx);
    } else {
      noTenIndices.push(idx);
    }
  });

  const scoreChanges: [number, number, number, number] = [0, 0, 0, 0];

  if (tenpaiIndices.length > 0 && tenpaiIndices.length < 4) {
    const gainPerTenpai = 3000 / tenpaiIndices.length;
    const lossPerNoTen = 3000 / noTenIndices.length;

    for (const idx of tenpaiIndices) {
      scoreChanges[idx] = gainPerTenpai;
    }
    for (const idx of noTenIndices) {
      scoreChanges[idx] = -lossPerNoTen;
    }
  }

  const updatedPlayers = state.players.map((p, idx) => ({
    ...p,
    score: p.score + scoreChanges[idx],
    isTenpai: tenpaiIndices.includes(idx),
  })) as [PlayerState, PlayerState, PlayerState, PlayerState];

  const dealerIndex = (state.roundNumber - 1) % 4;
  const isDealerTenpai = tenpaiIndices.includes(dealerIndex);

  const message = `荒野流局: 聴牌 ${tenpaiIndices.length}人 / 不聴 ${noTenIndices.length}人 (${isDealerTenpai ? '親連荘' : '親流れ'})`;

  // トビ判定
  const isTobi = updatedPlayers.some((p) => p.score < 0);

  return {
    ...state,
    players: updatedPlayers,
    phase: isTobi ? 'game_over' : 'round_end',
    roundResult: {
      type: 'exhaustive_draw',
      message,
      tenpaiPlayerIndices: tenpaiIndices,
      scoreChanges,
    },
  };
}

/**
 * 他プレイヤーのアクション（ロン、ポン、チー、カン）を収集する
 */
export function collectPendingActions(
  state: GameState,
  discardedTile: Tile,
  discardPlayerIndex: number
): PendingAction[] {
  const actions: PendingAction[] = [];

  for (let i = 0; i < 4; i++) {
    if (i === discardPlayerIndex) continue;

    const p = state.players[i];
    const melds = checkDiscardsMelds(p, discardedTile, discardPlayerIndex, i);

    // ロン判定
    const winContext: WinContext = {
      isTsumo: false,
      isRiichi: p.isRiichi,
      isDoubleRiichi: p.isRiichi && p.riichiTurn === 1,
      isIppatsu: p.isIppatsu,
      roundWind: state.roundWind,
      playerWind: p.seatWind,
      doraMarkers: state.doraMarkers,
      uraDoraMarkers: state.uraDoraMarkers,
      winningTile: discardedTile,
    };

    const furiten = checkFuriten(p, discardedTile);
    let canRon = false;
    let ronScoreResult: ScoreCalculationResult | undefined = undefined;

    if (!furiten.isFuriten) {
      const fullHand = [...p.hand, discardedTile];
      const score = calculateWinningScore(
        fullHand,
        p.melds,
        winContext,
        state.honba,
        state.riichiSticks,
        i,
        discardPlayerIndex
      );
      if (score && score.han > 0) {
        canRon = true;
        ronScoreResult = score;
      }
    }

    if (melds.canChi || melds.canPon || melds.canDaiminkan || canRon) {
      actions.push({
        playerIndex: i,
        availableMelds: { ...melds, canRon },
        canRon,
        ronScoreResult,
      });
    }
  }

  return actions;
}

/**
 * プレイヤー（人間またはCPU）の打牌アクションを実行
 */
export function playerDiscardAction(
  state: GameState,
  playerIndex: number,
  tileId: string,
  declareRiichi: boolean = false
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

  // リーチ処理
  let isRiichi = player.isRiichi;
  let riichiTurn = player.riichiTurn;
  let isIppatsu = player.isIppatsu;
  let score = player.score;
  let riichiSticks = state.riichiSticks;

  if (declareRiichi && !player.isRiichi && player.score >= 1000) {
    isRiichi = true;
    riichiTurn = state.turnCount;
    isIppatsu = true;
    score -= 1000;
    riichiSticks += 1;
  } else if (player.isRiichi && isIppatsu && playerIndex === state.activePlayerIndex) {
    // リーチ後1巡が終了したら一発フラグ解除
    // (打牌が完了した時点で解除)
    isIppatsu = false;
  }

  const newDiscards: DiscardTile[] = [
    ...player.discards,
    {
      tile: discardedTile,
      isTsumogiri,
      isRiichiDeclaration: declareRiichi,
    },
  ];

  const updatedPlayer: PlayerState = {
    ...player,
    hand: newHand,
    drawnTile: newDrawnTile,
    discards: newDiscards,
    isRiichi,
    riichiTurn,
    isIppatsu,
    score,
  };

  const updatedPlayers: [PlayerState, PlayerState, PlayerState, PlayerState] = [...state.players] as [
    PlayerState,
    PlayerState,
    PlayerState,
    PlayerState
  ];
  updatedPlayers[playerIndex] = updatedPlayer;

  const stateAfterDiscard: GameState = {
    ...state,
    players: updatedPlayers,
    riichiSticks,
    lastDiscard: {
      playerIndex,
      tile: discardedTile,
      isTsumogiri,
    },
  };

  // 他プレイヤーの鳴き・ロン判定
  const pendingActions = collectPendingActions(stateAfterDiscard, discardedTile, playerIndex);

  // 人間プレイヤー (index 0) がアクション可能な場合は waiting_action へ遷移
  const humanAction = pendingActions.find((a) => a.playerIndex === 0);
  if (humanAction) {
    return {
      ...stateAfterDiscard,
      phase: 'waiting_action',
      pendingActions,
    };
  }

  // CPUのアクション判断
  for (const act of pendingActions) {
    const decision = decideCpuAction(act);
    if (decision === 'ron') {
      return executeRonWin(stateAfterDiscard, act.playerIndex, playerIndex, discardedTile);
    } else if (decision === 'pon') {
      return executePon(stateAfterDiscard, act.playerIndex, playerIndex, discardedTile);
    }
  }

  // 鳴き・ロンなし -> 次のツモへ
  return proceedToNextTurn(stateAfterDiscard, playerIndex);
}

/**
 * 鳴きやロンがなかった場合の次の巡目へ進める処理
 */
export function proceedToNextTurn(state: GameState, lastPlayerIndex: number): GameState {
  // 荒野流局判定: 山牌が尽きた場合
  if (state.wall.length === 0) {
    return handleExhaustiveDraw(state);
  }

  const nextPlayerIndex = (lastPlayerIndex + 1) % 4;
  const { drawnTile: nextDrawnTile, remainingWall } = drawTileFromWall(state.wall);

  if (!nextDrawnTile) {
    return handleExhaustiveDraw(state);
  }

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState, PlayerState, PlayerState];
  updatedPlayers[nextPlayerIndex] = {
    ...updatedPlayers[nextPlayerIndex],
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
    pendingActions: undefined,
  };
}

/**
 * ポンを実行
 */
export function executePon(
  state: GameState,
  playerIndex: number,
  fromPlayerIndex: number,
  calledTile: Tile
): GameState {
  const player = state.players[playerIndex];
  const sameTiles = player.hand.filter((t) => isSameTileType(t, calledTile));
  if (sameTiles.length < 2) return state;

  const usedTiles = [sameTiles[0], sameTiles[1]];
  const newHand = player.hand.filter((t) => t.id !== usedTiles[0].id && t.id !== usedTiles[1].id);

  const meld: Meld = {
    type: 'pon',
    tiles: [...usedTiles, calledTile],
    fromPlayerIndex,
    calledTile,
  };

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState, PlayerState, PlayerState];

  // 打牌された河の牌を isCalled に更新
  const fromPlayer = state.players[fromPlayerIndex];
  const lastDiscIdx = fromPlayer.discards.length - 1;
  if (lastDiscIdx >= 0) {
    const updatedDiscards = [...fromPlayer.discards];
    updatedDiscards[lastDiscIdx] = {
      ...updatedDiscards[lastDiscIdx],
      isCalled: true,
    };
    updatedPlayers[fromPlayerIndex] = {
      ...fromPlayer,
      discards: updatedDiscards,
    };
  }

  // 鳴きによって全員の一発を消滅させる
  for (let i = 0; i < 4; i++) {
    updatedPlayers[i] = {
      ...updatedPlayers[i],
      isIppatsu: false,
    };
  }

  updatedPlayers[playerIndex] = {
    ...updatedPlayers[playerIndex],
    hand: sortTiles(newHand),
    melds: [...player.melds, meld],
    drawnTile: null, // ポンした直後は手牌から打牌する
  };

  return {
    ...state,
    players: updatedPlayers,
    activePlayerIndex: playerIndex,
    phase: 'player_turn',
    pendingActions: undefined,
  };
}

/**
 * チーを実行
 */
export function executeChi(
  state: GameState,
  playerIndex: number,
  fromPlayerIndex: number,
  calledTile: Tile,
  usedTiles: [Tile, Tile]
): GameState {
  const player = state.players[playerIndex];
  const newHand = player.hand.filter((t) => t.id !== usedTiles[0].id && t.id !== usedTiles[1].id);

  const meld: Meld = {
    type: 'chi',
    tiles: sortTiles([...usedTiles, calledTile]),
    fromPlayerIndex,
    calledTile,
  };

  const updatedPlayers = [...state.players] as [PlayerState, PlayerState, PlayerState, PlayerState];

  const fromPlayer = state.players[fromPlayerIndex];
  const lastDiscIdx = fromPlayer.discards.length - 1;
  if (lastDiscIdx >= 0) {
    const updatedDiscards = [...fromPlayer.discards];
    updatedDiscards[lastDiscIdx] = {
      ...updatedDiscards[lastDiscIdx],
      isCalled: true,
    };
    updatedPlayers[fromPlayerIndex] = {
      ...fromPlayer,
      discards: updatedDiscards,
    };
  }

  for (let i = 0; i < 4; i++) {
    updatedPlayers[i] = {
      ...updatedPlayers[i],
      isIppatsu: false,
    };
  }

  updatedPlayers[playerIndex] = {
    ...updatedPlayers[playerIndex],
    hand: sortTiles(newHand),
    melds: [...player.melds, meld],
    drawnTile: null,
  };

  return {
    ...state,
    players: updatedPlayers,
    activePlayerIndex: playerIndex,
    phase: 'player_turn',
    pendingActions: undefined,
  };
}

/**
 * ロン和了を実行
 */
export function executeRonWin(
  state: GameState,
  winnerIndex: number,
  loserIndex: number,
  winningTile: Tile
): GameState {
  const winner = state.players[winnerIndex];
  const winContext: WinContext = {
    isTsumo: false,
    isRiichi: winner.isRiichi,
    isDoubleRiichi: winner.isRiichi && winner.riichiTurn === 1,
    isIppatsu: winner.isIppatsu,
    roundWind: state.roundWind,
    playerWind: winner.seatWind,
    doraMarkers: state.doraMarkers,
    uraDoraMarkers: state.uraDoraMarkers,
    winningTile,
  };

  const fullHand = [...winner.hand, winningTile];
  const scoreResult = calculateWinningScore(
    fullHand,
    winner.melds,
    winContext,
    state.honba,
    state.riichiSticks,
    winnerIndex,
    loserIndex
  );

  if (!scoreResult) {
    return state;
  }

  const updatedPlayers = state.players.map((p, idx) => ({
    ...p,
    score: p.score + scoreResult.paymentsByPlayer[idx],
  })) as [PlayerState, PlayerState, PlayerState, PlayerState];

  const isTobi = updatedPlayers.some((p) => p.score < 0);
  const message = `${winner.name} のロン和了！ (${scoreResult.title} - ${scoreResult.finalGain}点)`;

  return {
    ...state,
    players: updatedPlayers,
    riichiSticks: 0, // 和了者が総取り
    phase: isTobi ? 'game_over' : 'round_end',
    pendingActions: undefined,
    roundResult: {
      type: 'ron',
      winnerIndex,
      loserIndex,
      message,
      scoreResult,
      scoreChanges: scoreResult.paymentsByPlayer,
    },
  };
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
  const winContext: WinContext = {
    isTsumo: true,
    isRiichi: player.isRiichi,
    isDoubleRiichi: player.isRiichi && player.riichiTurn === 1,
    isIppatsu: player.isIppatsu,
    roundWind: state.roundWind,
    playerWind: player.seatWind,
    doraMarkers: state.doraMarkers,
    uraDoraMarkers: state.uraDoraMarkers,
    winningTile: player.drawnTile,
  };

  const scoreResult = calculateWinningScore(
    fullHand,
    player.melds,
    winContext,
    state.honba,
    state.riichiSticks,
    playerIndex
  );

  if (!scoreResult || scoreResult.han === 0) {
    return state;
  }

  const updatedPlayers = state.players.map((p, idx) => ({
    ...p,
    score: p.score + scoreResult.paymentsByPlayer[idx],
  })) as [PlayerState, PlayerState, PlayerState, PlayerState];

  const isTobi = updatedPlayers.some((p) => p.score < 0);
  const message = `${player.name} のツモ和了！ (${scoreResult.title} - ${scoreResult.finalGain}点)`;

  return {
    ...state,
    players: updatedPlayers,
    riichiSticks: 0,
    phase: isTobi ? 'game_over' : 'round_end',
    roundResult: {
      type: 'tsumo',
      winnerIndex: playerIndex,
      message,
      scoreResult,
      scoreChanges: scoreResult.paymentsByPlayer,
    },
  };
}

/**
 * プレイヤーのアクション（ポン・チー・カン・ロン・パス）を解決
 */
export function resolvePendingAction(
  state: GameState,
  playerIndex: number,
  actionType: 'ron' | 'pon' | 'chi' | 'daiminkan' | 'pass',
  selectedChiOption?: ChiOption
): GameState {
  if (state.phase !== 'waiting_action' || !state.lastDiscard) {
    return state;
  }

  const discardedTile = state.lastDiscard.tile;
  const discardPlayerIndex = state.lastDiscard.playerIndex;

  if (actionType === 'ron') {
    return executeRonWin(state, playerIndex, discardPlayerIndex, discardedTile);
  }

  if (actionType === 'pon') {
    return executePon(state, playerIndex, discardPlayerIndex, discardedTile);
  }

  if (actionType === 'chi' && selectedChiOption) {
    return executeChi(state, playerIndex, discardPlayerIndex, discardedTile, selectedChiOption.tiles);
  }

  // パスした場合
  return proceedToNextTurn(state, discardPlayerIndex);
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

  // ツモ和了判定
  const fullHand = [...activePlayer.hand, activePlayer.drawnTile];
  const winContext: WinContext = {
    isTsumo: true,
    isRiichi: activePlayer.isRiichi,
    isDoubleRiichi: activePlayer.isRiichi && activePlayer.riichiTurn === 1,
    isIppatsu: activePlayer.isIppatsu,
    roundWind: state.roundWind,
    playerWind: activePlayer.seatWind,
    doraMarkers: state.doraMarkers,
    uraDoraMarkers: state.uraDoraMarkers,
    winningTile: activePlayer.drawnTile,
  };

  const scoreResult = calculateWinningScore(
    fullHand,
    activePlayer.melds,
    winContext,
    state.honba,
    state.riichiSticks,
    state.activePlayerIndex
  );

  if (scoreResult && scoreResult.han > 0) {
    return declareTsumoWin(state, state.activePlayerIndex);
  }

  const decision = decideCpuDiscard(activePlayer);
  return playerDiscardAction(state, state.activePlayerIndex, decision.discardTile.id, decision.declareRiichi);
}

/**
 * 次の局へ進める (連荘・輪荘・本場管理)
 */
export function advanceToNextRound(state: GameState): GameState {
  const dealerIndex = (state.roundNumber - 1) % 4;
  let isRenchan = false; // 親連荘かどうか

  if (state.roundResult) {
    if (state.roundResult.type === 'tsumo' || state.roundResult.type === 'ron') {
      if (state.roundResult.winnerIndex === dealerIndex) {
        isRenchan = true; // 親が和了 -> 連荘
      }
    } else if (state.roundResult.type === 'exhaustive_draw') {
      if (state.roundResult.tenpaiPlayerIndices?.includes(dealerIndex)) {
        isRenchan = true; // 親がテンパイ -> 連荘
      }
    }
  }

  let nextRoundNumber = state.roundNumber;
  let nextRoundWind = state.roundWind;
  let nextHonba = isRenchan ? state.honba + 1 : 0;

  if (!isRenchan) {
    // 親流れ (輪荘)
    nextRoundNumber = state.roundNumber + 1;
    if (nextRoundNumber > 4) {
      nextRoundNumber = 1;
      nextRoundWind = state.roundWind === 'east' ? 'south' : 'east';
    }
    // 東風戦/半荘戦の終了判定
    if (nextRoundWind === 'east' && state.roundWind === 'south') {
      return {
        ...state,
        phase: 'game_over',
      };
    }
  }

  const nextState: GameState = {
    ...state,
    roundWind: nextRoundWind,
    roundNumber: nextRoundNumber,
    honba: nextHonba,
    phase: 'init',
  };

  return startRound(nextState);
}
