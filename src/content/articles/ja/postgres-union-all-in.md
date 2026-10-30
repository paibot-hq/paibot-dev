---
title: "UNION ALLの上でIN (サブクエリ)を書いたら、57万行を歩いた:PostgreSQLの見積もりと、= ANY(ARRAY(...))"
description: "2つの表をUNION ALLで1つに見せたら、品番検索が4秒かかるようになった。手元で再現すると、INのせいで、プランナーが人気順の索引を全部歩いていた。見積もりの数字を読んで原因を確かめ、= ANY(ARRAY(...))で0.3 msに戻した記録。"
category: "backend"
tags: ["PostgreSQL","SQL","EXPLAIN","パフォーマンス"]
minutes: 10
type: "実践ガイド"
level: "EXPLAINを見たことがある人向け"
takeaway: "UNION ALLの上では、プランナーがIDの一意性を知らず、IN (サブクエリ)の結合を何十万行と見積もります。「人気順に少し歩けば足りる」と賭けて、全部を歩きました。IDを先に集める = ANY(ARRAY(...))にすると、主キーで引くだけになり、150 msが0.3 msになりました。"
order: 18
sources:
  - { title: "PostgreSQL 17 — Using EXPLAIN", url: "https://www.postgresql.org/docs/17/using-explain.html" }
  - { title: "PostgreSQL 17 — Subquery Expressions", url: "https://www.postgresql.org/docs/17/functions-subquery.html" }
  - { title: "PostgreSQL 17 — Row and Array Comparisons", url: "https://www.postgresql.org/docs/17/functions-comparisons.html" }
  - { title: "PostgreSQL 17 — pg_trgm", url: "https://www.postgresql.org/docs/17/pgtrgm.html" }
---

## 先に結果

同じ形の2つの表(50万件と7万件)を、`UNION ALL` のビューで1つに見せました。そのビューに対して、「品番に当たる商品を、人気順に30件」を、2通りに書いて比べた結果です。

