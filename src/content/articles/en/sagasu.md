---
title: "Static site search that handles Japanese: romaji, spelling variants and typos, without a dictionary"
description: "We built sagasu, a zero-dependency search library for static sites where “ramen”, “ﾗｰﾒﾝ” and “らーめん” all find “ラーメン”, and published it on npm. How the bigram index, text folding, romaji reading and typo tolerance work, a side-by-side comparison with Pagefind, and what we adjusted when putting it on the paibot.app top page."
category: "frontend"
tags: ["Search","JavaScript","Astro","Japanese","OSS"]
minutes: 8
type: "Practical guide"
level: "For people who build static sites"
takeaway: "Searching Japanese is hard for two reasons: words are not separated by spaces, and the same word can be written several ways. sagasu folds both the index and the query with the same rules and indexes overlapping two-character pieces. Romaji and typos are tried only for a word that finds nothing as typed."
order: 21
sources:
  - { title: "sagasu (GitHub)", url: "https://github.com/paibot-hq/sagasu" }
  - { title: "@paibot/sagasu (npm)", url: "https://www.npmjs.com/package/@paibot/sagasu" }
  - { title: "Pagefind", url: "https://pagefind.app/" }
  - { title: "Robertson & Zaragoza — The Probabilistic Relevance Framework: BM25 and Beyond", url: "https://doi.org/10.1561/1500000019" }
  - { title: "Unicode Standard Annex #15 — Unicode Normalization Forms", url: "https://unicode.org/reports/tr15/" }
---

## The results first

