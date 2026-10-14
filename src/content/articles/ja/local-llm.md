---
title: "ローカルLLM入門:自分のPCでモデルを動かす"
description: "ローカルLLMとは何か、クラウドAPIと何が違うのか。メモリの見積もり、量子化、Ollamaでの動かし方、向いている用途までを整理する。"
category: "ai"
tags: ["ローカルLLM","Ollama","量子化"]
minutes: 8
type: "入門ガイド"
level: "ターミナルが使えれば十分"
takeaway: "ローカルLLMは、モデルの重みを自分のPCに置いて動かす方法です。必要なメモリは「パラメータ数 × 1つあたりのバイト数」でおおよそ見積もれ、量子化で小さくできます。"
order: 8
sources:
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
  - { title: "llama.cpp (GitHub)", url: "https://github.com/ggml-org/llama.cpp" }
  - { title: "LM Studio — Docs", url: "https://lmstudio.ai/docs" }
---

## ローカルLLMとは

ローカルLLMは、モデルの重み(学習で得たパラメータ)をダウンロードし、自分のPCの上で推論する使い方です。ClaudeのようなクラウドのAPIは、入力を事業者のサーバーに送って結果を受け取ります。ローカルでは、入力も出力も手元のマシンの中で完結します。仕組みはどちらも同じで、次のトークンを確率で選ぶ処理を繰り返します(基礎は[LLMはどう動くか](../llm-how-it-works/)を参照)。違うのは、どこで計算するかです。

