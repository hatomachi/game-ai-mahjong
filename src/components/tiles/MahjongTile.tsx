import React from 'react';
import { Tile } from '../../core/types/tile';
import { TileGraphic } from './TileGraphic';
import { getTileNameJa } from '../../core/utils/tileUtils';

export type TileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TileOrientation = 'up' | 'down' | 'left' | 'right' | 'horizontal';

interface MahjongTileProps {
  tile?: Tile;
  size?: TileSize;
  orientation?: TileOrientation;
  hidden?: boolean;
  isStanding?: boolean; // 立っている伏せ牌（他家の手牌など）
  isSelected?: boolean;
  isDrawn?: boolean;
  isRiichiDeclaration?: boolean;
  isTsumogiri?: boolean;
  isCalled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MahjongTile: React.FC<MahjongTileProps> = ({
  tile,
  size = 'md',
  orientation = 'up',
  hidden = false,
  isStanding = false,
  isSelected = false,
  isDrawn = false,
  isRiichiDeclaration = false,
  isTsumogiri = false,
  isCalled = false,
  onClick,
  className = '',
}) => {
  // サイズごとの寸法（縦向き基準: 幅 × 高さ）
  const sizeMap: Record<TileSize, { w: string; h: string; text: string; radius: string; depth: string }> = {
    xs: { w: 'w-[18px]', h: 'h-[24px]', text: 'text-[9px]', radius: 'rounded-[2px]', depth: 'border-b-[2px]' },
    sm: { w: 'w-[24px]', h: 'h-[33px]', text: 'text-[11px]', radius: 'rounded-[3px]', depth: 'border-b-[3px]' },
    md: { w: 'w-[30px]', h: 'h-[41px]', text: 'text-xs', radius: 'rounded-[4px]', depth: 'border-b-[3px]' },
    lg: { w: 'w-[38px]', h: 'h-[52px]', text: 'text-sm', radius: 'rounded-[5px]', depth: 'border-b-[4px]' },
    xl: { w: 'w-[44px]', h: 'h-[60px]', text: 'text-base', radius: 'rounded-[6px]', depth: 'border-b-[5px]' },
  };

  const s = sizeMap[size];
  const tileName = tile ? getTileNameJa(tile) : '伏せ牌';

  // 伏せ牌（背面）のレンダリング
  if (hidden || !tile) {
    if (isStanding) {
      // 立っている伏せ牌（他家手牌など）: 上部に黄色樹脂、下部に白樹脂のツートン
      return (
        <div
          className={`relative ${s.w} ${s.h} ${s.radius} bg-gradient-to-b from-[#d99b26] via-[#c68918] to-[#f4eee1] border border-amber-950/70 shadow-md ${s.depth} border-b-amber-950 flex flex-col justify-between overflow-hidden select-none ${className}`}
        >
          {/* 竹目調テクスチャライン */}
          <div className="w-full h-3/4 bg-gradient-to-b from-[#dfa433] to-[#b37812] border-b border-amber-950/40 relative">
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,#fff,#fff_1px,transparent_1px,transparent_4px)]" />
          </div>
          {/* 下部白面 */}
          <div className="w-full h-1/4 bg-[#f8f5ee]" />
        </div>
      );
    }

    // 平置き伏せ牌（王牌・カン山の伏せ牌など）
    return (
      <div
        className={`relative ${s.w} ${s.h} ${s.radius} bg-gradient-to-b from-[#e5a835] via-[#cc8e1b] to-[#a36b0c] border border-amber-950/80 shadow-md ${s.depth} border-b-amber-950/90 flex items-center justify-center select-none overflow-hidden ${className}`}
      >
        <div className="w-4/5 h-4/5 rounded-sm border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-900/40 shadow-inner" />
        </div>
      </div>
    );
  }

  // 向きによる変形
  const orientationStyle: React.CSSProperties = {};
  if (orientation === 'down') orientationStyle.transform = 'rotate(180deg)';
  if (orientation === 'left') orientationStyle.transform = 'rotate(90deg)';
  if (orientation === 'right') orientationStyle.transform = 'rotate(-90deg)';
  if (orientation === 'horizontal' || isRiichiDeclaration) orientationStyle.transform = 'rotate(90deg)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={tileName}
      style={orientationStyle}
      className={`relative group ${s.w} ${s.h} ${s.radius} bg-gradient-to-b from-[#fffffb] via-[#faf7ee] to-[#ece7d8] border border-slate-300 shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${
        s.depth
      } border-b-[#c4beac] flex flex-col items-center justify-center p-[2px] select-none transition-all duration-150 ${
        isSelected
          ? '-translate-y-2 ring-2 ring-amber-400 shadow-lg shadow-amber-400/30 z-20'
          : onClick
          ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer'
          : 'cursor-default'
      } ${isCalled ? 'opacity-35 grayscale' : 'opacity-100'} ${className}`}
    >
      {/* 牌の表面（白面） */}
      <div className="w-full h-full rounded-[2px] bg-gradient-to-b from-white/90 to-amber-50/50 flex items-center justify-center relative overflow-hidden">
        <TileGraphic tile={tile} />
      </div>

      {/* ツモ切りインジケーター（河の打牌時） */}
      {isTsumogiri && !isCalled && (
        <span
          className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-sky-400 rounded-full ring-1 ring-slate-900 shadow"
          title="ツモ切り"
        />
      )}

      {/* リーチ宣言牌バッジ */}
      {isRiichiDeclaration && (
        <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[7px] font-black px-0.5 rounded shadow z-10">
          立
        </span>
      )}

      {/* ツモ牌の光彩・インジケーター */}
      {isDrawn && (
        <div className="absolute -inset-0.5 rounded-[4px] ring-2 ring-emerald-400/80 pointer-events-none animate-pulse" />
      )}
    </button>
  );
};
