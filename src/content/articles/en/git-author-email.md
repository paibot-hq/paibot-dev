---
title: "Check commit emails before making a repository public: .local addresses, and PR refs that force push can't remove"
description: "Before switching a private repository to public, we found commits authored by “username@my-Mac.local”. How Git makes up that address, rewriting it with git-filter-repo, and how GitHub's pull request refs keep the old commits even after a force push — all reproduced locally."
category: "practice"
tags: ["Git","GitHub","Privacy","git-filter-repo"]
minutes: 7
type: "Practical guide"
level: "For everyday Git users"
takeaway: "Without user.email, Git builds “username@hostname” itself and puts it in your commits. Before going public, count the emails with git log --all and rewrite them with git-filter-repo --mailmap. GitHub's pull request refs (refs/pull) can't be rewritten, though, so a repository with PRs has to be recreated, or cleaned up by GitHub Support."
order: 20
sources:
  - { title: "GitHub Docs — Removing sensitive data from a repository", url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository" }
  - { title: "GitHub Docs — Setting your commit email address", url: "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/setting-your-commit-email-address" }
  - { title: "GitHub Docs — Email addresses reference", url: "https://docs.github.com/en/account-and-profile/reference/email-addresses-reference" }
  - { title: "git-filter-repo", url: "https://github.com/newren/git-filter-repo" }
  - { title: "Git — git-config (user.useConfigOnly)", url: "https://git-scm.com/docs/git-config#Documentation/git-config.txt-useruseConfigOnly" }
---

## The results first

Before switching this site's repository (a static Astro site, 15 commits) from private to public, we counted the emails in its commits. Nine of the 15 were authored by `username@my-Mac-name.local`. The name of the Mac was about to be published.

<figure class="diagram"><svg viewBox="0 0 400 394" role="img" aria-labelledby="er-t"><title id="er-t">What stays on GitHub after rewriting history and force pushing</title><defs><filter id="er-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="er-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="er-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="8" y="8" width="384" height="88" rx="14" fill="url(#er-g)" class="d-group"/><text x="24" y="28" class="d-gtitle">LOCAL</text><g class="k-a"><rect x="24" y="36" width="352" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="48" cy="60" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,51) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="70" y="58" class="d-ntitle">git filter-repo --mailmap</text><text x="70" y="73" class="d-nsub">rewrites author and committer emails</text><path d="M200 86 V154" class="d-path" marker-end="url(#er-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M200 86 V154"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><text x="212" y="116" class="d-nsub">git push --force</text><rect x="8" y="128" width="384" height="184" rx="14" fill="url(#er-g)" class="d-group"/><text x="24" y="148" class="d-gtitle">GITHUB (PUBLIC)</text><g class="k-ok"><rect x="24" y="156" width="352" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="48" cy="180" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,171) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="70" y="178" class="d-ntitle">refs/heads/main</text><text x="70" y="193" class="d-nsub">new commits; noreply email</text><g class="k-w"><rect x="24" y="216" width="352" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="48" cy="240" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(39,231) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="70" y="238" class="d-ntitle">refs/pull/1/head</text><text x="70" y="253" class="d-nsub">still the old commit; .local email</text><text x="24" y="292" class="d-nsub">Users can’t rewrite PR refs</text><path d="M110 314 V334" class="d-path" marker-end="url(#er-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M110 314 V334"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><path d="M290 314 V334" class="d-path" marker-end="url(#er-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M290 314 V334"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="336" width="188" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="32" cy="360" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,351) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="54" y="358" class="d-ntitle">Recreate the repo</text><text x="54" y="373" class="d-nsub">PR history is lost</text><g class="k-n"><rect x="204" y="336" width="188" height="48" rx="11" class="d-node" filter="url(#er-sh)"/><circle cx="228" cy="360" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(219,351) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="250" y="358" class="d-ntitle">Ask GitHub Support</text><text x="250" y="373" class="d-nsub">removal not guaranteed</text></svg><figcaption>Figure 1 Force push replaces the branch, but the PR ref keeps pointing at the old commit, readable by anyone on a public repository. Two ways out remain.</figcaption></figure>

| What we checked | Result |
| --- | --- |
| Commit without setting user.email | Git builds `username@hostname` and uses it. It warns, but the commit goes through |
| Rewrite with git-filter-repo `--mailmap` | Both author and committer got the new address |
| Rewrite, then force push | The branch was replaced, but the PR ref (`refs/pull/1/head`) still pointed at the old commit |
| PR refs on a public repository | Anyone can read them with `git ls-remote` |

The last two rows are the point of this article. **If a repository has ever had a pull request, rewriting history and force pushing leaves the old emails behind.** We recreated the repository.

## Why a .local address gets in

When `user.email` is not set, Git builds an email address from your login name and the hostname. A Mac's hostname ends in `.local`, so you get something like `taro@Taros-MacBook-Air.local`.

We reproduced it with an empty configuration (Git 2.49.0). With only a name set, a commit looks like this:

```text Output
[master (root-commit) 9a96040] first
 Committer: Taro Yamada <taro@Taros-MacBook-Air.local>
Your name and email address were configured automatically based
on your username and hostname. Please check that they are accurate.
```

There is a warning, but the commit is not stopped. If you commit from an editor or IDE, dozens of commits can pile up without you ever seeing it.

What makes it confusing is that **commits in the same repository can carry different emails**. In ours, commits made locally had the `.local` address, while merges done on GitHub's website had the GitHub account's email, because the website uses the email registered with GitHub.

## Count the emails before going public

Before going public, count the emails of every commit on every branch, for both author and committer.

```bash Terminal
git log --all --format='%ae%n%ce' | sort | uniq -c
```

Without `--all`, only the current branch is checked. If the remote has branches you don't have locally, run `git fetch --all` first.

Every email listed here becomes visible to anyone. Look for unknown addresses, `.local`, or work addresses.

## Rewrite with git-filter-repo

GitHub's documentation recommends git-filter-repo for rewriting history. The old `git filter-branch` works too, but it is slow, and Git itself warns against using it.

Write a mapping (a mailmap) and pass it to `--mailmap`. Each line is “new name <new email> <old email>”.

```text mailmap
Taro Yamada <123456+taro@users.noreply.github.com> <taro@Taros-MacBook-Air.local>
```

```bash Terminal
git filter-repo --mailmap ../mailmap
git log --all --format='%ae%n%ce' | sort | uniq -c
```

In our reproduction, the author and committer of all three commits got the new address.

```text Output
== before
   3 taro@Taros-MacBook-Air.local
== after
   3 123456+taro@users.noreply.github.com
```

After rewriting, git-filter-repo removes the `origin` remote, so that you don't push the rewritten history back by accident. Add it again yourself when you push.

Rewriting changes every commit ID. Anyone who has cloned the repository will no longer match it. It's an easy step only because the repository is used by one person.

## Force push doesn't remove PR refs

This is the biggest trap.

For each pull request, GitHub keeps a ref, `refs/pull/<number>/head`, pointing at the PR's commit. It stays after the merge and after the branch is deleted. And **users can't rewrite it**: GitHub's documentation describes these refs as read-only.

Locally, we created `refs/pull/1/head` in a bare repository standing in for GitHub, rewrote the history, and force pushed. (Commit IDs differ on every run.)

```text Output
== remote refs
da42f440d84a80324849e98ac98a5b7ab98fd959	refs/heads/main
339fc37a0107741a0d46deed14d8aedb012e39ca	refs/pull/1/head
== old commit through refs/pull/1/head
339fc37 taro@Taros-MacBook-Air.local
```

main now points at the new commit, but the PR ref still points at the old one, and the `.local` email can be read through it. On a public repository, anyone can fetch these refs.

```bash Terminal
git ls-remote https://github.com/<owner>/<repo> 'refs/pull/*/head'
```

According to GitHub's documentation, removing data from PR refs requires GitHub Support. The same page also says Support won't remove non-sensitive data, and it's unclear which side an email address falls on.

## What we did: recreate the repository

We had seven pull requests, so we recreated the repository.

1. Rewrite locally, the same way as with git-filter-repo (keeping the old state with `git bundle create backup.bundle --all`)
2. Check that the files are identical before and after (compare `git rev-parse main^{tree}`)
3. Delete the GitHub repository and create it again, public, with the same name
4. Push only the rewritten branches (the old branches still contain the `.local` email, so don't push them)
5. Reconnect the deploy integration (Cloudflare Workers Builds for this site) to the new repository

What we lost was the PR history (descriptions and discussion). The code and the commit history remain. If you forget to reconnect the integration, updating main won't deploy anything, so after recreating, check that a build runs once.

## Keep it from happening again

Set your email globally. GitHub's noreply address lets you avoid exposing your real email.

```bash Terminal
git config --global user.name "Taro Yamada"
git config --global user.email "123456+taro@users.noreply.github.com"
```

For accounts created after July 18, 2017, the noreply address has the form `ID+USERNAME@users.noreply.github.com`. You can get the ID with `gh api user --jq .id`.

You can also stop Git from making up an address when none is set:

```bash Terminal
git config --global user.useConfigOnly true
```

With this, a commit in a repository without an email stops with “Author identity unknown”. We tried it and confirmed that it stops.

Watch merges on GitHub's website too. Turning on “Keep my email addresses private” under Settings → Emails makes website operations use the noreply address as well.

## Reproduce it yourself

You can reproduce this locally without GitHub. git-filter-repo installs with pip (`pip install git-filter-repo`).

```bash lab.sh
#!/bin/bash
set -e
mkdir -p work && cd work
git init -q --bare remote.git
git init -q -b main repo && cd repo
git config user.name taro
git config user.email taro@Taros-MacBook-Air.local   # the same form Git makes up
for i in 1 2 3; do echo $i > f$i; git add f$i; git commit -qm "commit $i"; done
git remote add origin ../remote.git
git push -q origin main
git push -q origin HEAD~1:refs/pull/1/head            # stands in for GitHub's PR ref
echo "== before"; git log --all --format='%ae' | sort | uniq -c

printf 'Taro Yamada <123456+taro@users.noreply.github.com> <taro@Taros-MacBook-Air.local>\n' > ../mailmap
git filter-repo --force --mailmap ../mailmap
echo "== after"; git log --all --format='%ae' | sort | uniq -c

git remote add origin ../remote.git                   # filter-repo removed origin, so add it back
git push -q --force origin main
echo "== remote refs"; git ls-remote ../remote.git
echo "== old commit through refs/pull/1/head"
git --git-dir=../remote.git log -1 --format='%h %ae' refs/pull/1/head
```

If the last line shows the `.local` email, you have reproduced it.

## Checklist

- [ ] `git config --global user.email` is set
- [ ] `git config --global user.useConfigOnly true` stops Git from making up an address
- [ ] Before going public, you counted emails with `git log --all --format='%ae%n%ce' | sort | uniq -c`
- [ ] Before rewriting, you kept the old state with `git bundle`
- [ ] For a repository with PRs, you know force push won't remove them, and chose between recreating it and asking Support
- [ ] After recreating, you reconnected deploy and CI integrations and checked that they run once

> Not tested: asking GitHub Support for removal, repositories with forks, and refs or caches GitHub keeps other than `refs/pull`. The local reproduction uses a bare repository in place of GitHub.
