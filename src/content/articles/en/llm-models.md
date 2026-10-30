---
title: "LLM models at a glance: kinds and how to choose"
description: "Cloud APIs and open models, size, MoE, thinking, multimodal and roles. A brief map of how to sort the many LLM models and how to pick one."
category: "ai"
tags: ["LLM","Choosing models","Fundamentals"]
minutes: 7
type: "Beginner guide"
level: "Enough if you have used an LLM"
takeaway: "Sort LLM models by how they are offered, their size, what they were tuned for, the inputs they take, and their role, and the landscape becomes clear. Do not choose by name; decide by comparing on questions from your own use."
order: 5.5
sources:
  - { title: "Claude Docs — Models overview", url: "https://platform.claude.com/docs/en/about-claude/models/overview" }
---

## What an LLM model is

An LLM model is a set of **learned weights**, trained on huge amounts of text. They all work the same way, repeating [choosing the next token by probability](../llm-how-it-works/). The differences lie in the training data, the size, the tuning after training, and the inputs they handle.

> Model names and versions change within months. This article centers on the parts that change slowly, how to sort and how to choose, and keeps specific names to a minimum as examples from October 2026.

## Sort along five axes

| Axis | Split | What it changes |
| --- | --- | --- |
| How it is offered | Cloud API / open model (weights distributed) | Where data goes, operational effort, the best performance available |
| Size | Parameter count. Dense models that use everything / MoE that uses a part | Capability, speed, GPUs needed |
| Tuning purpose | Base model / instruction-following / think-then-answer | Ease of use, depth of answers, time |
| Inputs | Text only / multimodal, taking images and more | Where it can be used |
| Role | Generation / embedding / reranking / guardrails | Its job within a system |

