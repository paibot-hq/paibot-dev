import { readFileSync, writeFileSync } from 'node:fs';
// 記事の図(SVG)を作って、記事のMarkdownに差し込む。何度実行しても同じ結果になる(既存の図は取り除いてから入れ直す)。
// 実行: node scripts/diagrams.mjs
const dir = new URL('../src/content/articles/', import.meta.url).pathname;
const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- 描画の部品 ----
const txt = (X, Y, s, cls = '', anchor = 'start') => `<text x="${X}" y="${Y}"${cls ? ` class="${cls}"` : ''}${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}>${x(s)}</text>`;
const rect = (X, Y, W, H, cls = 'd-box', r = 8) => `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="${r}" class="${cls}"/>`;
const marker = id => `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs>`;
const arrow = (id, d) => `<path d="${d}" class="d-line" marker-end="url(#${id})"/>`;
const figure = (id, w, h, title, body, caption) =>
  `<figure class="diagram"><svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t"><title id="${id}-t">${x(title)}</title>${marker(id + '-a')}${body}</svg><figcaption>${x(caption)}</figcaption></figure>`;

// ---- A: 生成のループ ----
function loop(L) {
  const T = L === 'ja'
    ? { title: 'トークンを1つずつ足して文章を作る流れ', steps: ['これまでのトークン', '次のトークンの確率を計算', '温度で偏りを調整して1つ選ぶ', '選んだトークンを末尾に足す'], again: '繰り返す', cap: '図{{N}} LLMは、これまでのトークンから次のトークンを選び、末尾に足す、という繰り返しで文章を作る。' }
    : { title: 'How text is built one token at a time', steps: ['Tokens so far', 'Probability of each next token', 'Pick one, shaped by temperature', 'Append it to the end'], again: 'repeat', cap: 'Figure {{N}}. An LLM builds text by repeatedly choosing the next token from the tokens so far and appending it.' };
  let b = '';
  T.steps.forEach((s, i) => {
    const y = 10 + i * 72;
    b += rect(20, y, 270, 46, i === 3 ? 'd-accent-soft' : 'd-box');
    b += `<circle cx="44" cy="${y + 23}" r="11" class="d-accent"/>` + txt(44, y + 27.5, i + 1, 'd-white', 'middle');
    b += txt(66, y + 28, s, 'd-strong');
    if (i < 3) b += arrow('lp-a', `M155 ${y + 48} V${y + 70}`);
  });
  b += arrow('lp-a', 'M290 249 H340 V33 H294') + txt(348, 145, T.again, 'd-small');
  return figure('lp', 400, 280, T.title, b.replaceAll('lp-a', 'lp-a'), T.cap);
}


// ---- A2: 生成の実例(記事のおもちゃのモデルと同じコーパスから計算) ----
const corpus = 'the model reads the text and predicts the next token . the model predicts the next word from the context . the context holds the text the model can see . the answer looks plausible and the answer can be wrong . the next token is chosen from a list of probabilities .'.split(' ');
const nextCounts = w => { const m = {}; corpus.forEach((c, i) => { if (c === w && i + 1 < corpus.length) m[corpus[i + 1]] = (m[corpus[i + 1]] || 0) + 1; }); return m; };
function trace(L) {
  const T = L === 'ja'
    ? { title: '2回分の生成の実例', r: n => `${n}回目`, input: '入力', prob: '次の語の確率', picked: '選ばれた', carry: '選んだ語を足して、次の入力にする', more: 'これを繰り返して、文章になる', cap: '図{{N}} 記事のおもちゃのモデルの、実際の確率。どの語が選ばれるかは確率で決まるので、毎回同じとは限らない(この例では model、predicts が選ばれた)。' }
    : { title: 'A worked example of two rounds of generation', r: n => `Round ${n}`, input: 'Input', prob: 'Probability of the next word', picked: 'picked', carry: 'Append it for the next input', more: 'Repeat this, and you get text', cap: 'Figure {{N}}. Real probabilities from the toy model in this article. Which word is picked is decided by probability, so it is not always the same (in this example, model and predicts were picked).' };
  const panel = (y, round, input, picked) => {
    const c = nextCounts(input.split(' ').at(-1)); const total = Object.values(c).reduce((a, b) => a + b, 0);
    const rows = Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const h = 52 + rows.length * 20;
    let b = rect(10, y, 380, h, 'd-box') + txt(24, y + 24, `${T.r(round)}`, 'd-strong') + txt(24 + 62, y + 24, `${T.input}:`, 'd-small') + txt(24 + 62 + 44, y + 24, input, 'd-mono d-strong');
    b += txt(24, y + 44, T.prob, 'd-small');
    rows.forEach(([w, n], i) => {
      const yy = y + 54 + i * 20, p = n / total * 100, hit = w === picked;
      b += txt(24, yy + 12, w, 'd-mono') + `<rect x="100" y="${yy}" width="${(p * 3.4).toFixed(1)}" height="15" rx="3" class="${hit ? 'd-accent' : 'd-bar'}"/>` + txt(100 + p * 3.4 + 7, yy + 12, `${p.toFixed(1)}%`, 'd-small');
      if (hit) b += txt(376, yy + 12, `← ${T.picked}`, 'd-small d-strong', 'end');
    });
    return { svg: b, h };
  };
  const p1 = panel(8, 1, 'the', 'model');
  const y2 = 8 + p1.h + 44;
  const p2 = panel(y2, 2, 'the model', 'predicts');
  let b = p1.svg + arrow('tr-a', `M200 ${8 + p1.h + 2} V${y2 - 3}`) + txt(212, 8 + p1.h + 27, T.carry, 'd-small') + p2.svg + txt(200, y2 + p2.h + 22, T.more, 'd-small', 'middle');
  return figure('tr', 400, y2 + p2.h + 34, T.title, b, T.cap);
}

// ---- B: 温度と確率(実行結果の数値から作る) ----
const counts = { model: 3, text: 2, next: 3, context: 2, answer: 2 };
const probs = t => { const w = Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, Math.pow(n, 1 / t)])); const sum = Object.values(w).reduce((a, b) => a + b, 0); return Object.entries(w).map(([k, v]) => [k, v / sum * 100]); };
function bars(L) {
  const T = L === 'ja'
    ? { title: '温度ごとの、「the」の次の単語の確率', temp: '温度', notes: { 0.5: '多い語に集まる', 1: '回数どおり', 2: '差が縮まる' }, legend: '濃い色:最も多い語(model と next)', cap: '図{{N}} 「the」の次の単語の確率(本文の実行結果と同じ数値)。温度を下げると多い語に集まり、上げると差が縮まる。' }
    : { title: 'Probability of the word after “the”, by temperature', temp: 'Temperature', notes: { 0.5: 'concentrates on frequent words', 1: 'follows the counts', 2: 'gap narrows' }, legend: 'Darker: the most frequent words (model and next)', cap: 'Figure {{N}}. Probability of the word after “the” (same numbers as the output above). Lower temperature concentrates on frequent words; higher narrows the gap.' };
  let b = '';
  [0.5, 1, 2].forEach((t, i) => {
    const y0 = 10 + i * 140;
    b += txt(10, y0 + 14, `${T.temp} ${t}`, 'd-strong') + txt(390, y0 + 14, T.notes[t], 'd-small', 'end');
    probs(t).forEach(([w, p], j) => {
      const y = y0 + 26 + j * 22, top = counts[w] === 3;
      b += txt(10, y + 12, w, 'd-mono') + `<rect x="84" y="${y}" width="${(p * 6).toFixed(1)}" height="15" rx="3" class="${top ? 'd-accent' : 'd-bar'}"/>` + txt(84 + p * 6 + 7, y + 12, `${p.toFixed(1)}%`, 'd-small');
    });
  });
  b += txt(10, 438, T.legend, 'd-small');
  return figure('bt', 400, 448, T.title, b, T.cap);
}

// ---- C: コンテキストウィンドウ ----
function windowBars(L) {
  const T = L === 'ja'
    ? { title: 'コンテキストウィンドウの中身と、会話が進んだときの変化', first: '最初のやり取り', later: '会話が進んだあと', limit: '上限', legend: ['システムプロンプトとツールの定義', 'これまでの会話(すべての発言)', 'ツールの結果、画像、文書', '今回の出力(これも数える)', '空き(なくなると上限に達する)'], cap: '図{{N}} コンテキストウィンドウには、入力だけでなく出力も入る。会話が進むほど履歴が積み重なり、空きが減る。割合は説明用の概念図で、実際の値ではない。' }
    : { title: 'What fills the context window, and how it changes as a conversation grows', first: 'First exchange', later: 'Later in the conversation', limit: 'limit', legend: ['System prompt and tool definitions', 'Conversation so far (every message)', 'Tool results, images, documents', 'This turn’s output (counts too)', 'Free space (the limit is reached when it runs out)'], cap: 'Figure {{N}}. The context window holds the output as well as the input. As the conversation grows, history piles up and free space shrinks. Proportions are illustrative, not real values.' };
  let clipN = 0;
  const seg = (y, parts) => {
    const id = `cw-c${++clipN}`; let X = 10; const cls = ['d-seg-sys', 'd-seg-hist', 'd-seg-tool', 'd-seg-out'];
    let s = `<clipPath id="${id}"><rect x="10" y="${y}" width="380" height="34" rx="6"/></clipPath><g clip-path="url(#${id})">`;
    parts.forEach((f, i) => { if (!f) return; const w = f * 380; s += `<rect x="${X.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="34" class="${cls[i]}"/>`; X += w; });
    return s + '</g>' + rect(10, y, 380, 34, 'd-plain', 6);
  };
  let b = txt(10, 16, T.first, 'd-strong') + txt(390, 16, T.limit + ' |', 'd-small', 'end') + seg(24, [.10, .04, 0, .08]);
  b += txt(10, 92, T.later, 'd-strong') + seg(100, [.10, .50, .22, .08]);
  T.legend.forEach((s, i) => { const y = 164 + i * 26; b += i < 4 ? `<rect x="10" y="${y}" width="14" height="14" rx="3" class="${['d-seg-sys', 'd-seg-hist', 'd-seg-tool', 'd-seg-out'][i]}"/>` : `<rect x="10" y="${y}" width="14" height="14" rx="3" class="d-dash"/>`; b += txt(34, y + 12, s); });
  return figure('cw', 400, 300, T.title, b, T.cap);
}

// ---- D: 権限ルールの評価順 ----
function permFlow(L) {
  const T = L === 'ja'
    ? { title: '権限ルールの評価の流れ', start: 'ツールの呼び出し', q: ['denyルールに一致?', 'askルールに一致?', 'allowルールに一致?'], out: ['ブロック', '毎回確認', '確認なしで実行'], ex: ['Bash(git push *)', 'Bash(rm *)', 'Bash(npm run *)'], exLabel: 'ルールの例', no: 'いいえ', yes: 'はい', def: '権限モードの既定の動作', defSub: '(defaultなら初回は確認)', n1: '最初に一致したものが結果になる。', n2: '広いdenyを、狭いallowで覆すことはできない。', cap: '図{{N}} ルールは deny、ask、allow の順に調べ、最初に一致したものが結果になる。どれにも一致しなければ、権限モードの既定の動作になる。' }
    : { title: 'How permission rules are evaluated', start: 'Tool call', q: ['Matches a deny rule?', 'Matches an ask rule?', 'Matches an allow rule?'], out: ['Blocked', 'Ask every time', 'Allowed'], ex: ['Bash(git push *)', 'Bash(rm *)', 'Bash(npm run *)'], exLabel: 'Example rule', no: 'No', yes: 'Yes', def: 'Mode’s default behavior', defSub: '(default mode asks the first time)', n1: 'The first match decides the result.', n2: 'A narrow allow can’t override a broad deny.', cap: 'Figure {{N}}. Rules are checked in the order deny, ask, allow, and the first match is the result. If none match, the permission mode’s default behavior applies.' };
  let b = rect(20, 6, 180, 34, 'd-accent-soft') + txt(110, 28, T.start, 'd-strong', 'middle') + arrow('pf-a', 'M110 42 V70');
  const cls = ['d-danger', 'd-warn', 'd-ok'];
  T.q.forEach((q, i) => {
    const y = 72 + i * 86;
    b += rect(20, y, 180, 50) + txt(110, y + 30, q, 'd-strong', 'middle');
    b += arrow('pf-a', `M200 ${y + 25} H238`) + txt(219, y + 17, T.yes, 'd-small', 'middle');
    b += rect(240, y, 140, 50, cls[i]) + txt(310, y + 21, T.out[i], 'd-strong', 'middle') + txt(310, y + 39, T.ex[i], 'd-small d-mono', 'middle');
    b += arrow('pf-a', `M110 ${y + 52} V${y + 84}`) + txt(118, y + 72, T.no, 'd-small');
  });
  b += txt(310, 62, T.exLabel, 'd-small', 'middle');
  b += rect(20, 330, 180, 52, 'd-box') + txt(110, 353, T.def, 'd-strong', 'middle') + txt(110, 371, T.defSub, 'd-small', 'middle');
  b += txt(20, 410, T.n1, 'd-small') + txt(20, 428, T.n2, 'd-small');
  return figure('pf', 400, 440, T.title, b, T.cap);
}

// ---- E: CLAUDE.md の読み込み ----
function mdLoad(L) {
  const T = L === 'ja'
    ? { title: 'CLAUDE.mdが読み込まれる順番', rows: [['ユーザー', '全プロジェクト共通の好み', '~/.claude/CLAUDE.md'], ['上位のディレクトリ', 'モノレポ全体の共通ルールなど', '../CLAUDE.md'], ['プロジェクト', 'チームで共有する規約', './CLAUDE.md'], ['ローカル', '自分だけのメモ(.gitignoreに入れる)', './CLAUDE.local.md']], join: '起動時にすべて読み込み、上から順に連結する(上書きではない)', lazy: 'サブディレクトリの CLAUDE.md', lazy1: 'Claudeがそのディレクトリのファイルを', lazy2: '読み書きしたときに読み込まれる', cap: '図{{N}} 作業ディレクトリとその上位にあるCLAUDE.mdは、起動時に範囲の広いものから順に連結される。サブディレクトリのものは、必要になったときに読み込まれる。' }
    : { title: 'The order CLAUDE.md files are loaded', rows: [['User', 'Preferences for every project', '~/.claude/CLAUDE.md'], ['Parent directories', 'Shared rules, e.g. a monorepo', '../CLAUDE.md'], ['Project', 'Conventions shared with your team', './CLAUDE.md'], ['Local', 'Your own notes (add to .gitignore)', './CLAUDE.local.md']], join: 'All loaded at launch and concatenated top to bottom (not overridden)', lazy: 'CLAUDE.md in a subdirectory', lazy1: 'Loaded when Claude reads or writes', lazy2: 'a file in that directory', cap: 'Figure {{N}}. CLAUDE.md files in the working directory and above are concatenated at launch, broadest first. Those in subdirectories are loaded when needed.' };
  let b = '';
  T.rows.forEach(([label, hint, path], i) => {
    const y = 10 + i * 64;
    b += rect(20, y, 360, 50) + txt(36, y + 22, label, 'd-strong') + txt(36, y + 40, hint, 'd-small') + txt(364, y + 22, path, 'd-mono', 'end');
    if (i < 3) b += arrow('md-a', `M200 ${y + 51} V${y + 63}`);
  });
  b += txt(200, 280, T.join, 'd-small', 'middle');
  b += rect(20, 300, 360, 64, 'd-dash', 8) + txt(36, 324, T.lazy, 'd-strong') + txt(36, 343, T.lazy1, 'd-small') + txt(36, 357, T.lazy2, 'd-small');
  return figure('md', 400, 376, T.title, b, T.cap);
}

