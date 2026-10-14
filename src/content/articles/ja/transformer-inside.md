---
title: "Transformerの中身をのぞく:attentionを手で計算する"
description: "LLMの中で、次のトークンの確率を計算しているTransformer。全体の構造と、中心のattentionを小さなコードで実際に計算して確かめる。"
category: "ai"
tags: ["Transformer","attention","LLM"]
minutes: 10
type: "入門ガイド"
level: "「LLMはどう動くか」を読んだ人向け"
takeaway: "LLMが次のトークンの確率を出す部分(Transformer)の構造を、図とコードで確かめます。中心は、どのトークンをどれだけ見るかを決めるattentionの計算です。"
order: 5
sources:
  - { title: "Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)", url: "https://arxiv.org/abs/1706.03762" }
  - { title: "Claude Docs — Glossary", url: "https://platform.claude.com/docs/en/about-claude/glossary" }
---

## この記事で見るもの

前の記事では、LLMは「次のトークンの確率」を計算して、そこから選ぶと説明しました。この記事では、その確率を計算している部分、Transformerの中をのぞきます。Transformerは、2017年の論文「Attention Is All You Need」で提案された構造です。再帰や畳み込みを使わず、attentionを中心に作られているのが特徴でした。現在の多くのLLMは、この構造を基にしています。ただし、Claudeを含む個々のモデルの詳細な内部構造は、この記事では扱いません。ここで説明するのは、論文で示された一般的な構造です。

> 図と数値は、仕組みを理解するための単純化です。実際のモデルは、層の数もベクトルの大きさも桁違いに大きく、具体的な値はモデルによって違います。論文の提案は翻訳向けの構成で、LLMで広く使われているのは、その出力側に近い形(デコーダー型)です。

## 全体像:下から上へ流れる

次の図は、デコーダー型の一般的なTransformerの流れです。色のついた点が、データが下から上へ流れるイメージを表します(動きを減らす設定では表示されません)。

