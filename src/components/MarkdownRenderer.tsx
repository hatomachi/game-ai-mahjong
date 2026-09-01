import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * 麻雀牌コード（[123p], [6z], [1m] 等）や牌名をスタイリングされたバッジとして装飾する
 */
function renderFormattedInlineText(text: string): React.ReactNode[] {
  // トークン分割:
  // 1. 太字: **...**
  // 2. インラインコード: `...`
  // 3. 麻雀牌コード: [1-9]{1,4}[mps], [1-7]z 等
  // 4. イタリック: *...*
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[(?:[0-9]{1,4}[mps]|[1-7]z)\]|\*[^*]+\*)/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // 太字: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-amber-200 bg-amber-500/10 px-1 py-0.5 rounded">
          {renderFormattedInlineText(inner)}
        </strong>
      );
    }

    // インラインコード: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="font-mono text-[11px] bg-slate-950 text-emerald-300 px-1.5 py-0.5 rounded border border-slate-700"
        >
          {inner}
        </code>
      );
    }

    // 麻雀牌コード: [123p], [6z] 等
    if (part.startsWith('[') && part.endsWith(']') && part.length >= 3) {
      const inner = part.slice(1, -1);
      const isMps = /[0-9]{1,4}[mps]/.test(inner);
      const isHonor = /[1-7]z/.test(inner);

      if (isMps || isHonor) {
        let badgeColor = 'bg-slate-700/80 text-slate-200 border-slate-600';
        if (inner.includes('m')) badgeColor = 'bg-red-950/80 text-red-300 border-red-800';
        if (inner.includes('p')) badgeColor = 'bg-blue-950/80 text-blue-300 border-blue-800';
        if (inner.includes('s')) badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
        if (inner.includes('z')) badgeColor = 'bg-purple-950/80 text-purple-300 border-purple-800';

        return (
          <span
            key={index}
            className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.2 mx-0.5 rounded border ${badgeColor}`}
          >
            {part}
          </span>
        );
      }
    }

    // イタリック: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-slate-300">
          {inner}
        </em>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * 麻雀AIコーチのチャットメッセージ向け高機能Markdownレンダラー
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentListItems: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentListItems) {
      if (currentListItems.type === 'ul') {
        elements.push(
          <ul key={`list_${elements.length}`} className="my-1.5 space-y-1 pl-1">
            {currentListItems.items.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-slate-200">
                <span className="text-emerald-400 font-bold select-none mt-0.5">•</span>
                <span className="flex-1 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list_${elements.length}`} className="my-1.5 space-y-1 pl-1">
            {currentListItems.items.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-slate-200">
                <span className="font-mono text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700 px-1 py-0.2 rounded select-none mt-0.5">
                  {i + 1}
                </span>
                <span className="flex-1 leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentListItems = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // コードブロックの開始/終了
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushList();
        elements.push(
          <div
            key={`code_${elements.length}`}
            className="my-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre"
          >
            {codeBlockLines.join('\n')}
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // 水平区切り線 (---, ***, ___ 等)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      elements.push(<hr key={`hr_${elements.length}`} className="my-2.5 border-slate-700/60" />);
      continue;
    }

    // 見出し 1 (H1)
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1
          key={`h1_${elements.length}`}
          className="text-sm font-black text-emerald-400 border-b border-emerald-500/30 pb-1 mt-3 mb-1.5 flex items-center gap-1.5"
        >
          {renderFormattedInlineText(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      continue;
    }

    // 見出し 2 (H2)
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2
          key={`h2_${elements.length}`}
          className="text-xs font-bold text-slate-100 bg-slate-850/80 px-2 py-1 rounded-md border-l-2 border-emerald-400 mt-2.5 mb-1 flex items-center gap-1.5"
        >
          {renderFormattedInlineText(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      continue;
    }

    // 見出し 3 (H3)
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3
          key={`h3_${elements.length}`}
          className="text-[11px] font-bold text-amber-300 mt-2 mb-1 flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {renderFormattedInlineText(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      continue;
    }

    // 見出し 4 (H4)
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4
          key={`h4_${elements.length}`}
          className="text-[11px] font-semibold text-slate-300 mt-1.5 mb-0.5"
        >
          {renderFormattedInlineText(trimmed.replace(/^####\s+/, ''))}
        </h4>
      );
      continue;
    }

    // 箇条書きリスト (-, *, •, ・)
    const ulMatch = trimmed.match(/^([-*•・])\s+(.*)$/);
    if (ulMatch) {
      if (!currentListItems || currentListItems.type !== 'ul') {
        flushList();
        currentListItems = { type: 'ul', items: [] };
      }
      currentListItems.items.push(renderFormattedInlineText(ulMatch[2]));
      continue;
    }

    // 番号付きリスト (1. 2. 等)
    const olMatch = trimmed.match(/^([0-9]+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentListItems || currentListItems.type !== 'ol') {
        flushList();
        currentListItems = { type: 'ol', items: [] };
      }
      currentListItems.items.push(renderFormattedInlineText(olMatch[2]));
      continue;
    }

    // 引用 (> )
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <div
          key={`quote_${elements.length}`}
          className="my-1.5 pl-2.5 py-1 border-l-2 border-emerald-500/50 bg-emerald-950/20 rounded-r text-[11px] text-emerald-200/90 italic"
        >
          {renderFormattedInlineText(quoteText)}
        </div>
      );
      continue;
    }

    // 空行
    if (trimmed === '') {
      flushList();
      continue;
    }

    // 通常の段落
    flushList();
    elements.push(
      <p key={`p_${elements.length}`} className="my-1 leading-relaxed text-slate-200">
        {renderFormattedInlineText(trimmed)}
      </p>
    );
  }

  // 残ったリストやコードブロックのフラッシュ
  flushList();
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <div
        key={`code_end_${elements.length}`}
        className="my-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre"
      >
        {codeBlockLines.join('\n')}
      </div>
    );
  }

  return <div className={`text-xs space-y-1 leading-relaxed ${className}`}>{elements}</div>;
};