// ---- F: プランモード ----
function planFlow(L) {
  const T = L === 'ja'
    ? { title: 'プランモードの流れ', steps: [['調べる', 'ファイルを読む', '編集なし'], ['計画を出す', '変更の方針を提案する', '編集なし'], ['あなたが確認', 'OKなら承認、違えば修正を依頼', '編集なし'], ['実行', '承認したあとで、ファイルを編集する', '編集する']], cap: '図{{N}} プランモードでは、Claudeは承認されるまでファイルを編集しない。方向がずれていたら、計画の段階なら文章を直すだけで済む。' }
    : { title: 'The plan mode flow', steps: [['Investigate', 'Reads files', 'No edits'], ['Propose a plan', 'Suggests how it will change things', 'No edits'], ['You review', 'Approve, or ask for changes', 'No edits'], ['Execute', 'Edits files after you approve', 'Edits']], cap: 'Figure {{N}}. In plan mode, Claude doesn’t edit files until you approve. If the direction is wrong, fixing it at the plan stage means fixing only text.' };
  let b = '';
  T.steps.forEach(([h, sub, tag], i) => {
    const y = 10 + i * 78, last = i === 3;
    b += rect(20, y, 360, 56, last ? 'd-warn' : 'd-ok');
    b += `<circle cx="46" cy="${y + 28}" r="12" class="d-accent"/>` + txt(46, y + 32.5, i + 1, 'd-white', 'middle');
    b += txt(70, y + 24, h, 'd-strong') + txt(70, y + 42, sub, 'd-small') + txt(368, y + 20, tag, 'd-small', 'end');
    if (i < 3) b += arrow('pl-a', `M200 ${y + 58} V${y + 76}`);
  });
  return figure('pl', 400, 322, T.title, b, T.cap);
}


// ---- メンタルヘルス: 気づく→止める→話す→戻す ----
function mhFlow(L) {
  const T = L === 'ja'
    ? { title: '燃え尽きる前の4つの手順', steps: [['気づく', '2週間以上続くサインを、日付つきでメモする'], ['小さく止める', '通知を切る、断る、睡眠を守る'], ['人に話す', '同僚・上司・産業医・相談窓口'], ['戻す', '負荷を下げたまま、少しずつ元の進め方に戻す']], cap: '図{{N}} 大きく崩れる前の、小さな段階で手を打つ。3の「話す」は、1や2と並行して、いつでも使ってよい。' }
    : { title: 'Four steps before you burn out', steps: [['Notice', 'Note signs lasting two weeks or more, with dates'], ['Step back a little', 'Turn off notifications, say no, protect sleep'], ['Talk to someone', 'Colleague, manager, occupational physician, support line'], ['Recover', 'Keep the load lower; return to your pace slowly']], cap: 'Figure {{N}}. Act at the small stage, before a big collapse. Step 3, talking, can be used at any time alongside 1 and 2.' };
  let b = '';
  T.steps.forEach(([h, sub], i) => {
    const y = 10 + i * 78;
    b += rect(20, y, 360, 56, 'd-ok');
    b += `<circle cx="46" cy="${y + 28}" r="12" class="d-accent"/>` + txt(46, y + 32.5, i + 1, 'd-white', 'middle');
    b += txt(70, y + 24, h, 'd-strong') + txt(70, y + 42, sub, 'd-small');
    if (i < 3) b += arrow('mh-a', `M200 ${y + 58} V${y + 76}`);
  });
  return figure('mh', 400, 322, T.title, b, T.cap);
}

// ---- git worktree: 1つの.gitを共有する複数の作業フォルダ ----
function wtFlow(L) {
  const T = L === 'ja'
    ? { title: '1つのリポジトリと、複数の作業フォルダ', repo: '.git(履歴とブランチ)', share: '共有される', dirs: [['app', 'main'], ['app-fix', 'fix/typo'], ['app-review', 'pr-42']], cap: '図{{N}} 履歴は.gitに1つだけ。作業フォルダごとに、別のブランチが開かれる。' }
    : { title: 'One repository, several working folders', repo: '.git (history and branches)', share: 'shared', dirs: [['app', 'main'], ['app-fix', 'fix/typo'], ['app-review', 'pr-42']], cap: 'Figure {{N}}. The history lives once in .git. Each working folder has a different branch open.' };
  let b = rect(60, 10, 280, 56, 'd-accent-soft') + txt(200, 34, T.repo, 'd-strong', 'middle') + txt(200, 54, T.share, 'd-small', 'middle');
  T.dirs.forEach(([d, br], i) => {
    const X = 10 + i * 130;
    b += arrow('wt-a', `M${X + 60} 126 V96 H${[130, 200, 270][i]} V68`);
    b += rect(X, 128, 120, 72, 'd-ok') + txt(X + 60, 154, d, 'd-strong d-mono', 'middle') + txt(X + 60, 178, br, 'd-small d-mono', 'middle');
  });
  return figure('wt', 400, 212, T.title, b, T.cap);
}

// ---- Transformer: 学習前の乱数の重みで、attention を1ヘッド分計算する(記事のコードと同じ式) ----
const ATTN_TOKENS = ['the', 'model', 'predicts', 'the', 'next'];
function attention(seed = 2, d = 4) {
  let sd = seed; const random = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const matrix = (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => random() * 2 - 1));
  const mul = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((sum, v, k) => sum + v * B[k][j], 0)));
  const transpose = A => A[0].map((_, j) => A.map(row => row[j]));
  const softmax = row => { const m = Math.max(...row); const e = row.map(v => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
  const X = matrix(ATTN_TOKENS.length, d); const Wq = matrix(d, d), Wk = matrix(d, d), Wv = matrix(d, d);
  const Q = mul(X, Wq), K = mul(X, Wk), V = mul(X, Wv);
  const scores = mul(Q, transpose(K)).map(row => row.map(v => v / Math.sqrt(d)));
  const weights = scores.map((row, i) => softmax(row.map((v, j) => (j <= i ? v : -Infinity))));
  return { scores, weights, output: mul(weights, V) };
}
const ATTN = attention();

// ---- T1: Transformer の全体像(下から上へ。動く点で流れを見せる) ----
function arch(L) {
  const T = L === 'ja'
    ? { title: 'Transformer(デコーダー型)の全体像', probs: '次のトークンの確率', softmax: 'Softmax', softmaxSub: '温度はここで効く', linear: 'Linear', linearSub: '語彙の数だけスコアを出す', addnorm: '足して正規化', ffn: 'フィードフォワード', ffnSub: '各トークンを別々に加工', attn: 'マスク付き self-attention', attnSub: 'どのトークンを見るか決めて集める', emb: '埋め込み + 位置の情報', embSub: 'トークンをベクトルにする', layers: '× N 層', skip: '残差', cap: '図{{N}} 一般的なTransformer(デコーダー型)の流れ。下の入力から上の確率まで、データは下から上へ流れる。枠の中を何層も重ねる。' }
    : { title: 'Overview of a Transformer (decoder-style)', probs: 'Next-token probabilities', softmax: 'Softmax', softmaxSub: 'temperature acts here', linear: 'Linear', linearSub: 'a score for every vocabulary entry', addnorm: 'Add & Norm', ffn: 'Feed-forward', ffnSub: 'processes each token separately', attn: 'Masked self-attention', attnSub: 'decides which tokens to look at', emb: 'Embedding + position info', embSub: 'turns tokens into vectors', layers: '× N layers', skip: 'skip', cap: 'Figure {{N}}. The flow of a typical decoder-style Transformer. Data flows from the input at the bottom to the probabilities at the top. The framed part is stacked many times.' };
  const box = (y, h, label, sub, cls = 'd-box') => rect(70, y, 260, h, cls) + txt(200, y + (sub ? 19 : h / 2 + 5), label, 'd-strong', 'middle') + (sub ? txt(200, y + 35, sub, 'd-small', 'middle') : '');
  const up = (y1, y2) => arrow('ar-a', `M200 ${y1} V${y2}`);
  let b = '';
  // 出力: 確率の棒(山の形だけのイメージ)
  [0.18, 0.34, 0.9, 0.26, 0.5].forEach((v, i) => { const h = 34 * v; b += `<rect x="${130 + i * 28}" y="${52 - h}" width="18" height="${h}" rx="2" class="${i === 2 ? 'd-accent' : 'd-bar'}"/>`; });
  b += txt(200, 14, T.probs, 'd-small', 'middle');
  b += up(72, 56) + box(76, 40, T.softmax, T.softmaxSub) + up(130, 118) + box(134, 40, T.linear, T.linearSub) + up(190, 176);
  b += rect(24, 190, 352, 252, 'd-dash', 12) + txt(366, 208, T.layers, 'd-strong', 'end');
  b += box(214, 36, T.addnorm) + up(264, 252) + box(268, 40, T.ffn, T.ffnSub) + up(322, 310) + box(326, 36, T.addnorm) + up(376, 364) + box(380, 50, T.attn, T.attnSub, 'd-accent-soft');
  b += arrow('ar-a', 'M200 450 V432');
  b += `<path d="M200 440 H46 V344 H68" class="d-skip" marker-end="url(#ar-a)"/>` + `<path d="M200 316 H46 V232 H68" class="d-skip" marker-end="url(#ar-a)"/>` + txt(30, 396, T.skip, 'd-small') + txt(30, 282, T.skip, 'd-small');
  b += box(458, 44, T.emb, T.embSub) + arrow('ar-a', 'M200 530 V504');
  ['the', 'model', 'predicts'].forEach((w, i) => { const cx = 120 + i * 80; b += rect(cx - 36, 534, 72, 26, 'd-accent-soft', 13) + txt(cx, 552, w, 'd-mono', 'middle'); });
  // データの流れ(上へ向かう点)
  [0, 1.7, 3.4].forEach(delay => { b += `<circle r="3.5" class="d-flow" opacity="0"><animateMotion dur="5.1s" begin="${delay}s" repeatCount="indefinite" path="M200 534 V60"/><animate attributeName="opacity" dur="5.1s" begin="${delay}s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/></circle>`; });
  return figure('ar', 400, 576, T.title, b, T.cap);
}

// ---- T2: 「next」の1行(内積 → softmax → 重み → Vの足し合わせ) ----
function attnRow(L) {
  const i = ATTN_TOKENS.length - 1;
  const T = L === 'ja'
    ? { title: '「next」が前のトークンを見る重み', head: '「next」が、どのトークンをどれだけ見るか', c1: '内積÷√d', c2: '重み(softmax後)', sum: '重みでVを足し合わせる', out: 'nextの新しいベクトル', cap: '図{{N}} 最後の行(next)の計算。内積のスコアをsoftmaxにかけて重みにし、その重みでVを足し合わせたものが、nextの新しいベクトルになる。数値は前の節のコードの結果。' }
    : { title: 'How much “next” looks at each earlier token', head: 'How much “next” looks at each token', c1: 'score', c2: 'weight', sum: 'Add up V using the weights', out: 'New vector for “next”', cap: 'Figure {{N}}. The calculation for the last row (next). The dot-product scores go through softmax to become weights, and adding up V with those weights gives the new vector for next. The numbers are from the code above.' };
  let b = txt(14, 20, T.head, 'd-strong') + txt(130, 46, T.c1, 'd-small') + txt(206, 46, T.c2, 'd-small');
  ATTN_TOKENS.forEach((w, j) => {
    const y = 56 + j * 30, wt = ATTN.weights[i][j], hit = wt === Math.max(...ATTN.weights[i]);
    b += txt(14, y + 15, w, 'd-mono') + txt(130, y + 15, ATTN.scores[i][j].toFixed(2), 'd-small d-mono') + `<rect x="206" y="${y}" width="${(wt * 290).toFixed(1)}" height="20" rx="4" class="${hit ? 'd-accent' : 'd-bar'}"/>` + txt(206 + wt * 290 + 7, y + 15, wt.toFixed(2), 'd-small d-mono');
  });
  b += arrow('ra-a', 'M200 214 V240') + rect(60, 242, 280, 30, 'd-box') + txt(200, 262, T.sum, 'd-strong', 'middle') + arrow('ra-a', 'M200 274 V298');
  b += txt(14, 320, T.out, 'd-small');
  ATTN.output[i].forEach((v, k) => { b += rect(14 + k * 94, 328, 86, 34, 'd-accent-soft', 6) + txt(57 + k * 94, 350, v.toFixed(2), 'd-mono', 'middle'); });
  return figure('ra', 400, 378, T.title, b.replaceAll('ra-a', 'ra-a'), T.cap);
}

// ---- T3: attention の重みのヒートマップ(未来はマスクされて見えない) ----
function heat(L) {
  const T = L === 'ja'
    ? { title: 'attentionの重み(5トークン × 5トークン)', rows: '見る側', cols: '見られる側', mask: '未来のトークン(見えない)', scale: '重み', cap: '図{{N}} 実際に計算した重み(行が見る側、列が見られる側)。右上は未来のトークンなので見えず、各行の合計は1。枠で囲んだ行が、次の図で詳しく見る next の行。' }
    : { title: 'Attention weights (5 tokens × 5 tokens)', rows: 'Looking', cols: 'Being looked at', mask: 'Future tokens (hidden)', scale: 'weight', cap: 'Figure {{N}}. The weights as actually computed (rows look, columns are looked at). The upper right is future tokens, which are hidden, and every row sums to 1. The outlined row (next) is examined in the next figure.' };
  const n = ATTN_TOKENS.length, cell = 56, gx = 96, gy = 66;
  let b = txt(gx - 8, 54, `↓ ${T.rows}`, 'd-small', 'end') + txt(gx, 20, `${T.cols} →`, 'd-small');
  ATTN_TOKENS.forEach((w, j) => { b += txt(gx + j * cell + cell / 2, 54, w, 'd-mono d-small', 'middle'); b += txt(gx - 8, gy + j * cell + cell / 2 + 4, w, 'd-mono d-small', 'end'); });
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const X = gx + c * cell, Y = gy + r * cell;
    if (c > r) b += `<rect x="${X + 2}" y="${Y + 2}" width="${cell - 4}" height="${cell - 4}" rx="6" class="d-dash"/>` + txt(X + cell / 2, Y + cell / 2 + 4, '×', 'd-small', 'middle');
    else { const w = ATTN.weights[r][c]; b += `<rect x="${X + 2}" y="${Y + 2}" width="${cell - 4}" height="${cell - 4}" rx="6" class="d-accent" fill-opacity="${(0.1 + 0.75 * w).toFixed(2)}"/>` + txt(X + cell / 2, Y + cell / 2 + 4, w.toFixed(2), 'd-mono', 'middle'); }
  }
  b += `<rect x="${gx - 1}" y="${gy + (n - 1) * cell}" width="${n * cell + 2}" height="${cell}" rx="8" class="d-outline"/>`;
  const ly = gy + n * cell + 26;
  b += `<defs><linearGradient id="hm-g"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.1"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:.85"/></linearGradient></defs>` + `<rect x="${gx}" y="${ly}" width="140" height="12" rx="6" fill="url(#hm-g)"/>` + txt(gx, ly + 28, '0', 'd-small') + txt(gx + 140, ly + 28, '1', 'd-small', 'end') + txt(gx + 70, ly + 28, T.scale, 'd-small', 'middle');
  b += `<rect x="${gx}" y="${ly + 44}" width="16" height="16" rx="4" class="d-dash"/>` + txt(gx + 24, ly + 57, T.mask, 'd-small');
  return figure('hm', 400, ly + 76, T.title, b, T.cap);
}


