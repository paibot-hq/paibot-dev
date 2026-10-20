# PAIBOT.dev

技術記事のサイト。依存なしの初版(`../dev-legacy/`、更新停止)を Astro に移したもの。デザインとCSSは初版と同じで、記事をMarkdownで管理し、ページごとに静的HTMLを出力する。

## 起動・ビルド

Node.js 22.12 以降。

```sh
npm install
npm run dev       # http://localhost:4320
npm run build     # dist/ に静的ファイルを出力
npm run preview   # ビルド結果を http://localhost:4321 で確認
```


## デプロイ

Cloudflare Workers の静的アセットとして `https://paibot.dev/` に出す(Worker のコードはない)。設定は `wrangler.jsonc`。

- main に入ると Cloudflare の Workers Builds(GitHub 連携)がビルドして本番にデプロイする。ビルドコマンドは `npm run build`、デプロイコマンドは `npx wrangler deploy`
- GitHub Actions(`.github/workflows/deploy.yml`)はビルドと `wrangler deploy --dry-run` の確認だけで、デプロイはしない
- 手元からは `npm run deploy`(ビルドしてデプロイ)

## URL

| パス | 内容 |
| --- | --- |
| `/` | 保存済みの言語、なければブラウザの言語で `/ja/` か `/en/` へ移動 |
| `/{ja,en}/` | トップ |
| `/{ja,en}/articles/` | 記事一覧(本文まで絞り込み) |
| `/{ja,en}/category/<id>/` | カテゴリ別 |
| `/{ja,en}/articles/<id>/` | 記事 |
| `/{ja,en}/saved/` | 保存した記事(ブラウザのlocalStorage) |
| `/{ja,en}/guides/` `tools/` `about/` | 学習ガイド、ツール集(アプリのツールへのリンクと、公式資料の入口)、編集方針 |
| `/{ja,en}/search.json` | 検索用の索引(ビルド時に生成) |

## 記事を足す

`src/content/articles/ja/<id>.md` と `src/content/articles/en/<id>.md` を同じIDで置く。frontmatter は `src/content.config.ts` のとおり(`title` `description` `category` `tags` `minutes` `type` `order` ほか)。

- 章は `##`。番号と右の目次は自動で付く
- 注記は引用(`>`)、チェックリストは箇条書き、比較表はMarkdownの表
- コードブロックは ```` ```言語 ラベル ```` と書く。最初の語が言語、残りが左上に出るラベルで、コピーボタンも付く(`src/plugins/markdown.mjs`)
  - 色が付く言語: `js`、`python`(`py`)、`bash`(`sh`)、`json`、`markdown`、`yaml`。それ以外や、実行結果・プロンプト例は `text` にする(色なし)
  - 色付けはビルド時に Shiki で行う。ブラウザに色付け用のJSは送らない。コピーされるのは元のコードそのもの
  - 言語を足すときは、プラグインの `LANGS` に追加する(開発サーバーは再起動が必要)
- **タブ**: コードブロックが連続していて、情報行に `tab:"タブ名"` があると、1つのタブ群にまとめて切り替えられる
  ````
  ```js tab:"JavaScript" attention.mjs
  ...
  ```

  ```python tab:"Python" attention.py
  ...
  ```
  ````
  - 最初に選ばれるのは、`Python` というタブがあればそれ、なければ先頭(`src/plugins/markdown.mjs` の `DEFAULT_TAB`)
  - 選んだタブの名前はブラウザに覚えられ、同じ名前のタブがある他のタブ群(別の記事も)に反映される
  - 矢印キーとHome/Endで切り替えられる。JavaScriptを無効にすると、全部のコードを縦に並べて見せる
  - 同じ内容を別の言語で書くときは、実行して出力が一致することを確かめる(丸めの規則など、言語で結果が変わる点に注意。例:`toFixed` は四捨五入、Pythonは偶数丸め)
  - 図は、タブ群の直後に入る(`scripts/diagrams.mjs`)
  - 記事のコードは、実際に実行した結果を載せる。同じ内容を別の言語で書いたら、出力が一致するか確かめる
- 記号(`*` `_` `~` など)が意図せず装飾にならないよう注意する。装飾したくない箇所は `\*` のようにエスケープする

## 図

記事の図は、Markdownの中にSVGをそのまま埋め込んでいる(`<figure class="diagram">`)。色はテーマの変数を使うので、ライト/ダークで自動で切り替わる。`scripts/diagrams.mjs` が図を作って記事に差し込む(`node scripts/diagrams.mjs`)。

- 日英の文言、図の形、差し込む位置(見出しの名前)は、すべてこのスクリプトの中にある
- 文字がはみ出さないよう、幅が狭い縦長の図(横幅400)にしている。スマホでも文字が小さくなりすぎない
- 図2(温度と確率)の数値は、記事の実行結果と同じ式から計算している

## 触れる部品(ウィジェット)

**ツールは、アプリ(paibot.app)に任せる。** このサイトでは、独立したツールは作らず、記事の説明に必要な部品だけを、記事に埋め込む。

記事に、ブラウザで動かせる部品を埋め込める。HTMLを1行で書く(Markdownの中でも使える)。

```html
<div class="widget" data-widget="string-lab"></div>     <!-- 文字数ラボ -->
<div class="widget" data-widget="temperature"></div>   <!-- 温度スライダー -->
```

- 実装は `src/scripts/widgets.js`。計算はブラウザの中で、記事のコードと同じ式で行う(作り物のデモにしない)
- 日英の文言は、同じファイルの `TEXT` にある。部品を足したら、日英の両方を書く
- JavaScriptが無効なときは、`<div>` の中の文が出る。有効なら、中身は部品に置き換わる
- 「動きを減らす」設定のときは、アニメーションと遷移を止める(`global.css` の末尾)
- 記事に書いた数値と一致するか、テストで確かめる(温度スライダーの確率は、記事の実行結果と同じ値になる)

## ほかの編集箇所

- `src/data/site.js`:カテゴリ、学習ガイド、公式リンク、アプリのツールの一覧(`appTools`。名前と説明はアプリの `messages/*.json` と同じにする)
- `src/i18n/ui.js`:画面の文言(日本語 / 英語)
- `src/scripts/site.js`:ブラウザ側の動作(テーマ、検索、保存、コピー、コードのタブ)
- `src/styles/global.css`:デザイン。ダークテーマの色は末尾の `:root[data-theme="dark"]`

## 未対応(ドメインが決まってから)

canonical、hreflang、sitemap、OGP画像は、公開URLが決まらないと正しい値を書けないため入れていない。`astro.config.mjs` に `site` を設定して追加する。
