---
title: "Claude Codeを始める:インストールから最初の依頼まで"
description: "ターミナルで動くコーディングエージェントを、インストールして最初の1件を任せるまで。"
category: "practice"
tags: ["Claude Code","入門","CLI"]
minutes: 6
type: "入門ガイド"
level: "ターミナルの基本操作が前提"
takeaway: "インストール、起動、最初の依頼、続きからの再開までを、公式ドキュメントの手順に沿って一通り押さえます。"
order: 0
sources:
  - { title: "Claude Code — Overview", url: "https://code.claude.com/docs/en/overview" }
  - { title: "Claude Code — Common workflows", url: "https://code.claude.com/docs/en/common-workflows" }
---

## Claude Codeとは

Claude Codeは、コードベースを読み、ファイルを編集し、コマンドを実行するコーディングエージェントです。ターミナルだけでなく、IDE拡張、デスクトップアプリ、Webからも使えます。どの画面も同じエンジンにつながっているため、リポジトリのCLAUDE.md、設定、MCPサーバーは共通で使えます。この記事は2026年10月時点の公式ドキュメントに基づきます。コマンドとフラグの存在は、筆者の環境(Claude Code 2.1.284)で確認しました。

| 使う場所 | 向いている場面 |
| --- | --- |
| ターミナル(CLI) | 全機能を使う基本形。スクリプトやCIからも呼べる |
| VS Code / JetBrains | エディタ内で差分を見ながら進めたいとき |
| デスクトップアプリ | 複数セッションを並べて差分を見たいとき |
| Web(claude.ai/code) | ローカル環境なしで、長めの作業を任せたいとき |

## インストールして、動作を確かめる

公式が推奨するのはネイティブインストールで、バックグラウンドで自動更新されます。HomebrewとWinGetでも入れられますが、こちらは自動更新されないため、定期的に自分でアップグレードします。お使いの環境のタブを選んでください。インストール後は新しいターミナルを開き、バージョンが表示されれば完了です。「claudeが見つからない」と出る場合は、インストール先がPATHに入っていません。

```bash tab:"macOS / Linux / WSL" ネイティブインストール(自動更新あり)
curl -fsSL https://claude.ai/install.sh | bash
```

```powershell tab:"Windows PowerShell" ネイティブインストール(自動更新あり)
irm https://claude.ai/install.ps1 | iex
```

```bat tab:"Windows CMD" ネイティブインストール(自動更新あり)
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

```bash tab:"Homebrew" 自動更新なし
brew install --cask claude-code

# あとで更新するとき
brew upgrade claude-code
```

```powershell tab:"WinGet" 自動更新なし
winget install Anthropic.ClaudeCode

# あとで更新するとき
winget upgrade Anthropic.ClaudeCode
```

```bash 動作確認
claude --version
```

> ネイティブWindowsでは、Git for Windowsを入れておくと、BashツールをClaude Codeが使えます。

## 最初の起動

作業したいプロジェクトのディレクトリに入って、claudeを実行します。初回はログインを求められます。使うにはClaudeのサブスクリプションか、AnthropicのConsoleアカウントが必要です。環境変数ANTHROPIC\_API\_KEYを設定済みで、起動時に聞かれるそのキーの利用を承認した場合は、ログインを省略できます。

```bash Shell
cd your-project
claude
```

## 最初の依頼は、「読む」ことから

いきなり変更を頼むより、まず構造を説明してもらうのがおすすめです。広い質問から始めて、気になった部分に絞り込みます。プロジェクト固有の用語集を作ってもらうのも、新しいコードベースに入るときに役立ちます。

```text プロンプトの例(公式の例)
give me an overview of this codebase
explain the main architecture patterns used here
what are the key data models?
how is authentication handled?
```

## エラーを直してもらう

バグの修正では、エラーの文面に加えて、再現するコマンドとスタックトレースを渡すと、原因の絞り込みが速くなります。間欠的に起きるのか、毎回起きるのかも添えます。直す前に「修正案をいくつか挙げて」と頼み、選んでから適用してもらう、という2段階にすると、変更の理由を確認できます。

```text プロンプトの例(公式の例)
I'm seeing an error when I run npm test

suggest a few ways to fix the @ts-ignore in user.ts

update user.ts to add the null check you suggested
```

## @でファイルを指す

@のあとにパスを書くと、そのファイルの内容を会話に含められます。ディレクトリを指した場合は、中身ではなくファイルの一覧が入ります。スクリーンショットは、ターミナルへのドラッグ&ドロップか、Ctrl+Vで貼り付けられます。エラー画面やUIの崩れを見せたいときに便利です。

- @src/utils/auth.js のように書くと、そのファイルが読み込まれる(大きすぎるファイルは含まれない)
- @src/components のようにディレクトリを指すと、ファイル一覧が入る
- @で参照したファイルのディレクトリにあるCLAUDE.mdも、あわせて文脈に追加される

## 前回の続きから再開する

会話はローカルに保存されるので、作業が複数回にまたがっても説明し直す必要はありません。直近のセッションに戻るならclaude --continue、一覧から選ぶならclaude --resume、起動後に切り替えるなら/resumeです。現在のディレクトリに会話がないときは、claude --continueは「No conversation found to continue」と表示して終了します。

```bash Shell
claude --continue
claude --resume
```

## 対話せずに使う(-p)

-p(--print)を付けると、答えを表示して終了します。標準入力と標準出力は、ほかのUnixコマンドと同じように使えるので、パイプでログやdiffを渡せます。CIやフックから呼ぶときの基本形です。

```bash Shell
git log --oneline -20 | claude -p "summarize these recent commits"
git diff main --name-only | claude -p "review these changed files for security issues"
```

> 次の記事では、毎回の説明を省くためのCLAUDE.mdを扱います。