<figure class="diagram"><svg viewBox="0 0 400 576" role="img" aria-labelledby="ar-t"><title id="ar-t">Transformer(デコーダー型)の全体像</title><defs><marker id="ar-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="130" y="45.88" width="18" height="6.12" rx="2" class="d-bar"/><rect x="158" y="40.44" width="18" height="11.56" rx="2" class="d-bar"/><rect x="186" y="21.4" width="18" height="30.6" rx="2" class="d-accent"/><rect x="214" y="43.16" width="18" height="8.84" rx="2" class="d-bar"/><rect x="242" y="35" width="18" height="17" rx="2" class="d-bar"/><text x="200" y="14" class="d-small" text-anchor="middle">次のトークンの確率</text><path d="M200 72 V56" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="76" width="260" height="40" rx="8" class="d-box"/><text x="200" y="95" class="d-strong" text-anchor="middle">Softmax</text><text x="200" y="111" class="d-small" text-anchor="middle">温度はここで効く</text><path d="M200 130 V118" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="134" width="260" height="40" rx="8" class="d-box"/><text x="200" y="153" class="d-strong" text-anchor="middle">Linear</text><text x="200" y="169" class="d-small" text-anchor="middle">語彙の数だけスコアを出す</text><path d="M200 190 V176" class="d-line" marker-end="url(#ar-a)"/><rect x="24" y="190" width="352" height="252" rx="12" class="d-dash"/><text x="366" y="208" class="d-strong" text-anchor="end">× N 層</text><rect x="70" y="214" width="260" height="36" rx="8" class="d-box"/><text x="200" y="237" class="d-strong" text-anchor="middle">足して正規化</text><path d="M200 264 V252" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="268" width="260" height="40" rx="8" class="d-box"/><text x="200" y="287" class="d-strong" text-anchor="middle">フィードフォワード</text><text x="200" y="303" class="d-small" text-anchor="middle">各トークンを別々に加工</text><path d="M200 322 V310" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="326" width="260" height="36" rx="8" class="d-box"/><text x="200" y="349" class="d-strong" text-anchor="middle">足して正規化</text><path d="M200 376 V364" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="380" width="260" height="50" rx="8" class="d-accent-soft"/><text x="200" y="399" class="d-strong" text-anchor="middle">マスク付き self-attention</text><text x="200" y="415" class="d-small" text-anchor="middle">どのトークンを見るか決めて集める</text><path d="M200 450 V432" class="d-line" marker-end="url(#ar-a)"/><path d="M200 440 H46 V344 H68" class="d-skip" marker-end="url(#ar-a)"/><path d="M200 316 H46 V232 H68" class="d-skip" marker-end="url(#ar-a)"/><text x="30" y="396" class="d-small">残差</text><text x="30" y="282" class="d-small">残差</text><rect x="70" y="458" width="260" height="44" rx="8" class="d-box"/><text x="200" y="477" class="d-strong" text-anchor="middle">埋め込み + 位置の情報</text><text x="200" y="493" class="d-small" text-anchor="middle">トークンをベクトルにする</text><path d="M200 530 V504" class="d-line" marker-end="url(#ar-a)"/><rect x="84" y="534" width="72" height="26" rx="13" class="d-accent-soft"/><text x="120" y="552" class="d-mono" text-anchor="middle">the</text><rect x="164" y="534" width="72" height="26" rx="13" class="d-accent-soft"/><text x="200" y="552" class="d-mono" text-anchor="middle">model</text><rect x="244" y="534" width="72" height="26" rx="13" class="d-accent-soft"/><text x="280" y="552" class="d-mono" text-anchor="middle">predicts</text><circle r="3.5" class="d-flow" opacity="0"><animateMotion dur="5.1s" begin="0s" repeatCount="indefinite" path="M200 534 V60"/><animate attributeName="opacity" dur="5.1s" begin="0s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/></circle><circle r="3.5" class="d-flow" opacity="0"><animateMotion dur="5.1s" begin="1.7s" repeatCount="indefinite" path="M200 534 V60"/><animate attributeName="opacity" dur="5.1s" begin="1.7s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/></circle><circle r="3.5" class="d-flow" opacity="0"><animateMotion dur="5.1s" begin="3.4s" repeatCount="indefinite" path="M200 534 V60"/><animate attributeName="opacity" dur="5.1s" begin="3.4s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/></circle></svg><figcaption>図1 一般的なTransformer(デコーダー型)の流れ。下の入力から上の確率まで、データは下から上へ流れる。枠の中を何層も重ねる。</figcaption></figure>

- トークンをベクトル(数字の並び)に直す(埋め込み)。トークンの位置の情報も、ここで加える
- attention:各トークンが、前のトークンのどれをどれだけ見るかを決めて、情報を集める
- フィードフォワード:各トークンのベクトルを、それぞれ別々に加工する
- 「足して正規化」と残差接続:元の入力を足し戻して、層を深く重ねても学習しやすくする
- この組を何層も重ねる(図の × N 層)
- 最後に、語彙の数だけスコアを出し(Linear)、softmaxで確率にする。前の記事の温度は、このsoftmaxの前のスコアに効く

## トークンは、ベクトルになる

モデルの中では、トークンは数字の並び(ベクトル)として扱われます。使われ方の似たトークンが近いベクトルになるように、学習で調整されます。attentionだけでは、トークンの並び順が分かりません。そのため、位置の情報も加えます。位置の表し方にはいくつかの方式があり、モデルによって違います。

## attention:どのトークンを見るか決める

attentionの目的は、「今のトークンの意味を決めるのに、前のトークンのどれが大事か」を、計算で決めることです。各トークンから、3つのベクトルを作ります。Q(クエリ)は「何を探しているか」、K(キー)は「何を持っているか」、V(バリュー)は「渡す中身」です。計算は次の4段階です。

- QとKの内積で、トークン同士の相性のスコアを出す。$\sqrt{d}$で割って、値が大きくなりすぎないようにする
- 未来のトークンは見えないようにする(マスク)。次のトークンを当てる学習で、答えを先に見てしまわないため
- softmaxで、行ごとに合計1の重みにする
- 重みでVを足し合わせて、そのトークンの新しいベクトルにする

これを式で書くと、次のとおりです。

$$
\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d}}\right)V
$$

ここで $d$ は、ベクトルの次元です。

## コードで確かめる

手で追える大きさ(トークン5つ、4次元、1ヘッド)で、attentionを実装しました。重みは学習前の乱数なので、パターン自体に意味はありません。見てほしいのは、計算の形です。乱数の種はいくつか試して、差が見やすいものを選びました(種を変えると、別のパターンになります)。コードは、JavaScript版とPython版をタブで切り替えて読めます。乱数も同じ式で作っているので、出力は一字一句同じです(筆者がNode.js 26.1.0とPython 3.11.5で実行して確認)。

