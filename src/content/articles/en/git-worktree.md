---
title: "git worktree: one working folder per branch"
description: "How to open several branches at once from a single repository, without stashing or cloning."
category: "practice"
tags: ["Git","worktree","Workflows"]
minutes: 5
type: "Practical guide"
level: "For people comfortable with basic Git commands"
takeaway: "A worktree adds working folders while sharing the history. Three commands cover it: create, use, clean up."
order: 16
sources:
  - { title: "Git — git-worktree Documentation", url: "https://git-scm.com/docs/git-worktree" }
---

## Open another branch without interrupting your work

Sometimes an urgent fix lands in the middle of your work. To switch branches you have to commit or stash your changes first. You could clone the repository a second time, but then the history is duplicated, and what you fetch in one clone isn’t visible in the other.

<figure class="diagram"><svg viewBox="0 0 400 212" role="img" aria-labelledby="wt-t"><title id="wt-t">One repository, several working folders</title><defs><marker id="wt-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="60" y="10" width="280" height="56" rx="8" class="d-accent-soft"/><text x="200" y="34" class="d-strong" text-anchor="middle">.git (history and branches)</text><text x="200" y="54" class="d-small" text-anchor="middle">shared</text><path d="M70 126 V96 H130 V68" class="d-line" marker-end="url(#wt-a)"/><rect x="10" y="128" width="120" height="72" rx="8" class="d-ok"/><text x="70" y="154" class="d-strong d-mono" text-anchor="middle">app</text><text x="70" y="178" class="d-small d-mono" text-anchor="middle">main</text><path d="M200 126 V96 H200 V68" class="d-line" marker-end="url(#wt-a)"/><rect x="140" y="128" width="120" height="72" rx="8" class="d-ok"/><text x="200" y="154" class="d-strong d-mono" text-anchor="middle">app-fix</text><text x="200" y="178" class="d-small d-mono" text-anchor="middle">fix/typo</text><path d="M330 126 V96 H270 V68" class="d-line" marker-end="url(#wt-a)"/><rect x="270" y="128" width="120" height="72" rx="8" class="d-ok"/><text x="330" y="154" class="d-strong d-mono" text-anchor="middle">app-review</text><text x="330" y="178" class="d-small d-mono" text-anchor="middle">pr-42</text></svg><figcaption>Figure 1. The history lives once in .git. Each working folder has a different branch open.</figcaption></figure>

With git worktree, one repository can have several working folders. The history and branches are shared, and each folder has a different branch open.

Create the new folders outside the main one. Inside it, they would show up as untracked files in the main folder.

As the figure below shows, there is one history and several working folders.

## Create, use, clean up

Create a new working folder with git worktree add. With -b you also create a new branch at the same time.

```bash Shell
# open a new branch called fix/typo in ../app-fix
git worktree add ../app-fix -b fix/typo

# list the folders that are open
git worktree list
```

Move into the new folder and commit as you would in any repository. When you are done and have opened the PR, clean the folder up.

```bash Shell
git worktree remove ../app-fix
```

remove won’t delete a folder that has uncommitted changes. If any remain, either commit them or discard them first. The branch itself stays, so delete it separately if you no longer need it.

## Things to know

- **A branch can be open in only one working folder at a time.** If you name a branch that is already open in another folder, you get an error.
- **A working folder contains .git as a file.** It holds a path pointing into the main repository’s .git. If you delete this file, Git no longer recognizes the folder.
- **Install dependencies again in each folder.** Untracked files such as node_modules are not shared.
- **If you delete a folder by hand, tidy the records with git worktree prune.** Leftover records can stop you from opening the same branch again.

> When the folders pile up, check the current state with git worktree list. Clean up the ones you are finished with early.

## When it fits

- You want to ship an urgent fix on another branch in the middle of your work
- You want to run someone else’s PR without moving your own branch
- You want to keep working while a long build or test runs
- You want an agent such as Claude Code to work on another branch (separate folders keep the work from mixing)