// ---- S1: 実験結果の一覧(設定 A〜D × 読み方)。値は記事の実験で実際に得た結果 ----
// L=漏れた  S=ルールが止めた  O=OS(サンドボックス)が止めた  R=Claude自身が断った  -=試していない
const ENV_RESULTS = [
  ['file',   'L', 'R', 'S', 'S'],
  ['cat',    'L', 'R', 'S', 'O'],
  ['grep',   'L', '-', 'L', 'O'],
  ['python', 'L', '-', 'L', 'O'],
  ['sh',     'L', '-', 'L', 'O'],
  ['bin',    '-', '-', 'L', 'O'],
  ['cp',     '-', '-', 'S', 'O'],
  ['indirect', 'L', 'R', 'S', '-']
];
function leakMatrix(L) {
  const T = L === 'ja'
    ? { title: 'Claude Codeに.envを読ませた実験の結果', rows: { file: 'Readツールで読む', cat: 'cat .env', grep: 'grep -r API .', python: 'python3 で open()', sh: "sh -c 'cat .env'", bin: '/bin/cat .env', cp: 'cp して cat', indirect: '間接的な依頼(DB調査)' }, cols: ['設定なし', 'CLAUDE.md', 'deny', 'deny+SB'], L: '漏れた', S: '止まった', O: 'OS遮断', R: '断った', legend: [['L', '漏れた(秘密がモデルに届いた)'], ['S', 'ルールが止めた'], ['O', 'OS(サンドボックス)が止めた'], ['R', 'Claude自身が断った'], ['-', '試していない']], cap: '図{{N}} 偽の.envを置いた使い捨てフォルダで、Claude Codeに実際に読ませた結果。設定Cは Read(./.env) のdenyだけ、設定Dはdenyにサンドボックスを足したもの。各1回の実行。' }
    : { title: 'Results of making Claude Code read a .env', rows: { file: 'Read tool', cat: 'cat .env', grep: 'grep -r API .', python: 'python3 open()', sh: "sh -c 'cat .env'", bin: '/bin/cat .env', cp: 'cp, then cat', indirect: 'Indirect (DB debugging)' }, cols: ['None', 'CLAUDE.md', 'deny', 'deny+SB'], L: 'Leaked', S: 'Blocked', O: 'OS block', R: 'Refused', legend: [['L', 'Leaked (the secret reached the model)'], ['S', 'Blocked by a rule'], ['O', 'Blocked by the OS (sandbox)'], ['R', 'Refused by Claude itself'], ['-', 'Not tested']], cap: 'Figure {{N}}. Results of making Claude Code actually read a fake .env in a throwaway folder. Setup C is only a Read(./.env) deny; setup D adds the sandbox to the deny. One run each.' };
  const x0 = 150, cw = 62, y0 = 52, rh = 30;
  const style = { L: 'd-danger', S: 'd-ok', O: 'd-ok', R: 'd-warn', '-': 'd-plain' };
  let b = '';
  T.cols.forEach((c, i) => { b += txt(x0 + i * cw + cw / 2, 20, ['A', 'B', 'C', 'D'][i], 'd-strong', 'middle') + txt(x0 + i * cw + cw / 2, 38, c, 'd-small', 'middle'); });
  ENV_RESULTS.forEach(([key, ...cells], r) => {
    const y = y0 + r * rh;
    b += txt(8, y + 19, T.rows[key], key === 'indirect' ? 'd-small' : 'd-small d-strong');
    cells.forEach((v, i) => {
      b += rect(x0 + i * cw + 2, y + 2, cw - 4, rh - 4, style[v], 6) + (v === '-' ? txt(x0 + i * cw + cw / 2, y + 20, '—', 'd-small', 'middle') : txt(x0 + i * cw + cw / 2, y + 20, T[v], 'd-small d-strong', 'middle'));
    });
  });
  const ly = y0 + ENV_RESULTS.length * rh + 22;
  T.legend.forEach(([k, label], i) => { const yy = ly + i * 22; b += rect(10, yy, 22, 14, style[k], 4) + txt(40, yy + 11, label, 'd-small'); });
  return figure('lm', 400, ly + T.legend.length * 22 + 6, T.title, b, T.cap);
}


// ---- U1: 家族の絵文字(👨‍👩‍👧)の「層」。値は記事の実測(UTF-16 8単位、UTF-8 18バイト、コードポイント5つ) ----
function strLayers(L) {
  const T = L === 'ja'
    ? { title: '家族の絵文字の長さは、数え方で変わる', look: '見た目は1文字', cp: 'コードポイント(5つ)', u16: 'UTF-16(8単位)', u8: 'UTF-8(18バイト)', std: '各言語の「標準の長さ」', chips: [['JavaScript', '.length', '8', 'UTF-16の単位', 'd-ok'], ['Python', 'len()', '5', 'コードポイント', 'd-accent-soft'], ['Rust', '.len()', '18', 'UTF-8のバイト', 'd-warn'], ['Swift', '.count', '1', '見た目の1文字', 'd-box']], cap: '図{{N}} 家族の絵文字は、人には1文字に見える。中身は、コードポイント5つ(ゼロ幅結合子を含む)、UTF-16で8単位、UTF-8で18バイト。言語ごとの標準の「長さ」が、どれを数えるかで、答えが変わる。' }
    : { title: 'The length of a family emoji depends on what you count', look: 'Looks like 1 character', cp: 'Code points (5)', u16: 'UTF-16 (8 units)', u8: 'UTF-8 (18 bytes)', std: 'Each language’s default “length”', chips: [['JavaScript', '.length', '8', 'UTF-16 units', 'd-ok'], ['Python', 'len()', '5', 'code points', 'd-accent-soft'], ['Rust', '.len()', '18', 'UTF-8 bytes', 'd-warn'], ['Swift', '.count', '1', 'user-perceived chars', 'd-box']], cap: 'Figure {{N}}. A family emoji looks like one character to a person. Inside, it is 5 code points (including zero-width joiners), 8 UTF-16 units and 18 UTF-8 bytes. Each language’s default “length” counts a different one of these.' };
  const W = 376, X0 = 12;
  let b = `<text x="200" y="52" text-anchor="middle" style="font-size:38px">\u{1F468}‍\u{1F469}‍\u{1F467}</text>` + txt(200, 74, T.look, 'd-small', 'middle');
  const label = (y, t) => txt(X0, y, t, 'd-small d-strong');
  // コードポイント: 5つの箱
  b += label(92, T.cp);
  ['\u{1F468}', 'ZWJ', '\u{1F469}', 'ZWJ', '\u{1F467}'].forEach((c, i) => { const bw = 68, gap = 9, x = X0 + i * (bw + gap); const zwj = c === 'ZWJ'; b += rect(x, 98, bw, 34, zwj ? 'd-box' : 'd-accent-soft', 6) + (zwj ? txt(x + bw / 2, 120, 'ZWJ', 'd-small d-mono', 'middle') : `<text x="${x + bw / 2}" y="123" text-anchor="middle" style="font-size:20px">${c}</text>`); });
  // UTF-16 と UTF-8: 幅は、単位数・バイト数に比例
  const bar = (y, parts, cls) => { const total = parts.reduce((a, b) => a + b, 0); let x = X0, o = ''; parts.forEach((n, i) => { const w = n / total * W; o += `<rect x="${x.toFixed(1)}" y="${y}" width="${(w - 2).toFixed(1)}" height="30" rx="4" class="${cls}" fill-opacity="${i % 2 ? .55 : 1}"/>` + txt(x + (w - 2) / 2, y + 20, n, 'd-white', 'middle'); x += w; }); return o; };
  b += label(158, T.u16) + bar(164, [2, 1, 2, 1, 2], 'd-seg-tool');
  b += label(220, T.u8) + bar(226, [4, 3, 4, 3, 4], 'd-seg-out');
  // 各言語の標準の長さ
  b += txt(X0, 292, T.std, 'd-small d-strong');
  T.chips.forEach(([lang, api, n, what, cls], i) => { const x = X0 + (i % 2) * 192, y = 300 + Math.floor(i / 2) * 52; b += rect(x, y, 184, 44, cls, 8) + txt(x + 10, y + 19, `${lang}  ${api}`, 'd-small d-mono') + txt(x + 10, y + 36, what, 'd-small') + txt(x + 174, y + 32, n, 'd-strong', 'end').replace('<text', '<text style="font-size:22px"'); });
  return figure('ul', 400, 410, T.title, b, T.cap);
}


// ---- v2: ローカルLLM記事の図(アイコン付きのノード、層のパネル、流れる点) ----
const SEG = { os: 'd-seg-hist', w: 'd-seg-sys', kv: 'd-seg-out' };
const ICONS = {
  user: 'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5',
  server: 'M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01',
  chip: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
  db: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  doc: 'M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
  cloud: 'M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z',
  laptop: 'M5 6h14v9H5zM3 19h18',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  convert: 'M4 12h11M11 8l4 4-4 4M19 5v14',
  dots: 'M10 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM17 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM12 7v5M12 12l-6 5M12 12l6 5',
  chart: 'M4 20V11M10 20V4M16 20v-8M3 20h18',
  layers: 'M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  check: 'M5 12.5l4.5 4.5L19 7',
  chat: 'M4 5h16v11H9l-5 4z',
  eyeoff: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM4 4l16 16',
};
const ico = (cx, cy, name, kind) => `<g class="k-${kind}"><g transform="translate(${cx - 9},${cy - 9}) scale(.75)" class="d-ico"><path d="${ICONS[name]}"/></g></g>`;
const defs2 = id => `<defs><filter id="${id}-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="${id}-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs>`;
const fig2 = (id, w, h, title, body, cap) => `<figure class="diagram"><svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t"><title id="${id}-t">${x(title)}</title>${defs2(id)}${body}</svg><figcaption>${x(cap)}</figcaption></figure>`;
const grp = (id, X, Y, W, H, title) => `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="14" fill="url(#${id}-g)" class="d-group"/>` + txt(X + 16, Y + 20, title, 'd-gtitle');
// ノード: 左にアイコンのバッジ、右に題名と補足
function nd(id, X, Y, W, H, kind, icon, title, sub = '') {
  const cy = Y + H / 2;
  return `<g class="k-${kind}"><rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="11" class="d-node" filter="url(#${id}-sh)"/><circle cx="${X + 24}" cy="${cy}" r="14" class="d-badge"/></g>` + ico(X + 24, cy, icon, kind)
    + txt(X + 46, sub ? cy - 2 : cy + 4.5, title, 'd-ntitle') + (sub ? txt(X + 46, cy + 13, sub, 'd-nsub') : '');
}
// 中央揃えのノード(幅が狭いとき): 上にバッジ、下に題名と補足
function ndc(id, X, Y, W, H, kind, icon, title, sub = '') {
  const cx = X + W / 2;
  return `<g class="k-${kind}"><rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="11" class="d-node" filter="url(#${id}-sh)"/><circle cx="${cx}" cy="${Y + 21}" r="13" class="d-badge"/></g>` + ico(cx, Y + 21, icon, kind)
    + txt(cx, Y + 48, title, 'd-ntitle', 'middle') + (sub ? txt(cx, Y + 62, sub, 'd-nsub', 'middle') : '');
}
// 流れる点つきの矢印(pathは折れ線。点は動きを減らす設定のときは出ない)
let dotN = 0;
const fl = (id, d, dur = 2.4) => `<path d="${d}" class="d-path" marker-end="url(#${id}-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="${dur}s" begin="${(dotN++ % 4) * 0.5}s" repeatCount="indefinite" path="${d}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="${dur}s" begin="${((dotN - 1) % 4) * 0.5}s" repeatCount="indefinite"/></circle>`;
const pill = (X, Y, kind, text, W) => `<g class="k-${kind}"><rect x="${X}" y="${Y}" width="${W}" height="22" rx="11" class="d-pill"/></g>` + txt(X + W / 2, Y + 15, text, 'd-tagtext', 'middle');
const segBar2 = (id, X, Y, W, H, parts) => {
  let cx = X, o = `<clipPath id="${id}"><rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="7"/></clipPath><rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="7" class="d-tag"/><g clip-path="url(#${id})">`;
  parts.forEach(([f, cls]) => { o += `<rect x="${cx.toFixed(1)}" y="${Y}" width="${(f * W).toFixed(1)}" height="${H}" class="${cls} d-seg"/>`; cx += f * W; });
  return o + '</g>';
};

function localFlow(L) {
  const T = L === 'ja'
    ? { title: 'クラウドAPIとローカルLLMで、データが流れる場所', cloud: 'クラウドAPI', local: 'ローカルLLM', pc: 'あなたのPC', server: '事業者のサーバー', serverSub: 'モデルがここで動く', send: '入力を送る', back: '結果が返る', leave: '入力は通信で事業者に送られる', app: 'アプリ', appSub: 'チャットなど', engine: '推論エンジン', engineSub: 'Ollamaなど', w: 'モデルの重み', wSub: 'メモリに載せる', stay: '入力も出力も、PCの外に出ない', cap: '図{{N}} 仕組みは同じで、計算する場所が違う。ローカルでは、入力も出力もPCの中で完結する。' }
    : { title: 'Where the data flows: cloud API vs. local LLM', cloud: 'CLOUD API', local: 'LOCAL LLM', pc: 'Your PC', server: 'Provider cloud', serverSub: 'the model runs here', send: 'send input', back: 'result returns', leave: 'Your input is sent to the provider', app: 'App', appSub: 'chat, etc.', engine: 'Inference engine', engineSub: 'such as Ollama', w: 'Model weights', wSub: 'loaded in memory', stay: 'Input and output never leave the PC', cap: 'Figure {{N}} The mechanism is the same; where the computation happens differs. Locally, input and output stay inside the PC.' };
  const id = 'lf';
  let b = grp(id, 8, 8, 384, 122, T.cloud) + nd(id, 24, 36, 136, 52, 'n', 'laptop', T.pc) + nd(id, 224, 36, 152, 52, 'w', 'cloud', T.server, T.serverSub);
  b += fl(id, 'M164 54 H220') + fl(id, 'M220 72 H164') + txt(192, 48, T.send, 'd-nsub', 'middle') + txt(192, 86, T.back, 'd-nsub', 'middle') + txt(24, 118, T.leave, 'd-nsub');
  b += grp(id, 8, 146, 384, 244, T.local);
  b += nd(id, 70, 172, 260, 46, 'n', 'chat', T.app, T.appSub) + fl(id, 'M200 220 V240');
  b += nd(id, 70, 242, 260, 46, 'a', 'spark', T.engine, T.engineSub) + fl(id, 'M200 290 V310');
  b += nd(id, 70, 312, 260, 46, 'a', 'chip', T.w, T.wSub);
  b += `<g class="k-ok">${ico(104, 376, 'shield', 'ok')}</g>` + txt(124, 380, T.stay, 'd-ntitle');
  return fig2(id, 400, 398, T.title, b, T.cap);
}