We built **sagasu** (Japanese for “search for”), a search library for static sites, and published it on [npm](https://www.npmjs.com/package/@paibot/sagasu) and [GitHub](https://github.com/paibot-hq/sagasu). It has no dependencies and about 1,000 lines of source. You run its CLI once over a folder of built HTML to make an index; searching happens entirely in the browser.

<figure class="diagram"><svg viewBox="0 0 400 668" role="img" aria-labelledby="sg-t"><title id="sg-t">How sagasu works: index at build time, search in the browser</title><defs><filter id="sg-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="sg-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="sg-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="276" rx="14" fill="url(#sg-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">BUILD TIME (CLI)</text><g class="k-n"><rect x="24" y="36" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="59" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,50) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="70" y="57" class="d-ntitle">dist/**/*.html</text><text x="70" y="72" class="d-nsub">the built site</text><path d="M200 82 V96" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1s" repeatCount="indefinite" path="M200 82 V96"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="98" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="121" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,112) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="70" y="119" class="d-ntitle">Extract the body</text><text x="70" y="134" class="d-nsub">inside &lt;main&gt;; nav and scripts dropped</text><path d="M200 144 V158" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1.5s" repeatCount="indefinite" path="M200 144 V158"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="160" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="183" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,174) scale(.75)" class="d-ico"><path d="M4 12h11M11 8l4 4-4 4M19 5v14"/></g></g><text x="70" y="181" class="d-ntitle">Fold</text><text x="70" y="196" class="d-nsub">width, katakana→hiragana, long vowel</text><path d="M200 206 V220" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0s" repeatCount="indefinite" path="M200 206 V220"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="222" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="245" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,236) scale(.75)" class="d-ico"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></g></g><text x="70" y="243" class="d-ntitle">Bigrams + latin words</text><text x="70" y="258" class="d-nsub">東京都 → 東京, 京都</text><path d="M200 268 V302" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M200 268 V302"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="304" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="327" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,318) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="325" class="d-ntitle">sagasu.json</text><text x="70" y="340" class="d-nsub">inverted index (170 KB gzipped here)</text><path d="M200 350 V390" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="1s" repeatCount="indefinite" path="M200 350 V390"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="1s" repeatCount="indefinite"/></circle><text x="212" y="375" class="d-nsub">fetched once, on the first search</text><rect x="8" y="392" width="384" height="268" rx="14" fill="url(#sg-g)" class="d-group"/><text x="24" y="412" class="d-gtitle">BROWSER</text><g class="k-n"><rect x="24" y="420" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="443" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,434) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="70" y="441" class="d-ntitle">Query</text><text x="70" y="456" class="d-nsub">ramen / ﾗｰﾒﾝ / javascirpt</text><path d="M200 466 V480" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1.5s" repeatCount="indefinite" path="M200 466 V480"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="482" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="505" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,496) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="503" class="d-ntitle">Widen the terms</text><text x="70" y="518" class="d-nsub">romaji→kana, prefix, typos</text><path d="M200 528 V542" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0s" repeatCount="indefinite" path="M200 528 V542"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="544" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="567" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,558) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="70" y="565" class="d-ntitle">Score with BM25 → AND</text><text x="70" y="580" class="d-nsub">falls back to OR; -word excludes</text><path d="M200 590 V604" class="d-path" marker-end="url(#sg-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0.5s" repeatCount="indefinite" path="M200 590 V604"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="606" width="352" height="46" rx="11" class="d-node" filter="url(#sg-sh)"/><circle cx="48" cy="629" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,620) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="70" y="627" class="d-ntitle">Re-rank and highlight</text><text x="70" y="642" class="d-nsub">phrases first; &lt;mark&gt; in the original</text></svg><figcaption>Figure 1 The index is built once, at build time. Every search runs in the browser, with no server. Both sides go through the same folding, so spelling variants disappear.</figcaption></figure>

We indexed this site (71 pages, Japanese and English) with Pagefind 1.6.0, the usual choice for static site search, and with sagasu, and ran the same queries. “Correct” is the number of pages whose text contains the string.

| Query | Correct | Pagefind | sagasu |
| --- | --- | --- | --- |
| `アーキテクチャ` (katakana) | 6 | 6 | 6 |
| `あーきてくちゃ` (hiragana) | 6 | 0 | 6 |
| `ｱｰｷﾃｸﾁｬ` (half-width) | 6 | 0 | 6 |
| `akitekucha` (romaji) | 6 | 21 (unrelated pages on top) | 6 |
| `こみっと` / `komitto` | 14 | 4 / 4 | 14 / 14 |
| `ＪａｖａＳｃｒｉｐｔ` (full-width) | 14 | 0 | 14 |
| `本番 -権限` (exclusion) | 3 | 12 (not excluded) | 3 |
| `architecure` (typo) | 9 | 1 | 9 |

For words written the usual way (`アーキテクチャ`, `データベース`, `権限` and so on) both gave the same counts and the same top page. The differences are hiragana, half-width, full-width, romaji and exclusion.

| Measured | Result |
| --- | --- |
| Indexing this site (71 pages) | about 130 ms; index about 170 KB gzipped |
| One search | about 5 ms |
| 10,000 synthetic pages | 1.1 s to index; 3–7 ms per search in the worst case (9,000 hits) |

## Using it

On a static site (Astro, Hugo, 11ty, …), run the CLI once after the build.

```bash Make the index
npm i -D @paibot/sagasu
npx sagasu build dist
```

```text Output
✔ 71 ページ → dist/sagasu.json
  語彙 10,242 / 603.3 KB (gzip 169.6 KB) / 128 ms
```

(The CLI currently prints in Japanese: 71 pages, the vocabulary size, the index size and the time.) The body is taken from the element with `data-sagasu-body`, otherwise `<main>`, otherwise `<body>`. `nav`, `script` and anything marked `data-sagasu-ignore` are dropped; `noindex` pages and `404.html` are left out.

On the page, add one component. ⌘K (Ctrl+K on Windows) or `/` opens the search box.

```text In the header (Astro example)
<sagasu-search src="/sagasu.json"></sagasu-search>
<script>import '@paibot/sagasu/ui';</script>
```

With Astro, set `build` in `package.json` to `astro build && sagasu build dist` and the index is rebuilt on every deploy. You can also skip the HTML and use it from JavaScript.

```js From JavaScript
import { createIndex } from '@paibot/sagasu';

const idx = createIndex([
  { url: '/ramen', title: '博多ラーメンの名店', text: 'とんこつスープが自慢' },
  { url: '/kyoto', title: '京都で抹茶を', text: '宇治は抹茶の名産地' },
]);

const [hit] = idx.search('ramen');
console.log(hit.url, hit.titleHTML);
```

```text Output
/ramen 博多<mark>ラーメン</mark>の名店
```

## What makes Japanese search hard

Most search libraries built for English split text into words at spaces before indexing. Japanese trips them up in two ways.

1. **There are no spaces between words.** 東京都の人口 (“the population of Tokyo”) runs on without a break, so it is not clear where one word ends. A morphological analyser can split it, but its dictionary is several megabytes, too heavy to send to a browser, and it struggles with new words and product names.
2. **The same word can be written several ways.** ラーメン, らーめん and ﾗｰﾒﾝ are all “ramen”; JavaScript can be typed as ＪａｖａＳｃｒｉｐｔ in full-width letters. Some people type the romaji `ramen`, and some leave out the long vowel mark ー.

sagasu solves the first with overlapping two-character pieces and the second with folding.

## How it works

### Folding: remove the differences first

The same rules transform text when building the index, when reading a query, and when highlighting.

| Step | Example |
| --- | --- |
| NFKC (Unicode normalization) | `ＪａｖａＳｃｒｉｐｔ` → `JavaScript`, `ﾗｰﾒﾝ` → `ラーメン` |
| Lower case | `JavaScript` → `javascript` |
| Katakana to hiragana | `ラーメン` → `らーめん` |
| Drop the long vowel mark ー | `らーめん` → `らめん` |

The long vowel mark goes because of romaji: `ramen` read as kana is らめん, with no ー. Dropping it on both sides makes them match.

### Overlapping two-character pieces

A run of kanji, hiragana or katakana is split into overlapping pairs (bigrams): 東京都 becomes 東京 and 京都. Letters and digits are split into words as usual.

No dictionary is needed and new words are fine. The downside is that searching 東京都 also finds 東京と京都の旅 (“a trip to Tokyo and Kyoto”). So after ranking, pages where the query appears as one unbroken string move up. A one-character query (京) collects every pair containing that character.

### Romaji and typos

A query made only of latin letters is also read as kana by the rules a Japanese input method uses (`shi` or `si`, `tsu` or `tu`; `kk` is っ, `nn` is ん). The last latin word is matched as a prefix, so `javas` already finds JavaScript.

Latin words of four letters or more may have one typo (two from eight letters). Swapping two letters (`javascirpt`) counts as one.

Scores come from BM25, the standard in search: how often a word appears, discounted for long pages and for words that are on every page. Words in the title count three times as much as in the body.

### Highlighting goes back to the original

Folding changes the length of the text (ー disappears), so for every folded character sagasu remembers its position in the original. Searching `ﾗｰﾒﾝ` marks ラーメン in the page text as written. HTML is escaped before it is returned.

## Bugs the Pagefind comparison found

The first table shows results after the fixes. Before the comparison, sagasu had two bugs.

- **Words glued together across tags.** This site's tag list is written as `<span>Cloudflare</span><span>Architecture</span>` with no space, and sagasu read it as one word, `cloudflarearchitecture`. So `architecture` found 7 pages instead of 9. Now, at an inline tag boundary, a space is inserted only when both sides are letters or digits. 東<em>京</em>都 stays 東京都.
- **`-email` did not exclude `emails`.** An excluded word now also excludes its `s` and `es` forms.

Without something to compare against, we would have noticed neither. The comparison script is `bench/compare/pagefind.mjs` in the repository and can be rerun under the same conditions.

Pagefind is clearly better in some ways. It splits its index into small pieces and loads only what a search needs, which wins on sites with thousands of pages. It keeps a separate index per language and stems English words. sagasu loads its whole index at once.

## Putting it on the paibot.app top page

The [paibot.app](https://paibot.app/) top page is a search over about 80 apps. It already ignored width and katakana/hiragana differences. Rather than all of sagasu, we added only its folding, romaji and typo checks. The ranking (title first, higher still at its start, then keywords, then description) was pinned by tests and stays as it was: for 80 entries, looking for the exact string is more accurate than the bigram approximation.

| Query | Before | After |
| --- | --- | --- |
| `ぽもどろ` (no long vowel) | 0 results | Pomodoro timer |
| `pomodoro` `omikuji` `ru-retto` | 0 results | Pomodoro timer / Omikuji / Roulette |
| `taima` (still typing) | 0 results | Pomodoro timer |
| `jsno` (typo) | 0 results | JSON Formatter |
| `ポモドーロ` `計算` `json` | found | same results |

One adjustment was needed. The English word `name` was read as the kana なめ, matched なめらか (“smooth”) in a description, and brought up an unrelated app. So romaji and typos are now tried **only for a word that finds nothing as typed**, and romaji is used **only when it gives three kana or more**. `taima` (たいま) and `omikuji` are still found.

## What it cannot do

- **It does not know how kanji are read.** `kyouto` finds きょうと but not 京都; that is the price of having no dictionary. On paibot.app, adding the reading to an app's keywords covers it.
- **No English stemming** (finding `running` for `run`). Prefix matching and the `s`/`es` forms catch many cases.
- **The index is one file.** Beyond tens of thousands of pages, it would need to be split and loaded in parts.
