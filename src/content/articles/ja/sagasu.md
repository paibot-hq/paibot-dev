---
title: "日本語に強い静的サイト検索を作った:ローマ字・表記ゆれ・打ち間違いを、辞書なしで引く"
description: "「ramen」で「ラーメン」、「ﾗｰﾒﾝ」でも「らーめん」でも見つかる、依存ゼロの静的サイト検索 sagasu を作って npm に公開した。2文字ずつの索引、表記の畳み込み、ローマ字の読み替え、打ち間違いの許容のしくみと、Pagefindと同じ言葉で比べた結果、paibot.app のトップページに入れたときの調整をまとめる。"
category: "frontend"
tags: ["検索","JavaScript","Astro","日本語","OSS"]
minutes: 8
type: "実践ガイド"
level: "静的サイトを作っている人向け"
takeaway: "日本語の検索で困るのは、単語の区切りがないことと、同じ言葉の書き方が何通りもあることです。sagasu は、索引と検索語の両方を同じ規則で「畳み込み」、2文字ずつ区切って引きます。ローマ字と打ち間違いは、そのまま引いて0件だったときだけ試します。"
order: 21
sources:
  - { title: "sagasu(GitHub)", url: "https://github.com/paibot-hq/sagasu" }
  - { title: "@paibot/sagasu(npm)", url: "https://www.npmjs.com/package/@paibot/sagasu" }
  - { title: "Pagefind", url: "https://pagefind.app/" }
  - { title: "Robertson & Zaragoza — The Probabilistic Relevance Framework: BM25 and Beyond", url: "https://doi.org/10.1561/1500000019" }
  - { title: "Unicode Standard Annex #15 — Unicode Normalization Forms", url: "https://unicode.org/reports/tr15/" }
---

## 先に結果

