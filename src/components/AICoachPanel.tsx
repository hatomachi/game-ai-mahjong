import React, { useState, useEffect, useRef } from 'react';
import { SanitizedPlayerView } from '../ai/types/context';
import { buildMahjongCoachPrompt } from '../ai/prompt/contextFormatter';
import { askAICoach, checkLocalServerStatus } from '../ai/services/coachService';
import {
  loadAISettings,
  saveAISettings,
  AVAILABLE_GEMINI_MODELS,
  AVAILABLE_CLAUDE_MODELS,
} from '../ai/services/storage';
import { AISettings } from '../ai/services/types';
import { AISettingsModal } from './AISettingsModal';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Calculator,
  Flame,
  RefreshCw,
  Code,
  CheckCircle,
  Settings,
  Hand,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  backendUsed?: string;
  timestamp: string;
}

interface AICoachPanelProps {
  context: SanitizedPlayerView;
  onClose?: () => void;
  onQuestionAsked?: () => void;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({ context, onClose, onQuestionAsked }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'system',
      text: '🀄 **専属AI牌読みコーチ** が待機しています。\n対局中の局面について、「おすすめの打牌」「危険牌分析」「点数・符計算」「押し引き」など何でも質問してください。\n\n※ 上記の入力バーまたは ⚙️ 設定から Google Gemini / Claude のAPIキーを設定すると、最新LLMによる本格的な牌読みコーチングを受けられます。',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AISettings>(loadAISettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [serverConnected, setServerConnected] = useState<boolean>(false);
  const [availableBackends, setAvailableBackends] = useState<{ agy: boolean; claude: boolean; mock: boolean }>({
    agy: false,
    claude: false,
    mock: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // バックエンド状態の取得 & サーバー疎通確認
  const checkStatus = async () => {
    const status = await checkLocalServerStatus();
    setServerConnected(status.connected);
    setAvailableBackends(status.availableBackends);
  };

  useEffect(() => {
    checkStatus();
    const timer = setInterval(checkStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 設定更新ハンドラー
  const updateSettings = (partial: Partial<AISettings>) => {
    const updated = saveAISettings(partial);
    setSettings(updated);
  };

  const handleSend = async (questionText?: string) => {
    const query = questionText || inputQuestion.trim();
    if (!query || isLoading) return;

    onQuestionAsked?.();

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');
    setIsLoading(true);

    try {
      const result = await askAICoach(context, query, settings);

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: result.reply || (result.error ? `エラー: ${result.error}` : '回答を取得できませんでした。'),
        backendUsed: result.modelUsed ? `${result.providerUsed} (${result.modelUsed})` : result.providerUsed,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'system',
        text: `⚠️ **AI回答の生成中にエラーが発生しました**: ${err.message || '不明なエラー'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const isActionPending = !!context.pendingActionForMe;

  const quickQuestions = isActionPending
    ? [
        {
          label: '鳴くべき？(鳴き判断)',
          icon: <Hand className="w-3.5 h-3.5 text-amber-400" />,
          query: `現在、${context.pendingActionForMe?.fromPlayerName}から打牌があり、鳴くかスルー（パス）かの選択肢があります。手牌の打点・速度・役の有無・門前維持の観点から鳴くべきか論理的にアドバイスしてください。`,
        },
        {
          label: 'この牌でロンできる？',
          icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" />,
          query: '現在の捨て牌に対してロン和了が可能か、役と点数（符計算）の根拠を教えてください。',
        },
        {
          label: '手牌の打点・役の確認',
          icon: <Calculator className="w-3.5 h-3.5 text-amber-400" />,
          query: 'この手牌で鳴いた場合と門前を維持した場合の役・打点の変化を比較してください。',
        },
        {
          label: '押し引き・危険度判断',
          icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
          query: '他家の気配やリーチに対して、ここで鳴いて前に出るべきか、パスして安全牌を抱えるべきかを教えてください。',
        },
      ]
    : [
        {
          label: '何を切るべき？',
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
          query: 'この局面で最も受け入れと打点のバランスが良いおすすめの打牌は何ですか？理由も教えてください。',
        },
        {
          label: '危険牌・安全牌は？',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          query: '他家の河やリーチから見て、現物・スジ・カベ（ノーチャンス）による安全牌と危険牌を論理的に分析してください。',
        },
        {
          label: '手牌の打点・符計算',
          icon: <Calculator className="w-3.5 h-3.5 text-amber-400" />,
          query: 'この手牌がテンパイ・アガリに向かった場合の想定役、符数計算の根拠、および点数を解説してください。',
        },
        {
          label: '押し引き判断',
          icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
          query: '現在の巡目・点数状況・相手の気配を踏まえ、攻めるべき（押す）か降りるべき（引く）かの判断基準を教えてください。',
        },
      ];

  const currentPrompt = buildMahjongCoachPrompt(context, inputQuestion || '（質問入力中）');

  // 表示用ステータスバッジ
  const getStatusBadge = () => {
    if (
      settings.geminiApiKey?.trim() &&
      (settings.preferredProvider === 'auto' || settings.preferredProvider === 'gemini_direct')
    ) {
      return { text: `Gemini (${settings.geminiModel})`, color: 'bg-blue-400' };
    }
    if (
      settings.claudeApiKey?.trim() &&
      (settings.preferredProvider === 'auto' || settings.preferredProvider === 'claude_direct')
    ) {
      return { text: `Claude (${settings.claudeModel.split('-')[0]})`, color: 'bg-amber-400' };
    }
    if (
      serverConnected &&
      availableBackends.agy &&
      (settings.preferredProvider === 'auto' || settings.preferredProvider === 'agy')
    ) {
      return { text: 'agy CLI 接続中', color: 'bg-emerald-400 animate-pulse' };
    }
    if (serverConnected && (settings.preferredProvider === 'auto' || settings.preferredProvider === 'claude_cli')) {
      return { text: 'ローカルCLI 稼働中', color: 'bg-blue-400' };
    }
    return { text: 'ルールベース (オフライン)', color: 'bg-slate-400' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="flex flex-col h-full bg-slate-900/90 lg:border-l border-slate-700/80 text-slate-200 pb-16 lg:pb-0">
      {/* ヘッダー */}
      <div className="p-2.5 sm:p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              title="盤面に戻る"
            >
              ← 卓へ
            </button>
          )}
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1">
              AI牌読みコーチ
              <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-normal">
                不完全情報保証
              </span>
            </h2>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px]">
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusBadge.color}`} />
              <span className="text-slate-400 truncate max-w-[130px] sm:max-w-[150px]">{statusBadge.text}</span>
            </div>
          </div>
        </div>

        {/* 右上操作アイコン群 */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setShowPromptModal(true)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            title="現在の局面プロンプト（LLMへの入力）を確認"
          >
            <Code className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowQuickSettings(!showQuickSettings)}
            className={`p-1.5 rounded transition ${
              showQuickSettings ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="クイックAPIキー設定バーの表示/非表示"
          >
            <Key className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition relative"
            title="詳細AI設定（プロバイダー切替・カスタムURL等）"
          >
            <Settings className="w-4 h-4" />
            {!settings.geminiApiKey && !settings.claudeApiKey && !serverConnected && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* トップ画面用 クイックAPIキー & モデル入力バー */}
      {!showQuickSettings ? (
        <div className="px-3 py-1 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Key className="w-3 h-3 text-emerald-400" />
            APIキー & モデル設定
          </span>
          <button
            type="button"
            onClick={() => setShowQuickSettings(true)}
            className="flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 transition text-[10px]"
          >
            設定を開く
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 text-xs space-y-2 animate-fade-in shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[11px] text-slate-200 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                AIバックエンド設定
              </span>
              {/* プロバイダー簡易タブ */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => updateSettings({ preferredProvider: 'gemini_direct' })}
                  className={`px-2 py-0.5 rounded transition font-medium ${
                    settings.preferredProvider === 'gemini_direct' || (settings.preferredProvider === 'auto' && !settings.claudeApiKey)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gemini
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ preferredProvider: 'claude_direct' })}
                  className={`px-2 py-0.5 rounded transition font-medium ${
                    settings.preferredProvider === 'claude_direct'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Claude
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ preferredProvider: 'rule_based' })}
                  className={`px-2 py-0.5 rounded transition font-medium ${
                    settings.preferredProvider === 'rule_based'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  オフライン
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQuickSettings(false)}
              className="text-slate-400 hover:text-slate-200 p-0.5"
              title="折りたたむ"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gemini設定時 */}
          {(settings.preferredProvider === 'gemini_direct' || (settings.preferredProvider === 'auto' && !settings.claudeApiKey)) && (
            <div className="space-y-1.5 bg-slate-900/90 p-2 rounded-xl border border-blue-900/40">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  Google Gemini API
                  <span className="text-[9px] px-1 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                    無料 1日1500回
                  </span>
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline"
                >
                  無料キー取得 <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type={showKeyInput ? 'text' : 'password'}
                    value={settings.geminiApiKey}
                    onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                    placeholder="APIキーを貼り付け (AIzaSy...)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 pr-8 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeyInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* モデル選択 */}
                <select
                  value={settings.geminiModel}
                  onChange={(e) => updateSettings({ geminiModel: e.target.value })}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 max-w-[130px]"
                >
                  {AVAILABLE_GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                  {!AVAILABLE_GEMINI_MODELS.some((m) => m.id === settings.geminiModel) && settings.geminiModel && (
                    <option value={settings.geminiModel}>{settings.geminiModel}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                {settings.geminiApiKey.trim() ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    キー設定完了（{settings.geminiModel}で即時推論）
                  </span>
                ) : (
                  <span className="text-amber-400">
                    ※ キー未入力時はオフライン・ルールベース牌読みで即時回答します
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Claude設定時 */}
          {settings.preferredProvider === 'claude_direct' && (
            <div className="space-y-1.5 bg-slate-900/90 p-2 rounded-xl border border-amber-900/40">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" />
                  Anthropic Claude API
                </span>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5 hover:underline"
                >
                  APIキー取得 <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type={showKeyInput ? 'text' : 'password'}
                    value={settings.claudeApiKey}
                    onChange={(e) => updateSettings({ claudeApiKey: e.target.value })}
                    placeholder="Claude APIキーを入力 (sk-ant...)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 pr-8 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeyInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <select
                  value={settings.claudeModel}
                  onChange={(e) => updateSettings({ claudeModel: e.target.value })}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 max-w-[130px]"
                >
                  {AVAILABLE_CLAUDE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                  {!AVAILABLE_CLAUDE_MODELS.some((m) => m.id === settings.claudeModel) && settings.claudeModel && (
                    <option value={settings.claudeModel}>{settings.claudeModel}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                {settings.claudeApiKey.trim() ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    キー設定完了（{settings.claudeModel}）
                  </span>
                ) : (
                  <span className="text-amber-400">
                    ※ キー未入力時はオフライン・ルールベース牌読みで即時回答します
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ルールベース設定時 */}
          {settings.preferredProvider === 'rule_based' && (
            <div className="bg-slate-900/90 p-2 rounded-xl border border-emerald-900/40 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                ⚡ ルールベース牌読みエンジン（オフライン・完全無料・即時回答）
              </div>
              <div className="text-[10px] text-slate-400">
                APIキー不要で、シャンテン数・受け入れ枚数・現物・スジ・壁・符計算の解説が即座に動作します。
              </div>
            </div>
          )}
        </div>
      )}

      {/* チャットメッセージログ */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs leading-relaxed">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[95%] rounded-xl p-3 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.sender === 'system'
                  ? 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                  : 'bg-slate-800/95 border border-emerald-500/30 text-slate-100 rounded-bl-none'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-700/60 text-[10px] text-emerald-400 font-mono">
                  <span className="flex items-center gap-1 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    AI牌読み思考結果
                  </span>
                  {msg.backendUsed && (
                    <span className="text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                      [{msg.backendUsed}]
                    </span>
                  )}
                </div>
              )}
              {/* Markdownリッチレンダリング */}
              <MarkdownRenderer content={msg.text} />
            </div>
            <span className="text-[9px] text-slate-500 px-1 mt-0.5">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-300 p-2.5 bg-slate-800/60 rounded-xl border border-emerald-500/40 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-emerald-300">AI牌読みコーチが思考中...</div>
              <div className="text-[10px] text-slate-400">
                公開盤面（自手牌・全員の河・副露・ドラ）から最適打牌・安全度を論理推論しています
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* クイック質問ボタン */}
      <div className="p-2 bg-slate-950/60 border-t border-slate-800 grid grid-cols-2 gap-1.5">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(q.query)}
            className="flex items-center gap-1.5 text-[11px] p-1.5 rounded bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700/80 text-slate-300 transition text-left truncate disabled:opacity-50"
          >
            {q.icon}
            <span className="truncate">{q.label}</span>
          </button>
        ))}
      </div>

      {/* テキスト入力エリア */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="対局中の疑問を質問... (例: 対面のリーチに通る牌は？)"
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950"
          title="送信"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* プロンプト確認モーダル */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                LLMに渡される局面プロンプト (Sanitized Context)
              </h3>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 text-xs font-mono bg-slate-950 text-slate-300 whitespace-pre-wrap">
              {currentPrompt}
            </div>
            <div className="p-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI詳細設定モーダル */}
      <AISettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSaved={(newSettings) => setSettings(newSettings)}
      />
    </div>
  );
};
