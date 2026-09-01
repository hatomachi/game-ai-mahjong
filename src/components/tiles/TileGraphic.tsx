import React from 'react';
import { Tile } from '../../core/types/tile';
import { getTileImagePath, getTileNameJa } from '../../core/utils/tileUtils';

interface TileGraphicProps {
  tile?: Tile;
  isBack?: boolean;
  className?: string;
}

/**
 * 麻雀牌グラフィックコンポーネント（白牌立体背景合成済み・超軽量高速PNG）
 * スマホからPCまで高精細かつ完全な統一感でレンダリング
 */
export const TileGraphic: React.FC<TileGraphicProps> = ({
  tile,
  isBack = false,
  className = '',
}) => {
  const imagePath = getTileImagePath(tile, isBack);
  const altName = tile ? getTileNameJa(tile) : (isBack ? '裏面' : '牌');

  return (
    <img
      src={imagePath}
      alt={altName}
      draggable={false}
      className={`w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${className}`}
      loading="eager"
    />
  );
};

