---
title: "社内文書Q&Aを本番で動かす:権限・更新・評価・運用の設計"
description: "文書に質問できるRAGを、複数人が使う本番の仕組みにする。取り込みの差分更新、権限での絞り込み、検索の改善、評価、運用までの設計をまとめる。"
category: "ai"
tags: ["ローカルLLM","RAG","運用"]
minutes: 14
type: "実践ガイド"
level: "RAGの基本記事を読んだ人向け"
takeaway: "本番では、モデルの賢さより、周りの仕組みが品質を決めます。文書を最新に保つ取り込み、検索の前の権限、変更のたびに測る評価、ログと監視の4つを先に設計します。"
order: 11
sources:
  - { title: "Ollama — Documentation", url: "https://docs.ollama.com/" }
  - { title: "vLLM — Documentation", url: "https://docs.vllm.ai/" }
  - { title: "Claude Docs — Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations" }
---

## 試作と本番の違い

[文書に質問できるシステム](../local-llm-rag/)は、自分1人が試す形でした。これを複数人が使う社内システムにすると、モデル以外の問題が増えます。本番では、先に次の要件を決めておきます。

| 要件 | 決めること | 決めないとどうなるか |
| --- | --- | --- |
| 利用者 | 人数、同時に使う人数 | 重い時間帯に待たされる([メモリの見積もり](../local-llm-serving/)を参照) |
| 文書 | 量、形式(PDF、Office、Wikiなど)、置き場所 | 取り込めない文書が出る |
| 更新 | どのくらいの頻度で変わり、どのくらいで反映するか | 古い規程で答える |
| 権限 | 誰がどの文書を見てよいか | 見せてはいけない文書の内容が答えに出る |
| 品質 | 「合格」の基準と、測り方 | 良くなったのか悪くなったのか分からない |
| 運用 | 障害時、ログ、担当者 | 止まったときに誰も直せない |

この記事は、特定の製品を勧めるものではありません。製品ごとの機能と設定は変わるので、考え方と設計の勘所を中心に書きます。コードは、仕組みが分かる最小の形です。

## 全体のアーキテクチャ

本番の構成は、「質問に答える経路」と「文書を取り込む経路」の2本に分けて考えます。2つをつなぐのが、検索用の索引です。

