import React, { useState, useEffect, useRef } from 'react';
import { SanitizedPlayerView } from '../ai/types/context';
import { buildMahjongCoachPrompt } from '../ai/prompt/contextFormatter';
import { Bot, Send, Sparkles, ShieldAlert, Calculator, Flame, RefreshCw, Code, CheckCircle, Terminal } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  backendUsed?: string;
  timestamp: string;
}

interface AICoachPanelProps {
  context: SanitizedPlayerView;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({ context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'system',
      text: '🀄 **専属AI牌読みコーチ**が待機しています。\n対局中の局面について、「おすすめの打牌」「危険牌分析」「点数・符計算」など何でも聞いてください。',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cliBackend, setCliBackend] = useState<'auto' | 'agy' | 'claude' | 'mock'>('auto');
  const [availableBackends, setAvailableBackends] = useState<{ agy: boolean; claude: boolean; mock: boolean }>({
    agy: false,
    claude: false,
    mock: true,
  });
  const [showPromptModal, setShowPromptModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // バックエンド状態の取得
  useEffect(() => {
    fetch('/api/coach/status')
      .then(res => res.json())
      .then(data => {
        if (data.availableBackends) {
          setAvailableBackends(data.availableBackends);
        }
      })
      .catch(() => {
        // サーバーがまだ起動していない等の場合
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const query = questionText || inputQuestion.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          context,
          cliBackend,
        }),
      });

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || (data.error ? `エラー: ${data.error}` : '回答を取得できませんでした。'),
        backendUsed: data.backendUsed,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'system',
        text: `通信エラー: サーバーとの接続に失敗しました (${err.message})。`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    { label: '何を切るべき？', icon: <Sparkles className="w-3.5 h-3.5" />, query: 'この局面で最も受け入れと打点のバランスが良いおすすめの打牌は何ですか？理由も教えてください。' },
    { label: '危険牌・安全牌は？', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />, query: '他家の河やリーチから見て、現物・スジ・カベ（ノーチャンス）による安全牌と危険牌を論理的に分析してください。' },
    { label: '手牌の打点・符計算', icon: <Calculator className="w-3.5 h-3.5 text-amber-400" />, query: 'この手牌がテンパイ・アガリに向かった場合の想定役、符数計算の根拠、および点数を解説してください。' },
    { label: '押し引き判断', icon: <Flame className="w-3.5 h-3.5 text-orange-400" />, query: '現在の巡目・点数状況・相手の気配を踏まえ、攻めるべき（押す）か降りるべき（引く）かの判断基準を教えてください。' },
  ];

  const currentPrompt = buildMahjongCoachPrompt(context, inputQuestion || '（質問入力中）');

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border-l border-slate-700/80 text-slate-200">
      {/* ヘッダー */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              AI牌読みコーチ
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                不完全情報モード
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">プレイヤーと同じ公開情報のみで牌読み</p>
          </div>
        </div>

        {/* CLIバックエンドセレクター & プロンプト確認 */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setShowPromptModal(true)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
            title="現在の局面プロンプト（LLMへの入力）を確認"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[11px]">
            <Terminal className="w-3 h-3 ml-1.5 text-slate-400" />
            <select
              value={cliBackend}
              onChange={(e) => setCliBackend(e.target.value as any)}
              className="bg-transparent text-slate-300 text-xs px-1.5 py-0.5 outline-none cursor-pointer"
            >
              <option value="auto" className="bg-slate-900">自動検出</option>
              <option value="agy" className="bg-slate-900">agy CLI {availableBackends.agy ? '✓' : ''}</option>
              <option value="claude" className="bg-slate-900">claude CLI {availableBackends.claude ? '✓' : ''}</option>
              <option value="mock" className="bg-slate-900">モック (オフライン)</option>
            </select>
          </div>
        </div>
      </div>

      {/* チャットメッセージログ */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs leading-relaxed">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user'
                ? 'items-end'
                : 'items-start'
            }`}
          >
            <div
              className={`max-w-[92%] rounded-xl p-3 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.sender === 'system'
                  ? 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                  : 'bg-slate-800 border border-emerald-500/30 text-slate-100 rounded-bl-none'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-700/50 text-[10px] text-emerald-400 font-mono">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    AI牌読み分析
                  </span>
                  {msg.backendUsed && (
                    <span className="text-slate-400">[{msg.backendUsed}]</span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
            <span className="text-[9px] text-slate-500 px-1 mt-0.5">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2 bg-slate-800/40 rounded-lg border border-slate-700/40 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>AIコーチが盤面（河・スジ・カベ・手牌）を論理分析中...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* クイック質問ボタン */}
      <div className="p-2 bg-slate-950/40 border-t border-slate-800 grid grid-cols-2 gap-1.5">
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
          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="送信"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* プロンプト確認モーダル */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
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
    </div>
  );
};
