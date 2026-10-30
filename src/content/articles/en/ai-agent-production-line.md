---
title: "Keeping an AI agent out of production: the AI writes code; a person merges, runs production and types secrets"
description: "A record of taking a change from database to production deployment with Claude Code. The AI wrote code and checked it locally; a person merged, ran production and entered secrets. What actually went wrong, and why it still did no harm."
category: "practice"
tags: ["Claude Code","Operations","Security","Deployment"]
minutes: 9
type: "Hands-on guide"
level: "For people starting to use Claude Code on a real service"
takeaway: "Let the AI write code, check it locally, and check the published pages from outside. A person merges, runs things in production and enters secrets. With that line drawn, a bug in a script the AI wrote stopped before it could break anything in production."
order: 19
sources:
  - { title: "Claude Code — Choose a permission mode", url: "https://code.claude.com/docs/en/permission-modes" }
  - { title: "Claude Code — Configure permissions", url: "https://code.claude.com/docs/en/permissions" }
  - { title: "1Password CLI", url: "https://developer.1password.com/docs/cli/" }
---

## The setting

Together with Claude Code, we added a new kind of product (about 70,000 items) to a service: add database tables, fix the daily import, mix the items into the site's search, and make 70,000 vectors (numbers for searching by meaning). Three repositories were involved; production was PostgreSQL on a VM and a site on Cloudflare Workers.

This article records how the work was split and what actually happened. How to write the settings is covered in the [permissions article](../claude-code-permissions/) and the [.env experiment](../protect-env-files/).

## The split: how much to give the AI

| Work | Who | Why |
| --- | --- | --- |
| Write code, add tests | AI | Fast, and it can explain why |
| Run and measure on a local database (a container) | AI | If it breaks, rebuild it |
| Commit | AI | Local only, always reversible |
| Push, open a merge request | AI (**after a person says “yes”**) | It leaves the machine; CI runs and others can see it |
| Merge | Person | Once in main, CI deploys to production |
| Run things on the production server (a deploy script, say) | Person | Hard to undo; touches production data |
| Enter passwords and tokens | Person | Secrets never enter the AI's conversation |
| Check the published pages from outside | AI | Read-only, something anyone can do |

<figure class="diagram"><svg viewBox="0 0 400 460" role="img" aria-labelledby="al-t"><title id="al-t">How the work is split between AI and a person</title><defs><filter id="al-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="al-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="al-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><text x="102" y="18" class="d-gtitle" text-anchor="middle">AI (local, undoable)</text><text x="298" y="18" class="d-gtitle" text-anchor="middle">PERSON (outside, secrets)</text><path d="M200 28 V450" class="d-group"/><g class="k-a"><rect x="8" y="32" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="56" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,47) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="54" y="54" class="d-ntitle">Code and tests</text><text x="54" y="69" class="d-nsub">run and measure locally</text><path d="M102 82 V90" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M102 82 V90"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="92" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="116" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,107) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="54" y="114" class="d-ntitle">Commit</text><text x="54" y="129" class="d-nsub">always reversible</text><path d="M102 142 V146 H298 V150" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M102 142 V146 H298 V150"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="204" y="152" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="228" cy="176" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(219,167) scale(.75)" class="d-ico"><path d="M4 5h16v11H9l-5 4z"/></g></g><text x="250" y="174" class="d-ntitle">Say “yes”</text><text x="250" y="189" class="d-nsub">allow the push and MR</text><path d="M298 202 V206 H102 V210" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1s" repeatCount="indefinite" path="M298 202 V206 H102 V210"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="8" y="212" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="236" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(23,227) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="54" y="234" class="d-ntitle">Push and MR</text><text x="54" y="249" class="d-nsub">CI runs the checks</text><path d="M102 262 V266 H298 V270" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="1.5s" repeatCount="indefinite" path="M102 262 V266 H298 V270"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="204" y="272" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="228" cy="296" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(219,287) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="250" y="294" class="d-ntitle">Merge</text><text x="250" y="309" class="d-nsub">CI deploys production</text><path d="M298 322 V330" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M298 322 V330"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="204" y="332" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="228" cy="356" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(219,347) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="250" y="354" class="d-ntitle">Run in production</text><text x="250" y="369" class="d-nsub">type secrets unseen</text><path d="M298 382 V386 H102 V390" class="d-path" marker-end="url(#al-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M298 382 V386 H102 V390"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="8" y="392" width="188" height="48" rx="11" class="d-node" filter="url(#al-sh)"/><circle cx="32" cy="416" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(23,407) scale(.75)" class="d-ico"><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20"/></g></g><text x="54" y="414" class="d-ntitle">Read output, check</text><text x="54" y="429" class="d-nsub">and the public pages</text></svg><figcaption>Figure 1 What stays local and can be undone goes to the AI; what goes outside, is hard to undo, or involves secrets goes to a person. The AI reads the output the person pastes and moves on.</figcaption></figure>

