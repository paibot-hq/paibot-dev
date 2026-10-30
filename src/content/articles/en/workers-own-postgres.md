---
title: "Using your own PostgreSQL from Cloudflare Workers: connect without opening a port, and share one server between services"
description: "Full-text and vector search led us to run PostgreSQL on a VM behind a Workers site. A record of connecting it through Hyperdrive, Workers VPC and Tunnel, separating services with roles, and keeping backups and batch jobs on the VM."
category: "infra"
tags: ["PostgreSQL","Cloudflare","Hyperdrive","Terraform"]
minutes: 11
type: "Setup record"
level: "For people who have touched Workers and a little PostgreSQL"
takeaway: "You can choose to own just the database. Open no inbound port, let a Tunnel connect out from inside, and have the site read through Hyperdrive. Limit each service's role by time and connections, and several services can share one server."
order: 17
sources:
  - { title: "Cloudflare Hyperdrive — Documentation", url: "https://developers.cloudflare.com/hyperdrive/" }
  - { title: "Hyperdrive — Connect to a private database using Workers VPC", url: "https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database-vpc/" }
  - { title: "Cloudflare Workers VPC", url: "https://developers.cloudflare.com/workers-vpc/" }
  - { title: "Cloudflare Tunnel", url: "https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/" }
  - { title: "Google Cloud — Using IAP for TCP forwarding", url: "https://cloud.google.com/iap/docs/using-tcp-forwarding" }
  - { title: "PGroonga", url: "https://pgroonga.github.io/" }
  - { title: "pgvector", url: "https://github.com/pgvector/pgvector" }
---

## Why own just the database

Owning no servers is the default for a small team (in [A stack for solo developers and early startups](../startup-stack/), even the database was D1). One service, however, needed three things at once.

- **Japanese full-text search**: find titles and names by substring, quickly, even for one- or two-character words
- **Vector search**: find products close in meaning to words like “I want to unwind after a tiring night”
- **About 480,000 products**: each with detailed JSON, updated every day from an external API

PostgreSQL lets you use PGroonga (full-text search that handles Japanese well) and pgvector (vector search) on the same table. So we **kept the site on Workers and put only the database on a VM**. This article records that setup and what running it taught us.

> Prices, limits and beta features change. Check each company's official documentation before you use them. Workers VPC is in beta as of October 2026.

## The overall path

The path from the site's Worker to PostgreSQL on the VM is:

