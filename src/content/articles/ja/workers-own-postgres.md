---
title: "Cloudflare Workersから自前のPostgreSQLを使う:ポートを開けずにつなぎ、1台を複数のサービスで分ける"
description: "全文検索とベクトル検索が要るので、Workersのサイトから、VM上のPostgreSQLを使う構成にした。Hyperdrive、Workers VPC、Tunnelでつなぎ、ロールで負荷を分け、バックアップとバッチをVMに置いた記録。"
category: "infra"
tags: ["PostgreSQL","Cloudflare","Hyperdrive","Terraform"]
minutes: 11
type: "構成の記録"
level: "Workersと、PostgreSQLを少し触ったことがある人向け"
takeaway: "データベースだけは自分で持つ、という選び方もできます。外から入るポートを開けず、Tunnelで内側から外へつなぎ、サイトはHyperdrive経由で読む。サービスごとにロールで時間と接続数を絞れば、1台を複数のサービスで分け合えます。"
order: 17
sources:
  - { title: "Cloudflare Hyperdrive — Documentation", url: "https://developers.cloudflare.com/hyperdrive/" }
  - { title: "Hyperdrive — Connect to a private database using Workers VPC", url: "https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database-vpc/" }
  - { title: "Cloudflare Workers VPC", url: "https://developers.cloudflare.com/workers-vpc/" }
  - { title: "Cloudflare Tunnel", url: "https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/" }
  - { title: "Google Cloud — Using IAP for TCP forwarding", url: "https://cloud.google.com/iap/docs/using-tcp-forwarding" }
  - { title: "PGroonga", url: "https://pgroonga.github.io/" }
  - { title: "pgvector", url: "https://github.com/pgvector/pgvector" }
---

## なぜ、データベースだけ自分で持つのか

サーバーを持たないのが、小さなチームの基本です([個人開発・スタートアップ向けのスタック](../startup-stack/)では、DBもD1にしました)。けれど、あるサービスでは、次の3つが同時に要りました。

- **日本語の全文検索**:題名や人名を、1〜2文字の語でも、部分一致で速く探したい
- **ベクトル検索**:「疲れた夜に癒されたい」のような言葉に近い商品を、意味で探したい
- **約48万件の商品**:それぞれにJSONの詳しい情報があり、毎日、外部のAPIから更新される

PostgreSQLなら、PGroonga(日本語に強い全文検索)とpgvector(ベクトル検索)を、同じテーブルに対して使えます。そこで、**サイトはWorkersのまま、データベースだけをVMに置く**構成にしました。この記事は、その構成と、運用して分かったことの記録です。

> 料金、制限、ベータ版の機能は変わります。使う前に、各社の公式ドキュメントを確かめてください。Workers VPCは、2026年10月の時点でベータ版です。

## 全体の構成

サイトのWorkerから、VMのPostgreSQLまでの経路は、次のとおりです。