```js tab:"JavaScript" attention.mjs(attentionを手で計算する)
// Self-attention を1ヘッド分、手で計算する。重みは学習前の乱数なので、パターン自体に意味はない。
const tokens = ['the', 'model', 'predicts', 'the', 'next'];
const d = 4;                                   // ベクトルの次元(実際のモデルは、はるかに大きい)

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(2);
const matrix = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => random() * 2 - 1));
const mul = (A, B) =>
  A.map(row => B[0].map((_, j) => row.reduce((sum, v, k) => sum + v * B[k][j], 0)));
const transpose = A => A[0].map((_, j) => A.map(row => row[j]));
const softmax = row => {
  const max = Math.max(...row);
  const exps = row.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
};

const X = matrix(tokens.length, d);            // 各トークンのベクトル(埋め込み)
const Wq = matrix(d, d), Wk = matrix(d, d), Wv = matrix(d, d);
const Q = mul(X, Wq), K = mul(X, Wk), V = mul(X, Wv);

// 1. 各トークンの Q と、すべてのトークンの K の内積を取り、√d で割る
const scores = mul(Q, transpose(K)).map(row => row.map(v => v / Math.sqrt(d)));
// 2. 未来のトークンは見えないようにする(右上を -∞ にする)
const masked = scores.map((row, i) => row.map((v, j) => (j <= i ? v : -Infinity)));
// 3. 行ごとに softmax をかけて、合計が 1 の重みにする
const weights = masked.map(softmax);
// 4. 重みで V を足し合わせて、各トークンの新しいベクトルにする
const output = mul(weights, V);

console.log('weights:');
weights.forEach((row, i) => console.log(tokens[i].padEnd(9), row.map(w => w.toFixed(2)).join(' ')));
console.log('row sums:', weights.map(r => r.reduce((a, b) => a + b, 0).toFixed(2)).join(' '));
console.log('output of "next":', output[4].map(v => v.toFixed(2)).join(' '));
```

```python tab:"Python" attention.py(同じ計算をPythonで)
# Self-attention を1ヘッド分、手で計算する(attention.mjs と同じ計算を Python で書いたもの)。
import math

tokens = ['the', 'model', 'predicts', 'the', 'next']
d = 4                                    # ベクトルの次元(実際のモデルは、はるかに大きい)


def rng(seed):
    """JavaScript版と同じ式の乱数。同じ種なら、同じ数列になる。"""
    state = seed & 0xFFFFFFFF

    def random():
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((state ^ (state >> 15)) * (1 | state)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return random


random = rng(2)


def matrix(rows, cols):
    return [[random() * 2 - 1 for _ in range(cols)] for _ in range(rows)]


def mul(A, B):
    return [[sum(a * b for a, b in zip(row, col)) for col in zip(*B)] for row in A]


def transpose(A):
    return [list(col) for col in zip(*A)]


def softmax(row):
    top = max(row)
    exps = [math.exp(v - top) for v in row]
    total = sum(exps)
    return [v / total for v in exps]


X = matrix(len(tokens), d)               # 各トークンのベクトル(埋め込み)
Wq, Wk, Wv = matrix(d, d), matrix(d, d), matrix(d, d)
Q, K, V = mul(X, Wq), mul(X, Wk), mul(X, Wv)

# 1. 各トークンの Q と、すべてのトークンの K の内積を取り、√d で割る
scores = [[v / math.sqrt(d) for v in row] for row in mul(Q, transpose(K))]
# 2. 未来のトークンは見えないようにする(右上を -∞ にする)
masked = [[v if j <= i else -math.inf for j, v in enumerate(row)] for i, row in enumerate(scores)]
# 3. 行ごとに softmax をかけて、合計が 1 の重みにする
weights = [softmax(row) for row in masked]
# 4. 重みで V を足し合わせて、各トークンの新しいベクトルにする
output = mul(weights, V)

print('weights:')
for token, row in zip(tokens, weights):
    print(token.ljust(9), ' '.join(f'{w:.2f}' for w in row))
print('row sums:', ' '.join(f'{sum(row):.2f}' for row in weights))
print('output of "next":', ' '.join(f'{v:.2f}' for v in output[4]))
```

## 結果を読む

実行すると、次の結果になります(筆者がNode.js 26.1.0で実行して確認。乱数の種が固定なので、何度実行しても同じです)。

```text 実行結果
weights:
the       1.00 0.00 0.00 0.00 0.00
model     0.54 0.46 0.00 0.00 0.00
predicts  0.22 0.10 0.68 0.00 0.00
the       0.21 0.27 0.29 0.23 0.00
next      0.15 0.08 0.52 0.02 0.23
row sums: 1.00 1.00 1.00 1.00 1.00
output of "next": 0.29 0.92 0.90 -0.29
```

