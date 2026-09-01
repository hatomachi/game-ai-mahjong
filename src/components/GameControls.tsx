import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, PlaySquare } from 'lucide-react';
import { GamePhase } from '../core/types/game';

interface GameControlsProps {
  phase: GamePhase;
  isAutoPlay: boolean;
  onStartRound: () => void;
  onToggleAutoPlay: () => void;
  onStepForward: () => void;
  onResetGame: () => void;
  onNextRound?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  phase,
  isAutoPlay,
  onStartRound,
  onToggleAutoPlay,
  onStepForward,
  onResetGame,
  onNextRound,
}) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800 text-xs">
      {phase === 'init' ? (
        <button
          type="button"
          onClick={onStartRound}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition text-[11px] sm:text-xs"
        >
          <PlaySquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>局を開始</span>
        </button>
      ) : phase === 'round_end' ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onNextRound && (
            <button
              type="button"
              onClick={onNextRound}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow transition text-[11px] sm:text-xs"
            >
              <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>次局へ</span>
            </button>
          )}
          <button
            type="button"
            onClick={onStartRound}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition text-[11px] sm:text-xs"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">この局を</span>再配牌
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onToggleAutoPlay}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 font-bold rounded-lg transition shadow text-[11px] sm:text-xs ${
              isAutoPlay
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isAutoPlay ? (
              <>
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>停止</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>自動</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepForward}
            disabled={isAutoPlay}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg transition text-[11px] sm:text-xs"
            title="CPUの手番を1手進める"
          >
            <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>1手</span>
          </button>

          <button
            type="button"
            onClick={onResetGame}
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg transition text-[11px] sm:text-xs"
            title="対局を最初からやり直す"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">リセット</span>
          </button>
        </div>
      )}
    </div>
  );
};
