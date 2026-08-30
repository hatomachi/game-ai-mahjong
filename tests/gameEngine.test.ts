import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  startRound,
  playerDiscardAction,
  cpuStepAction,
  advanceToNextRound,
} from '../src/core/game/gameEngine';
import { sanitizeForPlayer } from '../src/ai/types/context';

describe('GameEngine (4人対局ゲームループ)', () => {
  it('局を開始すると配牌13枚、親(Player 0)のツモ牌がセットされる', () => {
    const initState = createInitialGameState();
    const roundState = startRound(initState);

    expect(roundState.phase).toBe('player_turn');
    expect(roundState.activePlayerIndex).toBe(0); // 親
    expect(roundState.players[0].hand).toHaveLength(13);
    expect(roundState.players[0].drawnTile).not.toBeNull();
    expect(roundState.wall).toHaveLength(69); // 70 - 1 = 69
    expect(roundState.doraMarkers).toHaveLength(1);

    // CPUプレイヤーの手牌は13枚でツモ牌なし
    expect(roundState.players[1].hand).toHaveLength(13);
    expect(roundState.players[1].drawnTile).toBeNull();
  });

  it('プレイヤーが打牌すると河に追加され、次家(下家)に手番とツモ牌が渡る', () => {
    const initState = createInitialGameState();
    let state = startRound(initState);

    const player0 = state.players[0];
    const discardId = player0.drawnTile!.id; // ツモ切り

    state = playerDiscardAction(state, 0, discardId);

    expect(state.players[0].discards).toHaveLength(1);
    expect(state.players[0].discards[0].isTsumogiri).toBe(true);
    expect(state.activePlayerIndex).toBe(1); // 下家
    expect(state.players[1].drawnTile).not.toBeNull();
    expect(state.wall).toHaveLength(68);
  });

  it('CPUプレイヤーが cpuStepAction で自動打牌できる', () => {
    const initState = createInitialGameState();
    let state = startRound(initState);

    // Player 0 (人間) が打牌
    state = playerDiscardAction(state, 0, state.players[0].drawnTile!.id);
    expect(state.activePlayerIndex).toBe(1);

    // Player 1 (CPU-1) が思考・打牌
    state = cpuStepAction(state);
    expect(state.players[1].discards).toHaveLength(1);
    expect(state.activePlayerIndex).toBe(2); // 対面へ
    expect(state.players[2].drawnTile).not.toBeNull();
  });

  it('4人全員が打牌すると山牌が減り、ゲームが周回する', () => {
    const initState = createInitialGameState();
    let state = startRound(initState);

    // 4人連続で打牌
    state = playerDiscardAction(state, 0, state.players[0].drawnTile!.id); // 0 -> 1
    state = cpuStepAction(state); // 1 -> 2
    state = cpuStepAction(state); // 2 -> 3
    state = cpuStepAction(state); // 3 -> 0

    expect(state.activePlayerIndex).toBe(0);
    expect(state.players[0].drawnTile).not.toBeNull();
    expect(state.turnCount).toBe(2); // 2巡目
  });

  it('山牌が0枚になると流局(exhaustive_draw)になる', () => {
    const initState = createInitialGameState();
    let state = startRound(initState);

    // 山牌を強制的に0枚にする
    state = {
      ...state,
      wall: [],
    };

    // プレイヤーが打牌
    state = playerDiscardAction(state, 0, state.players[0].drawnTile!.id);

    expect(state.phase).toBe('round_end');
    expect(state.roundResult?.type).toBe('exhaustive_draw');
  });

  it('次の局に進むと東2局になり親がPlayer 1に移行する', () => {
    const initState = createInitialGameState();
    let state = startRound(initState);
    state = advanceToNextRound(state);

    expect(state.roundNumber).toBe(2);
    expect(state.activePlayerIndex).toBe(1); // Player 1 が親
    expect(state.players[1].drawnTile).not.toBeNull();
  });

  it('sanitizeForPlayer で他家の手牌内容がマスクされる', () => {
    const initState = createInitialGameState();
    const state = startRound(initState);

    const sanitized = sanitizeForPlayer(state, 0);

    expect(sanitized.myHand).toHaveLength(13);
    expect(sanitized.myDrawnTile).not.toBeNull();
    // opponents の手牌は枚数のみ (handTileCount) で実体はない
    expect(sanitized.opponents).toHaveLength(3);
    sanitized.opponents.forEach((opp) => {
      expect(opp.handTileCount).toBeGreaterThanOrEqual(13);
      expect((opp as any).hand).toBeUndefined();
    });
  });
});
