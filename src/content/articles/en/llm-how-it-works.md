---
title: "How LLMs work: predicting the next token"
description: "Tokens, probabilities, temperature and the context window. Run a toy model to see how an LLM builds an answer, and why it gets things wrong."
category: "ai"
tags: ["LLM","Tokens","Fundamentals"]
minutes: 9
type: "Beginner guide"
level: "Enough if you can read JavaScript"
takeaway: "An LLM builds text by choosing the next token by probability, over and over. That explains temperature, context, and the way it goes wrong."
order: 4
sources:
  - { title: "Claude Docs — Glossary", url: "https://platform.claude.com/docs/en/about-claude/glossary" }
  - { title: "Claude Docs — Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows" }
  - { title: "Claude Docs — Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" }
---

## What an LLM does

A large language model (LLM) is a language model with many parameters, trained on vast amounts of text. In pretraining, the foundation, it learns to predict the next word from the context so far in a document. A model that has only been pretrained isn’t good at answering questions or following instructions. So it is refined with fine-tuning (further training on additional data) and RLHF (training to match human preferences) to make it a usable assistant. Claude is built this way (per the official glossary). This article is based on the official documentation as of October 2026.

> What follows is a simplification for understanding. We do not cover the internal structure of real models here.

## Tokens: a unit that is neither a character nor a word

A model handles text not as characters or words themselves but as tokens. A token can correspond to a word, part of a word, a character, or a byte, and how many characters one token represents depends on the model and the language. According to the official glossary, Claude 4.7 and later models use a newer tokenizer that produces about 30% more tokens for the same text than earlier models. Exact counts come from the token counting API with the model you plan to use. We can’t count tokens in a local calculation, so this article gives no concrete token counts for Japanese or English.

- Pricing is based on input and output token counts
- The size of the context window is also counted in tokens
- The same content produces different token counts in different languages

## Choosing the next word by probability

An LLM takes the tokens so far as input, computes “the probability of each possible next token,” and picks one. It appends that token and computes the next one again. Repeating this produces text. To check just the shape of it, I wrote a toy model that predicts the next word from only the previous word. It counts which words followed which in a short text and turns the counts into probabilities. A real LLM uses the whole context, not only the previous word. The “training” here is just counting. You can switch between the JavaScript and Python versions of the code with the tabs. Both use the same random-number formula, so the output is identical (we ran them on Node.js 26.1.0 and Python 3.11.5).

