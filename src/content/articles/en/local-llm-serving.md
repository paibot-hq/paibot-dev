---
title: "Running local LLMs seriously: big models and the KV cache"
description: "How to size the memory beyond the weights (the KV cache), split a model across GPUs, handle MoE, serve several users, and choose a serving tool."
category: "ai"
tags: ["Local LLM","KV cache","vLLM"]
minutes: 9
type: "Practical guide"
level: "For readers of the local LLM introduction"
takeaway: "With big models or several users, the KV cache and speed (memory bandwidth) matter more than the weights. The cache grows with layers, heads, tokens and concurrent users, so size it first."
order: 9
sources:
  - { title: "vLLM — Documentation", url: "https://docs.vllm.ai/" }
  - { title: "llama.cpp (GitHub)", url: "https://github.com/ggml-org/llama.cpp" }
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
---

## What this article covers

In the [local LLM introduction](../local-llm/) you estimated the weights as parameters × bytes per parameter. For one person trying a model, that is enough. Once you run a big model, handle long text, or share it among several people, other factors start to matter. This article covers how to size them and how to choose tools.

> Models and tools change quickly, so this article names no specific models and gives no speed numbers. The settings in the example are illustrative values.

## Beyond the weights: the KV cache

When a model produces text one token at a time, it keeps in memory the intermediate results (the Key and Value) it computed for all the tokens so far, so it need not recompute them each time. This is the KV cache, and **it grows with longer conversations and with more simultaneous users**.

> KV cache size = 2 (Key and Value) × layers × KV heads × head dimension × bytes per element × tokens × concurrent users

The number of layers and heads is in the model's config file or official page. The code below uses an illustrative setting (32 layers, 8 KV heads, dimension 128, 16-bit). The JavaScript and Python versions print the same output (checked by running both with Node.js and Python 3).

```js tab:"JavaScript" kv-cache.mjs (KV cache size)
// KV cache = 2 (K and V) × layers × KV heads × head dim × bytes per element × tokens
// The layer count and the rest are illustrative values (not a real model's config).
const model = { layers: 32, kvHeads: 8, headDim: 128, bytes: 2 };   // 16-bit cache

const perToken = 2 * model.layers * model.kvHeads * model.headDim * model.bytes;
const GiB = (n) => n / 1024 ** 3;

console.log(`Per token: ${perToken / 1024} KiB`);
for (const tokens of [4096, 32768, 131072]) {
  for (const users of [1, 4]) {
    console.log(`${tokens} tokens, ${users} at once: ${GiB(perToken * tokens * users).toFixed(1)} GiB`);
  }
}
```

```python tab:"Python" kv_cache.py
# KV cache = 2 (K and V) × layers × KV heads × head dim × bytes per element × tokens
# The layer count and the rest are illustrative values (not a real model's config).
model = {"layers": 32, "kv_heads": 8, "head_dim": 128, "bytes": 2}   # 16-bit cache

per_token = 2 * model["layers"] * model["kv_heads"] * model["head_dim"] * model["bytes"]
gib = lambda n: n / 1024 ** 3

print(f"Per token: {per_token // 1024} KiB")
for tokens in [4096, 32768, 131072]:
    for users in [1, 4]:
        print(f"{tokens} tokens, {users} at once: {gib(per_token * tokens * users):.1f} GiB")
```

```text Output
Per token: 128 KiB
4096 tokens, 1 at once: 0.5 GiB
4096 tokens, 4 at once: 2.0 GiB
32768 tokens, 1 at once: 4.0 GiB
32768 tokens, 4 at once: 16.0 GiB
131072 tokens, 1 at once: 16.0 GiB
131072 tokens, 4 at once: 64.0 GiB
```