function memConfigs(L) {
  const T = L === 'ja'
    ? { title: '動かし方ごとに、重みが載るメモリ', gpu: 'GPUを使う(NVIDIAなど)', main: 'メインメモリ', vram: 'ビデオメモリ(VRAM)', gpuNote: '重みがVRAMに収まれば速い', apple: 'Apple Silicon', uni: 'ユニファイドメモリ(CPUとGPUで共有)', cpu: 'CPUだけ', cpuNote: 'メインメモリ(動くが、GPUより遅い)', legend: ['OS・他のアプリ', 'モデルの重み', '会話のキャッシュ(KV)'], cap: '図{{N}} 「メモリ」が何を指すかは構成で変わる。どの構成でも、重みとキャッシュが、使える分に収まる必要がある。割合は説明用で、実際の値ではない。' }
    : { title: 'Which memory the weights sit in, by setup', gpu: 'With a GPU (such as NVIDIA)', main: 'Main memory', vram: 'Video memory (VRAM)', gpuNote: 'Fast if the weights fit in VRAM', apple: 'Apple Silicon', uni: 'Unified memory (shared by CPU and GPU)', cpu: 'CPU only', cpuNote: 'Main memory (works, but slower than a GPU)', legend: ['OS and other apps', 'Model weights', 'Conversation cache (KV)'], cap: 'Figure {{N}} What “memory” means depends on the setup. In every setup, the weights and the cache must fit in what is available. Proportions are illustrative, not real values.' };
  const id = 'mc', SG = [SEG.os, SEG.w, SEG.kv];
  const card = (Y, H, icon, kind, title) => `<g class="k-${kind}"><rect x="8" y="${Y}" width="384" height="${H}" rx="12" class="d-node" filter="url(#${id}-sh)"/><circle cx="34" cy="${Y + 26}" r="14" class="d-badge"/></g>` + ico(34, Y + 26, icon, kind) + txt(58, Y + 31, title, 'd-ntitle');
  let b = card(8, 124, 'chip', 'a', T.gpu) + segBar2('mc1', 24, 56, 124, 30, [[.5, SEG.os]]) + segBar2('mc2', 204, 56, 172, 30, [[.62, SEG.w], [.26, SEG.kv]]);
  b += txt(24, 106, T.main, 'd-nsub') + txt(204, 106, T.vram, 'd-nsub') + txt(204, 122, T.gpuNote, 'd-nsub');
  b += fl(id, 'M150 71 H202', 2.8) + fl(id, 'M202 80 H150', 2.8);
  b += card(148, 106, 'laptop', 'ok', T.apple) + segBar2('mc3', 24, 196, 352, 30, [[.18, SEG.os], [.5, SEG.w], [.17, SEG.kv]]) + txt(24, 242, T.uni, 'd-nsub');
  b += card(270, 106, 'server', 'n', T.cpu) + segBar2('mc4', 24, 318, 352, 30, [[.18, SEG.os], [.5, SEG.w], [.17, SEG.kv]]) + txt(24, 364, T.cpuNote, 'd-nsub');
  T.legend.forEach((n, i) => { const Y = 394 + i * 22; b += `<rect x="12" y="${Y}" width="14" height="14" rx="4" class="${SG[i]}"/>` + txt(34, Y + 12, n, 'd-nsub'); });
  return fig2(id, 400, 470, T.title, b, T.cap);
}

function memBudget(L) {
  const T = L === 'ja'
    ? { title: '人数と文脈の長さで、必要なメモリが増える', limit: '使えるメモリの上限', one: '1人・短い会話', four: '4人・長い文脈', fit: '収まる', over: 'あふれる', legend: ['OS・他のアプリ', 'モデルの重み', 'KVキャッシュ'], note: 'KVキャッシュは、文脈の長さ × 同時利用数で増える', cap: '図{{N}} 重みの大きさは変わらないが、KVキャッシュは使い方で増え、長い文脈を複数人で使うと上限を超えることがある。割合は説明用。' }
    : { title: 'Memory needed grows with users and context length', limit: 'Memory available', one: '1 user, short chat', four: '4 users, long context', fit: 'Fits', over: 'Overflows', legend: ['OS and other apps', 'Model weights', 'KV cache'], note: 'The KV cache grows with context length × concurrent users', cap: 'Figure {{N}} The weights stay the same size, but the KV cache grows with use. Long contexts for several users can exceed the limit. Proportions are illustrative.' };
  const id = 'mb', lim = 280, SG = [SEG.os, SEG.w, SEG.kv];
  const users = (X, Y, n) => Array.from({ length: n }, (_, i) => ico(X + 9 + i * 20, Y, 'user', 'a')).join('');
  const bar = (Y, os, w, kv) => {
    let cx = 14, o = `<rect x="14" y="${Y}" width="372" height="34" rx="8" class="d-tag"/>`;
    [[os, SEG.os], [w, SEG.w], [kv, SEG.kv]].forEach(([wd, cls]) => {
      const end = cx + wd, inside = Math.max(0, Math.min(end, lim) - cx), outside = wd - inside;
      if (inside > 0) o += `<rect x="${cx}" y="${Y}" width="${inside}" height="34" class="${cls} d-seg"/>`;
      if (outside > 0) o += `<rect x="${cx + inside}" y="${Y}" width="${outside}" height="34" class="d-over d-seg"/>`;
      cx = end;
    });
    return o;
  };
  let b = '';
  b += users(10, 40, 1) + txt(34, 44.5, T.one, 'd-ntitle') + bar(54, 24, 150, 16) + pill(14, 96, 'ok', T.fit, 70);
  b += users(10, 142, 4) + txt(96, 146.5, T.four, 'd-ntitle') + bar(156, 24, 150, 150) + pill(14, 198, 'd', T.over, 78);
  b += `<path d="M${lim} 30 V212" class="d-skip" stroke="var(--danger)"/>` + `<g class="k-d"><rect x="${lim - 62}" y="6" width="124" height="20" rx="10" class="d-pill"/></g>` + txt(lim, 20, T.limit, 'd-tagtext', 'middle');
  b += `<rect x="8" y="232" width="384" height="104" rx="12" class="d-node k-n"/>`;
  T.legend.forEach((n, i) => { const Y = 244 + i * 22; b += `<rect x="22" y="${Y}" width="14" height="14" rx="4" class="${SG[i]}"/>` + txt(44, Y + 12, n, 'd-nsub'); });
  b += ico(26, 320, 'layers', 'a') + txt(44, 324, T.note, 'd-nsub');
  return fig2(id, 400, 346, T.title, b, T.cap);
}

function servingArch(L) {
  const T = L === 'ja'
    ? { title: '複数人で使う推論サーバーの構成', users: ['ユーザーA', 'ユーザーB', 'ユーザーC'], server: '推論サーバー(vLLMなど)', queue: '要求の待ち行列', queueSub: '同時に来た要求をまとめて処理(バッチ)', kv: 'KVキャッシュの管理', kvSub: '人ごとのキャッシュを効率よく配置', gpu: n => `GPU ${n}`, w: '重みの半分', kvs: 'KVキャッシュ', link: 'GPU間の通信', linkNote: '分割するときは、GPU間の接続が速いことが要る', cap: '図{{N}} 要求はサーバーで受けてまとめ、複数のGPUに分けた重みで計算する。キャッシュは人数分のメモリを使う。' }
    : { title: 'Architecture of an inference server for several users', users: ['User A', 'User B', 'User C'], server: 'INFERENCE SERVER (such as vLLM)', queue: 'Request queue', queueSub: 'concurrent requests are batched', kv: 'KV cache management', kvSub: 'places each user’s cache efficiently', gpu: n => `GPU ${n}`, w: 'Half the weights', kvs: 'KV cache', link: 'GPU-to-GPU traffic', linkNote: 'Splitting a model needs a fast link between GPUs', cap: 'Figure {{N}} The server receives and batches requests, and computes with weights split across several GPUs. The cache uses memory for every user.' };
  const id = 'sa';
  let b = '';
  T.users.forEach((u, i) => { const X = 10 + i * 130; b += nd(id, X, 8, 120, 40, 'n', 'user', u) + fl(id, `M${X + 60} 50 V84`, 2 + i * .3); });
  b += grp(id, 8, 86, 384, 148, T.server);
  b += nd(id, 24, 110, 352, 50, 'a', 'layers', T.queue, T.queueSub) + fl(id, 'M200 162 V172') + nd(id, 24, 174, 352, 50, 'n', 'db', T.kv, T.kvSub);
  [0, 1].forEach(i => {
    const X = 8 + i * 204;
    b += fl(id, `M${X + 94} 236 V262`, 2.6);
    b += `<g class="k-a"><rect x="${X}" y="264" width="188" height="122" rx="12" class="d-node" filter="url(#${id}-sh)"/><circle cx="${X + 24}" cy="288" r="14" class="d-badge"/></g>` + ico(X + 24, 288, 'chip', 'a') + txt(X + 46, 293, T.gpu(i), 'd-ntitle');
    b += `<rect x="${X + 14}" y="308" width="160" height="30" rx="8" class="${SEG.w} d-seg"/>` + txt(X + 94, 327, T.w, 'd-white', 'middle');
    b += `<rect x="${X + 14}" y="344" width="160" height="30" rx="8" class="${SEG.kv} d-seg"/>` + txt(X + 94, 363, T.kvs, 'd-white', 'middle');
  });
  b += fl(id, 'M198 322 H212', 1.6) + fl(id, 'M212 340 H198', 1.6);
  b += ico(120, 408, 'chip', 'a') + txt(138, 412, T.link, 'd-ntitle') + txt(200, 430, T.linkNote, 'd-nsub', 'middle');
  return fig2(id, 400, 442, T.title, b, T.cap);
}

function ragArch(L) {
  const T = L === 'ja'
    ? { title: 'ローカルLLMで文書に答えるシステムの構成', inside: 'あなたのPCの中(文書は外に出ない)', prep: '準備(文書を変えたとき)', doc: '文書', docSub: '規程・マニュアル', split: '分割', splitSub: 'チャンクにする', idx: '検索用の索引', idxSub: '単語・ベクトル', ask: '質問のたび', q: '質問', qSub: 'ユーザーの入力', s: '検索', sSub: '関連するチャンクを選ぶ', f: '見つけた部分', fSub: '上位のチャンクに番号を付ける', p: 'プロンプトを組み立てる', pSub: '資料 + 質問 + 答え方のルール', m: 'ローカルLLM', mSub: 'Ollamaなど', a: '答え', aSub: '根拠の資料番号つき', use: '索引を使う', cap: '図{{N}} 文書は、あらかじめ分割して索引にしておく。質問のたびに、関連する部分だけを検索して、モデルに渡して答えさせる。すべてPCの中で完結する。' }
    : { title: 'Architecture of a document Q&A system with a local LLM', inside: 'INSIDE YOUR PC (documents never leave)', prep: 'PREPARATION (when documents change)', doc: 'Documents', docSub: 'rules, manuals', split: 'Split', splitSub: 'into chunks', idx: 'Search index', idxSub: 'words or vectors', ask: 'FOR EVERY QUESTION', q: 'Question', qSub: 'the user’s input', s: 'Search', sSub: 'pick related chunks', f: 'Parts found', fSub: 'top chunks, numbered', p: 'Build the prompt', pSub: 'sources + question + answer rules', m: 'Local LLM', mSub: 'such as Ollama', a: 'Answer', aSub: 'with source numbers', use: 'uses the index', cap: 'Figure {{N}} Documents are split and indexed ahead of time. For each question, only the related parts are searched and handed to the model to answer. Everything stays inside the PC.' };
  const id = 'ra';
  let b = `<rect x="4" y="4" width="392" height="566" rx="16" fill="url(#${id}-g)" class="d-group"/>` + txt(18, 24, T.inside, 'd-gtitle');
  b += txt(18, 52, T.prep, 'd-gtitle');
  b += ndc(id, 14, 60, 112, 70, 'n', 'doc', T.doc, T.docSub) + ndc(id, 144, 60, 112, 70, 'n', 'grid', T.split, T.splitSub) + ndc(id, 274, 60, 112, 70, 'a', 'db', T.idx, T.idxSub);
  b += fl(id, 'M128 95 H142') + fl(id, 'M258 95 H272');
  b += txt(18, 156, T.ask, 'd-gtitle');
  const steps = [[T.q, T.qSub, 'n', 'user'], [T.s, T.sSub, 'n', 'search'], [T.f, T.fSub, 'n', 'doc'], [T.p, T.pSub, 'n', 'layers'], [T.m, T.mSub, 'a', 'spark'], [T.a, T.aSub, 'ok', 'check']];
  steps.forEach(([a, sub, k, ic], i) => {
    const Y = 166 + i * 66;
    b += nd(id, 50, Y, 240, 48, k, ic, a, sub);
    if (i < 5) b += fl(id, `M170 ${Y + 50} V${Y + 64}`);
  });
  b += fl(id, 'M330 132 V239 H292', 3) + txt(320, 154, T.use, 'd-nsub', 'end');
  return fig2(id, 400, 576, T.title, b, T.cap);
}

function prodArch(L) {
  const T = L === 'ja'
    ? { title: '社内文書Q&Aの本番構成', org: '社内ネットワークの中', user: '利用者', auth: '認証・APIゲートウェイ', authSub: 'SSOで、誰が聞いたかを確定する', qs: '質問サービス', qsSub: '検索 → 権限 → 回答 → 検証', llm: '推論サーバー', llmSub: 'ローカルLLM', search: '検索(権限で絞る)', idx: '索引ストア', idxSub: '全文索引 + ベクトル索引 + 閲覧できるグループ', prep: '取り込み(文書が変わるたび)', st: ['文書置き場', '変換', '分割', '埋め込み'], diff: '差分だけ更新', log: '質問ログ・評価・監視', logSub: '質問・資料・答え・反応を残し、定期的に測る', cap: '図{{N}} 質問に答える経路と、文書を取り込む経路を、検索の索引でつなぐ。権限は索引のデータで絞り、ログと評価が全体を見る。' }
    : { title: 'Production architecture for internal-document Q&A', org: 'INSIDE THE COMPANY NETWORK', user: 'Users', auth: 'Auth and API gateway', authSub: 'SSO establishes who is asking', qs: 'Question service', qsSub: 'search → filter → answer → verify', llm: 'Inference server', llmSub: 'local LLM', search: 'Search (filtered by permission)', idx: 'Index store', idxSub: 'full-text + vector index + groups allowed to read', prep: 'INGESTION (whenever documents change)', st: ['Documents', 'Convert', 'Split', 'Embed'], diff: 'update only the diff', log: 'Question log, evaluation, monitoring', logSub: 'Questions, sources, answers, feedback; measured regularly', cap: 'Figure {{N}} The path that answers questions and the path that ingests documents meet at the search index. Permissions filter on the index data, and logs and evaluation watch the whole.' };
  const id = 'pa';
  let b = `<rect x="4" y="4" width="392" height="496" rx="16" fill="url(#${id}-g)" class="d-group"/>` + txt(18, 24, T.org, 'd-gtitle');
  b += nd(id, 110, 36, 180, 40, 'n', 'user', T.user) + fl(id, 'M200 78 V94');
  b += nd(id, 50, 96, 300, 52, 'ok', 'lock', T.auth, T.authSub) + fl(id, 'M200 150 V166');
  b += nd(id, 14, 168, 236, 64, 'a', 'search', T.qs, T.qsSub) + ndc(id, 266, 168, 120, 64, 'n', 'spark', T.llm, '');
  b += fl(id, 'M252 200 H264');
  b += fl(id, 'M132 234 V258') + txt(142, 251, T.search, 'd-nsub');
  b += nd(id, 14, 260, 372, 56, 'a', 'db', T.idx, T.idxSub);
  b += txt(18, 346, T.prep, 'd-gtitle');
  const ic = ['doc', 'convert', 'grid', 'dots'];
  T.st.forEach((n, i) => { const X = 14 + i * 94; b += `<g class="k-n"><rect x="${X}" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#${id}-sh)"/></g>` + ico(X + 42, 372, ic[i], 'n') + txt(X + 42, 394, n, 'd-nsub', 'middle'); if (i < 3) b += fl(id, `M${X + 86} 380 H${X + 92}`, 1.4); });
  b += fl(id, 'M344 354 V318', 2) + txt(334, 340, T.diff, 'd-nsub', 'end');
  b += nd(id, 14, 430, 372, 58, 'ok', 'chart', T.log, T.logSub);
  return fig2(id, 400, 504, T.title, b, T.cap);
}