<figure class="diagram"><svg viewBox="0 0 400 568" role="img" aria-labelledby="pa-t"><title id="pa-t">The path from the Workers site to PostgreSQL on a VM</title><defs><filter id="pa-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="pa-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="pa-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><g class="k-n"><rect x="110" y="8" width="180" height="42" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="134" cy="29" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(125,20) scale(.75)" class="d-ico"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g></g><text x="156" y="33.5" class="d-ntitle">Visitor</text><path d="M200 52 V96" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1.5s" repeatCount="indefinite" path="M200 52 V96"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1.5s" repeatCount="indefinite"/></circle><rect x="8" y="68" width="384" height="214" rx="14" fill="url(#pa-g)" class="d-group"/><text x="24" y="88" class="d-gtitle">CLOUDFLARE</text><g class="k-a"><rect x="24" y="98" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="122" r="14" class="d-badge"/></g><g class="k-a"><g transform="translate(39,113) scale(.75)" class="d-ico"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></g></g><text x="70" y="120" class="d-ntitle">Site Worker</text><text x="70" y="135" class="d-nsub">pages and search API</text><path d="M200 148 V158" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0s" repeatCount="indefinite" path="M200 148 V158"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="160" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="184" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,175) scale(.75)" class="d-ico"><path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/></g></g><text x="70" y="182" class="d-ntitle">Hyperdrive</text><text x="70" y="197" class="d-nsub">pools and reuses connections</text><path d="M200 210 V220" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="0.5s" repeatCount="indefinite" path="M200 210 V220"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-n"><rect x="24" y="222" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="246" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(39,237) scale(.75)" class="d-ico"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></g></g><text x="70" y="244" class="d-ntitle">Workers VPC</text><text x="70" y="259" class="d-nsub">entry to unpublished targets</text><path d="M200 272 V330" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="2.4s" begin="1s" repeatCount="indefinite" path="M200 272 V330"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="2.4s" begin="1s" repeatCount="indefinite"/></circle><text x="212" y="290" class="d-nsub">opened from inside the VM</text><rect x="8" y="298" width="384" height="232" rx="14" fill="url(#pa-g)" class="d-group"/><text x="24" y="318" class="d-gtitle">VM (GCP TOKYO)</text><g class="k-ok"><rect x="24" y="332" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="356" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,347) scale(.75)" class="d-ico"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g></g><text x="70" y="354" class="d-ntitle">cloudflared</text><text x="70" y="369" class="d-nsub">the VM end of the Tunnel</text><path d="M200 382 V392" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.2s" begin="1.5s" repeatCount="indefinite" path="M200 382 V392"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.2s" begin="1.5s" repeatCount="indefinite"/></circle><g class="k-ok"><rect x="24" y="394" width="352" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="418" r="14" class="d-badge"/></g><g class="k-ok"><g transform="translate(39,409) scale(.75)" class="d-ico"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g></g><text x="70" y="416" class="d-ntitle">PostgreSQL 17</text><text x="70" y="431" class="d-nsub">localhost only; PGroonga, pgvector</text><g class="k-w"><rect x="24" y="466" width="172" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="48" cy="490" r="14" class="d-badge"/></g><g class="k-w"><g transform="translate(39,481) scale(.75)" class="d-ico"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g></g><text x="70" y="488" class="d-ntitle">systemd timers</text><text x="70" y="503" class="d-nsub">daily imports</text><g class="k-n"><rect x="204" y="466" width="172" height="48" rx="11" class="d-node" filter="url(#pa-sh)"/><circle cx="228" cy="490" r="14" class="d-badge"/></g><g class="k-n"><g transform="translate(219,481) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g><text x="250" y="488" class="d-ntitle">Backups</text><text x="250" y="503" class="d-nsub">pg_dump → R2</text><path d="M110 464 V444" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0s" repeatCount="indefinite" path="M110 464 V444"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0s" repeatCount="indefinite"/></circle><path d="M290 444 V464" class="d-path" marker-end="url(#pa-a)"/><circle r="3" class="d-dot" opacity="0"><animateMotion dur="1.4s" begin="0.5s" repeatCount="indefinite" path="M290 444 V464"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="1.4s" begin="0.5s" repeatCount="indefinite"/></circle><g class="k-w"><g class="k-w"><g transform="translate(21,543) scale(.75)" class="d-ico"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g></g></g><text x="48" y="556" class="d-nsub">The only way in from outside: SSH via IAP</text></svg><figcaption>Figure 1 The site stays on Workers; only the database lives on a VM. The VM opens no inbound port: cloudflared connects out to Cloudflare from inside. Imports and backups run next to the database.</figcaption></figure>

- **Hyperdrive**: pools the Worker's connections into a few connections to PostgreSQL, so a request does not reconnect to a distant database every time
- **Workers VPC**: the entry that lets Hyperdrive reach a destination not published on the internet (`localhost:5432` behind the Tunnel)
- **Cloudflare Tunnel**: `cloudflared` on the VM opens the connection to Cloudflare **from inside**, so the VM needs no inbound port
- **PostgreSQL**: listens on `localhost` only, so nobody can connect to it directly from the internet

The only way into the VM is SSH for administration. Even that is allowed by the firewall only from the address range of Google's IAP (a managed bastion), and you enter with `gcloud compute ssh --tunnel-through-iap`.

## How this differs from the earlier connection

At first we connected with “Tunnel + Access”, as in Hyperdrive's documented procedure: the Tunnel gets a public hostname, and only a Hyperdrive holding a Cloudflare Access service token may pass. We have since moved to Workers VPC.

| | Tunnel + Access | Workers VPC |
| --- | --- | --- |
| Public hostname | Needed (such as `db.<domain>`) | Not needed |
| Access application and service token | Needed | Not needed |
| Secrets given to Hyperdrive | Database password, token ID and secret | Database password |
| Status | Generally available | Beta (October 2026) |

Fewer hostnames and tokens mean fewer things to rotate and fewer places to misconfigure. We moved knowing that it is a beta.

## Sharing one server between services

The VM holds one database per service. The script that adds a service creates two roles for it.

- **Owner role** (`<name>`): creates the tables and writes the daily updates
- **Site role** (`<name>_web`): used by the site's Worker; reads, and writes only to the tables it needs

The site role gets these limits:

```sql add-database.sh (excerpt)
CREATE ROLE "<name>_web" LOGIN PASSWORD '...' CONNECTION LIMIT 20;
ALTER ROLE "<name>_web" SET statement_timeout = '3s';
REVOKE ALL ON DATABASE "<name>" FROM PUBLIC;
```

- **Cancel after 3 seconds**: one service's heavy query does not drag the others down. When a query is cancelled, the site falls back to a search with fewer conditions
- **At most 20 connections**: Hyperdrive's pool cannot use up the database's connections
- **No way into other databases**: every database drops “anyone may connect” (`CONNECT` for `PUBLIC`). A leaked password for one service does not expose another service's data

In practice, one search's SQL once picked a slow plan and took 4 seconds. Because it is cancelled at 3 seconds, only that search fails and the other services are not affected (the cause and the fix are in the [UNION ALL article](../postgres-union-all-in/)).

## What Terraform creates, and what it does not

Terraform creates the VM and the network.

- VM: Tokyo region, `e2-standard-2` (2 vCPUs, 8 GB), 50 GB disk
- A dedicated network, and a firewall that allows only SSH from IAP
- Disk snapshots: daily, kept 30 days
- Budget alert: JPY 15,000 a month for the whole project (mail at 50% and 100%)

**Secrets never go into Terraform.** A database password or Tunnel token in a variable stays in plain text in Terraform's state file. Secrets are entered on the server, without showing them. For example, the Tunnel token is typed locally and piped over SSH into a file only `root` can read.

```bash add-cloudflared.sh (excerpt)
read -rs -p "Tunnel token for $NAME (not shown): " TOKEN; echo
printf 'TUNNEL_TOKEN=%s\n' "$TOKEN" | gcloud compute ssh pg-main "${Z[@]}" \
  --command "sudo tee /etc/cloudflared-$NAME.env >/dev/null && sudo chmod 600 /etc/cloudflared-$NAME.env"
unset TOKEN
```

A Tunnel and its Hyperdrive must be in the same Cloudflare account as the Worker. Because sites in another account use the server too, the VM runs one `cloudflared` per account.

## Backups and daily batch jobs

Owning the data makes backups your job.

- **Disk snapshots**: daily, kept 30 days (taken by GCP)
- **Logical backups**: every day, each database is dumped with `pg_dump`, and sent with the roles to object storage (R2). Kept 14 days
- **Restore checks**: once a month, restore into another database with `pg_restore`. A backup you have never restored is as good as none

The jobs that import products from the external API run on the same VM as systemd timers: a full update every day, a sync of changes three times a day, and extra details every hour. Running right next to the database, writing hundreds of thousands of rows does not cross the network again and again.

## What running it taught us

- **Size the vector index to fit in memory**: pgvector's HNSW index (1024 dimensions stored as halfvec, about 1.3 GB for about 480,000 rows) did not fit in the memory of a 4 GB VM. We moved to 8 GB and added a script that sets PostgreSQL's memory settings (such as `shared_buffers` at a quarter of memory) for the VM's size
- **Develop locally in a container with the same extensions**: `wrangler dev` connects to a local database through `localConnectionString` instead of Hyperdrive. An image with PGroonga and pgvector lets you try the same SQL as production
- **Keep heavy batches away from the site's searches**: the daily update runs early in the morning, when traffic is low
- **Know what can grow without downtime**: the disk grows without stopping, but changing the VM type stops it for a few minutes

## When this fits, and when it does not

| Fits | Does not fit |
| --- | --- |
| You need PostgreSQL extensions (full-text, vectors) | A managed database such as D1 is enough |
| The data is large and updated in daily batches | Writes are heavy and must be fast from everywhere |
| You can watch backups and updates yourself | Nobody can look after a database |

Owning the database brings OS updates, free disk space and backup checks back to you. The site itself, though, stays on Workers with no servers to own. You own only what you need to.

## Checklist

- [ ] The database port is not open to the internet (the Tunnel connects from inside)
- [ ] The site role has a statement timeout and a connection limit
- [ ] Roles cannot connect to other services' databases
- [ ] No password or token is left in Terraform's state file or in shell history
- [ ] You have actually restored a backup
- [ ] The indexes fit in memory