<figure class="diagram"><svg viewBox="0 0 400 448" role="img" aria-labelledby="hm-t"><title id="hm-t">attentionの重み(5トークン × 5トークン)</title><defs><marker id="hm-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="88" y="54" class="d-small" text-anchor="end">↓ 見る側</text><text x="96" y="20" class="d-small">見られる側 →</text><text x="124" y="54" class="d-mono d-small" text-anchor="middle">the</text><text x="88" y="98" class="d-mono d-small" text-anchor="end">the</text><text x="180" y="54" class="d-mono d-small" text-anchor="middle">model</text><text x="88" y="154" class="d-mono d-small" text-anchor="end">model</text><text x="236" y="54" class="d-mono d-small" text-anchor="middle">predicts</text><text x="88" y="210" class="d-mono d-small" text-anchor="end">predicts</text><text x="292" y="54" class="d-mono d-small" text-anchor="middle">the</text><text x="88" y="266" class="d-mono d-small" text-anchor="end">the</text><text x="348" y="54" class="d-mono d-small" text-anchor="middle">next</text><text x="88" y="322" class="d-mono d-small" text-anchor="end">next</text><rect x="98" y="68" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.85"/><text x="124" y="98" class="d-mono" text-anchor="middle">1.00</text><rect x="154" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="180" y="98" class="d-small" text-anchor="middle">×</text><rect x="210" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="236" y="98" class="d-small" text-anchor="middle">×</text><rect x="266" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="292" y="98" class="d-small" text-anchor="middle">×</text><rect x="322" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="98" class="d-small" text-anchor="middle">×</text><rect x="98" y="124" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.51"/><text x="124" y="154" class="d-mono" text-anchor="middle">0.54</text><rect x="154" y="124" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.44"/><text x="180" y="154" class="d-mono" text-anchor="middle">0.46</text><rect x="210" y="124" width="52" height="52" rx="6" class="d-dash"/><text x="236" y="154" class="d-small" text-anchor="middle">×</text><rect x="266" y="124" width="52" height="52" rx="6" class="d-dash"/><text x="292" y="154" class="d-small" text-anchor="middle">×</text><rect x="322" y="124" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="154" class="d-small" text-anchor="middle">×</text><rect x="98" y="180" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.27"/><text x="124" y="210" class="d-mono" text-anchor="middle">0.22</text><rect x="154" y="180" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.18"/><text x="180" y="210" class="d-mono" text-anchor="middle">0.10</text><rect x="210" y="180" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.61"/><text x="236" y="210" class="d-mono" text-anchor="middle">0.68</text><rect x="266" y="180" width="52" height="52" rx="6" class="d-dash"/><text x="292" y="210" class="d-small" text-anchor="middle">×</text><rect x="322" y="180" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="210" class="d-small" text-anchor="middle">×</text><rect x="98" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.26"/><text x="124" y="266" class="d-mono" text-anchor="middle">0.21</text><rect x="154" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.30"/><text x="180" y="266" class="d-mono" text-anchor="middle">0.27</text><rect x="210" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.32"/><text x="236" y="266" class="d-mono" text-anchor="middle">0.29</text><rect x="266" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.27"/><text x="292" y="266" class="d-mono" text-anchor="middle">0.23</text><rect x="322" y="236" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="266" class="d-small" text-anchor="middle">×</text><rect x="98" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.21"/><text x="124" y="322" class="d-mono" text-anchor="middle">0.15</text><rect x="154" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.16"/><text x="180" y="322" class="d-mono" text-anchor="middle">0.08</text><rect x="210" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.49"/><text x="236" y="322" class="d-mono" text-anchor="middle">0.52</text><rect x="266" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.12"/><text x="292" y="322" class="d-mono" text-anchor="middle">0.02</text><rect x="322" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.27"/><text x="348" y="322" class="d-mono" text-anchor="middle">0.23</text><rect x="95" y="290" width="282" height="56" rx="8" class="d-outline"/><defs><linearGradient id="hm-g"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.1"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:.85"/></linearGradient></defs><rect x="96" y="372" width="140" height="12" rx="6" fill="url(#hm-g)"/><text x="96" y="400" class="d-small">0</text><text x="236" y="400" class="d-small" text-anchor="end">1</text><text x="166" y="400" class="d-small" text-anchor="middle">重み</text><rect x="96" y="416" width="16" height="16" rx="4" class="d-dash"/><text x="120" y="429" class="d-small">未来のトークン(見えない)</text></svg><figcaption>図2 実際に計算した重み(行が見る側、列が見られる側)。右上は未来のトークンなので見えず、各行の合計は1。枠で囲んだ行が、次の図で詳しく見る next の行。</figcaption></figure>

