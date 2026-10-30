---
title: "A stack for solo developers and early startups: build small, keep operations light"
description: "How to choose technology to build and run with a small team, using the setup of a real web app (React Router, Cloudflare Workers, D1, Clerk) as the example."
category: "backend"
tags: ["Solo dev","Cloudflare","Architecture"]
minutes: 13
type: "Design guide"
level: "Enough if you have built one web app"
takeaway: "A small team should choose its stack for light operations, not raw speed. Own no servers, delegate authentication, automate deployment, and keep a human check only for production. These four keep a small team going for a long time."
order: 13
sources:
  - { title: "React Router — Documentation", url: "https://reactrouter.com/" }
  - { title: "Cloudflare Workers — Documentation", url: "https://developers.cloudflare.com/workers/" }
  - { title: "Cloudflare D1 — Documentation", url: "https://developers.cloudflare.com/d1/" }
  - { title: "Clerk — Documentation", url: "https://clerk.com/docs" }
  - { title: "Drizzle ORM — Documentation", url: "https://orm.drizzle.team/" }
---

## How a small team should choose technology

Big companies start from “will it survive thousands of users?” Solo developers and newly founded startups have different problems. There are few people, little time, and when something breaks at night, you fix it yourself.

This article uses the setup of a small web app that is actually running, PAIBOT.app, to show how to choose a stack you can build and keep operating with few people. Five criteria guide the choices.

1. **Own no servers**: do not carry OS updates, reboots or disk worries yourself
2. **Low fixed cost**: you can start in a form that costs almost nothing when nobody uses it
3. **Delegate what you can**: hand things that are dangerous to get wrong, such as authentication, payments and email, to specialist services
4. **Automated tests and deployment**: the fewer people you are, the more time manual checks waste
5. **Stay movable**: do not tie yourself to one company more than you must

> This setup is one example, not the answer. Service features, prices and free tiers change, so check each company's official documentation before you use it.

## The overall setup

PAIBOT.app is a web app of small browser tools with login and favorites added. Its setup is:

<figure class="diagram"><svg viewBox="0 0 400 396" role="img" aria-labelledby="sk-t"><title id="sk-t">A small web app setup (React Router + Cloudflare)</title><defs><filter id="sk-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="sk-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="sk-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="8" y="8" width="150" height="44" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="32" cy="30" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(23,21) scale(.75)" class="d-ico"><path d="M5 6h14v9H5zM3 19h18"/></g></g><text x="54" y="34.5" class="d-ntitle">Browser</text><g class="k-d"><rect x="242" y="8" width="150" height="44" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="266" cy="30" r="14" class="d-badge"/></g><g class="k-d"><g transform="translate(257,21) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="288" y="28" class="d-ntitle">Clerk</text><text x="288" y="43" class="d-nsub">external auth</text><path d="M160 30 H240" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="0.5s" repeatCount="indefinite" path="M160 30 H240"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="0.5s" repeatCount="indefinite"/></circle><text x="200" y="24" class="d-nsub" text-anchor="middle">sign in</text><path d="M83 54 V108" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M83 54 V108"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><path d="M317 54 V108" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M317 54 V108"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><text x="325" y="84" class="d-nsub">verify identity</text><rect x="8" y="74" width="384" height="312" rx="14" fill="url(#sk-g)" class="d-group"/><text x="24" y="94" class="d-gtitle">CLOUDFLARE</text><g class="k-a"><rect x="24" y="110" width="352" height="56" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="48" cy="138" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,129) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="136" class="d-ntitle">Worker</text><text x="70" y="151" class="d-nsub">React Router SSR and API</text><path d="M78 168 V204" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2s" begin="0s" repeatCount="indefinite" path="M78 168 V204"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="206" width="108" height="72" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="78" cy="227" r="13" class="d-badge"/></g><g class="k-ok"><g transform="translate(69,218) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="78" y="254" class="d-ntitle" text-anchor="middle">D1</text><text x="78" y="268" class="d-nsub" text-anchor="middle">SQLite-based DB</text><path d="M200 168 V204" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.2s" begin="0.5s" repeatCount="indefinite" path="M200 168 V204"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="146" y="206" width="108" height="72" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="200" cy="227" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(191,218) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="200" y="254" class="d-ntitle" text-anchor="middle">Workers AI</text><text x="200" y="268" class="d-nsub" text-anchor="middle">calls models</text><path d="M322 168 V204" class="d-path" marker-end="url(#sk-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M322 168 V204"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="268" y="206" width="108" height="72" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="322" cy="227" r="13" class="d-badge"/></g><g class="k-n"><g transform="translate(313,218) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="322" y="254" class="d-ntitle" text-anchor="middle">Rate limit</text><text x="322" y="268" class="d-nsub" text-anchor="middle">per-IP counts</text><g class="k-n"><rect x="24" y="308" width="352" height="56" rx="11" class="d-node" filter="url(#sk-sh)"/><circle cx="48" cy="336" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,327) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="70" y="334" class="d-ntitle">Static assets</text><text x="70" y="349" class="d-nsub">serves images, JS, CSS</text></svg><figcaption>Figure 1 No servers of your own. A Worker receives browser requests and uses the database, AI and rate limiting through bindings. Authentication is delegated to an external service.</figcaption></figure>

- **Framework**: React Router (framework mode). Pages are built on the server (SSR), and run as interactive parts in the browser
- **Runtime**: Cloudflare Workers. There is no server of your own; the code runs at sites around the world for each request
- **Database**: Cloudflare D1 (SQLite-compatible), with Drizzle as the ORM
- **Authentication**: Clerk. You build neither the login screen nor password storage
- **AI**: call Workers AI through a binding, so you need not hold an API key for an outside AI service
- **Rate limiting**: limit the number of requests per IP with Workers' rate limiting feature

## Choices by layer, and why

| Layer | Choice | Why |
| --- | --- | --- |
| Pages | React Router (SSR) | Pages that search engines can read are built on the server. Routing and data loading come together in one mechanism |
| Runtime | Cloudflare Workers | No server operations. You can start in a form that costs almost nothing while unused |
| Data | D1 + Drizzle | No separate database server to run. You write typed queries. Schema changes are managed with migrations |
| Authentication | Clerk | Authentication is easy to get wrong and costly when wrong. Delegate it to a specialist service |
| i18n | use-intl | Japanese, English and Chinese are managed in message files |
| Tests | Node's built-in test runner + Playwright | Light unit tests for calculations and the like, and one browser flow per screen |
| Config management | Wrangler + Terraform | Never manage the same thing in two places. Wrangler for what is close to the app, Terraform for account-wide settings |

The reason is not “Workers is fast” or “D1 is cheap” but that **they need little operational effort**.

## A tip for growth: one tool, one folder

So that things do not get messy as tools multiply, each new tool keeps all its own parts in one folder. The screen, logic, unit tests and browser test live together, and registering it in one shared list is enough for it to appear in the top-page search and the sitemap.

- Run browser tests only for the tools a change can affect (all of them when shared code changes)
- Shared checks (opens in three languages, no errors, fits a phone width) apply to every tool automatically, with no test code
- Environment-specific code (Cloudflare-only features) is confined to server-only files

The last point serves “stay movable”. Keeping the environment-dependent part a thin layer keeps the impact small if you change the runtime.

## The deployment flow

On a small team, the more you deploy by hand, the more mistakes you make. PAIBOT.app works like this:

<figure class="diagram"><svg viewBox="0 0 400 392" role="img" aria-labelledby="df-t"><title id="df-t">How a change reaches production</title><defs><filter id="df-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="df-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="df-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="40" y="10" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="37" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(55,28) scale(.75)" class="d-ico"><path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 12h6M9.5 16h6"/></g></g><text x="86" y="41.5" class="d-ntitle">Submit a change (PR)</text><path d="M200 66 V86" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="1.5s" repeatCount="indefinite" path="M200 66 V86"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="40" y="88" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="115" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(55,106) scale(.75)" class="d-ico"><path d="M5 12.5l4.5 4.5L19 7"/></g></g><text x="86" y="113" class="d-ntitle">Automatic checks</text><text x="86" y="128" class="d-nsub">types, unit tests, build, browser tests</text><path d="M200 144 V164" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="0s" repeatCount="indefinite" path="M200 144 V164"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="40" y="166" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="193" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(55,184) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="86" y="191" class="d-ntitle">Auto-deploy to development</text><text x="86" y="206" class="d-nsub">Access lets only allowed people in</text><path d="M200 222 V242" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="0.5s" repeatCount="indefinite" path="M200 222 V242"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-w"><rect x="40" y="244" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="271" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(55,262) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="86" y="269" class="d-ntitle">Production run by hand</text><text x="86" y="284" class="d-nsub">confirm it passed in dev; roll back by tag</text><path d="M200 300 V320" class="d-path" marker-end="url(#df-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.6s" begin="1s" repeatCount="indefinite" path="M200 300 V320"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.6s" begin="1s" repeatCount="indefinite"/></circle><g class="k-a"><rect x="40" y="322" width="320" height="54" rx="11" class="d-node" filter="url(#df-sh)"/><circle cx="64" cy="349" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(55,340) scale(.75)" class="d-ico"><path d="M4 5h16v5H4zM4 14h16v5H4zM7.5 7.5h.01M7.5 16.5h.01"/></g></g><text x="86" y="347" class="d-ntitle">Deploy to production</text><text x="86" y="362" class="d-nsub">DB migrations in the same procedure</text><path d="M26 12 V218" stroke="var(--ok)" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M26 244 V376" stroke="var(--warn)" stroke-width="3" stroke-linecap="round" opacity=".7"/><text transform="translate(14,115) rotate(-90)" class="d-nsub" text-anchor="middle">AUTOMATIC</text><text transform="translate(14,310) rotate(-90)" class="d-nsub" text-anchor="middle">HUMAN CHECK</text></svg><figcaption>Figure 2 Checks and the deployment to development are automatic; only production is run by a person. That manual run is the human check.</figcaption></figure>

- For every change (PR), type checks, unit tests, the build and browser tests run automatically
- When a change lands on main, it is **deployed to the development environment automatically**. The development environment is protected with Cloudflare Access so only allowed people can open it
- **Production is run by hand.** The production procedure confirms that the change succeeded in development. If something is wrong, you can roll back to an earlier version by specifying a tag
- Database changes (migrations) are part of the production deployment procedure

Production is manual because “everything automatically reaches production” is frightening. The manual run itself is the human check. (At the time, the plan we used lacked the team approval feature, which is why it is shaped this way.)

## Traps we actually hit

The setup was not like this from the start. The app was first built on Next.js, carried onto Cloudflare Workers with a beta adapter. It worked, but it was a combination with few precedents, and we got stuck several times at the joins: how the authentication library was loaded, the internationalization library loaded twice, and so on. In the end we moved to React Router, which runs naturally on Workers.

What this shows:

- **Pick well-trodden combinations for production**: with a beta part in between, you cannot tell whether a bug is in your code or in the part
- **When stuck, suspect a duplicated module**: if the same library is loaded by two paths, one copy's state is invisible to the other, and the error shows up inside the library
- **Keep it movable**: because the boundaries were thin, it was a migration, not a rewrite

## What changes between solo dev and an early startup

| Aspect | Solo developer | Early-stage startup |
| --- | --- | --- |
| What matters | Being able to keep building | Speed of validation, and fixing things later |
| Authentication | Delegate (do not build it) | Delegate. Check early whether enterprise login (SSO) is needed |
| Database | Start small and keep it in one place | Gather database access in one place, expecting a future move |
| Cost | Start on free tiers | Estimate where the free tier runs out, and the price after it |
| Monitoring | Just enough to see errors | Decide who is notified of failures and who responds |
| When people join | Hardly a concern | Automated tests and deployment are what let you add people |

## Cautions when choosing

- **Dependence on a service**: the more convenient the feature, the more you lean on that service. Keep the entrance to the dependency in a thin layer so you can move
- **Free-tier traps**: even a large free tier has conditions and limits that change. Look early at the price when your usage grows
- **Where data lives**: where user data is stored (region, regulations) is hard to change later. Decide early
- **What you cannot delegate**: even if a service handles it, designing permissions (who can see what) remains your job

## Checklist

- [ ] Is your setup free of OS and server management by you?
- [ ] Have you avoided building authentication or payments yourself?
- [ ] Do tests run automatically for every change?
- [ ] Is there a human check before production, and a way to roll back?
- [ ] Are database changes recorded and managed?
- [ ] Is environment-dependent code gathered in one place?
- [ ] Have you looked up the free-tier limits and the price beyond them?
- [ ] Have you decided who notices and who fixes a failure?
