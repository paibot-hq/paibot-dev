---
title: "A look inside the Transformer: computing attention by hand"
description: "The Transformer is what computes next-token probabilities inside an LLM. See its overall structure, and compute its core, attention, in a small piece of code."
category: "ai"
tags: ["Transformer","Attention","LLM"]
minutes: 10
type: "Beginner guide"
level: "For readers of “How LLMs work”"
takeaway: "Check the structure of the part that produces next-token probabilities (the Transformer) with figures and code. The core is attention, which decides how much to look at each token."
order: 5
sources:
  - { title: "Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)", url: "https://arxiv.org/abs/1706.03762" }
  - { title: "Claude Docs — Glossary", url: "https://platform.claude.com/docs/en/about-claude/glossary" }
---

## What we look at in this article

The previous article explained that an LLM computes “the probability of each next token” and picks from it. This article looks inside the part that computes those probabilities: the Transformer. The Transformer is a structure proposed in the 2017 paper “Attention Is All You Need.” It was built around attention, without recurrence or convolutions. Many of today’s LLMs are based on this structure. However, this article does not cover the detailed internal structure of any individual model, Claude included. What it describes is the general structure shown in the paper.

> The figures and numbers are simplifications for understanding. Real models are orders of magnitude larger in layers and vector size, and the specifics vary by model. The paper proposed a configuration for translation; what is widely used for LLMs is a form close to its output side (decoder-style).

## The big picture: flowing from bottom to top

The figure below shows the flow of a typical decoder-style Transformer. The colored dots suggest data flowing from bottom to top (they are not shown if you have reduced motion enabled).

