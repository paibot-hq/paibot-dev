---
title: "IN (subquery) over UNION ALL read 570,000 rows: PostgreSQL's estimates, and = ANY(ARRAY(...))"
description: "After two tables were shown as one through UNION ALL, a product-code search took 4 seconds. Reproduced locally, IN made the planner walk the whole popularity index. A record of reading the estimates to find the cause, and getting back to 0.3 ms with = ANY(ARRAY(...))."
category: "backend"
tags: ["PostgreSQL","SQL","EXPLAIN","Performance"]
minutes: 10
type: "Hands-on guide"
level: "For people who have looked at EXPLAIN"
takeaway: "Over UNION ALL, the planner does not know the IDs are unique and estimates an IN (subquery) join at hundreds of thousands of rows. It bet that reading a little in popularity order would be enough, and read everything. With = ANY(ARRAY(...)), which collects the IDs first, it only looks up primary keys: 150 ms became 0.3 ms."
order: 18
sources:
  - { title: "PostgreSQL 17 — Using EXPLAIN", url: "https://www.postgresql.org/docs/17/using-explain.html" }
  - { title: "PostgreSQL 17 — Subquery Expressions", url: "https://www.postgresql.org/docs/17/functions-subquery.html" }
  - { title: "PostgreSQL 17 — Row and Array Comparisons", url: "https://www.postgresql.org/docs/17/functions-comparisons.html" }
  - { title: "PostgreSQL 17 — pg_trgm", url: "https://www.postgresql.org/docs/17/pgtrgm.html" }
---

## The results first

Two tables of the same shape (500,000 and 70,000 rows) were shown as one through a `UNION ALL` view. On that view, “the 30 most popular products matching a product code” was written in two ways and compared.

