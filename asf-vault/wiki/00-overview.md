---
title: "asf-vault overview"
type: overview
updated: 2026-07-18
sources: 84
tags: [llm-wiki, vault, asf-2]
---

# asf-vault overview

**asf-vault** is an Obsidian vault configured as an **LLM Wiki**: a compounding markdown knowledge base maintained by an LLM agent using [[CLAUDE.md]] as the operational schema.

## What lives where

| Location | Purpose |
|----------|---------|
| `raw/sources/` | Immutable source documents you add (includes mirrored `docs/*.md` and repo root `README.md`) |
| `raw/assets/` | Images and attachments (read-only for the agent) |
| `wiki/` | Agent-maintained pages (concepts, entities, source summaries, syntheses) |
| [[index.md]] | Catalog of wiki pages — start here when searching |
| [[log.md]] | Append-only timeline of ingests, queries, and lint passes |

## How to work with the agent

1. Drop or paste sources into `raw/sources/` (and assets into `raw/assets/` when needed).
2. Ask the agent to **ingest** (it updates `wiki/`, [[index.md]], [[log.md]] without touching `raw/`).
3. Ask **questions**; durable answers can be filed under `wiki/syntheses/`.
4. Run **lint** periodically to find orphans, contradictions, and gaps.

## Current focus

- **LLM Wiki pattern** (meta): [[wiki/sources/llm-wiki-idea]], [[wiki/concepts/llm-wiki-pattern]].
- **ASF-2 codebase documentation** (mirrored from repo `docs/` + root `README`): [[wiki/entities/asf-2]], **66** per-file entries `wiki/sources/doc-*.md` (see [[index.md]]), plus thematic [[wiki/sources/batch-2026-04-09-docs-and-root-readme]]. Prefer [docs/README.md](raw/sources/docs/README.md) over [root README](raw/sources/root/README.md) for stack truth.
- **ASF-2 production planning** (2026-04-13 session): [[wiki/concepts/production-readiness-asf-2]], [[wiki/concepts/mobile-app-architecture-asf-2]], and **5** new planning sources covering the full roadmap, user flow audit, 12-step execution plan, Expo mobile strategy, and Delyva delivery integration. Start at [[wiki/sources/2026-04-13-immediate-execution-plan]] for what to build next.
- **ASF-2 mobile apps progress** (2026-04-25): [[wiki/sources/2026-04-25-mobile-apps-progress]] — both Expo apps built and functional. Key schema corrections (products.status not active, product_stock.count not quantity). Next priority: demo data (Malaysia minimart seed).
- **ASF-2 store locations** (2026-06-26): [[wiki/sources/2026-06-26-store-locations-feature]], [[wiki/concepts/store-locations-feature-asf-2]] — cross-platform store locator; customer `/stores` + mobile 门店 tab; admin/staff CRUD; route collision fix documented.
- **ASF-2 animated splash** (2026-06-26): [[wiki/sources/2026-06-26-pixel2motion-model-match-splash]], [[wiki/concepts/pixel2motion-splash-asf-2]] — Pixel2Motion MODEL MATCH letter cascade on both Expo apps; WebView bundle pipeline documented.
- **ASF-2 Expo customer 仪式感 / motion** (2026-07-17): [[wiki/concepts/expo-customer-ceremony-motion-asf-2]], [[wiki/sources/2026-07-17-expo-customer-ceremony-motion-session-accomplishment]] — ambient + day-to-day bold ceremony after splash (home/Shop/PDP/bag/cart); rare wins deferred.
- **ASF-2 Expo customer beginner guide / App Guide** (2026-07-17): [[wiki/concepts/expo-customer-beginner-guide-asf-2]], [[wiki/sources/2026-07-17-expo-customer-beginner-guide-session-accomplishment]] — Profile hub + first-launch coach marks for absolute beginners / elderly; agent prompts deleted after run.
- **ASF-2 post-purchase claims** (2026-06-26): [[wiki/sources/2026-06-26-post-purchase-claims-module]], [[wiki/concepts/post-purchase-claims-module-asf-2]] — modular `claims` feature (warranty/returns for shoes by default); config-swappable per client; web customer + staff flows.
- **ASF-2 warranty discount credits** (2026-07-09): [[wiki/concepts/warranty-discount-credits-asf-2]], [[wiki/sources/2026-07-09-warranty-discount-credits-design]] — human-verified credit system on top of `claims`; estimate-only tiers, staff approval issues fixed-RM `warranty_credits`, one-click cart redemption; shipped in `asf-2-next`.
- **ASF-2 customer i18n** (2026-07-08): [[wiki/concepts/customer-i18n-asf-2]], [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]] — Expo customer app bilingual (zh-CN/en); Supabase translation tables seeded; Next.js i18n stashed.

## See also

- [[CLAUDE.md]] — full agent rules (ingest, query, lint, logging)
- [[Welcome.md]] — short human-facing entry