function permPlace(L) {
  const T = L === 'ja'
    ? { title: '権限で絞る位置', bad: 'よくない:検索のあとで隠す', good: 'よい:検索の前に絞る', b: [['全文書を検索', '', 'search'], ['モデルへ', '検索結果すべて', 'spark'], ['答えから隠す', '出力の段階で', 'eyeoff']], g: [['グループで絞る', '権限を確認', 'shield'], ['検索', '見てよい文書だけ', 'search'], ['モデルへ', '絞った結果だけ', 'spark']], badNote: 'モデルは、見てはいけない文書を読んでしまっている', goodNote: '見てはいけない文書は、モデルに渡らない', cap: '図{{N}} 権限は、検索の対象を決める段階で適用する。モデルに「見せないで」と頼むのは、守りにならない。' }
    : { title: 'Where to apply permissions', bad: 'Not good: hide after searching', good: 'Good: filter before searching', b: [['Search all', 'every document', 'search'], ['Send to model', 'all results', 'spark'], ['Hide answer', 'at output', 'eyeoff']], g: [['Group filter', 'check permission', 'shield'], ['Search', 'visible docs only', 'search'], ['Send to model', 'filtered results', 'spark']], badNote: 'The model has already read documents it should not', goodNote: 'Documents a person must not see never reach the model', cap: 'Figure {{N}} Apply permissions when deciding what to search. Asking the model “do not show this” is not a safeguard.' };
  const id = 'pp';
  let b = `<g class="k-d">${ico(18, 18, 'eyeoff', 'd')}</g>` + txt(34, 22, T.bad, 'd-ntitle');
  T.b.forEach(([n, sub, ic], i) => { const X = 8 + i * 132; b += ndc(id, X, 34, 122, 72, i === 1 ? 'd' : 'n', ic, n, sub); if (i < 2) b += fl(id, `M${X + 124} 70 H${X + 130}`, 1.4); });
  b += txt(10, 126, T.badNote, 'd-nsub');
  b += ico(18, 164, 'shield', 'ok') + txt(34, 168, T.good, 'd-ntitle');
  T.g.forEach(([n, sub, ic], i) => { const X = 8 + i * 132; b += ndc(id, X, 180, 122, 72, i === 0 ? 'ok' : 'n', ic, n, sub); if (i < 2) b += fl(id, `M${X + 124} 216 H${X + 130}`, 1.4); });
  b += txt(10, 272, T.goodNote, 'd-nsub');
  return fig2(id, 400, 284, T.title, b, T.cap);
}

// ---- G: AWS入門の図(AWSの構成図の作法: 枠の入れ子、カテゴリ色のアイコン、番号付きの矢印) ----
// 色はAWSのブランドパレット。アイコンの絵柄は自前の簡略版で、公式のアイコンではない。
const AWSC = { compute: '#ED7100', storage: '#7AA116', db: '#C925D1', net: '#8C4FFF', mgmt: '#E7157B', gray: '#7D8998', teal: '#00A4A6', green: '#7AA116', purple: '#8C4FFF' };
Object.assign(ICONS, {
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  bucket: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6l2 13c.2 1 2.3 2 5 2s4.8-1 5-2l2-13',
  split: 'M4 12h6M10 12l6-6M10 12l6 6M16 6h4M16 18h4',
});
const aIcon = (cx, cy, color, glyph, l1, l2 = '') => `<rect x="${cx - 22}" y="${cy - 22}" width="44" height="44" rx="4" fill="${color}"/><g transform="translate(${cx - 12},${cy - 12})" class="d-ico-w"><path d="${ICONS[glyph]}"/></g>` + txt(cx, cy + 36, l1, 'd-alabel', 'middle') + (l2 ? txt(cx, cy + 48, l2, 'd-alabel', 'middle') : '');
const aGrp = (X, Y, W, H, color, title, glyph, dash = false, ink = false) => {
  const c = ink ? 'var(--ink)' : color;
  return `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="2" fill="${c}" fill-opacity="${ink ? 0 : .06}" stroke="${c}" stroke-width="1.6"${dash ? ' stroke-dasharray="6 4"' : ''}/>`
    + (glyph ? `<rect x="${X}" y="${Y}" width="24" height="24" fill="${c}"/><g transform="translate(${X + 4},${Y + 4}) scale(.67)" class="d-ico-w"><path d="${ICONS[glyph]}"/></g>` : '')
    + txt(X + (glyph ? 30 : 8), Y + 16, title, 'd-atab');
};
const aNum = (cx, cy, n) => `<circle cx="${cx}" cy="${cy}" r="9" class="d-num"/>` + txt(cx, cy + 3.6, n, 'd-numt', 'middle');

function awsGlobal(L) {
  const T = L === 'ja'
    ? { title: 'AWSの構造:リージョンとアベイラビリティゾーン', user: 'ユーザー', cloud: 'AWS Cloud', edge: 'CloudFront', edgeSub: 'エッジ拠点', region: 'リージョン(例:東京)', az: n => `AZ ${n}`, ec2: 'EC2', ec2s: 'サーバー', rds: 'RDS', rdss: 'データベース', link: 'AZ間は、高速な専用回線でつながる', other: 'リージョン(例:大阪)', otherNote: '遠く離れた別の拠点。データは自動では移らない', cap: '図{{N}} リージョンの中は、物理的に分かれた複数のAZでできている。1つのAZが止まっても、別のAZで動き続けられる。AWSの構成図の作法で描いた簡略版(公式のアイコンではない)。' }
    : { title: 'AWS structure: Regions and Availability Zones', user: 'Users', cloud: 'AWS Cloud', edge: 'CloudFront', edgeSub: 'edge location', region: 'Region (e.g. Tokyo)', az: n => `AZ ${n}`, ec2: 'EC2', ec2s: 'server', rds: 'RDS', rdss: 'database', link: 'AZs are joined by fast private links', other: 'Region (e.g. Osaka)', otherNote: 'A distant site. Data does not move on its own', cap: 'Figure {{N}} A Region is made of several physically separate AZs. If one AZ stops, another can keep running. A simplified drawing in AWS diagram style (not the official icons).' };
  const id = 'ag';
  let b = aIcon(200, 34, AWSC.gray, 'user', T.user) + `<path d="M200 84 V128" class="d-path" marker-end="url(#${id}-a)"/>` + aNum(214, 106, 1);
  b += aGrp(6, 100, 388, 408, '', T.cloud, '', false, true);
  b += aIcon(200, 156, AWSC.net, 'globe', T.edge, T.edgeSub) + `<path d="M200 208 V232" class="d-path" marker-end="url(#${id}-a)"/>` + aNum(214, 220, 2);
  b += aGrp(16, 214, 368, 216, AWSC.teal, T.region, 'globe', true);
  ['A', 'B'].forEach((n, i) => {
    const X = 26 + i * 178;
    b += aGrp(X, 244, 170, 150, AWSC.teal, T.az(n), '', true) + aIcon(X + 50, 310, AWSC.compute, 'chip', T.ec2, T.ec2s) + aIcon(X + 122, 310, AWSC.db, 'db', T.rds, T.rdss);
  });
  b += txt(200, 416, T.link, 'd-alabel', 'middle');
  b += aGrp(16, 440, 368, 56, AWSC.teal, T.other, 'globe', true) + txt(30, 486, T.otherNote, 'd-alabel');
  return fig2(id, 400, 520, T.title, b, T.cap);
}

function awsWeb(L) {
  const T = L === 'ja'
    ? { title: '小さなWebアプリの典型的なAWS構成', user: 'ユーザー', cloud: 'AWS Cloud', cf: 'CloudFront', cfs: 'エッジ配信', region: 'リージョン', vpc: 'VPC', alb: 'ALB', albs: 'ロードバランサー', az: n => `AZ ${n}`, sub: '非公開サブネット', ec2: 'EC2', ec2s: 'サーバー', rds: 'RDS', rdss: n => n === 'A' ? 'データベース' : '待機系', s3: 'S3', s3s: 'ファイル置き場', cw: 'CloudWatch', cws: 'ログ・監視', cap: '図{{N}} 番号は、リクエストが流れる順(1 ユーザー → 2 エッジ → 3 ロードバランサー → 4 サーバー → データベース)。AWSの構成図の作法で描いた簡略版(公式のアイコンではない)。' }
    : { title: 'A typical AWS setup for a small web app', user: 'Users', cloud: 'AWS Cloud', cf: 'CloudFront', cfs: 'edge delivery', region: 'Region', vpc: 'VPC', alb: 'ALB', albs: 'load balancer', az: n => `AZ ${n}`, sub: 'Private subnet', ec2: 'EC2', ec2s: 'server', rds: 'RDS', rdss: n => n === 'A' ? 'database' : 'standby', s3: 'S3', s3s: 'file store', cw: 'CloudWatch', cws: 'logs, alarms', cap: 'Figure {{N}} The numbers show the order a request flows (1 users → 2 edge → 3 load balancer → 4 server → database). A simplified drawing in AWS diagram style (not the official icons).' };
  const id = 'aw', a = d => `<path d="${d}" class="d-path" marker-end="url(#${id}-a)"/>`;
  let b = aIcon(200, 34, AWSC.gray, 'user', T.user) + a('M200 84 V128') + aNum(214, 106, 1);
  b += aGrp(6, 100, 388, 548, '', T.cloud, '', false, true);
  b += aIcon(200, 156, AWSC.net, 'globe', T.cf, T.cfs) + a('M200 208 V280') + aNum(214, 244, 2);
  b += aGrp(16, 212, 368, 428, AWSC.teal, T.region, 'globe', true);
  b += aGrp(26, 246, 348, 280, AWSC.purple, T.vpc, 'cloud');
  b += aIcon(200, 304, AWSC.net, 'split', T.alb, T.albs);
  ['A', 'B'].forEach((n, i) => {
    const X = 36 + i * 168, cx = i ? 248 : 80;
    b += aGrp(X, 372, 160, 144, AWSC.teal, T.az(n), '', true);
    b += aGrp(X + 8, 398, 144, 110, AWSC.teal, T.sub, 'lock');
    b += aIcon(X + 44, 450, AWSC.compute, 'chip', T.ec2, T.ec2s) + aIcon(X + 116, 450, AWSC.db, 'db', T.rds, T.rdss(n));
    b += a(`M200 358 V366 H${cx} V426`);
    b += a(`M${X + 68} 450 H${X + 90}`);
  });
  b += aNum(140, 366, 3) + aNum(124, 440, 4);
  b += aIcon(110, 566, AWSC.storage, 'bucket', T.s3, T.s3s) + aIcon(290, 566, AWSC.mgmt, 'chart', T.cw, T.cws);
  return fig2(id, 400, 660, T.title, b, T.cap);
}

// ---- H: 個人開発・スタートアップのスタックの図 ----
function stackArch(L) {
  const T = L === 'ja'
    ? { title: '小さなWebアプリの構成(React Router + Cloudflare)', browser: 'ブラウザ', clerk: 'Clerk', clerkSub: '認証(外部サービス)', cf: 'Cloudflare', worker: 'Worker', workerSub: 'React Router のSSRとAPI', d1: 'D1', d1s: 'SQLite互換のDB', ai: 'Workers AI', ais: 'モデルを呼ぶ', rl: 'レート制限', rls: 'IPごとの回数', assets: '静的ファイル', assetsSub: '画像・JS・CSSを配信', sign: 'サインイン', verify: '本人を確認', cap: '図{{N}} サーバーは持たない。ブラウザからのリクエストをWorkerが受け、DB、AI、レート制限をバインディングで使う。認証は外部のサービスに任せる。' }
    : { title: 'A small web app setup (React Router + Cloudflare)', browser: 'Browser', clerk: 'Clerk', clerkSub: 'external auth', cf: 'CLOUDFLARE', worker: 'Worker', workerSub: 'React Router SSR and API', d1: 'D1', d1s: 'SQLite-based DB', ai: 'Workers AI', ais: 'calls models', rl: 'Rate limit', rls: 'per-IP counts', assets: 'Static assets', assetsSub: 'serves images, JS, CSS', sign: 'sign in', verify: 'verify identity', cap: 'Figure {{N}} No servers of your own. A Worker receives browser requests and uses the database, AI and rate limiting through bindings. Authentication is delegated to an external service.' };
  const id = 'sk';
  let b = nd(id, 8, 8, 150, 44, 'n', 'laptop', T.browser) + nd(id, 242, 8, 150, 44, 'd', 'lock', T.clerk, T.clerkSub);
  b += fl(id, 'M160 30 H240') + txt(200, 24, T.sign, 'd-nsub', 'middle');
  b += fl(id, 'M83 54 V108') + fl(id, 'M317 54 V108') + txt(325, 84, T.verify, 'd-nsub');
  b += grp(id, 8, 74, 384, 312, T.cf);
  b += nd(id, 24, 110, 352, 56, 'a', 'spark', T.worker, T.workerSub);
  [['db', T.d1, T.d1s, 78], ['spark', T.ai, T.ais, 200], ['shield', T.rl, T.rls, 322]].forEach(([ic, a, sub, cx], i) => { b += fl(id, `M${cx} 168 V204`, 2 + i * .2) + ndc(id, cx - 54, 206, 108, 72, i === 0 ? 'ok' : 'n', ic, a, sub); });
  b += nd(id, 24, 308, 352, 56, 'n', 'doc', T.assets, T.assetsSub);
  return fig2(id, 400, 396, T.title, b, T.cap);
}

