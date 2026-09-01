import React, { useState } from 'react';
import { AISettings, AIProvider } from '../ai/services/types';
import { loadAISettings, saveAISettings } from '../ai/services/storage';
import { Settings, Key, Sparkles, Terminal, Shield, ExternalLink, Check, Eye, EyeOff } from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [settings, setSettings] = useState<AISettings>(loadAISettings());
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveAISettings(settings);
    setSavedSuccess(true);
    if (onSaved) onSaved(updated);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                AI牌読みコーチ設定
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  BYOK / クラウド対応
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                お好みのAIバックエンド（Gemini / Claude / ローカルCLI / ルールベース）を設定できます
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* 設定フォーム */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-slate-200">
          {/* プライバシー安心ガイド */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-emerald-200">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <div className="font-bold text-emerald-300">APIキーはブラウザにのみ安全に保存されます</div>
              <div className="text-[11px] text-emerald-200/80">
                入力したAPIキーは外部のサーバーに送信されず、お使いのブラウザ（localStorage）に保存され、公式APIへ直接HTTPS通信されます。
              </div>
            </div>
          </div>

          {/* AIプロバイダー選択 */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-300">優先AIプロバイダー</label>
            <select
              value={settings.preferredProvider}
              onChange={(e) => setSettings({ ...settings, preferredProvider: e.target.value as AIProvider })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="auto">✨ 自動選択 (設定済みのAPIキー / ローカルCLI / ルールベースを最適選択)</option>
              <option value="gemini_direct">🌟 Google Gemini Direct API (ブラウザ直接呼び出し・無料枠大)</option>
              <option value="claude_direct">🧠 Anthropic Claude Direct API (ブラウザ直接呼び出し)</option>
              <option value="agy">💻 Antigravity CLI (ローカル agy コマンド連携)</option>
              <option value="claude_cli">💻 Claude Code CLI (ローカル claude コマンド連携)</option>
              <option value="rule_based">⚡ ルールベース牌読みエンジン (完全オフライン・API不要・即時回答)</option>
            </select>
          </div>

          {/* Google Gemini API 設定 */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-slate-100 text-xs">Google Gemini API (推奨)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  無料枠 1日1500回
                </span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
              >
                無料キーを取得 <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">モデル選択</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (推奨・超高速)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (高速)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (高精度推論)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anthropic Claude API 設定 */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-100 text-xs">Anthropic Claude API</span>
              </div>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
              >
                APIキーを取得 <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">Claude API Key</label>
              <div className="relative">
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  value={settings.claudeApiKey}
                  onChange={(e) => setSettings({ ...settings, claudeApiKey: e.target.value })}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showClaudeKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">モデル選択</label>
              <select
                value={settings.claudeModel}
                onChange={(e) => setSettings({ ...settings, claudeModel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="claude-3-5-haiku-20241022">claude-3-5-haiku (推奨・高速・低コスト)</option>
                <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet (最高峰の推論精度)</option>
              </select>
            </div>
          </div>

          {/* ローカルCLI & オフラインの説明 */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              ローカル開発・オフラインについて
            </div>
            <div>
              APIキーを入力しなくても、組み込みの<strong>「ルールベース牌読みエンジン」</strong>により、現物・スジ・壁・シャンテン数・受け入れ最大打牌・符計算解説が即座に動作します。
            </div>
          </div>

          {/* フッター操作ボタン */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs font-semibold"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  保存しました！
                </>
              ) : (
                '設定を保存'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
