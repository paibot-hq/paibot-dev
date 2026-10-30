---
title: "Running internal-document Q&A in production: permissions, updates, evaluation and operations"
description: "Turn document Q&A (RAG) into a production system many people use. Incremental ingestion, permission filtering, better retrieval, evaluation and operations."
category: "ai"
tags: ["Local LLM","RAG","Operations"]
minutes: 14
type: "Practical guide"
level: "For readers of the basic RAG article"
takeaway: "In production, the system around the model decides quality more than the model's cleverness. Design four things first: ingestion that keeps documents current, permissions before search, evaluation after every change, and logging with monitoring."
order: 11
sources:
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
  - { title: "vLLM — Documentation", url: "https://docs.vllm.ai/" }
  - { title: "Claude Docs — Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" }
---

## Prototype vs. production

The [document Q&A system](../local-llm-rag/) was built for one person to try. Turn it into an internal system many people use, and problems beyond the model appear. For production, decide these requirements first.

| Requirement | What to decide | If you do not |
| --- | --- | --- |
| Users | Number of people, how many at once | People wait at busy times (see [memory sizing](../local-llm-serving/)) |
| Documents | Volume, formats (PDF, Office, wiki, etc.), where they live | Some documents cannot be ingested |
| Updates | How often they change, how fast the change must show up | Answers use an outdated rule |
| Permissions | Who may read which document | Content a person must not see appears in answers |
| Quality | The bar for “good enough”, and how to measure it | You cannot tell if a change helped |
| Operations | Failure handling, logs, an owner | Nobody can fix it when it stops |

This article does not recommend specific products. Product features and settings change, so it focuses on ideas and design points. The code is the smallest form that shows the mechanism.

## Overall architecture

Think of a production setup as two paths: the path that answers questions and the path that ingests documents. The search index connects them.