function deployFlow(L) {
  const T = L === 'ja'
    ? { title: '変更が本番に出るまでの流れ', s: [['変更を出す(PR)', '', 'doc', 'n'], ['自動で検査', '型・単体テスト・ビルド・ブラウザテスト', 'check', 'ok'], ['開発環境へ自動デプロイ', 'Accessで、許可した人だけが開ける', 'cloud', 'a'], ['本番は手動で実行', '開発で成功したかを確認。戻すときはタグを指定', 'lock', 'w'], ['本番へデプロイ', 'DBのマイグレーションも同じ手順で', 'server', 'a']], auto: '自動', manual: '人が確認', cap: '図{{N}} 検査と開発環境へのデプロイは自動で、本番だけ人が実行する。その手動の実行が、確認のステップになる。' }
    : { title: 'How a change reaches production', s: [['Submit a change (PR)', '', 'doc', 'n'], ['Automatic checks', 'types, unit tests, build, browser tests', 'check', 'ok'], ['Auto-deploy to development', 'Access lets only allowed people in', 'cloud', 'a'], ['Production run by hand', 'confirm it passed in dev; roll back by tag', 'lock', 'w'], ['Deploy to production', 'DB migrations in the same procedure', 'server', 'a']], auto: 'AUTOMATIC', manual: 'HUMAN CHECK', cap: 'Figure {{N}} Checks and the deployment to development are automatic; only production is run by a person. That manual run is the human check.' };
  const id = 'df';
  let b = '';
  T.s.forEach(([a, sub, ic, k], i) => {
    const Y = 10 + i * 78;
    b += nd(id, 40, Y, 320, 54, k, ic, a, sub);
    if (i < 4) b += fl(id, `M200 ${Y + 56} V${Y + 76}`, 1.6);
  });
  b += `<path d="M26 12 V218" stroke="var(--ok)" stroke-width="3" stroke-linecap="round" opacity=".7"/>` + `<path d="M26 244 V376" stroke="var(--warn)" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  b += `<text transform="translate(14,115) rotate(-90)" class="d-nsub" text-anchor="middle">${x(T.auto)}</text><text transform="translate(14,310) rotate(-90)" class="d-nsub" text-anchor="middle">${x(T.manual)}</text>`;
  return fig2(id, 400, 392, T.title, b, T.cap);
}

// ---- I: Colabの図 ----
function colabArch(L) {
  const T = L === 'ja'
    ? { title: 'Colabでローカルではなく、Googleのクラウドで動く', you: 'あなたのブラウザ', drive: 'Google Drive', driveSub: 'ノートブックの保存先', run: 'Colabのランタイム(一時的な仮想マシン)', cell: 'ノートブックのセル', cellSub: 'Pythonのコードを実行', engine: '推論エンジン', engineSub: 'OllamaまたはTransformers', gpu: 'GPU(T4など)', gpuSub: 'モデルの重みを載せる', hub: 'モデルの配布元', hubSub: 'Ollama・Hugging Face。毎回ダウンロード', ops: '操作', save: '保存', down: 'ダウンロード', temp: '消える:アイドルや最大12時間', cap: '図{{N}} 動く場所はGoogleのクラウド上の一時的な仮想マシン。モデルは毎回ダウンロードし、仮想マシンが消えると一緒に消える。外部には公開しない。' }
    : { title: 'On Colab, it runs in Google’s cloud, not locally', you: 'Your browser', drive: 'Google Drive', driveSub: 'notebook storage', run: 'COLAB RUNTIME (temporary virtual machine)', cell: 'Notebook cells', cellSub: 'run Python code', engine: 'Inference engine', engineSub: 'Ollama or Transformers', gpu: 'GPU (such as T4)', gpuSub: 'holds the model weights', hub: 'Model source', hubSub: 'Ollama, Hugging Face. Downloaded each time', ops: 'operate', save: 'save', down: 'download', temp: 'Deleted: when idle, or after 12 hours max', cap: 'Figure {{N}} It runs in a temporary virtual machine in Google’s cloud. The model is downloaded each time and disappears with the machine. Nothing is exposed to the outside.' };
  const id = 'co';
  let b = nd(id, 8, 8, 176, 44, 'n', 'laptop', T.you) + nd(id, 216, 8, 176, 44, 'w', 'doc', T.drive, T.driveSub);
  b += fl(id, 'M186 30 H214') + txt(200, 24, T.save, 'd-nsub', 'middle');
  b += fl(id, 'M96 54 V112') + txt(106, 69, T.ops, 'd-nsub');
  b += grp(id, 8, 76, 384, 272, T.run);
  b += nd(id, 24, 112, 352, 50, 'n', 'chat', T.cell, T.cellSub) + fl(id, 'M200 164 V182');
  b += nd(id, 24, 184, 352, 50, 'a', 'spark', T.engine, T.engineSub) + fl(id, 'M200 236 V254');
  b += nd(id, 24, 256, 352, 56, 'a', 'chip', T.gpu, T.gpuSub);
  b += txt(200, 334, T.temp, 'd-nsub', 'middle');
  b += fl(id, 'M200 376 V350', 2) + nd(id, 24, 378, 352, 50, 'n', 'cloud', T.hub, T.hubSub) + txt(208, 368, T.down, 'd-nsub');
  return fig2(id, 400, 440, T.title, b, T.cap);
}

// ---- J: Kubernetes + vLLM + LiteLLM の図(名前空間ごとの全体設計) ----
function k8sArch(L) {
  const T = L === 'ja'
    ? { title: 'LLM基盤の全体設計(名前空間ごと)', app: 'アプリ・利用者', ing: 'Ingress・認証', ingSub: 'TLS(cert-manager)とSSO', gw: 'gateway', serving: 'LiteLLM', servingS: '配信用 ×N', jobs: 'LiteLLM', jobsS: '背景処理 ×1', ui: 'チャットUI', uiS: '使い始めたら', inf: 'inference(GPU)', chat: 'vLLM チャット', chatS: 'GPU 1枚 ×N', embed: 'vLLM 埋め込み', embedS: '文書の検索用', rerank: '再ランキング', rerankS: '必要になったら', guard: 'ガードレール', guardS: '必要になったら', data: 'data', pg: 'PostgreSQL', pgs: 'キー・記録', redis: 'Redis', redisS: '制限の共有', vec: 'ベクトルDB', vecS: '検索の索引', s3: 'S3 / MinIO', s3s: '文書・保存', ingest: 'ingest', pre: 'モデル取得Job', preS: '重みを事前に', cron: '取り込みCronJob', cronS: '文書を索引へ', plat: 'platform・observability', cap: '図{{N}} 層ごとに名前空間を分ける。入口からLiteLLM、vLLMへと流れ、状態はdataに置く。モデルと文書は、取得Jobと取り込みCronJobが先に用意する。基盤と観測は、全体を支える。' }
    : { title: 'Overall LLM platform design (by namespace)', app: 'Apps and users', ing: 'Ingress and auth', ingSub: 'TLS (cert-manager) and SSO', gw: 'gateway', serving: 'LiteLLM', servingS: 'serving ×N', jobs: 'LiteLLM', jobsS: 'background ×1', ui: 'Chat UI', uiS: 'once in use', inf: 'inference (GPU)', chat: 'vLLM chat', chatS: '1 GPU ×N', embed: 'vLLM embedding', embedS: 'for document search', rerank: 'Reranker', rerankS: 'when needed', guard: 'Guardrails', guardS: 'when needed', data: 'data', pg: 'PostgreSQL', pgs: 'keys, records', redis: 'Redis', redisS: 'shared limits', vec: 'Vector DB', vecS: 'search index', s3: 'S3 / MinIO', s3s: 'documents', ingest: 'ingest', pre: 'Model prefetch Job', preS: 'weights ahead of time', cron: 'Ingestion CronJob', cronS: 'documents to index', plat: 'platform and observability', cap: 'Figure {{N}} One namespace per layer. Traffic flows from the entrance to LiteLLM and vLLM, and state lives in data. The prefetch Job and ingestion CronJob prepare models and documents ahead of time. The platform and observability support everything.' };
  const id = 'kv';
  let b = nd(id, 110, 6, 180, 40, 'n', 'user', T.app) + fl(id, 'M200 48 V62');
  b += nd(id, 30, 64, 340, 46, 'ok', 'shield', T.ing, T.ingSub) + fl(id, 'M80 112 V148');
  b += grp(id, 8, 122, 384, 104, T.gw);
  b += ndc(id, 24, 148, 112, 70, 'a', 'split', T.serving, T.servingS) + ndc(id, 144, 148, 112, 70, 'n', 'layers', T.jobs, T.jobsS) + ndc(id, 264, 148, 112, 70, 'n', 'chat', T.ui, T.uiS);
  b += grp(id, 8, 244, 384, 188, T.inf);
  b += ndc(id, 24, 274, 170, 68, 'a', 'chip', T.chat, T.chatS) + ndc(id, 206, 274, 170, 68, 'a', 'chip', T.embed, T.embedS) + ndc(id, 24, 352, 170, 68, 'n', 'search', T.rerank, T.rerankS) + ndc(id, 206, 352, 170, 68, 'n', 'shield', T.guard, T.guardS);
  b += fl(id, 'M80 220 V232 H180 V272', 2.4);
  b += grp(id, 8, 450, 384, 108, T.data);
  b += ndc(id, 24, 478, 84, 70, 'n', 'db', T.pg, T.pgs) + ndc(id, 116, 478, 84, 70, 'n', 'layers', T.redis, T.redisS) + ndc(id, 208, 478, 84, 70, 'a', 'grid', T.vec, T.vecS) + ndc(id, 300, 478, 84, 70, 'n', 'bucket', T.s3, T.s3s);
  b += grp(id, 8, 576, 384, 90, T.ingest);
  b += nd(id, 24, 604, 170, 52, 'n', 'cloud', T.pre, T.preS) + nd(id, 206, 604, 170, 52, 'n', 'convert', T.cron, T.cronS);
  b += grp(id, 8, 684, 384, 122, T.plat);
  const pills = [['GPU Operator', 'a'], ['KEDA', 'a'], ['cert-manager', 'ok'], ['External Secrets', 'ok'], ['Prometheus', 'n'], ['Grafana', 'n'], ['Loki', 'n'], ['DCGM exporter', 'n'], ['Langfuse', 'n']];
  pills.forEach(([n, k], i) => { b += pill(24 + (i % 3) * 120, 712 + Math.floor(i / 3) * 30, k, n, 112); });
  return fig2(id, 400, 816, T.title, b, T.cap);
}

function gatewayFlow(L) {
  const T = L === 'ja'
    ? { title: 'LiteLLMの中を通る流れ', s: [['仮想キーで認証', 'キーごとに、使えるモデルを制限する', 'lock', 'ok'], ['予算とレート制限', '回数は、Redisで全レプリカが共有する', 'shield', 'ok'], ['モデル名で振り分け', '同じ名前の複数の行き先から選ぶ', 'split', 'a'], ['vLLMに送る', 'OpenAI互換のAPIで、api_baseへ', 'chip', 'a'], ['失敗したら、リトライとフォールバック', '逃げ先のデータの扱いに注意', 'cloud', 'w'], ['利用を記録', 'PostgreSQLに、誰がいつ何を使ったか', 'db', 'n']], cap: '図{{N}} 要求は、認証、制限、振り分けを通って、vLLMへ届く。失敗したときは、再試行や逃げ先に切り替える。すべての利用はデータベースに残る。' }
    : { title: 'The path through LiteLLM', s: [['Authenticate with a virtual key', 'limit which models each key may use', 'lock', 'ok'], ['Budget and rate limit', 'counts shared by all replicas via Redis', 'shield', 'ok'], ['Route by model name', 'pick among destinations under one name', 'split', 'a'], ['Send to vLLM', 'OpenAI-compatible API, to api_base', 'chip', 'a'], ['On failure: retry, then fallback', 'mind how the fallback handles data', 'cloud', 'w'], ['Record usage', 'who used what and when, in PostgreSQL', 'db', 'n']], cap: 'Figure {{N}} A request passes through authentication, limits and routing to reach vLLM. On failure it retries or switches to a fallback. All usage is kept in the database.' };
  const id = 'gw';
  let b = '';
  T.s.forEach(([a, sub, ic, k], i) => { const Y = 8 + i * 68; b += nd(id, 24, Y, 352, 52, k, ic, a, sub); if (i < 5) b += fl(id, `M200 ${Y + 54} V${Y + 66}`, 1.4); });
  return fig2(id, 400, 420, T.title, b, T.cap);
}

function scaleLoop(L) {
  const T = L === 'ja'
    ? { title: '待ち行列で、レプリカを増やす流れ', s: [['vLLMが、待ち行列を出す', 'vllm:num_requests_waiting', 'chart', 'n'], ['Prometheusが集める', '/metricsを取り込んで保存する', 'db', 'n'], ['KEDAが、しきい値と比べる', 'ScaledObjectのクエリとthreshold', 'search', 'a'], ['Deploymentのレプリカを増やす', 'GPUの数が上限(maxReplicaCount)', 'layers', 'a'], ['GPUに空きがなければ、Podは待つ', 'Pending。ノードを増やす仕組みがあれば、そちらへ', 'server', 'w'], ['モデルを読み込んで、受け付ける', 'startupProbeが通ったら、受け付け開始', 'chip', 'ok']], auto: '自動で判断', wait: '待ち時間(数分)', cap: '図{{N}} 指標から増やす判断までは自動だが、実際に受け付けられるまでには、ノードの用意とモデルの読み込みで、数分かかる。そのため、最低のレプリカ数を普段から立てておく。' }
    : { title: 'How replicas are added from the queue', s: [['vLLM exposes the queue', 'vllm:num_requests_waiting', 'chart', 'n'], ['Prometheus collects it', 'scrapes /metrics and stores it', 'db', 'n'], ['KEDA compares with the threshold', 'ScaledObject query and threshold', 'search', 'a'], ['The Deployment adds replicas', 'the GPU count is the ceiling (maxReplicaCount)', 'layers', 'a'], ['No free GPU: the Pod waits', 'Pending; a node autoscaler, if any, adds nodes', 'server', 'w'], ['Load the model, then accept requests', 'once the startupProbe passes', 'chip', 'ok']], auto: 'AUTOMATIC', wait: 'WAIT (MINUTES)', cap: 'Figure {{N}} From the metric to the decision to scale is automatic, but being ready to accept requests takes minutes for the node and the model load. That is why you keep a minimum replica count up all the time.' };
  const id = 'sl';
  let b = '';
  T.s.forEach(([a, sub, ic, k], i) => { const Y = 8 + i * 68; b += nd(id, 40, Y, 340, 52, k, ic, a, sub); if (i < 5) b += fl(id, `M210 ${Y + 54} V${Y + 66}`, 1.6); });
  b += `<path d="M26 10 V198" stroke="var(--ok)" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M26 214 V404" stroke="var(--warn)" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  b += `<text transform="translate(14,104) rotate(-90)" class="d-nsub" text-anchor="middle">${x(T.auto)}</text><text transform="translate(14,309) rotate(-90)" class="d-nsub" text-anchor="middle">${x(T.wait)}</text>`;
  return fig2(id, 400, 424, T.title, b, T.cap);
}

function vectorChoice(L) {
  const T = L === 'ja'
    ? { title: 'ベクトルDBの選び方の流れ', a: 'まず pgvector', as: '別のPostgreSQLインスタンスで', q: '問題が出たか', qs: '規模・速さ・絞り込み・運用', o1: '専用のDBへ', o1s: 'Qdrantなど', o2: '単語検索を重視', o2s: 'OpenSearchなど', o3: 'そのまま使う', o3s: '移さなくてよい', cap: '図{{N}} まずpgvectorで始め、問題が出てから移す。ベクトルは文書から作り直せるので、移しやすい。どの場合も、自分たちの文書で検索の成績を測ってから決める。' }
    : { title: 'How to choose a vector database', a: 'Start with pgvector', as: 'on a separate PostgreSQL instance', q: 'Any problems?', qs: 'scale, speed, filtering, operations', o1: 'Dedicated DB', o1s: 'Qdrant etc.', o2: 'Keyword first', o2s: 'OpenSearch etc.', o3: 'Keep it', o3s: 'no need to move', cap: 'Figure {{N}} Start with pgvector and move only once problems appear. Vectors can be rebuilt from documents, so moving is easy. In every case, decide after measuring retrieval on your own documents.' };
  const id = 'vc';
  let b = nd(id, 50, 8, 300, 52, 'a', 'db', T.a, T.as) + fl(id, 'M200 62 V84');
  b += nd(id, 50, 86, 300, 52, 'n', 'search', T.q, T.qs);
  b += fl(id, 'M200 140 V160 H80 V188') + fl(id, 'M200 140 V188') + fl(id, 'M200 140 V160 H320 V188');
  b += ndc(id, 24, 190, 112, 78, 'a', 'server', T.o1, T.o1s) + ndc(id, 144, 190, 112, 78, 'n', 'search', T.o2, T.o2s) + ndc(id, 264, 190, 112, 78, 'ok', 'check', T.o3, T.o3s);
  return fig2(id, 400, 286, T.title, b, T.cap);
}

