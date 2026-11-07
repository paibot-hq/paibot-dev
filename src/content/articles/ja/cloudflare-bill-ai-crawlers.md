---
title: "Cloudflareの請求が$230になった:D1の全文検索とAIクローラーを、cfコマンドで突き止めて止める"
description: "月$5のはずのWorkers Paidが、1か月で約$230になった。cfコマンドとGraphQL Analytics APIで内訳を調べると、D1の行読み取りと、AIの学習用クローラーが原因だった。学習用だけを止めるつもりで検索エンジンまで止めた失敗と、WAFカスタムルールで名指しして止めた記録。"
category: "infra"
tags: ["Cloudflare","D1","Workers","WAF","AIクローラー"]
minutes: 10
type: "調査の記録"
level: "Cloudflare Workers / Pagesでサイトを動かしている人向け"
takeaway: "従量課金は、関数が動いた回数と、DBが読んだ行数で決まります。原因はGraphQL Analytics APIで日別・User-Agent別に分ければ見えます。AIの学習用クローラーは、Cloudflareの「学習用」の一括設定ではなく、WAFカスタムルールで名指しして、検索エンジンを除外して止めます。"
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

## 先に結果

Workers Paid(月\$5)で、商品カタログのサイトを動かしています。Next.jsをPages Functionsで動かし、5言語で、商品ページと検索ページを出すサイトです。ある月、ダッシュボードの「Billable Usage」が約\$230になっていました。内訳は次のとおりです。

