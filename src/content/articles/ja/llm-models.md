---
title: "LLMモデルの全体像:種類と選び方"
description: "クラウドのAPIと公開モデル、大きさ、MoE、思考、マルチモーダル、役割。たくさんあるLLMモデルを、何で分けて、どう選ぶかを短く整理する。"
category: "ai"
tags: ["LLM","モデル選び","入門"]
minutes: 7
type: "入門ガイド"
level: "LLMを使ったことがあれば十分"
takeaway: "LLMモデルは、提供のしかた、大きさ、調整の目的、扱える入力、役割で分けると、見通せます。名前で選ぶのではなく、自分の用途の質問で比べて決めます。"
order: 5.5
sources:
  - { title: "Claude Docs — Models overview", url: "https://platform.claude.com/docs/en/about-claude/models/overview" }
---

## LLMモデルとは

LLMモデルは、大量の文章で学習した、**学習済みの重み**です。仕組みはどれも同じで、[次のトークンを確率で選ぶ](../llm-how-it-works/)ことを繰り返します。違いは、学習に使ったデータ、大きさ、学習のあとの調整、扱える入力にあります。

> モデルの名前とバージョンは、数か月で入れ替わります。この記事は、変わりにくい「分け方」と「選び方」を中心にし、具体名は2026年10月時点の例として最小限にしています。

## 5つの軸で分ける

| 軸 | 分かれ方 | 何が変わるか |
| --- | --- | --- |
| 提供のしかた | クラウドのAPI / 公開モデル(重みを配布) | データの行き先、運用の手間、使える最高の性能 |
| 大きさ | パラメータ数。全部を使う密なモデル / 一部だけ使うMoE | 賢さ、速さ、必要なGPU |
| 調整の目的 | 素のモデル / 指示に従う型 / 考えてから答える型 | 使いやすさ、答えの深さ、時間 |
| 扱える入力 | 文章だけ / 画像なども扱うマルチモーダル | 使える場面 |
| 役割 | 生成 / 埋め込み / 再ランキング / ガードレール | システムの中の持ち場 |