<figure class="diagram"><svg viewBox="0 0 400 576" role="img" aria-labelledby="ar-t"><title id="ar-t">Overview of a Transformer (decoder-style)</title><defs><marker id="ar-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="130" y="45.88" width="18" height="6.12" rx="2" class="d-bar"/><rect x="158" y="40.44" width="18" height="11.56" rx="2" class="d-bar"/><rect x="186" y="21.4" width="18" height="30.6" rx="2" class="d-accent"/><rect x="214" y="43.16" width="18" height="8.84" rx="2" class="d-bar"/><rect x="242" y="35" width="18" height="17" rx="2" class="d-bar"/><text x="200" y="14" class="d-small" text-anchor="middle">Next-token probabilities</text><path d="M200 72 V56" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="76" width="260" height="40" rx="8" class="d-box"/><text x="200" y="95" class="d-strong" text-anchor="middle">Softmax</text><text x="200" y="111" class="d-small" text-anchor="middle">temperature acts here</text><path d="M200 130 V118" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="134" width="260" height="40" rx="8" class="d-box"/><text x="200" y="153" class="d-strong" text-anchor="middle">Linear</text><text x="200" y="169" class="d-small" text-anchor="middle">a score for every vocabulary entry</text><path d="M200 190 V176" class="d-line" marker-end="url(#ar-a)"/><rect x="24" y="190" width="352" height="252" rx="12" class="d-dash"/><text x="366" y="208" class="d-strong" text-anchor="end">× N layers</text><rect x="70" y="214" width="260" height="36" rx="8" class="d-box"/><text x="200" y="237" class="d-strong" text-anchor="middle">Add &amp; Norm</text><path d="M200 264 V252" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="268" width="260" height="40" rx="8" class="d-box"/><text x="200" y="287" class="d-strong" text-anchor="middle">Feed-forward</text><text x="200" y="303" class="d-small" text-anchor="middle">processes each token separately</text><path d="M200 322 V310" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="326" width="260" height="36" rx="8" class="d-box"/><text x="200" y="349" class="d-strong" text-anchor="middle">Add &amp; Norm</text><path d="M200 376 V364" class="d-line" marker-end="url(#ar-a)"/><rect x="70" y="380" width="260" height="50" rx="8" class="d-accent-soft"/><text x="200" y="399" class="d-strong" text-anchor="middle">Masked self-attention</text><text x="200" y="415" class="d-small" text-anchor="middle">decides which tokens to look at</text><path d="M200 450 V432" class="d-line" marker-end="url(#ar-a)"/><path d="M200 440 H46 V344 H68" class="d-skip" marker-end="url(#ar-a)"/><path d="M200 316 H46 V232 H68" class="d-skip" marker-end="url(#ar-a)"/><text x="30" y="396" class="d-small">skip</text><text x="30" y="282" class="d-small">skip</text><rect x="70" y="458" width="260" height="44" rx="8" class="d-box"/><text x="200" y="477" class="d-strong" text-anchor="middle">Embedding + position info</text><text x="200" y="493" class="d-small" text-anchor="middle">turns tokens into vectors</text><path d="M200 530 V504" class="d-line" marker-end="url(#ar-a)"/><rect x="84" y="534" width="72" height="26" rx="13" class="d-accent-soft"/><text x="120" y="552" class="d-mono" text-anchor="middle">the</text><rect x="164" y="534" width="72" height="26" rx="13" class="d-accent-soft"/><text x="200" y="552" class="d-mono" text-anchor="middle">model</text><rect x="244" y="534" width="72" height="26" rx="13" class="d-accent-soft"/><text x="280" y="552" class="d-mono" text-anchor="middle">predicts</text><circle r="3.5" class="d-flow" opacity="0"><animateMotion dur="5.1s" begin="0s" repeatCount="indefinite" path="M200 534 V60"/><animate attributeName="opacity" dur="5.1s" begin="0s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/></circle><circle r="3.5" class="d-flow" opacity="0"><animateMotion dur="5.1s" begin="1.7s" repeatCount="indefinite" path="M200 534 V60"/><animate attributeName="opacity" dur="5.1s" begin="1.7s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/></circle><circle r="3.5" class="d-flow" opacity="0"><animateMotion dur="5.1s" begin="3.4s" repeatCount="indefinite" path="M200 534 V60"/><animate attributeName="opacity" dur="5.1s" begin="3.4s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.06;0.9;1"/></circle></svg><figcaption>Figure 1. The flow of a typical decoder-style Transformer. Data flows from the input at the bottom to the probabilities at the top. The framed part is stacked many times.</figcaption></figure>

- Turn tokens into vectors (lists of numbers): the embedding. Position information is added here too
- Attention: each token decides how much to look at each earlier token, and gathers information
- Feed-forward: process each token’s vector separately
- Add & Norm and the skip (residual) connections: add the original input back so deep stacks are easier to train
- Stack this set many times (× N layers in the figure)
- Finally, produce a score for every vocabulary entry (Linear) and turn it into probabilities with softmax. The temperature from the previous article acts on the scores before this softmax

## Tokens become vectors

Inside the model, tokens are handled as lists of numbers (vectors). Training adjusts them so that tokens used in similar ways get nearby vectors. Attention alone can’t tell the order of tokens, so position information is added too. There are several ways to represent position, and they vary by model.

## Attention: deciding which tokens to look at

The purpose of attention is to compute “which earlier tokens matter for deciding the meaning of the current token.” From each token it makes three vectors. Q (query) is “what am I looking for,” K (key) is “what do I have,” and V (value) is “what I hand over.” The calculation has four steps.

- Take the dot product of Q and K to score how well tokens match. Divide by $\sqrt{d}$ so values don’t grow too large
- Hide future tokens (the mask), so that training to predict the next token doesn’t peek at the answer
- Apply softmax to each row to make weights that sum to 1
- Add up V using the weights to get the token’s new vector

As a formula, this is:

$$
\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d}}\right)V
$$

Here $d$ is the vector dimension.

## Checking it in code

I implemented attention at a size you can follow by hand (5 tokens, 4 dimensions, 1 head). The weights are untrained random numbers, so the pattern itself means nothing. What matters is the shape of the calculation. I tried several random seeds and picked one where the differences are easy to see (a different seed gives a different pattern). You can switch between the JavaScript and Python versions of the code with the tabs. The random numbers come from the same formula, so the output is identical (we ran them on Node.js 26.1.0 and Python 3.11.5).

