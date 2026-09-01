import React from 'react';
import { Tile } from '../../core/types/tile';
import { getTileSvgPath, getTileNameJa } from '../../core/utils/tileUtils';

interface TileGraphicProps {
  tile?: Tile;
  isBack?: boolean;
  className?: string;
}

/**
 * 麻雀牌の絵柄SVGグラフィック（FluffyStuff/riichi-mahjong-tiles 準拠）
 * 全37種類のパブリックドメインSVGを高精細かつ完全な統一感でレンダリング
 */
export const TileGraphic: React.FC<TileGraphicProps> = ({
  tile,
  isBack = false,
  className = '',
}) => {
  const svgPath = getTileSvgPath(tile, isBack);
  const altName = tile ? getTileNameJa(tile) : (isBack ? '裏面' : '牌');

  return (
    <img
      src={svgPath}
      alt={altName}
      draggable={false}
      className={`w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${className}`}
      loading="eager"
    />
  );
};

