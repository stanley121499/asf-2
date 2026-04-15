---
title: "Source summary: LLM Wiki idea document"
type: source
updated: 2026-04-09
sources: 1
tags: [ingest, meta, llm-wiki]
raw: "raw/sources/llm-wiki-idea.md"
---

# Source: LLM Wiki idea document

**Raw path:** [llm-wiki-idea.md](../../raw/sources/llm-wiki-idea.md)

## One-line summary

Pattern for a **persistent, LLM-maintained markdown wiki** between curated immutable sources and the human, emphasizing **compounding structure** instead of only per-query RAG retrieval.

## Key claims

- RAG-heavy workflows **re-derive** connections each time; a maintained wiki **stores** cross-references, synthesis, and contradiction notes **across sessions**.
- Three layers: **raw** (immutable), **wiki** (LLM-owned), **schema** (e.g. [[CLAUDE.md]]).
- Operations: **ingest** (multi-page updates), **query** (cite and optionally file answers), **lint** (health and gaps).
- **index.md** supports browsing and agent navigation; **log.md** is append-only operational history.
- Obsidian + git + optional search (e.g. qmd) are practical adjuncts; Memex is cited as historical kin.

## Integrated wiki pages

- [[wiki/concepts/llm-wiki-pattern]] — consolidated pattern definition
- [[wiki/concepts/rag-vs-compounding-knowledge]] — contrast with pure retrieval
- [[wiki/00-overview]] — vault orientation

## Open questions / follow-ups

- Domain-specific folder taxonomy beyond `concepts/`, `entities/`, `sources/`, `syntheses/`.
- Whether to add embedding search or MCP tools as the page count grows.
- Team workflows: human review gates for sensitive ingests (not specified in source).

## Contradictions / open tension

- None vs other vault pages yet; first source only.
