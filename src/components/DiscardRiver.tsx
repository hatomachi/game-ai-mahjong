import React from 'react';
import { DiscardTile } from '../core/types/tile';
import { PlayerRiver, RiverPosition } from './table/PlayerRiver';

interface DiscardRiverProps {
  discards: DiscardTile[];
  playerName: string;
  isCurrentPlayer?: boolean;
  position?: RiverPosition;
}

export const DiscardRiver: React.FC<DiscardRiverProps> = ({
  discards,
  playerName,
  isCurrentPlayer = false,
  position = 'bottom',
}) => {
  return (
    <PlayerRiver
      discards={discards}
      playerName={playerName}
      isCurrentPlayer={isCurrentPlayer}
      position={position}
      size="sm"
    />
  );
};
