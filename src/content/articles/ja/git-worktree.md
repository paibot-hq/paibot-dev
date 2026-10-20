---
title: "git worktree:ブランチごとに作業フォルダを分ける"
description: "stashやcloneをせずに、1つのリポジトリで複数のブランチを同時に開く方法。"
category: "practice"
tags: ["Git","worktree","ワークフロー"]
minutes: 5
type: "実践ガイド"
level: "Gitの基本的なコマンドが使える人向け"
takeaway: "worktreeは、履歴を共有したまま作業フォルダだけを増やす仕組みです。作る、使う、片づける、の3つのコマンドで足ります。"
order: 16
sources:
  - { title: "Git — git-worktree Documentation", url: "https://git-scm.com/docs/git-worktree" }
---

## 作業を中断せずに、別のブランチを開く

作業の途中で、急ぎの修正が入ることがあります。ブランチを切り替えるには、変更をコミットかstashで退避しなければなりません。リポジトリをもう一つcloneする方法もありますが、履歴が二重になり、片方で取り込んだ内容がもう片方には見えません。

<figure class="diagram"><svg viewBox="0 0 400 212" role="img" aria-labelledby="wt-t"><title id="wt-t">1つのリポジトリと、複数の作業フォルダ</title><defs><marker id="wt-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="60" y="10" width="280" height="56" rx="8" class="d-accent-soft"/><text x="200" y="34" class="d-strong" text-anchor="middle">.git(履歴とブランチ)</text><text x="200" y="54" class="d-small" text-anchor="middle">共有される</text><path d="M70 126 V96 H130 V68" class="d-line" marker-end="url(#wt-a)"/><rect x="10" y="128" width="120" height="72" rx="8" class="d-ok"/><text x="70" y="154" class="d-strong d-mono" text-anchor="middle">app</text><text x="70" y="178" class="d-small d-mono" text-anchor="middle">main</text><path d="M200 126 V96 H200 V68" class="d-line" marker-end="url(#wt-a)"/><rect x="140" y="128" width="120" height="72" rx="8" class="d-ok"/><text x="200" y="154" class="d-strong d-mono" text-anchor="middle">app-fix</text><text x="200" y="178" class="d-small d-mono" text-anchor="middle">fix/typo</text><path d="M330 126 V96 H270 V68" class="d-line" marker-end="url(#wt-a)"/><rect x="270" y="128" width="120" height="72" rx="8" class="d-ok"/><text x="330" y="154" class="d-strong d-mono" text-anchor="middle">app-review</text><text x="330" y="178" class="d-small d-mono" text-anchor="middle">pr-42</text></svg><figcaption>図1 履歴は.gitに1つだけ。作業フォルダごとに、別のブランチが開かれる。</figcaption></figure>

git worktreeを使うと、1つのリポジトリに、作業フォルダを複数持てます。履歴とブランチは共有され、フォルダごとに別のブランチが開かれます。

作業フォルダは、メインのフォルダの外に作ります。中に作ると、メインの側から未追跡のファイルに見えてしまいます。

下の図のように、履歴は1つで、作業フォルダが複数になります。

## 作る・使う・片づける

新しい作業フォルダは、git worktree addで作ります。-bを付けると、新しいブランチも同時に作れます。

```bash Shell
# ../app-fix に、fix/typo という新しいブランチを開く
git worktree add ../app-fix -b fix/typo

# いま開いているフォルダの一覧
git worktree list
```

作ったフォルダに移動すれば、普通のリポジトリと同じようにコミットできます。終わってPRを出したら、フォルダを片づけます。

```bash Shell
git worktree remove ../app-fix
```

removeは、コミットされていない変更があるフォルダを消しません。変更が残っていれば、先にコミットするか捨てるかを選びます。ブランチ自体は残るので、不要なら別に削除します。

## 知っておくこと

- **同じブランチは、同時に1つの作業フォルダでしか開けません。** すでに別のフォルダで開いているブランチを指定すると、エラーになります。
- **作業フォルダには.gitがファイルとして置かれます。** 中身は、メインのリポジトリの.gitを指すパスです。このファイルを消すと、Gitがフォルダを認識できなくなります。
- **依存関係は、フォルダごとに入れ直します。** node_modulesのような、追跡されないファイルは共有されません。
- **フォルダを手で消したときは、git worktree pruneで記録を整理します。** 記録が残っていると、同じブランチを開き直せなくなることがあります。

> 作業フォルダが増えたら、git worktree listで今の状態を確認します。使い終わったフォルダは、早めに片づけます。

## 並行して作業するときに向いている場面

- 作業の途中で、急ぎの修正を別ブランチで出したい
- 他の人のPRを、手元のブランチを動かさずに動かして確認したい
- 長いビルドやテストを回している間に、別の作業を進めたい
- Claude Codeなどのエージェントに、別のブランチで作業させたい(作業が混ざらないよう、フォルダを分けられる)
