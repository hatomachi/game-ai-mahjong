import React from 'react';
import { Tile } from '../core/types/tile';
import { MahjongTile, TileSize } from './tiles/MahjongTile';

interface TileViewProps {
  tile: Tile;
  onClick?: () => void;
  isSelected?: boolean;
  isDrawn?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
  className?: string;
}

/**
 * 既存コンポーネントとの後方互換ラッパー
 */
export const TileView: React.FC<TileViewProps> = ({
  tile,
  onClick,
  isSelected = false,
  isDrawn = false,
  size = 'md',
  hidden = false,
  className = '',
}) => {
  return (
    <MahjongTile
      tile={tile}
      size={size as TileSize}
      isSelected={isSelected}
      isDrawn={isDrawn}
      hidden={hidden}
      onClick={onClick}
      className={className}
    />
  );
};
