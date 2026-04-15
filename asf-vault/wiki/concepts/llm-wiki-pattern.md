---
title: "LLM Wiki pattern"
type: concept
updated: 2026-04-09
sources: 1
tags: [llm-wiki, architecture, obsidian]
---

# LLM Wiki pattern

A workflow where an LLM **maintains a persistent wiki** (interlinked markdown) instead of only **retrieving chunks** at question time. The wiki **accumulates** structure: entity pages, summaries, explicit tensions between sources, and reusable syntheses.

## Three layers

1. **Raw sources** — curated, immutable inputs (`raw/sources/`, `raw/assets/`).
2. **Wiki** — LLM-written pages under `wiki/` (and updates to [[index.md]] / [[log.md]]).
3. **Schema** — [[CLAUDE.md]] defines structure, workflows, and constraints.

## Core operations

- **Ingest** — integrate a new source into multiple wiki pages; update the catalog.
- **Query** — read [[index.md]], follow wikilinks, cite sources; optionally file answers as new pages.
- **Lint** — audit contradictions, staleness, orphans, missing concepts, gaps.

## Human vs LLM roles

- **Human:** curate raw material, steer emphasis, ask questions, interpret meaning.
- **LLM:** summarize, cross-link, file pages, track contradictions, keep the index and log current.

## Practical stack

Obsidian for browsing, graph view, and optional plugins (Marp, Dataview); git for history; optional local search when the vault grows.

## Historical connection

The pattern echoes **Vannevar Bush’s Memex** — associative trails through a personal knowledge store — with the LLM supplying the maintenance labor Bush left unspecified. See `raw/sources/llm-wiki-idea.md`.

## Related

- [[wiki/concepts/rag-vs-compounding-knowledge]]
- [[wiki/sources/llm-wiki-idea]]
