import { describe, it, expect } from 'vitest';
import { buildMahjongCoachPrompt } from '../src/ai/prompt/contextFormatter';
import { SanitizedPlayerView } from '../src/ai/types/context';

describe('contextFormatter', () => {
  it('SanitizedPlayerViewからLLM用プロンプトを正常に生成できる', () => {
    const mockContext: SanitizedPlayerView = {
      roundWind: 'east',
      roundNumber: 1,
      honba: 0,
      riichiSticks: 0,
      doraMarkers: [{ id: 'dora_1', suit: 'man', value: 5 }],
      wallRemainingCount: 70,
      currentTurn: 3,
      myPlayerIndex: 0,
      mySeatWind: 'east',
      myScore: 25000,
      myHand: [
        { id: '1m_1', suit: 'man', value: 1 },
        { id: '2m_1', suit: 'man', value: 2 },
        { id: '3m_1', suit: 'man', value: 3 },
      ],
      myDrawnTile: { id: '4m_1', suit: 'man', value: 4 },
      myDiscards: [{ tile: { id: '9p_1', suit: 'pin', value: 9 }, isTsumogiri: false }],
      myMelds: [],
      myIsRiichi: false,
      opponents: [
        {
          playerIndex: 1,
          name: '南家',
          seatWind: 'south',
          score: 25000,
          discards: [],
          melds: [],
          isRiichi: false,
          handTileCount: 13,
        },
        {
          playerIndex: 2,
          name: '西家',
          seatWind: 'west',
          score: 25000,
          discards: [],
          melds: [],
          isRiichi: false,
          handTileCount: 13,
        },
        {
          playerIndex: 3,
          name: '北家',
          seatWind: 'north',
          score: 25000,
          discards: [],
          melds: [],
          isRiichi: false,
          handTileCount: 13,
        },
      ],
    };

    const prompt = buildMahjongCoachPrompt(mockContext, 'おすすめの打牌は？');

    expect(prompt).toContain('東1局 0本場');
    expect(prompt).toContain('五萬 (ドラ: 六萬)');
    expect(prompt).toContain('一萬[1m] 二萬[2m] 三萬[3m]');
    expect(prompt).toContain('ツモ牌: 四萬[4m]');
    expect(prompt).toContain('おすすめの打牌は？');
    expect(prompt).toContain('不完全情報');
  });
});
