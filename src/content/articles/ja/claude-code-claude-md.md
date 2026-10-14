---
title: "CLAUDE.mdの書き方:毎回の説明を省く"
description: "置き場所、書き方、長さの目安、守らせたいときの別の手段まで。"
category: "practice"
tags: ["Claude Code","CLAUDE.md","メモリ"]
minutes: 7
type: "実践ガイド"
level: "Claude Codeを一度使った人向け"
takeaway: "CLAUDE.mdは「毎セッションの最初に渡す前提」です。置く場所、書く中身、強制できないことの3点を整理します。"
order: 1
sources:
  - { title: "Claude Code — How Claude remembers your project", url: "https://code.claude.com/docs/en/memory" }
---

## セッションは、毎回まっさらから始まる

Claude Codeは、セッションごとに新しいコンテキストで始まります。前回の会話の内容は、そのままでは引き継がれません。そこで、知識を次のセッションに持ち越す仕組みが2つあります。

> 両方とも「文脈」として渡されるもので、強制される設定ではありません。ルールとして強制したいことは、後の節の方法を使います。

|  | CLAUDE.md | 自動メモリ(auto memory) |
| --- | --- | --- |
| 書く人 | あなた | Claude自身 |
| 内容 | 指示とルール | 修正や好みから得た学び |
| 読み込み | 毎セッション | 毎セッション(先頭200行か25KBまで) |

## どこに置くか

置き場所によって、効く範囲と共有される相手が変わります。範囲の広いものから順に読み込まれ、プロジェクトの指示はユーザーの指示より後に文脈へ入ります。