<figure class="diagram"><svg viewBox="0 0 400 398" role="img" aria-labelledby="lf-t"><title id="lf-t">クラウドAPIとローカルLLMで、データが流れる場所</title><defs><filter id="lf-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="lf-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="lf-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="122" rx="14" fill="url(#lf-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">クラウドAPI</text><g class="k-n"><rect x="24" y="36" width="136" height="52" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="48" cy="62" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,53) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="70" y="66.5" class="d-ntitle">あなたのPC</text><g class="k-w"><rect x="224" y="36" width="152" height="52" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="248" cy="62" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(239,53) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="270" y="60" class="d-ntitle">事業者のサーバー</text><text x="270" y="75" class="d-nsub">モデルがここで動く</text><path d="M164 54 H220" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M164 54 H220"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><path d="M220 72 H164" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M220 72 H164"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><text x="192" y="48" class="d-nsub" text-anchor="middle">入力を送る</text><text x="192" y="86" class="d-nsub" text-anchor="middle">結果が返る</text><text x="24" y="118" class="d-nsub">入力は通信で事業者に送られる</text><rect x="8" y="146" width="384" height="244" rx="14" fill="url(#lf-g)" class="d-group"/><text x="24" y="166" class="d-gtitle">ローカルLLM</text><g class="k-n"><rect x="70" y="172" width="260" height="46" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="94" cy="195" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(85,186) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="116" y="193" class="d-ntitle">アプリ</text><text x="116" y="208" class="d-nsub">チャットなど</text><path d="M200 220 V240" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M200 220 V240"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="70" y="242" width="260" height="46" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="94" cy="265" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(85,256) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="116" y="263" class="d-ntitle">推論エンジン</text><text x="116" y="278" class="d-nsub">Ollamaなど</text><path d="M200 290 V310" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M200 290 V310"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="70" y="312" width="260" height="46" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="94" cy="335" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(85,326) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="116" y="333" class="d-ntitle">モデルの重み</text><text x="116" y="348" class="d-nsub">メモリに載せる</text><g class="k-ok"><g class="k-ok"><g transform="translate(95,367) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g></g><text x="124" y="380" class="d-ntitle">入力も出力も、PCの外に出ない</text></svg><figcaption>図1 仕組みは同じで、計算する場所が違う。ローカルでは、入力も出力もPCの中で完結する。</figcaption></figure>

> 公開されているモデルの種類や性能は入れ替わりが早いので、この記事では特定のモデル名や性能の数字を載せません。選ぶときは、各モデルの公式ページとライセンスを確かめてください。

## クラウドとローカルの違い

| 観点 | クラウドAPI | ローカル |
| --- | --- | --- |
| データの行き先 | 事業者のサーバーに送られる | 手元のPCの中に留まる |
| 費用 | 使ったトークン数に応じて支払う | 機材を用意すれば、実行そのものに従量課金はない |
| 性能の上限 | 大きなモデルを使える | 手元のメモリで動く大きさに制限される |
| オフライン | 通信が必要 | モデルを入手済みなら動く |
| 保守 | 事業者が更新する | モデルの更新、設定、容量の管理は自分で行う |

どちらが優れているかではなく、用途で選びます。機密性の高い文書を外に出したくない、ネットワークがない場所で使いたい、試行錯誤で大量に呼び出したい、といった場面はローカルが向きます。一方、最高の品質が必要な作業や、機材を持たない場合はクラウドが現実的です。両方を使い分ける人も多くいます。

## 必要なメモリを見積もる

ローカルで最初にぶつかる制約はメモリです。モデルの重みをメモリに載せる必要があり、その大きさは「パラメータ数 × 1パラメータあたりのバイト数」でおおよそ決まります。1パラメータを16ビット(2バイト)で持てば、70億パラメータ(7B)で約14GBです。次のコードで、サイズと精度ごとの目安を出します。JavaScript版とPython版の出力は同じです(筆者がNode.jsとPython 3で実行して確認)。

```js tab:"JavaScript" memory.mjs(重みのメモリ量の目安)
// 重みのメモリ量の目安(GB) = パラメータ数(十億) × 1パラメータあたりのバイト数
const GB = (billions, bits) => (billions * 1e9 * bits / 8) / 1e9;

for (const size of [7, 14, 32, 70]) {
  const row = [16, 8, 4].map((bits) => `${bits}bit ${GB(size, bits).toFixed(1)} GB`);
  console.log(`${size}B:`, row.join(' / '));
}
```

```python tab:"Python" memory.py
# 重みのメモリ量の目安(GB) = パラメータ数(十億) × 1パラメータあたりのバイト数
def gb(billions, bits):
    return (billions * 1e9 * bits / 8) / 1e9

for size in [7, 14, 32, 70]:
    row = [f"{bits}bit {gb(size, bits):.1f} GB" for bits in [16, 8, 4]]
    print(f"{size}B:", " / ".join(row))
```

```text 実行結果
7B: 16bit 14.0 GB / 8bit 7.0 GB / 4bit 3.5 GB
14B: 16bit 28.0 GB / 8bit 14.0 GB / 4bit 7.0 GB
32B: 16bit 64.0 GB / 8bit 32.0 GB / 4bit 16.0 GB
70B: 16bit 140.0 GB / 8bit 70.0 GB / 4bit 35.0 GB
```

<figure class="diagram"><svg viewBox="0 0 400 470" role="img" aria-labelledby="mc-t"><title id="mc-t">動かし方ごとに、重みが載るメモリ</title><defs><filter id="mc-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mc-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-a"><rect x="8" y="8" width="384" height="124" rx="12" class="d-node" filter="url(#mc-sh)"/><circle cx="34" cy="34" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(25,25) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="58" y="39" class="d-ntitle">GPUを使う(NVIDIAなど)</text><clipPath id="mc1"><rect x="24" y="56" width="124" height="30" rx="7"/></clipPath><rect x="24" y="56" width="124" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc1)"><rect x="24.0" y="56" width="62.0" height="30" class="d-seg-hist d-seg"/></g><clipPath id="mc2"><rect x="204" y="56" width="172" height="30" rx="7"/></clipPath><rect x="204" y="56" width="172" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc2)"><rect x="204.0" y="56" width="106.6" height="30" class="d-seg-sys d-seg"/><rect x="310.6" y="56" width="44.7" height="30" class="d-seg-out d-seg"/></g><text x="24" y="106" class="d-nsub">メインメモリ</text><text x="204" y="106" class="d-nsub">ビデオメモリ(VRAM)</text><text x="204" y="122" class="d-nsub">重みがVRAMに収まれば速い</text><path d="M150 71 H202" class="d-path" marker-end="url(#mc-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.8s" begin="0s" repeatCount="indefinite" path="M150 71 H202"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.8s" begin="0s" repeatCount="indefinite"/></circle><path d="M202 80 H150" class="d-path" marker-end="url(#mc-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.8s" begin="0.5s" repeatCount="indefinite" path="M202 80 H150"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.8s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="8" y="148" width="384" height="106" rx="12" class="d-node" filter="url(#mc-sh)"/><circle cx="34" cy="174" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(25,165) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="58" y="179" class="d-ntitle">Apple Silicon</text><clipPath id="mc3"><rect x="24" y="196" width="352" height="30" rx="7"/></clipPath><rect x="24" y="196" width="352" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc3)"><rect x="24.0" y="196" width="63.4" height="30" class="d-seg-hist d-seg"/><rect x="87.4" y="196" width="176.0" height="30" class="d-seg-sys d-seg"/><rect x="263.4" y="196" width="59.8" height="30" class="d-seg-out d-seg"/></g><text x="24" y="242" class="d-nsub">ユニファイドメモリ(CPUとGPUで共有)</text><g class="k-n"><rect x="8" y="270" width="384" height="106" rx="12" class="d-node" filter="url(#mc-sh)"/><circle cx="34" cy="296" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(25,287) scale(.75)" class="d-ico"><path d="M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01"/></g></g><text x="58" y="301" class="d-ntitle">CPUだけ</text><clipPath id="mc4"><rect x="24" y="318" width="352" height="30" rx="7"/></clipPath><rect x="24" y="318" width="352" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc4)"><rect x="24.0" y="318" width="63.4" height="30" class="d-seg-hist d-seg"/><rect x="87.4" y="318" width="176.0" height="30" class="d-seg-sys d-seg"/><rect x="263.4" y="318" width="59.8" height="30" class="d-seg-out d-seg"/></g><text x="24" y="364" class="d-nsub">メインメモリ(動くが、GPUより遅い)</text><rect x="12" y="394" width="14" height="14" rx="4" class="d-seg-hist"/><text x="34" y="406" class="d-nsub">OS・他のアプリ</text><rect x="12" y="416" width="14" height="14" rx="4" class="d-seg-sys"/><text x="34" y="428" class="d-nsub">モデルの重み</text><rect x="12" y="438" width="14" height="14" rx="4" class="d-seg-out"/><text x="34" y="450" class="d-nsub">会話のキャッシュ(KV)</text></svg><figcaption>図2 「メモリ」が何を指すかは構成で変わる。どの構成でも、重みとキャッシュが、使える分に収まる必要がある。割合は説明用で、実際の値ではない。</figcaption></figure>

> 手元のメモリに収まるかは、アプリの[ローカルLLMのメモリ見積もり](https://paibot.app/ja/llm-memory)で試せます。パラメータ数・精度・使えるメモリを選ぶと、重みの大きさと目安の判定が出ます。

これは重みだけの値です。実際には、会話の長さに応じて増えるキャッシュ(KVキャッシュ)や、OSと他のアプリの分も必要なので、表の値より余裕を見ます。

ここでいう「メモリ」は、動かし方によって指すものが変わります。

- **GPU(NVIDIAなど)を使う場合**:ビデオメモリ(VRAM)です。重みがVRAMに収まれば速く動きます。収まらない分をメインメモリに逃がせる場合もありますが、かなり遅くなります
- **Apple Siliconの場合**:CPUとGPUが同じメモリ(ユニファイドメモリ)を共有します。ビデオメモリという別枠はなく、普通のメモリがモデルにも使われます。ただしOSなどの分もあるので、全部をモデルに使えるわけではありません
- **CPUだけで動かす場合**:メインメモリです。動きますが、GPUより遅くなります

## 量子化で小さくする

表のとおり、1パラメータあたりのビット数を減らすと、メモリは比例して小さくなります。これが量子化です。精度を落とす代わりに、同じモデルを小さなメモリで動かせます。配布されているモデルの多くは、4ビット前後に量子化したものが用意されています。

- ビット数を減らすほど軽くなるが、回答の品質は少しずつ下がる
- 小さなモデルを高い精度で動かすより、大きなモデルを4ビットで動かす方が良いことが多い、と言われる。ただしモデルと用途で変わるので、手元で比べる
- 品質の差は、使う予定のタスクで試して確かめる。一般的な数字だけで決めない

## Ollamaで動かす

手軽に始めるには、Ollamaのようなツールを使います。モデルの入手、量子化済みの形式での実行、ローカルAPIの提供をまとめて扱えます。ほかにLM Studio(画面付き)や、その土台になっているllama.cppなどがあります。

```bash コマンドの例
# モデルを取得して対話を始める(<モデル名> はOllamaのモデル一覧から選ぶ)
ollama run <モデル名>

# 取得済みのモデルを確かめる
ollama list
```

Ollamaは起動すると、手元(localhost)でAPIを待ち受けます。自分のプログラムからは、そこにHTTPで問い合わせます。最初に取得するモデルは、上の見積もりで空きメモリに収まる大きさを選びます。コマンドやAPIの詳細は変わることがあるので、公式ドキュメントで確認してください。

## 向いている用途と限界

- **向いている**:機密文書の要約や分類、オフラインでの利用、大量の下書きや整形、仕組みを学ぶための実験
- **限界**:大きなモデルほどは賢くない場合がある、長い文脈や複雑な推論は不安定になりやすい、応答速度は手元のマシンの性能に左右される
- **注意**:ローカルで動かしても、モデルは間違えます。ローカルかクラウドかにかかわらず、出力は確かめてから使います

## 始める前の確認

- [ ] 使いたいタスクは、小さめのモデルで足りる内容か
- [ ] 空きメモリに、重みとキャッシュの余裕を足した量が収まるか
- [ ] 選んだモデルのライセンスが、用途(商用利用など)を許しているか
- [ ] 保存先の容量は十分か(モデルは数GB〜数十GBある)
- [ ] 出力の品質を、自分のタスクで比べたか

大きなモデルや複数人での利用、長い文脈を扱う場合は、続編の[ローカルLLMを本格的に動かす](../local-llm-serving/)を参照してください。
