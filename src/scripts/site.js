import { initWidgets } from './widgets.js';

// ブラウザ側の動作: テーマ、言語の記憶、検索、記事の保存、コピー、JSONツール。
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const lang = document.body.dataset.lang;
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, key) => vars[key]);
let words = {};
try { words = JSON.parse($('#i18n-data').textContent); } catch { /* 文言が読めなくても動作は続ける */ }
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
};

// ---- トースト ----
let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2600);
}

// ---- テーマ ----
const themeButton = $('#toggle-theme');
function syncThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', dark ? words.themeToLight : words.themeToDark);
  themeButton.setAttribute('aria-pressed', String(dark));
  $('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1216' : '#f8f9fa');
}
themeButton.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('paibot-theme', next);
  syncThemeButton();
});
syncThemeButton();

// ---- 言語(リンクで移動する。選んだ言語は次回の入口のために覚える) ----
$('#toggle-lang').addEventListener('click', event => {
  store.set('paibot-lang', new URL(event.currentTarget.href).pathname.split('/')[1]);
});
store.set('paibot-lang', lang);

// ---- コピー ----
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast(words.copied); }
  catch { toast(words.copyFailed); }
}
document.addEventListener('click', event => {
  const button = event.target.closest('.copy-code');
  if (button) copy(button.closest('.code-block').querySelector('code').textContent);
});

// ---- 記事の保存(このブラウザの localStorage のみ) ----
let saved = new Set();
try {
  const stored = JSON.parse(store.get('paibot-saved') || '[]');
  if (Array.isArray(stored)) saved = new Set(stored);
} catch { /* 壊れた値は無視する */ }
function syncBookmarks() {
  $$('[data-save]').forEach(button => {
    const on = saved.has(button.dataset.save);
    button.classList.toggle('is-saved', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', fill(on ? words.unsaveLabel : words.saveLabel, { title: button.dataset.title }));
  });
  const list = $('#article-list[data-filter="saved"]');
  if (list) {
    const rows = $$('.article-row', list);
    rows.forEach(row => { row.hidden = !saved.has(row.dataset.id); });
    $('#saved-empty').hidden = rows.some(row => !row.hidden);
    $('#result-count').textContent = `${rows.filter(row => !row.hidden).length} ARTICLES`;
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-save]');
  if (!button) return;
  const id = button.dataset.save;
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  const persisted = store.set('paibot-saved', JSON.stringify([...saved]));
  toast(persisted ? (saved.has(id) ? words.savedToast : words.unsavedToast) : words.storageLimited);
  syncBookmarks();
});
syncBookmarks();

// ---- 検索(全文の索引をビルド時に作り、ブラウザで絞り込む) ----
const dialog = $('#search-dialog');
const searchInput = $('#global-search');
let indexPromise;
const loadIndex = () => (indexPromise ??= fetch(dialog.dataset.index).then(r => r.json()).catch(() => []));
const matches = (entry, value) => value.trim().toLowerCase().split(/\s+/).every(term => entry.text.toLowerCase().includes(term));
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
async function renderSearch() {
  const index = await loadIndex();
  const hits = index.filter(entry => matches(entry, searchInput.value));
  const count = searchInput.value ? fill(hits.length === 1 ? words.searchCountOne : words.searchCountMany, { n: hits.length }) : words.searchIdle;
  const summary = searchInput.value ? (lang === 'ja' ? `${hits.length}件の記事` : `${hits.length} article${hits.length === 1 ? '' : 's'}`) : words.searchIdle;
  $('#search-results').innerHTML = `<p class="search-count">${escapeHtml(summary)}</p>` + (hits.length
    ? hits.map(e => `<a class="search-result" href="/${lang}/articles/${e.id}/"><span class="category-label">${escapeHtml(e.category)}</span><strong>${escapeHtml(e.title)}</strong><span>→</span></a>`).join('')
    : `<p class="empty-search">${escapeHtml(words.searchNone)}</p>`);
  void count;
}
function openSearch() { if (!dialog.open) dialog.showModal(); renderSearch(); searchInput.focus(); }
$('#open-search').addEventListener('click', openSearch);
$('#close-search').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog || event.target.closest('.search-result')) dialog.close(); });
searchInput.addEventListener('input', renderSearch);
document.addEventListener('keydown', event => {
  const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;
  if ((!editing && event.key === '/') || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) { event.preventDefault(); openSearch(); }
});

// ---- 記事一覧ページの絞り込み入力 ----
const feedSearch = $('#feed-search');
if (feedSearch) {
  const list = $('#article-list');
  const notice = document.createElement('div');
  notice.className = 'empty-state';
  notice.hidden = true;
  notice.innerHTML = `<span>⌕</span><h3>${escapeHtml(words.emptyNone)}</h3><p>${escapeHtml(words.emptyNoneText)}</p>`;
  list.append(notice);
  feedSearch.addEventListener('input', async () => {
    const index = await loadIndex();
    const ids = new Set(index.filter(entry => matches(entry, feedSearch.value)).map(entry => entry.id));
    const rows = $$('.article-row', list);
    rows.forEach(row => { row.hidden = !ids.has(row.dataset.id); });
    const shown = rows.filter(row => !row.hidden).length;
    notice.hidden = shown > 0 || $('.empty-state:not(:last-child)', list) !== null && rows.length === 0;
    $('#result-count').textContent = `${shown} ARTICLES`;
  });
}

// ---- コードのタブ(JavaScript / Python など) ----
// 選んだタブの名前を覚えて、同じ名前のタブがある他のタブ群にも反映する
function selectTab(group, name, focus = false) {
  const tabs = $$('.code-tab', group);
  const target = tabs.find(tab => tab.dataset.tab === name);
  if (!target) return false;
  tabs.forEach(tab => {
    const on = tab === target;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) target.focus();
  return true;
}
function selectEverywhere(name, source) {
  $$('[data-tabs]').forEach(group => { if (group !== source) selectTab(group, name); });
  store.set('paibot-code-tab', name);
}
document.addEventListener('click', event => {
  const tab = event.target.closest('.code-tab');
  if (!tab) return;
  const group = tab.closest('[data-tabs]');
  selectTab(group, tab.dataset.tab);
  selectEverywhere(tab.dataset.tab, group);
});
document.addEventListener('keydown', event => {
  const tab = event.target.closest?.('.code-tab');
  if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const group = tab.closest('[data-tabs]');
  const tabs = $$('.code-tab', group);
  const i = tabs.indexOf(tab);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  selectTab(group, tabs[next].dataset.tab, true);
  selectEverywhere(tabs[next].dataset.tab, group);
});
{
  const remembered = store.get('paibot-code-tab');
  if (remembered) $$('[data-tabs]').forEach(group => selectTab(group, remembered));
}

initWidgets();
