import { AISettings } from './types';

const STORAGE_KEY = 'mahjong_ai_coach_settings_v1';

export const DEFAULT_AI_SETTINGS: AISettings = {
  preferredProvider: 'auto',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  claudeApiKey: '',
  claudeModel: 'claude-3-5-haiku-20241022',
  customProxyUrl: '',
};

export function loadAISettings(): AISettings {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_AI_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AI_SETTINGS,
      ...parsed,
    };
  } catch (err) {
    console.warn('Failed to load AI settings from localStorage:', err);
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAISettings(settings: Partial<AISettings>): AISettings {
  const current = loadAISettings();
  const updated: AISettings = {
    ...current,
    ...settings,
  };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save AI settings to localStorage:', err);
    }
  }

  return updated;
}
