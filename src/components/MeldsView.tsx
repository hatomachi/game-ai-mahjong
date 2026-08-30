import React from 'react';
import { Meld } from '../core/types/tile';
import { TileView } from './TileView';

interface MeldsViewProps {
  melds: Meld[];
  size?: 'sm' | 'md' | 'lg';
}

export const MeldsView: React.FC<MeldsViewProps> = ({ melds, size = 'sm' }) => {
  if (melds.length === 0) return null;

  const getMeldLabel = (type: Meld['type']) => {
    switch (type) {
      case 'chi': return 'チー';
      case 'pon': return 'ポン';
      case 'daiminkan': return '明槓';
      case 'ankan': return '暗槓';
      case 'kakan': return '加槓';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {melds.map((meld, idx) => (
        <div
          key={idx}
          className="flex items-center bg-slate-950/60 p-1 rounded-lg border border-slate-700/60 shadow-sm"
        >
          <span className="text-[10px] font-bold text-amber-400 mr-1.5 px-1 bg-amber-950/80 rounded border border-amber-600/30">
            {getMeldLabel(meld.type)}
          </span>
          <div className="flex items-center gap-0.5">
            {meld.tiles.map((tile, tIdx) => {
              const isCalled = meld.calledTile && tile.id === meld.calledTile.id;
              return (
                <div
                  key={tIdx}
                  className={`transform ${
                    isCalled ? 'rotate-90 origin-center mx-0.5 scale-90' : ''
                  }`}
                >
                  <TileView tile={tile} size={size} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
