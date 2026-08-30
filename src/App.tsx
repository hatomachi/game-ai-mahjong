import { useState } from 'react';
import { SanitizedPlayerView } from './ai/types/context';
import { MockGameBoard } from './components/MockGameBoard';
import { AICoachPanel } from './components/AICoachPanel';

const INITIAL_CONTEXT: SanitizedPlayerView = {
  roundWind: 'east',
  roundNumber: 1,
  honba: 0,
  riichiSticks: 1,
  doraMarkers: [{ id: 'dora_1', suit: 'man', value: 5, isRedDora: false }],
  wallRemainingCount: 48,
  currentTurn: 9,
  myPlayerIndex: 0,
  mySeatWind: 'south',
  myScore: 25000,
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
    { id: '1z_1', suit: 'honor', value: 1 }, // 東
    { id: '1z_2', suit: 'honor', value: 1 }, // 東
    { id: '5z_1', suit: 'honor', value: 5 }, // 白
    { id: '5z_2', suit: 'honor', value: 5 }, // 白
  ],
  myDrawnTile: { id: '8s_2', suit: 'sou', value: 8 },
  myDiscards: [
    { tile: { id: '9p_1', suit: 'pin', value: 9 }, isTsumogiri: false },
    { tile: { id: '1s_1', suit: 'sou', value: 1 }, isTsumogiri: false },
    { tile: { id: '4z_1', suit: 'honor', value: 4 }, isTsumogiri: true },
  ],
  myMelds: [],
  myIsRiichi: false,
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
};

export default function App() {
  const [context, setContext] = useState<SanitizedPlayerView>(INITIAL_CONTEXT);

  return (
    <div className="h-screen w-screen flex bg-slate-950 overflow-hidden font-sans">
      <div className="flex-1 h-full overflow-hidden">
        <MockGameBoard context={context} onContextChange={setContext} />
      </div>

      <div className="w-[420px] h-full flex-shrink-0">
        <AICoachPanel context={context} />
      </div>
    </div>
  );
}