<figure class="diagram"><svg viewBox="0 0 400 346" role="img" aria-labelledby="mb-t"><title id="mb-t">Memory needed grows with users and context length</title><defs><filter id="mb-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mb-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mb-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-a"><g transform="translate(10,31) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="34" y="44.5" class="d-ntitle">1 user, short chat</text><rect x="14" y="54" width="372" height="34" rx="8" class="d-tag"/><rect x="14" y="54" width="24" height="34" class="d-seg-hist d-seg"/><rect x="38" y="54" width="150" height="34" class="d-seg-sys d-seg"/><rect x="188" y="54" width="16" height="34" class="d-seg-out d-seg"/><g class="k-ok"><rect x="14" y="96" width="70" height="22" rx="11" class="d-pill"/></g><text x="49" y="111" class="d-tagtext" text-anchor="middle">Fits</text><g class="k-a"><g transform="translate(10,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><g class="k-a"><g transform="translate(30,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><g class="k-a"><g transform="translate(50,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><g class="k-a"><g transform="translate(70,133) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="96" y="146.5" class="d-ntitle">4 users, long context</text><rect x="14" y="156" width="372" height="34" rx="8" class="d-tag"/><rect x="14" y="156" width="24" height="34" class="d-seg-hist d-seg"/><rect x="38" y="156" width="150" height="34" class="d-seg-sys d-seg"/><rect x="188" y="156" width="92" height="34" class="d-seg-out d-seg"/><rect x="280" y="156" width="58" height="34" class="d-over d-seg"/><g class="k-d"><rect x="14" y="198" width="78" height="22" rx="11" class="d-pill"/></g><text x="53" y="213" class="d-tagtext" text-anchor="middle">Overflows</text><path d="M280 30 V212" class="d-skip" stroke="var(--danger)"/><g class="k-d"><rect x="218" y="6" width="124" height="20" rx="10" class="d-pill"/></g><text x="280" y="20" class="d-tagtext" text-anchor="middle">Memory available</text><rect x="8" y="232" width="384" height="104" rx="12" class="d-node k-n"/><rect x="22" y="244" width="14" height="14" rx="4" class="d-seg-hist"/><text x="44" y="256" class="d-nsub">OS and other apps</text><rect x="22" y="266" width="14" height="14" rx="4" class="d-seg-sys"/><text x="44" y="278" class="d-nsub">Model weights</text><rect x="22" y="288" width="14" height="14" rx="4" class="d-seg-out"/><text x="44" y="300" class="d-nsub">KV cache</text><g class="k-a"><g transform="translate(17,311) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="44" y="324" class="d-nsub">The KV cache grows with context length × concurrent users</text></svg><figcaption>Figure 1 The weights stay the same size, but the KV cache grows with use. Long contexts for several users can exceed the limit. Proportions are illustrative.</figcaption></figure>

With these illustrative settings, a 4,000-token conversation needs only 0.5 GiB, but 131,072 tokens for four users needs 64 GiB on top of the weights. With long contexts on a big model, the cache, not the weights, can be the wall. The unit here is GiB (powers of 1024), slightly different from the GB (billions) in the introduction.

- Models with fewer KV heads (several heads sharing one Key and Value) have a smaller cache
- Some tools can also quantize the KV cache to shrink it, though quality may drop
- Just capping the context length at what you need can save a lot of memory

## Running a model that is too big

For a model that does not fit on one GPU, there are several ways.

| Way | What it does | Caveat |
| --- | --- | --- |
| Stronger quantization | Shrink the weights to 4 bits or so | Quality drops a little at a time |
| Split across GPUs | Share layers or computation among GPUs (tensor parallelism, etc.) | Without a fast link between GPUs, speed suffers |
| Put part on the CPU side | Keep layers that do not fit in main memory (llama.cpp and others support it) | The offloaded part runs slower |
| Use a machine with large memory | For example, models with large unified memory | Bandwidth (below) sets the speed |

### Sizing MoE (mixture of experts) models

An MoE model holds many “expert” parts and uses only some of them for each token. You must keep **all the experts' weights in memory**, so you size memory by the total parameter count. The computation per token uses only the active part, so it is lighter than a regular model of the same total size. Remember: memory by the total, compute by what is used.

## What decides speed

Generating each token reads nearly all the weights from memory. So generation speed tends to depend on **memory bandwidth** (how much can be read per second) more than on raw compute. Smaller weights (quantized) mean less to read and faster output.

- Quantization helps speed as well as memory
- For the same weights, a machine with more bandwidth is faster. This is a separate condition from whether it fits
- The time to the first token grows with input length. The longer the document, the longer the wait

## Serving several people: server tools

For one person, Ollama or llama.cpp is enough. For several simultaneous users, a server tool that batches concurrent requests fits better. vLLM is one example; it is built around batching requests efficiently and managing the KV cache well in memory. Check the official documentation for details.

<figure class="diagram"><svg viewBox="0 0 400 442" role="img" aria-labelledby="sa-t"><title id="sa-t">Architecture of an inference server for several users</title><defs><filter id="sa-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="sa-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="sa-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="10" y="8" width="120" height="40" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="34" cy="28" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(25,19) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="56" y="32.5" class="d-ntitle">User A</text><path d="M70 50 V84" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="0.5s" repeatCount="indefinite" path="M70 50 V84"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="140" y="8" width="120" height="40" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="164" cy="28" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(155,19) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="186" y="32.5" class="d-ntitle">User B</text><path d="M200 50 V84" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.3s" begin="1s" repeatCount="indefinite" path="M200 50 V84"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.3s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="270" y="8" width="120" height="40" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="294" cy="28" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(285,19) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="316" y="32.5" class="d-ntitle">User C</text><path d="M330 50 V84" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="1.5s" repeatCount="indefinite" path="M330 50 V84"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="1.5s" repeatCount="indefinite"/></circle><rect x="8" y="86" width="384" height="148" rx="14" fill="url(#sa-g)" class="d-group"/><text x="24" y="106" class="d-gtitle">INFERENCE SERVER (such as vLLM)</text><g class="k-a"><rect x="24" y="110" width="352" height="50" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="48" cy="135" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,126) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="70" y="133" class="d-ntitle">Request queue</text><text x="70" y="148" class="d-nsub">concurrent requests are batched</text><path d="M200 162 V172" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M200 162 V172"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="174" width="352" height="50" rx="11" class="d-node" filter="url(#sa-sh)"/><circle cx="48" cy="199" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,190) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="197" class="d-ntitle">KV cache management</text><text x="70" y="212" class="d-nsub">places each user’s cache efficiently</text><path d="M102 236 V262" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="0.5s" repeatCount="indefinite" path="M102 236 V262"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="264" width="188" height="122" rx="12" class="d-node" filter="url(#sa-sh)"/><circle cx="32" cy="288" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,279) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="54" y="293" class="d-ntitle">GPU 0</text><rect x="22" y="308" width="160" height="30" rx="8" class="d-seg-sys d-seg"/><text x="102" y="327" class="d-white" text-anchor="middle">Half the weights</text><rect x="22" y="344" width="160" height="30" rx="8" class="d-seg-out d-seg"/><text x="102" y="363" class="d-white" text-anchor="middle">KV cache</text><path d="M306 236 V262" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="1s" repeatCount="indefinite" path="M306 236 V262"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="212" y="264" width="188" height="122" rx="12" class="d-node" filter="url(#sa-sh)"/><circle cx="236" cy="288" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(227,279) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="258" y="293" class="d-ntitle">GPU 1</text><rect x="226" y="308" width="160" height="30" rx="8" class="d-seg-sys d-seg"/><text x="306" y="327" class="d-white" text-anchor="middle">Half the weights</text><rect x="226" y="344" width="160" height="30" rx="8" class="d-seg-out d-seg"/><text x="306" y="363" class="d-white" text-anchor="middle">KV cache</text><path d="M198 322 H212" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="1.5s" repeatCount="indefinite" path="M198 322 H212"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="1.5s" repeatCount="indefinite"/></circle><path d="M212 340 H198" class="d-path" marker-end="url(#sa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="0s" repeatCount="indefinite" path="M212 340 H198"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><g transform="translate(111,399) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="138" y="412" class="d-ntitle">GPU-to-GPU traffic</text><text x="200" y="430" class="d-nsub" text-anchor="middle">Splitting a model needs a fast link between GPUs</text></svg><figcaption>Figure 2 The server receives and batches requests, and computes with weights split across several GPUs. The cache uses memory for every user.</figcaption></figure>

| Use | Example tools |
| --- | --- |
| One person, ease first | Ollama, LM Studio |
| CPU or partial GPU, fine control | llama.cpp |
| Many simultaneous users, GPU servers | Server-oriented inference engines such as vLLM |

Tools also differ in the model formats they accept. For example, llama.cpp uses GGUF, while GPU servers often use quantized formats such as AWQ or GPTQ, so check the format when you look for a model.

## Checklist before serious use

- [ ] Do the weights (check with the [estimator](https://paibot.app/en/llm-memory)) plus the KV cache (longest context × concurrent users) fit in the memory?
- [ ] If you split across GPUs, is the link between them fast enough?
- [ ] Does your hardware's memory bandwidth give the speed you need? Would a smaller model or stronger quantization do?
- [ ] Have you decided the number of simultaneous users and the context length per user?
- [ ] Does the model's license allow your setup (internal use, commercial use, and so on)?
- [ ] Have you compared quality against a cloud model on your own task? Do not decide on cost alone
- [ ] Have you decided who handles updates, monitoring and failures?

With a cloud API, the provider handles all of this. Running it yourself pays off when you have a reason: data that cannot leave, high volume, or the need for fine control.