<figure class="diagram"><svg viewBox="0 0 400 504" role="img" aria-labelledby="pa-t"><title id="pa-t">Production architecture for internal-document Q&amp;A</title><defs><filter id="pa-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="pa-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="pa-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="4" y="4" width="392" height="496" rx="16" fill="url(#pa-g)" class="d-group"/><text x="18" y="24" class="d-gtitle">INSIDE THE COMPANY NETWORK</text><g class="k-n"><rect x="110" y="36" width="180" height="40" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="134" cy="56" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(125,47) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="156" y="60.5" class="d-ntitle">Users</text><path d="M200 78 V94" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M200 78 V94"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="50" y="96" width="300" height="52" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="74" cy="122" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(65,113) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="96" y="120" class="d-ntitle">Auth and API gateway</text><text x="96" y="135" class="d-nsub">SSO establishes who is asking</text><path d="M200 150 V166" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M200 150 V166"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="14" y="168" width="236" height="64" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="38" cy="200" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(29,191) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="60" y="198" class="d-ntitle">Question service</text><text x="60" y="213" class="d-nsub">search → filter → answer → verify</text><g class="k-n"><rect x="266" y="168" width="120" height="64" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="326" cy="189" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(317,180) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="326" y="216" class="d-ntitle" text-anchor="middle">Inference server</text><path d="M252 200 H264" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M252 200 H264"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><path d="M132 234 V258" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M132 234 V258"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><text x="142" y="251" class="d-nsub">Search (filtered by permission)</text><g class="k-a"><rect x="14" y="260" width="372" height="56" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="38" cy="288" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(29,279) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="60" y="286" class="d-ntitle">Index store</text><text x="60" y="301" class="d-nsub">full-text + vector index + groups allowed to read</text><text x="18" y="346" class="d-gtitle">INGESTION (whenever documents change)</text><g class="k-n"><rect x="14" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(47,363) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="56" y="394" class="d-nsub" text-anchor="middle">Documents</text><path d="M100 380 H106" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M100 380 H106"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="108" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(141,363) scale(.75)" class="d-ico"><path d="M4 12h11M11 8l4 4-4 4M19 5v14"/></g></g><text x="150" y="394" class="d-nsub" text-anchor="middle">Convert</text><path d="M194 380 H200" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M194 380 H200"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="202" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(235,363) scale(.75)" class="d-ico"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></g></g><text x="244" y="394" class="d-nsub" text-anchor="middle">Split</text><path d="M288 380 H294" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M288 380 H294"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="296" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(329,363) scale(.75)" class="d-ico"><path d="M10 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM17 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM12 7v5M12 12l-6 5M12 12l6 5"/></g></g><text x="338" y="394" class="d-nsub" text-anchor="middle">Embed</text><path d="M344 354 V318" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="0s" repeatCount="indefinite" path="M344 354 V318"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="0s" repeatCount="indefinite"/></circle><text x="334" y="340" class="d-nsub" text-anchor="end">update only the diff</text><g class="k-ok"><rect x="14" y="430" width="372" height="58" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="38" cy="459" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(29,450) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="60" y="457" class="d-ntitle">Question log, evaluation, monitoring</text><text x="60" y="472" class="d-nsub">Questions, sources, answers, feedback; measured regularly</text></svg><figcaption>Figure 1 The path that answers questions and the path that ingests documents meet at the search index. Permissions filter on the index data, and logs and evaluation watch the whole.</figcaption></figure>

- **Question path**: authentication establishes who is asking; the question service searches, filters by permission, has the model answer, verifies the answer, and returns it
- **Ingestion path**: detect changes in the document store, convert, split and embed, then update the index
- **Logs and evaluation**: both paths keep records, and an evaluation set measures quality regularly

## Ingestion: keeping documents current

The prototype loaded every document at startup. In production, rebuild only the documents that changed.

- Store a hash of each document's content, and reprocess only what changed
- When a document disappears, remove it from the index too (otherwise answers use content you deleted)
- Keep with each document its source (path or URL), update date and the groups allowed to read it
- Convert PDF and Office files to text first. Tables and figures break easily, so check the result by eye
- Keep heading structure when splitting. Putting the heading at the start of each chunk makes it easier to find

```python ingest.py (index tables)
import hashlib
import re
import sqlite3

from rag import split  # the split function from the previous article

db = sqlite3.connect("index.db")
db.executescript("""
CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, hash TEXT, groups TEXT);
CREATE TABLE IF NOT EXISTS chunks (id INTEGER PRIMARY KEY, path TEXT, ord INTEGER, text TEXT);
""")
```

```python ingest.py (incremental ingestion)
# Ingest: rebuild only changed documents, and remove vanished ones from the index
def sync(files):  # files: {path: (text, set of groups allowed to read)}
    changed = removed = 0
    for path, (text, groups) in files.items():
        digest = hashlib.sha256(text.encode()).hexdigest()
        row = db.execute("SELECT hash FROM docs WHERE path = ?", (path,)).fetchone()
        if row and row[0] == digest:
            continue  # unchanged
        db.execute("DELETE FROM chunks WHERE path = ?", (path,))
        for order, chunk in enumerate(split(text)):
            db.execute("INSERT INTO chunks (path, ord, text) VALUES (?, ?, ?)", (path, order, chunk))
        db.execute("INSERT OR REPLACE INTO docs VALUES (?, ?, ?)", (path, digest, ",".join(sorted(groups))))
        changed += 1  # recompute this document's chunk embeddings here too
    for (path,) in db.execute("SELECT path FROM docs").fetchall():
        if path not in files:
            db.execute("DELETE FROM chunks WHERE path = ?", (path,))
            db.execute("DELETE FROM docs WHERE path = ?", (path,))
            removed += 1
    db.commit()
    return changed, removed
```

If you swap the embedding model, the existing vectors become unusable, and you rebuild the vectors for every document. Record which model made the vectors in the index so the swap goes smoothly.

## Permissions: filter before searching

Internal documents mix what everyone may read with what only certain departments may read. The key point: **do not leave the permission check to the model**. Writing “do not show this to this person” in the prompt gives no guarantee the model obeys.

<figure class="diagram"><svg viewBox="0 0 400 284" role="img" aria-labelledby="pp-t"><title id="pp-t">Where to apply permissions</title><defs><filter id="pp-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="pp-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="pp-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-d"><g class="k-d"><g transform="translate(9,9) scale(.75)" class="d-ico"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM4 4l16 16"/></g></g></g><text x="34" y="22" class="d-ntitle">Not good: hide after searching</text><g class="k-n"><rect x="8" y="34" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="69" cy="55" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(60,46) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="69" y="82" class="d-ntitle" text-anchor="middle">Search all</text><text x="69" y="96" class="d-nsub" text-anchor="middle">every document</text><path d="M132 70 H138" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M132 70 H138"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-d"><rect x="140" y="34" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="201" cy="55" r="13" class="d-badge"/></g><g class="k-d"><g transform="translate(192,46) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="201" y="82" class="d-ntitle" text-anchor="middle">Send to model</text><text x="201" y="96" class="d-nsub" text-anchor="middle">all results</text><path d="M264 70 H270" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M264 70 H270"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="272" y="34" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="333" cy="55" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(324,46) scale(.75)" class="d-ico"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM4 4l16 16"/></g></g><text x="333" y="82" class="d-ntitle" text-anchor="middle">Hide answer</text><text x="333" y="96" class="d-nsub" text-anchor="middle">at output</text><text x="10" y="126" class="d-nsub">The model has already read documents it should not</text><g class="k-ok"><g transform="translate(9,155) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="34" y="168" class="d-ntitle">Good: filter before searching</text><g class="k-ok"><rect x="8" y="180" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="69" cy="201" r="13" class="d-badge"/></g><g class="k-ok"><g transform="translate(60,192) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="69" y="228" class="d-ntitle" text-anchor="middle">Group filter</text><text x="69" y="242" class="d-nsub" text-anchor="middle">check permission</text><path d="M132 216 H138" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M132 216 H138"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="140" y="180" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="201" cy="201" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(192,192) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="201" y="228" class="d-ntitle" text-anchor="middle">Search</text><text x="201" y="242" class="d-nsub" text-anchor="middle">visible docs only</text><path d="M264 216 H270" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M264 216 H270"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="272" y="180" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="333" cy="201" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(324,192) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="333" y="228" class="d-ntitle" text-anchor="middle">Send to model</text><text x="333" y="242" class="d-nsub" text-anchor="middle">filtered results</text><text x="10" y="272" class="d-nsub">Documents a person must not see never reach the model</text></svg><figcaption>Figure 2 Apply permissions when deciding what to search. Asking the model “do not show this” is not a safeguard.</figcaption></figure>

Filter before the search (or together with it). Documents a person must not see are never candidates in the first place.

```python ingest.py (filter by permission)
# Permissions: before searching, keep only the chunks this person may see
def visible_chunks(user_groups):
    rows = db.execute("SELECT chunks.id, chunks.path, chunks.text, docs.groups FROM chunks JOIN docs USING (path)").fetchall()
    return [(i, path, text) for i, path, text, groups in rows if set(groups.split(",")) & set(user_groups)]
```

- Leave authentication to your existing company system (SSO, etc.) and get the user's groups from it
- Build a path so that permission changes (leaving, transfers) take effect quickly. If you copy groups into the index, a sync delay becomes a hole
- If even the existence of a document must stay hidden, base answers like “no source found” on the permission-filtered results

## Improving retrieval

Answer quality is mostly decided by retrieval. If the sources handed to the model are wrong, no model can answer correctly.

- **Hybrid search**: use both keyword search (strong on proper nouns and part numbers) and vector search (strong on paraphrases)
- **Merging results**: the two scores are not comparable, so merging by rank only (RRF) is common
- **Reranking**: reorder the top few dozen with a more precise method and keep a handful
- **Metadata filters**: narrow the search by department, document type, update date and so on

```python ingest.py (merge by rank)
# Merging results: use ranks only (RRF). Keyword and vector scores are not comparable, so merge by rank
def rrf(rankings, k=60):
    score = {}
    for ranking in rankings:
        for rank, chunk_id in enumerate(ranking, start=1):
            score[chunk_id] = score.get(chunk_id, 0) + 1 / (k + rank)
    return sorted(score, key=score.get, reverse=True)
```

## Generate the answer, then verify it

The prototype returned the model's answer as it was. In production, check it before returning.

- **Citation check**: confirm the source numbers in the answer are numbers of sources you actually passed. With no valid number, treat the answer as unsupported
- **Choose not to answer**: when search finds nothing, or only weak matches, return “do not know” without calling the model
- **Show the source**: show a link to the original document with the answer so a person can check the original
- **Prepare for prompt injection**: do not let instructions inside documents be followed. Be especially wary of documents outsiders can write (inquiries, wiki edits)

```python ingest.py (citation check)
# Citation check: are the numbers in the answer really numbers of the sources we passed?
def check_citations(answer, found_count):
    cited = {int(n) for n in re.findall(r"\[(\d+)\]", answer)}
    return bool(cited) and cited <= set(range(1, found_count + 1))
```

Correct citation numbers do not guarantee correct content. The number check is the minimum; checking content is the job of the evaluation below.

## Evaluation: measure after every change

Changing the chunk size, the search method, the model or the prompt can raise or lower quality. Do not judge by feel; **measure with the same set of questions** and compare.

1. Collect 50–100 real questions (ask people on the job, or use inquiry history)
2. Attach to each the part of the document that is the correct basis
3. After every change, measure retrieval (the share of questions with the correct part in the top k)
4. Check answers by sampling with people. You can have a model grade answers, but the model's grading is also wrong at times, so combine it with human checks

```python ingest.py (retrieval evaluation)
# Evaluation: the share of questions whose correct chunk is in the top k
def recall_at_k(cases, search, k=5):  # cases: [(question, set of correct chunk ids)]
    hits = sum(1 for question, expected in cases if expected & set(search(question)[:k]))
    return hits / len(cases)
```

- Include “questions the documents do not cover” in the set, to measure whether it correctly says “do not know”
- Grow the set from real use. Add questions from the “was not helpful” records
- Keep the ability to roll back the last change when the numbers drop

## Operations: keeping it running

| Item | What to watch | Response |
| --- | --- | --- |
| Response time | Search and model time, queue length | If concurrent use grows, revisit hardware or model |
| Share of “do not know” | A sudden rise means a document or search problem | Check for failed ingestion or missing documents |
| Feedback | “Helpful / not helpful” | Add the unhelpful questions to the evaluation set |
| Ingestion | Failed documents, time of last update | Notify on failure. Do not keep serving a stale index |
| Logs | Questions, sources found, answers | Decide retention and who can read them |

- **Handling logs**: questions and answers contain confidential or personal data. Protect logs as strongly as the documents
- **Failures**: if the model stops, still returning the search results (a list of related documents) keeps the service from going completely dark
- **Updates**: when changing the model, embedding model or search settings, measure on the evaluation set before switching
- **Backups**: the index can be rebuilt from documents, but it takes time. Know how long a rebuild takes

## Checklist

- [ ] Have you decided the number of users, document volume, update frequency and unit of permission?
- [ ] Do document changes and deletions reach the index within the time you decided?
- [ ] Do you filter by permission before searching, rather than relying on the prompt?
- [ ] Have you tested that documents a person must not see never appear in answers?
- [ ] Is there an evaluation set that you run after every change, including questions the documents do not cover?
- [ ] Do you verify citations and show source links?
- [ ] Have you decided log retention and who can read the logs?
- [ ] Have you decided what happens when the model or search stops?
- [ ] Have you decided who runs it and who fixes problems?
