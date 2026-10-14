---
title: "Getting started with AWS: the big picture and a safe start"
description: "Regions and AZs, the main services, a typical web architecture and the shared responsibility model. Plus the safety settings to make first, and the cost pitfalls."
category: "infra"
tags: ["AWS","Cloud","Introduction"]
minutes: 11
type: "Beginner guide"
level: "Enough if you know basic IT"
takeaway: "AWS lets you rent servers and databases for just as long as you need them. Before you start, decide three things: protect the root user, set up everyday access, and set a cost alert. They prevent most big accidents."
order: 12
sources:
  - { title: "AWS — Global Infrastructure", url: "https://aws.amazon.com/about-aws/global-infrastructure/" }
  - { title: "AWS — Shared Responsibility Model", url: "https://aws.amazon.com/compliance/shared-responsibility-model/" }
  - { title: "AWS Docs — Security best practices in IAM", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html" }
  - { title: "AWS Docs — Root user best practices", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html" }
  - { title: "AWS What's New — AWS Free Tier now offers $200 in credits and 6-month free plan", url: "https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/" }
---

## What AWS is

AWS (Amazon Web Services) is a cloud service that lets you rent servers, storage, databases, networking and more over the internet, in just the amount you need. Instead of buying and housing servers yourself, you pay for what you use. You can start a server in minutes and stop it when you are done.

There is a huge range to rent, and the number of services keeps growing. You do not need to learn them all at the start. This article sticks to the overall structure, the main services to learn first, and how to start safely.

> Service names, screens, prices and free tiers change. I checked the free-tier rules against the official announcement in October 2026. The rest is general explanation, so check the latest official documentation and pricing pages when you actually use it.

## The structure: Regions and Availability Zones

AWS is made of separate sites around the world.

<figure class="diagram"><svg viewBox="0 0 400 520" role="img" aria-labelledby="ag-t"><title id="ag-t">AWS structure: Regions and Availability Zones</title><defs><filter id="ag-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="ag-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="ag-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="178" y="12" width="44" height="44" rx="4" fill="#7D8998"/><g transform="translate(188,22)" class="d-ico-w"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g><text x="200" y="70" class="d-alabel" text-anchor="middle">Users</text><path d="M200 84 V128" class="d-path" marker-end="url(#ag-a)"/><circle cx="214" cy="106" r="9" class="d-num"/><text x="214" y="109.6" class="d-numt" text-anchor="middle">1</text><rect x="6" y="100" width="388" height="408" rx="2" fill="var(--ink)" fill-opacity="0" stroke="var(--ink)" stroke-width="1.6"/><text x="14" y="116" class="d-atab">AWS Cloud</text><rect x="178" y="134" width="44" height="44" rx="4" fill="#8C4FFF"/><g transform="translate(188,144)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="200" y="192" class="d-alabel" text-anchor="middle">CloudFront</text><text x="200" y="204" class="d-alabel" text-anchor="middle">edge location</text><path d="M200 208 V232" class="d-path" marker-end="url(#ag-a)"/><circle cx="214" cy="220" r="9" class="d-num"/><text x="214" y="223.6" class="d-numt" text-anchor="middle">2</text><rect x="16" y="214" width="368" height="216" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="16" y="214" width="24" height="24" fill="#00A4A6"/><g transform="translate(20,218) scale(.67)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="46" y="230" class="d-atab">Region (e.g. Tokyo)</text><rect x="26" y="244" width="170" height="150" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="34" y="260" class="d-atab">AZ A</text><rect x="54" y="288" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(64,298)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="76" y="346" class="d-alabel" text-anchor="middle">EC2</text><text x="76" y="358" class="d-alabel" text-anchor="middle">server</text><rect x="126" y="288" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(136,298)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="148" y="346" class="d-alabel" text-anchor="middle">RDS</text><text x="148" y="358" class="d-alabel" text-anchor="middle">database</text><rect x="204" y="244" width="170" height="150" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="212" y="260" class="d-atab">AZ B</text><rect x="232" y="288" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(242,298)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="254" y="346" class="d-alabel" text-anchor="middle">EC2</text><text x="254" y="358" class="d-alabel" text-anchor="middle">server</text><rect x="304" y="288" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(314,298)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="326" y="346" class="d-alabel" text-anchor="middle">RDS</text><text x="326" y="358" class="d-alabel" text-anchor="middle">database</text><text x="200" y="416" class="d-alabel" text-anchor="middle">AZs are joined by fast private links</text><rect x="16" y="440" width="368" height="56" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="16" y="440" width="24" height="24" fill="#00A4A6"/><g transform="translate(20,444) scale(.67)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="46" y="456" class="d-atab">Region (e.g. Osaka)</text><text x="30" y="486" class="d-alabel">A distant site. Data does not move on its own</text></svg><figcaption>Figure 1 A Region is made of several physically separate AZs. If one AZ stops, another can keep running. A simplified drawing in AWS diagram style (not the official icons).</figcaption></figure>

- **Region**: a geographic area (Tokyo, Osaka, N. Virginia and so on). Services and data are independent in each Region
- **Availability Zone (AZ)**: a group of physically separate data centers within one Region. Power and networking are separate too, so if one AZ fails, the others keep running
- **Edge location**: a site that serves content close to users (used by CloudFront and others)

How to choose:

- Choose the Region by closeness to your users and by legal and data-location requirements. Services and prices can differ by Region
- To make something harder to take down, spread it across several AZs in one Region
- Data does not leave a Region unless you explicitly copy it to another

## The main services to learn first

| Service | Role | Think of it as |
| --- | --- | --- |
| EC2 | Rent virtual servers | A PC where you install any OS |
| S3 | Store files (object storage) | A file store with practically unlimited space |
| VPC | Your own virtual network | A company network |
| IAM | Decide who may do what | Building access control |
| RDS | A managed database | A DB that handles backups and updates for you |
| Lambda | Upload only code and run it when called | Functions without a server |
| CloudFront | Deliver from nearby locations worldwide (a CDN) | Delivery hubs around the world |
| Route 53 | Map domain names to IP addresses (DNS) | A phone book |
| CloudWatch | Logs, metrics and alarms | A monitoring room |

There are many more services. The table is only an entrance.

## A typical web app architecture

A typical small web app shows how the services connect.

<figure class="diagram"><svg viewBox="0 0 400 660" role="img" aria-labelledby="aw-t"><title id="aw-t">A typical AWS setup for a small web app</title><defs><filter id="aw-sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".10"/></filter><linearGradient id="aw-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.09"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient><marker id="aw-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1.5L9 5L1 8.5z" class="d-arrowhead"/></marker></defs><rect x="178" y="12" width="44" height="44" rx="4" fill="#7D8998"/><g transform="translate(188,22)" class="d-ico-w"><path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"/></g><text x="200" y="70" class="d-alabel" text-anchor="middle">Users</text><path d="M200 84 V128" class="d-path" marker-end="url(#aw-a)"/><circle cx="214" cy="106" r="9" class="d-num"/><text x="214" y="109.6" class="d-numt" text-anchor="middle">1</text><rect x="6" y="100" width="388" height="548" rx="2" fill="var(--ink)" fill-opacity="0" stroke="var(--ink)" stroke-width="1.6"/><text x="14" y="116" class="d-atab">AWS Cloud</text><rect x="178" y="134" width="44" height="44" rx="4" fill="#8C4FFF"/><g transform="translate(188,144)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="200" y="192" class="d-alabel" text-anchor="middle">CloudFront</text><text x="200" y="204" class="d-alabel" text-anchor="middle">edge delivery</text><path d="M200 208 V280" class="d-path" marker-end="url(#aw-a)"/><circle cx="214" cy="244" r="9" class="d-num"/><text x="214" y="247.6" class="d-numt" text-anchor="middle">2</text><rect x="16" y="212" width="368" height="428" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><rect x="16" y="212" width="24" height="24" fill="#00A4A6"/><g transform="translate(20,216) scale(.67)" class="d-ico-w"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></g><text x="46" y="228" class="d-atab">Region</text><rect x="26" y="246" width="348" height="280" rx="2" fill="#8C4FFF" fill-opacity="0.06" stroke="#8C4FFF" stroke-width="1.6"/><rect x="26" y="246" width="24" height="24" fill="#8C4FFF"/><g transform="translate(30,250) scale(.67)" class="d-ico-w"><path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7 1.2A3.4 3.4 0 0 1 17 18z"/></g><text x="56" y="262" class="d-atab">VPC</text><rect x="178" y="282" width="44" height="44" rx="4" fill="#8C4FFF"/><g transform="translate(188,292)" class="d-ico-w"><path d="M4 12h6M10 12l6-6M10 12l6 6M16 6h4M16 18h4"/></g><text x="200" y="340" class="d-alabel" text-anchor="middle">ALB</text><text x="200" y="352" class="d-alabel" text-anchor="middle">load balancer</text><rect x="36" y="372" width="160" height="144" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="44" y="388" class="d-atab">AZ A</text><rect x="44" y="398" width="144" height="110" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6"/><rect x="44" y="398" width="24" height="24" fill="#00A4A6"/><g transform="translate(48,402) scale(.67)" class="d-ico-w"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g><text x="74" y="414" class="d-atab">Private subnet</text><rect x="58" y="428" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(68,438)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="80" y="486" class="d-alabel" text-anchor="middle">EC2</text><text x="80" y="498" class="d-alabel" text-anchor="middle">server</text><rect x="130" y="428" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(140,438)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="152" y="486" class="d-alabel" text-anchor="middle">RDS</text><text x="152" y="498" class="d-alabel" text-anchor="middle">database</text><path d="M200 358 V366 H80 V426" class="d-path" marker-end="url(#aw-a)"/><path d="M104 450 H126" class="d-path" marker-end="url(#aw-a)"/><rect x="204" y="372" width="160" height="144" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6" stroke-dasharray="6 4"/><text x="212" y="388" class="d-atab">AZ B</text><rect x="212" y="398" width="144" height="110" rx="2" fill="#00A4A6" fill-opacity="0.06" stroke="#00A4A6" stroke-width="1.6"/><rect x="212" y="398" width="24" height="24" fill="#00A4A6"/><g transform="translate(216,402) scale(.67)" class="d-ico-w"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g><text x="242" y="414" class="d-atab">Private subnet</text><rect x="226" y="428" width="44" height="44" rx="4" fill="#ED7100"/><g transform="translate(236,438)" class="d-ico-w"><path d="M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></g><text x="248" y="486" class="d-alabel" text-anchor="middle">EC2</text><text x="248" y="498" class="d-alabel" text-anchor="middle">server</text><rect x="298" y="428" width="44" height="44" rx="4" fill="#C925D1"/><g transform="translate(308,438)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></g><text x="320" y="486" class="d-alabel" text-anchor="middle">RDS</text><text x="320" y="498" class="d-alabel" text-anchor="middle">standby</text><path d="M200 358 V366 H248 V426" class="d-path" marker-end="url(#aw-a)"/><path d="M272 450 H294" class="d-path" marker-end="url(#aw-a)"/><circle cx="140" cy="366" r="9" class="d-num"/><text x="140" y="369.6" class="d-numt" text-anchor="middle">3</text><circle cx="124" cy="440" r="9" class="d-num"/><text x="124" y="443.6" class="d-numt" text-anchor="middle">4</text><rect x="88" y="544" width="44" height="44" rx="4" fill="#7AA116"/><g transform="translate(98,554)" class="d-ico-w"><path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6l2 13c.2 1 2.3 2 5 2s4.8-1 5-2l2-13"/></g><text x="110" y="602" class="d-alabel" text-anchor="middle">S3</text><text x="110" y="614" class="d-alabel" text-anchor="middle">file store</text><rect x="268" y="544" width="44" height="44" rx="4" fill="#E7157B"/><g transform="translate(278,554)" class="d-ico-w"><path d="M4 20V11M10 20V4M16 20v-8M3 20h18"/></g><text x="290" y="602" class="d-alabel" text-anchor="middle">CloudWatch</text><text x="290" y="614" class="d-alabel" text-anchor="middle">logs, alarms</text></svg><figcaption>Figure 2 The numbers show the order a request flows (1 users → 2 edge → 3 load balancer → 4 server → database). A simplified drawing in AWS diagram style (not the official icons).</figcaption></figure>

- A user's request arrives at CloudFront, which returns static files from a nearby location
- For dynamic work, a load balancer (ALB) distributes requests to servers (EC2) in several AZs
- The database (RDS) sits in a private subnet that cannot be reached directly from outside
- Images and backups go in S3. Logs and metrics are collected in CloudWatch

## The shared responsibility model

In the cloud, AWS and you split what each protects.

| Scope | Who | Examples |
| --- | --- | --- |
| Security **of** the cloud | AWS | Data center buildings, hardware, the virtualization layer |
| Security **in** the cloud | You | Access settings, OS updates, data encryption, how far the network is exposed |

“We use AWS, so we are safe” is not true. Making an S3 bucket public by mistake, or leaking an access key with strong permissions, is a problem with your side's settings. Your share varies by service (with EC2 you handle OS updates; with Lambda it is mostly your code and permissions).

## Safety settings to make first

After creating an account, decide these three things before using any services.

1. **Protect the root user**: the account you first created with an email address is the root user, which holds every permission and the billing information. Give it a strong password and always set up multi-factor authentication (MFA). Do not use it for everyday work.
2. **Create separate everyday access**: the official guidance is for people to use temporary credentials rather than long-lived access keys. For several accounts or people, managing access with IAM Identity Center is recommended. Limit permissions to what is needed.
3. **Set a cost alert**: with a budget (AWS Budgets), set a spending limit and who gets notified, so you notice overspending quickly.

Once IAM Identity Center is set up, the AWS CLI can also work through browser sign-in.

```bash AWS CLI example
# Set up a connection through IAM Identity Center (follow the prompts)
aws configure sso

# Sign in with that connection (<profile-name> is the name you chose)
aws sso login --profile <profile-name>

# Check which account and identity you are acting as
aws sts get-caller-identity --profile <profile-name>
```

> Never put an access key and secret in source code or Git. If leaked, others can use them and run up a large bill. When you must create a key, limit its permissions and delete it when you stop using it.

## How costs work

AWS charges for what you use. New accounts have a way to try it for free. According to the official announcement, new customers can use up to $200 in credits on sign-up ($100 granted, the rest earned by using eligible services). The free account plan ends 6 months after sign-up or when the credits run out, whichever comes first, and you are not charged unless you move to the paid plan. Details can change, so check the official page.

Common causes of surprise charges:

- **Servers left running**: EC2 is charged by the time it runs. Stop or delete it when you are done
- **Data transfer**: data leaving AWS can incur transfer charges
- **Network components**: some, like a NAT gateway, are charged by the hour just for existing and also by the amount of data passed
- **Forgotten resources**: storage, load balancers and fixed IP addresses keep charging while they remain, even when unused

Delete what you made for practice in one go when you finish. Tagging resources makes it clear what to delete.

## How to learn

1. On the free plan, create an account and make the three safety settings above
2. Put a file in S3 and confirm that, with no public setting, only you can read it
3. Start one EC2 server, connect to it, then delete it
4. Build a small web app in the shape of the diagram above
5. Try serverless approaches such as Lambda

## Checklist

- [ ] Did you set a strong password and MFA on the root user?
- [ ] Are you avoiding the root user for everyday work?
- [ ] Do people use temporary credentials? If you use access keys, did you limit their permissions?
- [ ] Are access keys kept out of code and Git?
- [ ] Did you set a budget and a notification?
- [ ] Did you choose the Region you will use? Are you not creating things in an unintended Region?
- [ ] Did you delete the resources you made for practice?
