---
title: "個人開発・スタートアップ向けのスタック:小さく作って、運用を軽くする"
description: "少人数で作って、少人数で運用し続けるための技術選びを、実際に動かしているWebアプリの構成(React Router、Cloudflare Workers、D1、Clerk)を例に整理する。"
category: "backend"
tags: ["個人開発","Cloudflare","アーキテクチャ"]
minutes: 13
type: "設計ガイド"
level: "Webアプリを1つ作ったことがあれば十分"
takeaway: "小さなチームのスタックは、「速さ」より「運用の軽さ」で選びます。サーバーを持たない、認証は任せる、デプロイは自動、本番だけ人が確認する。この4つを軸にすると、少人数でも長く回せます。"
order: 13
sources:
  - { title: "React Router — Documentation", url: "https://reactrouter.com/" }
  - { title: "Cloudflare Workers — Documentation", url: "https://developers.cloudflare.com/workers/" }
  - { title: "Cloudflare D1 — Documentation", url: "https://developers.cloudflare.com/d1/" }
  - { title: "Clerk — Documentation", url: "https://clerk.com/docs" }
  - { title: "Drizzle ORM — Documentation", url: "https://orm.drizzle.team/" }
---

## 小さなチームが技術を選ぶ基準

大きな会社の技術選びは、「何千人が使っても耐えるか」から考えます。個人開発や、創業直後のスタートアップは、別の問題を抱えています。人が少なく、時間が足りず、夜中に障害が起きても自分で直すしかありません。

この記事は、実際に動かしている小さなWebアプリ「PAIBOT.app」の構成を例に、少人数で作って、運用し続けるための選び方を整理します。選ぶときの基準は、次の5つです。

1. **サーバーを持たない**:OSの更新や、サーバーの再起動、容量の心配を、自分で抱えない
2. **固定費が小さい**:使われなければ、ほとんどお金がかからない形から始められる
3. **任せられるものは任せる**:認証や、決済、メールなど、間違えると危ないものは、専門のサービスに任せる
4. **テストとデプロイが自動**:少人数ほど、手作業の確認で時間を失う
5. **後から動かせる**:特定の会社にだけ縛られない作りにしておく

> この記事の構成は、一つの例です。正解ではありません。サービスの機能、料金、無料枠は変わるので、使う前に、各社の公式ドキュメントで確認してください。

## 全体の構成

PAIBOT.appは、ブラウザで使える小さなツール集に、ログインとお気に入りの機能を足したWebアプリです。構成は次のとおりです。

<figure class="diagram"><svg viewBox="0 0 400 396" role="img" aria-labelledby="sk-t"><title id="sk-t">小さなWebアプリの構成(React Router + Cloudflare)</title><defs><filter id="sk-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="sk-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="sk-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="8" y="8" width="150" height="44" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="32" cy="30" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(23,21) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="54" y="34.5" class="d-ntitle">ブラウザ</text><g class="k-d"><rect x="242" y="8" width="150" height="44" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="266" cy="30" r="14" class="d-badge"/></g><g class="k-d"><g transform="translate(257,21) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="288" y="28" class="d-ntitle">Clerk</text><text x="288" y="43" class="d-nsub">認証(外部サービス)</text><path d="M160 30 H240" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M160 30 H240"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><text x="200" y="24" class="d-nsub" text-anchor="middle">サインイン</text><path d="M83 54 V108" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M83 54 V108"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><path d="M317 54 V108" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0s" repeatCount="indefinite" path="M317 54 V108"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0s" repeatCount="indefinite"/></circle><text x="325" y="84" class="d-nsub">本人を確認</text><rect x="8" y="74" width="384" height="312" rx="14" fill="url(#sk-g)" class="d-group"/><text x="24" y="94" class="d-gtitle">Cloudflare</text><g class="k-a"><rect x="24" y="110" width="352" height="56" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="48" cy="138" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,129) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="136" class="d-ntitle">Worker</text><text x="70" y="151" class="d-nsub">React Router のSSRとAPI</text><path d="M78 168 V204" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="0.5s" repeatCount="indefinite" path="M78 168 V204"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="206" width="108" height="72" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="78" cy="227" r="13" class="d-badge"/></g><g class="k-ok"><g transform="translate(69,218) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="78" y="254" class="d-ntitle" text-anchor="middle">D1</text><text x="78" y="268" class="d-nsub" text-anchor="middle">SQLite互換のDB</text><path d="M200 168 V204" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.2s" begin="1s" repeatCount="indefinite" path="M200 168 V204"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.2s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="146" y="206" width="108" height="72" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="200" cy="227" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(191,218) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="200" y="254" class="d-ntitle" text-anchor="middle">Workers AI</text><text x="200" y="268" class="d-nsub" text-anchor="middle">モデルを呼ぶ</text><path d="M322 168 V204" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M322 168 V204"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="268" y="206" width="108" height="72" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="322" cy="227" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(313,218) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="322" y="254" class="d-ntitle" text-anchor="middle">レート制限</text><text x="322" y="268" class="d-nsub" text-anchor="middle">IPごとの回数</text><g class="k-n"><rect x="24" y="308" width="352" height="56" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="48" cy="336" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,327) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="70" y="334" class="d-ntitle">静的ファイル</text><text x="70" y="349" class="d-nsub">画像・JS・CSSを配信</text></svg><figcaption>図1 サーバーは持たない。ブラウザからのリクエストをWorkerが受け、DB、AI、レート制限をバインディングで使う。認証は外部のサービスに任せる。</figcaption></figure>