<figure class="diagram"><svg viewBox="0 0 400 392" role="img" aria-labelledby="up-t"><title id="up-t">Rows read by IN (subquery) and = ANY(ARRAY(...))</title><defs><filter id="up-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="up-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="up-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="168" rx="14" fill="url(#up-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">IN (SELECT ...)</text><text x="24" y="48" class="d-nsub">Estimate: 330,600 joined rows; ~50 in rank order give 30</text><text x="24" y="66" class="d-nsub">Actual: one match, so it read the whole rank index</text><clipPath id="up-c"><rect x="24" y="80" width="352" height="22" rx="7"/></clipPath><rect x="24" y="80" width="352" height="22" rx="7" class="d-tag"/><g clip-path="url(#up-c)"><rect x="24.0" y="80" width="308.8" height="22" class="d-seg-hist d-seg"/><rect x="332.8" y="80" width="43.2" height="22" class="d-seg-out d-seg"/></g><text x="24" y="122" class="d-nsub">Rows read: 570,000 (items 500,000 + other_items 70,000)</text><g class="k-w"><rect x="24" y="136" width="120" height="22" rx="11" class="d-pill"/></g><text x="84" y="151" class="d-tagtext" text-anchor="middle">144–157 ms</text><rect x="8" y="192" width="384" height="190" rx="14" fill="url(#up-g)" class="d-group"/><text x="24" y="212" class="d-gtitle">= ANY (ARRAY(SELECT ...))</text><g class="k-n"><rect x="24" y="222" width="352" height="48" rx="11" class="d-node" filter="url(#up-sh)"/><circle cx="48" cy="246" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,237) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="70" y="244" class="d-ntitle">1. Collect the candidate IDs once, first</text><text x="70" y="259" class="d-nsub">an InitPlan; an array of one ID</text><path d="M200 272 V282" class="d-path" marker-end="url(#up-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1s" repeatCount="indefinite" path="M200 272 V282"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="284" width="352" height="48" rx="11" class="d-node" filter="url(#up-sh)"/><circle cx="48" cy="308" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,299) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="306" class="d-ntitle">2. Look up both tables by primary key</text><text x="70" y="321" class="d-nsub">id = ANY(array) is pushed into each table</text><g class="k-ok"><rect x="24" y="344" width="120" height="22" rx="11" class="d-pill"/></g><text x="84" y="359" class="d-tagtext" text-anchor="middle">0.31–0.39 ms</text></svg><figcaption>Figure 1 The same query in two forms, five runs each. With IN, the planner estimated a huge join, bet on reading in rank order, and lost.</figcaption></figure>

| Form | Time (5 runs) | Rows read |
| --- | --- | --- |
| `id IN (SELECT ...)` | 144–157 ms | 570,000 (the whole popularity index) |
| `id = ANY (ARRAY(SELECT ...))` | 0.31–0.39 ms | 1 (by primary key) |
| For reference: `IN` on one table | 0.22–0.30 ms | 1 |

Only one product matches, yet `IN` read every row of both tables in popularity order. The same `IN` on a single table stayed fast. **Writing it over UNION ALL** is what set it off.

In the real service, with large JSON columns and a Japanese full-text index, the gap was bigger. On the same data as production, a product-code search took 4 seconds, and 46 ms after the change to `= ANY(ARRAY(...))`.

## What happened

A product catalog keeps its main products in `items` and another category in `other_items`. The search page does not tell them apart, so it reads `catalog`, a view that shows both as one through `UNION ALL`.

To absorb different ways of writing a code (`VGS-12345`, `vgs12345` and so on), the code search collects several “spellings that might match” with `UNION`, and narrows to those IDs. At first it was written plainly with `IN`.

```sql The slow form
SELECT p.id FROM catalog p
WHERE p.active AND p.id IN (
  SELECT id FROM catalog WHERE search_text LIKE '%vgs-12345%'
  UNION SELECT id FROM catalog WHERE search_text LIKE '%vgs12345%'
  UNION SELECT id FROM catalog WHERE code = 'vgs12345')
ORDER BY COALESCE(p.rank, 2147483647), p.released DESC, p.id
LIMIT 30;
```

The key part of `EXPLAIN ANALYZE` (index details left out):

```text The slow plan (excerpt)
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
                    ...(collecting the code candidates; this part is fast)
Execution Time: 179.686 ms
```

- The outer side reads both tables' popularity indexes from the top, mixing them with `Merge Append`
- Each row is checked against the code candidates (one row), and 569,999 rows are thrown away
- It meant to stop after 30 matches, but there was only one, so it read to the end

## Why it made that bet

The planner's estimates show why (`EXPLAIN` without `ANALYZE`).

```text Estimates
Limit  (cost=743.11..835.88 rows=30 width=15)
  ->  Nested Loop  (cost=743.11..1023116.75 rows=330600 width=15)
        ->  Merge Append  (cost=0.85..35447.86 rows=570000 width=15)
        ->  Materialize  (cost=742.26..743.42 rows=116 width=32)
```

- It estimated 116 code candidates (actually 1)
- It estimated the join at **330,600 rows**, exactly 116 × 570,000 × 0.005
- 0.005 is the default PostgreSQL uses when statistics cannot give a selectivity. For the `id` mixed by UNION ALL, the planner cannot use the fact that it is unique, one row per ID

If 330,000 rows matched, reading from the top in popularity order would fill 30 quickly: about 30 ÷ 330,600 of 570,000 rows, around 50 rows. That is why the `Limit` cost comes out as small as 835. The bet lost on a search with one match.

On a single table, `id` is the primary key and the planner knows there is one row per ID. So it chose to look up the candidate IDs by primary key, and stayed fast.

## The fix: = ANY(ARRAY(...))

Rewrite `IN` as `= ANY (ARRAY(...))`.

```sql The fast form
SELECT p.id FROM catalog p
WHERE p.active AND p.id = ANY (ARRAY(
  SELECT id FROM catalog WHERE search_text LIKE '%vgs-12345%'
  UNION SELECT id FROM catalog WHERE search_text LIKE '%vgs12345%'
  UNION SELECT id FROM catalog WHERE code = 'vgs12345'))
ORDER BY COALESCE(p.rank, 2147483647), p.released DESC, p.id
LIMIT 30;
```

```text The fast plan (excerpt)
Limit (actual rows=1 loops=1)
  InitPlan 1
    ->  Unique (actual rows=1 loops=1)
          ...(collecting the code candidates)
  ->  Sort (actual rows=1 loops=1)
        ->  Append (actual rows=1 loops=1)
              ->  Index Scan using items_pkey on items (actual rows=1 loops=1)
                    Index Cond: (id = ANY ((InitPlan 1).col1))
              ->  Index Scan using other_items_pkey on other_items (actual rows=0 loops=1)
                    Index Cond: (id = ANY ((InitPlan 1).col1))
Execution Time: 0.513 ms
```

- `ARRAY(subquery)` runs **once, first** (an `InitPlan`). Its result is a single value, an array of IDs
- Seen from outside, `id = ANY(array)` is just a condition. It is not a join, so no join size has to be estimated
- The condition is pushed into each table of the UNION ALL, which looks it up by primary key

The meaning is the same. What differs is whether the planner plans a join, or gets a value made first and passed in as a condition.

## Reproduce it yourself

PostgreSQL 17.11 and the standard pg_trgm extension are enough. Run it in a throwaway database.

```sql setup.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Two tables of the same shape, 500,000 and 70,000 rows; one row in 500 has a popularity rank
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
-- The same indexes on both tables
CREATE INDEX ON items (code);
CREATE INDEX ON other_items (code);
CREATE INDEX ON items (COALESCE(rank, 2147483647), released DESC, id) WHERE active;
CREATE INDEX ON other_items (COALESCE(rank, 2147483647), released DESC, id) WHERE active;
CREATE INDEX ON items USING gin (search_text gin_trgm_ops);
CREATE INDEX ON other_items USING gin (search_text gin_trgm_ops);
-- Show the two tables as one
CREATE VIEW catalog AS
  SELECT id, code, released, rank, active, search_text FROM items
  UNION ALL
  SELECT id, code, released, rank, active, search_text FROM other_items;
VACUUM ANALYZE;
```

Then run the two queries above with `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)` in front. If the `IN` form shows `Merge Append (actual rows=570000`, you have reproduced it.

- Measured on PostgreSQL 17.11 (Docker, Apple Silicon). Times depend on the machine; the difference in rows read does not
- Changing how the data is made, or the row counts, can make the planner choose another plan. For example, with a single candidate `code = '...'`, even `IN` got the fast plan

## Other things to watch over UNION ALL

For the same reason, over UNION ALL the planner finds it harder to use what it knows about each table. The tables differ greatly in size and in the share of rows that match, yet they are planned with one estimate.

So when another site had to search two tables mixed together, we wrote it in this form from the start.

- **Write one query per table, with the same conditions, order and `LIMIT`**: each table can use the plan it would get on its own (a popularity index, a vector index and so on)
- **Merge the short results outside**: the two results hold at most twice the `LIMIT`, so re-sorting is cheap

```sql Sort per table, then merge
SELECT id FROM (
  (SELECT id, rank, released FROM items p WHERE <conditions> ORDER BY <order> LIMIT 10)
  UNION ALL
  (SELECT id, rank, released FROM other_items p WHERE <conditions> ORDER BY <order> LIMIT 10)
) r
ORDER BY <order> LIMIT 10;
```

Taking 10 rows from each table guarantees that the overall top 10 are among them. This form is not always faster, though. On similar synthetic data, a search with heavy conditions took around 1 ms either way, with no real difference. Check with `EXPLAIN ANALYZE` whether it helps.

## Checklist

- [ ] You do not narrow a UNION ALL view or subquery with `IN (SELECT ...)`
- [ ] The join's `rows=` in `EXPLAIN` is not orders of magnitude above reality (the default 0.005 is not being used for lack of statistics)
- [ ] There is no index scan under `ORDER BY ... LIMIT` that reads every row through `Merge Append`
- [ ] When you know the candidates are few, you build the value first with `= ANY (ARRAY(...))`
- [ ] A query per table would not let each table use its own indexes better
- [ ] After a fix, you took `EXPLAIN ANALYZE` again for both the slow input and the usual ones
