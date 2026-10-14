import { langs } from '../../i18n/utils.js';
import { getArticles, categoryOf } from '../../lib/articles.js';

export function getStaticPaths() { return langs.map(lang => ({ params: { lang } })); }

// 検索用の索引(タイトル・説明・タグ・カテゴリ・本文)。ブラウザ側でこれを絞り込む。
export async function GET({ params }) {
  const lang = params.lang;
  const articles = await getArticles(lang);
  const index = articles.map(a => ({
    id: a.id,
    title: a.title,
    category: categoryOf(a.category, lang).short,
    text: [a.title, a.description, ...a.tags, categoryOf(a.category, lang).label, a.entry.body.replace(/\\(.)/g, '$1')].join(' ')
  }));
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
}
