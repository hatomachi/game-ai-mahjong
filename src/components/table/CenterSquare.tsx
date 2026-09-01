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
  // ドラ表示牌はインデックス 2（3列目上段）、カン1回でインデックス 3（4列目上段）が開く
  const renderDeadWall = () => {
    // 7列の上段・下段
    // doraMarkers[0] -> 3列目上段 (col index 2)
    // doraMarkers[1] -> 4列目上段 (col index 3)
    // doraMarkers[2] -> 5列目上段 (col index 4)
    // doraMarkers[3] -> 6列目上段 (col index 5)
    // doraMarkers[4] -> 7列目上段 (col index 6)

    return (
      <div className="flex flex-col gap-0.5 bg-emerald-950/80 p-1.5 rounded-lg border border-emerald-700/60 shadow-inner">
        <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold px-1 mb-0.5">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            王牌 / ドラ・カン山
          </span>
          <span className="text-[9px] text-emerald-400/80 font-mono">14枚</span>
        </div>

        {/* 上段（7枚） */}
        <div className="flex gap-1 items-center">
          {Array.from({ length: 7 }).map((_, colIdx) => {
            if (colIdx < 2) {
              // 嶺上牌（上段）
              return <MahjongTile key={`top-${colIdx}`} size="xs" hidden={true} />;
            }
            const doraIdx = colIdx - 2;
            const doraTile = doraMarkers[doraIdx];
            if (doraTile) {
              // 開かれたドラ表示牌
              return (
                <div key={`top-${colIdx}`} className="relative ring-1 ring-amber-400 rounded-[2px]">
                  <MahjongTile tile={doraTile} size="xs" />
                </div>
              );
            }
            // 未オープンのカンドラ表示牌（伏せ）
            return <MahjongTile key={`top-${colIdx}`} size="xs" hidden={true} />;
          })}
        </div>

        {/* 下段（7枚: 裏ドラ・嶺上牌下段など全て伏せ） */}
        <div className="flex gap-1 items-center">
          {Array.from({ length: 7 }).map((_, colIdx) => (
            <MahjongTile key={`bottom-${colIdx}`} size="xs" hidden={true} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[220px] min-[390px]:max-w-[240px] sm:max-w-[280px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-xl sm:rounded-2xl border-2 border-emerald-600/60 shadow-2xl p-1.5 sm:p-2.5 flex flex-col items-center justify-between gap-1 sm:gap-2 select-none">
      {/* 4方向の手番点灯インジケーター（東西南北） */}
      {/* 奥: 対面 (player 2) */}
      <div className="absolute top-0.5 sm:top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] sm:text-[9px] font-bold">
        <span
          className={`px-1 sm:px-1.5 py-0.2 rounded transition-all ${
            activePlayerIndex === 2
              ? 'bg-amber-400 text-slate-950 ring-1 sm:ring-2 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          対面
        </span>
      </div>

      {/* 左: 上家 (player 3) */}
      <div className="absolute left-1 sm:left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] sm:text-[9px] font-bold">
        <span
          className={`px-1 sm:px-1.5 py-0.2 rounded transition-all ${
            activePlayerIndex === 3
              ? 'bg-amber-400 text-slate-950 ring-1 sm:ring-2 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          上家
        </span>
      </div>

      {/* 右: 下家 (player 1) */}
      <div className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] sm:text-[9px] font-bold">
        <span
          className={`px-1 sm:px-1.5 py-0.2 rounded transition-all ${
            activePlayerIndex === 1
              ? 'bg-amber-400 text-slate-950 ring-1 sm:ring-2 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          下家
        </span>
      </div>

      {/* 手前: 自家 (player 0) */}
      <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] sm:text-[9px] font-bold">
        <span
          className={`px-1 sm:px-1.5 py-0.2 rounded transition-all ${
            activePlayerIndex === 0
              ? 'bg-amber-400 text-slate-950 ring-1 sm:ring-2 ring-amber-300 animate-pulse font-black scale-105'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          自家
        </span>
      </div>

      {/* 1. 局数 & 局ステータス */}
      <div className="mt-2.5 sm:mt-3 text-center">
        <div className="text-xs sm:text-sm font-black text-amber-400 flex items-center justify-center gap-1 drop-shadow">
          <span>{getWindJa(roundWind)}{roundNumber}局</span>
          {honba > 0 && (
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300">
              ({honba}本場)
            </span>
          )}
        </div>
        <div className="text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-center gap-1.5 mt-0.5">
          <span className="flex items-center gap-0.5 text-emerald-400">
            <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            残<span className="font-mono font-bold text-white">{wall.length}</span>枚
          </span>
          <span>•</span>
          <span>
            {turnCount}巡目
          </span>
        </div>
      </div>

      {/* 2. 王牌 & ドラ表示・カン山 */}
      {renderDeadWall()}

      {/* 3. 供託エリア（リーチ棒・本場棒） */}
      <div className="w-full flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-slate-950/90 py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg border border-slate-800">
        <div className="flex items-center justify-around w-full gap-1 sm:gap-2 min-h-[18px] sm:min-h-[22px]">
          {/* リーチ棒（供託） */}
          {riichiSticks > 0 ? (
            <div className="flex items-center gap-1" title={`供託リーチ棒: ${riichiSticks * 1000}点`}>
              <StickView type="1000" count={riichiSticks} orientation="horizontal" />
            </div>
          ) : (
            <span className="text-[8px] sm:text-[9px] text-slate-600">供託なし</span>
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
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 border-t border-slate-800/80 pt-0.5 sm:pt-1 w-full justify-center">
            <span>直前打牌:</span>
            <MahjongTile tile={lastDiscard.tile} size="xs" />
          </div>
        )}
      </div>

      {/* 局終了時のメッセージ */}
      {gameState.roundResult && (
        <div className="mb-2 sm:mb-3 px-2 py-0.5 bg-rose-600/30 border border-rose-500 text-rose-200 text-[9px] sm:text-[10px] font-bold rounded animate-pulse">
          {gameState.roundResult.message}
        </div>
      )}
    </div>
  );
};
