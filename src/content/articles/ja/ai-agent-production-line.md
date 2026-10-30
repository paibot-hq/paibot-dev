---
title: "AIエージェントに本番を触らせない分担:コードはAI、マージと本番と秘密は人"
description: "Claude Codeと一緒に、データベースの変更から本番のデプロイまでを進めた記録。AIはコードと手元の検証、人はマージと本番の実行と秘密の入力、という分担にして、実際に起きた失敗と、それでも事故にならなかった理由をまとめる。"
category: "practice"
tags: ["Claude Code","運用","セキュリティ","デプロイ"]
minutes: 9
type: "実践ガイド"
level: "Claude Codeで、実際のサービスを触り始めた人向け"
takeaway: "AIには、コードを書き、手元で確かめ、公開されたページを外から確かめるところまでを任せます。マージ、本番での実行、秘密の入力は人がやります。この線を引いておくと、AIの書いたスクリプトに不具合があっても、本番で壊れる前に止まりました。"
order: 19
sources:
  - { title: "Claude Code — Choose a permission mode", url: "https://code.claude.com/docs/en/permission-modes" }
  - { title: "Claude Code — Configure permissions", url: "https://code.claude.com/docs/en/permissions" }
  - { title: "1Password CLI", url: "https://developer.1password.com/docs/cli/" }
---

## この記事の前提

あるサービスに、新しい種類の商品(約7万件)を足す作業を、Claude Codeと一緒に進めました。データベースの表を足し、毎日の取り込みを直し、サイトの検索に混ぜ、7万件分のベクトル(意味で探すための数値)を作る、という一連の作業です。リポジトリは3つ、本番はVMのPostgreSQLと、Cloudflare Workersのサイトです。

この記事は、そのときの分担と、実際に起きたことの記録です。設定の細かい書き方は、[権限の記事](../claude-code-permissions/)と、[.envの実験の記事](../protect-env-files/)にあります。

## 分担:どこまでをAIに任せるか

| 作業 | 誰が | 理由 |
| --- | --- | --- |
| コードを書く、テストを足す | AI | 速く、書いた理由も説明できる |
| 手元のDB(コンテナ)で動かす、測る | AI | 壊しても、作り直せばよい |
| コミット | AI | 手元だけの変更で、いつでも戻せる |
| push、マージリクエストを作る | AI(**人が「はい」と言ってから**) | 外に出る。CIが動き、ほかの人に見える |
| マージ | 人 | mainに入ると、CIが本番にデプロイする |
| 本番のサーバーでの実行(デプロイのスクリプトなど) | 人 | 戻しにくい。本番のデータに触れる |
| パスワードやトークンの入力 | 人 | AIの会話に、秘密を一度も入れない |
| 公開されたページを外から確かめる | AI | 読むだけで、誰でもできる操作 |

