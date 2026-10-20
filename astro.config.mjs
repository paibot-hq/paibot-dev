import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { codeBlock, wrapTables } from './src/plugins/markdown.mjs';

export default defineConfig({
  site: 'https://paibot.dev',
  integrations: [sitemap({
    filter: page => page !== 'https://paibot.dev/' && !page.includes('/saved/'),   // ルートは言語の振り分け、保存した記事は端末ごとの画面なので、検索に出さない
    i18n: { defaultLocale: 'ja', locales: { ja: 'ja', en: 'en' } }   // 日英の同じ記事を alternate で結ぶ
  })],
  trailingSlash: 'always',
  server: { port: 4320 },
  markdown: {
    syntaxHighlight: false,   // コードブロックは自前の見た目(ラベルとコピーボタン)にする
    smartypants: false,       // 引用符は記事の中で明示的に書いている
    remarkPlugins: [codeBlock, remarkMath],      // 式は LaTeX 形式($...$ と $$...$$)で書く
    rehypePlugins: [wrapTables, rehypeKatex]
  }
});
