import { ui } from './ui.js';

export const langs = ['ja', 'en'];
export const otherLang = lang => (lang === 'ja' ? 'en' : 'ja');
export const isLang = value => langs.includes(value);

export const t = (lang, key, ...args) => {
  const value = ui[lang][key] ?? ui.ja[key];
  return typeof value === 'function' ? value(...args) : value;
};

// /ja/articles/x/ のようなパスを作る
export const href = (lang, path = '') => `/${lang}/${path}`;
// 現在のパスの言語部分だけを入れ替えたパス(言語切り替えボタン用)
export const switchPath = (pathname, lang) => pathname.replace(/^\/(ja|en)(?=\/|$)/, `/${lang}`);