<figure class="diagram"><svg viewBox="0 0 400 460" role="img" aria-labelledby="al-t"><title id="al-t">AIと人の分担</title><defs><filter id="al-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="al-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="al-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><text x="102" y="18" class="d-gtitle" text-anchor="middle">AI(手元で完結、戻せる)</text><text x="298" y="18" class="d-gtitle" text-anchor="middle">人(外に出る、戻しにくい、秘密)</text><path d="M200 28 V450" class="d-group"/><g class="k-a"><rect x="8" y="32" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="56" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,47) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="54" y="54" class="d-ntitle">コードとテスト</text><text x="54" y="69" class="d-nsub">手元のDBで動かして測る</text><path d="M102 82 V90" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M102 82 V90"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="92" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="116" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,107) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="54" y="114" class="d-ntitle">コミット</text><text x="54" y="129" class="d-nsub">いつでも戻せる</text><path d="M102 142 V146 H298 V150" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M102 142 V146 H298 V150"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="204" y="152" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="228" cy="176" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(219,167) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="250" y="174" class="d-ntitle">「はい」と言う</text><text x="250" y="189" class="d-nsub">pushとMRの許可</text><path d="M298 202 V206 H102 V210" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M298 202 V206 H102 V210"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="212" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="236" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,227) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="54" y="234" class="d-ntitle">pushとMR</text><text x="54" y="249" class="d-nsub">CIが検査する</text><path d="M102 262 V266 H298 V270" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M102 262 V266 H298 V270"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="204" y="272" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="228" cy="296" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(219,287) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="250" y="294" class="d-ntitle">マージ</text><text x="250" y="309" class="d-nsub">CIが本番へデプロイ</text><path d="M298 322 V330" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M298 322 V330"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="204" y="332" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="228" cy="356" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(219,347) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="250" y="354" class="d-ntitle">本番で実行</text><text x="250" y="369" class="d-nsub">秘密は画面に出さず入力</text><path d="M298 382 V386 H102 V390" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M298 382 V386 H102 V390"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="8" y="392" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="416" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(23,407) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="54" y="414" class="d-ntitle">出力を読んで確かめる</text><text x="54" y="429" class="d-nsub">外から公開ページも見る</text></svg><figcaption>図1 手元で完結して戻せるものはAI、外に出るもの・戻しにくいもの・秘密は人。人が貼った出力を、AIが読んで次に進む。</figcaption></figure>

線の引き方は単純です。**手元で完結して、戻せるものはAI。外に出るもの、戻しにくいもの、秘密は人。**

## 本番のサーバーは、人が実行する

デプロイのスクリプトは、VMにSSHで入り、ファイルを置き、DBの変更を当て、一度動かしてから、タイマーを有効にします。このスクリプトを、AIは実行しません。

実際に、AIが本番のDBの中身を「読むだけ」のつもりでSSHのコマンドを出したときも、auto モードの判定(操作を別のモデルが確認する仕組み)が止めました。本番のサーバーに入る操作は、読むだけでも、人が実行する扱いです。

その代わり、AIは**人が貼った出力を読んで**次に進みます。

- 人:デプロイのスクリプトを実行し、出力をそのまま貼る
- AI:出力を読み、「新しい表は今回作られた(既にあるという通知が出ていない)」「3つの分類の取り込みが完了した」と確かめる
- AI:確かめられないことは、人に頼むコマンドとして渡す(どのコマンドを、何が出れば成功か、まで書く)

スクリプトは、**何度実行しても同じ結果になる**ように書きます(`CREATE TABLE IF NOT EXISTS`、二度目は何も変えない `UPDATE` など)。人が途中で止めても、もう一度実行すればよい形にしておくと、人に頼みやすくなります。

## 秘密は、会話に入れない

本番のDBに7万件分のベクトルを書き込むには、DBのパスワードが要りました。AIには、パスワードを渡しません。人が、自分のターミナルで、画面に出さずに入力します。

```bash ターミナル(人が実行)
read -s "PGPASSWORD?DB password: " && export PGPASSWORD && echo
PG_URL='postgres://app@127.0.0.1:55440/app' node scripts/embed-products.mjs --other
unset PGPASSWORD
```

- `read -s` は、入力を画面に出さない(zshの書き方。bashでは `read -rs -p "..." PGPASSWORD`)
- 接続文字列にはパスワードを書かず、`PGPASSWORD` で渡す。Nodeの `pg` も、`psql` も、この環境変数を読む。記号を含むパスワードでも、URLのエスケープが要らない
- 終わったら `unset` する。シェルの履歴にも、AIの会話にも残らない

AIの側は、**値ではなく、あるかどうかだけ**を確かめます。デプロイのスクリプトは、設定ファイルに必要な変数が2つとも入っているかを、値を表示せずに調べてから始まります。

```bash deploy.sh(抜粋)
[ "$(grep -c -E '^(API_ID|AFFILIATE_ID)=.' "$ENV_FILE")" = 2 ] || { echo "API_ID and AFFILIATE_ID not both in $ENV_FILE"; exit 1; }
```

