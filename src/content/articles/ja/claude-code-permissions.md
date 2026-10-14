---
title: "権限とモード:Claude Codeに任せる範囲を決める"
description: "確認の頻度を決める権限モードと、allow/ask/denyルールの評価順、ワイルドカードの落とし穴。"
category: "practice"
tags: ["Claude Code","権限","セキュリティ"]
minutes: 8
type: "実践ガイド"
level: "Claude Codeを一度使った人向け"
takeaway: "「毎回確認する」から「任せる」まで、モードとルールで段階的に決める方法です。強制できるのはルールの側で、指示ではないという点が要になります。"
order: 2
sources:
  - { title: "Claude Code — Configure permissions", url: "https://code.claude.com/docs/en/permissions" }
---

## 標準では、何を確認されるか

Claude Codeは、操作の種類ごとに確認の要否が決まっています。読み取りだけなら、作業ディレクトリ内では確認されません。コマンドの実行やファイルの変更は、原則として確認が入ります。確認ダイアログで「今後は聞かない」を選んだときの効果の長さも、操作ごとに違います。

| 操作 | 例 | 確認 |
| --- | --- | --- |
| 読み取り | ファイルの読み込み、Grep | 作業ディレクトリ内では不要 |
| Bashコマンド | シェルの実行 | 必要(組み込みの読み取り専用コマンドを除く) |
| ファイルの変更 | 編集・書き込み | 必要(「今後は聞かない」はセッション終了まで) |
| Webフェッチ | WebFetch | 必要(事前承認済みのドキュメントのドメインを除く) |
| Web検索 | WebSearch | 必要 |

## 権限モード

モードは、どこまで確認を省くかを切り替えます。セッション中はShift+Tabで切り替えられ、起動時に指定するならclaude --permission-mode planのようにします。毎回同じモードで始めたい場合は、設定ファイルのdefaultModeで決めます。

| モード | 挙動 |
| --- | --- |
| default | 各ツールの初回利用時に確認する(CLIでは「Manual」と表示) |
| acceptEdits | 作業ディレクトリ内のファイル編集と、mkdir・mv・cpなどの基本的なファイル操作を自動で許可 |
| plan | 読み取りと調査だけを行い、ソースは編集しない |
| auto | 通常の確認を省き、バックグラウンドの分類器が、依頼に沿った操作かを確認してから実行する |
| dontAsk | 確認が必要になる操作をすべて自動で拒否する。事前に許可したルールは有効 |
| bypassPermissions | 確認を省く(後述の注意を参照) |

## allow・ask・denyのルール

モードより細かく決めたいときは、ルールを書きます。allowは確認なしで許可、askは毎回確認、denyは禁止です。/permissionsを実行すると、すべてのルールと、それぞれがどの設定ファイルにあるかを一覧できます。評価はdeny、ask、allowの順で、最初に一致したものが結果になります。つまり、広いdenyの中に、狭いallowで例外を作ることはできません。

