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
    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
      {phase === 'init' ? (
        <button
          type="button"
          onClick={onStartRound}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition"
        >
          <PlaySquare className="w-4 h-4" />
          局を開始する
        </button>
      ) : phase === 'round_end' ? (
        <div className="flex items-center gap-2">
          {onNextRound && (
            <button
              type="button"
              onClick={onNextRound}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow transition"
            >
              <SkipForward className="w-4 h-4" />
              次の局へ進む
            </button>
          )}
          <button
            type="button"
            onClick={onStartRound}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            この局を再配牌
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAutoPlay}
            className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg transition shadow ${
              isAutoPlay
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isAutoPlay ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                一時停止
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                自動進行 (再生)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepForward}
            disabled={isAutoPlay}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg transition"
            title="CPUの手番を1手進める"
          >
            <SkipForward className="w-3.5 h-3.5" />
            1手進める
          </button>

          <button
            type="button"
            onClick={onResetGame}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg transition"
            title="対局を最初からやり直す"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            リセット
          </button>
        </div>
      )}
    </div>
  );
};
