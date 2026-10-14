---
title: "実践ワークフロー:調べる・直す・分けて進める"
description: "プランモード、サブエージェント、worktree、PR作成まで、日常の作業に沿った進め方。"
category: "practice"
tags: ["Claude Code","ワークフロー","Git"]
minutes: 7
type: "実践ガイド"
level: "Claude Codeを一度使った人向け"
takeaway: "変更の前に計画を見る、調査を別の文脈に逃がす、並行作業を分離する、という3つの工夫を中心に整理します。"
order: 3
sources:
  - { title: "Claude Code — Common workflows", url: "https://code.claude.com/docs/en/common-workflows" }
---

## 変更の前に、計画を見る(プランモード)

変更をディスクに書き込む前に確認したいときは、プランモードを使います。Claudeはファイルを読んで計画を提案しますが、承認するまで編集はしません。起動時にclaude --permission-mode planで指定するか、セッション中にShift+Tabでモードを切り替えて、ステータスバーに「⏸ plan mode on」と出ていることを確認します。

<figure class="diagram"><svg viewBox="0 0 400 322" role="img" aria-labelledby="pl-t"><title id="pl-t">プランモードの流れ</title><defs><marker id="pl-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="10" width="360" height="56" rx="8" class="d-ok"/><circle cx="46" cy="38" r="12" class="d-accent"/><text x="46" y="42.5" class="d-white" text-anchor="middle">1</text><text x="70" y="34" class="d-strong">調べる</text><text x="70" y="52" class="d-small">ファイルを読む</text><text x="368" y="30" class="d-small" text-anchor="end">編集なし</text><path d="M200 68 V86" class="d-line" marker-end="url(#pl-a)"/><rect x="20" y="88" width="360" height="56" rx="8" class="d-ok"/><circle cx="46" cy="116" r="12" class="d-accent"/><text x="46" y="120.5" class="d-white" text-anchor="middle">2</text><text x="70" y="112" class="d-strong">計画を出す</text><text x="70" y="130" class="d-small">変更の方針を提案する</text><text x="368" y="108" class="d-small" text-anchor="end">編集なし</text><path d="M200 146 V164" class="d-line" marker-end="url(#pl-a)"/><rect x="20" y="166" width="360" height="56" rx="8" class="d-ok"/><circle cx="46" cy="194" r="12" class="d-accent"/><text x="46" y="198.5" class="d-white" text-anchor="middle">3</text><text x="70" y="190" class="d-strong">あなたが確認</text><text x="70" y="208" class="d-small">OKなら承認、違えば修正を依頼</text><text x="368" y="186" class="d-small" text-anchor="end">編集なし</text><path d="M200 224 V242" class="d-line" marker-end="url(#pl-a)"/><rect x="20" y="244" width="360" height="56" rx="8" class="d-warn"/><circle cx="46" cy="272" r="12" class="d-accent"/><text x="46" y="276.5" class="d-white" text-anchor="middle">4</text><text x="70" y="268" class="d-strong">実行</text><text x="70" y="286" class="d-small">承認したあとで、ファイルを編集する</text><text x="368" y="264" class="d-small" text-anchor="end">編集する</text></svg><figcaption>図1 プランモードでは、Claudeは承認されるまでファイルを編集しない。方向がずれていたら、計画の段階なら文章を直すだけで済む。</figcaption></figure>

```bash Shell
claude --permission-mode plan
```

> 大きな変更ほど、先に計画を見る価値があります。計画の段階で方向がずれていれば、直すのは文章だけで済みます。

## 調査は、サブエージェントに任せる

大きなコードベースを調べると、ファイルの読み込みで会話の文脈が埋まっていきます。調査をサブエージェントに任せると、読み込みはそのエージェントの文脈の中で行われ、メインの会話には要約だけが戻ります。

```text プロンプトの例(公式の例)
use a subagent to investigate how our auth system handles token refresh
```

## バグの修正:再現、原因、修正、確認

修正の依頼には、再現するコマンドとスタックトレースを添えます。流れは4段階です。(1)エラーと再現手順を渡す、(2)修正案を複数挙げてもらう、(3)選んだ案を適用してもらう、(4)テストを実行して確認する。(2)を挟むと、Claudeが最初に思いついた1案をそのまま採用するのを避けられます。確認の段階では、Claudeの「直りました」ではなく、実行したテストの結果を見ます。

## テストの追加

まずテストされていない関数を探してもらい、次にテストを書いてもらい、最後に境界値のテストを足してもらいます。Claudeは既存のテストファイルを見て、フレームワークや書き方をそろえようとします。何を確認したいテストなのかを具体的に伝えるほど、期待に近いものが出ます。

```text プロンプトの例(公式の例)
find functions in NotificationsService.swift that are not covered by tests
add tests for the notification service
add test cases for edge conditions in the notification service
run the new tests and fix any failures
```

## 並行作業は、worktreeで分ける

1つの機能を作りながら、別のバグの修正も進めたいときは、Gitのworktreeを使います。--worktreeを付けて起動すると、専用のチェックアウトとブランチが作られ、編集が衝突しません。別の端末で別の名前を指定すれば、もう1つ独立したセッションが始まります。worktreeは既存のコミットから作られるため、コミットが1つもないリポジトリでは「Failed to resolve base branch "HEAD"」で失敗します。

```bash Shell
claude --worktree feature-auth
```

## プルリクエストを作る

変更が終わったら、「create a pr」と頼むだけでもPRを作れます。手順を分けるなら、まず変更の要約を頼み、次にPRを作らせ、最後に説明文を補強します。生成されたPRは、提出する前に必ず読みます。リスクや注意点を挙げてもらうと、見落としに気づきやすくなります。あとで作業を探すときは、claude --from-pr 1234のようにPR番号を指定します。

```text プロンプトの例(公式の例)
summarize the changes I've made to the authentication module
create a pr
enhance the PR description with more context about the security improvements
```

## 繰り返す作業:スクリプト、スケジュール

-pで対話なしに実行すれば、CIやコミット前のフックから呼べます。定期的に回したい作業には、クラウドで動くルーチン、デスクトップアプリのスケジュールタスク、GitHub Actions、セッション内で繰り返す/loopがあります。無人で動く作業は質問を返せないので、成功の基準と、結果の出し先をプロンプトにはっきり書きます。

## 仕上げに、確かめる

どのワークフローでも、最後は差分とテストの結果を自分で読みます。「直りました」というClaudeの報告ではなく、実際に実行したテストの出力と、git diffで見える変更の範囲を確かめます。意図しないファイルが変わっていないか、依存が増えていないかも、ここで見ます。

```bash Shell
git diff
git status --short
npm test
```