function modelRoles(L) {
  const T = L === 'ja'
    ? { title: '役割ごとのモデル(2026年10月に確認した例)', s: [['チャット(生成)', 'gpt-oss-20b / gpt-oss-120b / Qwen3.8-27B', 'spark', 'a'], ['埋め込み', 'bge-m3 / Qwen3-Embedding', 'grid', 'a'], ['再ランキング', 'Qwen3-Reranker', 'search', 'n'], ['ガードレール', 'Qwen3Guard-Stream(vLLM対応は作業中)', 'shield', 'n']], first: '最初から', later: '必要になったら', cap: '図{{N}} 役割ごとに別のモデルが要る。最初はチャットと埋め込みから始め、再ランキングとガードレールは、要件が出てから足す。モデルは入れ替わりが早いので、選ぶ前に配布ページで確認する。' }
    : { title: 'Models by role (examples checked in October 2026)', s: [['Chat (generation)', 'gpt-oss-20b / gpt-oss-120b / Qwen3.8-27B', 'spark', 'a'], ['Embedding', 'bge-m3 / Qwen3-Embedding', 'grid', 'a'], ['Reranking', 'Qwen3-Reranker', 'search', 'n'], ['Guardrails', 'Qwen3Guard-Stream (vLLM support in progress)', 'shield', 'n']], first: 'FROM THE START', later: 'WHEN NEEDED', cap: 'Figure {{N}} Each role needs its own model. Start with chat and embedding, and add reranking and guardrails once requirements appear. Models change quickly, so confirm on the distribution page before you choose.' };
  const id = 'mr';
  let b = '';
  T.s.forEach(([a, sub, ic, k], i) => { b += nd(id, 40, 8 + i * 66, 340, 52, k, ic, a, sub); });
  b += `<path d="M26 10 V122" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M26 142 V254" stroke="var(--muted)" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  b += `<text transform="translate(14,66) rotate(-90)" class="d-nsub" text-anchor="middle">${x(T.first)}</text><text transform="translate(14,198) rotate(-90)" class="d-nsub" text-anchor="middle">${x(T.later)}</text>`;
  return fig2(id, 400, 280, T.title, b, T.cap);
}

// ---- K: ディープラーニング入門の図 ----
function nnFigure(L) {
  const T = L === 'ja'
    ? { title: 'ニューラルネットワークの形', cols: ['入力', '隠れ層', '隠れ層', '出力'], neuron: '1つのニューロン:出力 = 活性化(重み × 入力の合計 + バイアス)', cap: '図{{N}} 丸がニューロン、線が重み。層を重ねるほど「深い」ネットワークになる。学習で決まるのは、線の重みと、各ニューロンのバイアス。' }
    : { title: 'The shape of a neural network', cols: ['Input', 'Hidden', 'Hidden', 'Output'], neuron: 'One neuron: output = activation(sum of weight × input + bias)', cap: 'Figure {{N}} Circles are neurons and lines are weights. The more layers you stack, the "deeper" the network. Learning decides the line weights and each neuron’s bias.' };
  const id = 'nn', X = [60, 160, 240, 340], N = [2, 4, 4, 1], K = ['n', 'a', 'a', 'ok'];
  const ys = n => Array.from({ length: n }, (_, i) => 26 + (i + 0.5) * 196 / n);
  let lines = '', nodes = '';
  for (let c = 0; c < 3; c++) for (const y1 of ys(N[c])) for (const y2 of ys(N[c + 1])) lines += `<path d="M${X[c]} ${y1.toFixed(1)} L${X[c + 1]} ${y2.toFixed(1)}" class="d-path" opacity=".35"/>`;
  X.forEach((x0, c) => ys(N[c]).forEach(y0 => { nodes += `<g class="k-${K[c]}"><circle cx="${x0}" cy="${y0.toFixed(1)}" r="12" class="d-badge"/></g>`; }));
  const dot = (d, begin) => `<circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="${begin}s" repeatCount="indefinite" path="${d}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="${begin}s" repeatCount="indefinite"/></circle>`;
  const p1 = `M${X[0]} ${ys(2)[0].toFixed(1)} L${X[1]} ${ys(4)[1].toFixed(1)} L${X[2]} ${ys(4)[2].toFixed(1)} L${X[3]} ${ys(1)[0].toFixed(1)}`;
  const p2 = `M${X[0]} ${ys(2)[1].toFixed(1)} L${X[1]} ${ys(4)[3].toFixed(1)} L${X[2]} ${ys(4)[0].toFixed(1)} L${X[3]} ${ys(1)[0].toFixed(1)}`;
  let b = lines + nodes + dot(p1, 0) + dot(p2, 1.3);
  T.cols.forEach((t, c) => { b += txt(X[c], 244, t, 'd-ntitle', 'middle'); });
  b += `<rect x="16" y="262" width="368" height="34" rx="8" class="d-tag"/>` + txt(200, 283, T.neuron, 'd-nsub', 'middle');
  return fig2(id, 400, 304, T.title, b, T.cap);
}

function learnLoop(L) {
  const T = L === 'ja'
    ? { title: '学習の繰り返し', s: [['予測', '順伝播で出力を出す', 'spark', 'a'], ['損失', '正解とのずれを数に', 'chart', 'w'], ['勾配', '逆伝播で向きを計算', 'search', 'n'], ['更新', '学習率の幅だけ動かす', 'check', 'ok']], again: '繰り返す', cap: '図{{N}} 予測、損失、勾配、更新を、損失が十分に下がるまで繰り返す。1周ごとに、重みが少しずつ、正解に合う向きへ動く。' }
    : { title: 'The learning loop', s: [['Predict', 'forward pass', 'spark', 'a'], ['Loss', 'gap from the answer', 'chart', 'w'], ['Gradient', 'backpropagation', 'search', 'n'], ['Update', 'step × learning rate', 'check', 'ok']], again: 'repeat', cap: 'Figure {{N}} Repeat predict, loss, gradient and update until the loss is low enough. Each round moves the weights a little toward fitting the answers.' };
  const id = 'll', pos = [[12, 16], [208, 16], [208, 150], [12, 150]];
  let b = '';
  T.s.forEach(([a, sub, ic, k], i) => { b += nd(id, pos[i][0], pos[i][1], 180, 56, k, ic, a, sub); });
  b += fl(id, 'M194 44 H206') + fl(id, 'M298 74 V148') + fl(id, 'M206 178 H194') + fl(id, 'M102 148 V74');
  b += txt(200, 116, T.again, 'd-nsub', 'middle');
  return fig2(id, 400, 216, T.title, b, T.cap);
}

// ---- L: LLMモデルの全体像の図 ----
function modelMap(L) {
  const T = L === 'ja'
    ? { title: 'LLMモデルの地図', api: 'クラウドのAPI', apiSub: 'データは提供元へ。GPUは要らない', apiEx: 'Claude / GPT / Gemini', open: '公開モデル', openSub: '重みを配布。自分の環境で動かす', openEx: 'gpt-oss / Qwen / Gemma など', tiers: '段で選ぶ', tierList: ['上位', '中位', '下位'], tierSub: ['難しい推論', 'ふだんの作業', '大量・高速'], roles: '役割で使い分ける', roleList: [['生成', 'spark'], ['埋め込み', 'grid'], ['再ランキング', 'search'], ['ガードレール', 'shield']], cap: '図{{N}} まず提供のしかたで2つに分かれ、クラウドのAPIは性能の段で、公開モデルは大きさとライセンスで選ぶ。1つのシステムの中では、役割ごとに別のモデルを使う。' }
    : { title: 'A map of LLM models', api: 'Cloud API', apiSub: 'data goes to the provider; no GPUs', apiEx: 'Claude / GPT / Gemini', open: 'Open models', openSub: 'run the weights yourself', openEx: 'gpt-oss / Qwen / Gemma …', tiers: 'PICK A TIER', tierList: ['Top', 'Middle', 'Lower'], tierSub: ['hard tasks', 'daily work', 'bulk, fast'], roles: 'USE BY ROLE', roleList: [['Generation', 'spark'], ['Embedding', 'grid'], ['Reranking', 'search'], ['Guardrails', 'shield']], cap: 'Figure {{N}} Models first split by how they are offered. Pick cloud APIs by tier, open models by size and license. Within one system, use a different model for each role.' };
  const id = 'mm';
  let b = ndc(id, 8, 8, 188, 92, 'w', 'cloud', T.api, T.apiSub) + txt(102, 92, T.apiEx, 'd-nsub', 'middle').replace('y="92"', 'y="94"');
  b += ndc(id, 204, 8, 188, 92, 'a', 'chip', T.open, T.openSub) + txt(298, 94, T.openEx, 'd-nsub', 'middle');
  b += grp(id, 8, 116, 384, 66, T.tiers);
  T.tierList.forEach((t, i) => { b += pill(24 + i * 120, 146, ['a', 'n', 'ok'][i], (L === 'ja' ? `${t}:${T.tierSub[i]}` : `${t}: ${T.tierSub[i]}`), 112); });
  b += grp(id, 8, 198, 384, 96, T.roles);
  T.roleList.forEach(([t, ic], i) => { const X = 24 + i * 90; b += `<g class="k-${i === 0 ? 'a' : 'n'}"><rect x="${X}" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#${id}-sh)"/></g>` + ico(X + 41, 244, ic, i === 0 ? 'a' : 'n') + txt(X + 41, 272, t, 'd-nsub', 'middle'); });
  return fig2(id, 400, 304, T.title, b, T.cap);
}

function modelChoice(L) {
  const T = L === 'ja'
    ? { title: 'モデルの選び方の流れ', q1: 'データを外に出せるか', q1s: '最初に決める', no: '出せない', yes: '出せる', open: '公開モデルを自分の環境で', openS: 'GPUに載る大きさとライセンス', api: 'クラウドのAPI', apiS: '中位の段から始める', last: '自分の質問で、2〜3の候補を比べる', lastS: '質・速さ・費用(日本語を含む)', cap: '図{{N}} 最初にデータの行き先を決め、候補を絞ってから、自分の用途の質問で比べて決める。' }
    : { title: 'How to choose a model', q1: 'Can data leave?', q1s: 'decide this first', no: 'no', yes: 'yes', open: 'An open model, self-hosted', openS: 'fits your GPU; license OK', api: 'A cloud API', apiS: 'start in the middle tier', last: 'Compare 2–3 candidates on your questions', lastS: 'quality, speed, cost (incl. Japanese)', cap: 'Figure {{N}} Decide where data may go first, narrow the candidates, then decide by comparing on questions from your own use.' };
  const id = 'mc2';
  let b = nd(id, 70, 8, 260, 52, 'n', 'lock', T.q1, T.q1s);
  b += fl(id, 'M140 62 V80 H104 V100') + fl(id, 'M260 62 V80 H296 V100') + txt(112, 76, T.no, 'd-nsub', 'end') + txt(288, 76, T.yes, 'd-nsub');
  b += ndc(id, 8, 102, 188, 76, 'a', 'chip', T.open, T.openS) + ndc(id, 204, 102, 188, 76, 'w', 'cloud', T.api, T.apiS);
  b += fl(id, 'M102 180 V200 H200 V214') + fl(id, 'M298 180 V200 H200 V214');
  b += nd(id, 24, 216, 352, 56, 'ok', 'check', T.last, T.lastS);
  return fig2(id, 400, 284, T.title, b, T.cap);
}

// ---- M: WorkersからVMのPostgreSQLへ ----
function pgArch(L) {
  const T = L === 'ja'
    ? { title: 'WorkersのサイトからVMのPostgreSQLまでの経路', visitor: '訪問者', cf: 'Cloudflare', worker: 'サイトのWorker', workerSub: '画面と検索のAPI', hd: 'Hyperdrive', hdSub: '接続をまとめて使い回す', vpc: 'Workers VPC', vpcSub: '公開していない宛先への入口', tunnel: '接続はVMの内側から張る', vm: 'VM(GCP 東京)', cfd: 'cloudflared', cfdSub: 'Tunnelの、VM側の端', pg: 'PostgreSQL 17', pgSub: 'localhostだけ。PGroonga、pgvector', timer: 'systemdタイマー', timerSub: '毎日の取り込み', bk: 'バックアップ', bkSub: 'pg_dump → R2', ssh: '外から入れるのは、IAP経由のSSHだけ', cap: '図{{N}} サイトはWorkersのまま、DBだけをVMに置く。VMは外から入るポートを開けず、cloudflaredが内側からCloudflareへ接続を張る。取り込みとバックアップは、DBの隣で動く。' }
    : { title: 'The path from the Workers site to PostgreSQL on a VM', visitor: 'Visitor', cf: 'CLOUDFLARE', worker: 'Site Worker', workerSub: 'pages and search API', hd: 'Hyperdrive', hdSub: 'pools and reuses connections', vpc: 'Workers VPC', vpcSub: 'entry to unpublished targets', tunnel: 'opened from inside the VM', vm: 'VM (GCP TOKYO)', cfd: 'cloudflared', cfdSub: 'the VM end of the Tunnel', pg: 'PostgreSQL 17', pgSub: 'localhost only; PGroonga, pgvector', timer: 'systemd timers', timerSub: 'daily imports', bk: 'Backups', bkSub: 'pg_dump → R2', ssh: 'The only way in from outside: SSH via IAP', cap: 'Figure {{N}} The site stays on Workers; only the database lives on a VM. The VM opens no inbound port: cloudflared connects out to Cloudflare from inside. Imports and backups run next to the database.' };
  const id = 'pa';
  let b = nd(id, 110, 8, 180, 42, 'n', 'user', T.visitor) + fl(id, 'M200 52 V96');
  b += grp(id, 8, 68, 384, 214, T.cf);
  b += nd(id, 24, 98, 352, 48, 'a', 'spark', T.worker, T.workerSub) + fl(id, 'M200 148 V158', 1.2);
  b += nd(id, 24, 160, 352, 48, 'n', 'layers', T.hd, T.hdSub) + fl(id, 'M200 210 V220', 1.2);
  b += nd(id, 24, 222, 352, 48, 'n', 'shield', T.vpc, T.vpcSub);
  b += fl(id, 'M200 272 V330') + txt(212, 290, T.tunnel, 'd-nsub');
  b += grp(id, 8, 298, 384, 232, T.vm);
  b += nd(id, 24, 332, 352, 48, 'ok', 'cloud', T.cfd, T.cfdSub) + fl(id, 'M200 382 V392', 1.2);
  b += nd(id, 24, 394, 352, 48, 'ok', 'db', T.pg, T.pgSub);
  b += nd(id, 24, 466, 172, 48, 'w', 'chart', T.timer, T.timerSub) + nd(id, 204, 466, 172, 48, 'n', 'lock', T.bk, T.bkSub);
  b += fl(id, 'M110 464 V444', 1.4) + fl(id, 'M290 444 V464', 1.4);
  b += `<g class="k-w">${ico(30, 552, 'lock', 'w')}</g>` + txt(48, 556, T.ssh, 'd-nsub');
  return fig2(id, 400, 568, T.title, b, T.cap);
}

