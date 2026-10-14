---
title: "ローカルLLMを本格的に動かす:大きなモデルとKVキャッシュ"
description: "重み以外に必要なメモリ(KVキャッシュ)の計算、複数GPUへの分割、MoE、同時利用、サーバー用ツールの選び方を整理する。"
category: "ai"
tags: ["ローカルLLM","KVキャッシュ","vLLM"]
minutes: 9
type: "実践ガイド"
level: "ローカルLLM入門を読んだ人向け"
takeaway: "大きなモデルや複数人で使う場合は、重みよりもKVキャッシュと速度(メモリ帯域)が効いてきます。キャッシュは「層数 × ヘッド × トークン数 × 同時利用数」で増えるので、先に見積もります。"
order: 9
sources:
  - { title: "vLLM — Documentation", url: "https://docs.vllm.ai/" }
  - { title: "llama.cpp (GitHub)", url: "https://github.com/ggml-org/llama.cpp" }
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
---

## この記事で扱うこと

[ローカルLLM入門](../local-llm/)では、重みの大きさを「パラメータ数 × 1つあたりのバイト数」で見積もりました。手元で1人が試すだけなら、それで十分です。一方、大きなモデルを動かしたり、長い文章を扱ったり、複数人で共有したりすると、重み以外の要素が効いてきます。この記事は、その見積もり方と、道具の選び方を整理します。

> モデルや道具の性能は入れ替わりが早いので、特定のモデル名や速度の数字は載せません。計算例の設定も、説明用の仮の値です。

## 重みのほかに必要なもの:KVキャッシュ

モデルは文章を1トークンずつ作るとき、それまでの全トークンについて計算した中間結果(KeyとValue)を、メモリに保存しておきます。毎回計算し直さずに済むからです。これがKVキャッシュで、**会話が長いほど、同時に使う人が多いほど、大きくなります**。

> KVキャッシュの大きさ = 2(KeyとValue) × 層数 × KVヘッド数 × ヘッドの次元 × 1要素のバイト数 × トークン数 × 同時利用数

層数やヘッド数は、モデルの設定ファイルや公式ページに書かれています。次のコードは、仮の設定(32層、KVヘッド8、次元128、16ビット)で計算します。JavaScript版とPython版の出力は同じです(筆者がNode.jsとPython 3で実行して確認)。

```js tab:"JavaScript" kv-cache.mjs(KVキャッシュの大きさ)
// KVキャッシュ = 2(KとV) × 層数 × KVヘッド数 × ヘッド次元 × 1要素のバイト数 × トークン数
// 層数などは説明用の仮の値(実在のモデルの設定ではない)。
const model = { layers: 32, kvHeads: 8, headDim: 128, bytes: 2 };   // 16bitのキャッシュ

const perToken = 2 * model.layers * model.kvHeads * model.headDim * model.bytes;
const GiB = (n) => n / 1024 ** 3;

console.log(`1トークンあたり: ${perToken / 1024} KiB`);
for (const tokens of [4096, 32768, 131072]) {
  for (const users of [1, 4]) {
    console.log(`${tokens} トークン × ${users}人: ${GiB(perToken * tokens * users).toFixed(1)} GiB`);
  }
}
```

```python tab:"Python" kv_cache.py
# KVキャッシュ = 2(KとV) × 層数 × KVヘッド数 × ヘッド次元 × 1要素のバイト数 × トークン数
# 層数などは説明用の仮の値(実在のモデルの設定ではない)。
model = {"layers": 32, "kv_heads": 8, "head_dim": 128, "bytes": 2}   # 16bitのキャッシュ

per_token = 2 * model["layers"] * model["kv_heads"] * model["head_dim"] * model["bytes"]
gib = lambda n: n / 1024 ** 3

print(f"1トークンあたり: {per_token // 1024} KiB")
for tokens in [4096, 32768, 131072]:
    for users in [1, 4]:
        print(f"{tokens} トークン × {users}人: {gib(per_token * tokens * users):.1f} GiB")
```

```text 実行結果
1トークンあたり: 128 KiB
4096 トークン × 1人: 0.5 GiB
4096 トークン × 4人: 2.0 GiB
32768 トークン × 1人: 4.0 GiB
32768 トークン × 4人: 16.0 GiB
131072 トークン × 1人: 16.0 GiB
131072 トークン × 4人: 64.0 GiB
```