<figure class="diagram"><svg viewBox="0 0 400 504" role="img" aria-labelledby="pa-t"><title id="pa-t">社内文書Q&amp;Aの本番構成</title><defs><filter id="pa-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="pa-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="pa-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="4" y="4" width="392" height="496" rx="16" fill="url(#pa-g)" class="d-group"/><text x="18" y="24" class="d-gtitle">社内ネットワークの中</text><g class="k-n"><rect x="110" y="36" width="180" height="40" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="134" cy="56" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(125,47) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="156" y="60.5" class="d-ntitle">利用者</text><path d="M200 78 V94" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M200 78 V94"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="50" y="96" width="300" height="52" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="74" cy="122" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(65,113) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="96" y="120" class="d-ntitle">認証・APIゲートウェイ</text><text x="96" y="135" class="d-nsub">SSOで、誰が聞いたかを確定する</text><path d="M200 150 V166" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M200 150 V166"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="14" y="168" width="236" height="64" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="38" cy="200" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(29,191) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="60" y="198" class="d-ntitle">質問サービス</text><text x="60" y="213" class="d-nsub">検索 → 権限 → 回答 → 検証</text><g class="k-n"><rect x="266" y="168" width="120" height="64" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="326" cy="189" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(317,180) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="326" y="216" class="d-ntitle" text-anchor="middle">推論サーバー</text><path d="M252 200 H264" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M252 200 H264"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><path d="M132 234 V258" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M132 234 V258"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><text x="142" y="251" class="d-nsub">検索(権限で絞る)</text><g class="k-a"><rect x="14" y="260" width="372" height="56" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="38" cy="288" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(29,279) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="60" y="286" class="d-ntitle">索引ストア</text><text x="60" y="301" class="d-nsub">全文索引 + ベクトル索引 + 閲覧できるグループ</text><text x="18" y="346" class="d-gtitle">取り込み(文書が変わるたび)</text><g class="k-n"><rect x="14" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(47,363) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="56" y="394" class="d-nsub" text-anchor="middle">文書置き場</text><path d="M100 380 H106" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M100 380 H106"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="108" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(141,363) scale(.75)" class="d-ico"><path d="M4 12h11M11 8l4 4-4 4M19 5v14"/></g></g><text x="150" y="394" class="d-nsub" text-anchor="middle">変換</text><path d="M194 380 H200" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M194 380 H200"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="202" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(235,363) scale(.75)" class="d-ico"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></g></g><text x="244" y="394" class="d-nsub" text-anchor="middle">分割</text><path d="M288 380 H294" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M288 380 H294"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="296" y="356" width="84" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/></g><g class="k-n"><g transform="translate(329,363) scale(.75)" class="d-ico"><path d="M10 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM17 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM12 7v5M12 12l-6 5M12 12l6 5"/></g></g><text x="338" y="394" class="d-nsub" text-anchor="middle">埋め込み</text><path d="M344 354 V318" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="0.5s" repeatCount="indefinite" path="M344 354 V318"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="0.5s" repeatCount="indefinite"/></circle><text x="334" y="340" class="d-nsub" text-anchor="end">差分だけ更新</text><g class="k-ok"><rect x="14" y="430" width="372" height="58" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="38" cy="459" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(29,450) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="60" y="457" class="d-ntitle">質問ログ・評価・監視</text><text x="60" y="472" class="d-nsub">質問・資料・答え・反応を残し、定期的に測る</text></svg><figcaption>図1 質問に答える経路と、文書を取り込む経路を、検索の索引でつなぐ。権限は索引のデータで絞り、ログと評価が全体を見る。</figcaption></figure>

- **質問の経路**:認証で誰かを確定し、質問サービスが検索して、権限で絞り、モデルに答えさせ、答えを検証して返す
- **取り込みの経路**:文書置き場の変更を検知して、変換、分割、埋め込みをして、索引を更新する
- **ログと評価**:どちらの経路も、記録を残し、評価セットで定期的に測る

## 取り込み:文書を最新に保つ

プロトタイプでは、文書を起動のたびに全部読み込みました。本番では、文書が変わったときだけ、その文書の分だけを作り直します。

- 文書の内容のハッシュを保存しておき、変わったものだけを再処理する
- 文書が消えたら、索引からも消す(消し忘れると、削除したはずの内容で答える)
- 文書ごとに、出典(パスやURL)、更新日、閲覧できるグループを一緒に持つ
- PDFやOfficeファイルは、先にテキストに変換する。表や図は崩れやすいので、変換結果を目で確かめる
- 分割は、見出しの構造を保つ。見出しをチャンクの先頭に付けると、検索で見つけやすくなる

```python ingest.py(索引のテーブル)
import hashlib
import re
import sqlite3

from rag import split  # 前の記事の分割関数

db = sqlite3.connect("index.db")
db.executescript("""
CREATE TABLE IF NOT EXISTS docs (path TEXT PRIMARY KEY, hash TEXT, groups TEXT);
CREATE TABLE IF NOT EXISTS chunks (id INTEGER PRIMARY KEY, path TEXT, ord INTEGER, text TEXT);
""")
```

```python ingest.py(差分取り込み)
# 取り込み: 変わった文書だけ作り直し、なくなった文書は索引から消す
def sync(files):  # files: {パス: (本文, 閲覧できるグループの集合)}
    changed = removed = 0
    for path, (text, groups) in files.items():
        digest = hashlib.sha256(text.encode()).hexdigest()
        row = db.execute("SELECT hash FROM docs WHERE path = ?", (path,)).fetchone()
        if row and row[0] == digest:
            continue  # 変わっていない
        db.execute("DELETE FROM chunks WHERE path = ?", (path,))
        for order, chunk in enumerate(split(text)):
            db.execute("INSERT INTO chunks (path, ord, text) VALUES (?, ?, ?)", (path, order, chunk))
        db.execute("INSERT OR REPLACE INTO docs VALUES (?, ?, ?)", (path, digest, ",".join(sorted(groups))))
        changed += 1  # ここで、このチャンクの埋め込みも計算し直す
    for (path,) in db.execute("SELECT path FROM docs").fetchall():
        if path not in files:
            db.execute("DELETE FROM chunks WHERE path = ?", (path,))
            db.execute("DELETE FROM docs WHERE path = ?", (path,))
            removed += 1
    db.commit()
    return changed, removed
```

埋め込みモデルを入れ替えると、既存のベクトルは使えなくなります。このときは、全文書のベクトルを作り直します。どのモデルで作ったベクトルかを、索引に記録しておくと、入れ替えのときに困りません。

## 権限は、検索の前に絞る

社内文書には、全員が見てよいものと、特定の部署だけが見てよいものが混ざります。ここで大事なのは、**権限の確認を、モデルに任せない**ことです。「この人には見せないで」とプロンプトに書いても、モデルが従う保証はありません。

<figure class="diagram"><svg viewBox="0 0 400 284" role="img" aria-labelledby="pp-t"><title id="pp-t">権限で絞る位置</title><defs><filter id="pp-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="pp-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="pp-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-d"><g class="k-d"><g transform="translate(9,9) scale(.75)" class="d-ico"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM4 4l16 16"/></g></g></g><text x="34" y="22" class="d-ntitle">よくない:検索のあとで隠す</text><g class="k-n"><rect x="8" y="34" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="69" cy="55" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(60,46) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="69" y="82" class="d-ntitle" text-anchor="middle">全文書を検索</text><path d="M132 70 H138" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M132 70 H138"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-d"><rect x="140" y="34" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="201" cy="55" r="13" class="d-badge"/></g><g class="k-d"><g transform="translate(192,46) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="201" y="82" class="d-ntitle" text-anchor="middle">モデルへ</text><text x="201" y="96" class="d-nsub" text-anchor="middle">検索結果すべて</text><path d="M264 70 H270" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M264 70 H270"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="272" y="34" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="333" cy="55" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(324,46) scale(.75)" class="d-ico"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM4 4l16 16"/></g></g><text x="333" y="82" class="d-ntitle" text-anchor="middle">答えから隠す</text><text x="333" y="96" class="d-nsub" text-anchor="middle">出力の段階で</text><text x="10" y="126" class="d-nsub">モデルは、見てはいけない文書を読んでしまっている</text><g class="k-ok"><g transform="translate(9,155) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="34" y="168" class="d-ntitle">よい:検索の前に絞る</text><g class="k-ok"><rect x="8" y="180" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="69" cy="201" r="13" class="d-badge"/></g><g class="k-ok"><g transform="translate(60,192) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="69" y="228" class="d-ntitle" text-anchor="middle">グループで絞る</text><text x="69" y="242" class="d-nsub" text-anchor="middle">権限を確認</text><path d="M132 216 H138" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M132 216 H138"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="140" y="180" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="201" cy="201" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(192,192) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="201" y="228" class="d-ntitle" text-anchor="middle">検索</text><text x="201" y="242" class="d-nsub" text-anchor="middle">見てよい文書だけ</text><path d="M264 216 H270" class="d-path" marker-end="url(#pp-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M264 216 H270"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="272" y="180" width="122" height="72" rx="11" class="d-node" filter="url(#pp-sh)"/><circle cx="333" cy="201" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(324,192) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="333" y="228" class="d-ntitle" text-anchor="middle">モデルへ</text><text x="333" y="242" class="d-nsub" text-anchor="middle">絞った結果だけ</text><text x="10" y="272" class="d-nsub">見てはいけない文書は、モデルに渡らない</text></svg><figcaption>図2 権限は、検索の対象を決める段階で適用する。モデルに「見せないで」と頼むのは、守りにならない。</figcaption></figure>

絞り込みは、検索の前(または検索と同時)に行います。見てはいけない文書は、そもそも検索の対象に入れません。

```python ingest.py(権限で絞る)
# 権限: 検索の前に、その人が見られるチャンクだけに絞る
def visible_chunks(user_groups):
    rows = db.execute("SELECT chunks.id, chunks.path, chunks.text, docs.groups FROM chunks JOIN docs USING (path)").fetchall()
    return [(i, path, text) for i, path, text, groups in rows if set(groups.split(",")) & set(user_groups)]
```

- 認証は、社内の既存の仕組み(SSOなど)に任せ、ユーザーのグループを取得する
- 権限が変わった(退職、異動)ときに、すぐ反映される経路を作る。索引側にグループをコピーしている場合は、同期の遅れが穴になる
- 「文書があること自体」を隠したいなら、「資料が見つかりません」という答え方も、権限で絞った結果に基づいて返す

## 検索の質を上げる

答えの品質は、ほとんど、検索で決まります。モデルに渡す資料が間違っていれば、どんなモデルでも正しく答えられません。

- **ハイブリッド検索**:単語の検索(固有名詞や型番に強い)と、ベクトルの検索(言い換えに強い)を両方使う
- **結果の統合**:2つの点数は比べられないので、順位だけを使って合わせる方法(RRF)がよく使われる
- **再ランキング**:上位数十件を、より精密な方法で並べ替えて、数件に絞る
- **メタデータで絞る**:部署、文書の種類、更新日などで、検索の範囲を狭める

```python ingest.py(順位で統合する)
# 検索結果の統合: 順位だけを使う(RRF)。単語検索とベクトル検索の点数は比べられないので、順位で合わせる
def rrf(rankings, k=60):
    score = {}
    for ranking in rankings:
        for rank, chunk_id in enumerate(ranking, start=1):
            score[chunk_id] = score.get(chunk_id, 0) + 1 / (k + rank)
    return sorted(score, key=score.get, reverse=True)
```

## 回答を作って、検証する

プロトタイプでは、モデルの答えをそのまま返しました。本番では、返す前に確認します。

- **引用の検証**:答えに付いた資料の番号が、実際に渡した資料の番号か確認する。番号がなければ、根拠のない答えとして扱う
- **答えない選択**:検索で何も見つからない、または関連が弱いときは、モデルを呼ばずに「分からない」と返す
- **出典の表示**:答えと一緒に、元の文書へのリンクを出す。人が原文を確かめられるようにする
- **プロンプトインジェクションへの備え**:文書の中の指示に従わせない。外部の人が書ける文書(問い合わせ、Wikiの編集)は、とくに警戒する

```python ingest.py(引用の検証)
# 引用の検証: 答えに付いた番号が、実際に渡した資料の番号か
def check_citations(answer, found_count):
    cited = {int(n) for n in re.findall(r"\[(\d+)\]", answer)}
    return bool(cited) and cited <= set(range(1, found_count + 1))
```

引用の番号が正しくても、内容が合っているとは限りません。番号の検証は最低限の確認で、内容の確認は、次の評価で行います。

## 評価:変えるたびに測る

分割の大きさ、検索の方法、モデル、プロンプトのどれかを変えると、品質が上がることも下がることもあります。感覚で判断せず、**同じ質問のセットで測って**比べます。

1. 実際の質問を、50〜100個集める(現場の人に聞くか、問い合わせの履歴を使う)
2. それぞれに、正解の根拠になる文書の部分を付ける
3. 変更のたびに、検索の成績(上位k件に正解が入った割合)を測る
4. 答えは、人が抜き取りで確認する。モデルに採点させる方法もあるが、モデルの採点も間違えるので、人の確認を併用する

```python ingest.py(検索の評価)
# 評価: 正解のチャンクが、上位k件に入っている質問の割合
def recall_at_k(cases, search, k=5):  # cases: [(質問, 正解のチャンクIDの集合)]
    hits = sum(1 for question, expected in cases if expected & set(search(question)[:k]))
    return hits / len(cases)
```

- 「資料にない質問」も、評価セットに入れる。正しく「分からない」と返せるかを測る
- 質問は、実際の利用で増やす。「役に立たなかった」の記録から、評価セットに足していく
- 数字が下がったら、直前の変更を戻せるようにしておく

## 運用:動かし続ける

| 項目 | 見るもの | 対応 |
| --- | --- | --- |
| 応答時間 | 検索とモデルの所要時間、待ち行列の長さ | 同時利用が増えたら、機材かモデルを見直す |
| 「分からない」の割合 | 急に増えたら、文書か検索の問題 | 取り込みの失敗、文書の欠けを調べる |
| フィードバック | 「役に立った/立たなかった」 | 立たなかった質問を、評価セットに足す |
| 取り込み | 失敗した文書、最終更新の時刻 | 失敗を通知する。古い索引のまま動かさない |
| ログ | 質問、見つけた資料、答え | 保存期間とアクセス権を決める |

- **ログの扱い**:質問や答えに、機密や個人情報が入ります。ログも、文書と同じ強さで守る
- **障害時**:モデルが止まっても、検索の結果(関連する文書の一覧)だけは返せるようにしておくと、完全に止まらない
- **更新**:モデル、埋め込みモデル、検索の設定を変えるときは、評価セットで測ってから切り替える
- **バックアップ**:索引は文書から作り直せるが、時間がかかる。作り直しにかかる時間を知っておく

## 確認リスト

- [ ] 利用者数、文書量、更新頻度、権限の単位を決めたか
- [ ] 文書の変更と削除が、決めた時間内に索引に反映されるか
- [ ] 権限での絞り込みを、検索の前に行っているか。モデルのプロンプトに頼っていないか
- [ ] 見てはいけない文書が答えに出ないことを、テストで確かめたか
- [ ] 評価セットがあり、変更のたびに測っているか。「資料にない質問」を含んでいるか
- [ ] 答えの引用を検証し、出典のリンクを出しているか
- [ ] ログの保存期間とアクセス権を決めたか
- [ ] モデルや検索が止まったときの動作を決めたか
- [ ] 誰が運用し、問題が出たときに誰が直すか決めたか