<figure class="diagram"><svg viewBox="0 0 400 352" role="img" aria-labelledby="cb-t"><title id="cb-t">リクエストのどこで課金され、どこで止めるか</title><defs><filter id="cb-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="cb-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="cb-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="24" y="8" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="32" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,23) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="70" y="30" class="d-ntitle">クローラーと訪問者</text><text x="70" y="45" class="d-nsub">1日144万件のうち、約8割がAIの学習用</text><path d="M200 58 V102" class="d-path" marker-end="url(#cb-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M200 58 V102"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><rect x="8" y="74" width="384" height="268" rx="14" fill="url(#cb-g)" class="d-group"/><text x="24" y="94" class="d-gtitle">Cloudflare</text><g class="k-ok"><rect x="24" y="104" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="128" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,119) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="70" y="126" class="d-ntitle">WAFカスタムルール</text><text x="70" y="141" class="d-nsub">学習用をUAで名指し → 403</text><path d="M200 154 V196" class="d-path" marker-end="url(#cb-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M200 154 V196"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="220" y="164" width="156" height="22" rx="11" class="d-pill"/></g><text x="298" y="179" class="d-tagtext" text-anchor="middle">ここで止めれば $0</text><g class="k-w"><rect x="24" y="198" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="222" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(39,213) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="220" class="d-ntitle">Pages Functions(SSR)</text><text x="70" y="235" class="d-nsub">リクエスト数とCPU時間で課金</text><g class="k-w"><rect x="310" y="211" width="56" height="22" rx="11" class="d-pill"/></g><text x="338" y="226" class="d-tagtext" text-anchor="middle">$21</text><path d="M200 248 V280" class="d-path" marker-end="url(#cb-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0.5s" repeatCount="indefinite" path="M200 248 V280"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-d"><rect x="24" y="282" width="352" height="48" rx="11" class="d-node" filter="url(#cb-sh)"/><circle cx="48" cy="306" r="14" class="d-badge"/></g><g class="k-d"><g transform="translate(39,297) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="304" class="d-ntitle">D1(SQLite)</text><text x="70" y="319" class="d-nsub">読んだ行数で課金。検索で2,288億行</text><g class="k-d"><rect x="310" y="295" width="56" height="22" rx="11" class="d-pill"/></g><text x="338" y="310" class="d-tagtext" text-anchor="middle">$204</text></svg><figcaption>図1 料金は、関数が動いたときと、D1が行を読んだときにかかる。関数より手前のWAFで止めれば、そのリクエストは課金されない。</figcaption></figure>

| 項目 | 使った量 | 含まれる量 | 料金 |
| --- | --- | --- | --- |
| D1 行の読み取り | 2,288億行 | 250億行 | \$203.84 |
| Workers CPU時間 | 7億8,104万ms | 3,000万ms | \$15.04 |
| Workers リクエスト | 3,033万件 | 1,000万件 | \$6.30 |
| Workers Paid 基本料 | | | \$5 |

原因は2つでした。

- **D1**:2日間だけ、全文検索のクエリが約580万回走り、1回あたり平均約3.9万行を読んだ。この2日で約\$200
- **Workers**:アクセスの約8割が、AIの学習用クローラー(ClaudeBot、GPTBotなど)。どのリクエストでも関数が動き、CPU時間とリクエスト数が課金された

D1は、全文検索をPostgreSQLに移して止めました。クローラーは、WAFカスタムルールで名指しして、関数より手前で止めました。途中で、Cloudflareの「学習用のクローラーをブロック」設定を使い、**GooglebotとBingbotまで403にしてしまった**ので、その話も書きます。

## cfコマンドで、内訳を調べる

最初は、Cloudflareの公式CLI(`cf`)で請求を見ようとしました。契約中のプランは取れます。

```bash
export CLOUDFLARE_ACCOUNT_ID=<アカウントID>
cf accounts subscriptions get | jq -r '.[] | [.rate_plan.public_name, .price] | @tsv'
```

けれど、使用量と請求の履歴(`cf billing usage get-v1`、`cf accounts billing history list`)は、OAuthでログインしたトークンでは、権限を全部付けても403でした。請求の確定額は、ダッシュボードで見るしかありません。

そこで、**GraphQL Analytics API**から、製品ごとの使用量を取りました。cfのログインと同じOAuthトークンで呼べます。

```bash
TOKEN=$(jq -r .oauth_token ~/Library/Preferences/cloudflare/config/default.json)
curl -s https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data @query.json
```

```text query.json の中のクエリ(要点)
viewer { accounts(filter: { accountTag: $a }) {
  d1AnalyticsAdaptiveGroups(filter: { date_geq: $s, date_leq: $e }, orderBy: [date_ASC]) {
    sum { readQueries rowsRead rowsWritten } dimensions { date databaseId } }
  workersInvocationsAdaptive(filter: { date_geq: $s, date_leq: $e }) {
    sum { requests cpuTimeUs } dimensions { scriptName } }
  pagesFunctionsInvocationsAdaptiveGroups(filter: { date_geq: $s, date_leq: $e }) {
    sum { requests } dimensions { date scriptName } }
} }
```

**日別**に並べると、原因がすぐ見えます。D1の行の読み取りは普段1日2億行ほどなのに、ある2日だけ913億行と1,344億行でした。Pages Functionsのリクエストは、2週間で1日22万件から390万件に増えていました。

> 分析APIの数字は、請求と完全には一致しません。D1の行数はぴったり一致しましたが、CPU時間は請求の約5分の1しか出ず、リクエスト数は無料の静的アセットまで数えて多めに出ました。原因を探すのには十分ですが、金額はダッシュボードで確かめます。

## D1:2日で2,288億行を読んだ検索

D1は、**読んだ行数**で課金されます。返した行数ではありません。索引を使わずに表を走査すると、その行がすべて数えられます。

`d1QueriesAdaptiveGroups`で、読んだ行数の多いクエリを並べると、上位は全文検索(FTS5)の2つでした。

```sql 上位2つのクエリ(読んだ行数:1,126億行と835億行)
SELECT COUNT(*) AS total FROM (SELECT 1 FROM CatalogProducts p
  WHERE p.active = 1 AND p.id IN (SELECT rowid FROM CatalogSearch WHERE CatalogSearch MATCH ?) LIMIT ?);

SELECT p.data_json FROM CatalogProducts p
  WHERE p.active = 1 AND p.id IN (SELECT rowid FROM CatalogSearch WHERE CatalogSearch MATCH ?)
  ORDER BY COALESCE(p.popularity_rank, 2147483647) ...;
```

1回の検索で「件数」と「1ページ分」の2本を投げ、どちらも、よく当たる語では数万行を読みます。この2本だけで、2日間の読み取りの約86%でした。検索ページは、URLにキーワードが入っているので、クローラーが辿るとほぼ無限に呼ばれます。

このサービスは、日本語の全文検索とベクトル検索が要ったので、カタログをPostgreSQLに移しました([Workersから自前のPostgreSQLを使う](../workers-own-postgres/))。以後、D1の読み取りは1日0行に戻っています。

## 毎日の\$2:アクセスの8割がAIクローラー

D1を止めても、Workersの料金が1日\$2ほど続いていました。ダッシュボードで1日分の内訳を見ると、CPU時間が\$1.20、リクエストが\$0.90です。

ゾーンの`httpRequestsAdaptiveGroups`を、User-Agentで分けました。Freeプランでも、直近の数日なら引けます。

| User-Agent | 24時間のリクエスト | 割合 |
| --- | --- | --- |
| ClaudeBot(Anthropic) | 84.9万 | 59% |
| GPTBot(OpenAI) | 21.3万 | 15% |
| ExaSearchBot | 8.2万 | 6% |
| Amazonbot、bingbot、Semrushなど | 約8万 | 6% |
| 人のブラウザ | 数万 | 1割未満 |

クローラーは、5言語の商品ページと検索ページを、端から辿っていました。URLの組み合わせが多すぎて、同じURLはほとんど2回来ません。そのため、エッジのキャッシュはほぼ効かず、毎回、関数でページを作っていました。1リクエストのCPU時間は約24msです。

ClaudeBotとGPTBotは、**AIの学習用**のクローラーです。AI検索の回答に使うクローラーは別にあり(OAI-SearchBot、Claude-SearchBot、PerplexityBot)、ユーザーが貼ったURLを読むものも別です(ChatGPT-User、Claude-User)。学習用を止めても、検索からの流入は減りません。そこで、**学習用だけを止める**ことにしました。

## 止め方を選ぶ

| 方法 | どこで止まるか | 効くまで | 守らないボット |
| --- | --- | --- | --- |
| robots.txtで`Disallow` | ボットが自分で守る | 読み直すまで(1日ほど) | 止まらない |
| Cloudflareの`ai_training: block` | エッジ | すぐ | 止まる |
| WAFカスタムルール(UAで名指し) | エッジ | すぐ | 名前が一致すれば止まる |

エッジで止めると、関数が動かないので課金されません。robots.txtにも学習用のボットを書いておき(Cloudflareの設定が外れたときの保険)、エッジでも止めることにしました。

```text robots.txt(先頭)
User-agent: ClaudeBot
Disallow: /

User-agent: GPTBot
Disallow: /

...

User-agent: *
Allow: /
```

検索ページは、全部のクローラーに対して`Disallow`にしかけて、やめました。商品ページのメーカー名やジャンル名のリンクが検索ページに飛んでいて、検索ページがカテゴリページの役を兼ねていたからです。検索エンジンから来る入口を、自分で消すところでした。

## 失敗:`ai_training: block`は、検索エンジンも止めた

最初は、ゾーンのボット設定で、学習用をまとめて止めました。

```bash
cf bot-management update -z <ドメイン> --ai-training block --fight-mode true --enable-js true
```

> このPUTは、送らなかった項目が元のままになるのか、ドキュメントに書かれていません。Bot Fight ModeとJS検知を、今の値のまま一緒に送り、前後の設定を`diff`して、変わったのが`ai_training`だけなのを確かめました。

ClaudeBotとGPTBotは、すぐ403になりました。ところが、同じ時間に、**本物のbingbot(157.55.x、52.167.x)とGooglebot(66.249.x)も403**になっていました。`securitySource`は`firewallManaged`、つまりCloudflareのマネージドルールです。

ドキュメントには、学習用(Training)の対象に「学習と検索の両方に使う、兼用のクローラー」も含む、と書かれています。どのボットが兼用に分類されるかは、Free・Proでは見られません。気づいたのは約5分後で、すぐ`--ai-training disabled`に戻し、設定が元と一致すること、bingbotとGooglebotが200に戻ったことを確かめました。

**設定を変えたら、止めたいボットだけでなく、止めたくないボットの応答も見る。** これが一番の学びです。

## WAFカスタムルールで、名指しで止める

Cloudflareの分類に任せず、止めるボットを自分で名指しします。ダッシュボードの「AI Crawl Control」でクローラーごとにBlockにしても、中ではWAFカスタムルールが作られます(Freeプランでは、User-Agentの文字列で判定)。cfコマンドで直接作りました。

```text 条件(アクションはBlock)
(http.user_agent contains "ClaudeBot" or http.user_agent contains "GPTBot"
 or http.user_agent contains "CCBot" or http.user_agent contains "Bytespider"
 or http.user_agent contains "Amazonbot" or http.user_agent contains "meta-externalagent")
and not cf.verified_bot_category in {"Search Engine Crawler"}
```

最後の行は保険です。GooglebotやBingbotのUser-Agentは上の名前を含みませんが、万一の分類変更に備えて、確認済みの検索エンジンを外します。`cf.verified_bot_category`はFreeプランのWAFルールでも使えます。

```bash
# ゾーンに既存のルールセットがある場合は、ルールを足す
cf rulesets rules create <ルールセットID> -z <ドメイン> --body "$(cat rule.json)"
# まだない場合は、エントリポイントを作る
cf rulesets entrypoint update http_request_firewall_custom -z <ドメイン> --body "$(jq '{rules:[.]}' rule.json)"
```

Freeプランのカスタムルールは5つまでです。条件は`or`でまとめて1つにしています。

## 確かめる

ルールを入れたら、数分後に、User-Agentと応答コードで分けて見ます。止めたいボットと、止めたくないボットを両方入れるのがポイントです。

```text 確認用のクエリ(要点)
httpRequestsAdaptiveGroups(filter: { datetime_geq: $st, OR: [
    { userAgent_like: "%ClaudeBot%" }, { userAgent_like: "%GPTBot%" },
    { userAgent_like: "%bingbot%" }, { userAgent_like: "%Googlebot%" } ] }) {
  count dimensions { userAgent edgeResponseStatus securitySource } }
```

ルールを入れた後の3分間です(2つのドメインの合計)。

| User-Agent | 応答 | 件数 | 止めたもの |
| --- | --- | --- | --- |
| ClaudeBot | 403 | 1,806 | `firewallCustom`(今回のルール) |
| GPTBot | 403 | 493 | `firewallCustom` |
| Amazonbot | 403 | 33 | `firewallCustom` |
| bingbot | 200 | 69 | なし |

止めたいものは`firewallCustom`で403になり、bingbotは200のままです。止めたリクエストでは関数が動かないので、Workersのリクエスト数とCPU時間に入りません。

## 確認リスト

- 請求が増えたら、ダッシュボードの「Billable Usage」で、どの製品かを先に見る
- GraphQL Analytics APIで、日別・スクリプト別・User-Agent別に分ける
- D1は「読んだ行数」で課金される。全文検索の件数取得(`COUNT(*)`)は、特に重い
- キーワードがURLに入る検索ページは、クローラーに無限に辿られる
- AIのクローラーは、学習用・検索用・ユーザー起点で別の名前。止めるのは学習用だけでよい
- まとめて止める設定(`ai_training: block`)は、兼用のクローラーとして検索エンジンを巻き込むことがある
- WAFカスタムルールで名指しし、`cf.verified_bot_category`で検索エンジンを除外する
- 設定を変えたら、止めたくないボット(Googlebot、bingbot)が200のままか、すぐ確かめる