- **フレームワーク**:React Router(フレームワークモード)。サーバー側で画面を作り(SSR)、ブラウザでは操作できる部品として動く
- **実行環境**:Cloudflare Workers。自分のサーバーはなく、世界中の拠点で、リクエストのたびにコードが動く
- **データベース**:Cloudflare D1(SQLite互換)。ORMはDrizzleを使う
- **認証**:Clerk。ログイン画面も、パスワードの保存も、自分では作らない
- **AI**:Workers AIをバインディングで呼ぶ。外部のAIサービスのAPIキーを持たずに済む
- **レート制限**:Workersのレート制限機能で、IPごとの回数を絞る

## 各層の選択と理由

| 層 | 選んだもの | 理由 |
| --- | --- | --- |
| 画面 | React Router(SSR) | 検索エンジンに読まれる画面を、サーバー側で作れる。ルーティングとデータ取得が、1つの仕組みにまとまる |
| 実行環境 | Cloudflare Workers | サーバーの運用が要らない。使われない時間は、ほぼお金がかからない形から始められる |
| データ | D1 + Drizzle | 別のDBサーバーを立てなくてよい。型のあるクエリが書ける。スキーマの変更はマイグレーションで管理する |
| 認証 | Clerk | 認証は、自作すると間違えやすく、間違えたときの被害が大きい。専門のサービスに任せる |
| 国際化 | use-intl | 日本語、英語、中国語を、メッセージのファイルで管理する |
| テスト | Nodeの標準テスト + Playwright | 計算などの部品は軽い単体テスト、画面はブラウザで1本の流れを確かめる |
| 設定の管理 | Wrangler + Terraform | 同じものを2か所で管理しない。アプリに近いものはWrangler、アカウント全体の設定はTerraform |

「Workersだから速い」「D1だから安い」ではなく、**運用に手間がかからない**ことを理由にしています。

## 作る順番の工夫:ツール1つ、フォルダ1つ

ツールが増えても散らからないように、新しいツールは、1つのフォルダに、自分の部品をすべて入れる決まりにしています。画面、ロジック、単体テスト、ブラウザのテストが同じフォルダにあり、共通の一覧に登録するだけで、トップページの検索や、サイトマップにも反映されます。

- 変更が影響するツールだけ、ブラウザのテストを動かす(共通の部品を変えたときは全部動かす)
- 共通の確認(3つの言語で開ける、エラーが出ない、スマホ幅に収まる)は、テストを書かなくても、全ツールに自動で効く
- 環境に依存するコード(Cloudflare専用の機能)は、サーバー専用のファイルに閉じ込める

最後の点は、「後から動かせる」ための工夫です。環境に依存する部分を薄い層にしておくと、実行環境を変えるときの影響が小さくて済みます。

## デプロイの流れ

少人数のチームでは、デプロイを人の手でやるほど、ミスが増えます。PAIBOT.appでは、次の流れにしています。

