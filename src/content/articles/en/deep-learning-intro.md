---
title: "Deep learning basics: how a model learns a function from data"
description: "Neurons, layers, loss, gradients and backpropagation. Teach a small network XOR and see, briefly, how deep learning learns."
category: "ai"
tags: ["Deep learning","Neural networks","Fundamentals"]
minutes: 7
type: "Beginner guide"
level: "Enough if you can read Python"
takeaway: "Deep learning fits the weights of a layered function to data by repeating predict, loss, gradient and update. LLMs are built on the same mechanism."
order: 3.5
sources:
  - { title: "Dive into Deep Learning", url: "https://d2l.ai/" }
---

## What deep learning is

Deep learning is a way to learn a **function** that turns inputs into outputs, from data. Instead of people writing rules, you build a function that outputs "what is in the picture" or "the next word" by showing it many examples. The function is simple computations (neurons) arranged in **layers** and stacked many deep. That stacking is where the name comes from.

<figure class="diagram"><svg viewBox="0 0 400 304" role="img" aria-labelledby="nn-t"><title id="nn-t">The shape of a neural network</title><defs><filter id="nn-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="nn-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="nn-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><path d="M60 75.0 L160 50.5" class="d-path" opacity=".35"/><path d="M60 75.0 L160 99.5" class="d-path" opacity=".35"/><path d="M60 75.0 L160 148.5" class="d-path" opacity=".35"/><path d="M60 75.0 L160 197.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 50.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 99.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 148.5" class="d-path" opacity=".35"/><path d="M60 173.0 L160 197.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 50.5 L240 197.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 99.5 L240 197.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 148.5 L240 197.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 50.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 99.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 148.5" class="d-path" opacity=".35"/><path d="M160 197.5 L240 197.5" class="d-path" opacity=".35"/><path d="M240 50.5 L340 124.0" class="d-path" opacity=".35"/><path d="M240 99.5 L340 124.0" class="d-path" opacity=".35"/><path d="M240 148.5 L340 124.0" class="d-path" opacity=".35"/><path d="M240 197.5 L340 124.0" class="d-path" opacity=".35"/><g class="k-n"><circle cx="60" cy="75.0" r="12" class="d-badge"/></g><g class="k-n"><circle cx="60" cy="173.0" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="50.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="99.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="148.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="160" cy="197.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="50.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="99.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="148.5" r="12" class="d-badge"/></g><g class="k-a"><circle cx="240" cy="197.5" r="12" class="d-badge"/></g><g class="k-ok"><circle cx="340" cy="124.0" r="12" class="d-badge"/></g><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="0s" repeatCount="indefinite" path="M60 75.0 L160 99.5 L240 148.5 L340 124.0"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="0s" repeatCount="indefinite"/></circle><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.6s" begin="1.3s" repeatCount="indefinite" path="M60 173.0 L160 197.5 L240 50.5 L340 124.0"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.6s" begin="1.3s" repeatCount="indefinite"/></circle><text x="60" y="244" class="d-ntitle" text-anchor="middle">Input</text><text x="160" y="244" class="d-ntitle" text-anchor="middle">Hidden</text><text x="240" y="244" class="d-ntitle" text-anchor="middle">Hidden</text><text x="340" y="244" class="d-ntitle" text-anchor="middle">Output</text><rect x="16" y="262" width="368" height="34" rx="8" class="d-tag"/><text x="200" y="283" class="d-nsub" text-anchor="middle">One neuron: output = activation(sum of weight × input + bias)</text></svg><figcaption>Figure 1 Circles are neurons and lines are weights. The more layers you stack, the "deeper" the network. Learning decides the line weights and each neuron’s bias.</figcaption></figure>

## What one neuron does

A neuron multiplies each input by its own **weight**, adds them up, adds a **bias**, and passes the result through an **activation function**. That is all.

- Weights and biases are the numbers decided by learning (the parameters)
- The activation function (ReLU, tanh, sigmoid and others) puts a "bend" into the computation. Without it, any number of layers would still be a straight-line function
- Stacking layers lets each layer build more complex features out of the previous layer's outputs

When people say an LLM has "billions of parameters", they mean the number of these weights and biases.

## How learning works

Learning repeats four steps.