<figure class="diagram"><svg viewBox="0 0 400 440" role="img" aria-labelledby="pf-t"><title id="pf-t">権限ルールの評価の流れ</title><defs><marker id="pf-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="6" width="180" height="34" rx="8" class="d-accent-soft"/><text x="110" y="28" class="d-strong" text-anchor="middle">ツールの呼び出し</text><path d="M110 42 V70" class="d-line" marker-end="url(#pf-a)"/><rect x="20" y="72" width="180" height="50" rx="8" class="d-box"/><text x="110" y="102" class="d-strong" text-anchor="middle">denyルールに一致?</text><path d="M200 97 H238" class="d-line" marker-end="url(#pf-a)"/><text x="219" y="89" class="d-small" text-anchor="middle">はい</text><rect x="240" y="72" width="140" height="50" rx="8" class="d-danger"/><text x="310" y="93" class="d-strong" text-anchor="middle">ブロック</text><text x="310" y="111" class="d-small d-mono" text-anchor="middle">Bash(git push *)</text><path d="M110 124 V156" class="d-line" marker-end="url(#pf-a)"/><text x="118" y="144" class="d-small">いいえ</text><rect x="20" y="158" width="180" height="50" rx="8" class="d-box"/><text x="110" y="188" class="d-strong" text-anchor="middle">askルールに一致?</text><path d="M200 183 H238" class="d-line" marker-end="url(#pf-a)"/><text x="219" y="175" class="d-small" text-anchor="middle">はい</text><rect x="240" y="158" width="140" height="50" rx="8" class="d-warn"/><text x="310" y="179" class="d-strong" text-anchor="middle">毎回確認</text><text x="310" y="197" class="d-small d-mono" text-anchor="middle">Bash(rm *)</text><path d="M110 210 V242" class="d-line" marker-end="url(#pf-a)"/><text x="118" y="230" class="d-small">いいえ</text><rect x="20" y="244" width="180" height="50" rx="8" class="d-box"/><text x="110" y="274" class="d-strong" text-anchor="middle">allowルールに一致?</text><path d="M200 269 H238" class="d-line" marker-end="url(#pf-a)"/><text x="219" y="261" class="d-small" text-anchor="middle">はい</text><rect x="240" y="244" width="140" height="50" rx="8" class="d-ok"/><text x="310" y="265" class="d-strong" text-anchor="middle">確認なしで実行</text><text x="310" y="283" class="d-small d-mono" text-anchor="middle">Bash(npm run *)</text><path d="M110 296 V328" class="d-line" marker-end="url(#pf-a)"/><text x="118" y="316" class="d-small">いいえ</text><text x="310" y="62" class="d-small" text-anchor="middle">ルールの例</text><rect x="20" y="330" width="180" height="52" rx="8" class="d-box"/><text x="110" y="353" class="d-strong" text-anchor="middle">権限モードの既定の動作</text><text x="110" y="371" class="d-small" text-anchor="middle">(defaultなら初回は確認)</text><text x="20" y="410" class="d-small">最初に一致したものが結果になる。</text><text x="20" y="428" class="d-small">広いdenyを、狭いallowで覆すことはできない。</text></svg><figcaption>図1 ルールは deny、ask、allow の順に調べ、最初に一致したものが結果になる。どれにも一致しなければ、権限モードの既定の動作になる。</figcaption></figure>

```json 設定ファイル(settings.json)の例
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)"
    ],
    "deny": [
      "Bash(git push *)",
      "Read(./.env)"
    ]
  }
}
```

## ワイルドカードの落とし穴

Bashルールの\*は、スペースを含む任意の文字列に一致します。\*を書く位置は、サブコマンドの後ろです。Bash(git log \*)はgit logだけを許可しますが、Bash(git \*)はすべてのgitコマンドを許可してしまいます。サブコマンドより前に\*を置いたallowルール(例:Bash(git \* main))は、起動時に警告されます。また、ルールが照合するのは、Claudeが書いたコマンドの文字列です。そのため、deny(Bash(git push \*))を設定していても、別の書き方、たとえばgit -C . pushは一致しません。

- Bash(npm run build) は npm run build だけに一致する(--watchを付けると一致しない)
- Bash(npm run \*) は npm run build や npm run test --watch に一致するが、npm install には一致しない
- 「絶対に実行させない」操作は、denyだけに頼らず、PreToolUseフックなどでも守る

## 設定の優先順位

権限ルールは、ほかの設定と同じ優先順位に従い、組織が配布する管理設定が最も強くなります。どこかの階層でdenyされた操作は、ほかの階層ではallowにできません。ユーザー設定でallowしていても、プロジェクト設定でdenyされていればブロックされます。逆に、ユーザー設定のdenyは、プロジェクト設定のallowよりも強く効きます。

## 指示では、権限は変わらない

権限ルールは、モデルではなくClaude Codeが強制します。プロンプトやCLAUDE.mdに「このコマンドは実行しないで」と書くと、Claudeの試み方には影響しますが、Claude Codeが許可する範囲は変わりません。許可や禁止を確実に変えたいときは、/permissions、ルール、権限モード、PreToolUseフックのいずれかを使います。

> この区別は、前の記事のCLAUDE.mdの節とつながっています。「お願い」はCLAUDE.md、「禁止」は権限ルール、という役割分担です。

## bypassPermissionsは、隔離された環境だけで

bypassPermissionsモードでは、.gitや.claudeのような保護パスへの書き込みも含め、確認がすべて省かれます。コンテナやVMのように、Claude Codeが壊しても影響が出ない環境でだけ使います。このモードやautoモードを使わせたくない場合は、設定のpermissions.disableBypassPermissionsModeやpermissions.disableAutoModeを"disable"にします。管理設定に入れると、ユーザーが上書きできません。