The line is simple. **What stays local and can be undone goes to the AI. What goes outside, is hard to undo, or involves secrets goes to a person.**

## A person runs things on the production server

The deploy script logs into the VM over SSH, copies files, applies database changes, runs once, then enables the timers. The AI does not run it.

When the AI once issued an SSH command meaning only to *read* the production database, auto mode's check (another model that reviews each action) stopped it. Entering the production server counts as a person's job, even just to read.

Instead, the AI moves on **by reading the output the person pastes**.

- Person: runs the deploy script and pastes the output as is
- AI: reads it and confirms, for example, that “the new table was created this time (no ‘already exists’ notice)” and “the imports of all three categories completed”
- AI: what it cannot check, it hands over as a command for the person, including what output means success

Scripts are written so that **running them again gives the same result** (`CREATE TABLE IF NOT EXISTS`, an `UPDATE` that changes nothing the second time). If a person can stop halfway and just run it again, it is easy to ask them to.

## Secrets stay out of the conversation

Writing 70,000 vectors into the production database needed its password. The AI never gets it. The person types it in their own terminal, without showing it.

```bash Terminal (run by the person)
read -s "PGPASSWORD?DB password: " && export PGPASSWORD && echo
PG_URL='postgres://app@127.0.0.1:55440/app' node scripts/embed-products.mjs --other
unset PGPASSWORD
```

- `read -s` does not echo the input (zsh syntax; in bash, `read -rs -p "..." PGPASSWORD`)
- The connection string has no password; it comes from `PGPASSWORD`, which Node's `pg` and `psql` both read. A password with symbols needs no URL escaping
- `unset` it afterwards. It stays in neither the shell history nor the AI's conversation

The AI checks **whether a value exists, not the value**. The deploy script starts by checking, without printing anything, that both required variables are in the settings file.

```bash deploy.sh (excerpt)
[ "$(grep -c -E '^(API_ID|AFFILIATE_ID)=.' "$ENV_FILE")" = 2 ] || { echo "API_ID and AFFILIATE_ID not both in $ENV_FILE"; exit 1; }
```

Tokens work the same way: the person types them locally and pipes them over SSH into a file only `root` can read. They are kept in a password manager (1Password).

## What actually went wrong

### 1. A push before permission

Once, the AI pushed a commit that added CI settings without waiting for permission. The person stopped it (“What are you doing?”), and the AI explained what happened and apologized. No harm was done, but a push leaves the machine.

Since then, “do not push or deploy until clearly told to” is written in the AI's memory (the project notes) and read in every conversation. You need **a way to keep a rule said once in force in the next conversation too**.

### 2. A script the AI wrote failed first in production

The AI added an `--other` option to the vector script so that it targets the new table. When the person ran it against production, it failed at once.

```text Output (excerpt)
70568 titles to embed
error: syntax error at or near "0.0059967041015625"
```

Inside the loop, a variable named `vectors` holding the computed vectors hid the variable of the same name that held the table's name. `INSERT INTO ${vectors}` got a list of numbers instead of a table name.

It did no harm because:

- It failed on the first write, so nothing had been written
- The script only targets rows with no vector yet, so after the fix it could simply run again (70,000 items in about 10 minutes)
- A person ran it and pasted the output as is, so the AI found the cause right away

The lesson: **after adding an option, run a little of it on the local database (`--limit 100`, say) before handing it to production**. The search SQL had local tests; this script did not.

## Checking from outside can go to the AI

Checking after the deployment only reads published pages, so it went to the AI.

- Whether the sitemap lists the new products (36,407 for 2026)
- Whether a new product's page opens with 200 and shows the “similar titles” block
- Whether existing pages load as fast as before
- `robots.txt`, and whether pages carry `noindex`

Actions whose requests directly cost money or skew numbers (following ad links, calling a paid AI) are avoided even when checking. The chat search costs money on every call, so the AI did not try it and reported “not tried”.

## Tell the AI about the environment's limits too

The AI does not know limits nobody told it. In this project, the notes said:

- **The internal disk is full, so temporary files go on the external SSD** (run dev servers and tests with `TMPDIR=/Volumes/.../.tmp`)
- **Do not stop processes you did not start** (other work's dev servers run on the same machine)
- **A person makes changes on the production server**
- **Never open ad links yourself** (it skews the click numbers)

Each is a small rule, but unless it is written down, the AI trips at the same place every time.

## Checklist

- [ ] Push, merge and production runs wait for a person's explicit instruction
- [ ] Secrets enter neither the AI's conversation nor shell history (`read -s`, environment variables, a password manager)
- [ ] The AI checks only whether a secret exists, never its value
- [ ] Scripts for production give the same result when run again, and can resume after stopping
- [ ] New options and scripts run in small amounts locally before production
- [ ] Rules decided once are written where the next conversation reads them (notes, CLAUDE.md)
- [ ] The AI reports what it did not check as not checked
