import React from 'react';
import { GameState } from '../../core/types/game';
import { MahjongTile } from '../tiles/MahjongTile';
import { StickView } from './StickView';
import { Layers, Flame } from 'lucide-react';

interface CenterSquareProps {
  gameState: GameState;
}

export const CenterSquare: React.FC<CenterSquareProps> = ({ gameState }) => {
  const {
    roundWind,
    roundNumber,
    honba,
    riichiSticks,
    doraMarkers,
    activePlayerIndex,
    wall,
    turnCount,
    lastDiscard,
  } = gameState;

  // 風の日本語表記
  const getWindJa = (wind: string) => (wind === 'east' ? '東' : '南');

  // 王牌（14枚 / 7列×2段）のレンダリング
  const renderDeadWall = () => {
    return (
      <div className="flex flex-col gap-0.5 bg-emerald-950/80 p-1 sm:p-1.5 rounded-lg border border-emerald-700/60 shadow-inner">
        {/* モバイル時はドラ表示牌中心にスリム表示 */}
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-emerald-300 font-bold px-0.5 mb-0.5">
          <span className="flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
            ドラ表示
          </span>
          <span className="text-[8px] sm:text-[9px] text-emerald-400/80 font-mono">王牌14枚</span>
        </div>

        {/* ドラ牌行 */}
        <div className="flex gap-0.5 sm:gap-1 items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => {
            const doraTile = doraMarkers[i];
            if (doraTile) {
              return (
                <div key={i} className="relative ring-1 ring-amber-400 rounded-[2px]">
                  <MahjongTile tile={doraTile} size="xs" />
                </div>
              );
            }
            return <MahjongTile key={i} size="xs" hidden={true} />;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[170px] min-[390px]:max-w-[190px] sm:max-w-[240px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-xl sm:rounded-2xl border-2 border-emerald-600/60 shadow-2xl p-1 sm:p-2 flex flex-col items-center justify-between gap-0.5 sm:gap-1.5 select-none">
      {/* 4方向の手番点灯インジケーター（東西南北） */}
      {/* 奥: 対面 (player 2) */}
      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] font-bold">
        <span
          className={`px-1 py-0.2 rounded transition-all ${
            activePlayerIndex === 2
              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          対面
        </span>
      </div>

      {/* 左: 上家 (player 3) */}
      <div className="absolute left-0.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] font-bold">
        <span
          className={`px-1 py-0.2 rounded transition-all ${
            activePlayerIndex === 3
              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          上家
        </span>
      </div>

      {/* 右: 下家 (player 1) */}
      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] font-bold">
        <span
          className={`px-1 py-0.2 rounded transition-all ${
            activePlayerIndex === 1
              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          下家
        </span>
      </div>

      {/* 手前: 自家 (player 0) */}
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] font-bold">
        <span
          className={`px-1 py-0.2 rounded transition-all ${
            activePlayerIndex === 0
              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          自家
        </span>
      </div>

      {/* 1. 局数 & 局ステータス */}
      <div className="mt-2 text-center">
        <div className="text-xs sm:text-sm font-black text-amber-400 flex items-center justify-center gap-1 drop-shadow">
          <span>{getWindJa(roundWind)}{roundNumber}局</span>
          {honba > 0 && (
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-300">
              ({honba}本場)
            </span>
          )}
        </div>
        <div className="text-[8px] sm:text-[9px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
          <span className="flex items-center gap-0.5 text-emerald-400">
            <Layers className="w-2.5 h-2.5" />
            残<span className="font-mono font-bold text-white">{wall.length}</span>
          </span>
          <span>•</span>
          <span>{turnCount}巡</span>
        </div>
      </div>

      {/* 2. ドラ表示・カン山 */}
      {renderDeadWall()}

      {/* 3. 供託エリア（リーチ棒・本場棒） */}
      <div className="w-full flex flex-col items-center justify-center gap-0.5 bg-slate-950/90 py-0.5 px-1 rounded border border-slate-800">
        <div className="flex items-center justify-around w-full gap-1 min-h-[14px]">
          {/* リーチ棒（供託） */}
          {riichiSticks > 0 ? (
            <div className="flex items-center gap-1" title={`供託リーチ棒: ${riichiSticks * 1000}点`}>
              <StickView type="1000" count={riichiSticks} orientation="horizontal" />
            </div>
          ) : (
            <span className="text-[7px] sm:text-[8px] text-slate-600">供託なし</span>
          )}

          {/* 本場棒（積み棒） */}
          {honba > 0 && (
            <div className="flex items-center gap-1" title={`積み棒: ${honba}本場`}>
              <StickView type="100" count={honba} orientation="horizontal" />
            </div>
          )}
        </div>

        {/* 直前の捨て牌プレビュー */}
        {lastDiscard && (
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-400 border-t border-slate-800/80 pt-0.5 w-full justify-center">
            <span>直前:</span>
            <MahjongTile tile={lastDiscard.tile} size="xs" />
          </div>
        )}
      </div>

      {/* 局終了時のメッセージ */}
      {gameState.roundResult && (
        <div className="mb-1 px-1.5 py-0.2 bg-rose-600/30 border border-rose-500 text-rose-200 text-[8px] sm:text-[9px] font-bold rounded animate-pulse">
          {gameState.roundResult.message}
        </div>
      )}
    </div>
  );
};
