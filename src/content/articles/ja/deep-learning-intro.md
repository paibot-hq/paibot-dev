---
title: "ディープラーニング入門:データから関数を学ぶ仕組み"
description: "ニューロン、層、損失、勾配、逆伝播。小さなネットワークにXORを学ばせながら、ディープラーニングが「学ぶ」仕組みを短く整理する。"
category: "ai"
tags: ["ディープラーニング","ニューラルネットワーク","入門"]
minutes: 7
type: "入門ガイド"
level: "Pythonが読めれば十分"
takeaway: "ディープラーニングは、層を重ねた関数の重みを、予測、損失、勾配、更新の繰り返しで、データに合わせていく方法です。LLMも、この仕組みの上にあります。"
order: 3.5
sources:
  - { title: "Dive into Deep Learning", url: "https://d2l.ai/" }
---

## ディープラーニングとは

ディープラーニングは、入力から出力を作る**関数**を、データから学ぶ方法です。画像なら「写っているもの」、文章なら「次の単語」を出す関数を、人がルールを書く代わりに、例をたくさん見せて作ります。関数は、単純な計算(ニューロン)を、**層**にして何段も重ねた形をしています。この「深く重ねる」ことが、名前の由来です。

<figure class="diagram"><svg viewBox="0 0 400 304" role="img" aria-labelledby="nn-t"><title id="nn-t">ニューラルネットワークの形</title><defs><filter id="nn-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="nn-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="nn-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><path d="M60 75.0 L160 50.5" class="d-path" opacity=".35"/><path d="M60 75.0 L160 99.5" class="d-path" opacity=".35"/><path d="M60 75.0 L160 148.5" class="d-path" opacity=".35"/><path d="M60 75.0 L160 197.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 50.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 99.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 148.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 197.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 197.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 197.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 197.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 197.5" class="d-path" opacity=".35"/><path d="M240 50.5 L340 124.0" class="d-path" opacity=".35"/><path d="M240 99.5 L340 124.0" class="d-path" opacity=".35"/><path d="M240 148.5 L340 124.0" class="d-path" opacity=".35"/><path d="M240 197.5 L340 124.0" class="d-path" opacity=".35"/><g class="k-n"><circle cx="60" cy="75.0" r="12" class="d-badge"/></g><g class="k-n"><circle cx="60" cy="173.0" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="50.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="99.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="148.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="197.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="50.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="99.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="148.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="197.5" r="12" class="d-badge"/></g><g class="k-ok"><circle cx="340" cy="124.0" r="12" class="d-badge"/></g><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="0s" repeatCount="indefinite" path="M60 75.0 L160 99.5 L240 148.5 L340 124.0"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="0s" repeatCount="indefinite"/></circle><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="1.3s" repeatCount="indefinite" path="M60 173.0 L160 197.5 L240 50.5 L340 124.0"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="1.3s" repeatCount="indefinite"/></circle><text x="60" y="244" class="d-ntitle" text-anchor="middle">入力</text><text x="160" y="244" class="d-ntitle" text-anchor="middle">隠れ層</text><text x="240" y="244" class="d-ntitle" text-anchor="middle">隠れ層</text><text x="340" y="244" class="d-ntitle" text-anchor="middle">出力</text><rect x="16" y="262" width="368" height="34" rx="8" class="d-tag"/><text x="200" y="283" class="d-nsub" text-anchor="middle">1つのニューロン:出力 = 活性化(重み × 入力の合計 + バイアス)</text></svg><figcaption>図1 丸がニューロン、線が重み。層を重ねるほど「深い」ネットワークになる。学習で決まるのは、線の重みと、各ニューロンのバイアス。</figcaption></figure>

## 1つのニューロンがすること

ニューロンは、入力にそれぞれの**重み**を掛けて足し、**バイアス**を加えて、**活性化関数**に通すだけです。

- 重みとバイアスが、学習で決まる数(パラメータ)
- 活性化関数(ReLU、tanh、sigmoidなど)は、計算に「曲がり」を入れる。これがないと、何層重ねても、直線的な関数にしかならない
- 層を重ねると、前の層の出力を材料に、より複雑な特徴を組み立てられる

LLMのパラメータが「数十億」と言われるのは、この重みとバイアスの数のことです。

## 学習の流れ

学習は、次の4つの繰り返しです。