<figure class="diagram"><svg viewBox="0 0 400 392" role="img" aria-labelledby="df-t"><title id="df-t">変更が本番に出るまでの流れ</title><defs><filter id="df-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="df-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="df-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="40" y="10" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="37" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(55,28) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="86" y="41.5" class="d-ntitle">変更を出す(PR)</text><path d="M200 66 V86" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="0s" repeatCount="indefinite" path="M200 66 V86"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="40" y="88" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="115" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(55,106) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="86" y="113" class="d-ntitle">自動で検査</text><text x="86" y="128" class="d-nsub">型・単体テスト・ビルド・ブラウザテスト</text><path d="M200 144 V164" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="0.5s" repeatCount="indefinite" path="M200 144 V164"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="40" y="166" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="193" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(55,184) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="86" y="191" class="d-ntitle">開発環境へ自動デプロイ</text><text x="86" y="206" class="d-nsub">Accessで、許可した人だけが開ける</text><path d="M200 222 V242" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="1s" repeatCount="indefinite" path="M200 222 V242"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="1s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="40" y="244" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="271" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(55,262) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="86" y="269" class="d-ntitle">本番は手動で実行</text><text x="86" y="284" class="d-nsub">開発で成功したかを確認。戻すときはタグを指定</text><path d="M200 300 V320" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="1.5s" repeatCount="indefinite" path="M200 300 V320"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="40" y="322" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="349" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(55,340) scale(.75)" class="d-ico"><path d="M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01"/></g></g><text x="86" y="347" class="d-ntitle">本番へデプロイ</text><text x="86" y="362" class="d-nsub">DBのマイグレーションも同じ手順で</text><path d="M26 12 V218" stroke="var(--ok)" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M26 244 V376" stroke="var(--warn)" stroke-width="3" stroke-linecap="round" opacity=".7"/><text transform="translate(14,115) rotate(-90)" class="d-nsub" text-anchor="middle">自動</text><text transform="translate(14,310) rotate(-90)" class="d-nsub" text-anchor="middle">人が確認</text></svg><figcaption>図2 検査と開発環境へのデプロイは自動で、本番だけ人が実行する。その手動の実行が、確認のステップになる。</figcaption></figure>

- 変更を出す(PR)たびに、型の検査、単体テスト、ビルド、ブラウザのテストを自動で動かす
- メインに入ったら、**開発環境へ自動でデプロイ**する。開発環境は、Cloudflare Accessで、許可した人だけが開けるようにしている
- **本番は、人が手動で実行する**。その変更が開発環境で成功していることを、本番の手順の中で確認する。問題があれば、タグを指定して、以前の版に戻せる
- データベースの変更(マイグレーション)も、本番のデプロイの手順に含める

本番だけ手動にしているのは、「自動で全部が本番に出る」のが怖いからです。人が確認するステップが、手動の実行そのものです(当時は、チームの承認機能が、使っていたプランにはなかったため、この形にしました)。

## 実際に踏んだ罠

最初から今の構成だったわけではありません。このアプリは、最初はNext.jsを、ベータ版のアダプターでCloudflare Workersに載せて作りました。動きましたが、前例の少ない組み合わせで、認証ライブラリの読み込みや、国際化ライブラリの二重読み込みなど、接続部分で何度か詰まりました。結果として、Workersで素直に動く、React Routerに移しました。

ここから言えることは、次のとおりです。

- **本番には、前例の多い組み合わせを選ぶ**:ベータ版の部品が間に入ると、不具合の原因が、自分のコードか部品か分からなくなる
- **詰まったら、二重のモジュールを疑う**:同じライブラリが2つの経路で読み込まれると、片方の状態がもう片方に見えない。エラーの場所は、ライブラリの内部に出る
- **移行できる形を保つ**:境界を薄くしておいたので、大きな書き換えではなく、移行で済んだ

## 個人開発とスタートアップで、変えるところ

| 観点 | 個人開発 | 創業直後のスタートアップ |
| --- | --- | --- |
| 優先すること | 作り続けられること | 検証の速さと、後から直せること |
| 認証 | 任せる(自作しない) | 任せる。企業向けのログイン(SSO)が要るか早めに確認する |
| データベース | 小さく始める。1つにまとめる | 将来の移行を想定して、DBへのアクセスを1か所にまとめる |
| 費用 | 無料枠から始める | 無料枠が尽きる境目と、その後の料金を、先に見積もる |
| 監視 | エラーを見られる最低限 | 障害の連絡と、対応の担当を決める |
| 人が増えたとき | あまり考えない | テストと、デプロイの自動化が、人を増やす前提になる |

## 選ぶときの注意

- **サービスへの依存**:便利な機能ほど、そのサービスに寄ります。依存の入り口を、薄い層にまとめておくと、動かしやすい
- **無料枠の落とし穴**:無料枠が大きくても、条件や上限は変わる。使い方が増えたときの料金を、早めに見ておく
- **データの置き場所**:ユーザーのデータをどこに置くか(地域、法令)は、後から変えにくい。早めに決める
- **任せられないもの**:権限の設計(誰が何を見られるか)は、サービスに任せても、設計は自分の仕事

## 確認リスト

- [ ] 自分でOSやサーバーを管理しなくてよい構成になっているか
- [ ] 認証や決済を、自作していないか
- [ ] 変更を出すたびに、テストが自動で動くか
- [ ] 本番へ出す前に、人が確認するステップがあるか。以前の版に戻す手順があるか
- [ ] データベースの変更を、記録して管理しているか
- [ ] 環境依存のコードが、1か所にまとまっているか
- [ ] 無料枠の上限と、超えたときの料金を調べたか
- [ ] 障害のときに、誰が気づいて、誰が直すかを決めたか
