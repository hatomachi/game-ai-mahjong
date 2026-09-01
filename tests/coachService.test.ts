import { describe, it, expect, vi, beforeEach } from 'vitest';
import { askAICoach } from '../src/ai/services/coachService';
import { loadAISettings, saveAISettings } from '../src/ai/services/storage';
import { SanitizedPlayerView } from '../src/ai/types/context';
import { Tile } from '../src/core/types/tile';

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
});

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
    { id: '1m_0', suit: 'man', value: 1 },
    { id: '2m_0', suit: 'man', value: 2 },
    { id: '3m_0', suit: 'man', value: 3 },
    { id: '4p_0', suit: 'pin', value: 4 },
    { id: '5p_0', suit: 'pin', value: 5 },
    { id: '6p_0', suit: 'pin', value: 6 },
    { id: '7s_0', suit: 'sou', value: 7 },
    { id: '8s_0', suit: 'sou', value: 8 },
    { id: '9s_0', suit: 'sou', value: 9 },
    { id: '1z_0', suit: 'honor', value: 1 },
    { id: '1z_1', suit: 'honor', value: 1 },
    { id: '5z_0', suit: 'honor', value: 5 },
    { id: '5z_1', suit: 'honor', value: 5 },
  ] as Tile[],
  myDrawnTile: null,
  myDiscards: [],
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

describe('AI Coach Service & Storage Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Storage', () => {
    it('loads default settings when empty', () => {
      const settings = loadAISettings();
      expect(settings.preferredProvider).toBe('auto');
      expect(settings.geminiModel).toBe('gemini-3.7-flash');
    });

    it('saves and updates settings in localStorage', () => {
      const updated = saveAISettings({
        geminiApiKey: 'test-gemini-key',
        preferredProvider: 'gemini_direct',
      });
      expect(updated.geminiApiKey).toBe('test-gemini-key');
      expect(updated.preferredProvider).toBe('gemini_direct');

      const reloaded = loadAISettings();
      expect(reloaded.geminiApiKey).toBe('test-gemini-key');
    });
  });

  describe('askAICoach Router', () => {
    it('returns rule-based response when provider is rule_based', async () => {
      const res = await askAICoach(mockContext, '何を切るべき？', {
        preferredProvider: 'rule_based',
      });
      expect(res.success).toBe(true);
      expect(res.providerUsed).toContain('ルールベース');
      expect(res.reply.length).toBeGreaterThan(10);
    });

    it('falls back to rule-based when Gemini key is missing', async () => {
      const res = await askAICoach(mockContext, '何を切るべき？', {
        preferredProvider: 'gemini_direct',
        geminiApiKey: '',
      });
      expect(res.success).toBe(true);
      expect(res.providerUsed).toContain('ルールベース');
      expect(res.reply).toContain('Gemini APIキーが未設定のため');
    });

    it('calls Gemini Direct API when key is provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Geminiによるアドバイス: テンパイです！' }],
              },
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const res = await askAICoach(mockContext, '何を切るべき？', {
        preferredProvider: 'gemini_direct',
        geminiApiKey: 'valid-gemini-key',
        geminiModel: 'gemini-2.5-flash',
      });

      expect(res.success).toBe(true);
      expect(res.providerUsed).toContain('Google Gemini');
      expect(res.reply).toBe('Geminiによるアドバイス: テンパイです！');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('calls Claude Direct API when key is provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Claudeによるアドバイス: リーチをかけましょう。' }],
        }),
      });
      global.fetch = mockFetch;

      const res = await askAICoach(mockContext, '何を切るべき？', {
        preferredProvider: 'claude_direct',
        claudeApiKey: 'valid-claude-key',
        claudeModel: 'claude-3-5-haiku-20241022',
      });

      expect(res.success).toBe(true);
      expect(res.providerUsed).toContain('Anthropic Claude');
      expect(res.reply).toBe('Claudeによるアドバイス: リーチをかけましょう。');
    });
  });
});