// ---- N: UNION ALLの上のINと、= ANY(ARRAY(...)) (記事の実行結果の数値) ----
function unionPlans(L) {
  const T = L === 'ja'
    ? { title: 'IN (サブクエリ)と = ANY(ARRAY(...))で、読んだ行の違い', in: 'IN (SELECT ...)', est: '見積もり:結合は330,600行。人気順に約50行読めば30件そろう', act: '実際:当たりは1件。人気順の索引を最後まで読んだ', read: '読んだ行 570,000(items 500,000 + other_items 70,000)', inT: '144〜157 ms', any: '= ANY (ARRAY(SELECT ...))', s1: '① 候補のIDを、先に1回だけ集める', s1s: 'InitPlan。結果は1件の配列', s2: '② 両方の表を、主キーで引く', s2s: 'id = ANY(配列) が各表に押し込まれる', anyT: '0.31〜0.39 ms', cap: '図{{N}} 同じ意味のクエリを、5回ずつ実行した結果。INでは、プランナーが結合を大きく見積もり、人気順に読み進める賭けをして外した。' }
    : { title: 'Rows read by IN (subquery) and = ANY(ARRAY(...))', in: 'IN (SELECT ...)', est: 'Estimate: 330,600 joined rows; ~50 in rank order give 30', act: 'Actual: one match, so it read the whole rank index', read: 'Rows read: 570,000 (items 500,000 + other_items 70,000)', inT: '144–157 ms', any: '= ANY (ARRAY(SELECT ...))', s1: '1. Collect the candidate IDs once, first', s1s: 'an InitPlan; an array of one ID', s2: '2. Look up both tables by primary key', s2s: 'id = ANY(array) is pushed into each table', anyT: '0.31–0.39 ms', cap: 'Figure {{N}} The same query in two forms, five runs each. With IN, the planner estimated a huge join, bet on reading in rank order, and lost.' };
  const id = 'up';
  let b = grp(id, 8, 8, 384, 168, T.in);
  b += txt(24, 48, T.est, 'd-nsub') + txt(24, 66, T.act, 'd-nsub');
  b += segBar2(id + '-c', 24, 80, 352, 22, [[500 / 570, 'd-seg-hist'], [70 / 570, 'd-seg-out']]);
  b += txt(24, 122, T.read, 'd-nsub');
  b += pill(24, 136, 'w', T.inT, 120);
  b += grp(id, 8, 192, 384, 190, T.any);
  b += nd(id, 24, 222, 352, 48, 'n', 'search', T.s1, T.s1s) + fl(id, 'M200 272 V282', 1.2);
  b += nd(id, 24, 284, 352, 48, 'ok', 'db', T.s2, T.s2s);
  b += pill(24, 344, 'ok', T.anyT, 120);
  return fig2(id, 400, 392, T.title, b, T.cap);
}

// ---- O: AIと人の分担 ----
function agentLanes(L) {
  const T = L === 'ja'
    ? { title: 'AIと人の分担', ai: 'AI(手元で完結、戻せる)', human: '人(外に出る、戻しにくい、秘密)', s: [['ai', 'コードとテスト', '手元のDBで動かして測る', 'doc', 'a'], ['ai', 'コミット', 'いつでも戻せる', 'check', 'a'], ['human', '「はい」と言う', 'pushとMRの許可', 'chat', 'w'], ['ai', 'pushとMR', 'CIが検査する', 'cloud', 'a'], ['human', 'マージ', 'CIが本番へデプロイ', 'check', 'w'], ['human', '本番で実行', '秘密は画面に出さず入力', 'lock', 'w'], ['ai', '出力を読んで確かめる', '外から公開ページも見る', 'search', 'ok']], cap: '図{{N}} 手元で完結して戻せるものはAI、外に出るもの・戻しにくいもの・秘密は人。人が貼った出力を、AIが読んで次に進む。' }
    : { title: 'How the work is split between AI and a person', ai: 'AI (local, undoable)', human: 'PERSON (outside, secrets)', s: [['ai', 'Code and tests', 'run and measure locally', 'doc', 'a'], ['ai', 'Commit', 'always reversible', 'check', 'a'], ['human', 'Say “yes”', 'allow the push and MR', 'chat', 'w'], ['ai', 'Push and MR', 'CI runs the checks', 'cloud', 'a'], ['human', 'Merge', 'CI deploys production', 'check', 'w'], ['human', 'Run in production', 'type secrets unseen', 'lock', 'w'], ['ai', 'Read output, check', 'and the public pages', 'search', 'ok']], cap: 'Figure {{N}} What stays local and can be undone goes to the AI; what goes outside, is hard to undo, or involves secrets goes to a person. The AI reads the output the person pastes and moves on.' };
  const id = 'al';
  let b = txt(102, 18, T.ai, 'd-gtitle', 'middle') + txt(298, 18, T.human, 'd-gtitle', 'middle');
  b += `<path d="M200 28 V${30 + T.s.length * 60}" class="d-group"/>`;
  T.s.forEach(([who, a, sub, ic, k], i) => {
    const X = who === 'ai' ? 8 : 204, Y = 32 + i * 60;
    b += nd(id, X, Y, 188, 48, k, ic, a, sub);
    if (i < T.s.length - 1) {
      const nx = (T.s[i + 1][0] === 'ai' ? 8 : 204) + 94, cx = X + 94;
      b += fl(id, nx === cx ? `M${cx} ${Y + 50} V${Y + 58}` : `M${cx} ${Y + 50} V${Y + 54} H${nx} V${Y + 58}`, 1.4);
    }
  });
  return fig2(id, 400, 40 + T.s.length * 60, T.title, b, T.cap);
}

// ---- P: 書き換えてforce pushしても、PRの参照は残る(手元の再現の結果) ----
function emailRefs(L) {
  const T = L === 'ja'
    ? { title: '履歴を書き換えてforce pushしたときに、GitHubに残るもの', local: '手元', rw: 'git filter-repo --mailmap', rwSub: '作者とコミッターのメールを書き換える', push: 'git push --force', gh: 'GITHUB(PUBLIC)', main: 'refs/heads/main', mainSub: '新しいコミット。noreplyのメール', pr: 'refs/pull/1/head', prSub: '古いコミットのまま。.localのメール', ro: 'PRの参照は、利用者からは書き換えられない', a1: 'リポジトリを作り直す', a1s: 'PRの履歴は消える', a2: 'GitHubサポートに頼む', a2s: '消えるかは分からない', cap: '図{{N}} ブランチはforce pushで置き換わるが、PRの参照は古いコミットを指したまま残り、公開リポジトリなら誰でも読める。残る手は2つ。' }
    : { title: 'What stays on GitHub after rewriting history and force pushing', local: 'LOCAL', rw: 'git filter-repo --mailmap', rwSub: 'rewrites author and committer emails', push: 'git push --force', gh: 'GITHUB (PUBLIC)', main: 'refs/heads/main', mainSub: 'new commits; noreply email', pr: 'refs/pull/1/head', prSub: 'still the old commit; .local email', ro: 'Users can’t rewrite PR refs', a1: 'Recreate the repo', a1s: 'PR history is lost', a2: 'Ask GitHub Support', a2s: 'removal not guaranteed', cap: 'Figure {{N}} Force push replaces the branch, but the PR ref keeps pointing at the old commit, readable by anyone on a public repository. Two ways out remain.' };
  const id = 'er';
  let b = grp(id, 8, 8, 384, 88, T.local);
  b += nd(id, 24, 36, 352, 48, 'a', 'doc', T.rw, T.rwSub);
  b += fl(id, 'M200 86 V154') + txt(212, 116, T.push, 'd-nsub');
  b += grp(id, 8, 128, 384, 184, T.gh);
  b += nd(id, 24, 156, 352, 48, 'ok', 'check', T.main, T.mainSub);
  b += nd(id, 24, 216, 352, 48, 'w', 'lock', T.pr, T.prSub);
  b += txt(24, 292, T.ro, 'd-nsub');
  b += fl(id, 'M110 314 V334', 1.4) + fl(id, 'M290 314 V334', 1.4);
  b += nd(id, 8, 336, 188, 48, 'a', 'layers', T.a1, T.a1s) + nd(id, 204, 336, 188, 48, 'n', 'chat', T.a2, T.a2s);
  return fig2(id, 400, 394, T.title, b, T.cap);
}

// ---- 記事への差し込み ----
function insert(file, headingPart, html, where = 'paragraph') {
  const p = dir + file; let s = readFileSync(p, 'utf8');
  if (s.includes(html.slice(0, 60))) return console.log('skip (already):', file, headingPart);
  const h = s.split('\n').findIndex(l => l.startsWith('## ') && l.includes(headingPart));
  if (h < 0) throw new Error(`heading not found: ${file} / ${headingPart}`);
  const lines = s.split('\n');
  let i = h + 2;                                           // 見出しの次の空行の後 = 最初の段落
  if (where === 'code') {
    const closeOf = k => { k++; while (!lines[k].startsWith('```')) k++; return k; };   // 開きの行 → 閉じの行
    while (!lines[i].startsWith('```')) i++;
    i = closeOf(i);
    for (;;) {                                           // コードブロックが続いていたら(タブ群)、最後の閉じまで進む
      let j = i + 1; while (lines[j] === '') j++;
      if (lines[j]?.startsWith('```')) i = closeOf(j); else break;
    }
  }
  else { while (lines[i] !== '') i++; i--; }
  lines.splice(i + 1, 0, '', html);
  writeFileSync(p, lines.join('\n'));
  console.log('inserted:', file, headingPart);
}
for (const f of ['llm-how-it-works', 'transformer-inside', 'protect-env-files', 'string-length', 'claude-code-permissions', 'claude-code-claude-md', 'claude-code-workflows', 'local-llm', 'local-llm-serving', 'local-llm-rag', 'local-llm-rag-production', 'aws-intro', 'startup-stack', 'colab-llm', 'deep-learning-intro', 'llm-models', 'engineer-mental-health', 'git-worktree', 'workers-own-postgres', 'postgres-union-all-in', 'ai-agent-production-line', 'git-author-email']) for (const L of ['ja', 'en']) {
  const pth = dir + `${L}/${f}.md`; const lines = readFileSync(pth, 'utf8').split('\n'); const kept = [];
  lines.forEach((l, i) => { if (l.startsWith('<figure class="diagram">')) { if (kept.at(-1) === '') kept.pop(); } else kept.push(l); });
  writeFileSync(pth, kept.join('\n'));
}
for (const L of ['ja', 'en']) {
  const H = L === 'ja'
    ? { llm1: '次の1語を、確率で選ぶ', llm2: '温度:選び方の偏りを調整する', llm3: 'コンテキストウィンドウ:作業用の記憶', env1: '結果を先に', str1: '先に結果', tf1: '全体像', tf2: '結果を読む', tf3: '1行を詳しく見る', perm: 'allow・ask・denyのルール', md: 'どこに置くか', plan: '変更の前に、計画を見る', ll1: 'ローカルLLMとは', ll2: '必要なメモリを見積もる', sv1: '重みのほかに必要なもの', sv2: '複数人で使う', rag: '作るもの', pa: '全体のアーキテクチャ', pp: '権限は、検索の前に絞る', ag: '全体の構造', aw: '典型的なWebアプリの構成', sk: '全体の構成', df: 'デプロイの流れ', co: '全体の構成', k8: '全体のアーキテクチャ', gw: 'ゲートウェイ', sc: 'スケーリング', vc: 'データ層とベクトルDB', mr: 'モデルの役割と候補', dl1: 'ディープラーニングとは', dl2: '学習の流れ', lm1: '5つの軸で分ける', lm2: '選び方', mh: '早めに気づいて', wt: '作業を中断せずに', pg: '全体の構成', ua: '先に結果', ag2: '分担', er: '先に結果' }
    : { llm1: 'Choosing the next word by probability', llm2: 'Temperature: adjusting how skewed', llm3: 'The context window: working memory', env1: 'The results first', str1: 'The results first', tf1: 'The big picture', tf2: 'Reading the result', tf3: 'Looking closely at one row', perm: 'allow, ask and deny rules', md: 'Where to put it', plan: 'See the plan before changing anything', ll1: 'What a local LLM is', ll2: 'Estimating the memory you need', sv1: 'Beyond the weights', sv2: 'Serving several people', rag: 'What we will build', pa: 'Overall architecture', pp: 'Permissions: filter before searching', ag: 'The structure', aw: 'A typical web app architecture', sk: 'The overall setup', df: 'The deployment flow', co: 'The overall setup', k8: 'Overall architecture', gw: 'Gateway', sc: 'Scaling', vc: 'Data layer and the vector database', mr: 'Roles and candidates', dl1: 'What deep learning is', dl2: 'How learning works', lm1: 'Sort along five axes', lm2: 'How to choose', mh: 'Notice early', wt: 'Open another branch', pg: 'The overall path', ua: 'The results first', ag2: 'The split', er: 'The results first' };
  insert(`${L}/llm-how-it-works.md`, H.llm1, loop(L));
  insert(`${L}/llm-how-it-works.md`, H.llm1, trace(L), 'code');
  insert(`${L}/llm-how-it-works.md`, H.llm2, bars(L), 'code');
  insert(`${L}/llm-how-it-works.md`, H.llm3, windowBars(L));
  insert(`${L}/transformer-inside.md`, H.tf1, arch(L));
  insert(`${L}/transformer-inside.md`, H.tf2, heat(L), 'code');
  insert(`${L}/transformer-inside.md`, H.tf3, attnRow(L));
  insert(`${L}/protect-env-files.md`, H.env1, leakMatrix(L));
  insert(`${L}/string-length.md`, H.str1, strLayers(L));
  insert(`${L}/claude-code-permissions.md`, H.perm, permFlow(L));
  insert(`${L}/claude-code-claude-md.md`, H.md, mdLoad(L));
  insert(`${L}/claude-code-workflows.md`, H.plan, planFlow(L));
  insert(`${L}/local-llm.md`, H.ll1, localFlow(L));
  insert(`${L}/local-llm.md`, H.ll2, memConfigs(L), 'code');
  insert(`${L}/local-llm-serving.md`, H.sv1, memBudget(L), 'code');
  insert(`${L}/local-llm-serving.md`, H.sv2, servingArch(L));
  insert(`${L}/local-llm-rag.md`, H.rag, ragArch(L));
  insert(`${L}/local-llm-rag-production.md`, H.pa, prodArch(L));
  insert(`${L}/local-llm-rag-production.md`, H.pp, permPlace(L));
  insert(`${L}/aws-intro.md`, H.ag, awsGlobal(L));
  insert(`${L}/aws-intro.md`, H.aw, awsWeb(L));
  insert(`${L}/startup-stack.md`, H.sk, stackArch(L));
  insert(`${L}/startup-stack.md`, H.df, deployFlow(L));
  insert(`${L}/colab-llm.md`, H.co, colabArch(L));
  // k8sArchなどの関数は、Kubernetesの記事を書き直すときのために残している(記事は2026-10-13にいったん削除)
  insert(`${L}/deep-learning-intro.md`, H.dl1, nnFigure(L));
  insert(`${L}/deep-learning-intro.md`, H.dl2, learnLoop(L));
  insert(`${L}/llm-models.md`, H.lm1, modelMap(L));
  insert(`${L}/llm-models.md`, H.lm2, modelChoice(L));
  insert(`${L}/engineer-mental-health.md`, H.mh, mhFlow(L));
  insert(`${L}/git-worktree.md`, H.wt, wtFlow(L));
  insert(`${L}/workers-own-postgres.md`, H.pg, pgArch(L));
  insert(`${L}/postgres-union-all-in.md`, H.ua, unionPlans(L));
  insert(`${L}/ai-agent-production-line.md`, H.ag2, agentLanes(L));
  insert(`${L}/git-author-email.md`, H.er, emailRefs(L));
}

// 図の番号を、記事の中での出現順に振る
for (const f of ['llm-how-it-works', 'transformer-inside', 'protect-env-files', 'string-length', 'claude-code-permissions', 'claude-code-claude-md', 'claude-code-workflows', 'local-llm', 'local-llm-serving', 'local-llm-rag', 'local-llm-rag-production', 'aws-intro', 'startup-stack', 'colab-llm', 'deep-learning-intro', 'llm-models', 'engineer-mental-health', 'git-worktree', 'workers-own-postgres', 'postgres-union-all-in', 'ai-agent-production-line', 'git-author-email']) for (const L of ['ja', 'en']) {
  const pth = dir + `${L}/${f}.md`; let n = 0;
  writeFileSync(pth, readFileSync(pth, 'utf8').replace(/\{\{N\}\}/g, () => ++n));
}
