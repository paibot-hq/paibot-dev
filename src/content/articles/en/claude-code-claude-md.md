---
title: "Writing CLAUDE.md: stop explaining things every time"
description: "Where to put it, how to write it, how long it should be, and what to use when you need to enforce a rule."
category: "practice"
tags: ["Claude Code","CLAUDE.md","Memory"]
minutes: 7
type: "Practical guide"
level: "For people who have used Claude Code once"
takeaway: "CLAUDE.md is the premise you hand over at the start of every session. This covers where to put it, what to write, and what it cannot enforce."
order: 1
sources:
  - { title: "Claude Code — How Claude remembers your project", url: "https://code.claude.com/docs/en/memory" }
---

## Every session starts from a blank slate

Claude Code starts each session with a fresh context. What was said in the previous conversation isn’t carried over by itself. Two mechanisms carry knowledge into the next session.

> Both are passed in as context, not as enforced settings. For things you want enforced, use the methods in a later section.

|  | CLAUDE.md | Auto memory |
| --- | --- | --- |
| Written by | You | Claude itself |
| Contents | Instructions and rules | What it learned from your corrections and preferences |
| Loaded | Every session | Every session (up to the first 200 lines or 25KB) |

## Where to put it

Where you put it changes how far it reaches and who shares it. Files are loaded from the broadest scope to the most specific, so project instructions enter the context after user instructions.

<figure class="diagram"><svg viewBox="0 0 400 376" role="img" aria-labelledby="md-t"><title id="md-t">The order CLAUDE.md files are loaded</title><defs><marker id="md-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="10" width="360" height="50" rx="8" class="d-box"/><text x="36" y="32" class="d-strong">User</text><text x="36" y="50" class="d-small">Preferences for every project</text><text x="364" y="32" class="d-mono" text-anchor="end">~/.claude/CLAUDE.md</text><path d="M200 61 V73" class="d-line" marker-end="url(#md-a)"/><rect x="20" y="74" width="360" height="50" rx="8" class="d-box"/><text x="36" y="96" class="d-strong">Parent directories</text><text x="36" y="114" class="d-small">Shared rules, e.g. a monorepo</text><text x="364" y="96" class="d-mono" text-anchor="end">../CLAUDE.md</text><path d="M200 125 V137" class="d-line" marker-end="url(#md-a)"/><rect x="20" y="138" width="360" height="50" rx="8" class="d-box"/><text x="36" y="160" class="d-strong">Project</text><text x="36" y="178" class="d-small">Conventions shared with your team</text><text x="364" y="160" class="d-mono" text-anchor="end">./CLAUDE.md</text><path d="M200 189 V201" class="d-line" marker-end="url(#md-a)"/><rect x="20" y="202" width="360" height="50" rx="8" class="d-box"/><text x="36" y="224" class="d-strong">Local</text><text x="36" y="242" class="d-small">Your own notes (add to .gitignore)</text><text x="364" y="224" class="d-mono" text-anchor="end">./CLAUDE.local.md</text><text x="200" y="280" class="d-small" text-anchor="middle">All loaded at launch and concatenated top to bottom (not overridden)</text><rect x="20" y="300" width="360" height="64" rx="8" class="d-dash"/><text x="36" y="324" class="d-strong">CLAUDE.md in a subdirectory</text><text x="36" y="343" class="d-small">Loaded when Claude reads or writes</text><text x="36" y="357" class="d-small">a file in that directory</text></svg><figcaption>Figure 1. CLAUDE.md files in the working directory and above are concatenated at launch, broadest first. Those in subdirectories are loaded when needed.</figcaption></figure>

> Files in the working directory and its parent directories are all loaded at launch, and they are concatenated rather than overriding each other. A CLAUDE.md in a subdirectory is loaded when Claude reads or writes a file in that directory.

| Scope | Location | Shared with |
| --- | --- | --- |
| User | \~/.claude/CLAUDE.md | Only you (all projects) |
| Project | ./CLAUDE.md or ./.claude/CLAUDE.md | Your team (via source control) |
| Local | ./CLAUDE.local.md | Only you (this project). Add it to .gitignore |

## Draft one with /init

You don’t have to write it from scratch. Run /init at the project root and Claude examines the codebase, then generates a CLAUDE.md from the build commands, test steps and conventions it finds. If a CLAUDE.md already exists, it suggests improvements instead of overwriting it. The result is a draft: always read it and fix anything that differs from your team’s rules.

```text Run inside Claude Code
/init
```

## Write it so it can be checked

CLAUDE.md is passed in as context, so how you write it changes how well it is followed. Make instructions concrete enough to verify. Aim for under 200 lines per file; longer files use more context and are followed less reliably. If two instructions contradict each other, Claude may pick one arbitrarily, so remove stale instructions regularly.

- Not “format code properly” but “use 2-space indentation”
- Not “test your changes” but “run npm test before committing”
- Not “keep files organized” but “API handlers live in src/api/handlers/”

## Example: CLAUDE.md for a small project

Here is an example for an imaginary project. It uses only things that can be checked (commands, locations and prohibitions) as bullets under headings.

```markdown CLAUDE.md example
# Project basics

## Commands
- Tests: `npm test` (always run before committing)
- Type check: `npm run typecheck`

## Structure
- API handlers live in `src/api/handlers/`
- Shared types go in `src/types/`

## Conventions
- Use 2-space indentation
- Add tests for any new function in the same PR

## Don’t touch
- Don’t edit existing files in `migrations/` (add new ones only)
```

## Splitting and sharing: @imports and .claude/rules/

Writing @path inside CLAUDE.md expands and loads that file at startup, for example “See @README for project overview and @package.json for available npm commands.” Imports help organize a long file, but they don’t reduce context use, because imported files are also loaded at startup. Instructions that matter only for some files go in .claude/rules/ as path-scoped rules, which are loaded only when Claude works with matching files.

```markdown .claude/rules/api.md example (the frontmatter paths field selects the target)
---
paths:
  - "src/api/**/*.ts"
---
In API handlers, always validate input before processing it.
```

## Don’t rely on CLAUDE.md for what must be enforced

The contents of CLAUDE.md are instructions Claude tries to follow, not enforcement. Writing “don’t read .env,” for example, doesn’t by itself forbid reading it. For operations you must block reliably, use permission deny rules or a PreToolUse hook. Permission settings are covered in the next article.

## Checking when it isn’t working

When instructions aren’t followed, first suspect that they aren’t loaded. Run /context and check whether the CLAUDE.md you expect appears in the Memory files list. A file that isn’t listed is invisible to Claude. Running /memory lists the locations of your CLAUDE.md and auto memory files and lets you edit them directly. If a file is too long, a warning appears at startup and in /status.

```text Run inside Claude Code
/context   # list the Memory files
/memory    # file locations, and the auto memory on/off switch
```
