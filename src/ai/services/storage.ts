import { AISettings } from './types';

const STORAGE_KEY = 'mahjong_ai_coach_settings_v1';

export interface ModelOption {
  id: string;
  label: string;
  description: string;
}

export const AVAILABLE_GEMINI_MODELS: ModelOption[] = [
  { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash', description: '推奨・高速・最新推論' },
  { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro', description: '最高峰フラッグシップ推論' },
  { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash', description: '超高速・安定' },
  { id: 'gemini-3.7-flash', label: 'gemini-3.7-flash', description: '最先端推論 (思考対応)' },
  { id: 'gemini-1.5-flash', label: 'gemini-1.5-flash', description: '標準' },
];

export const AVAILABLE_CLAUDE_MODELS: ModelOption[] = [
  { id: 'claude-sonnet-5', label: 'claude-sonnet-5', description: '推奨・最新バランス' },
  { id: 'claude-opus-5', label: 'claude-opus-5', description: '最高峰推論' },
  { id: 'claude-haiku-4.5', label: 'claude-haiku-4.5', description: '超高速・低コスト' },
  { id: 'claude-3-7-sonnet-20250219', label: 'claude-3.7-sonnet', description: 'Claude 3.7' },
  { id: 'claude-3-5-sonnet-20241022', label: 'claude-3.5-sonnet', description: 'Claude 3.5' },
];

export const DEFAULT_AI_SETTINGS: AISettings = {
  preferredProvider: 'auto',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  claudeApiKey: '',
  claudeModel: 'claude-sonnet-5',
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