図は、この重みの表です。行が「見る側のトークン」、列が「見られる側のトークン」です。読み取れることは3つあります。

- 右上がすべて0。未来のトークンは見えないようにしてあるため
- 各行の合計が1.00。softmaxで重みにしているため
- 1行目は自分自身だけ(1.00)。最初のトークンには、見られる相手が自分しかいないため

> 重みが乱数のままなので、predictsに重みが集まっているのも偶然です。学習では、Q、K、Vを作る行列($W_Q$、$W_K$、$W_V$)が、次のトークンをうまく当てられるように調整されます。

## 「next」の1行を詳しく見る

最後の行(next)の計算を追います。nextは、自分を含む5つのトークンを見られます。内積のスコアをsoftmaxにかけると、predictsに0.52、nextの自分自身に0.23、最初のtheに0.15の重みがつきます。その重みでVを足し合わせた結果が、nextの新しいベクトル(0.29、0.92、0.90、-0.29)です。

<figure class="diagram"><svg viewBox="0 0 400 378" role="img" aria-labelledby="ra-t"><title id="ra-t">「next」が前のトークンを見る重み</title><defs><marker id="ra-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="14" y="20" class="d-strong">「next」が、どのトークンをどれだけ見るか</text><text x="130" y="46" class="d-small">内積÷√d</text><text x="206" y="46" class="d-small">重み(softmax後)</text><text x="14" y="71" class="d-mono">the</text><text x="130" y="71" class="d-small d-mono">0.42</text><rect x="206" y="56" width="44.0" height="20" rx="4" class="d-bar"/><text x="256.97859559807455" y="71" class="d-small d-mono">0.15</text><text x="14" y="101" class="d-mono">model</text><text x="130" y="101" class="d-small d-mono">-0.20</text><rect x="206" y="86" width="23.5" height="20" rx="4" class="d-bar"/><text x="236.53742013918685" y="101" class="d-small d-mono">0.08</text><text x="14" y="131" class="d-mono">predicts</text><text x="130" y="131" class="d-small d-mono">1.64</text><rect x="206" y="116" width="149.5" height="20" rx="4" class="d-accent"/><text x="362.46396957577053" y="131" class="d-small d-mono">0.52</text><text x="14" y="161" class="d-mono">the</text><text x="130" y="161" class="d-small d-mono">-1.60</text><rect x="206" y="146" width="5.8" height="20" rx="4" class="d-bar"/><text x="218.8003982335043" y="161" class="d-small d-mono">0.02</text><text x="14" y="191" class="d-mono">next</text><text x="130" y="191" class="d-small d-mono">0.85</text><rect x="206" y="176" width="67.2" height="20" rx="4" class="d-bar"/><text x="280.2196164534638" y="191" class="d-small d-mono">0.23</text><path d="M200 214 V240" class="d-line" marker-end="url(#ra-a)"/><rect x="60" y="242" width="280" height="30" rx="8" class="d-box"/><text x="200" y="262" class="d-strong" text-anchor="middle">重みでVを足し合わせる</text><path d="M200 274 V298" class="d-line" marker-end="url(#ra-a)"/><text x="14" y="320" class="d-small">nextの新しいベクトル</text><rect x="14" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="57" y="350" class="d-mono" text-anchor="middle">0.29</text><rect x="108" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="151" y="350" class="d-mono" text-anchor="middle">0.92</text><rect x="202" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="245" y="350" class="d-mono" text-anchor="middle">0.90</text><rect x="296" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="339" y="350" class="d-mono" text-anchor="middle">-0.29</text></svg><figcaption>図3 最後の行(next)の計算。内積のスコアをsoftmaxにかけて重みにし、その重みでVを足し合わせたものが、nextの新しいベクトルになる。数値は前の節のコードの結果。</figcaption></figure>

## attentionのあと

attentionで周りの情報を集めたら、フィードフォワードで各トークンのベクトルを加工し、残差接続で元の入力を足し戻します。この組を何層も重ねます。実際のモデルは、attentionを複数の「ヘッド」に分けて並列に計算し、それぞれが別の関係を見られるようにします。このコードは、そのうちの1ヘッド分です。最後の層まで進んだら、最後のトークンのベクトルから、語彙の数だけスコアを出します。それをsoftmaxにかけたものが、前の記事で見た「次のトークンの確率」です。温度は、そのsoftmaxの前のスコアに効きます。

> ここまでで、「確率で次のトークンを選ぶ」という前の記事の説明が、どの部分の計算なのかがつながりました。
