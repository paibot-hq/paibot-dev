// Markdownの出力を、サイトのデザイン(コードブロックのラベルとコピーボタン、横スクロールする表)に合わせる。

import { createHighlighter } from 'shiki';

const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const copyLabel = { ja: 'コピー', en: 'Copy' };

// ```js ラベル  →  ラベル付き・色付きのコードブロック(最初の語が言語、残りがラベル)
// 色付けは Shiki でビルド時に行う。ブラウザに色付け用のJSは送らない。
const THEME = 'github-dark';
const LANGS = ['js', 'python', 'swift', 'rust', 'bash', 'powershell', 'bat', 'json', 'markdown', 'yaml'];
const ALIAS = { py: 'python', javascript: 'js', sh: 'bash', shell: 'bash', md: 'markdown', ps1: 'powershell', cmd: 'bat', rs: 'rust' };
let highlighter;
const getHighlighter = () => (highlighter ??= createHighlighter({ themes: [THEME], langs: LANGS }));

// 色付きのトークンを <span> にする。textContent は元のコードと完全に一致する(コピーボタンはこれを使う)
function highlight(hl, code, lang) {
  const { tokens } = hl.codeToTokens(code, { lang, theme: THEME });
  return tokens.map(line => line.map(t => {
    const style = [t.color ? `color:${t.color}` : '', t.fontStyle & 1 ? 'font-style:italic' : '', t.fontStyle & 2 ? 'font-weight:600' : ''].filter(Boolean).join(';');
    return style ? `<span style="${style}">${escapeHtml(t.content)}</span>` : escapeHtml(t.content);
  }).join('')).join('\n');
}

// 情報行: ```言語 [tab:"タブ名"] ラベル
//   tab: が付いたコードブロックが連続していたら、1つのタブ群にまとめる(タブ名で切り替える)
const TAB = /^tab:(?:"([^"]+)"|(\S+))\s*(.*)$/;
let tabSeq = 0;
// 最初に選ばれているタブ。この名前のタブがあるタブ群ではこれを選び、なければ先頭にする(ブラウザで選び直した内容が優先される)
const DEFAULT_TAB = 'Python';

export function codeBlock() {
  return async (tree, file) => {
    const lang = /[\\/]en[\\/][^\\/]+$/.test(file.path || '') ? 'en' : 'ja';
    const hl = await getHighlighter();

    const render = (node, label) => {
      const language = ALIAS[node.lang] ?? node.lang;
      const html = LANGS.includes(language) ? highlight(hl, node.value, language) : escapeHtml(node.value);
      return `<div class="code-block" data-lang="${escapeHtml(language || 'text')}"><div class="code-toolbar"><span>${escapeHtml(label)}</span><button type="button" class="copy-code">${copyLabel[lang]}</button></div><pre><code>${html}</code></pre></div>`;
    };
    const parseTab = node => { const m = (node.meta || '').match(TAB); return m ? { tab: m[1] ?? m[2], label: m[3] || node.lang?.toUpperCase() || 'CODE' } : null; };

    const walk = parent => {
      const out = [];
      const kids = parent.children;
      for (let i = 0; i < kids.length; i++) {
        const node = kids[i];
        if (node.type !== 'code') { if (node.children) walk(node); out.push(node); continue; }
        const first = parseTab(node);
        if (!first) { out.push({ type: 'html', value: render(node, node.meta || node.lang?.toUpperCase() || 'CODE') }); continue; }
        const run = [];
        while (i < kids.length && kids[i].type === 'code' && parseTab(kids[i])) run.push(kids[i++]);
        i--;
        const id = `ct${++tabSeq}`;
        const tabs = run.map((n, k) => ({ ...parseTab(n), n, k }));
        const active = Math.max(0, tabs.findIndex(t => t.tab === DEFAULT_TAB));
        out.push({
          type: 'html',
          value: `<div class="code-tabs" data-tabs><div class="code-tablist" role="tablist">`
            + tabs.map(t => `<button type="button" role="tab" class="code-tab" id="${id}-t${t.k}" aria-controls="${id}-p${t.k}" aria-selected="${t.k === active}" tabindex="${t.k === active ? 0 : -1}" data-tab="${escapeHtml(t.tab)}">${escapeHtml(t.tab)}</button>`).join('')
            + `</div>`
            + tabs.map(t => `<div role="tabpanel" class="code-panel" id="${id}-p${t.k}" aria-labelledby="${id}-t${t.k}"${t.k === active ? '' : ' hidden'}>${render(t.n, t.label)}</div>`).join('')
            + `</div>`
        });
      }
      parent.children = out;
    };
    walk(tree);
  };
}

export function wrapTables() {
  return tree => {
    const walk = node => {
      if (!node.children) return;
      node.children = node.children.map(child => {
        if (child.type === 'element' && child.tagName === 'table') {
          return { type: 'element', tagName: 'div', properties: { className: ['table-scroll'] }, children: [child] };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
