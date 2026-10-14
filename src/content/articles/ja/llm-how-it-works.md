---
title: "LLMはどう動くか:次のトークンを予測する仕組み"
description: "トークン、確率、温度、コンテキストウィンドウ。おもちゃのモデルを動かしながら、LLMが答えを作る流れと、間違える理由を整理する。"
category: "ai"
tags: ["LLM","トークン","基礎"]
minutes: 9
type: "入門ガイド"
level: "JavaScriptが読めれば十分"
takeaway: "LLMは「次のトークンを確率で選ぶ」ことを繰り返して文章を作ります。この仕組みから、温度、コンテキスト、間違い方の理由が説明できます。"
order: 4
sources:
  - { title: "Claude Docs — Glossary", url: "https://platform.claude.com/docs/en/about-claude/glossary" }
  - { title: "Claude Docs — Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows" }
  - { title: "Claude Docs — Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" }
---

## LLMがしていること

大規模言語モデル(LLM)は、大量のテキストで学習した、パラメータの多い言語モデルです。土台になる事前学習では、文書の中で「これまでの文脈から、次の単語を予測する」ことを学びます。事前学習しただけのモデルは、質問に答えたり指示に従ったりするのが得意ではありません。そこで、追加のデータでさらに学習するファインチューニングや、人間の好みに沿わせるRLHFで、アシスタントとして使いやすく整えます。Claudeもこの流れで作られています(公式の用語集による)。この記事は、2026年10月時点の公式ドキュメントに基づきます。

> 以下は仕組みを理解するための単純化です。実際のモデルの内部構造は、この記事では扱いません。

## トークン:文字でも単語でもない単位

モデルは、文字や単語そのものではなく、トークンという単位で文章を扱います。トークンは単語、単語の一部、文字、バイトなどに対応し、1トークンが何文字にあたるかは、モデルと言語によって変わります。公式の用語集によると、Claude 4.7以降のモデルは新しいトークナイザーを使い、同じ文章でも以前のモデルより約30%多くのトークンになります。正確な数は、使うモデルでトークン数を数えるAPIで確かめます。手元の計算では数えられないので、この記事では日本語や英語の具体的なトークン数を載せません。

- 料金は、入力と出力のトークン数で決まる
- コンテキストウィンドウの大きさも、トークンで数える
- 同じ内容でも、言語によってトークン数が違う

## 次の1語を、確率で選ぶ

LLMは、これまでのトークンを入力にして「次に来るトークンの確率」を計算し、そこから1つを選びます。選んだトークンを足して、また次を計算する。この繰り返しで文章ができます。形だけを確かめるために、直前の1語だけから次の語を予測する、おもちゃのモデルを書きました。短い文章で「ある語の次に、どの語が何回続いたか」を数え、それを確率にします。実際のLLMは、直前の1語だけでなく文脈全体を使って確率を計算します。ここでの学習は、数えているだけです。コードは、JavaScript版とPython版をタブで切り替えて読めます。どちらも同じ乱数の式を使っているので、出力は一字一句同じです(筆者がNode.js 26.1.0とPython 3.11.5で実行して確認)。

