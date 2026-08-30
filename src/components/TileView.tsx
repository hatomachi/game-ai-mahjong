import React from 'react';
import { Tile } from '../core/types/tile';
import { getTileNameJa } from '../core/utils/tileUtils';

interface TileViewProps {
  tile: Tile;
  onClick?: () => void;
  isSelected?: boolean;
  isDrawn?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
}

export const TileView: React.FC<TileViewProps> = ({
  tile,
  onClick,
  isSelected = false,
  isDrawn = false,
  size = 'md',
  hidden = false,
}) => {
  if (hidden) {
    // 伏せ牌
    return (
      <div
        className={`rounded border border-blue-900 bg-gradient-to-b from-blue-700 to-blue-950 shadow flex items-center justify-center cursor-default select-none ${
          size === 'sm'
            ? 'w-6 h-9'
            : size === 'lg'
            ? 'w-12 h-16'
            : 'w-8 h-12'
        }`}
      >
        <div className="w-2/3 h-4/5 rounded-sm bg-blue-800 border border-blue-600/30"></div>
      </div>
    );
  }

  const nameJa = getTileNameJa(tile);

  // 牌のスタイル色分け
  const getSuitColor = () => {
    if (tile.isRedDora) return 'text-red-600 font-bold';
    if (tile.suit === 'man') return 'text-rose-700';
    if (tile.suit === 'pin') return 'text-sky-700';
    if (tile.suit === 'sou') return 'text-emerald-700';
    if (tile.suit === 'honor') {
      if (tile.value === 6) return 'text-emerald-600'; // 發
      if (tile.value === 7) return 'text-rose-600';    // 中
      return 'text-slate-800'; // 東南西北白
    }
    return 'text-slate-800';
  };

  const sizeClasses = {
    sm: 'w-7 h-10 text-[10px]',
    md: 'w-9 h-13 text-xs',
    lg: 'w-12 h-16 text-sm',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={nameJa}
      className={`relative rounded-md bg-[#faf6ee] text-slate-900 border-2 shadow-md transition-all duration-150 flex flex-col items-center justify-between p-1 select-none ${
        sizeClasses[size]
      } ${
        isSelected
          ? 'border-amber-400 -translate-y-2 ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900'
          : 'border-amber-100/60 hover:-translate-y-1 hover:border-amber-300'
      } ${isDrawn ? 'ml-3 ring-1 ring-emerald-400/60' : ''}`}
    >
      {/* 牌の頭部（数字または略称） */}
      <span className={`leading-none font-bold ${getSuitColor()}`}>
        {tile.suit === 'honor'
          ? nameJa
          : tile.isRedDora
          ? '赤' + tile.value
          : tile.value}
      </span>

      {/* 牌の中央グラフィック/文字 */}
      <span className={`text-[11px] font-extrabold leading-none ${getSuitColor()}`}>
        {tile.suit === 'man'
          ? '萬'
          : tile.suit === 'pin'
          ? '●'
          : tile.suit === 'sou'
          ? '竹'
          : tile.value === 5
          ? '⬜'
          : nameJa}
      </span>

      {/* 下部マーク */}
      <span className="text-[8px] text-slate-400 font-mono scale-90">
        {tile.suit === 'man' ? 'M' : tile.suit === 'pin' ? 'P' : tile.suit === 'sou' ? 'S' : 'Z'}
      </span>
    </button>
  );
};