<figure class="diagram"><svg viewBox="0 0 400 376" role="img" aria-labelledby="md-t"><title id="md-t">CLAUDE.mdが読み込まれる順番</title><defs><marker id="md-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="10" width="360" height="50" rx="8" class="d-box"/><text x="36" y="32" class="d-strong">ユーザー</text><text x="36" y="50" class="d-small">全プロジェクト共通の好み</text><text x="364" y="32" class="d-mono" text-anchor="end">~/.claude/CLAUDE.md</text><path d="M200 61 V73" class="d-line" marker-end="url(#md-a)"/><rect x="20" y="74" width="360" height="50" rx="8" class="d-box"/><text x="36" y="96" class="d-strong">上位のディレクトリ</text><text x="36" y="114" class="d-small">モノレポ全体の共通ルールなど</text><text x="364" y="96" class="d-mono" text-anchor="end">../CLAUDE.md</text><path d="M200 125 V137" class="d-line" marker-end="url(#md-a)"/><rect x="20" y="138" width="360" height="50" rx="8" class="d-box"/><text x="36" y="160" class="d-strong">プロジェクト</text><text x="36" y="178" class="d-small">チームで共有する規約</text><text x="364" y="160" class="d-mono" text-anchor="end">./CLAUDE.md</text><path d="M200 189 V201" class="d-line" marker-end="url(#md-a)"/><rect x="20" y="202" width="360" height="50" rx="8" class="d-box"/><text x="36" y="224" class="d-strong">ローカル</text><text x="36" y="242" class="d-small">自分だけのメモ(.gitignoreに入れる)</text><text x="364" y="224" class="d-mono" text-anchor="end">./CLAUDE.local.md</text><text x="200" y="280" class="d-small" text-anchor="middle">起動時にすべて読み込み、上から順に連結する(上書きではない)</text><rect x="20" y="300" width="360" height="64" rx="8" class="d-dash"/><text x="36" y="324" class="d-strong">サブディレクトリの CLAUDE.md</text><text x="36" y="343" class="d-small">Claudeがそのディレクトリのファイルを</text><text x="36" y="357" class="d-small">読み書きしたときに読み込まれる</text></svg><figcaption>図1 作業ディレクトリとその上位にあるCLAUDE.mdは、起動時に範囲の広いものから順に連結される。サブディレクトリのものは、必要になったときに読み込まれる。</figcaption></figure>

> 作業ディレクトリとその上位のディレクトリにあるファイルは、起動時にすべて読み込まれ、上書きではなく連結されます。サブディレクトリのCLAUDE.mdは、Claudeがそのディレクトリのファイルを読み書きしたときに読み込まれます。

| 範囲 | 場所 | 共有される相手 |
| --- | --- | --- |
| ユーザー | \~/.claude/CLAUDE.md | 自分(全プロジェクト) |
| プロジェクト | ./CLAUDE.md または ./.claude/CLAUDE.md | チーム(ソース管理経由) |
| ローカル | ./CLAUDE.local.md | 自分(そのプロジェクトだけ)。.gitignoreに追加する |

## /initで下書きを作る

ゼロから書かなくても、プロジェクトのルートで/initを実行すると、Claudeがコードベースを調べ、見つけたビルドコマンド、テスト手順、規約を元にCLAUDE.mdを生成します。すでにCLAUDE.mdがある場合は、改善案を出します。生成されたものは下書きです。自分のチームのルールとずれていないか、必ず読んで直します。

```text Claude Code内で実行
/init
```

## 確かめられる形で書く

CLAUDE.mdは文脈として渡されるので、書き方によって守られやすさが変わります。「確認できるくらい具体的」な指示にします。長さは、1ファイル200行以内が目安です。長いと文脈を多く使い、指示が守られにくくなります。矛盾する指示があると、Claudeはどちらかを任意に選ぶことがあるので、古い指示は定期的に消します。

- 「コードをきれいに整形する」ではなく「インデントは2スペース」
- 「変更をテストする」ではなく「コミット前にnpm testを実行する」
- 「ファイルを整理しておく」ではなく「APIハンドラはsrc/api/handlers/に置く」

## 例:小さなプロジェクトのCLAUDE.md

次は、架空のプロジェクトを想定した例です。コマンド、場所、禁止事項といった「確かめられること」だけを、見出しの下に箇条書きにしています。

```markdown CLAUDE.md の例
# プロジェクトの前提

## コマンド
- テスト: `npm test`(コミット前に必ず実行)
- 型チェック: `npm run typecheck`

## 構成
- APIハンドラは `src/api/handlers/` に置く
- 共通の型は `src/types/` にまとめる

## 規約
- インデントは2スペース
- 新しい関数には、対応するテストを同じPRで追加する

## 触らないもの
- `migrations/` の既存ファイルは編集しない(新規追加のみ)
```

## 分割と共有:@importと.claude/rules/

CLAUDE.mdの中で@パスと書くと、そのファイルが起動時に展開されて読み込まれます。たとえば「See @README for project overview and @package.json for available npm commands」のように使います。ただし、importは長いファイルを整理するための機能で、文脈の消費量は減りません。インポートされたファイルも、起動時に読み込まれるためです。一部のファイルにだけ関係する指示は、.claude/rules/ にパス指定のルールとして置くと、該当ファイルを扱うときだけ読み込まれます。

```markdown .claude/rules/api.md の例(frontmatterのpathsで対象を指定)
---
paths:
  - "src/api/**/*.ts"
---
APIハンドラでは、入力を必ずバリデーションしてから処理する。
```

## 守らせたいことは、CLAUDE.mdに書かない

CLAUDE.mdの内容は、Claudeが従おうとする指示ですが、強制ではありません。たとえば「.envを読まない」と書いても、それだけで読み込みが禁止されるわけではありません。確実に止めたい操作は、権限のdenyルールか、PreToolUseフックで制限します。権限の設定は次の記事で扱います。

## 効いていないときの確認

指示が守られないときは、まず読み込まれているかを疑います。/contextを実行して、Memory filesの一覧に目的のCLAUDE.mdがあるか確認します。一覧にないファイルは、Claudeからは見えません。/memoryを実行すると、CLAUDE.mdや自動メモリのファイルの場所を一覧でき、そのまま編集できます。ファイルが長すぎる場合は、起動時と/statusで警告が表示されます。

```text Claude Code内で実行
/context   # Memory filesの一覧を確認
/memory    # ファイルの場所と、自動メモリのオン/オフ
```
