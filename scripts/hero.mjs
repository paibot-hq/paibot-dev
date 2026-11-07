// 記事の見出し画像を、codex の画像生成で作る。
//
//   npm run hero -- <記事ID> [<記事ID> ...]   その記事の画像を作る(既にあれば候補として横に置く)
//   npm run hero -- --missing                 画像のない記事を全部作る
//   npm run hero -- <記事ID> --n 3            候補を3枚作る(public/images/articles/candidates/)
//   npm run hero -- <記事ID> --force          既存の画像を置き換える
//
// codex に記事(日本語版)を読ませ、内容を表す比喩の場面を考えさせて、1枚生成させる。
// codex は読み取り専用で動かす(ファイルは書かせない)。画像は ~/.codex/generated_images/<セッションID>/ に
// 保存されるので、そこから拾い、16:9 に切り抜いて 1200×675 の JPEG にする(macOS の sips を使う)。
// モデルは HERO_MODEL(既定 gpt-6-sol)。
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const root = new URL('..', import.meta.url).pathname;
const artDir = join(root, 'src/content/articles/ja');
const imgDir = join(root, 'public/images/articles');
const candDir = join(imgDir, 'candidates');
const MODEL = process.env.HERO_MODEL || 'gpt-6-sol';

// サイトの写真の決まり。既存の17枚(紙の船、貸金庫、雲と工場、机のPC など)に合わせている。
const STYLE = [
  'Photorealistic, cinematic photograph, 16:9 landscape.',
  'Warm golden-hour or dusk light with deep blue shadows; shallow depth of field; calm, minimal, uncluttered composition with one clear subject.',
  'A visual metaphor for the article, not a literal screenshot or diagram.',
  'Absolutely no text, letters, numbers, code, UI, logos or brand marks anywhere. No human faces (hands are fine).',
].join(' ');

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const n = Number(args[args.indexOf('--n') + 1]) || 1;
const force = flag('--force');
let ids = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--n');
if (flag('--missing')) ids = readdirSync(artDir).map(f => f.replace(/\.md$/, '')).filter(id => !existsSync(join(imgDir, `${id}.jpg`)));
if (!ids.length) { console.error('usage: npm run hero -- <記事ID>... | --missing  [--n 枚数] [--force]'); process.exit(1); }
for (const id of ids) if (!existsSync(join(artDir, `${id}.md`))) { console.error(`記事がありません: ${id}`); process.exit(1); }

const prompt = (id, k) => `Read the article at src/content/articles/ja/${id}.md (Japanese). Think of one strong visual metaphor for what it is about${k > 1 ? ` (this is variation ${k}; choose a different scene from the obvious one)` : ''}.
Then use your image generation tool to create exactly one image. Style: ${STYLE}
Do not run shell commands and do not edit files. On the last line of your reply, print only the absolute path of the saved image.`;

function codex(text) {
  return new Promise((resolve, reject) => {
    const p = spawn('codex', ['exec', '--skip-git-repo-check', '--sandbox', 'read-only', '-m', MODEL, '-C', root, text], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
    p.on('close', code => {
      // 画像は ~/.codex/generated_images/<セッションID>/ に保存される。返答にパスが無くても、セッションIDから探せる
      const session = out.match(/session id: ([0-9a-f-]{36})/)?.[1];
      const dir = session && join(homedir(), '.codex/generated_images', session);
      const saved = dir && existsSync(dir) ? readdirSync(dir).filter(f => /\.(png|jpe?g|webp)$/.test(f)).map(f => join(dir, f)) : [];
      const quoted = [...out.matchAll(/\/[^\s`'"]*\/\.codex\/generated_images\/[^\s`'"]+\.(?:png|jpe?g|webp)/g)].map(m => m[0]);
      const path = saved.sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs).at(-1) ?? quoted.at(-1);
      if (path && existsSync(path)) resolve(path);
      else reject(new Error(`codex が画像を返しませんでした (exit ${code})\n${out.slice(-800)}`));
    });
  });
}

// 中央を 16:9 に切り抜き、1200×675 の JPEG にする
function toJpeg(src, dest) {
  const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', src], { encoding: 'utf8' });
  const w = Number(dims.match(/pixelWidth: (\d+)/)[1]), h = Number(dims.match(/pixelHeight: (\d+)/)[1]);
  const [cw, ch] = w / h > 16 / 9 ? [Math.round(h * 16 / 9), h] : [w, Math.round(w * 9 / 16)];
  const tmp = join(tmpdir(), `hero-${process.pid}-${Date.now()}.jpg`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84', '--cropToHeightWidth', String(ch), String(cw), src, '--out', tmp], { stdio: 'ignore' });
  execFileSync('sips', ['-z', '675', '1200', tmp, '--out', dest], { stdio: 'ignore' });
  rmSync(tmp, { force: true });
}

for (const id of ids) {
  const main = join(imgDir, `${id}.jpg`);
  const asCandidates = n > 1 || (existsSync(main) && !force);
  const jobs = Array.from({ length: n }, (_, i) => i + 1);
  console.log(`${id}: ${n}枚を生成中…`);
  const results = await Promise.allSettled(jobs.map(k => codex(prompt(id, k))));
  results.forEach((r, i) => {
    if (r.status === 'rejected') return console.error(`  ${id} #${i + 1}: ${r.reason.message}`);
    const dest = asCandidates ? (mkdirSync(candDir, { recursive: true }), join(candDir, `${id}-${i + 1}.jpg`)) : main;
    toJpeg(r.value, dest);
    console.log(`  → ${dest.replace(root, '')}`);
  });
}
if (existsSync(candDir)) console.log('\n候補は public/images/articles/candidates/ に置いた。選んだものを public/images/articles/<記事ID>.jpg に移し、candidates/ は消す(コミットしない)。');