<figure class="diagram"><svg viewBox="0 0 400 216" role="img" aria-labelledby="ll-t"><title id="ll-t">The learning loop</title><defs><filter id="ll-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="ll-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="ll-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-a"><rect x="12" y="16" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="36" cy="44" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(27,35) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="58" y="42" class="d-ntitle">Predict</text><text x="58" y="57" class="d-nsub">forward pass</text><g class="k-w"><rect x="208" y="16" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="232" cy="44" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(223,35) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="254" y="42" class="d-ntitle">Loss</text><text x="254" y="57" class="d-nsub">gap from the answer</text><g class="k-n"><rect x="208" y="150" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="232" cy="178" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(223,169) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="254" y="176" class="d-ntitle">Gradient</text><text x="254" y="191" class="d-nsub">backpropagation</text><g class="k-ok"><rect x="12" y="150" width="180" height="56" rx="11" class="d-node" filter="url(#ll-sh)"/><circle cx="36" cy="178" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(27,169) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="58" y="176" class="d-ntitle">Update</text><text x="58" y="191" class="d-nsub">step × learning rate</text><path d="M194 44 H206" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M194 44 H206"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><path d="M298 74 V148" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M298 74 V148"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><path d="M206 178 H194" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M206 178 H194"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><path d="M102 148 V74" class="d-path" marker-end="url(#ll-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M102 148 V74"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><text x="200" y="116" class="d-nsub" text-anchor="middle">repeat</text></svg><figcaption>Figure 2 Repeat predict, loss, gradient and update until the loss is low enough. Each round moves the weights a little toward fitting the answers.</figcaption></figure>

1. **Predict**: compute outputs from inputs with the current weights (the forward pass)
2. **Loss**: turn the gap between prediction and answer into one number
3. **Gradient**: work out which way, and how far, to move each weight to reduce the loss. It is computed from the output side back toward the input, so it is called **backpropagation**
4. **Update**: move the weights a little against the gradient (gradient descent). How far to move is the **learning rate**

## A small example: learning XOR

XOR outputs 1 only when the two inputs differ. One straight line cannot separate it, so it needs a hidden layer. Here are the four steps above, written plainly with only NumPy (the output is from actually running it).

```python xor.py
import numpy as np

# Data: XOR (1 only when the two inputs differ). One straight line cannot separate it
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
y = np.array([[0], [1], [1], [0]], dtype=float)

# Model: 2 inputs → 8 hidden (tanh) → 1 output (sigmoid)
rng = np.random.default_rng(0)
W1, b1 = rng.normal(0, 1, (2, 8)), np.zeros(8)
W2, b2 = rng.normal(0, 1, (8, 1)), np.zeros(1)
sigmoid = lambda z: 1 / (1 + np.exp(-z))

lr = 0.5  # learning rate: how far to move the weights each step
for epoch in range(2001):
    # 1. Predict (forward pass)
    h = np.tanh(X @ W1 + b1)
    p = sigmoid(h @ W2 + b2)
    # 2. Loss: how far from the answers (cross-entropy)
    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    # 3. Gradients (backpropagation): which way to move each weight to reduce the loss
    dz2 = (p - y) / len(X)
    dW2, db2 = h.T @ dz2, dz2.sum(0)
    dz1 = (dz2 @ W2.T) * (1 - h ** 2)
    dW1, db1 = X.T @ dz1, dz1.sum(0)
    # 4. Update: move a little against the gradient
    W1 -= lr * dW1; b1 -= lr * db1
    W2 -= lr * dW2; b2 -= lr * db2
    if epoch % 500 == 0:
        print(f"epoch {epoch:4d}  loss {loss:.4f}")

print("prediction:", p.round(3).ravel(), "→", (p > 0.5).astype(int).ravel())
```

```text Output
epoch    0  loss 0.7414
epoch  500  loss 0.0068
epoch 1000  loss 0.0029
epoch 1500  loss 0.0018
epoch 2000  loss 0.0013
prediction: [0.001 0.998 0.999 0.002] → [0 1 1 0]
```

The loss goes down, and it answers all four inputs correctly. With only 4 hidden units, some random seeds got stuck in a dip on the way (a local minimum) and failed to solve it (1 out of 20 in my trials). Widening the layer a little made it stable.

In practice a library such as PyTorch takes care of computing gradients (automatic differentiation) and running on GPUs. What you write is the shape of the model, the loss, and the training loop.

## Common terms

| Term | Meaning |
| --- | --- |
| Epoch | One pass through all the training data |
| Batch | The chunk of data used for one update |
| Learning rate | How far each update moves the weights. Too large diverges; too small barely moves |
| Validation data | Data held out from training, used to check |
| Overfitting | Fitting the training data so closely that new data goes wrong |
| Inference | Only predicting, with trained weights |

## Preventing overfitting

- **Split the data**: separate training and validation data, and judge by validation results
- **Stop early**: stop training when the validation loss stops falling
- **Add data, or shrink the model**: check the model is not too large for the data

## How this connects to LLMs

LLMs work the same way. They build their layers with the Transformer and learn "predict the next token" from enormous amounts of text. That continues in [How LLMs work](../llm-how-it-works/) and [Inside the Transformer](../transformer-inside/).