<figure class="diagram"><svg viewBox="0 0 400 280" role="img" aria-labelledby="lp-t"><title id="lp-t">トークンを1つずつ足して文章を作る流れ</title><defs><marker id="lp-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="10" width="270" height="46" rx="8" class="d-box"/><circle cx="44" cy="33" r="11" class="d-accent"/><text x="44" y="37.5" class="d-white" text-anchor="middle">1</text><text x="66" y="38" class="d-strong">これまでのトークン</text><path d="M155 58 V80" class="d-line" marker-end="url(#lp-a)"/><rect x="20" y="82" width="270" height="46" rx="8" class="d-box"/><circle cx="44" cy="105" r="11" class="d-accent"/><text x="44" y="109.5" class="d-white" text-anchor="middle">2</text><text x="66" y="110" class="d-strong">次のトークンの確率を計算</text><path d="M155 130 V152" class="d-line" marker-end="url(#lp-a)"/><rect x="20" y="154" width="270" height="46" rx="8" class="d-box"/><circle cx="44" cy="177" r="11" class="d-accent"/><text x="44" y="181.5" class="d-white" text-anchor="middle">3</text><text x="66" y="182" class="d-strong">温度で偏りを調整して1つ選ぶ</text><path d="M155 202 V224" class="d-line" marker-end="url(#lp-a)"/><rect x="20" y="226" width="270" height="46" rx="8" class="d-accent-soft"/><circle cx="44" cy="249" r="11" class="d-accent"/><text x="44" y="253.5" class="d-white" text-anchor="middle">4</text><text x="66" y="254" class="d-strong">選んだトークンを末尾に足す</text><path d="M290 249 H340 V33 H294" class="d-line" marker-end="url(#lp-a)"/><text x="348" y="145" class="d-small">繰り返す</text></svg><figcaption>図1 LLMは、これまでのトークンから次のトークンを選び、末尾に足す、という繰り返しで文章を作る。</figcaption></figure>

```js tab:"JavaScript" toy.mjs(次の単語を予測するおもちゃのモデル)
// 次の単語を「直前の1語」だけから予測する、おもちゃの言語モデル。
const corpus = `
the model reads the text and predicts the next token .
the model predicts the next word from the context .
the context holds the text the model can see .
the answer looks plausible and the answer can be wrong .
the next token is chosen from a list of probabilities .
`.trim().split(/\s+/);

// 1. 学習: 「ある単語の次に、どの単語が何回続いたか」を数える
const counts = new Map();
for (let i = 0; i < corpus.length - 1; i++) {
  const [a, b] = [corpus[i], corpus[i + 1]];
  if (!counts.has(a)) counts.set(a, new Map());
  counts.get(a).set(b, (counts.get(a).get(b) ?? 0) + 1);
}

// 2. 確率: 回数を、温度付きの確率に直す(温度が低いほど、一番多い単語に集中する)
function probabilities(word, temperature = 1) {
  const next = [...counts.get(word)];
  const weights = next.map(([, n]) => Math.pow(n, 1 / temperature));
  const total = weights.reduce((s, w) => s + w, 0);
  return next.map(([w], i) => [w, weights[i] / total]);
}

// 3. 生成: 確率に従って次の単語を引く。乱数は固定の種で、何度実行しても同じ結果になる
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function generate(start, temperature, seed, length = 12) {
  const random = rng(seed);
  const out = [start];
  while (out.length < length && counts.has(out.at(-1))) {
    let r = random();
    for (const [w, p] of probabilities(out.at(-1), temperature)) {
      if ((r -= p) <= 0) { out.push(w); break; }
    }
  }
  return out.join(' ');
}

for (const t of [0.5, 1, 2]) {
  console.log(`温度 ${t}:`, probabilities('the', t).map(([w, p]) => `${w} ${(p * 100).toFixed(1)}%`).join(', '));
}
// 「the」の次に、最頻の単語(model か next)が選ばれる割合を、2000回の抽選で確かめる
for (const t of [0.2, 1, 3]) {
  const random = rng(42);
  let top = 0;
  for (let i = 0; i < 2000; i++) {
    let r = random();
    for (const [w, p] of probabilities('the', t)) {
      if ((r -= p) <= 0) {
        if (w === 'model' || w === 'next') top++;
        break;
      }
    }
  }
  console.log(`温度 ${t}: 最頻の単語が選ばれた割合 ${(top / 20).toFixed(2)}%`);
}
console.log('例(温度0.2):', generate('the', 0.2, 1));
console.log('例(温度3):', generate('the', 3, 1));
```

```python tab:"Python" toy.py(同じ計算をPythonで)
# 次の単語を「直前の1語」だけから予測する、おもちゃの言語モデル(toy.mjs と同じ計算を Python で書いたもの)。
corpus = """
the model reads the text and predicts the next token .
the model predicts the next word from the context .
the context holds the text the model can see .
the answer looks plausible and the answer can be wrong .
the next token is chosen from a list of probabilities .
""".split()

# 1. 学習: 「ある単語の次に、どの単語が何回続いたか」を数える
counts = {}
for a, b in zip(corpus, corpus[1:]):
    counts.setdefault(a, {})
    counts[a][b] = counts[a].get(b, 0) + 1


# 2. 確率: 回数を、温度付きの確率に直す(温度が低いほど、一番多い単語に集中する)
def probabilities(word, temperature=1):
    words = list(counts[word].items())
    weights = [n ** (1 / temperature) for _, n in words]
    total = sum(weights)
    return [(w, weight / total) for (w, _), weight in zip(words, weights)]


# 3. 生成: 確率に従って次の単語を引く。乱数は固定の種で、何度実行しても同じ結果になる
def rng(seed):
    state = seed & 0xFFFFFFFF

    def random():
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((state ^ (state >> 15)) * (1 | state)) & 0xFFFFFFFF
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return random


def generate(start, temperature, seed, length=12):
    random = rng(seed)
    out = [start]
    while len(out) < length and out[-1] in counts:
        r = random()
        for w, p in probabilities(out[-1], temperature):
            r -= p
            if r <= 0:
                out.append(w)
                break
    return ' '.join(out)


for t in [0.5, 1, 2]:
    print(f'温度 {t}:', ', '.join(f'{w} {p * 100:.1f}%' for w, p in probabilities('the', t)))

# 「the」の次に、最頻の単語(model か next)が選ばれる割合を、2000回の抽選で確かめる
for t in [0.2, 1, 3]:
    random = rng(42)
    top = 0
    for _ in range(2000):
        r = random()
        for w, p in probabilities('the', t):
            r -= p
            if r <= 0:
                if w in ('model', 'next'):
                    top += 1
                break
    print(f'温度 {t}: 最頻の単語が選ばれた割合 {top / 20:.2f}%')
print('例(温度0.2):', generate('the', 0.2, 1))
print('例(温度3):', generate('the', 3, 1))
```

<figure class="diagram"><svg viewBox="0 0 400 350" role="img" aria-labelledby="tr-t"><title id="tr-t">2回分の生成の実例</title><defs><marker id="tr-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="10" y="8" width="380" height="152" rx="8" class="d-box"/><text x="24" y="32" class="d-strong">1回目</text><text x="86" y="32" class="d-small">入力:</text><text x="130" y="32" class="d-mono d-strong">the</text><text x="24" y="52" class="d-small">次の語の確率</text><text x="24" y="74" class="d-mono">model</text><rect x="100" y="62" width="85.0" height="15" rx="3" class="d-accent"/><text x="192" y="74" class="d-small">25.0%</text><text x="376" y="74" class="d-small d-strong" text-anchor="end">← 選ばれた</text><text x="24" y="94" class="d-mono">next</text><rect x="100" y="82" width="85.0" height="15" rx="3" class="d-bar"/><text x="192" y="94" class="d-small">25.0%</text><text x="24" y="114" class="d-mono">answer</text><rect x="100" y="102" width="56.7" height="15" rx="3" class="d-bar"/><text x="163.66666666666666" y="114" class="d-small">16.7%</text><text x="24" y="134" class="d-mono">context</text><rect x="100" y="122" width="56.7" height="15" rx="3" class="d-bar"/><text x="163.66666666666666" y="134" class="d-small">16.7%</text><text x="24" y="154" class="d-mono">text</text><rect x="100" y="142" width="56.7" height="15" rx="3" class="d-bar"/><text x="163.66666666666666" y="154" class="d-small">16.7%</text><path d="M200 162 V201" class="d-line" marker-end="url(#tr-a)"/><text x="212" y="187" class="d-small">選んだ語を足して、次の入力にする</text><rect x="10" y="204" width="380" height="112" rx="8" class="d-box"/><text x="24" y="228" class="d-strong">2回目</text><text x="86" y="228" class="d-small">入力:</text><text x="130" y="228" class="d-mono d-strong">the model</text><text x="24" y="248" class="d-small">次の語の確率</text><text x="24" y="270" class="d-mono">can</text><rect x="100" y="258" width="113.3" height="15" rx="3" class="d-bar"/><text x="220.33333333333331" y="270" class="d-small">33.3%</text><text x="24" y="290" class="d-mono">predicts</text><rect x="100" y="278" width="113.3" height="15" rx="3" class="d-accent"/><text x="220.33333333333331" y="290" class="d-small">33.3%</text><text x="376" y="290" class="d-small d-strong" text-anchor="end">← 選ばれた</text><text x="24" y="310" class="d-mono">reads</text><rect x="100" y="298" width="113.3" height="15" rx="3" class="d-bar"/><text x="220.33333333333331" y="310" class="d-small">33.3%</text><text x="200" y="338" class="d-small" text-anchor="middle">これを繰り返して、文章になる</text></svg><figcaption>図2 記事のおもちゃのモデルの、実際の確率。どの語が選ばれるかは確率で決まるので、毎回同じとは限らない(この例では model、predicts が選ばれた)。</figcaption></figure>

## 温度:選び方の偏りを調整する

上のコードを実行すると、次の結果になります(筆者がNode.js 26.1.0で実行して確認。乱数の種を固定してあるので、何度実行しても同じ結果です)。

```text 実行結果
温度 0.5: model 30.0%, text 13.3%, next 30.0%, context 13.3%, answer 13.3%
温度 1: model 25.0%, text 16.7%, next 25.0%, context 16.7%, answer 16.7%
温度 2: model 22.5%, text 18.4%, next 22.5%, context 18.4%, answer 18.4%
温度 0.2: 最頻の単語が選ばれた割合 83.30%
温度 1: 最頻の単語が選ばれた割合 51.25%
温度 3: 最頻の単語が選ばれた割合 43.85%
例(温度0.2): the next token is chosen from the next token . the text
例(温度3): the context . the answer can see . the next word from
```

<figure class="diagram"><svg viewBox="0 0 400 448" role="img" aria-labelledby="bt-t"><title id="bt-t">温度ごとの、「the」の次の単語の確率</title><defs><marker id="bt-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="10" y="24" class="d-strong">温度 0.5</text><text x="390" y="24" class="d-small" text-anchor="end">多い語に集まる</text><text x="10" y="48" class="d-mono">model</text><rect x="84" y="36" width="180.0" height="15" rx="3" class="d-accent"/><text x="271" y="48" class="d-small">30.0%</text><text x="10" y="70" class="d-mono">text</text><rect x="84" y="58" width="80.0" height="15" rx="3" class="d-bar"/><text x="171" y="70" class="d-small">13.3%</text><text x="10" y="92" class="d-mono">next</text><rect x="84" y="80" width="180.0" height="15" rx="3" class="d-accent"/><text x="271" y="92" class="d-small">30.0%</text><text x="10" y="114" class="d-mono">context</text><rect x="84" y="102" width="80.0" height="15" rx="3" class="d-bar"/><text x="171" y="114" class="d-small">13.3%</text><text x="10" y="136" class="d-mono">answer</text><rect x="84" y="124" width="80.0" height="15" rx="3" class="d-bar"/><text x="171" y="136" class="d-small">13.3%</text><text x="10" y="164" class="d-strong">温度 1</text><text x="390" y="164" class="d-small" text-anchor="end">回数どおり</text><text x="10" y="188" class="d-mono">model</text><rect x="84" y="176" width="150.0" height="15" rx="3" class="d-accent"/><text x="241" y="188" class="d-small">25.0%</text><text x="10" y="210" class="d-mono">text</text><rect x="84" y="198" width="100.0" height="15" rx="3" class="d-bar"/><text x="191" y="210" class="d-small">16.7%</text><text x="10" y="232" class="d-mono">next</text><rect x="84" y="220" width="150.0" height="15" rx="3" class="d-accent"/><text x="241" y="232" class="d-small">25.0%</text><text x="10" y="254" class="d-mono">context</text><rect x="84" y="242" width="100.0" height="15" rx="3" class="d-bar"/><text x="191" y="254" class="d-small">16.7%</text><text x="10" y="276" class="d-mono">answer</text><rect x="84" y="264" width="100.0" height="15" rx="3" class="d-bar"/><text x="191" y="276" class="d-small">16.7%</text><text x="10" y="304" class="d-strong">温度 2</text><text x="390" y="304" class="d-small" text-anchor="end">差が縮まる</text><text x="10" y="328" class="d-mono">model</text><rect x="84" y="316" width="134.8" height="15" rx="3" class="d-accent"/><text x="225.84692283495343" y="328" class="d-small">22.5%</text><text x="10" y="350" class="d-mono">text</text><rect x="84" y="338" width="110.1" height="15" rx="3" class="d-bar"/><text x="201.1020514433644" y="350" class="d-small">18.4%</text><text x="10" y="372" class="d-mono">next</text><rect x="84" y="360" width="134.8" height="15" rx="3" class="d-accent"/><text x="225.84692283495343" y="372" class="d-small">22.5%</text><text x="10" y="394" class="d-mono">context</text><rect x="84" y="382" width="110.1" height="15" rx="3" class="d-bar"/><text x="201.1020514433644" y="394" class="d-small">18.4%</text><text x="10" y="416" class="d-mono">answer</text><rect x="84" y="404" width="110.1" height="15" rx="3" class="d-bar"/><text x="201.1020514433644" y="416" class="d-small">18.4%</text><text x="10" y="438" class="d-small">濃い色:最も多い語(model と next)</text></svg><figcaption>図3 「the」の次の単語の確率(本文の実行結果と同じ数値)。温度を下げると多い語に集まり、上げると差が縮まる。</figcaption></figure>

「the」の次は、modelとnextが各3回、残りが各2回です。温度1では、回数どおりの確率(25%と16.7%)になります。温度を下げると、多い語に確率が集まります(温度0.5で30%)。温度を上げると、差が縮まります(温度2で22.5%)。2000回の抽選で、最頻の語が選ばれた割合は、温度0.2で83.30%、温度1で51.25%、温度3で43.85%でした。理論値(83.5%、50.0%、43.3%)に近い値です。公式の用語集の説明も同じ向きで、温度が高いほど多様な出力になり、低いほど最も確からしい語に寄ります。生成例では、温度0.2は元の文章をほぼなぞり、温度3は元にない組み合わせ(the answer can see)が出ました。

> 温度を0にしても、APIの結果が完全に同じになるとは限りません。同じ入力でも、呼び出しごとに出力が変わることがあります(公式の用語集)。

## 温度を、動かして確かめる

スライダーを動かすと、「the」の次の単語の確率が、記事のおもちゃのモデルと同じ式で、その場で計算されます。サイコロを振ると、実際の出方も見られます。振った回数が増えるほど、出方が理論値に近づきます。

<div class="widget" data-widget="temperature"><p class="lab-small">この部品は、JavaScriptが必要です。</p></div>

## コンテキストウィンドウ:作業用の記憶

コンテキストウィンドウは、モデルが応答を作るときに参照できるテキスト全体で、いわば「作業用の記憶」です。学習に使った大量のデータとは別のものです。ここには、システムプロンプト、これまでのすべてのメッセージ、ツールの結果、画像や文書が入り、モデルが生成する出力も含まれます。会話が進むほど、前のやり取りがすべて積み重なります。大きさはモデルによって違い、2026年10月時点のドキュメントでは、多くの現行モデルが100万トークン、それ以外は20万トークンです。

<figure class="diagram"><svg viewBox="0 0 400 300" role="img" aria-labelledby="cw-t"><title id="cw-t">コンテキストウィンドウの中身と、会話が進んだときの変化</title><defs><marker id="cw-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="10" y="16" class="d-strong">最初のやり取り</text><text x="390" y="16" class="d-small" text-anchor="end">上限 |</text><clipPath id="cw-c1"><rect x="10" y="24" width="380" height="34" rx="6"/></clipPath><g clip-path="url(#cw-c1)"><rect x="10.0" y="24" width="38.0" height="34" class="d-seg-sys"/><rect x="48.0" y="24" width="15.2" height="34" class="d-seg-hist"/><rect x="63.2" y="24" width="30.4" height="34" class="d-seg-out"/></g><rect x="10" y="24" width="380" height="34" rx="6" class="d-plain"/><text x="10" y="92" class="d-strong">会話が進んだあと</text><clipPath id="cw-c2"><rect x="10" y="100" width="380" height="34" rx="6"/></clipPath><g clip-path="url(#cw-c2)"><rect x="10.0" y="100" width="38.0" height="34" class="d-seg-sys"/><rect x="48.0" y="100" width="190.0" height="34" class="d-seg-hist"/><rect x="238.0" y="100" width="83.6" height="34" class="d-seg-tool"/><rect x="321.6" y="100" width="30.4" height="34" class="d-seg-out"/></g><rect x="10" y="100" width="380" height="34" rx="6" class="d-plain"/><rect x="10" y="164" width="14" height="14" rx="3" class="d-seg-sys"/><text x="34" y="176">システムプロンプトとツールの定義</text><rect x="10" y="190" width="14" height="14" rx="3" class="d-seg-hist"/><text x="34" y="202">これまでの会話(すべての発言)</text><rect x="10" y="216" width="14" height="14" rx="3" class="d-seg-tool"/><text x="34" y="228">ツールの結果、画像、文書</text><rect x="10" y="242" width="14" height="14" rx="3" class="d-seg-out"/><text x="34" y="254">今回の出力(これも数える)</text><rect x="10" y="268" width="14" height="14" rx="3" class="d-dash"/><text x="34" y="280">空き(なくなると上限に達する)</text></svg><figcaption>図4 コンテキストウィンドウには、入力だけでなく出力も入る。会話が進むほど履歴が積み重なり、空きが減る。割合は説明用の概念図で、実際の値ではない。</figcaption></figure>

- 大きければ良いとは限らない。トークンが増えるほど精度と再現率が下がる「コンテキストロット」が起きる(公式)
- 入力だけで上限を超えると、APIは400エラー(prompt is too long)を返す
- Claude 4.5以降のモデルでは、入力とmax\_tokensの合計が上限を超えても受け付け、生成が上限に達した時点で止まる(stop\_reason: model\_context\_window\_exceeded)

> Claude Codeで、長い作業のあとに指示が守られにくくなるのは、このためかもしれません。必要なものだけを文脈に残す(新しいセッションにする、調査を別の文脈に逃がす)のが対策です。

## なぜ間違えるのか

LLMは、事実を調べて答えているのではなく、文脈に続く確からしいトークンを選んでいます。そのため、もっともらしいのに事実と違う文章(ハルシネーション)が出ることがあります。公式は、どれほど進んだモデルでも起こりうるとしています。おもちゃのモデルでも、元の文章にない組み合わせが、確率どおりに出ました。仕組みとして、起こりうることです。公式が挙げる軽減策は、次のとおりです。

- 分からないときは「分からない」と言ってよいと、はっきり伝える
- 長い文書では、先に原文の引用を抜き出させて、その引用だけを根拠に答えさせる
- 主張ごとに、根拠になる引用を探させる。見つからなければ撤回させる
- 同じ質問を複数回して、答えのずれを見る(Best-of-N)
- 提供した文書の情報だけを使うよう指示する

> これらで大きく減らせますが、なくせるわけではありません。重要な情報は、必ず自分で確かめてください(公式)。

## 仕組みから、使い方を決める

ここまでの仕組みから、使い方の原則が出てきます。

- 必要な情報は、文脈に入れる。モデルが知っているはずと決めつけない(学習データと文脈は別)
- 貼った情報は文脈に入る。秘密のキーや個人情報は、取り除いてから共有する
- 同じ依頼でも、答えは変わりうる。結果は毎回確かめる
- 長い会話は、品質が落ちる前に区切る

> 具体的な使い方は、Claude Codeの記事(始め方、CLAUDE.md、権限、ワークフロー)で扱っています。

## おもちゃのモデルとの違い

確率で次を選ぶ、温度で偏りを変える、という形は、実際のLLMと同じです。違うのは、確率の計算です。

|  | このおもちゃのモデル | 実際のLLM |
| --- | --- | --- |
| 次の予測に使う情報 | 直前の1語だけ | 文脈全体 |
| 学習 | 回数を数えるだけ | 大量のテキストで事前学習し、ファインチューニングとRLHFで調整 |
| 扱う単位 | 学習文に出た語だけ | トークン(単語の一部や文字も含む) |
| 知らない語 | 扱えない(確率がない) | 小さなトークンの組み合わせで扱える(公式の用語集) |

> 確率を計算している部分の中身は、[Transformerの中身をのぞく](/ja/articles/transformer-inside/)で、図とコードで確かめています。