<figure class="diagram"><svg viewBox="0 0 400 216" role="img" aria-labelledby="ll-t"><title id="ll-t">学習の繰り返し</title><defs><filter id="ll-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="ll-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="ll-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-a"><rect x="12" y="16" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="36" cy="44" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(27,35) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="58" y="42" class="d-ntitle">予測</text><text x="58" y="57" class="d-nsub">順伝播で出力を出す</text><g class="k-w"><rect x="208" y="16" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="232" cy="44" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(223,35) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="254" y="42" class="d-ntitle">損失</text><text x="254" y="57" class="d-nsub">正解とのずれを数に</text><g class="k-n"><rect x="208" y="150" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="232" cy="178" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(223,169) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="254" y="176" class="d-ntitle">勾配</text><text x="254" y="191" class="d-nsub">逆伝播で向きを計算</text><g class="k-ok"><rect x="12" y="150" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="36" cy="178" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(27,169) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="58" y="176" class="d-ntitle">更新</text><text x="58" y="191" class="d-nsub">学習率の幅だけ動かす</text><path d="M194 44 H206" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M194 44 H206"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><path d="M298 74 V148" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M298 74 V148"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><path d="M206 178 H194" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M206 178 H194"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><path d="M102 148 V74" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M102 148 V74"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><text x="200" y="116" class="d-nsub" text-anchor="middle">繰り返す</text></svg><figcaption>図2 予測、損失、勾配、更新を、損失が十分に下がるまで繰り返す。1周ごとに、重みが少しずつ、正解に合う向きへ動く。</figcaption></figure>

1. **予測**:今の重みで、入力から出力を計算する(順伝播)
2. **損失**:予測と正解のずれを、1つの数にする
3. **勾配**:損失を減らすには、各重みをどちらへ、どれだけ動かせばよいかを計算する。出力側から入力側へ、順に計算するので**誤差逆伝播法**と呼ぶ
4. **更新**:勾配の逆向きに、重みを少しだけ動かす(勾配降下法)。動かす幅が**学習率**

## 小さな例:XORを学ぶ

XORは、2つの入力が違うときだけ1になる関数です。直線1本では分けられないので、隠れ層が要ります。NumPyだけで、上の4つの手順をそのまま書きました(筆者が実行した結果を載せています)。

```python xor.py
import numpy as np

# データ: XOR(2つの入力が違うときだけ1)。直線1本では分けられない
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
y = np.array([[0], [1], [1], [0]], dtype=float)

# モデル: 入力2 → 隠れ層8(tanh) → 出力1(sigmoid)
rng = np.random.default_rng(0)
W1, b1 = rng.normal(0, 1, (2, 8)), np.zeros(8)
W2, b2 = rng.normal(0, 1, (8, 1)), np.zeros(1)
sigmoid = lambda z: 1 / (1 + np.exp(-z))

lr = 0.5  # 学習率: 1回にどれだけ重みを動かすか
for epoch in range(2001):
    # 1. 予測(順伝播)
    h = np.tanh(X @ W1 + b1)
    p = sigmoid(h @ W2 + b2)
    # 2. 損失: 正解とのずれ(交差エントロピー)
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    # 3. 勾配(逆伝播): 損失を減らすには、各重みをどちらへ動かすか
    dz2 = (p - y) / len(X)
    dW2, db2 = h.T @ dz2, dz2.sum(0)
    dz1 = (dz2 @ W2.T) * (1 - h ** 2)
    dW1, db1 = X.T @ dz1, dz1.sum(0)
    # 4. 更新: 勾配の逆向きに、少しだけ動かす
    W1 -= lr * dW1; b1 -= lr * db1
    W2 -= lr * dW2; b2 -= lr * db2
    if epoch % 500 == 0:
        print(f"epoch {epoch:4d}  loss {loss:.4f}")

print("予測:", p.round(3).ravel(), "→", (p > 0.5).astype(int).ravel())
```

```text 実行結果
epoch    0  loss 0.7414
epoch  500  loss 0.0068
epoch 1000  loss 0.0029
epoch 1500  loss 0.0018
epoch 2000  loss 0.0013
予測: [0.001 0.998 0.999 0.002] → [0 1 1 0]
```

損失が下がり、4つの入力すべてで正しく答えています。なお、隠れ層を4つにすると、乱数の種によっては、途中の谷(局所解)にはまって解けないことがありました(筆者の試行では20通り中1通り)。層を少し広げると、安定しました。

実際には、PyTorchなどのライブラリが、勾配の計算(自動微分)とGPUでの計算を引き受けます。書くのは、モデルの形と、損失と、学習の繰り返しです。

## よく出る言葉

| 言葉 | 意味 |
| --- | --- |
| エポック | 学習データを、ひととおり使った回数 |
| バッチ | 1回の更新に使う、データのかたまり |
| 学習率 | 1回の更新で、重みを動かす幅。大きすぎると発散し、小さすぎると進まない |
| 検証データ | 学習に使わない、確認用のデータ |
| 過学習 | 学習データにだけ合いすぎて、新しいデータで外れる状態 |
| 推論 | 学習済みの重みで、予測だけをすること |

## 過学習を防ぐ

- **データを分ける**:学習用と検証用に分け、検証の成績で判断する
- **早めに止める**:検証の損失が下がらなくなったら、学習を止める
- **データを増やす、モデルを小さくする**:データに対して、モデルが大きすぎないかを見る

## LLMとのつながり

LLMも、同じ仕組みです。ただし、層の作り方にTransformerを使い、膨大な文章で「次のトークンの予測」を学習しています。続きは、[LLMはどう動くか](../llm-how-it-works/)と、[Transformerの中身](../transformer-inside/)で扱います。
