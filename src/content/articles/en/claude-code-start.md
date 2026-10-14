---
title: "Getting started with Claude Code: from install to your first request"
description: "Install the coding agent that runs in your terminal and hand it your first task."
category: "practice"
tags: ["Claude Code","Getting started","CLI"]
minutes: 6
type: "Beginner guide"
level: "Assumes basic terminal skills"
takeaway: "Install, launch, make a first request and resume later, following the steps in the official documentation."
order: 0
sources:
  - { title: "Claude Code — Overview", url: "https://code.claude.com/docs/en/overview" }
  - { title: "Claude Code — Common workflows", url: "https://code.claude.com/docs/en/common-workflows" }
---

## What is Claude Code?

Claude Code is a coding agent that reads your codebase, edits files and runs commands. You can use it not only in the terminal but also in IDE extensions, the desktop app and on the web. All of them connect to the same engine, so your repository’s CLAUDE.md, settings and MCP servers work everywhere. This article is based on the official documentation as of October 2026. We confirmed that the commands and flags exist in our own environment (Claude Code 2.1.284).

| Where to use it | Good for |
| --- | --- |
| Terminal (CLI) | The full-featured baseline. Can also be called from scripts and CI |
| VS Code / JetBrains | When you want to follow diffs inside your editor |
| Desktop app | When you want to run several sessions side by side and review diffs |
| Web (claude.ai/code) | When you want to hand off longer work with no local setup |

## Install it and check that it works

The officially recommended route is the native installer, which updates itself in the background. Homebrew and WinGet also work, but they don’t auto-update, so you upgrade them yourself from time to time. Pick the tab for your environment. After installing, open a new terminal; if a version number prints, you’re done. If you see “claude not found,” the install location isn’t on your PATH yet.

```bash tab:"macOS / Linux / WSL" Native install (auto-updates)
curl -fsSL https://claude.ai/install.sh | bash
```

```powershell tab:"Windows PowerShell" Native install (auto-updates)
irm https://claude.ai/install.ps1 | iex
```

```bat tab:"Windows CMD" Native install (auto-updates)
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

```bash tab:"Homebrew" No auto-update
brew install --cask claude-code

# To update later
brew upgrade claude-code
```

```powershell tab:"WinGet" No auto-update
winget install Anthropic.ClaudeCode

# To update later
winget upgrade Anthropic.ClaudeCode
```

```bash Check it works
claude --version
```

> On native Windows, installing Git for Windows lets Claude Code use the Bash tool.

## First launch

Move into the project directory you want to work on and run claude. The first time, you are asked to log in. You need a Claude subscription or an Anthropic Console account. If the ANTHROPIC\_API\_KEY environment variable is set and you approve using that key when asked at startup, you can skip the login.

```bash Shell
cd your-project
claude
```

## Start by asking it to read

Rather than asking for changes right away, it’s best to have it explain the structure first. Start with broad questions, then narrow down to the parts that interest you. Asking for a glossary of project-specific terms is also useful when you join a new codebase.

```text Example prompts (from the official docs)
give me an overview of this codebase
explain the main architecture patterns used here
what are the key data models?
how is authentication handled?
```

## Have it fix an error

When fixing a bug, give it the error text together with the command that reproduces it and the stack trace; this narrows down the cause faster. Also say whether it happens intermittently or every time. Ask for several fix proposals first, choose one, then have it apply that one. That two-step flow lets you check the reasoning behind the change.

```text Example prompts (from the official docs)
I'm seeing an error when I run npm test

suggest a few ways to fix the @ts-ignore in user.ts

update user.ts to add the null check you suggested
```

## Point to files with @

Write a path after @ to include that file’s contents in the conversation. If you point at a directory, you get a file listing instead of the contents. You can paste a screenshot by dragging and dropping it into the terminal or with Ctrl+V, which is handy for showing an error screen or broken UI.

- Writing @src/utils/auth.js loads that file (files that are too large aren’t included)
- Pointing at a directory such as @src/components adds a file listing
- The CLAUDE.md in the directory of a referenced file is also added to the context

## Resume where you left off

Conversations are saved locally, so you don’t need to re-explain when work spans several sittings. Use claude --continue to return to the most recent session, claude --resume to pick from a list, or /resume to switch after launch. If there is no conversation in the current directory, claude --continue prints “No conversation found to continue” and exits.

```bash Shell
claude --continue
claude --resume
```

## Use it without a conversation (-p)

With -p (--print), it prints the answer and exits. Standard input and output work like any other Unix command, so you can pipe logs or diffs in. This is the basic form for calling it from CI or hooks.

```bash Shell
git log --oneline -20 | claude -p "summarize these recent commits"
git diff main --name-only | claude -p "review these changed files for security issues"
```

> The next article covers CLAUDE.md, which saves you from explaining things every time.