```js tab:"JavaScript" attention.mjs (computing attention by hand)
// Compute self-attention for a single head by hand. The weights are untrained random numbers, so the pattern itself means nothing.
const tokens = ['the', 'model', 'predicts', 'the', 'next'];
const d = 4;                                   // vector size (real models are far larger)

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

const X = matrix(tokens.length, d);            // a vector for each token (the embedding)
const Wq = matrix(d, d), Wk = matrix(d, d), Wv = matrix(d, d);
const Q = mul(X, Wq), K = mul(X, Wk), V = mul(X, Wv);

// 1. Dot each token's Q with every token's K, then divide by √d
const scores = mul(Q, transpose(K)).map(row => row.map(v => v / Math.sqrt(d)));
// 2. Hide future tokens (set the upper-right part to -∞)
const masked = scores.map((row, i) => row.map((v, j) => (j <= i ? v : -Infinity)));
// 3. Apply softmax to each row to get weights that sum to 1
const weights = masked.map(softmax);
// 4. Add up V using the weights to get each token's new vector
const output = mul(weights, V);

console.log('weights:');
weights.forEach((row, i) => console.log(tokens[i].padEnd(9), row.map(w => w.toFixed(2)).join(' ')));
console.log('row sums:', weights.map(r => r.reduce((a, b) => a + b, 0).toFixed(2)).join(' '));
console.log('output of "next":', output[4].map(v => v.toFixed(2)).join(' '));
```

```python tab:"Python" attention.py (the same calculation in Python)
# Compute self-attention for a single head by hand (the same calculation as attention.mjs, in Python).
import math

tokens = ['the', 'model', 'predicts', 'the', 'next']
d = 4                                    # vector size (real models are far larger)


def rng(seed):
    """A random number generator using the same formula as the JavaScript version: the same seed gives the same sequence."""
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


X = matrix(len(tokens), d)               # a vector for each token (the embedding)
Wq, Wk, Wv = matrix(d, d), matrix(d, d), matrix(d, d)
Q, K, V = mul(X, Wq), mul(X, Wk), mul(X, Wv)

# 1. Dot each token's Q with every token's K, then divide by √d
scores = [[v / math.sqrt(d) for v in row] for row in mul(Q, transpose(K))]
# 2. Hide future tokens (set the upper-right part to -∞)
masked = [[v if j <= i else -math.inf for j, v in enumerate(row)] for i, row in enumerate(scores)]
# 3. Apply softmax to each row to get weights that sum to 1
weights = [softmax(row) for row in masked]
# 4. Add up V using the weights to get each token's new vector
output = mul(weights, V)

print('weights:')
for token, row in zip(tokens, weights):
    print(token.ljust(9), ' '.join(f'{w:.2f}' for w in row))
print('row sums:', ' '.join(f'{sum(row):.2f}' for row in weights))
print('output of "next":', ' '.join(f'{v:.2f}' for v in output[4]))
```

## Reading the result

Running it gives the following (we ran it on Node.js 26.1.0; the seed is fixed, so every run is the same).

```text Output
weights:
the       1.00 0.00 0.00 0.00 0.00
model     0.54 0.46 0.00 0.00 0.00
predicts  0.22 0.10 0.68 0.00 0.00
the       0.21 0.27 0.29 0.23 0.00
next      0.15 0.08 0.52 0.02 0.23
row sums: 1.00 1.00 1.00 1.00 1.00
output of "next": 0.29 0.92 0.90 -0.29
```