<figure class="diagram"><svg viewBox="0 0 400 346" role="img" aria-labelledby="mb-t"><title id="mb-t">人数と文脈の長さで、必要なメモリが増える</title><defs><filter id="mb-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mb-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mb-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-a"><g transform="translate(10,31) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="34" y="44.5" class="d-ntitle">1人・短い会話</text><rect x="14" y="54" width="372" height="34" rx="8" class="d-tag"/><rect x="14" y="54" width="24" height="34" class="d-seg-hist d-seg"/><rect x="38" y="54" width="150" height="34" class="d-seg-sys d-seg"/><rect x="188" y="54" width="16" height="34" class="d-seg-out d-seg"/><g class="k-ok"><rect x="14" y="96" width="70" height="22" rx="11" class="d-pill"/></g><text x="49" y="111" class="d-tagtext" text-anchor="middle">収まる</text><g class="k-a"><g transform="translate(10,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><g class="k-a"><g transform="translate(30,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><g class="k-a"><g transform="translate(50,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><g class="k-a"><g transform="translate(70,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="96" y="146.5" class="d-ntitle">4人・長い文脈</text><rect x="14" y="156" width="372" height="34" rx="8" class="d-tag"/><rect x="14" y="156" width="24" height="34" class="d-seg-hist d-seg"/><rect x="38" y="156" width="150" height="34" class="d-seg-sys d-seg"/><rect x="188" y="156" width="92" height="34" class="d-seg-out d-seg"/><rect x="280" y="156" width="58" height="34" class="d-over d-seg"/><g class="k-d"><rect x="14" y="198" width="78" height="22" rx="11" class="d-pill"/></g><text x="53" y="213" class="d-tagtext" text-anchor="middle">あふれる</text><path d="M280 30 V212" class="d-skip" stroke="var(--danger)"/><g class="k-d"><rect x="218" y="6" width="124" height="20" rx="10" class="d-pill"/></g><text x="280" y="20" class="d-tagtext" text-anchor="middle">使えるメモリの上限</text><rect x="8" y="232" width="384" height="104" rx="12" class="d-node k-n"/><rect x="22" y="244" width="14" height="14" rx="4" class="d-seg-hist"/><text x="44" y="256" class="d-nsub">OS・他のアプリ</text><rect x="22" y="266" width="14" height="14" rx="4" class="d-seg-sys"/><text x="44" y="278" class="d-nsub">モデルの重み</text><rect x="22" y="288" width="14" height="14" rx="4" class="d-seg-out"/><text x="44" y="300" class="d-nsub">KVキャッシュ</text><g class="k-a"><g transform="translate(17,311) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="44" y="324" class="d-nsub">KVキャッシュは、文脈の長さ × 同時利用数で増える</text></svg><figcaption>図1 重みの大きさは変わらないが、KVキャッシュは使い方で増え、長い文脈を複数人で使うと上限を超えることがある。割合は説明用。</figcaption></figure>

この仮の設定では、4千トークンの会話なら0.5 GiBで済みますが、13万トークンを4人で使うと、重みとは別に64 GiBが要ります。長い文脈を大きなモデルで使うときの壁は、重みよりキャッシュになることがあります。なお、この表の単位は GiB(1024の累乗)で、入門記事のGB(10億単位)とは少し違います。

- KVヘッド数が少ない設計(複数のヘッドでKeyとValueを共有する方式)のモデルは、キャッシュが小さくなる
- ツールによっては、KVキャッシュも量子化して小さくできる。ただし品質が下がることがある
- 文脈の長さの上限を、必要な分に絞るだけでも、メモリを大きく節約できる

## 大きなモデルを動かす方法

1枚のGPUに収まらないモデルは、次の方法で動かします。

| 方法 | 内容 | 注意点 |
| --- | --- | --- |
| 量子化を強める | 4ビットなどで重みを小さくする | 品質が少しずつ下がる |
| 複数GPUに分ける | 層や計算を複数のGPUに分担させる(テンソル並列など) | GPU間の通信が速くないと、速度が出にくい |
| 一部をCPU側に置く | 載りきらない層をメインメモリに置く(llama.cppなどが対応) | 載せた分だけ遅くなる |
| 大きなメモリの機材を使う | ユニファイドメモリが大きい機種など | 帯域(後述)が速度を決める |

### MoE(専門家混合)モデルの見積もり

MoEは、中にたくさんの「専門家」の部分を持ち、1トークンごとに一部だけを使うモデルです。重みは**全部の専門家分をメモリに置く必要がある**ので、必要なメモリは総パラメータ数で見積もります。一方、1トークンの計算に使うのは一部だけなので、同じ総パラメータ数の通常のモデルより、計算は軽くなります。「メモリは総数、計算量は使う分」と覚えておきます。

## 速度を決めるもの

文章の生成は、1トークンごとに、ほぼ全部の重みをメモリから読み出します。このため、生成の速さは、計算能力よりも**メモリの帯域(1秒に読める量)**に左右されやすいと言われます。重みが小さい(量子化している)ほど、読む量が減って速くなります。

- 重みを小さくする量子化は、メモリだけでなく速度にも効く
- 同じ重みなら、帯域の広い機材の方が速い。載るかどうかとは別の条件になる
- 最初の返事が出るまでの時間は、入力の長さに応じて延びる。長い文書を読ませるほど待つ

## 複数人で使う:サーバー用のツール

1人で使うなら、Ollamaやllama.cppで十分です。複数人が同時に使うなら、同時に来た要求をまとめて処理する(バッチ処理する)サーバー用のツールが向きます。vLLMはその例で、要求を効率よくまとめることや、KVキャッシュをメモリ上でうまく管理することを特長にしています。詳細は公式ドキュメントで確認してください。

<figure class="diagram"><svg viewBox="0 0 400 442" role="img" aria-labelledby="sa-t"><title id="sa-t">複数人で使う推論サーバーの構成</title><defs><filter id="sa-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="sa-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="sa-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="10" y="8" width="120" height="40" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="34" cy="28" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(25,19) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="56" y="32.5" class="d-ntitle">ユーザーA</text><path d="M70 50 V84" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="1s" repeatCount="indefinite" path="M70 50 V84"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="140" y="8" width="120" height="40" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="164" cy="28" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(155,19) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="186" y="32.5" class="d-ntitle">ユーザーB</text><path d="M200 50 V84" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.3s" begin="1.5s" repeatCount="indefinite" path="M200 50 V84"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.3s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="270" y="8" width="120" height="40" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="294" cy="28" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(285,19) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="316" y="32.5" class="d-ntitle">ユーザーC</text><path d="M330 50 V84" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="0s" repeatCount="indefinite" path="M330 50 V84"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="0s" repeatCount="indefinite"/></circle><rect x="8" y="86" width="384" height="148" rx="14" fill="url(#sa-g)" class="d-group"/><text x="24" y="106" class="d-gtitle">推論サーバー(vLLMなど)</text><g class="k-a"><rect x="24" y="110" width="352" height="50" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="48" cy="135" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,126) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="70" y="133" class="d-ntitle">要求の待ち行列</text><text x="70" y="148" class="d-nsub">同時に来た要求をまとめて処理(バッチ)</text><path d="M200 162 V172" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M200 162 V172"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="174" width="352" height="50" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="48" cy="199" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,190) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="197" class="d-ntitle">KVキャッシュの管理</text><text x="70" y="212" class="d-nsub">人ごとのキャッシュを効率よく配置</text><path d="M102 236 V262" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="1s" repeatCount="indefinite" path="M102 236 V262"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="264" width="188" height="122" rx="12" class="d-node" filter="url(#sa-sh)"/><circle cx="32" cy="288" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,279) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="54" y="293" class="d-ntitle">GPU 0</text><rect x="22" y="308" width="160" height="30" rx="8" class="d-seg-sys d-seg"/><text x="102" y="327" class="d-white" text-anchor="middle">重みの半分</text><rect x="22" y="344" width="160" height="30" rx="8" class="d-seg-out d-seg"/><text x="102" y="363" class="d-white" text-anchor="middle">KVキャッシュ</text><path d="M306 236 V262" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="1.5s" repeatCount="indefinite" path="M306 236 V262"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="212" y="264" width="188" height="122" rx="12" class="d-node" filter="url(#sa-sh)"/><circle cx="236" cy="288" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(227,279) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="258" y="293" class="d-ntitle">GPU 1</text><rect x="226" y="308" width="160" height="30" rx="8" class="d-seg-sys d-seg"/><text x="306" y="327" class="d-white" text-anchor="middle">重みの半分</text><rect x="226" y="344" width="160" height="30" rx="8" class="d-seg-out d-seg"/><text x="306" y="363" class="d-white" text-anchor="middle">KVキャッシュ</text><path d="M198 322 H212" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="0s" repeatCount="indefinite" path="M198 322 H212"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0s" repeatCount="indefinite"/></circle><path d="M212 340 H198" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="0.5s" repeatCount="indefinite" path="M212 340 H198"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><g transform="translate(111,399) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="138" y="412" class="d-ntitle">GPU間の通信</text><text x="200" y="430" class="d-nsub" text-anchor="middle">分割するときは、GPU間の接続が速いことが要る</text></svg><figcaption>図2 要求はサーバーで受けてまとめ、複数のGPUに分けた重みで計算する。キャッシュは人数分のメモリを使う。</figcaption></figure>

| 用途 | 向くツールの例 |
| --- | --- |
| 1人で試す、手軽さ優先 | Ollama、LM Studio |
| CPUや一部GPU、細かい調整 | llama.cpp |
| 複数人の同時利用、GPUサーバー | vLLM など、サーバー向けの推論エンジン |

ツールによって、使えるモデルの形式も違います。たとえばllama.cppはGGUF形式、GPU向けのサーバーはAWQやGPTQなどの量子化形式を使うことが多いので、モデルを探すときは対応する形式を確かめます。

## 本格運用の前に確かめること

- [ ] 重みのメモリ([見積もりツール](https://paibot.app/ja/llm-memory)で確認)に、KVキャッシュ(最長の文脈 × 同時利用数)を足しても、使えるメモリに収まるか
- [ ] 複数GPUに分けるなら、GPU間の接続は十分に速いか
- [ ] 必要な速度は、機材のメモリ帯域で出るか。小さなモデルや強い量子化で足りないか
- [ ] 同時に使う人数と、1人あたりの文脈の長さを決めたか
- [ ] モデルのライセンスが、運用の形(社内利用、商用など)を許しているか
- [ ] 品質は、自分のタスクで、クラウドのモデルと比べたか。コストだけで決めない
- [ ] 更新、監視、障害時の対応を、誰が担当するか決めたか

クラウドのAPIは、これらをすべて事業者が担います。自分で運用するのは、データを出せない、大量に回す、細かく制御したい、といった理由があるときに、割に合う選択です。