<figure class="diagram"><svg viewBox="0 0 400 392" role="img" aria-labelledby="up-t"><title id="up-t">IN (サブクエリ)と = ANY(ARRAY(...))で、読んだ行の違い</title><defs><filter id="up-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="up-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="up-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="168" rx="14" fill="url(#up-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">IN (SELECT ...)</text><text x="24" y="48" class="d-nsub">見積もり:結合は330,600行。人気順に約50行読めば30件そろう</text><text x="24" y="66" class="d-nsub">実際:当たりは1件。人気順の索引を最後まで読んだ</text><clipPath id="up-c"><rect x="24" y="80" width="352" height="22" rx="7"/></clipPath><rect x="24" y="80" width="352" height="22" rx="7" class="d-tag"/><g clip-path="url(#up-c)"><rect x="24.0" y="80" width="308.8" height="22" class="d-seg-hist d-seg"/><rect x="332.8" y="80" width="43.2" height="22" class="d-seg-out d-seg"/></g><text x="24" y="122" class="d-nsub">読んだ行 570,000(items 500,000 + other_items 70,000)</text><g class="k-w"><rect x="24" y="136" width="120" height="22" rx="11" class="d-pill"/></g><text x="84" y="151" class="d-tagtext" text-anchor="middle">144〜157 ms</text><rect x="8" y="192" width="384" height="190" rx="14" fill="url(#up-g)" class="d-group"/><text x="24" y="212" class="d-gtitle">= ANY (ARRAY(SELECT ...))</text><g class="k-n"><rect x="24" y="222" width="352" height="48" rx="11" class="d-node" filter="url(#up-sh)"/><circle cx="48" cy="246" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,237) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="70" y="244" class="d-ntitle">① 候補のIDを、先に1回だけ集める</text><text x="70" y="259" class="d-nsub">InitPlan。結果は1件の配列</text><path d="M200 272 V282" class="d-path" marker-end="url(#up-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0s" repeatCount="indefinite" path="M200 272 V282"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="284" width="352" height="48" rx="11" class="d-node" filter="url(#up-sh)"/><circle cx="48" cy="308" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,299) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="306" class="d-ntitle">② 両方の表を、主キーで引く</text><text x="70" y="321" class="d-nsub">id = ANY(配列) が各表に押し込まれる</text><g class="k-ok"><rect x="24" y="344" width="120" height="22" rx="11" class="d-pill"/></g><text x="84" y="359" class="d-tagtext" text-anchor="middle">0.31〜0.39 ms</text></svg><figcaption>図1 同じ意味のクエリを、5回ずつ実行した結果。INでは、プランナーが結合を大きく見積もり、人気順に読み進める賭けをして外した。</figcaption></figure>

| 書き方 | 実行時間(5回) | 読んだ行 |
| --- | --- | --- |
| `id IN (SELECT ...)` | 144〜157 ms | 570,000行(人気順の索引を全部) |
| `id = ANY (ARRAY(SELECT ...))` | 0.31〜0.39 ms | 1行(主キーで引く) |
| 参考:表が1つで `IN` | 0.22〜0.30 ms | 1行 |

当たるのは1件だけなのに、`IN` では、2つの表の全行を人気順に読んでいました。同じ `IN` でも、表が1つなら速いままでした。**UNION ALL の上で書いたこと**が、引き金になっています。

実際のサービスでは、JSONの大きな列と日本語の全文検索の索引があるので、差はもっと大きく出ました。本番と同じデータで、品番の検索が4秒かかっていたのが、`= ANY(ARRAY(...))` に直して46 msになりました。

## 何が起きたか

ある商品カタログでは、本体の商品を `items`、別の分類の商品を `other_items` に分けて持っています。検索の画面は両方を区別しないので、`UNION ALL` で1つに見せたビュー `catalog` を読みます。

品番の検索は、表記の揺れ(`VGS-12345`、`vgs12345` など)を吸収するため、「当たる可能性のある書き方」をいくつか `UNION` で集めて、その中のIDに絞ります。最初は、素直に `IN` で書きました。

```sql 遅かった書き方
SELECT p.id FROM catalog p
WHERE p.active AND p.id IN (
  SELECT id FROM catalog WHERE search_text LIKE '%vgs-12345%'
  UNION SELECT id FROM catalog WHERE search_text LIKE '%vgs12345%'
  UNION SELECT id FROM catalog WHERE code = 'vgs12345')
ORDER BY COALESCE(p.rank, 2147483647), p.released DESC, p.id
LIMIT 30;
```

`EXPLAIN ANALYZE` の要点は、次のとおりです(索引の細部は省いています)。

```text 遅かったプラン(抜粋)
Limit (actual rows=1 loops=1)
  ->  Nested Loop (actual rows=1 loops=1)
        Join Filter: (items.id = items_1.id)
        Rows Removed by Join Filter: 569999
        ->  Merge Append (actual rows=570000 loops=1)
              Sort Key: (COALESCE(items.rank, 2147483647)), items.released DESC, items.id
              ->  Index Scan using items_coalesce_released_id_idx on items (actual rows=500000 loops=1)
              ->  Index Scan using other_items_coalesce_released_id_idx on other_items (actual rows=70000 loops=1)
        ->  Materialize (actual rows=1 loops=570000)
              ->  Unique (actual rows=1 loops=1)
                    ...(品番の候補を集める部分。ここは速い)
Execution Time: 179.686 ms
```

- 外側は、2つの表の人気順の索引を、`Merge Append` で混ぜながら、上から順に読んでいる
- 1行ごとに、品番の候補(1件)と照らし合わせ、569,999行を捨てている
- 30件そろったら止まるつもりだったが、1件しかないので、最後まで読んだ

## なぜ、この賭けを選んだのか

プランナーの見積もりを見ると、理由が分かります(`ANALYZE` を外した `EXPLAIN`)。

```text 見積もり
Limit  (cost=743.11..835.88 rows=30 width=15)
  ->  Nested Loop  (cost=743.11..1023116.75 rows=330600 width=15)
        ->  Merge Append  (cost=0.85..35447.86 rows=570000 width=15)
        ->  Materialize  (cost=742.26..743.42 rows=116 width=32)
```

- 品番の候補は、116件と見積もった(実際は1件)
- 結合の結果は、**330,600行**と見積もった。これは、116 × 570,000 × 0.005 とぴったり同じ
- 0.005は、PostgreSQLが、統計から選択率を出せないときに使う既定の値。UNION ALLで混ぜた `id` について、「一意で、1つのIDには1行しかない」ことを、プランナーは使えていない

33万行も当たるなら、人気順に上から読めば、30件はすぐにそろうはずです。570,000行のうち、30 ÷ 330,600 の割合、つまり50行ほど読めば済む計算で、`Limit` のコストが835と小さく出ています。その賭けが、1件しか当たらない検索で外れました。

表が1つなら、`id` は主キーなので、プランナーは「1つのIDに1行」を知っています。だから、候補のIDから主キーで引くプランを選び、速いままでした。

## 直し方:= ANY(ARRAY(...))

`IN` を、`= ANY (ARRAY(...))` に書き換えます。

```sql 速くなった書き方
SELECT p.id FROM catalog p
WHERE p.active AND p.id = ANY (ARRAY(
  SELECT id FROM catalog WHERE search_text LIKE '%vgs-12345%'
  UNION SELECT id FROM catalog WHERE search_text LIKE '%vgs12345%'
  UNION SELECT id FROM catalog WHERE code = 'vgs12345'))
ORDER BY COALESCE(p.rank, 2147483647), p.released DESC, p.id
LIMIT 30;
```

```text 速くなったプラン(抜粋)
Limit (actual rows=1 loops=1)
  InitPlan 1
    ->  Unique (actual rows=1 loops=1)
          ...(品番の候補を集める部分)
  ->  Sort (actual rows=1 loops=1)
        ->  Append (actual rows=1 loops=1)
              ->  Index Scan using items_pkey on items (actual rows=1 loops=1)
                    Index Cond: (id = ANY ((InitPlan 1).col1))
              ->  Index Scan using other_items_pkey on other_items (actual rows=0 loops=1)
                    Index Cond: (id = ANY ((InitPlan 1).col1))
Execution Time: 0.513 ms
```

- `ARRAY(サブクエリ)` は、**先に1回だけ**実行される(`InitPlan`)。結果は、IDの配列という1つの値になる
- 外側から見ると、`id = ANY(配列)` は、ただの条件。結合ではないので、結合の行数を見積もる必要がない
- その条件は、UNION ALLのそれぞれの表に押し込まれ、各表の主キーで引く

意味は同じです。違うのは、プランナーに「結合として計画させるか」「先に値を作って、条件として渡すか」です。

## 自分の環境で再現する

PostgreSQL 17.11 と、標準の拡張 pg_trgm だけで再現できます。使い捨てのデータベースで実行してください。

```sql setup.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- 50万件と7万件の、同じ形の2つの表。500件に1件だけ、人気順位がある
CREATE TABLE items (id text PRIMARY KEY, code text NOT NULL, released date NOT NULL,
  rank int, active boolean NOT NULL DEFAULT true, search_text text NOT NULL);
CREATE TABLE other_items (LIKE items INCLUDING ALL);
INSERT INTO items
SELECT 'p' || i, code, date '2010-01-01' + i % 6000, CASE WHEN i % 500 = 0 THEN i / 500 END, true,
       code || ' title ' || i
FROM generate_series(1, 500000) i,
     LATERAL (SELECT chr(97 + i % 26) || chr(97 + i / 26 % 26) || chr(97 + i / 676 % 26)
                     || lpad((i % 99999)::text, 5, '0') AS code) c;
INSERT INTO other_items
SELECT 'o' || i, 'zz' || i, date '2015-01-01' + i % 4000, CASE WHEN i % 100 = 0 THEN 1000 + i / 100 END, true,
       'zz' || i || ' other ' || i
FROM generate_series(1, 70000) i;
-- どちらの表にも、同じ索引を張る
CREATE INDEX ON items (code);
CREATE INDEX ON other_items (code);
CREATE INDEX ON items (COALESCE(rank, 2147483647), released DESC, id) WHERE active;
CREATE INDEX ON other_items (COALESCE(rank, 2147483647), released DESC, id) WHERE active;
CREATE INDEX ON items USING gin (search_text gin_trgm_ops);
CREATE INDEX ON other_items USING gin (search_text gin_trgm_ops);
-- 2つの表を、1つに見せる
CREATE VIEW catalog AS
  SELECT id, code, released, rank, active, search_text FROM items
  UNION ALL
  SELECT id, code, released, rank, active, search_text FROM other_items;
VACUUM ANALYZE;
```

そのあと、上の2つのクエリの先頭に `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)` を付けて実行します。`IN` のほうで `Merge Append (actual rows=570000` が出れば、再現できています。

- 測った環境:PostgreSQL 17.11(Docker、Apple Silicon)。時間は環境で変わるが、読む行数の差は変わらない
- データの作り方や件数を変えると、プランナーが別のプランを選ぶこともある。たとえば、品番の候補を `code = '...'` の1つだけにすると、`IN` でも速いプランになった

## UNION ALLの上で書くときの、ほかの注意

同じ理由で、UNION ALLの上では、プランナーが表ごとの事情を使いにくくなります。表の大きさも、当たる行の割合も、2つの表でまるで違うのに、1つの見積もりで計画することになるからです。

そこで、別のサイトで2つの表を混ぜて検索するときは、最初から次の形で書きました。

- **表ごとに、同じ条件、同じ並び、同じ `LIMIT` のクエリを書く**:それぞれの表が、その表だけを相手にしたときのプラン(人気順の索引、ベクトルの索引など)を使える
- **短い結果どうしを、外側で並べ直す**:2つの表の結果は、多くても `LIMIT` の2倍なので、並べ直しは軽い

```sql 表ごとに並べてから混ぜる
SELECT id FROM (
  (SELECT id, rank, released FROM items p WHERE <条件> ORDER BY <並び> LIMIT 10)
  UNION ALL
  (SELECT id, rank, released FROM other_items p WHERE <条件> ORDER BY <並び> LIMIT 10)
) r
ORDER BY <並び> LIMIT 10;
```

各表から10件ずつ取れば、合わせた上位10件は、必ずその中にあります。ただし、この形がいつも速いとは限りません。似た合成データで、条件の重い検索を比べたときは、UNION ALLのままでも表ごとでも1 ms前後で、大きな差は出ませんでした。効くかどうかは、`EXPLAIN ANALYZE` で確かめてください。

## チェックリスト

- [ ] UNION ALLのビューや副問い合わせに、`IN (SELECT ...)` で絞り込んでいないか
- [ ] `EXPLAIN` の結合の `rows=` が、現実より桁違いに大きくないか(統計がない既定の0.005が使われていないか)
- [ ] `ORDER BY ... LIMIT` の下に、`Merge Append` で全行を読む索引走査がないか
- [ ] 候補が少ないと分かっているなら、`= ANY (ARRAY(...))` で、先に値を作って渡しているか
- [ ] 表ごとに書いたほうが、それぞれの表の索引を使えないか
- [ ] 直したら、遅かった入力と、いつもの入力の両方で、`EXPLAIN ANALYZE` を取り直したか
