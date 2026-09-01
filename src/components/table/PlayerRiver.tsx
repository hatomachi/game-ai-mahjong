import React from 'react';
import { DiscardTile } from '../../core/types/tile';
import { MahjongTile, TileSize } from '../tiles/MahjongTile';

export type RiverPosition = 'bottom' | 'top' | 'left' | 'right';

interface PlayerRiverProps {
  discards: DiscardTile[];
  playerName: string;
  position: RiverPosition;
  isCurrentPlayer?: boolean;
  size?: TileSize;
  className?: string;
}

/**
 * 各プレイヤーの視点・方角に応じた河（捨て牌エリア）コンポーネント
 */
export const PlayerRiver: React.FC<PlayerRiverProps> = ({
  discards,
  playerName,
  position,
  isCurrentPlayer = false,
  size = 'xs',
  className = '',
}) => {
  // 麻雀の河は 6枚×3段（最大18〜24枚）
  const rows: DiscardTile[][] = [[], [], [], []];
  discards.forEach((d, idx) => {
    const rowIdx = Math.min(3, Math.floor(idx / 6));
    rows[rowIdx].push(d);
  });

  // 有効な行のみ抽出（最低3行分は領域確保）
  const activeRows = rows.filter((r, idx) => idx < 3 || r.length > 0);

  return (
    <div
      data-position={position}
      className={`flex flex-col gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-all duration-200 select-none ${
        isCurrentPlayer
          ? 'bg-amber-950/25 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
          : 'bg-emerald-950/40 border-emerald-800/40'
      } ${position === 'left' || position === 'right' ? 'w-full' : ''} ${className}`}
    >
      {/* プレイヤー名 & 捨て牌枚数 */}
      <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-emerald-200 font-bold px-1">
        <span className="flex items-center gap-1 truncate max-w-[100px]">
          {playerName}
          {isCurrentPlayer && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block flex-shrink-0" />
          )}
        </span>
        <span className="text-[8px] sm:text-[9px] text-emerald-400/80 font-mono flex-shrink-0">
          {discards.length}枚
        </span>
      </div>

      {/* 河の牌グリッド */}
      <div className="flex flex-col gap-0.5 min-h-[76px] sm:min-h-[90px] bg-slate-950/60 p-1 sm:p-1.5 rounded-md sm:rounded-lg border border-emerald-900/60 shadow-inner justify-center">
        {discards.length === 0 ? (
          <div className="text-[9px] sm:text-[10px] text-slate-500 italic py-4 text-center">
            捨て牌なし
          </div>
        ) : (
          activeRows.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-0.5 items-center min-h-[30px]">
              {row.map((d, cIdx) => {
                const globalIdx = rIdx * 6 + cIdx;
                const isRiichi = d.isRiichiDeclaration;

                return (
                  <div
                    key={globalIdx}
                    className={`relative transition-transform ${
                      isRiichi ? 'transform origin-center scale-95 mx-0.5' : ''
                    }`}
                  >
                    <MahjongTile
                      tile={d.tile}
                      size={size}
                      isRiichiDeclaration={isRiichi}
                      isTsumogiri={d.isTsumogiri}
                      isCalled={d.isCalled}
                    />
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
