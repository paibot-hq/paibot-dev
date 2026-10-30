---
title: "リポジトリを公開する前に、コミットのメールを確かめる:.localのアドレスと、force pushで消えないPRの参照"
description: "privateのリポジトリをpublicにしようとしたら、コミットの作者に「ユーザー名@Macの名前.local」が入っていた。Gitがこのアドレスを作る仕組み、git-filter-repoでの書き換え、force pushしてもGitHubのPRの参照に古いコミットが残ることを、手元で再現して確かめた記録。"
category: "practice"
tags: ["Git","GitHub","プライバシー","git-filter-repo"]
minutes: 7
type: "実践ガイド"
level: "Gitを普段使っている人向け"
takeaway: "user.emailを設定していないと、Gitは「ユーザー名@ホスト名」を自分で作ってコミットに入れます。公開前に git log --all でメールを数え、git-filter-repo の --mailmap で書き換えます。ただしGitHubのPRの参照(refs/pull)は書き換えられないので、PRがあるリポジトリは、作り直すかサポートに頼みます。"
order: 20
sources:
  - { title: "GitHub Docs — Removing sensitive data from a repository", url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository" }
  - { title: "GitHub Docs — Setting your commit email address", url: "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/setting-your-commit-email-address" }
  - { title: "GitHub Docs — Email addresses reference", url: "https://docs.github.com/en/account-and-profile/reference/email-addresses-reference" }
  - { title: "git-filter-repo", url: "https://github.com/newren/git-filter-repo" }
  - { title: "Git — git-config (user.useConfigOnly)", url: "https://git-scm.com/docs/git-config#Documentation/git-config.txt-useruseConfigOnly" }
---

## 先に結果

このサイトのリポジトリ(Astroの静的サイト、コミット15個)を、privateからpublicにする前に、コミットのメールを数えました。15個のうち9個の作者が、`ユーザー名@Macの名前.local` でした。Macの名前が、そのまま公開されるところでした。

<figure class="diagram"><svg viewBox="0 0 400 394" role="img" aria-labelledby="er-t"><title id="er-t">履歴を書き換えてforce pushしたときに、GitHubに残るもの</title><defs><filter id="er-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="er-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="er-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="88" rx="14" fill="url(#er-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">手元</text><g class="k-a"><rect x="24" y="36" width="352" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="48" cy="60" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,51) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="70" y="58" class="d-ntitle">git filter-repo --mailmap</text><text x="70" y="73" class="d-nsub">作者とコミッターのメールを書き換える</text><path d="M200 86 V154" class="d-path" marker-end="url(#er-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M200 86 V154"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><text x="212" y="116" class="d-nsub">git push --force</text><rect x="8" y="128" width="384" height="184" rx="14" fill="url(#er-g)" class="d-group"/><text x="24" y="148" class="d-gtitle">GITHUB(PUBLIC)</text><g class="k-ok"><rect x="24" y="156" width="352" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="48" cy="180" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,171) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="70" y="178" class="d-ntitle">refs/heads/main</text><text x="70" y="193" class="d-nsub">新しいコミット。noreplyのメール</text><g class="k-w"><rect x="24" y="216" width="352" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="48" cy="240" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(39,231) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="70" y="238" class="d-ntitle">refs/pull/1/head</text><text x="70" y="253" class="d-nsub">古いコミットのまま。.localのメール</text><text x="24" y="292" class="d-nsub">PRの参照は、利用者からは書き換えられない</text><path d="M110 314 V334" class="d-path" marker-end="url(#er-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M110 314 V334"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><path d="M290 314 V334" class="d-path" marker-end="url(#er-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M290 314 V334"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="336" width="188" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="32" cy="360" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,351) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="54" y="358" class="d-ntitle">リポジトリを作り直す</text><text x="54" y="373" class="d-nsub">PRの履歴は消える</text><g class="k-n"><rect x="204" y="336" width="188" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="228" cy="360" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(219,351) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="250" y="358" class="d-ntitle">GitHubサポートに頼む</text><text x="250" y="373" class="d-nsub">消えるかは分からない</text></svg><figcaption>図1 ブランチはforce pushで置き換わるが、PRの参照は古いコミットを指したまま残り、公開リポジトリなら誰でも読める。残る手は2つ。</figcaption></figure>

| 確かめたこと | 結果 |
| --- | --- |
| user.emailを設定しないでコミットする | Gitが `ユーザー名@ホスト名` を作って入れる。警告は出るが、コミットはされる |
| git-filter-repo の `--mailmap` で書き換える | 作者とコミッターの両方が、新しいアドレスになった |
| 書き換えてforce pushする | ブランチは新しくなったが、PRの参照(`refs/pull/1/head`)は古いコミットのまま |
| 公開リポジトリのPRの参照 | `git ls-remote` で誰でも読める |

最後の2つが、この記事でいちばん伝えたいことです。**PRを一度でも作ったリポジトリは、履歴を書き換えてforce pushしても、古いメールが残ります。** 私たちは、リポジトリを作り直しました。

## なぜ .local のアドレスが入るのか

`user.email` を設定していないと、Gitは、ログインしているユーザー名とホスト名から、メールアドレスを自分で作ります。Macのホスト名は `〜.local` なので、`taro@Taros-MacBook-Air.local` のような形になります。

手元で、設定を空にして再現しました(Git 2.49.0)。名前だけを設定してコミットすると、こうなります。

```text 出力
[master (root-commit) 9a96040] first
 Committer: Taro Yamada <taro@Taros-MacBook-Air.local>
Your name and email address were configured automatically based
on your username and hostname. Please check that they are accurate.
```

警告は出ますが、コミットは止まりません。エディタやIDEからコミットしていると、この警告を見ないまま、何十個もコミットが積み上がります。

ややこしいのは、**同じリポジトリでも、コミットによってメールが違う**ことです。私たちのリポジトリでは、手元で作ったコミットは `.local`、GitHubの画面でマージしたコミットはGitHubアカウントのメールでした。画面でのマージは、GitHubに登録したメールで作られるからです。

## 公開する前に、メールを数える

公開する前に、すべてのブランチのコミットのメールを、作者とコミッターの両方で数えます。

```bash ターミナル
git log --all --format='%ae%n%ce' | sort | uniq -c
```

`--all` を付けないと、今のブランチしか見ません。手元にないリモートのブランチもあるなら、先に `git fetch --all` をします。

ここに出たメールが、公開すると誰でも見られるものです。知らないアドレスや、`.local`、会社のアドレスが混ざっていないかを見ます。

## git-filter-repo で書き換える

GitHubのドキュメントは、履歴の書き換えに git-filter-repo を勧めています。古い `git filter-branch` も使えますが、遅く、Git自身も使わないよう警告を出します。

書き換えの対応表(mailmap)を作り、`--mailmap` に渡します。1行が「新しい名前 <新しいメール> <古いメール>」です。

```text mailmap
Taro Yamada <123456+taro@users.noreply.github.com> <taro@Taros-MacBook-Air.local>
```

```bash ターミナル
git filter-repo --mailmap ../mailmap
git log --all --format='%ae%n%ce' | sort | uniq -c
```

手元の再現では、3つのコミットの作者とコミッターが、すべて新しいアドレスになりました。

```text 出力
== before
   3 taro@Taros-MacBook-Air.local
== after
   3 123456+taro@users.noreply.github.com
```

git-filter-repo は、書き換えの後で `origin` のリモートを消します。書き換えた履歴を、うっかり元のリポジトリにpushしないためです。pushするときは、自分で足し直します。

書き換えると、コミットのIDがすべて変わります。ほかの人がcloneしているなら、その人たちの手元とは合わなくなります。一人で使っているリポジトリだから、気軽にできることです。

## force pushしても、PRの参照は残る

ここが、いちばんの落とし穴です。

GitHubは、PRごとに `refs/pull/<番号>/head` という参照を持っていて、PRを作ったときのコミットを指しています。この参照は、マージした後も、ブランチを消した後も残ります。そして、**利用者からは書き換えられません**(GitHubのドキュメントでは、読み取り専用と書かれています)。

手元で、GitHubの代わりの裸のリポジトリに `refs/pull/1/head` を作り、書き換えた後でforce pushしました(コミットのIDは、実行するたびに変わります)。

```text 出力
== remote refs
da42f440d84a80324849e98ac98a5b7ab98fd959	refs/heads/main
339fc37a0107741a0d46deed14d8aedb012e39ca	refs/pull/1/head
== old commit through refs/pull/1/head
339fc37 taro@Taros-MacBook-Air.local
```

mainは新しいコミットになりましたが、PRの参照は古いコミットを指したままで、そこから `.local` のメールが読めます。公開リポジトリなら、この参照は誰でも取れます。

```bash ターミナル
git ls-remote https://github.com/<owner>/<repo> 'refs/pull/*/head'
```

GitHubのドキュメントによると、PRの参照から消すには、GitHubサポートに頼みます。ただしサポートは「機密でないデータは消さない」とも書いています。メールアドレスが、どちらに当たるかは分かりません。

## 私たちがやったこと:リポジトリを作り直した

PRが7つあったので、作り直すことにしました。

1. 手元で、git-filter-repoと同じ書き換えをする(古い状態は、`git bundle create 退避.bundle --all` で取っておく)
2. 書き換え前と後で、ファイルの中身が同じことを確かめる(`git rev-parse main^{tree}` を比べる)
3. GitHubのリポジトリを消し、同じ名前でpublicに作り直す
4. 書き換えたブランチだけをpushする(古いブランチは、`.local` のメールを含むので、pushしない)
5. デプロイの連携(このサイトでは、Cloudflare Workers Builds)を、新しいリポジトリにつなぎ直す

失ったのは、PRの履歴(説明文と議論)です。コードと、コミットの履歴は残っています。連携のつなぎ直しを忘れると、mainを更新してもデプロイされないので、作り直した後に、一度ビルドが動くことを確かめます。

## 次から入らないようにする

Git全体に、メールを設定します。GitHubが用意する、公開用のアドレス(noreply)を使うと、本当のメールを出さずに済みます。

```bash ターミナル
git config --global user.name "Taro Yamada"
git config --global user.email "123456+taro@users.noreply.github.com"
```

noreplyのアドレスは、2017年7月18日より後に作ったアカウントでは `ID+ユーザー名@users.noreply.github.com` の形です。IDは `gh api user --jq .id` で分かります。

さらに、設定がないときにGitがアドレスを作らないようにできます。

```bash ターミナル
git config --global user.useConfigOnly true
```

これを設定すると、メールがないリポジトリでは、コミットが「Author identity unknown」で止まります。手元で試し、止まることを確かめました。

GitHubの画面でのマージにも気をつけます。Settings → Emails で「Keep my email addresses private」をオンにすると、画面での操作もnoreplyのアドレスになります。

## 自分の環境で再現する

GitHubを使わずに、手元だけで再現できます。git-filter-repoは、pipで入ります(`pip install git-filter-repo`)。

```bash lab.sh
#!/bin/bash
set -e
mkdir -p work && cd work
git init -q --bare remote.git
git init -q -b main repo && cd repo
git config user.name taro
git config user.email taro@Taros-MacBook-Air.local   # Gitが作るのと同じ形
for i in 1 2 3; do echo $i > f$i; git add f$i; git commit -qm "commit $i"; done
git remote add origin ../remote.git
git push -q origin main
git push -q origin HEAD~1:refs/pull/1/head            # GitHubのPRの参照の代わり
echo "== before"; git log --all --format='%ae' | sort | uniq -c

printf 'Taro Yamada <123456+taro@users.noreply.github.com> <taro@Taros-MacBook-Air.local>\n' > ../mailmap
git filter-repo --force --mailmap ../mailmap
echo "== after"; git log --all --format='%ae' | sort | uniq -c

git remote add origin ../remote.git                   # filter-repoがoriginを消すので足し直す
git push -q --force origin main
echo "== remote refs"; git ls-remote ../remote.git
echo "== old commit through refs/pull/1/head"
git --git-dir=../remote.git log -1 --format='%h %ae' refs/pull/1/head
```

最後の行に、`.local` のメールが出れば再現です。

## チェックリスト

- [ ] `git config --global user.email` が設定されている
- [ ] `git config --global user.useConfigOnly true` で、Gitがアドレスを作らないようにした
- [ ] 公開する前に、`git log --all --format='%ae%n%ce' | sort | uniq -c` でメールを数えた
- [ ] 書き換えるなら、`git bundle` で古い状態を取っておいた
- [ ] PRがあるリポジトリは、force pushでは消えないと分かったうえで、作り直すかサポートに頼むかを決めた
- [ ] 作り直したら、デプロイやCIの連携をつなぎ直し、一度動くことを確かめた

> 試していないこと:GitHubサポートへの削除の依頼、フォークがあるリポジトリ、`refs/pull` 以外にGitHubが持つ参照やキャッシュ。手元の再現は、GitHubの代わりに裸のリポジトリを使っています。
