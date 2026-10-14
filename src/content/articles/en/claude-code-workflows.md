---
title: "Practical workflows: investigate, fix, and split the work"
description: "Plan mode, subagents, worktrees and PR creation: a way of working that follows everyday tasks."
category: "practice"
tags: ["Claude Code","Workflows","Git"]
minutes: 7
type: "Practical guide"
level: "For people who have used Claude Code once"
takeaway: "Centered on three habits: look at the plan before changes, move investigation into a separate context, and isolate parallel work."
order: 3
sources:
  - { title: "Claude Code — Common workflows", url: "https://code.claude.com/docs/en/common-workflows" }
---

## See the plan before changing anything (plan mode)

When you want to review before anything is written to disk, use plan mode. Claude reads files and proposes a plan but does not edit until you approve. Specify it at startup with claude --permission-mode plan, or switch modes during a session with Shift+Tab and check that the status bar shows “⏸ plan mode on.”

<figure class="diagram"><svg viewBox="0 0 400 322" role="img" aria-labelledby="pl-t"><title id="pl-t">The plan mode flow</title><defs><marker id="pl-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="10" width="360" height="56" rx="8" class="d-ok"/><circle cx="46" cy="38" r="12" class="d-accent"/><text x="46" y="42.5" class="d-white" text-anchor="middle">1</text><text x="70" y="34" class="d-strong">Investigate</text><text x="70" y="52" class="d-small">Reads files</text><text x="368" y="30" class="d-small" text-anchor="end">No edits</text><path d="M200 68 V86" class="d-line" marker-end="url(#pl-a)"/><rect x="20" y="88" width="360" height="56" rx="8" class="d-ok"/><circle cx="46" cy="116" r="12" class="d-accent"/><text x="46" y="120.5" class="d-white" text-anchor="middle">2</text><text x="70" y="112" class="d-strong">Propose a plan</text><text x="70" y="130" class="d-small">Suggests how it will change things</text><text x="368" y="108" class="d-small" text-anchor="end">No edits</text><path d="M200 146 V164" class="d-line" marker-end="url(#pl-a)"/><rect x="20" y="166" width="360" height="56" rx="8" class="d-ok"/><circle cx="46" cy="194" r="12" class="d-accent"/><text x="46" y="198.5" class="d-white" text-anchor="middle">3</text><text x="70" y="190" class="d-strong">You review</text><text x="70" y="208" class="d-small">Approve, or ask for changes</text><text x="368" y="186" class="d-small" text-anchor="end">No edits</text><path d="M200 224 V242" class="d-line" marker-end="url(#pl-a)"/><rect x="20" y="244" width="360" height="56" rx="8" class="d-warn"/><circle cx="46" cy="272" r="12" class="d-accent"/><text x="46" y="276.5" class="d-white" text-anchor="middle">4</text><text x="70" y="268" class="d-strong">Execute</text><text x="70" y="286" class="d-small">Edits files after you approve</text><text x="368" y="264" class="d-small" text-anchor="end">Edits</text></svg><figcaption>Figure 1. In plan mode, Claude doesn’t edit files until you approve. If the direction is wrong, fixing it at the plan stage means fixing only text.</figcaption></figure>

```bash Shell
claude --permission-mode plan
```

> The bigger the change, the more a plan is worth seeing first. If the direction is off at the plan stage, all you have to fix is text.

## Hand investigation to a subagent

Exploring a large codebase fills the conversation’s context with file reads. If you delegate the investigation to a subagent, the reading happens in that agent’s own context and only a summary comes back to the main conversation.

```text Example prompt (from the official docs)
use a subagent to investigate how our auth system handles token refresh
```

## Fixing a bug: reproduce, find the cause, fix, verify

Attach the reproduction command and the stack trace to the request. The flow has four steps: (1) give it the error and how to reproduce it, (2) have it list several fix proposals, (3) have it apply the one you chose, (4) run the tests to confirm. Step (2) keeps Claude from adopting the first idea it had. At the verification step, look at the results of the tests that were actually run, not at Claude saying “it’s fixed.”

## Adding tests

First have it find functions that aren’t tested, then have it write the tests, then have it add boundary-value tests. Claude looks at existing test files and tries to match their framework and style. The more concretely you state what a test should check, the closer the result is to what you expect.

```text Example prompts (from the official docs)
find functions in NotificationsService.swift that are not covered by tests
add tests for the notification service
add test cases for edge conditions in the notification service
run the new tests and fix any failures
```

## Split parallel work with worktrees

When you want to build one feature while also fixing another bug, use Git worktrees. Starting with --worktree creates a dedicated checkout and branch, so edits don’t collide. Specify a different name in another terminal and a second independent session starts. A worktree is created from an existing commit, so in a repository with no commits it fails with “Failed to resolve base branch "HEAD".”

```bash Shell
claude --worktree feature-auth
```

## Creating a pull request

When changes are done, just asking “create a pr” can create the PR. To split the steps, first ask for a summary of the changes, then have it create the PR, then strengthen the description. Always read the generated PR before you submit it; asking it to list risks and cautions makes oversights easier to notice. To find the work later, specify the PR number, as in claude --from-pr 1234.

```text Example prompts (from the official docs)
summarize the changes I've made to the authentication module
create a pr
enhance the PR description with more context about the security improvements
```

## Repeated work: scripts and schedules

With -p you can run it without a conversation and call it from CI or pre-commit hooks. For work you want to run regularly there are cloud routines, desktop app scheduled tasks, GitHub Actions, and /loop, which repeats within a session. Unattended work can’t ask questions back, so state the success criteria and where the results should go in the prompt.

## Finish by checking

In every workflow, you read the diff and the test results yourself at the end. Don’t trust Claude’s report that “it’s fixed”; check the output of the tests that were actually run and the range of changes visible in git diff. Also check that no unintended files changed and no dependencies were added.

```bash Shell
git diff
git status --short
npm test
```
