import { SanitizedPlayerView } from '../types/context';

export type AIProvider =
  | 'auto'
  | 'proxy'
  | 'gemini_direct'
  | 'claude_direct'
  | 'agy'
  | 'claude_cli'
  | 'rule_based';

export interface AISettings {
  preferredProvider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  claudeApiKey: string;
  claudeModel: string;
  customProxyUrl: string;
}

export interface AICoachResponse {
  success: boolean;
  reply: string;
  providerUsed: string;
  modelUsed?: string;
  executionTimeMs: number;
  error?: string;
}

export interface CoachRequestParams {
  question: string;
  context: SanitizedPlayerView;
  settings?: Partial<AISettings>;
}