静的サイト向けの検索ライブラリ **sagasu**(探す)を作り、[npm](https://www.npmjs.com/package/@paibot/sagasu) と [GitHub](https://github.com/paibot-hq/sagasu) に公開しました。依存ゼロ、ソースは約1,000行です。ビルドしたHTMLのフォルダにCLIを1回かけて索引を作り、検索はブラウザの中だけで行います。

<figure class="diagram"><svg viewBox="0 0 400 668" role="img" aria-labelledby="sg-t"><title id="sg-t">sagasuの構成:ビルド時に索引を作り、ブラウザで引く</title><defs><filter id="sg-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="sg-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="sg-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="276" rx="14" fill="url(#sg-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">ビルド時(CLI)</text><g class="k-n"><rect x="24" y="36" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="59" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,50) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="70" y="57" class="d-ntitle">dist/**/*.html</text><text x="70" y="72" class="d-nsub">ビルドしたサイト</text><path d="M200 82 V96" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1.5s" repeatCount="indefinite" path="M200 82 V96"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="98" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="121" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,112) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="70" y="119" class="d-ntitle">本文を取り出す</text><text x="70" y="134" class="d-nsub">&lt;main&gt;の中だけ。nav・scriptは除く</text><path d="M200 144 V158" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0s" repeatCount="indefinite" path="M200 144 V158"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="160" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="183" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,174) scale(.75)" class="d-ico"><path d="M4 12h11M11 8l4 4-4 4M19 5v14"/></g></g><text x="70" y="181" class="d-ntitle">畳み込み</text><text x="70" y="196" class="d-nsub">全角半角・カナ→かな・長音を消す</text><path d="M200 206 V220" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0.5s" repeatCount="indefinite" path="M200 206 V220"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="222" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="245" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,236) scale(.75)" class="d-ico"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></g></g><text x="70" y="243" class="d-ntitle">2文字ずつ + 英単語</text><text x="70" y="258" class="d-nsub">東京都 → 東京・京都</text><path d="M200 268 V302" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M200 268 V302"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="304" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="327" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,318) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="325" class="d-ntitle">sagasu.json</text><text x="70" y="340" class="d-nsub">転置索引(このサイトでgzip 170KB)</text><path d="M200 350 V390" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="1.5s" repeatCount="indefinite" path="M200 350 V390"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="1.5s" repeatCount="indefinite"/></circle><text x="212" y="375" class="d-nsub">最初の検索のときに1回だけ読む</text><rect x="8" y="392" width="384" height="268" rx="14" fill="url(#sg-g)" class="d-group"/><text x="24" y="412" class="d-gtitle">ブラウザ</text><g class="k-n"><rect x="24" y="420" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="443" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,434) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="70" y="441" class="d-ntitle">検索語</text><text x="70" y="456" class="d-nsub">ramen / ﾗｰﾒﾝ / javascirpt</text><path d="M200 466 V480" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0s" repeatCount="indefinite" path="M200 466 V480"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="482" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="505" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,496) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="503" class="d-ntitle">候補を広げる</text><text x="70" y="518" class="d-nsub">ローマ字→かな・前方一致・打ち間違い</text><path d="M200 528 V542" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0.5s" repeatCount="indefinite" path="M200 528 V542"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="544" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="567" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,558) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="70" y="565" class="d-ntitle">BM25で点数 → AND</text><text x="70" y="580" class="d-nsub">0件ならORに緩める。-語は除外</text><path d="M200 590 V604" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1s" repeatCount="indefinite" path="M200 590 V604"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="606" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="629" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,620) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="70" y="627" class="d-ntitle">並べ直してハイライト</text><text x="70" y="642" class="d-nsub">連続一致を上に。元の表記に&lt;mark&gt;</text></svg><figcaption>図1 索引はビルド時に1回作る。検索はすべてブラウザの中で、サーバーはいらない。どちらも同じ「畳み込み」を通すので、表記の違いが消える。</figcaption></figure>

このサイト(71ページ、日英)を、静的サイト検索の定番の Pagefind 1.6.0 と sagasu で索引にして、同じ言葉で引き比べました。「正解」は、本文にその文字列が含まれるページの数です。

| 検索語 | 正解 | Pagefind | sagasu |
| --- | --- | --- | --- |
| `アーキテクチャ` | 6 | 6 | 6 |
| `あーきてくちゃ`(ひらがな) | 6 | 0 | 6 |
| `ｱｰｷﾃｸﾁｬ`(半角) | 6 | 0 | 6 |
| `akitekucha`(ローマ字) | 6 | 21(無関係なページが上位) | 6 |
| `こみっと` / `komitto` | 14 | 4 / 4 | 14 / 14 |
| `ＪａｖａＳｃｒｉｐｔ`(全角) | 14 | 0 | 14 |
| `本番 -権限`(除外) | 3 | 12(除外されない) | 3 |
| `architecure`(打ち間違い) | 9 | 1 | 9 |

表記がそろった言葉(`アーキテクチャ` `データベース` `権限` など)では、件数も1位のページも同じでした。差が出るのは、ひらがな・半角・全角・ローマ字・除外です。

| 測ったもの | 結果 |
| --- | --- |
| このサイト(71ページ)の索引づくり | 約130ミリ秒、索引は gzip で約170KB |
| 1回の検索 | 約5ミリ秒 |
| 合成した1万ページ | 索引づくり1.1秒、9,000件当たる最悪の場合で1回3〜7ミリ秒 |

## 使い方

静的サイト(Astro、Hugo、11ty など)なら、ビルドのあとにCLIを1回かけます。

```bash 索引を作る
npm i -D @paibot/sagasu
npx sagasu build dist
```

```text 出力
✔ 71 ページ → dist/sagasu.json
  語彙 10,242 / 603.3 KB (gzip 169.6 KB) / 128 ms
```

本文は `data-sagasu-body` の付いた要素、なければ `<main>`、なければ `<body>` から取ります。`nav` や `script`、`data-sagasu-ignore` を付けた要素は除き、`noindex` のページと `404.html` は入れません。

画面には、部品を1つ置きます。⌘K(Windows は Ctrl+K)か `/` で検索窓が開きます。

```text ヘッダーに置く(Astro の例)
<sagasu-search src="/sagasu.json"></sagasu-search>
<script>import '@paibot/sagasu/ui';</script>
```

Astro なら、`package.json` の `build` を `astro build && sagasu build dist` にすれば、デプロイのたびに索引も作り直されます。ページを使わず、JavaScript から直接使うこともできます。

```js JavaScript から使う
import { createIndex } from '@paibot/sagasu';

const idx = createIndex([
  { url: '/ramen', title: '博多ラーメンの名店', text: 'とんこつスープが自慢' },
  { url: '/kyoto', title: '京都で抹茶を', text: '宇治は抹茶の名産地' },
]);

const [hit] = idx.search('ramen');
console.log(hit.url, hit.titleHTML);
```

```text 出力
/ramen 博多<mark>ラーメン</mark>の名店
```

## 日本語の検索は、どこが難しいか

英語の検索ライブラリの多くは、空白で単語に区切ってから索引にします。日本語でつまずくのは、次の2つです。

1. **単語の区切りがない**。「東京都の人口」は空白なしで続くので、どこまでが1語か分かりません。形態素解析で区切る方法がありますが、辞書が数MBあり、ブラウザに送るには重く、新しい言葉や商品名も苦手です。
2. **同じ言葉の書き方が何通りもある**。「ラーメン」「らーめん」「ﾗｰﾒﾝ」、「JavaScript」「ＪａｖａＳｃｒｉｐｔ」。ローマ字で `ramen` と打つ人もいます。長音の「ー」を打たない人もいます。

sagasu は、1を「2文字ずつ区切る」で、2を「畳み込み」で解いています。

## しくみ

### 畳み込み:書き方の違いを、先に消す

索引を作るときも、検索語を受け取るときも、ハイライトするときも、文字列を同じ規則で変換します。

| 変換 | 例 |
| --- | --- |
| NFKC(Unicode の正規化) | `ＪａｖａＳｃｒｉｐｔ` → `JavaScript`、`ﾗｰﾒﾝ` → `ラーメン` |
| 小文字にする | `JavaScript` → `javascript` |
| カタカナをひらがなにする | `ラーメン` → `らーめん` |
| 長音の「ー」を消す | `らーめん` → `らめん` |

長音まで消すのは、ローマ字のためです。`ramen` をかなにすると「らめん」になり、「ー」がありません。両方から「ー」を消せば、そろいます。

### 2文字ずつ区切る

漢字・ひらがな・カタカナが続く部分は、2文字ずつずらして区切ります(バイグラム)。「東京都」は「東京」と「京都」になります。英数字は、ふつうに単語で区切ります。

辞書が要らず、新しい言葉にも強いのが利点です。弱点は、「東京都」で探すと「東京と京都の旅」も候補に入ることです。そこで、候補を点数順に並べたあと、検索語がそのまま続いて現れるページを上に上げます。1文字の検索(「京」など)は、その字を含む2文字の組をすべて集めて引きます。

### ローマ字と打ち間違い

英字だけの検索語は、IMEと同じ規則でかなにも読み替えます(`shi` と `si`、`tsu` と `tu` のどちらでも。`kk` は「っ」、`nn` は「ん」)。英単語の最後の1語は前方一致にするので、`javas` まで打てば JavaScript が出ます。

4文字以上の英単語は、1文字の打ち間違い(8文字以上なら2文字)まで許します。文字の入れ替え(`javascirpt`)も1文字と数えます。

点数は、検索でよく使われる BM25 で付けます。語の出てくる回数を、長いページほど割り引き、どのページにもある語ほど軽く数えます。タイトルの語は本文の3倍に数えます。

### ハイライトは元の表記に戻す

畳み込みで文字数が変わる(「ー」が消えるなど)ので、畳み込んだ文字ごとに「元の文字列の何文字目か」を覚えておきます。`ﾗｰﾒﾝ` で検索しても、本文の「ラーメン」がそのまま `<mark>` で囲まれます。HTMLはエスケープしてから返します。

## Pagefindと比べて見つかったバグ

最初の表は、直したあとの結果です。比べる前の sagasu には、バグが2つありました。

- **タグが隣り合うと英単語がくっつく**。このサイトのタグ一覧は `<span>Cloudflare</span><span>Architecture</span>` のように空白なしで並んでいて、`cloudflarearchitecture` という1語になっていました。そのせいで `architecture` が正解9件のところ7件でした。いまは、インラインのタグの境目で、両側が英数字のときだけ空白を入れます。「東<em>京</em>都」は「東京都」のままです。
- **`-email` で `emails` が除外されない**。除外する語は、`s` と `es` を付けた形も除くようにしました。

比べる相手がいなければ、どちらも気づきませんでした。比べたスクリプトはリポジトリの `bench/compare/pagefind.mjs` にあり、同じ条件で何度でも動かせます。

Pagefind のほうが良いところもはっきりあります。索引を細かく分けて必要な分だけ読むので、数千ページを超えるサイトでは有利です。言語ごとに索引を分け、英語の語幹の処理もします。sagasu は最初に索引を丸ごと1つ読みます。

## paibot.app のトップページに入れる

[paibot.app](https://paibot.app/) のトップページは、約80のアプリを探す検索です。もともと、全角半角とカタカナひらがなの違いは吸収していました。ここには sagasu の全部ではなく、畳み込み・ローマ字・打ち間違いの判定だけを入れました。並べ方(タイトルが先、その先頭ならさらに上、次にキーワード、最後に説明)は、テストで固めてあったのでそのままです。80件なら、文字列をそのまま探すほうが、2文字ずつの近似より正確だからです。

| 検索語 | 入れる前 | 入れたあと |
| --- | --- | --- |
| `ぽもどろ`(長音なし) | 0件 | ポモドーロタイマー |
| `pomodoro` `omikuji` `ru-retto` | 0件 | ポモドーロタイマー / おみくじ / ルーレット |
| `taima`(打っている途中) | 0件 | ポモドーロタイマー |
| `jsno`(打ち間違い) | 0件 | JSON整形 |
| `ポモドーロ` `計算` `json` | 当たる | 同じ結果 |

1つ調整が要りました。英語の `name` が「なめ」と読まれ、説明文の「なめらか」に当たって、無関係なアプリが出たのです。そこで、ローマ字と打ち間違いは、**そのまま引いて0件だった語にだけ**試すことにし、ローマ字は**かな3文字以上**になるときだけ使うことにしました。`taima`(たいま)や `omikuji` はそのまま見つかります。

## できないこと

- **漢字の読みは知りません**。`kyouto` で「きょうと」は見つかりますが、「京都」は見つかりません。辞書を持たない代わりです。paibot.app では、キーワードに読みを書き足すことで補えます。
- **英語の語幹の処理はしていません**(`running` を `run` として探すなど)。前方一致と、`s` `es` の形で多くは拾えます。
- **索引は1ファイルです**。数万ページを超えるなら、分けて読む仕組みが要ります。