トークンも同じです。人が手元で入力し、パイプでSSHの先の、`root` だけが読めるファイルに流し込みます。保管場所は、パスワード管理ツール(1Password)です。

## 実際に起きた失敗

### 1. 許可の前にpushした

一度、AIが、CIの設定を足したコミットを、許可を待たずにpushしました。人が「何をしていますか?」と止め、AIが経緯を説明して謝りました。害はありませんでしたが、pushは外に出る操作です。

それ以来、「pushとデプロイは、はっきり指示があるまでしない」を、AIの記憶(プロジェクトのメモ)に書いて、毎回の会話で読ませています。**一度言われたことを、次の会話でも守らせる仕組み**が要ります。

### 2. AIの書いたスクリプトが、本番で最初に落ちた

ベクトルを作るスクリプトに、新しい表を対象にする `--other` という指定を、AIが足しました。人が本番に向けて実行すると、すぐに落ちました。

```text 出力(抜粋)
70568 titles to embed
error: syntax error at or near "0.0059967041015625"
```

原因は、表の名前を入れた変数 `vectors` を、ループの中で、計算したベクトルを入れる同じ名前の変数が隠していたことです。`INSERT INTO ${vectors}` に、表の名前ではなく、数値の列が入っていました。

事故にならなかったのは、次の理由です。

- 最初の書き込みで落ちたので、何も書き込まれていなかった
- スクリプトは「まだベクトルのない行だけ」を対象にするので、直してから、そのまま再実行できた(7万件を、約10分で完了)
- 実行したのは人で、出力をそのまま貼ったので、AIがすぐに原因を特定できた

反省点は、**新しい指定を足したら、手元のDBで少しだけ(`--limit 100` など)流してから、本番に渡す**ことです。手元のテストは、検索のSQLにはありましたが、このスクリプトにはありませんでした。

## 外から確かめるのは、AIに任せてよい

デプロイの後の確認は、公開されているページを読むだけなので、AIに任せました。

- サイトマップに、新しい商品が入ったか(2026年分で36,407件)
- 新しい商品のページが200で開き、「似た作品」の欄が出るか
- 既存のページの表示時間が、変わっていないか
- `robots.txt` と、ページの `noindex` の有無

ただし、外部への問い合わせが、そのまま費用や数字に影響する操作(広告のリンクを踏む、課金のあるAIを呼ぶ)は、確かめる側でも避けます。チャットの検索は、呼ぶたびに費用がかかるので、試さずに「試していない」と報告させました。

## 環境の制約も、AIに伝えておく

AIは、言われていない制約を知りません。このときは、次のことを、プロジェクトのメモに書いていました。

- **内蔵ディスクがいっぱいなので、一時ファイルは外付けのSSDに置く**(`TMPDIR=/Volumes/.../.tmp` を付けて、開発サーバーやテストを動かす)
- **自分が起動していないプロセスは止めない**(ほかの作業の開発サーバーが、同じマシンで動いている)
- **本番のサーバーへの変更は、人が実行する**
- **広告のリンクに、自分からアクセスしない**(クリックの数字が汚れる)

一つずつは小さな決まりですが、書いておかないと、AIは毎回、同じところでつまずきます。

## チェックリスト

- [ ] push、マージ、本番での実行を、人の明示の指示まで待たせているか
- [ ] 秘密を、AIの会話にも、シェルの履歴にも入れていないか(`read -s`、環境変数、パスワード管理ツール)
- [ ] AIには、秘密の値ではなく、「あるかどうか」だけを確かめさせているか
- [ ] 本番で動かすスクリプトは、何度実行しても同じ結果になるか。途中で止めても再開できるか
- [ ] 新しい指定やスクリプトを、手元で少量流してから、本番に渡しているか
- [ ] 一度決めたルールを、次の会話でも読まれる場所(メモ、CLAUDE.md)に書いたか
- [ ] 確かめていないことを、AIが「確かめていない」と報告しているか
