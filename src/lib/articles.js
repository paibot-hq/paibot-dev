import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, render } from 'astro:content';
import { categories } from '../data/site.js';

// 見出し画像: public/images/articles/<記事ID>.jpg があれば付く(日本語と英語で同じ画像)
export const heroOf = id => existsSync(join(process.cwd(), 'public', 'images', 'articles', `${id}.jpg`)) ? `/images/articles/${id}.jpg` : null;

// 言語ごとの記事一覧(並び順は frontmatter の order)
export async function getArticles(lang) {
  const all = await getCollection('articles');
  return all
    .filter(entry => entry.id.startsWith(`${lang}/`))
    .map(entry => ({ id: entry.id.slice(lang.length + 1), entry, ...entry.data }))
    .map(a => ({ ...a, hero: heroOf(a.id) }))
    .sort((a, b) => a.order - b.order);
}

export const categoryOf = (id, lang) => {
  const c = categories.find(c => c.id === id);
  return { ...c, label: c.name[lang] };
};

export { render };
