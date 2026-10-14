---
title: "Permissions and modes: deciding what to hand over to Claude Code"
description: "Permission modes that set how often it asks, the evaluation order of allow/ask/deny rules, and the wildcard pitfall."
category: "practice"
tags: ["Claude Code","Permissions","Security"]
minutes: 8
type: "Practical guide"
level: "For people who have used Claude Code once"
takeaway: "Modes and rules let you move step by step from “confirm every time” to “hand it over.” What can be enforced is the rules, not your instructions; that is the key point."
order: 2
sources:
  - { title: "Claude Code — Configure permissions", url: "https://code.claude.com/docs/en/permissions" }
---

## What gets confirmed by default

Claude Code decides whether to ask for confirmation by the kind of operation. Reading alone needs no confirmation inside the working directory. Running commands and changing files generally ask first. How long a “don’t ask again” choice lasts also depends on the operation.

| Operation | Example | Confirmation |
| --- | --- | --- |
| Reading | Reading files, Grep | Not needed inside the working directory |
| Bash commands | Running the shell | Required (except a built-in set of read-only commands) |
| File changes | Edit / write | Required (“don’t ask again” lasts until the session ends) |
| Web fetch | WebFetch | Required (except preapproved documentation domains) |
| Web search | WebSearch | Required |

## Permission modes

A mode switches how much confirmation is skipped. Switch with Shift+Tab during a session, or specify it at startup, such as claude --permission-mode plan. To always start in the same mode, set defaultMode in a settings file.

| Mode | Behavior |
| --- | --- |
| default | Asks the first time each tool is used (shown as “Manual” in the CLI) |
| acceptEdits | Automatically allows file edits and basic file operations such as mkdir, mv and cp in the working directory |
| plan | Only reads and investigates; does not edit source files |
| auto | Skips routine confirmations; a background classifier checks that an action matches your request before it runs |
| dontAsk | Automatically denies every operation that would need confirmation. Rules you allowed in advance still work |
| bypassPermissions | Skips confirmation (see the warning below) |

## allow, ask and deny rules

To decide more finely than modes allow, write rules. allow permits without confirmation, ask confirms every time, and deny forbids. /permissions lists all rules and which settings file each one comes from. Evaluation runs deny, then ask, then allow, and the first match is the result. So you cannot carve an exception out of a broad deny with a narrower allow.

<figure class="diagram"><svg viewBox="0 0 400 440" role="img" aria-labelledby="pf-t"><title id="pf-t">How permission rules are evaluated</title><defs><marker id="pf-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="d-arrowhead"/></marker></defs><rect x="20" y="6" width="180" height="34" rx="8" class="d-accent-soft"/><text x="110" y="28" class="d-strong" text-anchor="middle">Tool call</text><path d="M110 42 V70" class="d-line" marker-end="url(#pf-a)"/><rect x="20" y="72" width="180" height="50" rx="8" class="d-box"/><text x="110" y="102" class="d-strong" text-anchor="middle">Matches a deny rule?</text><path d="M200 97 H238" class="d-line" marker-end="url(#pf-a)"/><text x="219" y="89" class="d-small" text-anchor="middle">Yes</text><rect x="240" y="72" width="140" height="50" rx="8" class="d-danger"/><text x="310" y="93" class="d-strong" text-anchor="middle">Blocked</text><text x="310" y="111" class="d-small d-mono" text-anchor="middle">Bash(git push *)</text><path d="M110 124 V156" class="d-line" marker-end="url(#pf-a)"/><text x="118" y="144" class="d-small">No</text><rect x="20" y="158" width="180" height="50" rx="8" class="d-box"/><text x="110" y="188" class="d-strong" text-anchor="middle">Matches an ask rule?</text><path d="M200 183 H238" class="d-line" marker-end="url(#pf-a)"/><text x="219" y="175" class="d-small" text-anchor="middle">Yes</text><rect x="240" y="158" width="140" height="50" rx="8" class="d-warn"/><text x="310" y="179" class="d-strong" text-anchor="middle">Ask every time</text><text x="310" y="197" class="d-small d-mono" text-anchor="middle">Bash(rm *)</text><path d="M110 210 V242" class="d-line" marker-end="url(#pf-a)"/><text x="118" y="230" class="d-small">No</text><rect x="20" y="244" width="180" height="50" rx="8" class="d-box"/><text x="110" y="274" class="d-strong" text-anchor="middle">Matches an allow rule?</text><path d="M200 269 H238" class="d-line" marker-end="url(#pf-a)"/><text x="219" y="261" class="d-small" text-anchor="middle">Yes</text><rect x="240" y="244" width="140" height="50" rx="8" class="d-ok"/><text x="310" y="265" class="d-strong" text-anchor="middle">Allowed</text><text x="310" y="283" class="d-small d-mono" text-anchor="middle">Bash(npm run *)</text><path d="M110 296 V328" class="d-line" marker-end="url(#pf-a)"/><text x="118" y="316" class="d-small">No</text><text x="310" y="62" class="d-small" text-anchor="middle">Example rule</text><rect x="20" y="330" width="180" height="52" rx="8" class="d-box"/><text x="110" y="353" class="d-strong" text-anchor="middle">Mode’s default behavior</text><text x="110" y="371" class="d-small" text-anchor="middle">(default mode asks the first time)</text><text x="20" y="410" class="d-small">The first match decides the result.</text><text x="20" y="428" class="d-small">A narrow allow can’t override a broad deny.</text></svg><figcaption>Figure 1. Rules are checked in the order deny, ask, allow, and the first match is the result. If none match, the permission mode’s default behavior applies.</figcaption></figure>

```json Example settings file (settings.json)
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

## The wildcard pitfall

In a Bash rule, \* matches any text, including spaces. Put the \* after the subcommand. Bash(git log \*) allows only git log, but Bash(git \*) allows every git command. An allow rule with \* before the subcommand (for example Bash(git \* main)) triggers a warning at startup. Also, a rule matches the text of the command Claude wrote. So even with a deny rule (Bash(git push \*)), a different spelling such as git -C . push does not match.

- Bash(npm run build) matches only npm run build (it does not match once you add --watch)
- Bash(npm run \*) matches npm run build and npm run test --watch, but not npm install
- For operations that must never run, don’t rely on deny alone; also protect them with something like a PreToolUse hook

## Settings precedence

Permission rules follow the same precedence as other settings, and managed settings distributed by an organization are the strongest. An operation denied at any level can’t be allowed at another. Even if user settings allow something, project settings that deny it block it. Conversely, a deny in user settings is stronger than an allow in project settings.

## Instructions don’t change permissions

Permission rules are enforced by Claude Code, not by the model. Writing “don’t run this command” in a prompt or CLAUDE.md affects what Claude tries, but not what Claude Code allows. To change what is allowed or forbidden reliably, use /permissions, rules, a permission mode, or a PreToolUse hook.

> This distinction connects to the CLAUDE.md section of the previous article: requests go in CLAUDE.md, prohibitions go in permission rules.

## Use bypassPermissions only in isolated environments

In bypassPermissions mode, all confirmation is skipped, including writes to protected paths such as .git and .claude. Use it only in environments where it doesn’t matter if Claude Code breaks things, such as containers or VMs. To stop this mode or auto mode from being used, set permissions.disableBypassPermissionsMode or permissions.disableAutoMode to "disable". Put in managed settings, they can’t be overridden by users.
