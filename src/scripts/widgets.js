// 記事やツール集に埋め込む、触れる部品。計算はすべてブラウザの中で、記事のコードと同じ式で行う。
//   <div class="widget" data-widget="string-lab"></div>   … 文字数ラボ
//   <div class="widget" data-widget="temperature"></div>  … 温度スライダー

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let uid = 0;

const TEXT = {
  ja: {
    lab: {
      title: '文字数ラボ', label: '好きな文字を入れてみてください', sample: 'サンプル',
      samples: [['家族', '\u{1F468}‍\u{1F469}‍\u{1F467}'], ['国旗', '\u{1F1EF}\u{1F1F5}'], ['𠮷野家', '\u{20BB7}野家'], ['が (2通り)', 'がが'], ['全部', '\u{1F468}‍\u{1F469}‍\u{1F467} \u{20BB7}野家 \u{1F1EF}\u{1F1F5} が']],
      stats: [['graphemes', '見た目の1文字', 'Swift .count'], ['codepoints', 'コードポイント', 'Python len()'], ['utf16', 'UTF-16の単位', 'JavaScript .length'], ['utf8', 'UTF-8のバイト', 'Rust .len()']],
      tiles: '1文字ずつに割ると', tilesHint: '枠が色付きなら、見た目は1文字でも、中身は複数のコードポイント', more: n => `…ほか${n}文字`,
      empty: '文字を入れると、ここに並びます',
      trunc: '先頭から取ってみる', truncN: n => `先頭 ${n} 文字`, naive: 'length で切る(UTF-16の単位)', safe: '見た目の文字で切る',
      broken: '壊れた文字(孤立したサロゲート)', norm: '正規化', normNote: '見た目は同じまま、コードポイントの数が変わります'
    },
    temp: {
      title: '温度スライダー', temp: '温度', hint: '「the」の次の単語の確率。記事のおもちゃのモデルと同じ式', roll1: '1回振る', roll100: '100回振る', reset: 'リセット',
      theory: '理論値', drawn: '出た回数', none: 'まだ振っていません', last: w => `出た単語:${w}`, total: n => `${n}回`,
      low: '低い:最も多い単語に集中する', high: '高い:差が縮まる'
    }
  },
  en: {
    lab: {
      title: 'Character count lab', label: 'Type any text', sample: 'Samples',
      samples: [['family', '\u{1F468}‍\u{1F469}‍\u{1F467}'], ['flag', '\u{1F1EF}\u{1F1F5}'], ['𠮷野家', '\u{20BB7}野家'], ['が (two ways)', 'がが'], ['all', '\u{1F468}‍\u{1F469}‍\u{1F467} \u{20BB7}野家 \u{1F1EF}\u{1F1F5} が']],
      stats: [['graphemes', 'User-perceived chars', 'Swift .count'], ['codepoints', 'Code points', 'Python len()'], ['utf16', 'UTF-16 units', 'JavaScript .length'], ['utf8', 'UTF-8 bytes', 'Rust .len()']],
      tiles: 'Split into characters', tilesHint: 'A colored frame means it looks like one character but is several code points inside', more: n => `…and ${n} more`,
      empty: 'Type something and it appears here',
      trunc: 'Take from the start', truncN: n => `First ${n}`, naive: 'Cut by length (UTF-16 units)', safe: 'Cut by user-perceived character',
      broken: 'broken character (a lone surrogate)', norm: 'Normalize', normNote: 'It looks the same, but the number of code points changes'
    },
    temp: {
      title: 'Temperature slider', temp: 'Temperature', hint: 'Probability of the word after “the”, same formula as the toy model in the article', roll1: 'Roll once', roll100: 'Roll 100 times', reset: 'Reset',
      theory: 'Theory', drawn: 'Drawn', none: 'Not rolled yet', last: w => `Drawn: ${w}`, total: n => `${n} draws`,
      low: 'Low: concentrates on the most frequent word', high: 'High: the gap narrows'
    }
  }
};