<figure class="diagram"><svg viewBox="0 0 400 448" role="img" aria-labelledby="hm-t"><title id="hm-t">Attention weights (5 tokens × 5 tokens)</title><defs><marker id="hm-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="88" y="54" class="d-small" text-anchor="end">↓ Looking</text><text x="96" y="20" class="d-small">Being looked at →</text><text x="124" y="54" class="d-mono d-small" text-anchor="middle">the</text><text x="88" y="98" class="d-mono d-small" text-anchor="end">the</text><text x="180" y="54" class="d-mono d-small" text-anchor="middle">model</text><text x="88" y="154" class="d-mono d-small" text-anchor="end">model</text><text x="236" y="54" class="d-mono d-small" text-anchor="middle">predicts</text><text x="88" y="210" class="d-mono d-small" text-anchor="end">predicts</text><text x="292" y="54" class="d-mono d-small" text-anchor="middle">the</text><text x="88" y="266" class="d-mono d-small" text-anchor="end">the</text><text x="348" y="54" class="d-mono d-small" text-anchor="middle">next</text><text x="88" y="322" class="d-mono d-small" text-anchor="end">next</text><rect x="98" y="68" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.85"/><text x="124" y="98" class="d-mono" text-anchor="middle">1.00</text><rect x="154" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="180" y="98" class="d-small" text-anchor="middle">×</text><rect x="210" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="236" y="98" class="d-small" text-anchor="middle">×</text><rect x="266" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="292" y="98" class="d-small" text-anchor="middle">×</text><rect x="322" y="68" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="98" class="d-small" text-anchor="middle">×</text><rect x="98" y="124" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.51"/><text x="124" y="154" class="d-mono" text-anchor="middle">0.54</text><rect x="154" y="124" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.44"/><text x="180" y="154" class="d-mono" text-anchor="middle">0.46</text><rect x="210" y="124" width="52" height="52" rx="6" class="d-dash"/><text x="236" y="154" class="d-small" text-anchor="middle">×</text><rect x="266" y="124" width="52" height="52" rx="6" class="d-dash"/><text x="292" y="154" class="d-small" text-anchor="middle">×</text><rect x="322" y="124" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="154" class="d-small" text-anchor="middle">×</text><rect x="98" y="180" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.27"/><text x="124" y="210" class="d-mono" text-anchor="middle">0.22</text><rect x="154" y="180" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.18"/><text x="180" y="210" class="d-mono" text-anchor="middle">0.10</text><rect x="210" y="180" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.61"/><text x="236" y="210" class="d-mono" text-anchor="middle">0.68</text><rect x="266" y="180" width="52" height="52" rx="6" class="d-dash"/><text x="292" y="210" class="d-small" text-anchor="middle">×</text><rect x="322" y="180" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="210" class="d-small" text-anchor="middle">×</text><rect x="98" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.26"/><text x="124" y="266" class="d-mono" text-anchor="middle">0.21</text><rect x="154" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.30"/><text x="180" y="266" class="d-mono" text-anchor="middle">0.27</text><rect x="210" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.32"/><text x="236" y="266" class="d-mono" text-anchor="middle">0.29</text><rect x="266" y="236" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.27"/><text x="292" y="266" class="d-mono" text-anchor="middle">0.23</text><rect x="322" y="236" width="52" height="52" rx="6" class="d-dash"/><text x="348" y="266" class="d-small" text-anchor="middle">×</text><rect x="98" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.21"/><text x="124" y="322" class="d-mono" text-anchor="middle">0.15</text><rect x="154" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.16"/><text x="180" y="322" class="d-mono" text-anchor="middle">0.08</text><rect x="210" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.49"/><text x="236" y="322" class="d-mono" text-anchor="middle">0.52</text><rect x="266" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.12"/><text x="292" y="322" class="d-mono" text-anchor="middle">0.02</text><rect x="322" y="292" width="52" height="52" rx="6" class="d-accent" fill-opacity="0.27"/><text x="348" y="322" class="d-mono" text-anchor="middle">0.23</text><rect x="95" y="290" width="282" height="56" rx="8" class="d-outline"/><defs><linearGradient id="hm-g"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.1"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:.85"/></linearGradient></defs><rect x="96" y="372" width="140" height="12" rx="6" fill="url(#hm-g)"/><text x="96" y="400" class="d-small">0</text><text x="236" y="400" class="d-small" text-anchor="end">1</text><text x="166" y="400" class="d-small" text-anchor="middle">weight</text><rect x="96" y="416" width="16" height="16" rx="4" class="d-dash"/><text x="120" y="429" class="d-small">Future tokens (hidden)</text></svg><figcaption>Figure 2. The weights as actually computed (rows look, columns are looked at). The upper right is future tokens, which are hidden, and every row sums to 1. The outlined row (next) is examined in the next figure.</figcaption></figure>

The figure is a table of these weights. Rows are the token doing the looking, and columns are the token being looked at. Three things can be read from it.

- The upper right is all 0, because future tokens are hidden
- Each row sums to 1.00, because softmax produces the weights
- The first row is only itself (1.00), because the first token has nothing else to look at

> The weights are still random, so the weight gathering on predicts is a coincidence. In training, the matrices that make Q, K and V ($W_Q$, $W_K$, $W_V$) are adjusted so the model predicts the next token well.

## Looking closely at one row: “next”

Let’s follow the last row (next). next can look at five tokens, itself included. After the dot-product scores go through softmax, predicts gets a weight of 0.52, next itself 0.23, and the first the 0.15. Adding up V with those weights gives next’s new vector (0.29, 0.92, 0.90, -0.29).

<figure class="diagram"><svg viewBox="0 0 400 378" role="img" aria-labelledby="ra-t"><title id="ra-t">How much “next” looks at each earlier token</title><defs><marker id="ra-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="14" y="20" class="d-strong">How much “next” looks at each token</text><text x="130" y="46" class="d-small">score</text><text x="206" y="46" class="d-small">weight</text><text x="14" y="71" class="d-mono">the</text><text x="130" y="71" class="d-small d-mono">0.42</text><rect x="206" y="56" width="44.0" height="20" rx="4" class="d-bar"/><text x="256.97859559807455" y="71" class="d-small d-mono">0.15</text><text x="14" y="101" class="d-mono">model</text><text x="130" y="101" class="d-small d-mono">-0.20</text><rect x="206" y="86" width="23.5" height="20" rx="4" class="d-bar"/><text x="236.53742013918685" y="101" class="d-small d-mono">0.08</text><text x="14" y="131" class="d-mono">predicts</text><text x="130" y="131" class="d-small d-mono">1.64</text><rect x="206" y="116" width="149.5" height="20" rx="4" class="d-accent"/><text x="362.46396957577053" y="131" class="d-small d-mono">0.52</text><text x="14" y="161" class="d-mono">the</text><text x="130" y="161" class="d-small d-mono">-1.60</text><rect x="206" y="146" width="5.8" height="20" rx="4" class="d-bar"/><text x="218.8003982335043" y="161" class="d-small d-mono">0.02</text><text x="14" y="191" class="d-mono">next</text><text x="130" y="191" class="d-small d-mono">0.85</text><rect x="206" y="176" width="67.2" height="20" rx="4" class="d-bar"/><text x="280.2196164534638" y="191" class="d-small d-mono">0.23</text><path d="M200 214 V240" class="d-line" marker-end="url(#ra-a)"/><rect x="60" y="242" width="280" height="30" rx="8" class="d-box"/><text x="200" y="262" class="d-strong" text-anchor="middle">Add up V using the weights</text><path d="M200 274 V298" class="d-line" marker-end="url(#ra-a)"/><text x="14" y="320" class="d-small">New vector for “next”</text><rect x="14" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="57" y="350" class="d-mono" text-anchor="middle">0.29</text><rect x="108" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="151" y="350" class="d-mono" text-anchor="middle">0.92</text><rect x="202" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="245" y="350" class="d-mono" text-anchor="middle">0.90</text><rect x="296" y="328" width="86" height="34" rx="6" class="d-accent-soft"/><text x="339" y="350" class="d-mono" text-anchor="middle">-0.29</text></svg><figcaption>Figure 3. The calculation for the last row (next). The dot-product scores go through softmax to become weights, and adding up V with those weights gives the new vector for next. The numbers are from the code above.</figcaption></figure>

## After attention

After attention gathers information from the surroundings, feed-forward processes each token’s vector and the skip connection adds the original input back. This set is stacked many times. Real models split attention into several “heads” computed in parallel so that each can look at a different relationship; this code is one such head. After the last layer, a score for every vocabulary entry is produced from the last token’s vector. Applying softmax to those scores gives the “next-token probabilities” from the previous article. Temperature acts on the scores before that softmax.

> With this, the previous article’s description, “choose the next token by probability,” is now connected to the calculation that produces those probabilities.
