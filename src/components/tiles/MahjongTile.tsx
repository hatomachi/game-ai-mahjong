import React from 'react';
import { Tile } from '../../core/types/tile';
import { TileGraphic } from './TileGraphic';
import { getTileNameJa } from '../../core/utils/tileUtils';

export type TileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
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
  // サイズごとの寸法（縦向き基準: アスペクト比 3:4）
  const sizeMap: Record<TileSize, { w: string; h: string; text: string; radius: string }> = {
    xs: { w: 'w-[18px]', h: 'h-[24px]', text: 'text-[9px]', radius: 'rounded-[2px]' },
    sm: { w: 'w-[24px]', h: 'h-[32px]', text: 'text-[11px]', radius: 'rounded-[3px]' },
    md: { w: 'w-[30px]', h: 'h-[40px]', text: 'text-xs', radius: 'rounded-[4px]' },
    lg: { w: 'w-[38px]', h: 'h-[51px]', text: 'text-sm', radius: 'rounded-[5px]' },
    xl: { w: 'w-[44px]', h: 'h-[59px]', text: 'text-base', radius: 'rounded-[6px]' },
    responsive: {
      w: 'w-[22px] min-[390px]:w-[24px] sm:w-[32px] md:w-[38px]',
      h: 'h-[29px] min-[390px]:h-[32px] sm:h-[43px] md:h-[51px]',
      text: 'text-[10px] sm:text-xs md:text-sm',
      radius: 'rounded-[3px] sm:rounded-[4px] md:rounded-[5px]',
    },
  };

  const s = sizeMap[size];
  const tileName = tile ? getTileNameJa(tile) : '伏せ牌';

  // 向きによる変形
  const orientationStyle: React.CSSProperties = {};
  if (orientation === 'down') orientationStyle.transform = 'rotate(180deg)';
  if (orientation === 'left') orientationStyle.transform = 'rotate(90deg)';
  if (orientation === 'right') orientationStyle.transform = 'rotate(-90deg)';
  if (orientation === 'horizontal' || isRiichiDeclaration) orientationStyle.transform = 'rotate(90deg)';

  // 伏せ牌（背面）のレンダリング
  if (hidden || !tile) {
    return (
      <div
        style={orientationStyle}
        className={`relative ${s.w} ${s.h} ${s.radius} flex items-center justify-center select-none overflow-hidden ${
          isStanding ? 'drop-shadow-md brightness-95' : 'drop-shadow-sm'
        } ${className}`}
      >
        <TileGraphic isBack={true} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={tileName}
      style={orientationStyle}
      className={`relative group ${s.w} ${s.h} ${s.radius} flex items-center justify-center select-none transition-all duration-150 ${
        isSelected
          ? '-translate-y-2 ring-2 ring-amber-400 shadow-lg shadow-amber-400/30 z-20'
          : onClick
          ? 'hover:-translate-y-1 hover:shadow-md cursor-pointer'
          : 'cursor-default'
      } ${isCalled ? 'opacity-35 grayscale' : 'opacity-100'} ${className}`}
    >
      {/* 牌のSVGグラフィック（全37種対応） */}
      <TileGraphic tile={tile} />

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