// ---------- 文字数ラボ ----------
function stringLab(root, t) {
  const id = `lab${++uid}`;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const encoder = new TextEncoder();
  const graphemesOf = s => [...segmenter.segment(s)].map(x => x.segment);
  const hex = cp => 'U+' + cp.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  const wellFormed = s => (s.toWellFormed ? s.toWellFormed() : s.replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '�'));
  const isBroken = s => s !== wellFormed(s);

  root.innerHTML = `
    <div class="widget-title">${esc(t.title)}</div>
    <label class="lab-label" for="${id}-in">${esc(t.label)}</label>
    <textarea id="${id}-in" class="lab-input" rows="2" spellcheck="false" autocomplete="off"></textarea>
    <div class="lab-row"><span class="lab-small">${esc(t.sample)}</span>${t.samples.map(([n, v], i) => `<button type="button" class="lab-chip" data-sample="${i}">${esc(n)}</button>`).join('')}</div>
    <div class="lab-stats" role="group" aria-label="${esc(t.title)}">${t.stats.map(([k, n, tag]) => `<div class="lab-stat" data-key="${k}"><span class="lab-num" data-num="0">0</span><span class="lab-name">${esc(n)}</span><span class="lab-tag">${esc(tag)}</span></div>`).join('')}</div>
    <div class="lab-section"><div class="lab-sub">${esc(t.tiles)}</div><div class="lab-tiles"></div><div class="lab-small">${esc(t.tilesHint)}</div></div>
    <div class="lab-section"><div class="lab-sub">${esc(t.trunc)}</div>
      <div class="lab-row"><input type="range" class="lab-range" id="${id}-n" min="0" max="0" value="0" aria-label="${esc(t.trunc)}"><span class="lab-small lab-n"></span></div>
      <div class="lab-cmp"><div><div class="lab-small">${esc(t.naive)}</div><div class="lab-out lab-naive"></div></div><div><div class="lab-small">${esc(t.safe)}</div><div class="lab-out lab-safe"></div></div></div></div>
    <div class="lab-section"><div class="lab-sub">${esc(t.norm)}</div><div class="lab-row"><button type="button" class="lab-chip" data-norm="NFC">NFC</button><button type="button" class="lab-chip" data-norm="NFD">NFD</button><span class="lab-small">${esc(t.normNote)}</span></div></div>`;

  const input = root.querySelector('.lab-input');
  const range = root.querySelector('.lab-range');
  const tiles = root.querySelector('.lab-tiles');
  const shown = {};   // 数字の現在の表示値(アニメーション用)

  const tween = (el, to) => {
    const from = Number(el.dataset.num); el.dataset.num = to;
    if (reduceMotion() || from === to) { el.textContent = to; return; }
    const start = performance.now(), dur = 260;
    const step = now => { const k = Math.min(1, (now - start) / dur); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1 && Number(el.dataset.num) === to) requestAnimationFrame(step); else el.textContent = Number(el.dataset.num); };
    requestAnimationFrame(step);
  };

  const render = (resetRange = false) => {
    const s = input.value;
    const gs = graphemesOf(s), cps = [...s];
    const values = { graphemes: gs.length, codepoints: cps.length, utf16: s.length, utf8: encoder.encode(s).length };
    root.querySelectorAll('.lab-stat').forEach(el => tween(el.querySelector('.lab-num'), values[el.dataset.key]));

    const MAX = 40;
    tiles.innerHTML = gs.length === 0 ? `<span class="lab-small">${esc(t.empty)}</span>` : gs.slice(0, MAX).map((g, i) => {
      const parts = [...g]; const multi = parts.length > 1;
      return `<span class="lab-tile${multi ? ' is-multi' : ''}" style="animation-delay:${Math.min(i, 20) * 22}ms" title="${esc(parts.map(hex).join(' '))} · UTF-8 ${encoder.encode(g).length}B · UTF-16 ${g.length}"><span class="lab-glyph">${esc(g === ' ' ? '␣' : g)}</span><span class="lab-cps">${parts.map(c => `<span>${hex(c)}</span>`).join('')}</span></span>`;
    }).join('') + (gs.length > MAX ? `<span class="lab-small">${esc(t.more(gs.length - MAX))}</span>` : '');

    range.max = gs.length;                                  // 最大値を先に更新してから、値を入れる
    if (resetRange || Number(range.value) > gs.length) range.value = gs.length;
    truncate();
  };

  const truncate = () => {
    const s = input.value, gs = graphemesOf(s), n = Number(range.value);
    root.querySelector('.lab-n').textContent = t.truncN(n);
    const naive = s.slice(0, n), broken = isBroken(naive);
    root.querySelector('.lab-naive').innerHTML = `<span class="lab-text${broken ? ' is-broken' : ''}">${esc(wellFormed(naive)) || '&nbsp;'}</span>${broken ? `<span class="lab-bad">${esc(t.broken)}</span>` : ''}`;
    root.querySelector('.lab-safe').innerHTML = `<span class="lab-text">${esc(gs.slice(0, n).join('')) || '&nbsp;'}</span>`;
  };

  root.addEventListener('click', event => {
    const sample = event.target.closest('[data-sample]');
    if (sample) { input.value = t.samples[Number(sample.dataset.sample)][1]; render(true); input.focus(); }
    const norm = event.target.closest('[data-norm]');
    if (norm) { input.value = input.value.normalize(norm.dataset.norm); render(); }
  });
  input.addEventListener('input', () => render(true));
  range.addEventListener('input', truncate);

  input.value = t.samples[0][1] + ' ' + t.samples[2][1];
  render(true);
}

