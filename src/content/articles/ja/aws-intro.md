---
title: "AWS入門:全体像と、安全な始め方"
description: "リージョンとAZ、主要サービス、典型的なWeb構成、責任共有モデル。最初に決めておく安全設定と、料金の落とし穴までを整理する。"
category: "infra"
tags: ["AWS","クラウド","入門"]
minutes: 11
type: "入門ガイド"
level: "ITの基礎知識があれば十分"
takeaway: "AWSは、サーバーやデータベースを必要な分だけ借りる仕組みです。使い始める前に、rootユーザーの保護、日常用のアクセス、料金の通知の3つを決めると、事故を大きく減らせます。"
order: 12
sources:
  - { title: "AWS — Global Infrastructure", url: "https://aws.amazon.com/about-aws/global-infrastructure/" }
  - { title: "AWS — Shared Responsibility Model", url: "https://aws.amazon.com/compliance/shared-responsibility-model/" }
  - { title: "AWS Docs — Security best practices in IAM", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html" }
  - { title: "AWS Docs — Root user best practices", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html" }
  - { title: "AWS What's New — AWS Free Tier now offers $200 in credits and 6-month free plan", url: "https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/" }
---

## AWSとは

AWS(Amazon Web Services)は、サーバー、ストレージ、データベース、ネットワークなどを、インターネット経由で必要な分だけ借りられるクラウドサービスです。自分でサーバーを買って置く代わりに、使った分だけ支払います。数分でサーバーを起動でき、使い終わったら止められます。

借りられるものは非常に多く、サービスの数も増え続けています。最初から全部を覚える必要はありません。この記事では、まず全体の構造と、最初に覚える主要なサービス、安全な始め方に絞ります。

> サービスの名前、画面、料金、無料枠は変わります。無料枠の制度は、2026年10月に公式の発表で確認しました。ほかの内容は一般的な解説なので、実際に使うときは、最新の公式ドキュメントと料金のページで確認してください。

## 全体の構造:リージョンとアベイラビリティゾーン

AWSは、世界中に分かれた拠点でできています。

<figure class="diagram"><svg viewBox="0 0 400 520" role="img" aria-labelledby="ag-t"><title id="ag-t">AWSの構造:リージョンとアベイラビリティゾーン</title><defs><filter id="ag-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="ag-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="ag-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="178" y="12" width="44" height="44" rx="4" fill="#7D8998"/><g transform="translate(188,22)" class="d-ico-w"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g><text x="200" y="70" class="d-alabel" text-anchor="middle">ユーザー</text><path d="M200 84 V128" class="d-path" marker-end="url(#ag-a)"/><circle cx="214" cy="106" r="9" class="d-num"/><text x="214" y="109.6" class="d-numt" text-anchor="middle">1</text><rect x="6" y="100" width="388" height="408" rx="2" fill="var(--ink)" fill-opacity="0" stroke="var(--ink)" stroke-width="1.6"/><text x="14" y="116" class="d-atab">AWS Cloud</text><rect x="178" y="134" width="44" height="44" rx="4" fill="#8C4FFF"/><g transform="translate(188,144)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="200" y="192" class="d-alabel" text-anchor="middle">CloudFront</text><text x="200" y="204" class="d-alabel" text-anchor="middle">エッジ拠点</text><path d="M200 208 V232" class="d-path" marker-end="url(#ag-a)"/><circle cx="214" cy="220" r="9" class="d-num"/><text x="214" y="223.6" class="d-numt" text-anchor="middle">2</text><rect x="16" y="214" width="368" height="216" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="16" y="214" width="24" height="24" fill="#00A4A6"/><g transform="translate(20,218) scale(.67)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="46" y="230" class="d-atab">リージョン(例:東京)</text><rect x="26" y="244" width="170" height="150" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="34" y="260" class="d-atab">AZ A</text><rect x="54" y="288" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(64,298)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="76" y="346" class="d-alabel" text-anchor="middle">EC2</text><text x="76" y="358" class="d-alabel" text-anchor="middle">サーバー</text><rect x="126" y="288" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(136,298)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="148" y="346" class="d-alabel" text-anchor="middle">RDS</text><text x="148" y="358" class="d-alabel" text-anchor="middle">データベース</text><rect x="204" y="244" width="170" height="150" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="212" y="260" class="d-atab">AZ B</text><rect x="232" y="288" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(242,298)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="254" y="346" class="d-alabel" text-anchor="middle">EC2</text><text x="254" y="358" class="d-alabel" text-anchor="middle">サーバー</text><rect x="304" y="288" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(314,298)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="326" y="346" class="d-alabel" text-anchor="middle">RDS</text><text x="326" y="358" class="d-alabel" text-anchor="middle">データベース</text><text x="200" y="416" class="d-alabel" text-anchor="middle">AZ間は、高速な専用回線でつながる</text><rect x="16" y="440" width="368" height="56" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="16" y="440" width="24" height="24" fill="#00A4A6"/><g transform="translate(20,444) scale(.67)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="46" y="456" class="d-atab">リージョン(例:大阪)</text><text x="30" y="486" class="d-alabel">遠く離れた別の拠点。データは自動では移らない</text></svg><figcaption>図1 リージョンの中は、物理的に分かれた複数のAZでできている。1つのAZが止まっても、別のAZで動き続けられる。AWSの構成図の作法で描いた簡略版(公式のアイコンではない)。</figcaption></figure>

- **リージョン**:地理的に分かれた地域(東京、大阪、バージニアなど)。リージョンごとに、サービスもデータも独立している
- **アベイラビリティゾーン(AZ)**:1つのリージョンの中にある、物理的に分かれたデータセンターの集まり。電源やネットワークも分かれていて、1つのAZで障害が起きても、他のAZは動き続けるように作られている
- **エッジ拠点**:利用者の近くでコンテンツを配信するための拠点(CloudFrontなどで使う)

選ぶときの考え方は次のとおりです。

- リージョンは、利用者に近い場所と、法令やデータの置き場所の要件で決める。サービスや料金がリージョンで違うこともある
- 止まりにくくしたいときは、1つのリージョンの中で、複数のAZに分けて置く
- データは、別のリージョンへ明示的にコピーしない限り、そのリージョンの外に出ない

## 最初に覚える主要サービス

| サービス | 役割 | たとえると |
| --- | --- | --- |
| EC2 | 仮想サーバーを借りる | 好きなOSを入れられるPC |
| S3 | ファイルを保存する(オブジェクトストレージ) | 容量が事実上無制限のファイル置き場 |
| VPC | 自分専用の仮想ネットワーク | 社内ネットワーク |
| IAM | 誰が何をしてよいかを決める | 入退室の管理 |
| RDS | 管理を任せられるデータベース | バックアップや更新を代行してくれるDB |
| Lambda | コードだけを置いて、呼ばれたときに動かす | サーバーのない関数 |
| CloudFront | 世界中に近い場所から配信する(CDN) | 各地の配送拠点 |
| Route 53 | ドメイン名とIPアドレスを結ぶ(DNS) | 電話帳 |
| CloudWatch | ログ、指標、アラーム | 監視室 |

ほかにも多くのサービスがあります。上の表は、最初の入口にすぎません。

## 典型的なWebアプリの構成

小さなWebアプリの典型的な構成を見ると、サービスどうしのつながりが分かります。

<figure class="diagram"><svg viewBox="0 0 400 660" role="img" aria-labelledby="aw-t"><title id="aw-t">小さなWebアプリの典型的なAWS構成</title><defs><filter id="aw-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="aw-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="aw-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="178" y="12" width="44" height="44" rx="4" fill="#7D8998"/><g transform="translate(188,22)" class="d-ico-w"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g><text x="200" y="70" class="d-alabel" text-anchor="middle">ユーザー</text><path d="M200 84 V128" class="d-path" marker-end="url(#aw-a)"/><circle cx="214" cy="106" r="9" class="d-num"/><text x="214" y="109.6" class="d-numt" text-anchor="middle">1</text><rect x="6" y="100" width="388" height="548" rx="2" fill="var(--ink)" fill-opacity="0" stroke="var(--ink)" stroke-width="1.6"/><text x="14" y="116" class="d-atab">AWS Cloud</text><rect x="178" y="134" width="44" height="44" rx="4" fill="#8C4FFF"/><g transform="translate(188,144)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="200" y="192" class="d-alabel" text-anchor="middle">CloudFront</text><text x="200" y="204" class="d-alabel" text-anchor="middle">エッジ配信</text><path d="M200 208 V280" class="d-path" marker-end="url(#aw-a)"/><circle cx="214" cy="244" r="9" class="d-num"/><text x="214" y="247.6" class="d-numt" text-anchor="middle">2</text><rect x="16" y="212" width="368" height="428" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="16" y="212" width="24" height="24" fill="#00A4A6"/><g transform="translate(20,216) scale(.67)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="46" y="228" class="d-atab">リージョン</text><rect x="26" y="246" width="348" height="280" rx="2" fill="#8C4FFF" fill-opacity="0.06" stroke="#8C4FFF" stroke-width="1.6"/><rect x="26" y="246" width="24" height="24" fill="#8C4FFF"/><g transform="translate(30,250) scale(.67)" class="d-ico-w"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g><text x="56" y="262" class="d-atab">VPC</text><rect x="178" y="282" width="44" height="44" rx="4" fill="#8C4FFF"/><g transform="translate(188,292)" class="d-ico-w"><path d="M4 12h6M10 12l6-6M10 12l6 6M16 6h4M16 18h4"/></g><text x="200" y="340" class="d-alabel" text-anchor="middle">ALB</text><text x="200" y="352" class="d-alabel" text-anchor="middle">ロードバランサー</text><rect x="36" y="372" width="160" height="144" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="44" y="388" class="d-atab">AZ A</text><rect x="44" y="398" width="144" height="110" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6"/><rect x="44" y="398" width="24" height="24" fill="#00A4A6"/><g transform="translate(48,402) scale(.67)" class="d-ico-w"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g><text x="74" y="414" class="d-atab">非公開サブネット</text><rect x="58" y="428" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(68,438)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="80" y="486" class="d-alabel" text-anchor="middle">EC2</text><text x="80" y="498" class="d-alabel" text-anchor="middle">サーバー</text><rect x="130" y="428" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(140,438)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="152" y="486" class="d-alabel" text-anchor="middle">RDS</text><text x="152" y="498" class="d-alabel" text-anchor="middle">データベース</text><path d="M200 358 V366 H80 V426" class="d-path" marker-end="url(#aw-a)"/><path d="M104 450 H126" class="d-path" marker-end="url(#aw-a)"/><rect x="204" y="372" width="160" height="144" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="212" y="388" class="d-atab">AZ B</text><rect x="212" y="398" width="144" height="110" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6"/><rect x="212" y="398" width="24" height="24" fill="#00A4A6"/><g transform="translate(216,402) scale(.67)" class="d-ico-w"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g><text x="242" y="414" class="d-atab">非公開サブネット</text><rect x="226" y="428" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(236,438)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="248" y="486" class="d-alabel" text-anchor="middle">EC2</text><text x="248" y="498" class="d-alabel" text-anchor="middle">サーバー</text><rect x="298" y="428" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(308,438)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="320" y="486" class="d-alabel" text-anchor="middle">RDS</text><text x="320" y="498" class="d-alabel" text-anchor="middle">待機系</text><path d="M200 358 V366 H248 V426" class="d-path" marker-end="url(#aw-a)"/><path d="M272 450 H294" class="d-path" marker-end="url(#aw-a)"/><circle cx="140" cy="366" r="9" class="d-num"/><text x="140" y="369.6" class="d-numt" text-anchor="middle">3</text><circle cx="124" cy="440" r="9" class="d-num"/><text x="124" y="443.6" class="d-numt" text-anchor="middle">4</text><rect x="88" y="544" width="44" height="44" rx="4" fill="#7AA116"/><g transform="translate(98,554)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6l2 13c.2 1 2.3 2 5 2s4.8-1 5-2l2-13"/></g><text x="110" y="602" class="d-alabel" text-anchor="middle">S3</text><text x="110" y="614" class="d-alabel" text-anchor="middle">ファイル置き場</text><rect x="268" y="544" width="44" height="44" rx="4" fill="#E7157B"/><g transform="translate(278,554)" class="d-ico-w"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g><text x="290" y="602" class="d-alabel" text-anchor="middle">CloudWatch</text><text x="290" y="614" class="d-alabel" text-anchor="middle">ログ・監視</text></svg><figcaption>図2 番号は、リクエストが流れる順(1 ユーザー → 2 エッジ → 3 ロードバランサー → 4 サーバー → データベース)。AWSの構成図の作法で描いた簡略版(公式のアイコンではない)。</figcaption></figure>

- 利用者のリクエストは、CloudFrontで受け、静的なファイルは近くから返す
- 動的な処理は、ロードバランサー(ALB)が、複数のAZにあるサーバー(EC2)へ振り分ける
- データベース(RDS)は、外から直接つなげない非公開のサブネットに置く
- 画像やバックアップは、S3に置く。ログと指標は、CloudWatchに集める

## 責任共有モデル

クラウドでは、AWSと利用者で、守る範囲を分けています。

| 範囲 | 担当 | 例 |
| --- | --- | --- |
| クラウド**の**セキュリティ | AWS | データセンターの建物、ハードウェア、仮想化の基盤 |
| クラウド**の中の**セキュリティ | 利用者 | アクセス権の設定、OSの更新、データの暗号化、ネットワークの公開範囲 |

「AWSを使っているから安全」ではありません。たとえば、S3のバケットを誤って公開したり、強い権限のアクセスキーを漏らしたりするのは、利用者側の設定の問題です。サービスによって、利用者の担当する範囲は変わります(EC2はOSの更新まで自分で、Lambdaはコードと権限が中心)。

## 最初にやる安全設定

アカウントを作ったら、サービスを使う前に、次の3つを決めます。

1. **rootユーザーを守る**:最初に作ったメールアドレスのアカウントがrootユーザーで、すべての権限と請求の情報を持ちます。強いパスワードにして、必ず多要素認証(MFA)を設定します。日常の作業には使いません。
2. **日常用のアクセスを別に作る**:公式は、人が使うアクセスには、長く使える認証情報(アクセスキー)ではなく、一時的な認証情報を使うことを勧めています。複数アカウントや複数人で使うなら、IAM Identity Centerでの管理が推奨されています。権限は、必要なものだけに絞ります。
3. **料金の通知を設定する**:予算(AWS Budgets)で、上限の金額と通知先を決めておくと、使いすぎにすぐ気づけます。

IAM Identity Centerを設定した後は、コマンドラインのAWS CLIも、ブラウザでのサインインで使えます。

```bash AWS CLIの例
# IAM Identity Centerでの接続を設定する(画面の案内に従って入力する)
aws configure sso

# 設定した接続でサインインする(<プロファイル名>は、自分で付けた名前)
aws sso login --profile <プロファイル名>

# いま、どのアカウントの誰として操作しているかを確かめる
aws sts get-caller-identity --profile <プロファイル名>
```

> アクセスキーとシークレットは、ソースコードやGitに入れてはいけません。漏れると、第三者に使われて高額な請求につながることがあります。キーを作る必要があるときは、権限を絞り、使わなくなったら削除します。

## 料金の考え方

AWSは使った分だけ課金されます。新しいアカウントには無料で試せる仕組みがあります。公式の発表によると、新規のお客様は、サインアップ時に最大200ドル分のクレジット(100ドルを付与、残りは対象サービスの利用で獲得)を使えます。無料アカウントプランは、サインアップから6か月後か、クレジットを使い切ったときの早い方で終了し、有料プランに移らない限り、課金されません。制度の細部は変わるので、公式のページで確認してください。

よくある予想外の課金の原因は次のとおりです。

- **起動したままのサーバー**:EC2は、動かしている時間に応じて課金される。使い終わったら止めるか、削除する
- **データの転送**:AWSの外へ出るデータには、転送料金がかかることがある
- **ネットワークの部品**:NATゲートウェイのように、置いているだけで時間課金され、通したデータ量でも課金されるものがある
- **忘れたリソース**:ストレージ、ロードバランサー、固定IPなどが、使っていなくても残っていると課金が続く

練習で作ったものは、終わったらまとめて削除します。リソースにタグを付けておくと、何を消せばよいかが分かりやすくなります。

## 学習の進め方

1. 無料のプランで、アカウントを作り、上の3つの安全設定をする
2. S3にファイルを置き、公開しない設定のまま、自分だけが読めることを確かめる
3. EC2でサーバーを1台起動して、つないで、終わったら削除する
4. 小さなWebアプリを、前の構成図の形で作ってみる
5. Lambdaなど、サーバーを持たない形も試す

## 確認リスト

- [ ] rootユーザーに、強いパスワードとMFAを設定したか
- [ ] 日常の作業で、rootユーザーを使っていないか
- [ ] 人が使うアクセスは、一時的な認証情報にしたか。アクセスキーを使うなら、権限を絞ったか
- [ ] アクセスキーが、コードやGitに入っていないか
- [ ] 予算と通知を設定したか
- [ ] 使う場所のリージョンを決めたか。意図しないリージョンで作っていないか
- [ ] 練習で作ったリソースを、終わったら削除したか
