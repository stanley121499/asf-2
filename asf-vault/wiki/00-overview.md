---
title: "asf-vault overview"
type: overview
updated: 2026-04-13
sources: 72
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

## See also

- [[CLAUDE.md]] — full agent rules (ingest, query, lint, logging)
- [[Welcome.md]] — short human-facing entry
