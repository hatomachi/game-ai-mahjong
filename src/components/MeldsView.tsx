import React from 'react';
import { Meld } from '../core/types/tile';
import { MahjongTile, TileSize } from './tiles/MahjongTile';

interface MeldsViewProps {
  melds: Meld[];
  size?: TileSize;
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
    <div className="flex items-center gap-1.5 flex-wrap select-none">
      {melds.map((meld, idx) => {
        const isAnkan = meld.type === 'ankan';

        return (
          <div
            key={idx}
            className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-emerald-800/60 shadow-md"
          >
            <span className="text-[9px] font-bold text-amber-300 mr-1 px-1 bg-amber-950/80 rounded border border-amber-600/40">
              {getMeldLabel(meld.type)}
            </span>
            <div className="flex items-center gap-0.5">
              {meld.tiles.map((tile, tIdx) => {
                // 暗槓の場合: 1枚目と4枚目は伏せ牌（裏面）、2枚目と3枚目は表向き
                if (isAnkan) {
                  const isHidden = tIdx === 0 || tIdx === 3;
                  return (
                    <MahjongTile
                      key={tIdx}
                      tile={isHidden ? undefined : tile}
                      hidden={isHidden}
                      size={size}
                    />
                  );
                }

                // 鳴かれた牌（calledTile）は横向き
                const isCalled = meld.calledTile && tile.id === meld.calledTile.id;

                return (
                  <div
                    key={tIdx}
                    className={`transform ${
                      isCalled ? 'scale-95 mx-0.5' : ''
                    }`}
                  >
                    <MahjongTile
                      tile={tile}
                      size={size}
                      orientation={isCalled ? 'horizontal' : 'up'}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
