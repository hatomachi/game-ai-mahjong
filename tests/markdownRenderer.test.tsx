import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MarkdownRenderer } from '../src/components/MarkdownRenderer';

describe('MarkdownRenderer component', () => {
  it('renders null when content is empty', () => {
    const html = renderToString(<MarkdownRenderer content="" />);
    expect(html).toBe('');
  });

  it('renders headings (H1, H2, H3, H4) properly', () => {
    const content = `# 大見出し
## 中見出し
### 小見出し
#### 詳細見出し`;
    const html = renderToString(<MarkdownRenderer content={content} />);
    expect(html).toContain('大見出し');
    expect(html).toContain('中見出し');
    expect(html).toContain('小見出し');
    expect(html).toContain('詳細見出し');
    expect(html).toContain('<h1');
    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
    expect(html).toContain('<h4');
  });

  it('renders bold text and mahjong tile badges', () => {
    const content = 'おすすめの打牌は **發[6z]** です。万子は [123m] です。';
    const html = renderToString(<MarkdownRenderer content={content} />);
    expect(html).toContain('<strong');
    expect(html).toContain('[6z]');
    expect(html).toContain('[123m]');
  });

  it('renders unordered and ordered lists', () => {
    const content = `- 箇条書き1
- 箇条書き2
1. 手順1
2. 手順2`;
    const html = renderToString(<MarkdownRenderer content={content} />);
    expect(html).toContain('<ul');
    expect(html).toContain('<ol');
    expect(html).toContain('箇条書き1');
    expect(html).toContain('手順1');
  });

  it('renders horizontal rules and blockquotes', () => {
    const content = `---
> これは引用です`;
    const html = renderToString(<MarkdownRenderer content={content} />);
    expect(html).toContain('<hr');
    expect(html).toContain('これは引用です');
  });
});
