---
title: "Our Cloudflare bill hit $230: finding D1 full-text search and AI crawlers with the cf CLI, and stopping them"
description: "A Workers Paid plan that should cost $5 a month came to about $230. Breaking it down with the cf CLI and the GraphQL Analytics API pointed to D1 rows read and AI training crawlers. A record of blocking search engines by mistake while trying to block only training crawlers, and of naming the crawlers in a WAF custom rule instead."
category: "infra"
tags: ["Cloudflare","D1","Workers","WAF","AI crawlers"]
minutes: 10
type: "Investigation record"
level: "For people running a site on Cloudflare Workers or Pages"
takeaway: "Usage billing comes down to how often the function runs and how many rows the database reads. Split the GraphQL Analytics API by day and by User-Agent and the cause shows up. Block AI training crawlers by naming them in a WAF custom rule that excludes search engines, not with Cloudflare's blanket “training” setting."
order: 22
sources:
  - { title: "Cloudflare D1 — Pricing", url: "https://developers.cloudflare.com/d1/platform/pricing/" }
  - { title: "Cloudflare Workers — Pricing", url: "https://developers.cloudflare.com/workers/platform/pricing/" }
  - { title: "Cloudflare GraphQL Analytics API", url: "https://developers.cloudflare.com/analytics/graphql-api/" }
  - { title: "Cloudflare — Block AI bots", url: "https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/" }
  - { title: "AI Crawl Control — Manage AI crawlers", url: "https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/" }
  - { title: "Cloudflare — Verified bots", url: "https://developers.cloudflare.com/bots/concepts/bot/verified-bots/" }
  - { title: "Rules language — cf.verified_bot_category", url: "https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.verified_bot_category/" }
---

## The results first

We run a product catalog site on Workers Paid (\$5 a month): Next.js on Pages Functions, in five languages, with product pages and search pages. One month, the dashboard's Billable Usage showed about \$230.

