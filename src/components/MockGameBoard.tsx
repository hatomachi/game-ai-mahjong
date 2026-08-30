import React, { useState } from 'react';
import { SanitizedPlayerView } from '../ai/types/context';
import { Tile, DiscardTile } from '../core/types/tile';
import { TileView } from './TileView';
import { sortTiles, getTileNameJa } from '../core/utils/tileUtils';
import { User, Cpu } from 'lucide-react';

interface MockGameBoardProps {
  context: SanitizedPlayerView;
  onContextChange: (newContext: SanitizedPlayerView) => void;
}

export const MockGameBoard: React.FC<MockGameBoardProps> = ({
  context,
  onContextChange,
}) => {
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);

  const handleDiscard = (tile: Tile, isTsumo: boolean = false) => {
    const newHand = isTsumo
      ? [...context.myHand]
      : context.myHand.filter((_, idx) => idx !== selectedTileIndex);

    const newDiscards: DiscardTile[] = [
      ...context.myDiscards,
      {
        tile,
        isTsumogiri: isTsumo,
        isRiichiDeclaration: false,
      },
    ];

    onContextChange({
      ...context,
      myHand: sortTiles(newHand),
      myDrawnTile: null,
      myDiscards: newDiscards,
      currentTurn: context.currentTurn + 1,
      wallRemainingCount: Math.max(0, context.wallRemainingCount - 1),
    });

    setSelectedTileIndex(null);
  };

  const loadScenario = (scenario: 'riichi_defense' | 'tenpai_choice') => {
    if (scenario === 'riichi_defense') {
      onContextChange({
        ...context,
        roundWind: 'east',
        roundNumber: 1,
        honba: 0,
        riichiSticks: 1,
        currentTurn: 9,
        wallRemainingCount: 48,
        doraMarkers: [{ id: 'dora_1', suit: 'man', value: 5, isRedDora: false }],
        myHand: [
          { id: '1m_1', suit: 'man', value: 1 },
          { id: '2m_1', suit: 'man', value: 2 },
          { id: '3m_1', suit: 'man', value: 3 },
          { id: '4p_1', suit: 'pin', value: 4 },
          { id: '5p_1', suit: 'pin', value: 5, isRedDora: true },
          { id: '6p_1', suit: 'pin', value: 6 },
          { id: '7s_1', suit: 'sou', value: 7 },
          { id: '8s_1', suit: 'sou', value: 8 },
          { id: '9s_1', suit: 'sou', value: 9 },
          { id: '1z_1', suit: 'honor', value: 1 },
          { id: '1z_2', suit: 'honor', value: 1 },
          { id: '5z_1', suit: 'honor', value: 5 },
          { id: '5z_2', suit: 'honor', value: 5 },
        ],
        myDrawnTile: { id: '8s_2', suit: 'sou', value: 8 },
        myDiscards: [
          { tile: { id: '9p_1', suit: 'pin', value: 9 }, isTsumogiri: false },
          { tile: { id: '1s_1', suit: 'sou', value: 1 }, isTsumogiri: false },
          { tile: { id: '4z_1', suit: 'honor', value: 4 }, isTsumogiri: true },
        ],
        opponents: [
          {
            playerIndex: 1,
            name: '下家 (CPU-1)',
            seatWind: 'south',
            score: 25000,
            discards: [
              { tile: { id: '1p_1', suit: 'pin', value: 1 }, isTsumogiri: false },
              { tile: { id: '9s_2', suit: 'sou', value: 9 }, isTsumogiri: true },
            ],
            melds: [],
            isRiichi: false,
            handTileCount: 13,
          },
          {
            playerIndex: 2,
            name: '対面 (CPU-2)',
            seatWind: 'west',
            score: 24000,
            discards: [
              { tile: { id: '9m_1', suit: 'man', value: 9 }, isTsumogiri: false },
              { tile: { id: '1p_2', suit: 'pin', value: 1 }, isTsumogiri: false },
              { tile: { id: '2z_1', suit: 'honor', value: 2 }, isTsumogiri: false },
              { tile: { id: '3z_1', suit: 'honor', value: 3 }, isTsumogiri: false },
              { tile: { id: '2p_1', suit: 'pin', value: 2 }, isTsumogiri: false },
              { tile: { id: '7m_1', suit: 'man', value: 7 }, isTsumogiri: false },
              { tile: { id: '5m_1', suit: 'man', value: 5 }, isTsumogiri: false, isRiichiDeclaration: true },
              { tile: { id: '6s_1', suit: 'sou', value: 6 }, isTsumogiri: true },
            ],
            melds: [],
            isRiichi: true,
            riichiTurn: 7,
            handTileCount: 13,
          },
          {
            playerIndex: 3,
            name: '上家 (CPU-3)',
            seatWind: 'north',
            score: 25000,
            discards: [
              { tile: { id: '1m_2', suit: 'man', value: 1 }, isTsumogiri: false },
              { tile: { id: '2m_2', suit: 'man', value: 2 }, isTsumogiri: true },
            ],
            melds: [
              {
                type: 'pon',
                tiles: [
                  { id: '7z_1', suit: 'honor', value: 7 },
                  { id: '7z_2', suit: 'honor', value: 7 },
                  { id: '7z_3', suit: 'honor', value: 7 },
                ],
                fromPlayerIndex: 1,
                calledTile: { id: '7z_1', suit: 'honor', value: 7 },
              },
            ],
            isRiichi: false,
            handTileCount: 10,
          },
        ],
      });
    } else if (scenario === 'tenpai_choice') {
      onContextChange({
        ...context,
        roundWind: 'east',
        roundNumber: 2,
        honba: 1,
        currentTurn: 6,
        doraMarkers: [{ id: 'dora_2', suit: 'pin', value: 3 }],
        myHand: [
          { id: '2m_1', suit: 'man', value: 2 },
          { id: '3m_1', suit: 'man', value: 3 },
          { id: '4m_1', suit: 'man', value: 4 },
          { id: '4p_1', suit: 'pin', value: 4 },
          { id: '5p_1', suit: 'pin', value: 5 },
          { id: '6p_1', suit: 'pin', value: 6 },
          { id: '6p_2', suit: 'pin', value: 6 },
          { id: '7p_1', suit: 'pin', value: 7 },
          { id: '8p_1', suit: 'pin', value: 8 },
          { id: '2s_1', suit: 'sou', value: 2 },
          { id: '3s_1', suit: 'sou', value: 3 },
          { id: '4s_1', suit: 'sou', value: 4 },
          { id: '7s_1', suit: 'sou', value: 7 },
        ],
        myDrawnTile: { id: '7s_2', suit: 'sou', value: 7 },
      });
    }
  };

  const renderDiscards = (discards: DiscardTile[], playerName: string) => (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
        <span>{playerName}の河:</span>
        <span className="text-slate-500 font-mono">({discards.length}枚)</span>
      </div>
      <div className="flex flex-wrap gap-1 min-h-[36px] bg-slate-950/40 p-1.5 rounded border border-slate-800/80">
        {discards.length === 0 ? (
          <span className="text-[10px] text-slate-600 italic">捨て牌なし</span>
        ) : (
          discards.map((d, i) => (
            <div key={i} className="relative group">
              <TileView tile={d.tile} size="sm" />
              {d.isRiichiDeclaration && (
                <span className="absolute -top-1.5 -right-1 bg-red-600 text-white text-[8px] px-0.5 rounded font-bold">
                  立
                </span>
              )}
              {d.isTsumogiri && (
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-sky-400 rounded-full" title="ツモ切り" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4 text-xs">
          <div className="font-bold text-base text-amber-400 flex items-center gap-1.5">
            <span>{context.roundWind === 'east' ? '東' : '南'}{context.roundNumber}局</span>
            <span className="text-xs font-normal text-slate-400">({context.honba}本場)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">ドラ表示:</span>
            <div className="flex gap-1">
              {context.doraMarkers.map((d, i) => (
                <TileView key={i} tile={d} size="sm" />
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            残り山: <span className="font-mono text-emerald-400 font-bold">{context.wallRemainingCount}</span> 枚 / 
            巡目: <span className="font-mono text-slate-200">{context.currentTurn}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px]">テスト局面:</span>
          <button
            type="button"
            onClick={() => loadScenario('riichi_defense')}
            className="px-2.5 py-1 bg-rose-900/40 hover:bg-rose-800/60 border border-rose-700/60 text-rose-300 rounded text-xs transition"
          >
            対面リーチ(牌読み)
          </button>
          <button
            type="button"
            onClick={() => loadScenario('tenpai_choice')}
            className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/60 text-amber-300 rounded text-xs transition"
          >
            テンパイ何切る
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-[360px] rounded-2xl bg-gradient-to-b from-[#1a472a] to-[#12331e] border-4 border-amber-950 shadow-inner p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-950 rounded border border-emerald-700/50 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                {context.opponents[1].name}
                {context.opponents[1].isRiichi && (
                  <span className="bg-red-600 text-white text-[9px] px-1 rounded animate-pulse">
                    🚨 立直 ({context.opponents[1].riichiTurn}巡目)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                {context.opponents[1].score}点
              </div>
            </div>
          </div>
          <div className="w-1/2">
            {renderDiscards(context.opponents[1].discards, context.opponents[1].name)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 my-2">
          <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800/30">
            <div className="text-xs font-bold text-emerald-200 mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              {context.opponents[2].name} ({context.opponents[2].score}点)
            </div>
            {renderDiscards(context.opponents[2].discards, context.opponents[2].name)}
          </div>

          <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800/30">
            <div className="text-xs font-bold text-emerald-200 mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              {context.opponents[0].name} ({context.opponents[0].score}点)
            </div>
            {renderDiscards(context.opponents[0].discards, context.opponents[0].name)}
          </div>
        </div>

        <div className="mb-2">
          {renderDiscards(context.myDiscards, '自家 (あなた)')}
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-600/40 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-900/60 text-blue-300 rounded border border-blue-500/40">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-100">自家 (南家)</span>
              <span className="text-xs font-mono text-amber-400 font-bold">{context.myScore}点</span>
            </div>

            <div className="flex items-center gap-2">
              {selectedTileIndex !== null && (
                <button
                  type="button"
                  onClick={() => handleDiscard(context.myHand[selectedTileIndex])}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow transition"
                >
                  【{getTileNameJa(context.myHand[selectedTileIndex])}】を切る
                </button>
              )}
              {context.myDrawnTile && (
                <button
                  type="button"
                  onClick={() => handleDiscard(context.myDrawnTile!, true)}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold shadow transition"
                >
                  ツモ切り
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 py-1">
            {context.myHand.map((tile, idx) => (
              <TileView
                key={tile.id || idx}
                tile={tile}
                isSelected={selectedTileIndex === idx}
                onClick={() => setSelectedTileIndex(selectedTileIndex === idx ? null : idx)}
                size="lg"
              />
            ))}

            {context.myDrawnTile && (
              <div className="flex items-center">
                <span className="text-emerald-400 font-bold text-xs mx-1">ツモ→</span>
                <TileView
                  tile={context.myDrawnTile}
                  isDrawn={true}
                  size="lg"
                  onClick={() => handleDiscard(context.myDrawnTile!, true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
