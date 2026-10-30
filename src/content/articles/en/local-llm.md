---
title: "Local LLMs: running a model on your own machine"
description: "What a local LLM is and how it differs from a cloud API. Estimate memory, understand quantization, run a model with Ollama, and know where it fits."
category: "ai"
tags: ["Local LLM","Ollama","Quantization"]
minutes: 8
type: "Beginner guide"
level: "Enough if you can use a terminal"
takeaway: "A local LLM keeps the model weights on your own machine and runs them there. The memory you need is roughly parameters × bytes per parameter, and quantization shrinks it."
order: 8
sources:
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
  - { title: "llama.cpp (GitHub)", url: "https://github.com/ggml-org/llama.cpp" }
  - { title: "LM Studio — Docs", url: "https://lmstudio.ai/docs" }
---

## What a local LLM is

Running a local LLM means downloading the model's weights (the parameters learned in training) and doing inference on your own computer. A cloud API such as Claude's sends your input to the provider's servers and returns the result. With a local model, input and output stay on your machine. The mechanism is the same either way: choose the next token by probability, over and over (see [How LLMs work](../llm-how-it-works/) for the basics). What differs is where the computation happens.

<figure class="diagram"><svg viewBox="0 0 400 398" role="img" aria-labelledby="lf-t"><title id="lf-t">Where the data flows: cloud API vs. local LLM</title><defs><filter id="lf-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="lf-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="lf-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="122" rx="14" fill="url(#lf-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">CLOUD API</text><g class="k-n"><rect x="24" y="36" width="136" height="52" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="48" cy="62" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,53) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="70" y="66.5" class="d-ntitle">Your PC</text><g class="k-w"><rect x="224" y="36" width="152" height="52" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="248" cy="62" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(239,53) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="270" y="60" class="d-ntitle">Provider cloud</text><text x="270" y="75" class="d-nsub">the model runs here</text><path d="M164 54 H220" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M164 54 H220"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><path d="M220 72 H164" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M220 72 H164"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><text x="192" y="48" class="d-nsub" text-anchor="middle">send input</text><text x="192" y="86" class="d-nsub" text-anchor="middle">result returns</text><text x="24" y="118" class="d-nsub">Your input is sent to the provider</text><rect x="8" y="146" width="384" height="244" rx="14" fill="url(#lf-g)" class="d-group"/><text x="24" y="166" class="d-gtitle">LOCAL LLM</text><g class="k-n"><rect x="70" y="172" width="260" height="46" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="94" cy="195" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(85,186) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="116" y="193" class="d-ntitle">App</text><text x="116" y="208" class="d-nsub">chat, etc.</text><path d="M200 220 V240" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M200 220 V240"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="70" y="242" width="260" height="46" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="94" cy="265" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(85,256) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="116" y="263" class="d-ntitle">Inference engine</text><text x="116" y="278" class="d-nsub">such as Ollama</text><path d="M200 290 V310" class="d-path" marker-end="url(#lf-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M200 290 V310"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="70" y="312" width="260" height="46" rx="11" class="d-node" filter="url(#lf-sh)"/><circle cx="94" cy="335" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(85,326) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="116" y="333" class="d-ntitle">Model weights</text><text x="116" y="348" class="d-nsub">loaded in memory</text><g class="k-ok"><g class="k-ok"><g transform="translate(95,367) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g></g><text x="124" y="380" class="d-ntitle">Input and output never leave the PC</text></svg><figcaption>Figure 1 The mechanism is the same; where the computation happens differs. Locally, input and output stay inside the PC.</figcaption></figure>

> Available models and their performance change quickly, so this article names no specific models and gives no benchmark numbers. When you choose one, check the model's official page and its license.

## Cloud vs. local

| Aspect | Cloud API | Local |
| --- | --- | --- |
| Where data goes | Sent to the provider's servers | Stays on your machine |
| Cost | Pay per token used | No per-use charge once you have the hardware |
| Capability ceiling | Large models available | Limited to what fits in your memory |
| Offline | Needs a connection | Works once the model is downloaded |
| Upkeep | The provider updates it | You manage updates, settings and disk space |

Neither is better in general; choose by use case. Local fits when you don't want sensitive documents to leave the machine, when you work without a network, or when you want to call a model many times while experimenting. Cloud is more realistic when you need the best quality or lack the hardware. Many people use both.

## Estimating the memory you need

The first limit you hit locally is memory. The weights must fit in memory, and their size is roughly parameters × bytes per parameter. At 16 bits (2 bytes) per parameter, a 7-billion-parameter model (7B) takes about 14 GB. The code below prints the estimate for each size and precision. The JavaScript and Python versions print the same output (checked by running both with Node.js and Python 3).

```js tab:"JavaScript" memory.mjs (estimate weight memory)
// Weight memory in GB = parameters (billions) × bytes per parameter
const GB = (billions, bits) => (billions * 1e9 * bits / 8) / 1e9;

for (const size of [7, 14, 32, 70]) {
  const row = [16, 8, 4].map((bits) => `${bits}bit ${GB(size, bits).toFixed(1)} GB`);
  console.log(`${size}B:`, row.join(' / '));
}
```

```python tab:"Python" memory.py
# Weight memory in GB = parameters (billions) × bytes per parameter
def gb(billions, bits):
    return (billions * 1e9 * bits / 8) / 1e9

for size in [7, 14, 32, 70]:
    row = [f"{bits}bit {gb(size, bits):.1f} GB" for bits in [16, 8, 4]]
    print(f"{size}B:", " / ".join(row))
```

```text Output
7B: 16bit 14.0 GB / 8bit 7.0 GB / 4bit 3.5 GB
14B: 16bit 28.0 GB / 8bit 14.0 GB / 4bit 7.0 GB
32B: 16bit 64.0 GB / 8bit 32.0 GB / 4bit 16.0 GB
70B: 16bit 140.0 GB / 8bit 70.0 GB / 4bit 35.0 GB
```

<figure class="diagram"><svg viewBox="0 0 400 470" role="img" aria-labelledby="mc-t"><title id="mc-t">Which memory the weights sit in, by setup</title><defs><filter id="mc-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="mc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="mc-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-a"><rect x="8" y="8" width="384" height="124" rx="12" class="d-node" filter="url(#mc-sh)"/><circle cx="34" cy="34" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(25,25) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="58" y="39" class="d-ntitle">With a GPU (such as NVIDIA)</text><clipPath id="mc1"><rect x="24" y="56" width="124" height="30" rx="7"/></clipPath><rect x="24" y="56" width="124" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc1)"><rect x="24.0" y="56" width="62.0" height="30" class="d-seg-hist d-seg"/></g><clipPath id="mc2"><rect x="204" y="56" width="172" height="30" rx="7"/></clipPath><rect x="204" y="56" width="172" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc2)"><rect x="204.0" y="56" width="106.6" height="30" class="d-seg-sys d-seg"/><rect x="310.6" y="56" width="44.7" height="30" class="d-seg-out d-seg"/></g><text x="24" y="106" class="d-nsub">Main memory</text><text x="204" y="106" class="d-nsub">Video memory (VRAM)</text><text x="204" y="122" class="d-nsub">Fast if the weights fit in VRAM</text><path d="M150 71 H202" class="d-path" marker-end="url(#mc-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.8s" begin="1s" repeatCount="indefinite" path="M150 71 H202"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.8s" begin="1s" repeatCount="indefinite"/></circle><path d="M202 80 H150" class="d-path" marker-end="url(#mc-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.8s" begin="1.5s" repeatCount="indefinite" path="M202 80 H150"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.8s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="8" y="148" width="384" height="106" rx="12" class="d-node" filter="url(#mc-sh)"/><circle cx="34" cy="174" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(25,165) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="58" y="179" class="d-ntitle">Apple Silicon</text><clipPath id="mc3"><rect x="24" y="196" width="352" height="30" rx="7"/></clipPath><rect x="24" y="196" width="352" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc3)"><rect x="24.0" y="196" width="63.4" height="30" class="d-seg-hist d-seg"/><rect x="87.4" y="196" width="176.0" height="30" class="d-seg-sys d-seg"/><rect x="263.4" y="196" width="59.8" height="30" class="d-seg-out d-seg"/></g><text x="24" y="242" class="d-nsub">Unified memory (shared by CPU and GPU)</text><g class="k-n"><rect x="8" y="270" width="384" height="106" rx="12" class="d-node" filter="url(#mc-sh)"/><circle cx="34" cy="296" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(25,287) scale(.75)" class="d-ico"><path d="M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01"/></g></g><text x="58" y="301" class="d-ntitle">CPU only</text><clipPath id="mc4"><rect x="24" y="318" width="352" height="30" rx="7"/></clipPath><rect x="24" y="318" width="352" height="30" rx="7" class="d-tag"/><g clip-path="url(#mc4)"><rect x="24.0" y="318" width="63.4" height="30" class="d-seg-hist d-seg"/><rect x="87.4" y="318" width="176.0" height="30" class="d-seg-sys d-seg"/><rect x="263.4" y="318" width="59.8" height="30" class="d-seg-out d-seg"/></g><text x="24" y="364" class="d-nsub">Main memory (works, but slower than a GPU)</text><rect x="12" y="394" width="14" height="14" rx="4" class="d-seg-hist"/><text x="34" y="406" class="d-nsub">OS and other apps</text><rect x="12" y="416" width="14" height="14" rx="4" class="d-seg-sys"/><text x="34" y="428" class="d-nsub">Model weights</text><rect x="12" y="438" width="14" height="14" rx="4" class="d-seg-out"/><text x="34" y="450" class="d-nsub">Conversation cache (KV)</text></svg><figcaption>Figure 2 What “memory” means depends on the setup. In every setup, the weights and the cache must fit in what is available. Proportions are illustrative, not real values.</figcaption></figure>

> To try whether a model fits your memory, use the [Local LLM Memory Estimator](https://paibot.app/en/llm-memory) in the app. Pick the parameters, precision and memory to see the weights' size and a rough verdict.

These figures cover weights only. In practice you also need room for the cache that grows with conversation length (the KV cache), plus the OS and other apps, so leave headroom beyond the table.

Which "memory" this means depends on how you run the model.

- **With a GPU (such as NVIDIA)**: video memory (VRAM). If the weights fit in VRAM, it runs fast. Some tools can spill the rest into main memory, but it becomes much slower
- **On Apple Silicon**: the CPU and GPU share one memory (unified memory). There is no separate video memory; ordinary memory serves the model too. The OS needs a share, so not all of it is available to the model
- **On the CPU only**: main memory. It works, but is slower than on a GPU

## Shrinking it with quantization

As the table shows, fewer bits per parameter means proportionally less memory. That is quantization: you trade some precision to run the same model in less memory. Many published models come in versions quantized to around 4 bits.

- Fewer bits make the model lighter, but answer quality drops a little at a time
- A larger model at 4 bits is often said to beat a smaller one at high precision, but it depends on the model and task, so compare on your own machine
- Judge the quality difference on the tasks you plan to run, not on general numbers alone

## Running a model with Ollama

The easy way to start is a tool like Ollama. It handles downloading models, running them in quantized formats, and serving a local API. Others include LM Studio (with a GUI) and llama.cpp, which many of these tools build on.

```bash Example commands
# Download a model and start chatting (pick <model-name> from the Ollama library)
ollama run <model-name>

# List the models you have downloaded
ollama list
```

Once running, Ollama listens for API requests on your own machine (localhost), and your programs query it over HTTP. Choose the first model by the size that fits your free memory according to the estimate above. Commands and API details can change, so check the official documentation.

## Where it fits, and its limits

- **Fits**: summarizing or classifying sensitive documents, offline use, bulk drafting and reformatting, experiments to learn how models work
- **Limits**: it may be less capable than the largest models, long contexts and complex reasoning can be less stable, and speed depends on your hardware
- **Caution**: a local model still makes mistakes. Local or cloud, check the output before you rely on it

## Checklist before you start

- [ ] Is a smaller model enough for the task?
- [ ] Do the weights plus headroom for the cache fit in free memory?
- [ ] Does the model's license allow your use (such as commercial use)?
- [ ] Do you have enough disk space (models run from a few GB to tens of GB)?
- [ ] Have you compared output quality on your own task?

For big models, several users or long contexts, see the follow-up, [Running local LLMs seriously](../local-llm-serving/).