<figure class="diagram"><svg viewBox="0 0 400 304" role="img" aria-labelledby="mm-t"><title id="mm-t">A map of LLM models</title><defs><filter id="mm-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mm-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mm-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-w"><rect x="8" y="8" width="188" height="92" rx="11" class="d-node" filter="url(#mm-sh)"/><circle cx="102" cy="29" r="13" class="d-badge"/></g><g class="k-w"><g transform="translate(93,20) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="102" y="56" class="d-ntitle" text-anchor="middle">Cloud API</text><text x="102" y="70" class="d-nsub" text-anchor="middle">data goes to the provider; no GPUs</text><text x="102" y="94" class="d-nsub" text-anchor="middle">Claude / GPT / Gemini</text><g class="k-a"><rect x="204" y="8" width="188" height="92" rx="11" class="d-node" filter="url(#mm-sh)"/><circle cx="298" cy="29" r="13" class="d-badge"/></g><g class="k-a"><g transform="translate(289,20) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="298" y="56" class="d-ntitle" text-anchor="middle">Open models</text><text x="298" y="70" class="d-nsub" text-anchor="middle">run the weights yourself</text><text x="298" y="94" class="d-nsub" text-anchor="middle">gpt-oss / Qwen / Gemma …</text><rect x="8" y="116" width="384" height="66" rx="14" fill="url(#mm-g)" class="d-group"/><text x="24" y="136" class="d-gtitle">PICK A TIER</text><g class="k-a"><rect x="24" y="146" width="112" height="22" rx="11" class="d-pill"/></g><text x="80" y="161" class="d-tagtext" text-anchor="middle">Top: hard tasks</text><g class="k-n"><rect x="144" y="146" width="112" height="22" rx="11" class="d-pill"/></g><text x="200" y="161" class="d-tagtext" text-anchor="middle">Middle: daily work</text><g class="k-ok"><rect x="264" y="146" width="112" height="22" rx="11" class="d-pill"/></g><text x="320" y="161" class="d-tagtext" text-anchor="middle">Lower: bulk, fast</text><rect x="8" y="198" width="384" height="96" rx="14" fill="url(#mm-g)" class="d-group"/><text x="24" y="218" class="d-gtitle">USE BY ROLE</text><g class="k-a"><rect x="24" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-a"><g transform="translate(56,235) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="65" y="272" class="d-nsub" text-anchor="middle">Generation</text><g class="k-n"><rect x="114" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-n"><g transform="translate(146,235) scale(.75)" class="d-ico"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></g></g><text x="155" y="272" class="d-nsub" text-anchor="middle">Embedding</text><g class="k-n"><rect x="204" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-n"><g transform="translate(236,235) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="245" y="272" class="d-nsub" text-anchor="middle">Reranking</text><g class="k-n"><rect x="294" y="226" width="82" height="56" rx="10" class="d-node" filter="url(#mm-sh)"/></g><g class="k-n"><g transform="translate(326,235) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="335" y="272" class="d-nsub" text-anchor="middle">Guardrails</text></svg><figcaption>Figure 1 Models first split by how they are offered. Pick cloud APIs by tier, open models by size and license. Within one system, use a different model for each role.</figcaption></figure>

## Cloud API models

Anthropic (Claude), OpenAI (GPT), Google (Gemini) and others offer models through APIs. You get top-level performance without owning GPUs. In exchange, your input is sent to the provider's servers.

Many providers line up **tiers that differ in capability, speed and cost**. Claude, for example, has these four as of October 2026 (per the official documentation).

| Model | Positioning |
| --- | --- |
| Claude Fable 5.1 | For demanding reasoning and long-horizon agentic work |
| Claude Opus 5.5 | The starting point for most uses. Long-running coding and knowledge work |
| Claude Sonnet 5.5 | A balance of speed and intelligence |
| Claude Haiku 5.5 | High-volume, speed-sensitive work such as classification, extraction and routing |

All of them have a 1M-token context, take text and images as input, and adjust how much they think. Other providers line up tiers in a similar way. When unsure, start in the middle tier, move up if it falls short, and down when the volume is large.

## Open models

These are models whose weights are distributed so you can run them on your own PC or servers. You can use them without sending data out, and they are what [local LLMs](../local-llm/) and [serving many users](../local-llm-serving/) run.

- **Families**: Qwen, Llama, Gemma, Mistral, DeepSeek, GPT-OSS (OpenAI's open models) and more. Major inference engines such as vLLM support them
- **Examples (checked on distribution pages)**: `gpt-oss-20b` (runs within 16 GB of memory, Apache 2.0), `gpt-oss-120b` (one 80 GB GPU, Apache 2.0), `Qwen3.8-27B` (Apache 2.0), and the Japanese-strengthened Swallow series
- **Licenses**: from permissive ones like Apache 2.0 and MIT to ones with their own terms. Check per model whether commercial use is allowed
- **What "open" means**: even if the weights are public, the training data and method may not be. Some call these "open-weight" to tell them apart

## What drives performance

- **Parameter count**: bigger tends to be more capable, but slower and needs more memory. Check the memory with the [memory estimator](https://paibot.app/en/llm-memory)
- **MoE (mixture of experts)**: holds many experts and uses only some for each token. Size memory by total parameters, compute by the part used
- **Context length**: how much it reads at once. Longer lets you pass long documents, but costs and waits grow too
- **Think-then-answer models**: thinking before answering makes them stronger on hard problems, at the cost of time and tokens
- **Quantization**: shrinks open models by using fewer bits. Trade a little quality to run on a smaller GPU

## How to choose

1. **Can data leave?** If not, run an open model in your own environment. If so, cloud APIs are easy and strong
2. **The quality you need**: the top tier for hard reasoning and long work, the middle for everyday work, the lower tier for bulk classification and extraction
3. **Volume and cost**: if you run a lot, first try whether a smaller model or lower tier is enough
4. **Japanese**: model cards often do not say. Check with Japanese questions
5. **Finally, compare on your own questions**: narrow to two or three candidates and measure quality, speed and cost on the same set of questions

<figure class="diagram"><svg viewBox="0 0 400 284" role="img" aria-labelledby="mc2-t"><title id="mc2-t">How to choose a model</title><defs><filter id="mc2-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mc2-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mc2-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="70" y="8" width="260" height="52" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="94" cy="34" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(85,25) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="116" y="32" class="d-ntitle">Can data leave?</text><text x="116" y="47" class="d-nsub">decide this first</text><path d="M140 62 V80 H104 V100" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M140 62 V80 H104 V100"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><path d="M260 62 V80 H296 V100" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M260 62 V80 H296 V100"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><text x="112" y="76" class="d-nsub" text-anchor="end">no</text><text x="288" y="76" class="d-nsub">yes</text><g class="k-a"><rect x="8" y="102" width="188" height="76" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="102" cy="123" r="13" class="d-badge"/></g><g class="k-a"><g transform="translate(93,114) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="102" y="150" class="d-ntitle" text-anchor="middle">An open model, self-hosted</text><text x="102" y="164" class="d-nsub" text-anchor="middle">fits your GPU; license OK</text><g class="k-w"><rect x="204" y="102" width="188" height="76" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="298" cy="123" r="13" class="d-badge"/></g><g class="k-w"><g transform="translate(289,114) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="298" y="150" class="d-ntitle" text-anchor="middle">A cloud API</text><text x="298" y="164" class="d-nsub" text-anchor="middle">start in the middle tier</text><path d="M102 180 V200 H200 V214" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M102 180 V200 H200 V214"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><path d="M298 180 V200 H200 V214" class="d-path" marker-end="url(#mc2-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M298 180 V200 H200 V214"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="216" width="352" height="56" rx="11" class="d-node" filter="url(#mc2-sh)"/><circle cx="48" cy="244" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,235) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="70" y="242" class="d-ntitle">Compare 2–3 candidates on your questions</text><text x="70" y="257" class="d-nsub">quality, speed, cost (incl. Japanese)</text></svg><figcaption>Figure 2 Decide where data may go first, narrow the candidates, then decide by comparing on questions from your own use.</figcaption></figure>

Using different models for different roles in one system is normal: a larger model for chat, an embedding model for search, and a small, fast model for routing and classification.

## Checklist

- [ ] Did you first decide whether data can leave?
- [ ] Did you check the candidates' licenses and terms of use?
- [ ] For an open model, does it fit your GPU?
- [ ] Did you compare two or three candidates on questions from your own use (including Japanese)?
- [ ] Did you record model names and versions so you can compare on the same questions when swapping?
