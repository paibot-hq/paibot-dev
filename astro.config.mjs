import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { codeBlock, wrapTables } from './src/plugins/markdown.mjs';

export default defineConfig({
  trailingSlash: 'always',
  server: { port: 4320 },
  markdown: {
    syntaxHighlight: false,   // コードブロックは自前の見た目(ラベルとコピーボタン)にする
    smartypants: false,       // 引用符は記事の中で明示的に書いている
    remarkPlugins: [codeBlock, remarkMath],      // 式は LaTeX 形式($...$ と $$...$$)で書く
    rehypePlugins: [wrapTables, rehypeKatex]
  }
});
