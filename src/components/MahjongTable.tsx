import React from 'react';
import { GameState } from '../core/types/game';
import { TileView } from './TileView';
import { HandView } from './HandView';
import { DiscardRiver } from './DiscardRiver';
import { GameControls } from './GameControls';
import { MeldsView } from './MeldsView';
import { ActionDialog } from './ActionDialog';
import { RoundResultModal } from './RoundResultModal';
import { User, Cpu, Flame, Layers, Zap } from 'lucide-react';
import { ChiOption } from '../core/meld/meldChecker';

interface MahjongTableProps {
  gameState: GameState;
  isAutoPlay: boolean;
  onStartRound: () => void;
  onToggleAutoPlay: () => void;
  onStepForward: () => void;
  onResetGame: () => void;
  onNextRound: () => void;
  onPlayerDiscard: (tileId: string, isTsumo: boolean, declareRiichi?: boolean) => void;
  onDeclareTsumoWin: () => void;
  onResolveAction: (
    actionType: 'ron' | 'pon' | 'chi' | 'daiminkan' | 'pass',
    selectedChiOption?: ChiOption
  ) => void;
  onLoadScenario?: (scenario: 'riichi_defense' | 'tenpai_choice') => void;
}

export const MahjongTable: React.FC<MahjongTableProps> = ({
  gameState,
  isAutoPlay,
  onStartRound,
  onToggleAutoPlay,
  onStepForward,
  onResetGame,
  onNextRound,
  onPlayerDiscard,
  onDeclareTsumoWin,
  onResolveAction,
  onLoadScenario,
}) => {
  const me = gameState.players[0];
  const shimocha = gameState.players[1]; // 下家 (右)
  const toimen = gameState.players[2];   // 対面 (上)
  const kamicha = gameState.players[3];  // 上家 (左)

  const isMyTurn = gameState.activePlayerIndex === 0 && gameState.phase === 'player_turn';

  const getWindJa = (wind: string) => {
    switch (wind) {
      case 'east': return '東';
      case 'south': return '南';
      case 'west': return '西';
      case 'north': return '北';
      default: return wind;
    }
  };

  const humanPendingAction = gameState.pendingActions?.find((a) => a.playerIndex === 0);

  // 伏せ牌を描画するヘルパー
  const renderHiddenTiles = (count: number, hasDrawn: boolean = false) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-6 bg-gradient-to-b from-amber-700 to-amber-900 rounded-sm border border-amber-950 shadow-sm"
          />
        ))}
        {hasDrawn && (
          <div className="w-4 h-6 ml-1.5 bg-gradient-to-b from-amber-600 to-amber-800 rounded-sm border border-amber-500 shadow-md ring-1 ring-amber-400" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-3 space-y-3 overflow-y-auto relative">
      {/* 1. 上部コントロール & 局情報バー */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="font-black text-base text-amber-400 flex items-center gap-1.5 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-600/40">
            <span>
              {gameState.roundWind === 'east' ? '東' : '南'}
              {gameState.roundNumber}局
            </span>
            <span className="text-xs font-normal text-slate-400">
              ({gameState.honba}本場)
            </span>
          </div>

          {/* 供託リーチ棒表示 */}
          {gameState.riichiSticks > 0 && (
            <div className="flex items-center gap-1 bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-600/50 text-rose-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>供託: {gameState.riichiSticks * 1000}点</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              ドラ:
            </span>
            <div className="flex gap-1">
              {gameState.doraMarkers.length > 0 ? (
                gameState.doraMarkers.map((d, i) => (
                  <TileView key={i} tile={d} size="sm" />
                ))
              ) : (
                <span className="text-[10px] text-slate-600">未設定</span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              残り山:
              <span className="font-mono text-emerald-400 font-bold">
                {gameState.wall.length}
              </span>
              枚
            </span>
            <span>/</span>
            <span>
              巡目: <span className="font-mono text-slate-200 font-bold">{gameState.turnCount}</span>
            </span>
          </div>
        </div>

        {/* コントロールボタン群 */}
        <div className="flex items-center gap-2">
          <GameControls
            phase={gameState.phase}
            isAutoPlay={isAutoPlay}
            onStartRound={onStartRound}
            onToggleAutoPlay={onToggleAutoPlay}
            onStepForward={onStepForward}
            onResetGame={onResetGame}
            onNextRound={onNextRound}
          />

          {onLoadScenario && (
            <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-800 pl-2">
              <button
                type="button"
                onClick={() => onLoadScenario('riichi_defense')}
                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-[11px] transition"
              >
                牌読み
              </button>
              <button
                type="button"
                onClick={() => onLoadScenario('tenpai_choice')}
                className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded text-[11px] transition"
              >
                何切る
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 四方麻雀卓グラフィック */}
      <div className="relative flex-1 min-h-[440px] rounded-2xl bg-gradient-to-b from-[#184427] to-[#102e1a] border-4 border-amber-950 shadow-inner p-3 flex flex-col justify-between">
        {/* (A) 対面 (CPU-2) - 上側 */}
        <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2 px-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded border transition-colors ${
                gameState.activePlayerIndex === 2
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/50'
                  : 'bg-emerald-950 border-emerald-700/50 text-emerald-400'
              }`}
            >
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <span>{toimen.name} ({getWindJa(toimen.seatWind)}家)</span>
                {toimen.isRiichi && (
                  <span className="bg-rose-600 text-white text-[8px] px-1 rounded animate-pulse font-black">
                    立直
                  </span>
                )}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono font-bold">
                {toimen.score}点
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 items-end">
              {renderHiddenTiles(toimen.hand.length, !!toimen.drawnTile)}
              <MeldsView melds={toimen.melds} size="sm" />
            </div>
            <div className="w-44">
              <DiscardRiver
                discards={toimen.discards}
                playerName={toimen.name}
                isCurrentPlayer={gameState.activePlayerIndex === 2}
              />
            </div>
          </div>
        </div>

        {/* (B) 卓中央: 上家(左) - 中央卓情報 - 下家(右) */}
        <div className="grid grid-cols-12 gap-2 my-2 items-center">
          {/* 上家 (CPU-3 / 左) */}
          <div className="col-span-4 flex flex-col gap-1.5 p-2 bg-emerald-950/40 rounded-xl border border-emerald-800/30">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-100">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                {kamicha.name} ({getWindJa(kamicha.seatWind)}家)
              </span>
              <div className="flex items-center gap-1">
                {kamicha.isRiichi && (
                  <span className="bg-rose-600 text-white text-[8px] px-1 rounded animate-pulse font-black">
                    立直
                  </span>
                )}
                <span className="font-mono text-[10px] text-emerald-400">{kamicha.score}点</span>
              </div>
            </div>
            <div className="py-1 flex flex-col gap-1">
              {renderHiddenTiles(kamicha.hand.length, !!kamicha.drawnTile)}
              <MeldsView melds={kamicha.melds} size="sm" />
            </div>
            <DiscardRiver
              discards={kamicha.discards}
              playerName={kamicha.name}
              isCurrentPlayer={gameState.activePlayerIndex === 3}
            />
          </div>

          {/* 中央卓情報パネル */}
          <div className="col-span-4 flex flex-col items-center justify-center p-3 bg-slate-950/80 rounded-xl border border-emerald-700/50 shadow-lg text-center space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              Mahjong Arena
            </div>
            <div className="text-sm font-black text-amber-300">
              {gameState.roundWind === 'east' ? '東' : '南'}
              {gameState.roundNumber}局
            </div>
            <div className="text-[11px] text-slate-400">
              手番: <span className="font-bold text-amber-400">{gameState.players[gameState.activePlayerIndex]?.name}</span>
            </div>
            {gameState.lastDiscard && (
              <div className="text-[10px] text-slate-300 flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 mt-1">
                <span>直前の捨て牌:</span>
                <TileView tile={gameState.lastDiscard.tile} size="sm" />
              </div>
            )}
            {gameState.roundResult && (
              <div className="mt-2 px-3 py-1 bg-rose-600/30 border border-rose-500 text-rose-200 text-xs font-bold rounded-lg animate-pulse">
                {gameState.roundResult.message}
              </div>
            )}
          </div>

          {/* 下家 (CPU-1 / 右) */}
          <div className="col-span-4 flex flex-col gap-1.5 p-2 bg-emerald-950/40 rounded-xl border border-emerald-800/30">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-100">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                {shimocha.name} ({getWindJa(shimocha.seatWind)}家)
              </span>
              <div className="flex items-center gap-1">
                {shimocha.isRiichi && (
                  <span className="bg-rose-600 text-white text-[8px] px-1 rounded animate-pulse font-black">
                    立直
                  </span>
                )}
                <span className="font-mono text-[10px] text-emerald-400">{shimocha.score}点</span>
              </div>
            </div>
            <div className="py-1 flex flex-col gap-1">
              {renderHiddenTiles(shimocha.hand.length, !!shimocha.drawnTile)}
              <MeldsView melds={shimocha.melds} size="sm" />
            </div>
            <DiscardRiver
              discards={shimocha.discards}
              playerName={shimocha.name}
              isCurrentPlayer={gameState.activePlayerIndex === 1}
            />
          </div>
        </div>

        {/* (C) 自家の河 (手前) */}
        <div className="w-full max-w-lg mx-auto mb-1">
          <DiscardRiver
            discards={me.discards}
            playerName="自家 (あなた) の河"
            isCurrentPlayer={gameState.activePlayerIndex === 0}
          />
        </div>

        {/* 3. 自家の手牌・ツモ牌操作エリア (下部) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-900/60 text-blue-300 rounded border border-blue-500/40">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-100">
                自家 ({getWindJa(me.seatWind)}家)
              </span>
              {me.isRiichi && (
                <span className="bg-rose-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black animate-pulse">
                  立直中
                </span>
              )}
              <span className="text-xs font-mono text-amber-400 font-bold">
                {me.score}点
              </span>
            </div>

            {/* 自家の副露牌 */}
            {me.melds.length > 0 && <MeldsView melds={me.melds} size="sm" />}
          </div>

          <HandView
            player={me}
            isMyTurn={isMyTurn}
            onDiscard={onPlayerDiscard}
            onDeclareTsumoWin={onDeclareTsumoWin}
          />
        </div>
      </div>

      {/* 4. 他家の打牌に対するアクション選択ダイアログ */}
      {humanPendingAction && gameState.phase === 'waiting_action' && (
        <ActionDialog
          pendingAction={humanPendingAction}
          onResolveAction={onResolveAction}
        />
      )}

      {/* 5. 局終了・ゲーム終了リザルトモーダル */}
      {(gameState.phase === 'round_end' || gameState.phase === 'game_over') && (
        <RoundResultModal
          gameState={gameState}
          onNextRound={onNextRound}
          onResetGame={onResetGame}
        />
      )}
    </div>
  );
};
