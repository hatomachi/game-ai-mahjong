import { useState, useEffect } from 'react';
import { GameState } from './core/types/game';
import {
  createInitialGameState,
  startRound,
  playerDiscardAction,
  cpuStepAction,
  declareTsumoWin,
  advanceToNextRound,
  resolvePendingAction,
} from './core/game/gameEngine';
import { ChiOption } from './core/meld/meldChecker';
import { sanitizeForPlayer } from './ai/types/context';
import { MahjongTable } from './components/MahjongTable';
import { AICoachPanel } from './components/AICoachPanel';
import { Bot, Gamepad2 } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const init = createInitialGameState();
    return startRound(init);
  });

  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'table' | 'coach'>('table');

  // CPU手番時の自動実行ループ
  useEffect(() => {
    if (gameState.phase !== 'player_turn') {
      return;
    }

    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (!activePlayer.isHuman) {
      const delay = isAutoPlay ? 400 : 700;
      const timer = setTimeout(() => {
        setGameState((prev) => cpuStepAction(prev));
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [gameState, isAutoPlay]);

  // 人間手番での打牌ハンドラー
  const handlePlayerDiscard = (tileId: string, _isTsumo: boolean, declareRiichi?: boolean) => {
    setGameState((prev) => playerDiscardAction(prev, 0, tileId, declareRiichi));
  };

  // アクション（ロン、ポン、チー、カン、パス）の解決ハンドラー
  const handleResolveAction = (
    actionType: 'ron' | 'pon' | 'chi' | 'daiminkan' | 'pass',
    selectedChiOption?: ChiOption
  ) => {
    setGameState((prev) => resolvePendingAction(prev, 0, actionType, selectedChiOption));
  };

  // ツモ和了ハンドラー
  const handleDeclareTsumoWin = () => {
    setGameState((prev) => declareTsumoWin(prev, 0));
  };

  // 局の開始 / 再配牌
  const handleStartRound = () => {
    setGameState((prev) => startRound(prev));
  };

  // 次の局へ進む
  const handleNextRound = () => {
    setGameState((prev) => advanceToNextRound(prev));
  };

  // ゲーム全体のリセット
  const handleResetGame = () => {
    const init = createInitialGameState();
    setGameState(startRound(init));
    setIsAutoPlay(false);
  };

  // 1手進める（ステップ実行）
  const handleStepForward = () => {
    if (gameState.phase === 'player_turn') {
      const active = gameState.players[gameState.activePlayerIndex];
      if (!active.isHuman) {
        setGameState((prev) => cpuStepAction(prev));
      }
    }
  };

  // テストシナリオのロード
  const handleLoadScenario = (scenario: 'riichi_defense' | 'tenpai_choice') => {
    if (scenario === 'riichi_defense') {
      setGameState({
        roundWind: 'east',
        roundNumber: 1,
        honba: 0,
        riichiSticks: 1,
        doraMarkers: [{ id: 'dora_1', suit: 'man', value: 5, isRedDora: false }],
        uraDoraMarkers: [{ id: 'ura_1', suit: 'sou', value: 2 }],
        wall: new Array(48).fill(null).map((_, i) => ({ id: `w_${i}`, suit: 'man', value: 1 })),
        deadWall: new Array(14).fill(null).map((_, i) => ({ id: `dw_${i}`, suit: 'pin', value: 1 })),
        turnCount: 9,
        activePlayerIndex: 0,
        phase: 'player_turn',
        players: [
          {
            id: 'player_0',
            name: '自家 (あなた)',
            isHuman: true,
            seatWind: 'south',
            score: 25000,
            hand: [
              { id: '1m_1', suit: 'man', value: 1 },
              { id: '2m_1', suit: 'man', value: 2 },
              { id: '3m_1', suit: 'man', value: 3 },
              { id: '4p_1', suit: 'pin', value: 4 },
              { id: '5p_1', suit: 'pin', value: 5, isRedDora: true },
              { id: '6p_1', suit: 'pin', value: 6 },
              { id: '7s_1', suit: 'sou', value: 7 },
              { id: '8s_1', suit: 'sou', value: 8 },
              { id: '9s_1', suit: 'sou', value: 9 },
              { id: '1z_1', suit: 'honor', value: 1 },
              { id: '1z_2', suit: 'honor', value: 1 },
              { id: '5z_1', suit: 'honor', value: 5 },
              { id: '5z_2', suit: 'honor', value: 5 },
            ],
            drawnTile: { id: '8s_2', suit: 'sou', value: 8 },
            discards: [
              { tile: { id: '9p_1', suit: 'pin', value: 9 }, isTsumogiri: false },
              { tile: { id: '1s_1', suit: 'sou', value: 1 }, isTsumogiri: false },
              { tile: { id: '4z_1', suit: 'honor', value: 4 }, isTsumogiri: true },
            ],
            melds: [],
            isRiichi: false,
          },
          {
            id: 'player_1',
            name: '下家 (CPU-1)',
            isHuman: false,
            seatWind: 'south',
            score: 25000,
            hand: new Array(13).fill(null).map((_, i) => ({ id: `p1_h_${i}`, suit: 'man', value: 1 })),
            drawnTile: null,
            discards: [
              { tile: { id: '1p_1', suit: 'pin', value: 1 }, isTsumogiri: false },
              { tile: { id: '9s_2', suit: 'sou', value: 9 }, isTsumogiri: true },
            ],
            melds: [],
            isRiichi: false,
          },
          {
            id: 'player_2',
            name: '対面 (CPU-2)',
            isHuman: false,
            seatWind: 'west',
            score: 24000,
            hand: new Array(13).fill(null).map((_, i) => ({ id: `p2_h_${i}`, suit: 'man', value: 1 })),
            drawnTile: null,
            discards: [
              { tile: { id: '9m_1', suit: 'man', value: 9 }, isTsumogiri: false },
              { tile: { id: '1p_2', suit: 'pin', value: 1 }, isTsumogiri: false },
              { tile: { id: '2z_1', suit: 'honor', value: 2 }, isTsumogiri: false },
              { tile: { id: '3z_1', suit: 'honor', value: 3 }, isTsumogiri: false },
              { tile: { id: '2p_1', suit: 'pin', value: 2 }, isTsumogiri: false },
              { tile: { id: '7m_1', suit: 'man', value: 7 }, isTsumogiri: false },
              { tile: { id: '5m_1', suit: 'man', value: 5 }, isTsumogiri: false, isRiichiDeclaration: true },
              { tile: { id: '6s_1', suit: 'sou', value: 6 }, isTsumogiri: true },
            ],
            melds: [],
            isRiichi: true,
            riichiTurn: 7,
          },
          {
            id: 'player_3',
            name: '上家 (CPU-3)',
            isHuman: false,
            seatWind: 'north',
            score: 25000,
            hand: new Array(10).fill(null).map((_, i) => ({ id: `p3_h_${i}`, suit: 'man', value: 1 })),
            drawnTile: null,
            discards: [
              { tile: { id: '1m_2', suit: 'man', value: 1 }, isTsumogiri: false },
              { tile: { id: '2m_2', suit: 'man', value: 2 }, isTsumogiri: true },
            ],
            melds: [
              {
                type: 'pon',
                tiles: [
                  { id: '7z_1', suit: 'honor', value: 7 },
                  { id: '7z_2', suit: 'honor', value: 7 },
                  { id: '7z_3', suit: 'honor', value: 7 },
                ],
                fromPlayerIndex: 1,
                calledTile: { id: '7z_1', suit: 'honor', value: 7 },
              },
            ],
            isRiichi: false,
          },
        ],
      });
    } else if (scenario === 'tenpai_choice') {
      setGameState({
        roundWind: 'east',
        roundNumber: 2,
        honba: 1,
        riichiSticks: 0,
        doraMarkers: [{ id: 'dora_2', suit: 'pin', value: 3 }],
        uraDoraMarkers: [{ id: 'ura_2', suit: 'man', value: 4 }],
        wall: new Array(56).fill(null).map((_, i) => ({ id: `w_${i}`, suit: 'sou', value: 1 })),
        deadWall: new Array(14).fill(null).map((_, i) => ({ id: `dw_${i}`, suit: 'sou', value: 2 })),
        turnCount: 6,
        activePlayerIndex: 0,
        phase: 'player_turn',
        players: [
          {
            id: 'player_0',
            name: '自家 (あなた)',
            isHuman: true,
            seatWind: 'east',
            score: 25000,
            hand: [
              { id: '2m_1', suit: 'man', value: 2 },
              { id: '3m_1', suit: 'man', value: 3 },
              { id: '4m_1', suit: 'man', value: 4 },
              { id: '4p_1', suit: 'pin', value: 4 },
              { id: '5p_1', suit: 'pin', value: 5 },
              { id: '6p_1', suit: 'pin', value: 6 },
              { id: '6p_2', suit: 'pin', value: 6 },
              { id: '7p_1', suit: 'pin', value: 7 },
              { id: '8p_1', suit: 'pin', value: 8 },
              { id: '2s_1', suit: 'sou', value: 2 },
              { id: '3s_1', suit: 'sou', value: 3 },
              { id: '4s_1', suit: 'sou', value: 4 },
              { id: '7s_1', suit: 'sou', value: 7 },
            ],
            drawnTile: { id: '7s_2', suit: 'sou', value: 7 },
            discards: [
              { tile: { id: '1z_1', suit: 'honor', value: 1 }, isTsumogiri: false },
              { tile: { id: '9p_1', suit: 'pin', value: 9 }, isTsumogiri: false },
            ],
            melds: [],
            isRiichi: false,
          },
          {
            id: 'player_1',
            name: '下家 (CPU-1)',
            isHuman: false,
            seatWind: 'south',
            score: 25000,
            hand: new Array(13).fill(null).map((_, i) => ({ id: `p1_${i}`, suit: 'man', value: 1 })),
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
            hand: new Array(13).fill(null).map((_, i) => ({ id: `p2_${i}`, suit: 'pin', value: 1 })),
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
            hand: new Array(13).fill(null).map((_, i) => ({ id: `p3_${i}`, suit: 'sou', value: 1 })),
            drawnTile: null,
            discards: [],
            melds: [],
            isRiichi: false,
          },
        ],
      });
    }
  };

  // AIコーチに渡すサニタイズされたプレイヤー視点情報
  const sanitizedContext = sanitizeForPlayer(gameState, 0);

  return (
    <div className="h-[100dvh] w-screen flex flex-col lg:flex-row bg-slate-950 overflow-hidden font-sans relative">
      {/* 1. メイン対局卓エリア */}
      <div
        className={`flex-1 h-full overflow-hidden ${
          mobileTab === 'table' ? 'block' : 'hidden lg:block'
        }`}
      >
        <MahjongTable
          gameState={gameState}
          isAutoPlay={isAutoPlay}
          onStartRound={handleStartRound}
          onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
          onStepForward={handleStepForward}
          onResetGame={handleResetGame}
          onNextRound={handleNextRound}
          onPlayerDiscard={handlePlayerDiscard}
          onDeclareTsumoWin={handleDeclareTsumoWin}
          onResolveAction={handleResolveAction}
          onLoadScenario={handleLoadScenario}
          onOpenCoach={() => setMobileTab('coach')}
        />
      </div>

      {/* 2. AI牌読みコーチングパネル (PC: 常時右ペイン表示 / モバイル: coachタブ時表示) */}
      <div
        className={`w-full lg:w-[400px] xl:w-[440px] h-full flex-shrink-0 ${
          mobileTab === 'coach' ? 'block' : 'hidden lg:block'
        }`}
      >
        <AICoachPanel
          context={sanitizedContext}
          onClose={() => setMobileTab('table')}
        />
      </div>

      {/* 3. モバイル専用ボトムナビゲーションバー */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] pb-safe">
        <button
          type="button"
          onClick={() => setMobileTab('table')}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition font-bold text-xs ${
            mobileTab === 'table'
              ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span>麻雀卓 (盤面)</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('coach')}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl transition font-bold text-xs relative ${
            mobileTab === 'coach'
              ? 'text-amber-400 bg-amber-950/50 border border-amber-800/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span>AI牌読みコーチ</span>
        </button>
      </div>
    </div>
  );
}
