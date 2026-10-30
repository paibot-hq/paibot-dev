---
title: "Trying LLMs on Colab: run a model on a free GPU"
description: "Even without a GPU in your own PC, Google Colab's free GPU can run an LLM. Two ways to run one (Ollama and Transformers), what you may use it for, what is prohibited, and how to size the memory."
category: "ai"
tags: ["Colab","Local LLM","Ollama"]
minutes: 11
type: "Practical guide"
level: "Enough if you can run Python code in a notebook"
takeaway: "With Colab you can try LLMs for free even on a PC without a GPU. But it runs in Google's cloud, so it is not local. The machine is temporary and cannot be exposed to the outside, so use it to try and learn."
order: 14
sources:
  - { title: "Google Colab — FAQ", url: "https://research.google.com/colaboratory/faq.html" }
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
  - { title: "Hugging Face — bitsandbytes quantization", url: "https://huggingface.co/docs/transformers/en/quantization/bitsandbytes" }
---

## What you can do on Colab

Google Colab is a service where you write and run Python code in a notebook you open in the browser. Even the free plan lends you a machine with a GPU. Without a GPU in your own PC, you can still run an LLM and check the memory and quantization ideas hands-on.

> **This is not “local.”** Colab's machines are in Google's cloud. The text you enter and the models you download run there. Do not put confidential documents or personal data in it. If you want the data to stay with you, run it on your own PC as in the [local LLM introduction](../local-llm/).

Good and poor uses:

| Good for | Poor for |
| --- | --- |
| Learning and trying how LLMs work | A service that must stay up (it is removed automatically) |
| Comparing small models and the effect of quantization | Opening it to outside users (prohibited) |
| Trying a model that does not fit your own PC | Handling confidential documents (they go to Google's cloud) |
| Removing environment differences in a class or study group | Running bulk work at a fixed time for certain (no guarantee) |

## Limits to know

The limits are in Colab's official FAQ. This article follows what I checked in October 2026.

- **GPU types change**: the GPUs available in the free tier change over time. A T4 is commonly said to be assigned often, but nothing is guaranteed
- **Resources are not guaranteed**: free usage limits fluctuate. When it is busy, you may get no GPU at all
- **There is a time limit**: a free notebook runs at most 12 hours, and it disconnects after a while of inactivity
- **The runtime disappears**: virtual machines are deleted when idle and have a maximum lifetime. The models you downloaded disappear with it. The notebook itself is saved in Google Drive

Some uses are not allowed (excerpt):

- Web services and other offerings unrelated to interactive compute (**including exposing it to the outside**)
- Connecting to remote proxies
- Remote control such as SSH, or bypassing the notebook to work mostly through a web UI (on the free tier this can be stopped without warning)
- Mining cryptocurrency, and using several accounts to get around limits

Some guides show how to use a tunneling service so that outside apps can reach Ollama on Colab. Judged against the FAQ, that use is likely to fall under the restrictions, so this article does not cover it. All calls are made **from inside the same notebook**.

## The overall setup

Notebook cells run Python code, and an inference engine (Ollama or Transformers) puts the model weights on the GPU and produces answers. All of it runs inside a temporary virtual machine that Google provides. The model is downloaded from its source into that machine every time. The notebook itself is saved in Google Drive.

<figure class="diagram"><svg viewBox="0 0 400 440" role="img" aria-labelledby="co-t"><title id="co-t">On Colab, it runs in Google’s cloud, not locally</title><defs><filter id="co-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="co-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="co-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="8" y="8" width="176" height="44" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="32" cy="30" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(23,21) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="54" y="34.5" class="d-ntitle">Your browser</text><g class="k-w"><rect x="216" y="8" width="176" height="44" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="240" cy="30" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(231,21) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="262" y="28" class="d-ntitle">Google Drive</text><text x="262" y="43" class="d-nsub">notebook storage</text><path d="M186 30 H214" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M186 30 H214"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><text x="200" y="24" class="d-nsub" text-anchor="middle">save</text><path d="M96 54 V112" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M96 54 V112"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><text x="106" y="69" class="d-nsub">operate</text><rect x="8" y="76" width="384" height="272" rx="14" fill="url(#co-g)" class="d-group"/><text x="24" y="96" class="d-gtitle">COLAB RUNTIME (temporary virtual machine)</text><g class="k-n"><rect x="24" y="112" width="352" height="50" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="137" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,128) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="70" y="135" class="d-ntitle">Notebook cells</text><text x="70" y="150" class="d-nsub">run Python code</text><path d="M200 164 V182" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M200 164 V182"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="184" width="352" height="50" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="209" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,200) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="207" class="d-ntitle">Inference engine</text><text x="70" y="222" class="d-nsub">Ollama or Transformers</text><path d="M200 236 V254" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M200 236 V254"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="24" y="256" width="352" height="56" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="284" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,275) scale(.75)" class="d-ico"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g></g><text x="70" y="282" class="d-ntitle">GPU (such as T4)</text><text x="70" y="297" class="d-nsub">holds the model weights</text><text x="200" y="334" class="d-nsub" text-anchor="middle">Deleted: when idle, or after 12 hours max</text><path d="M200 376 V350" class="d-path" marker-end="url(#co-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="1s" repeatCount="indefinite" path="M200 376 V350"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="378" width="352" height="50" rx="11" class="d-node" filter="url(#co-sh)"/><circle cx="48" cy="403" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,394) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="70" y="401" class="d-ntitle">Model source</text><text x="70" y="416" class="d-nsub">Ollama, Hugging Face. Downloaded each time</text><text x="208" y="368" class="d-nsub">download</text></svg><figcaption>Figure 1 It runs in a temporary virtual machine in Google’s cloud. The model is downloaded each time and disappears with the machine. Nothing is exposed to the outside.</figcaption></figure>

## Preparation: attach a GPU

1. Create a new notebook
2. In the “Runtime” menu, choose “Change runtime type” and select **GPU** as the hardware accelerator
3. In the first cell, check that a GPU was assigned

```bash Cell 1 (check the GPU)
%%bash
nvidia-smi
```

If a GPU name and memory size are shown, you have one. If not, recheck the runtime type, or try again after a while.

## Method A: run Ollama inside the notebook

Install the Ollama you used in the [local LLM introduction](../local-llm/) inside the notebook and run it.

```bash Cell 2 (install Ollama)
%%bash
curl -fsSL https://ollama.com/install.sh | sh
```

```python Cell 3 (start the server in the background)
import subprocess
import time
import urllib.request

# Start the server as a background process so the notebook is not blocked
server = subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for _ in range(30):  # wait up to 30 seconds for it to start
    try:
        urllib.request.urlopen("http://localhost:11434")
        break
    except Exception:
        time.sleep(1)
```

```bash Cell 4 (download a model)
%%bash
# Pick <model-name> from the Ollama library. You download it again each time you reopen the notebook
ollama pull <model-name>
```

```python Cell 5 (ask a question)
import json
import urllib.request


def chat(question, model="<model-name>"):
    body = {"model": model, "messages": [{"role": "user", "content": question}], "stream": False}
    request = urllib.request.Request(
        "http://localhost:11434/api/chat",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        return json.load(response)["message"]["content"]


print(chat("What is the capital of Japan? Answer in one sentence."))
```

The install may fail with an error about a missing package. Follow the message to add what is needed, then try again. Install steps can change, so also check the official documentation. `localhost` means only the machine of this notebook. People outside cannot connect to it.

## Method B: run it directly with Transformers

The other way is to load the model directly with Hugging Face's Transformers library. No server is needed; it all stays in Python. To fit even a GPU with small memory, load it quantized to 4 bits (bitsandbytes).

```bash Cell (install the libraries)
%%bash
pip install -q transformers accelerate bitsandbytes
```

```python Cell (load the model and ask)
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

name = "<model-name>"  # a model name on Hugging Face

# Load in 4 bits. Older GPUs such as the T4 may not support bfloat16, so use float16
quant = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
tokenizer = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name, quantization_config=quant, device_map="auto")

messages = [{"role": "user", "content": "What is the capital of Japan? Answer in one sentence."}]
inputs = tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt", return_dict=True).to(model.device)
output = model.generate(**inputs, max_new_tokens=100)
print(tokenizer.decode(output[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True))
```

Some models require you to accept their terms on Hugging Face and use an access token. Do not write the token in the notebook's code; store it in Colab's “Secrets” feature. That keeps it from leaking when you share the notebook.

| Aspect | Ollama (Method A) | Transformers (Method B) |
| --- | --- | --- |
| Ease | A few commands | Needs Python code |
| Format | Distributed, already quantized | Quantizes a Hugging Face model as it loads |
| Good for | Asking questions and reading answers | Poking at model internals and generation settings |
| Reuse locally | Same usage as Ollama on your own PC | Easier to connect to research and fine-tuning |

## Estimate the size of model that fits

The memory of the GPUs you can use for free is commonly said to be around 16 GB (the GPU type changes). The weights and the KV cache must fit in it. Check first with the [memory estimator](https://paibot.app/en/llm-memory) or the formula in the introduction.

- A 7-billion-parameter (7B) model loaded in 4 bits has about 3.5 GB of weights, with room to spare
- A 14B model in 4 bits is about 7 GB, and is likely to fit
- A 32B model in 4 bits is about 16 GB, which fills the memory and probably does not fit
- Long contexts and answering several questions at once grow the KV cache (see the [follow-up article](../local-llm-serving/))

If you try to load a model that does not fit the GPU, it stops with an out-of-memory error. Then pick a smaller model or fewer bits.

## Keeping your notebook tidy

When the runtime disappears, the downloaded model disappears with it. Decide these things ahead of time and you will not be stuck.

- Gather **the cells that build the environment** at the top of the notebook (GPU check, installs, starting the server). After reopening, run them from the top to be back where you were
- Basically **download the model again each time**. It takes time, so start with small models
- To keep results, **save them outside the runtime**, for example to Google Drive
- Before starting a long job, **confirm a GPU is assigned**

## When it does not work

| Symptom | Likely cause | What to try |
| --- | --- | --- |
| No GPU shown | The runtime type is not GPU, or none is free | Check the runtime type. Try again after a while |
| Stops for lack of memory | The model is big or the context is long | Use a smaller model, fewer bits, or a shorter generation length |
| Disconnected midway | Idle for a while, or hit the time limit | Run the environment cells again from the top |
| Slow model download | The model is large | Start with a smaller model |
| Cannot connect to the server | It has not started yet, or has died | Run cell 3 again and wait for it to start |

## Checklist

- [ ] Have you kept confidential and personal data out of the notebook? (it runs in Google's cloud)
- [ ] Did you set the runtime type to GPU and confirm with `nvidia-smi`?
- [ ] Did you estimate that the chosen model fits in the GPU memory?
- [ ] Did you store the access token in Secrets rather than in the code?
- [ ] Are you avoiding any use that exposes it to the outside? (prohibited on Colab)
- [ ] Did you gather the environment-building cells, and decide where results are saved?