<figure class="diagram"><svg viewBox="0 0 400 304" role="img" aria-labelledby="mm-t"><title id="mm-t">LLMモデルの地図</title><defs><filter id="mm-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mm-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mm-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-w"><rect x="8" y="8" width="188" height="92" rx="11" class="d-node" filter="url(#mm-sh)"/><circle cx="102" cy="29" r="13" class="d-badge"/></g><g class="k-w"><g transform="translate(93,20) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="102" y="56" class="d-ntitle" text-anchor="middle">クラウドのAPI</text><text x="102" y="70" class="d-nsub" text-anchor="middle">データは提供元へ。GPUは要らない</text><text x="102" y="94" class="d-nsub" text-anchor="middle">Claude / GPT / Gemini</text><g class="k-a"><rect x="204" y="8" width="188" height="92" rx="11" class="d-node" filter="url(#mm-sh)"/><circle cx="298" cy="29" r="13" class="d-badge"/></g><g class="k-a"><g transform="translate(289,20) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="298" y="56" class="d-ntitle" text-anchor="middle">公開モデル</text><text x="298" y="70" class="d-nsub" text-anchor="middle">重みを配布。自分の環境で動かす</text><text x="298" y="94" class="d-nsub" text-anchor="middle">gpt-oss / Qwen / Gemma など</text><rect x="8" y="116" width="384" height="66" rx="14" fill="url(#mm-g)" class="d-group"/><text x="24" y="136" class="d-gtitle">段で選ぶ</text><g class="k-a"><rect x="24" y="146" width="112" height="22" rx="11" class="d-pill"/></g><text x="80" y="161" class="d-tagtext" text-anchor="middle">上位:難しい推論</text><g class="k-n"><rect x="144" y="146" width="112" height="22" rx="11" class="d-pill"/></g><text x="200" y="161" class="d-tagtext" text-anchor="middle">中位:ふだんの作業</text><g class="k-ok"><rect x="264" y="146" width="112" height="22" rx="11" class="d-pill"/></g><text x="320" y="161" class="d-tagtext" text-anchor="middle">下位:大量・高速</text><rect x="8" y="198" width="384" height="96" rx="14" fill="url(#mm-g)" class="d-group"/><text x="24" y="218" class="d-gtitle">役割で使い分ける</text><g class="k-a"><rect x="24" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-a"><g transform="translate(56,235) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="65" y="272" class="d-nsub" text-anchor="middle">生成</text><g class="k-n"><rect x="114" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-n"><g transform="translate(146,235) scale(.75)" class="d-ico"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></g></g><text x="155" y="272" class="d-nsub" text-anchor="middle">埋め込み</text><g class="k-n"><rect x="204" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-n"><g transform="translate(236,235) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="245" y="272" class="d-nsub" text-anchor="middle">再ランキング</text><g class="k-n"><rect x="294" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-n"><g transform="translate(326,235) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="335" y="272" class="d-nsub" text-anchor="middle">ガードレール</text></svg><figcaption>図1 まず提供のしかたで2つに分かれ、クラウドのAPIは性能の段で、公開モデルは大きさとライセンスで選ぶ。1つのシステムの中では、役割ごとに別のモデルを使う。</figcaption></figure>

## クラウドのAPIのモデル

Anthropic(Claude)、OpenAI(GPT)、Google(Gemini)などが、APIで提供しています。自分でGPUを持たずに、最高水準の性能を使えます。代わりに、入力は提供元のサーバーに送られます。

多くの提供元は、**性能と速さ・費用の違う段**を並べています。たとえばClaudeは、2026年10月時点で次の4つです(公式ドキュメントによる)。

| モデル | 位置づけ |
| --- | --- |
| Claude Fable 5.1 | 難しい推論と、長時間のエージェント作業向け |
| Claude Opus 5.5 | 多くの用途の出発点。長く続くコーディングや知的作業向け |
| Claude Sonnet 5.5 | 速さと賢さのバランス |
| Claude Haiku 5.5 | 分類、抽出、振り分けなど、大量で速さが要る処理向け |

いずれも、文脈は100万トークン、文章と画像を入力にでき、考える量はモデルが調整します。ほかの提供元も、似た段の並べ方をしています。迷ったら中位の段から始め、足りなければ上へ、量が多ければ下へ動かします。

## 公開モデル

重みが配布されていて、自分のPCやサーバーで動かせるモデルです。データを外に出さずに使え、[ローカルLLM](../local-llm/)や[複数人での配信](../local-llm-serving/)の対象になります。

- **系統**:Qwen、Llama、Gemma、Mistral、DeepSeek、GPT-OSS(OpenAIの公開モデル)など。vLLMなど主要な推論エンジンが対応している
- **例(配布ページで確認)**:`gpt-oss-20b`(16GBのメモリ内で動く、Apache 2.0)、`gpt-oss-120b`(80GBのGPU1枚、Apache 2.0)、`Qwen3.8-27B`(Apache 2.0)、日本語を強化したSwallowシリーズ
- **ライセンス**:Apache 2.0やMITのような緩いものから、独自の利用条件を持つものまである。商用で使えるかは、モデルごとに確かめる
- **「オープン」の意味**:重みが公開されていても、学習データや学習の方法まで公開されているとは限らない。「オープンウェイト」と呼んで区別することもある

## 性能を左右するもの

- **パラメータ数**:大きいほど賢い傾向があるが、遅く、メモリも要る。必要なメモリは、[メモリ見積もりツール](https://paibot.app/ja/llm-memory)で確かめられる
- **MoE(専門家混合)**:中にたくさんの専門家を持ち、1トークンごとに一部だけを使う。メモリは総パラメータ数、計算は使う分で考える
- **文脈の長さ**:一度に読める量。長いほど、長い文書を渡せるが、費用や待ち時間も増える
- **考えてから答える型**:答える前に考える分、難しい問題に強いが、時間とトークンを使う
- **量子化**:公開モデルを、ビット数を減らして小さくする。少し質を下げて、小さなGPUで動かせる

## 選び方

1. **データを外に出せるか**:出せないなら、公開モデルを自分の環境で。出せるなら、クラウドのAPIが手軽で強い
2. **必要な質**:難しい推論や長い作業なら上位の段、日常的な処理なら中位、大量の分類や抽出なら下位
3. **量と費用**:大量に回すなら、小さいモデルや下位の段で足りるかを先に試す
4. **日本語**:モデルカードに書かれていないことも多い。日本語の質問で確かめる
5. **最後は、自分の質問で比べる**:候補を2〜3つに絞り、同じ質問のセットで、質、速さ、費用を測る

<figure class="diagram"><svg viewBox="0 0 400 284" role="img" aria-labelledby="mc2-t"><title id="mc2-t">モデルの選び方の流れ</title><defs><filter id="mc2-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mc2-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mc2-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="70" y="8" width="260" height="52" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="94" cy="34" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(85,25) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="116" y="32" class="d-ntitle">データを外に出せるか</text><text x="116" y="47" class="d-nsub">最初に決める</text><path d="M140 62 V80 H104 V100" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M140 62 V80 H104 V100"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><path d="M260 62 V80 H296 V100" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M260 62 V80 H296 V100"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><text x="112" y="76" class="d-nsub" text-anchor="end">出せない</text><text x="288" y="76" class="d-nsub">出せる</text><g class="k-a"><rect x="8" y="102" width="188" height="76" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="102" cy="123" r="13" class="d-badge"/></g><g class="k-a"><g transform="translate(93,114) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="102" y="150" class="d-ntitle" text-anchor="middle">公開モデルを自分の環境で</text><text x="102" y="164" class="d-nsub" text-anchor="middle">GPUに載る大きさとライセンス</text><g class="k-w"><rect x="204" y="102" width="188" height="76" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="298" cy="123" r="13" class="d-badge"/></g><g class="k-w"><g transform="translate(289,114) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="298" y="150" class="d-ntitle" text-anchor="middle">クラウドのAPI</text><text x="298" y="164" class="d-nsub" text-anchor="middle">中位の段から始める</text><path d="M102 180 V200 H200 V214" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M102 180 V200 H200 V214"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><path d="M298 180 V200 H200 V214" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M298 180 V200 H200 V214"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="216" width="352" height="56" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="48" cy="244" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,235) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="70" y="242" class="d-ntitle">自分の質問で、2〜3の候補を比べる</text><text x="70" y="257" class="d-nsub">質・速さ・費用(日本語を含む)</text></svg><figcaption>図2 最初にデータの行き先を決め、候補を絞ってから、自分の用途の質問で比べて決める。</figcaption></figure>

1つのシステムで、役割ごとに別のモデルを使うのも普通です。チャットには大きめのモデル、検索には埋め込みモデル、振り分けや分類には小さく速いモデル、という組み合わせです。

## 確認リスト

- [ ] データを外に出せるかを、最初に決めたか
- [ ] 候補のライセンスと、利用条件を確かめたか
- [ ] 公開モデルなら、GPUに載る大きさか
- [ ] 自分の用途の質問(日本語を含む)で、2〜3の候補を比べたか
- [ ] モデルの名前とバージョンを記録し、入れ替えるときに同じ質問で比べられるようにしたか