<figure class="diagram"><svg viewBox="0 0 400 352" role="img" aria-labelledby="cb-t"><title id="cb-t">Where a request is billed, and where to stop it</title><defs><filter id="cb-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="cb-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="cb-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="24" y="8" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="32" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,23) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="70" y="30" class="d-ntitle">Crawlers and visitors</text><text x="70" y="45" class="d-nsub">1.44M a day; about 80% AI training</text><path d="M200 58 V102" class="d-path" marker-end="url(#cb-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M200 58 V102"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><rect x="8" y="74" width="384" height="268" rx="14" fill="url(#cb-g)" class="d-group"/><text x="24" y="94" class="d-gtitle">CLOUDFLARE</text><g class="k-ok"><rect x="24" y="104" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="128" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,119) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="70" y="126" class="d-ntitle">WAF custom rule</text><text x="70" y="141" class="d-nsub">name training bots by UA → 403</text><path d="M200 154 V196" class="d-path" marker-end="url(#cb-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M200 154 V196"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="220" y="164" width="156" height="22" rx="11" class="d-pill"/></g><text x="298" y="179" class="d-tagtext" text-anchor="middle">stopped here: $0</text><g class="k-w"><rect x="24" y="198" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="222" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(39,213) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="220" class="d-ntitle">Pages Functions (SSR)</text><text x="70" y="235" class="d-nsub">billed by requests and CPU time</text><g class="k-w"><rect x="310" y="211" width="56" height="22" rx="11" class="d-pill"/></g><text x="338" y="226" class="d-tagtext" text-anchor="middle">$21</text><path d="M200 248 V280" class="d-path" marker-end="url(#cb-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1.5s" repeatCount="indefinite" path="M200 248 V280"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-d"><rect x="24" y="282" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="306" r="14" class="d-badge"/></g><g class="k-d"><g transform="translate(39,297) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="304" class="d-ntitle">D1 (SQLite)</text><text x="70" y="319" class="d-nsub">billed by rows read: 228.8B</text><g class="k-d"><rect x="310" y="295" width="56" height="22" rx="11" class="d-pill"/></g><text x="338" y="310" class="d-tagtext" text-anchor="middle">$204</text></svg><figcaption>Figure 1 You pay when the function runs and when D1 reads rows. Stop a request at the WAF, before the function, and it costs nothing.</figcaption></figure>

| Item | Used | Included | Cost |
| --- | --- | --- | --- |
| D1 rows read | 228.8 billion | 25 billion | \$203.84 |
| Workers CPU time | 781.04 million ms | 30 million ms | \$15.04 |
| Workers requests | 30.33 million | 10 million | \$6.30 |
| Workers Paid base | | | \$5 |

There were two causes.

- **D1**: on just two days, full-text search queries ran about 5.8 million times and read about 39,000 rows each on average. Those two days cost about \$200
- **Workers**: about 80% of the traffic was AI training crawlers (ClaudeBot, GPTBot and others). Every request ran the function, so it was billed for CPU time and requests

We stopped D1 by moving full-text search to PostgreSQL, and stopped the crawlers with a WAF custom rule that names them, before the function runs. Along the way we used Cloudflare's “block AI training crawlers” setting and **got Googlebot and Bingbot a 403 too**, so that is in here as well.

## Breaking the bill down with the cf CLI

We started with Cloudflare's official CLI (`cf`). It returns the plans you are subscribed to.

```bash
export CLOUDFLARE_ACCOUNT_ID=<account id>
cf accounts subscriptions get | jq -r '.[] | [.rate_plan.public_name, .price] | @tsv'
```

Usage and billing history (`cf billing usage get-v1`, `cf accounts billing history list`), though, returned 403 with the OAuth login token, even with every scope granted. The final amount is only in the dashboard.

So we pulled per-product usage from the **GraphQL Analytics API**, which accepts the same OAuth token as the cf login.

```bash
TOKEN=$(jq -r .oauth_token ~/Library/Preferences/cloudflare/config/default.json)
curl -s https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data @query.json
```

```text The query in query.json (the key parts)
viewer { accounts(filter: { accountTag: $a }) {
  d1AnalyticsAdaptiveGroups(filter: { date_geq: $s, date_leq: $e }, orderBy: [date_ASC]) {
    sum { readQueries rowsRead rowsWritten } dimensions { date databaseId } }
  workersInvocationsAdaptive(filter: { date_geq: $s, date_leq: $e }) {
    sum { requests cpuTimeUs } dimensions { scriptName } }
  pagesFunctionsInvocationsAdaptiveGroups(filter: { date_geq: $s, date_leq: $e }) {
    sum { requests } dimensions { date scriptName } }
} }
```

Lay it out **by day** and the cause is obvious. D1 normally read about 200 million rows a day, but on two days it read 91.3 billion and 134.4 billion. Pages Functions requests grew from 220,000 to 3.9 million a day over two weeks.

> The analytics numbers do not match the bill exactly. D1 rows matched to the row, but CPU time came out at about a fifth of the bill, and requests came out high because they included free static assets. Good enough to find the cause; check the amounts in the dashboard.

## D1: a search that read 228.8 billion rows in two days

D1 bills by **rows read**, not rows returned. Scan a table without an index and every row counts.

Sorting `d1QueriesAdaptiveGroups` by rows read put two full-text search (FTS5) queries at the top.

```sql The top two queries (112.6 billion and 83.5 billion rows read)
SELECT COUNT(*) AS total FROM (SELECT 1 FROM CatalogProducts p
  WHERE p.active = 1 AND p.id IN (SELECT rowid FROM CatalogSearch WHERE CatalogSearch MATCH ?) LIMIT ?);

SELECT p.data_json FROM CatalogProducts p
  WHERE p.active = 1 AND p.id IN (SELECT rowid FROM CatalogSearch WHERE CatalogSearch MATCH ?)
  ORDER BY COALESCE(p.popularity_rank, 2147483647) ...;
```

Each search sends two statements, a count and one page of results, and for common words both read tens of thousands of rows. These two alone were about 86% of the rows read in those two days. The keyword is in the search page URL, so crawlers following links can call it almost without limit.

This service also needed Japanese full-text search and vector search, so the catalog moved to PostgreSQL ([Using your own PostgreSQL from Cloudflare Workers](../workers-own-postgres/)). Since then D1 has read zero rows a day.

## The daily \$2: 80% of the traffic was AI crawlers

With D1 stopped, Workers still cost about \$2 a day. The dashboard's breakdown for one day was \$1.20 of CPU time and \$0.90 of requests.

We split the zone's `httpRequestsAdaptiveGroups` by User-Agent. The Free plan can query the last few days.

| User-Agent | Requests in 24 hours | Share |
| --- | --- | --- |
| ClaudeBot (Anthropic) | 849,000 | 59% |
| GPTBot (OpenAI) | 213,000 | 15% |
| ExaSearchBot | 82,000 | 6% |
| Amazonbot, bingbot, Semrush and others | about 80,000 | 6% |
| People's browsers | tens of thousands | under 10% |

The crawlers were walking every product page and search page in all five languages. There were so many URL combinations that the same URL rarely came twice, so the edge cache barely helped and the function rendered the page every time, at about 24 ms of CPU per request.

ClaudeBot and GPTBot are **AI training** crawlers. The crawlers behind AI search answers are different (OAI-SearchBot, Claude-SearchBot, PerplexityBot), and so are the ones that fetch a URL a user pastes (ChatGPT-User, Claude-User). Blocking training crawlers does not cost search traffic, so we decided to **block only training crawlers**.

## Choosing how to block

| Method | Where it stops | Takes effect | Bots that ignore it |
| --- | --- | --- | --- |
| `Disallow` in robots.txt | the bot obeys it | when re-read (about a day) | not stopped |
| Cloudflare `ai_training: block` | the edge | immediately | stopped |
| WAF custom rule (name the UA) | the edge | immediately | stopped if the name matches |

Stopping at the edge means the function never runs, so nothing is billed. We also listed the training crawlers in robots.txt, as a backup in case the Cloudflare setting is ever removed.

```text robots.txt (top)
User-agent: ClaudeBot
Disallow: /

User-agent: GPTBot
Disallow: /

...

User-agent: *
Allow: /
```

We nearly disallowed search pages for every crawler, then backed out. Maker and genre links on product pages lead to search pages, so the search pages double as category pages. We would have removed our own entry points from web search.

## The mistake: `ai_training: block` stopped search engines too

First we blocked training crawlers as a group, in the zone's bot settings.

```bash
cf bot-management update -z <domain> --ai-training block --fight-mode true --enable-js true
```

> The documentation does not say whether this PUT keeps fields you leave out. We sent Bot Fight Mode and JS detections with their current values, then diffed the settings before and after to confirm only `ai_training` had changed.

ClaudeBot and GPTBot got 403 right away. But in the same minutes, **real bingbot (157.55.x, 52.167.x) and Googlebot (66.249.x) got 403 too**. The `securitySource` was `firewallManaged`, one of Cloudflare's managed rules.

The documentation says Training also covers “mixed-purpose crawlers used for both Training and Search.” Which bots count as mixed-purpose is not visible on Free or Pro. We noticed about five minutes in, set `--ai-training disabled` again, and confirmed that the settings matched the originals and that bingbot and Googlebot were back to 200.

**When you change a setting, check the bots you meant to keep as well as the ones you meant to stop.** That was the main lesson.

## Naming crawlers in a WAF custom rule

Instead of relying on Cloudflare's classification, name the bots yourself. Setting a crawler to Block in the dashboard's AI Crawl Control also creates a WAF custom rule (on Free it matches the User-Agent string). We created ours directly with the cf CLI.

```text Expression (action: Block)
(http.user_agent contains "ClaudeBot" or http.user_agent contains "GPTBot"
 or http.user_agent contains "CCBot" or http.user_agent contains "Bytespider"
 or http.user_agent contains "Amazonbot" or http.user_agent contains "meta-externalagent")
and not cf.verified_bot_category in {"Search Engine Crawler"}
```

The last line is a safeguard. Googlebot's and Bingbot's User-Agents do not contain these names, but this keeps verified search engines out even if a classification changes. `cf.verified_bot_category` works in WAF rules on the Free plan.

```bash
# If the zone already has a custom ruleset, add a rule to it
cf rulesets rules create <ruleset id> -z <domain> --body "$(cat rule.json)"
# Otherwise, create the entry point
cf rulesets entrypoint update http_request_firewall_custom -z <domain> --body "$(jq '{rules:[.]}' rule.json)"
```

The Free plan allows five custom rules, so the conditions are joined with `or` into one.

## Checking it

A few minutes after adding the rule, split by User-Agent and response code. Include the bots you want to keep, not only the ones you want to stop.

```text The checking query (the key parts)
httpRequestsAdaptiveGroups(filter: { datetime_geq: $st, OR: [
    { userAgent_like: "%ClaudeBot%" }, { userAgent_like: "%GPTBot%" },
    { userAgent_like: "%bingbot%" }, { userAgent_like: "%Googlebot%" } ] }) {
  count dimensions { userAgent edgeResponseStatus securitySource } }
```

The three minutes after adding the rule (both domains combined):

| User-Agent | Response | Requests | Stopped by |
| --- | --- | --- | --- |
| ClaudeBot | 403 | 1,806 | `firewallCustom` (our rule) |
| GPTBot | 403 | 493 | `firewallCustom` |
| Amazonbot | 403 | 33 | `firewallCustom` |
| bingbot | 200 | 69 | nothing |

The bots we wanted stopped get 403 from `firewallCustom`, and bingbot stays at 200. A blocked request never runs the function, so it adds nothing to Workers requests or CPU time.

## Checklist

- When the bill goes up, first see which product it is in the dashboard's Billable Usage
- Split the GraphQL Analytics API by day, by script and by User-Agent
- D1 bills by rows read. A full-text count (`COUNT(*)`) is especially heavy
- Search pages with the keyword in the URL get crawled without limit
- AI crawlers have different names for training, search and user-triggered fetches. Block only training
- A blanket setting (`ai_training: block`) can sweep in search engines as mixed-purpose crawlers
- Name the crawlers in a WAF custom rule, and exclude search engines with `cf.verified_bot_category`
- After any change, check right away that the bots you keep (Googlebot, bingbot) still get 200
