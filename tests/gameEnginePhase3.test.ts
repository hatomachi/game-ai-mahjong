import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  startRound,
  playerDiscardAction,
  resolvePendingAction,
  declareTsumoWin,
  advanceToNextRound,
  handleExhaustiveDraw,
  cpuStepAction,
} from '../src/core/game/gameEngine';
import { Tile } from '../src/core/types/tile';

function parseTiles(str: string): Tile[] {
  const tiles: Tile[] = [];
  let currentNums: number[] = [];
  let idCounter = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch >= '1' && ch <= '9') {
      currentNums.push(parseInt(ch, 10));
    } else if (ch === 'm' || ch === 'p' || ch === 's' || ch === 'z') {
      const suit = ch === 'm' ? 'man' : ch === 'p' ? 'pin' : ch === 's' ? 'sou' : 'honor';
      for (const num of currentNums) {
        tiles.push({
          id: `${num}${ch}_${idCounter++}`,
          suit,
          value: num,
        });
      }
      currentNums = [];
    }
  }
  return tiles;
}

describe('gameEngine Phase 3 Integration', () => {
  it('リーチ宣言時に点数供託(1000点)とフラグが設定される', () => {
    let state = createInitialGameState();
    state = startRound(state);

    const activeIdx = state.activePlayerIndex;
    const player = state.players[activeIdx];
    const discardId = player.drawnTile ? player.drawnTile.id : player.hand[0].id;

    const initialScore = player.score;
    const initialSticks = state.riichiSticks;

    const nextState = playerDiscardAction(state, activeIdx, discardId, true);
    const updatedPlayer = nextState.players[activeIdx];

    expect(updatedPlayer.isRiichi).toBe(true);
    expect(updatedPlayer.score).toBe(initialScore - 1000);
    expect(nextState.riichiSticks).toBe(initialSticks + 1);
  });

  it('人間プレイヤーがポン可能な場合 waiting_action に遷移し、ポン成立後に手番が渡る', () => {
    let state = createInitialGameState();
    state = startRound(state);

    // 人間 (player 0) の手牌に 7s を 2枚持たせる
    state.players[0].hand = parseTiles('123m456p77s123s55z');

    // 上家 (player 3) から 7s が捨てられる状況をシミュレート
    state.activePlayerIndex = 3;
    state.players[3].drawnTile = { id: '7s_discard', suit: 'sou', value: 7 };

    const afterDiscard = playerDiscardAction(state, 3, '7s_discard');
    expect(afterDiscard.phase).toBe('waiting_action');
    expect(afterDiscard.pendingActions).toBeDefined();

    const humanAction = afterDiscard.pendingActions?.find((a) => a.playerIndex === 0);
    expect(humanAction?.availableMelds.canPon).toBe(true);

    // 人間がポンを実行
    const afterPon = resolvePendingAction(afterDiscard, 0, 'pon');
    expect(afterPon.phase).toBe('player_turn');
    expect(afterPon.activePlayerIndex).toBe(0);
    expect(afterPon.players[0].melds.length).toBe(1);
    expect(afterPon.players[0].melds[0].type).toBe('pon');
  });

  it('荒野流局でテンパイ者とノーテン者のノーテン罰符が正しく移動する', () => {
    let state = createInitialGameState();
    state = startRound(state);

    // player 0 のみテンパイ、他はノーテン
    state.players[0].hand = parseTiles('123m456p789s11z23m'); // テンパイ (1-4m待ち)
    state.players[1].hand = parseTiles('147m258p369s1234z'); // ノーテン
    state.players[2].hand = parseTiles('147m258p369s1234z'); // ノーテン
    state.players[3].hand = parseTiles('147m258p369s1234z'); // ノーテン

    const drawState = handleExhaustiveDraw(state);
    expect(drawState.phase).toBe('round_end');
    expect(drawState.players[0].score).toBe(25000 + 3000);
    expect(drawState.players[1].score).toBe(25000 - 1000);
    expect(drawState.players[2].score).toBe(25000 - 1000);
    expect(drawState.players[3].score).toBe(25000 - 1000);
  });

  it('親の和了時に親連荘（本場+1、roundNumberそのまま）になる', () => {
    let state = createInitialGameState();
    state = startRound(state); // 東1局、親は player 0

    // 親 (player 0) のツモ和了
    state.activePlayerIndex = 0;
    state.players[0].hand = parseTiles('123m456p789s11z23m');
    state.players[0].drawnTile = { id: '1m_win', suit: 'man', value: 1 };

    const winState = declareTsumoWin(state, 0);
    expect(winState.phase).toBe('round_end');

    const nextRoundState = advanceToNextRound(winState);
    expect(nextRoundState.roundNumber).toBe(1); // 連荘で東1局のまま
    expect(nextRoundState.honba).toBe(1); // 1本場
  });

  it('下家(CPU-1)がポンした直後、drawnTileがnullでもcpuStepActionで打牌してゲームが進行する', () => {
    let state = createInitialGameState();
    state = startRound(state);

    // 下家 (player 1, CPU-1) の手牌に 白(5z) を2枚持たせる (13枚ノーテン形: 124m456p789s11m55z)
    state.players[1].hand = parseTiles('124m456p789s11m55z');
    state.players[2].hand = parseTiles('147m258p369s123z1'); // 他家は副露しない手牌
    state.players[3].hand = parseTiles('258m369p147s456z2');

    // 人間 (player 0) が 白(5z) を捨てる
    state.activePlayerIndex = 0;
    state.players[0].drawnTile = { id: '5z_discard', suit: 'honor', value: 5 };

    const afterDiscard = playerDiscardAction(state, 0, '5z_discard');

    // CPU-1 (下家) が自動でポンを実行した状態をシミュレート
    // ポン直後: activePlayerIndex: 1, phase: 'player_turn', drawnTile: null, 手牌11枚, melds: 1つ
    expect(afterDiscard.phase).toBe('player_turn');
    expect(afterDiscard.activePlayerIndex).toBe(1);
    expect(afterDiscard.players[1].melds.length).toBe(1);
    expect(afterDiscard.players[1].melds[0].type).toBe('pon');
    expect(afterDiscard.players[1].drawnTile).toBeNull();
    expect(afterDiscard.players[1].hand.length).toBe(11);

    // CPU-1 の打牌ステップを実行
    const afterCpuDiscard = cpuStepAction(afterDiscard);

    // 止まらずに打牌が実行され、手牌が10枚になり、次のプレイヤー（対面: player 2）のツモ番に進むこと
    expect(afterCpuDiscard.players[1].hand.length).toBe(10);
    expect(afterCpuDiscard.players[1].discards.length).toBe(1);
    expect(afterCpuDiscard.activePlayerIndex).toBe(2); // 対面の手番へ
    expect(afterCpuDiscard.players[2].drawnTile).not.toBeNull(); // 対面がツモ牌を引いている
  });
});