<figure class="diagram"><svg viewBox="0 0 400 280" role="img" aria-labelledby="lp-t"><title id="lp-t">How text is built one token at a time</title><defs><marker id="lp-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="10" width="270" height="46" rx="8" class="d-box"/><circle cx="44" cy="33" r="11" class="d-accent"/><text x="44" y="37.5" class="d-white" text-anchor="middle">1</text><text x="66" y="38" class="d-strong">Tokens so far</text><path d="M155 58 V80" class="d-line" marker-end="url(#lp-a)"/><rect x="20" y="82" width="270" height="46" rx="8" class="d-box"/><circle cx="44" cy="105" r="11" class="d-accent"/><text x="44" y="109.5" class="d-white" text-anchor="middle">2</text><text x="66" y="110" class="d-strong">Probability of each next token</text><path d="M155 130 V152" class="d-line" marker-end="url(#lp-a)"/><rect x="20" y="154" width="270" height="46" rx="8" class="d-box"/><circle cx="44" cy="177" r="11" class="d-accent"/><text x="44" y="181.5" class="d-white" text-anchor="middle">3</text><text x="66" y="182" class="d-strong">Pick one, shaped by temperature</text><path d="M155 202 V224" class="d-line" marker-end="url(#lp-a)"/><rect x="20" y="226" width="270" height="46" rx="8" class="d-accent-soft"/><circle cx="44" cy="249" r="11" class="d-accent"/><text x="44" y="253.5" class="d-white" text-anchor="middle">4</text><text x="66" y="254" class="d-strong">Append it to the end</text><path d="M290 249 H340 V33 H294" class="d-line" marker-end="url(#lp-a)"/><text x="348" y="145" class="d-small">repeat</text></svg><figcaption>Figure 1. An LLM builds text by repeatedly choosing the next token from the tokens so far and appending it.</figcaption></figure>

```js tab:"JavaScript" toy.mjs (a toy next-word model)
// A toy language model that predicts the next word from only the previous word.
const corpus = `
the model reads the text and predicts the next token .
the model predicts the next word from the context .
the context holds the text the model can see .
the answer looks plausible and the answer can be wrong .
the next token is chosen from a list of probabilities .
`.trim().split(/\s+/);

// 1. Training: count how many times each word followed each other word
const counts = new Map();
for (let i = 0; i < corpus.length - 1; i++) {
  const [a, b] = [corpus[i], corpus[i + 1]];
  if (!counts.has(a)) counts.set(a, new Map());
  counts.get(a).set(b, (counts.get(a).get(b) ?? 0) + 1);
}

// 2. Probabilities: turn counts into probabilities with a temperature (lower temperature concentrates on the most frequent words)
function probabilities(word, temperature = 1) {
  const next = [...counts.get(word)];
  const weights = next.map(([, n]) => Math.pow(n, 1 / temperature));
  const total = weights.reduce((s, w) => s + w, 0);
  return next.map(([w], i) => [w, weights[i] / total]);
}

// 3. Generation: draw the next word by probability. The random seed is fixed, so every run gives the same result
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
  console.log(`Temperature ${t}:`, probabilities('the', t).map(([w, p]) => `${w} ${(p * 100).toFixed(1)}%`).join(', '));
}
// How often is the most frequent word after "the" (model or next) chosen, over 2000 draws?
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
  console.log(`Temperature ${t}: share of draws that picked a most-frequent word ${(top / 20).toFixed(2)}%`);
}
console.log('Example (temperature 0.2):', generate('the', 0.2, 1));
console.log('Example (temperature 3):', generate('the', 3, 1));
```

```python tab:"Python" toy.py (the same calculation in Python)
# A toy language model that predicts the next word from only the previous word (the same calculation as toy.mjs, in Python).
corpus = """
the model reads the text and predicts the next token .
the model predicts the next word from the context .
the context holds the text the model can see .
the answer looks plausible and the answer can be wrong .
the next token is chosen from a list of probabilities .
""".split()

# 1. Training: count how many times each word followed each other word
counts = {}
for a, b in zip(corpus, corpus[1:]):
    counts.setdefault(a, {})
    counts[a][b] = counts[a].get(b, 0) + 1


# 2. Probabilities: turn counts into probabilities with a temperature (lower temperature concentrates on the most frequent words)
def probabilities(word, temperature=1):
    words = list(counts[word].items())
    weights = [n ** (1 / temperature) for _, n in words]
    total = sum(weights)
    return [(w, weight / total) for (w, _), weight in zip(words, weights)]


# 3. Generation: draw the next word by probability. The random seed is fixed, so every run gives the same result
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
    print(f'Temperature {t}:', ', '.join(f'{w} {p * 100:.1f}%' for w, p in probabilities('the', t)))

# How often is the most frequent word after "the" (model or next) chosen, over 2000 draws?
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
    print(f'Temperature {t}: share of draws that picked a most-frequent word {top / 20:.2f}%')
print('Example (temperature 0.2):', generate('the', 0.2, 1))
print('Example (temperature 3):', generate('the', 3, 1))
```

<figure class="diagram"><svg viewBox="0 0 400 350" role="img" aria-labelledby="tr-t"><title id="tr-t">A worked example of two rounds of generation</title><defs><marker id="tr-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="10" y="8" width="380" height="152" rx="8" class="d-box"/><text x="24" y="32" class="d-strong">Round 1</text><text x="86" y="32" class="d-small">Input:</text><text x="130" y="32" class="d-mono d-strong">the</text><text x="24" y="52" class="d-small">Probability of the next word</text><text x="24" y="74" class="d-mono">model</text><rect x="100" y="62" width="85.0" height="15" rx="3" class="d-accent"/><text x="192" y="74" class="d-small">25.0%</text><text x="376" y="74" class="d-small d-strong" text-anchor="end">← picked</text><text x="24" y="94" class="d-mono">next</text><rect x="100" y="82" width="85.0" height="15" rx="3" class="d-bar"/><text x="192" y="94" class="d-small">25.0%</text><text x="24" y="114" class="d-mono">answer</text><rect x="100" y="102" width="56.7" height="15" rx="3" class="d-bar"/><text x="163.66666666666666" y="114" class="d-small">16.7%</text><text x="24" y="134" class="d-mono">context</text><rect x="100" y="122" width="56.7" height="15" rx="3" class="d-bar"/><text x="163.66666666666666" y="134" class="d-small">16.7%</text><text x="24" y="154" class="d-mono">text</text><rect x="100" y="142" width="56.7" height="15" rx="3" class="d-bar"/><text x="163.66666666666666" y="154" class="d-small">16.7%</text><path d="M200 162 V201" class="d-line" marker-end="url(#tr-a)"/><text x="212" y="187" class="d-small">Append it for the next input</text><rect x="10" y="204" width="380" height="112" rx="8" class="d-box"/><text x="24" y="228" class="d-strong">Round 2</text><text x="86" y="228" class="d-small">Input:</text><text x="130" y="228" class="d-mono d-strong">the model</text><text x="24" y="248" class="d-small">Probability of the next word</text><text x="24" y="270" class="d-mono">can</text><rect x="100" y="258" width="113.3" height="15" rx="3" class="d-bar"/><text x="220.33333333333331" y="270" class="d-small">33.3%</text><text x="24" y="290" class="d-mono">predicts</text><rect x="100" y="278" width="113.3" height="15" rx="3" class="d-accent"/><text x="220.33333333333331" y="290" class="d-small">33.3%</text><text x="376" y="290" class="d-small d-strong" text-anchor="end">← picked</text><text x="24" y="310" class="d-mono">reads</text><rect x="100" y="298" width="113.3" height="15" rx="3" class="d-bar"/><text x="220.33333333333331" y="310" class="d-small">33.3%</text><text x="200" y="338" class="d-small" text-anchor="middle">Repeat this, and you get text</text></svg><figcaption>Figure 2. Real probabilities from the toy model in this article. Which word is picked is decided by probability, so it is not always the same (in this example, model and predicts were picked).</figcaption></figure>

## Temperature: adjusting how skewed the choice is

Running the code above gives the following (we ran it on Node.js 26.1.0; the random seed is fixed, so every run gives the same result).

```text Output
Temperature 0.5: model 30.0%, text 13.3%, next 30.0%, context 13.3%, answer 13.3%
Temperature 1: model 25.0%, text 16.7%, next 25.0%, context 16.7%, answer 16.7%
Temperature 2: model 22.5%, text 18.4%, next 22.5%, context 18.4%, answer 18.4%
Temperature 0.2: share of draws that picked a most-frequent word 83.30%
Temperature 1: share of draws that picked a most-frequent word 51.25%
Temperature 3: share of draws that picked a most-frequent word 43.85%
Example (temperature 0.2): the next token is chosen from the next token . the text
Example (temperature 3): the context . the answer can see . the next word from
```

<figure class="diagram"><svg viewBox="0 0 400 448" role="img" aria-labelledby="bt-t"><title id="bt-t">Probability of the word after “the”, by temperature</title><defs><marker id="bt-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="10" y="24" class="d-strong">Temperature 0.5</text><text x="390" y="24" class="d-small" text-anchor="end">concentrates on frequent words</text><text x="10" y="48" class="d-mono">model</text><rect x="84" y="36" width="180.0" height="15" rx="3" class="d-accent"/><text x="271" y="48" class="d-small">30.0%</text><text x="10" y="70" class="d-mono">text</text><rect x="84" y="58" width="80.0" height="15" rx="3" class="d-bar"/><text x="171" y="70" class="d-small">13.3%</text><text x="10" y="92" class="d-mono">next</text><rect x="84" y="80" width="180.0" height="15" rx="3" class="d-accent"/><text x="271" y="92" class="d-small">30.0%</text><text x="10" y="114" class="d-mono">context</text><rect x="84" y="102" width="80.0" height="15" rx="3" class="d-bar"/><text x="171" y="114" class="d-small">13.3%</text><text x="10" y="136" class="d-mono">answer</text><rect x="84" y="124" width="80.0" height="15" rx="3" class="d-bar"/><text x="171" y="136" class="d-small">13.3%</text><text x="10" y="164" class="d-strong">Temperature 1</text><text x="390" y="164" class="d-small" text-anchor="end">follows the counts</text><text x="10" y="188" class="d-mono">model</text><rect x="84" y="176" width="150.0" height="15" rx="3" class="d-accent"/><text x="241" y="188" class="d-small">25.0%</text><text x="10" y="210" class="d-mono">text</text><rect x="84" y="198" width="100.0" height="15" rx="3" class="d-bar"/><text x="191" y="210" class="d-small">16.7%</text><text x="10" y="232" class="d-mono">next</text><rect x="84" y="220" width="150.0" height="15" rx="3" class="d-accent"/><text x="241" y="232" class="d-small">25.0%</text><text x="10" y="254" class="d-mono">context</text><rect x="84" y="242" width="100.0" height="15" rx="3" class="d-bar"/><text x="191" y="254" class="d-small">16.7%</text><text x="10" y="276" class="d-mono">answer</text><rect x="84" y="264" width="100.0" height="15" rx="3" class="d-bar"/><text x="191" y="276" class="d-small">16.7%</text><text x="10" y="304" class="d-strong">Temperature 2</text><text x="390" y="304" class="d-small" text-anchor="end">gap narrows</text><text x="10" y="328" class="d-mono">model</text><rect x="84" y="316" width="134.8" height="15" rx="3" class="d-accent"/><text x="225.84692283495343" y="328" class="d-small">22.5%</text><text x="10" y="350" class="d-mono">text</text><rect x="84" y="338" width="110.1" height="15" rx="3" class="d-bar"/><text x="201.1020514433644" y="350" class="d-small">18.4%</text><text x="10" y="372" class="d-mono">next</text><rect x="84" y="360" width="134.8" height="15" rx="3" class="d-accent"/><text x="225.84692283495343" y="372" class="d-small">22.5%</text><text x="10" y="394" class="d-mono">context</text><rect x="84" y="382" width="110.1" height="15" rx="3" class="d-bar"/><text x="201.1020514433644" y="394" class="d-small">18.4%</text><text x="10" y="416" class="d-mono">answer</text><rect x="84" y="404" width="110.1" height="15" rx="3" class="d-bar"/><text x="201.1020514433644" y="416" class="d-small">18.4%</text><text x="10" y="438" class="d-small">Darker: the most frequent words (model and next)</text></svg><figcaption>Figure 3. Probability of the word after “the” (same numbers as the output above). Lower temperature concentrates on frequent words; higher narrows the gap.</figcaption></figure>

After “the,” model and next each appear 3 times and the rest 2 times each. At temperature 1, the probabilities follow the counts (25% and 16.7%). Lowering the temperature concentrates probability on the frequent words (30% at temperature 0.5). Raising it narrows the gap (22.5% at temperature 2). Over 2000 draws, the share that picked a most-frequent word was 83.30% at temperature 0.2, 51.25% at temperature 1 and 43.85% at temperature 3, close to the theoretical 83.5%, 50.0% and 43.3%. The official glossary says the same thing: higher temperature gives more varied output, and lower temperature sticks to the most likely words. In the generated examples, temperature 0.2 nearly retraced the original text, while temperature 3 produced a combination that isn’t in it (the answer can see).

> Even with temperature set to 0, an API’s results aren’t guaranteed to be identical. The same input can produce different outputs across calls (official glossary).

## Move the temperature and see

Move the slider and the probabilities of the word after “the” are recomputed on the spot, using the same formula as the toy model in the article. Roll the dice to see how it actually comes out. The more you roll, the closer the results get to the theory.

<div class="widget" data-widget="temperature"><p class="lab-small">JavaScript is required for this interactive widget.</p></div>

## The context window: working memory

The context window is all the text a model can reference when producing a response; you can think of it as “working memory.” It is separate from the large corpus the model was trained on. It holds the system prompt, every message so far, tool results, and images or documents, and the output the model generates counts too. As the conversation advances, all earlier turns pile up. The size depends on the model: in the documentation as of October 2026, many current models have 1 million tokens and the others 200 thousand.

<figure class="diagram"><svg viewBox="0 0 400 300" role="img" aria-labelledby="cw-t"><title id="cw-t">What fills the context window, and how it changes as a conversation grows</title><defs><marker id="cw-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><text x="10" y="16" class="d-strong">First exchange</text><text x="390" y="16" class="d-small" text-anchor="end">limit |</text><clipPath id="cw-c1"><rect x="10" y="24" width="380" height="34" rx="6"/></clipPath><g clip-path="url(#cw-c1)"><rect x="10.0" y="24" width="38.0" height="34" class="d-seg-sys"/><rect x="48.0" y="24" width="15.2" height="34" class="d-seg-hist"/><rect x="63.2" y="24" width="30.4" height="34" class="d-seg-out"/></g><rect x="10" y="24" width="380" height="34" rx="6" class="d-plain"/><text x="10" y="92" class="d-strong">Later in the conversation</text><clipPath id="cw-c2"><rect x="10" y="100" width="380" height="34" rx="6"/></clipPath><g clip-path="url(#cw-c2)"><rect x="10.0" y="100" width="38.0" height="34" class="d-seg-sys"/><rect x="48.0" y="100" width="190.0" height="34" class="d-seg-hist"/><rect x="238.0" y="100" width="83.6" height="34" class="d-seg-tool"/><rect x="321.6" y="100" width="30.4" height="34" class="d-seg-out"/></g><rect x="10" y="100" width="380" height="34" rx="6" class="d-plain"/><rect x="10" y="164" width="14" height="14" rx="3" class="d-seg-sys"/><text x="34" y="176">System prompt and tool definitions</text><rect x="10" y="190" width="14" height="14" rx="3" class="d-seg-hist"/><text x="34" y="202">Conversation so far (every message)</text><rect x="10" y="216" width="14" height="14" rx="3" class="d-seg-tool"/><text x="34" y="228">Tool results, images, documents</text><rect x="10" y="242" width="14" height="14" rx="3" class="d-seg-out"/><text x="34" y="254">This turn’s output (counts too)</text><rect x="10" y="268" width="14" height="14" rx="3" class="d-dash"/><text x="34" y="280">Free space (the limit is reached when it runs out)</text></svg><figcaption>Figure 4. The context window holds the output as well as the input. As the conversation grows, history piles up and free space shrinks. Proportions are illustrative, not real values.</figcaption></figure>

- Bigger isn’t automatically better. As tokens grow, accuracy and recall degrade, a phenomenon called “context rot” (official)
- If the input alone exceeds the limit, the API returns a 400 error (prompt is too long)
- On Claude 4.5 and later models, a request is accepted even if input plus max\_tokens exceeds the limit, and generation stops when it reaches the limit (stop\_reason: model\_context\_window\_exceeded)

> This may be why instructions are followed less reliably after a long session in Claude Code. The remedy is to keep only what you need in context (start a new session, move investigation into a separate context).

## Why it gets things wrong

An LLM isn’t looking up facts to answer; it chooses tokens that plausibly follow the context. So it can produce text that sounds right but is factually wrong (hallucination). The official documentation says this can happen even with the most advanced models. Even the toy model produced a combination that isn’t in its source text, exactly as the probabilities allow. By design, it can happen. The mitigations the official guide lists are:

- Tell it plainly that it may say “I don’t know”
- For long documents, have it extract word-for-word quotes first, then answer based only on those quotes
- Have it find a supporting quote for each claim, and retract the claim if it can’t
- Ask the same question several times and look for inconsistencies (best-of-N)
- Instruct it to use only the information in the documents you provide

> These reduce hallucinations significantly but don’t eliminate them. Always verify important information yourself (official).

## Letting the mechanism decide how you use it

The mechanism so far leads to a few working rules.

- Put the information it needs into the context. Don’t assume the model already knows it (training data and context are separate)
- Whatever you paste enters the context. Remove secret keys and personal information before sharing
- The same request can get different answers. Check the result every time
- Split a long conversation before quality drops

> The Claude Code articles (getting started, CLAUDE.md, permissions, workflows) cover concrete usage.

## How the toy model differs from a real LLM

The shape is the same as in a real LLM: choose the next token by probability, and shift the skew with temperature. What differs is how the probabilities are computed.

|  | This toy model | A real LLM |
| --- | --- | --- |
| Information used to predict | Only the previous word | The whole context |
| Training | Just counting | Pretraining on vast text, then fine-tuning and RLHF |
| Unit | Only words that appeared in the training text | Tokens (including word fragments and characters) |
| Unknown words | Can’t handle them (no probability) | Handled as combinations of smaller tokens (official glossary) |

> The inside of the part that computes these probabilities is covered, with figures and code, in [A look inside the Transformer](/en/articles/transformer-inside/).