// ---------- 温度スライダー ----------
function temperature(root, t) {
  const id = `temp${++uid}`;
  const counts = [['model', 3], ['text', 2], ['next', 3], ['context', 2], ['answer', 2]];   // 記事のおもちゃのモデルで、「the」の次に続いた回数
  const probs = temp => { const w = counts.map(([, n]) => Math.pow(n, 1 / temp)); const sum = w.reduce((a, b) => a + b, 0); return w.map(x => x / sum); };
  let tally = counts.map(() => 0), total = 0, lastWord = '';

  root.innerHTML = `
    <div class="widget-title">${esc(t.title)}</div>
    <div class="lab-small">${esc(t.hint)}</div>
    <div class="temp-control"><label for="${id}-t">${esc(t.temp)}</label><input type="range" class="lab-range" id="${id}-t" min="0.1" max="3" step="0.05" value="1"><output class="temp-value" for="${id}-t">1.00</output></div>
    <div class="lab-row temp-ends"><span class="lab-small">${esc(t.low)}</span><span class="lab-small">${esc(t.high)}</span></div>
    <div class="temp-bars">${counts.map(([w]) => `<div class="temp-row"><span class="temp-word">${w}</span><span class="temp-track"><span class="temp-bar"></span><span class="temp-mark" hidden></span></span><span class="temp-pct">0%</span></div>`).join('')}</div>
    <div class="lab-row"><button type="button" class="lab-chip" data-roll="1">${esc(t.roll1)}</button><button type="button" class="lab-chip" data-roll="100">${esc(t.roll100)}</button><button type="button" class="lab-chip" data-reset>${esc(t.reset)}</button><span class="lab-small temp-status"></span></div>
    <div class="lab-small temp-legend"><span class="temp-key theory"></span>${esc(t.theory)} <span class="temp-key drawn"></span>${esc(t.drawn)}</div>`;

  const slider = root.querySelector('.lab-range'), out = root.querySelector('output');
  const rows = [...root.querySelectorAll('.temp-row')];
  const status = root.querySelector('.temp-status');
  const SCALE = 0.5;   // 確率の最大がおよそ半分になるので、棒が見やすいよう拡大して表示する

  const paint = () => {
    const temp = Number(slider.value), p = probs(temp);
    out.textContent = temp.toFixed(2);
    rows.forEach((row, i) => {
      row.querySelector('.temp-bar').style.width = `${Math.min(100, p[i] / SCALE * 100)}%`;
      row.querySelector('.temp-pct').textContent = `${(p[i] * 100).toFixed(1)}%`;
      const mark = row.querySelector('.temp-mark');
      mark.hidden = total === 0;
      if (total) mark.style.left = `${Math.min(100, tally[i] / total / SCALE * 100)}%`;
      if (total) mark.title = `${t.drawn}: ${(tally[i] / total * 100).toFixed(1)}%`;
    });
    status.textContent = total ? `${t.total(total)} · ${lastWord ? t.last(lastWord) : ''}` : t.none;
  };
  const roll = n => {
    const p = probs(Number(slider.value));
    for (let k = 0; k < n; k++) { let r = Math.random(), i = 0; for (; i < p.length - 1; i++) { r -= p[i]; if (r <= 0) break; } tally[i]++; total++; lastWord = counts[i][0]; }
    paint();
  };
  const reset = () => { tally = counts.map(() => 0); total = 0; lastWord = ''; paint(); };
  slider.addEventListener('input', () => { reset(); });   // 温度を変えたら、出た回数は数え直す
  root.addEventListener('click', event => {
    const r = event.target.closest('[data-roll]'); if (r) roll(Number(r.dataset.roll));
    if (event.target.closest('[data-reset]')) reset();
  });
  paint();
}

export function initWidgets() {
  const lang = document.body.dataset.lang === 'en' ? 'en' : 'ja';
  document.querySelectorAll('[data-widget]').forEach(el => {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    if (el.dataset.widget === 'string-lab') stringLab(el, TEXT[lang].lab);
    else if (el.dataset.widget === 'temperature') temperature(el, TEXT[lang].temp);
  });
}
