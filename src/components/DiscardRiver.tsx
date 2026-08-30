import React from 'react';
import { DiscardTile } from '../core/types/tile';
import { TileView } from './TileView';

interface DiscardRiverProps {
  discards: DiscardTile[];
  playerName: string;
  isCurrentPlayer?: boolean;
}

export const DiscardRiver: React.FC<DiscardRiverProps> = ({
  discards,
  playerName,
  isCurrentPlayer = false,
}) => {
  // 麻雀の河は通常 6枚×3段 = 18枚
  const rows: DiscardTile[][] = [[], [], []];
  discards.forEach((d, idx) => {
    const rowIdx = Math.min(2, Math.floor(idx / 6));
    rows[rowIdx].push(d);
  });

  return (
    <div
      className={`flex flex-col gap-1 p-2 rounded-xl border transition-colors ${
        isCurrentPlayer
          ? 'bg-amber-950/20 border-amber-500/50 shadow-sm shadow-amber-500/10'
          : 'bg-slate-950/50 border-slate-800/80'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          {playerName}
          {isCurrentPlayer && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          )}
        </span>
        <span className="text-slate-500 font-mono text-[10px]">
          ({discards.length}枚)
        </span>
      </div>

      <div className="flex flex-col gap-1 min-h-[72px] justify-start bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/60">
        {discards.length === 0 ? (
          <div className="text-[10px] text-slate-600 italic py-2 text-center">
            捨て牌なし
          </div>
        ) : (
          rows.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 items-center min-h-[22px]">
              {row.map((d, cIdx) => {
                const globalIdx = rIdx * 6 + cIdx;
                const isCalled = d.isCalled;
                const isRiichi = d.isRiichiDeclaration;

                return (
                  <div
                    key={globalIdx}
                    className={`relative group transition-opacity ${
                      isCalled ? 'opacity-30 grayscale' : 'opacity-100'
                    } ${isRiichi ? 'transform rotate-90 scale-90 mx-0.5' : ''}`}
                  >
                    <TileView tile={d.tile} size="sm" />
                    {isRiichi && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[7px] px-0.5 rounded font-bold shadow">
                        立
                      </span>
                    )}
                    {d.isTsumogiri && !isCalled && (
                      <span
                        className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-sky-400 rounded-full ring-1 ring-slate-900"
                        title="ツモ切り"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