<figure class="diagram"><svg viewBox="0 0 400 568" role="img" aria-labelledby="pa-t"><title id="pa-t">WorkersのサイトからVMのPostgreSQLまでの経路</title><defs><filter id="pa-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="pa-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="pa-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="110" y="8" width="180" height="42" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="134" cy="29" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(125,20) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="156" y="33.5" class="d-ntitle">訪問者</text><path d="M200 52 V96" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M200 52 V96"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><rect x="8" y="68" width="384" height="214" rx="14" fill="url(#pa-g)" class="d-group"/><text x="24" y="88" class="d-gtitle">Cloudflare</text><g class="k-a"><rect x="24" y="98" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="122" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,113) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="120" class="d-ntitle">サイトのWorker</text><text x="70" y="135" class="d-nsub">画面と検索のAPI</text><path d="M200 148 V158" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1s" repeatCount="indefinite" path="M200 148 V158"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="160" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="184" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,175) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="70" y="182" class="d-ntitle">Hyperdrive</text><text x="70" y="197" class="d-nsub">接続をまとめて使い回す</text><path d="M200 210 V220" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1.5s" repeatCount="indefinite" path="M200 210 V220"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="222" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="246" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,237) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="70" y="244" class="d-ntitle">Workers VPC</text><text x="70" y="259" class="d-nsub">公開していない宛先への入口</text><path d="M200 272 V330" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M200 272 V330"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><text x="212" y="290" class="d-nsub">接続はVMの内側から張る</text><rect x="8" y="298" width="384" height="232" rx="14" fill="url(#pa-g)" class="d-group"/><text x="24" y="318" class="d-gtitle">VM(GCP 東京)</text><g class="k-ok"><rect x="24" y="332" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="356" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,347) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="70" y="354" class="d-ntitle">cloudflared</text><text x="70" y="369" class="d-nsub">Tunnelの、VM側の端</text><path d="M200 382 V392" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0.5s" repeatCount="indefinite" path="M200 382 V392"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="394" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="418" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,409) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="416" class="d-ntitle">PostgreSQL 17</text><text x="70" y="431" class="d-nsub">localhostだけ。PGroonga、pgvector</text><g class="k-w"><rect x="24" y="466" width="172" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="490" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(39,481) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="70" y="488" class="d-ntitle">systemdタイマー</text><text x="70" y="503" class="d-nsub">毎日の取り込み</text><g class="k-n"><rect x="204" y="466" width="172" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="228" cy="490" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(219,481) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="250" y="488" class="d-ntitle">バックアップ</text><text x="250" y="503" class="d-nsub">pg_dump → R2</text><path d="M110 464 V444" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M110 464 V444"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><path d="M290 444 V464" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M290 444 V464"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-w"><g class="k-w"><g transform="translate(21,543) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g></g><text x="48" y="556" class="d-nsub">外から入れるのは、IAP経由のSSHだけ</text></svg><figcaption>図1 サイトはWorkersのまま、DBだけをVMに置く。VMは外から入るポートを開けず、cloudflaredが内側からCloudflareへ接続を張る。取り込みとバックアップは、DBの隣で動く。</figcaption></figure>

- **Hyperdrive**:Workerからの接続を、PostgreSQLへの少数の接続にまとめる(接続プール)。リクエストのたびに、遠いDBと接続をやり直さずに済む
- **Workers VPC**:Hyperdriveが、インターネットに公開していない宛先(Tunnelの先の `localhost:5432`)に届くための入口
- **Cloudflare Tunnel**:VMの中の `cloudflared` が、**内側から** Cloudflareへ接続を張る。だから、VMに外から入るポートは要らない
- **PostgreSQL**:`localhost` だけで待ち受ける。インターネットからは、直接つなげない

VMに入る経路は、管理のためのSSHだけです。それも、ファイアウォールでGoogleのIAP(踏み台の仕組み)のアドレス範囲だけを許可し、`gcloud compute ssh --tunnel-through-iap` で入ります。

## 以前のつなぎ方との違い

最初は、Hyperdriveの公式手順にある「Tunnel + Access」でつないでいました。Tunnelに公開ホスト名を付け、Cloudflare Accessのサービストークンを持つHyperdriveだけを通す形です。今は、Workers VPCを使う形に変えました。

| | Tunnel + Access | Workers VPC |
| --- | --- | --- |
| 公開ホスト名 | 要る(`db.<ドメイン>` など) | 要らない |
| Accessのアプリとサービストークン | 要る | 要らない |
| Hyperdriveに渡す秘密 | DBのパスワード、トークンのIDとシークレット | DBのパスワード |
| 状態 | 一般提供 | ベータ版(2026年10月) |

ホスト名とトークンが減ると、ローテーションするものと、設定を間違える場所が減ります。ベータ版であることは承知の上で、移しました。

## 1台を、複数のサービスで分ける

このVMには、サービスごとにデータベースを作っています。サービスを足すスクリプトは、1つのサービスに、2つのロールを作ります。

- **持ち主のロール**(`<name>`):テーブルを作り、毎日の更新を書き込む
- **サイト用のロール**(`<name>_web`):サイトのWorkerが使う。読むことと、必要な表への書き込みだけ

サイト用のロールには、次の制限を付けています。

```sql add-database.sh(抜粋)
CREATE ROLE "<name>_web" LOGIN PASSWORD '...' CONNECTION LIMIT 20;
ALTER ROLE "<name>_web" SET statement_timeout = '3s';
REVOKE ALL ON DATABASE "<name>" FROM PUBLIC;
```

- **3秒で打ち切る**:1つのサービスの重いクエリが、ほかのサービスを道連れにしない。サイト側は、打ち切られたら、条件を減らした検索に切り替える
- **接続は20まで**:Hyperdriveの接続プールが、DBの接続を食いつぶさない
- **ほかのDBに入れない**:どのデータベースからも、「誰でも接続してよい」(`PUBLIC` の `CONNECT`)を外す。あるサービスのパスワードが漏れても、ほかのサービスのデータは読めない

実際に、ある検索のSQLが遅いプランを引いて、4秒かかっていたことがあります。3秒で打ち切られるので、その検索が失敗するだけで、ほかのサービスには響きません(原因と直し方は、[UNION ALLの記事](../postgres-union-all-in/)に書きました)。

## Terraformで作るもの、作らないもの

VMとネットワークは、Terraformで作っています。

- VM:東京リージョン、`e2-standard-2`(2 vCPU、8 GB)、ディスク50 GB
- 専用のネットワークと、IAPからのSSHだけを許可するファイアウォール
- ディスクのスナップショット:毎日、30日分
- 予算アラート:プロジェクト全体で、月15,000円(50%と100%でメール)

**秘密は、Terraformに入れません。** DBのパスワードや、Tunnelのトークンを変数に入れると、Terraformの状態ファイルに平文で残るからです。秘密は、サーバーに入ってから、画面に出さずに入れます。たとえば、Tunnelのトークンは、手元で入力して、SSH越しに `root` だけが読めるファイルへ流し込みます。

```bash add-cloudflared.sh(抜粋)
read -rs -p "Tunnel token for $NAME (not shown): " TOKEN; echo
printf 'TUNNEL_TOKEN=%s\n' "$TOKEN" | gcloud compute ssh pg-main "${Z[@]}" \
  --command "sudo tee /etc/cloudflared-$NAME.env >/dev/null && sudo chmod 600 /etc/cloudflared-$NAME.env"
unset TOKEN
```

TunnelとHyperdriveは、Workerと同じCloudflareアカウントに置く必要があります。別のアカウントのサイトからも使うため、VMには、アカウントごとに `cloudflared` を1つずつ動かしています。

## バックアップと、毎日のバッチ

データを自分で持つと、バックアップも自分の仕事になります。

- **ディスクのスナップショット**:毎日、30日分(GCPが取る)
- **論理バックアップ**:毎日、全DBを1つずつ `pg_dump` し、ロールと一緒に、オブジェクトストレージ(R2)へ送る。14日分
- **戻せるかの確認**:月に1回、別のDBに `pg_restore` してみる。戻したことのないバックアップは、ないのと同じ

外部のAPIから商品を取り込む処理も、同じVMの systemd タイマーで動かしています。毎日の全体の更新、1日3回の差分の同期、1時間ごとの補足情報の取得です。DBのすぐ隣で動くので、何十万行の書き込みでも、ネットワークを何度も往復しません。

## 運用して分かったこと

- **ベクトルの索引は、メモリに載る大きさで考える**:pgvectorのHNSW索引(1024次元をhalfvecで持ち、約48万件で約1.3 GB)が、4 GBのVMのメモリには収まりませんでした。8 GBに上げ、PostgreSQLのメモリ設定(`shared_buffers` をメモリの1/4など)を、VMの大きさに合わせて直すスクリプトを用意しました
- **手元の開発は、本物と同じ拡張を入れたコンテナで**:`wrangler dev` では、Hyperdriveの代わりに `localConnectionString` で手元のDBにつなぎます。PGroongaとpgvectorを入れたイメージを使うと、本番と同じSQLを試せます
- **重いバッチと、サイトの検索がぶつからない時間に**:毎日の更新は、アクセスの少ない早朝に置きました
- **DBを止めずに大きくできる部分と、できない部分を知っておく**:ディスクは止めずに増やせますが、VMの種類を変えると数分止まります

## これが向く場合、向かない場合

| 向く | 向かない |
| --- | --- |
| PostgreSQLの拡張(全文検索、ベクトル)が要る | D1などの、管理の要らないDBで足りる |
| データが大きく、毎日まとめて更新する | 書き込みが多く、世界中から速く書きたい |
| バックアップと更新を、自分で見られる | DBの面倒を見る人がいない |

DBを自分で持つと、OSの更新、ディスクの空き、バックアップの確認が、自分の仕事に戻ってきます。それでも、サイトの側は、Workersのまま「サーバーを持たない」形を保てます。必要なものだけを自分で持つ、という分け方です。

## 確認リスト

- [ ] DBのポートを、インターネットに開けていないか(Tunnelで内側から張っているか)
- [ ] サイト用のロールに、時間の打ち切りと、接続数の上限があるか
- [ ] ほかのサービスのDBに、接続できないようにしたか
- [ ] パスワードやトークンが、Terraformの状態ファイルや、シェルの履歴に残っていないか
- [ ] バックアップを、実際に戻して確かめたか
- [ ] 索引の大きさが、メモリに収まっているか
