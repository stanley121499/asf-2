# LLM Wiki — idea document (raw source)

> Immutable raw source. The LLM maintains `wiki/` and `index.md`; it does not edit this file.

## Title

LLM Wiki — a pattern for building personal knowledge bases using LLMs.

## Purpose

This document communicates a high-level pattern for copy-paste into an LLM agent. The agent and human collaborate on specifics (structure, tooling, domain).

## Core idea

Most LLM + document workflows resemble **RAG**: upload files, retrieve chunks at query time, generate an answer. The model **re-derives** connections each time; there is **no accumulation**. Subtle questions that require synthesizing many documents force repeated fragment assembly. NotebookLM, ChatGPT file uploads, and many RAG systems behave this way.

**Alternative:** the LLM **incrementally builds and maintains a persistent wiki** — structured, interlinked markdown between the human and raw sources. On new input, the model **reads**, **extracts**, and **integrates** into the wiki: entity pages, topic summaries, explicit contradiction notes, evolving synthesis. Knowledge is **compiled and kept current**, not rebuilt from scratch every query.

**Distinction:** the wiki is a **persistent, compounding artifact**. Cross-references exist before the next question; contradictions can be flagged; synthesis reflects everything ingested so far.

The human rarely authors the wiki; they **curate sources**, **explore**, and **ask questions**. The LLM does summarizing, cross-referencing, filing, and bookkeeping. Practical setup: LLM agent on one side, **Obsidian** on the other — Obsidian as IDE, LLM as maintainer, wiki as codebase.

## Example domains

- Personal: goals, health, psychology, journals, articles, podcasts → structured self-model over time.
- Research: papers and reports over weeks → comprehensive wiki with evolving thesis.
- Reading: per-chapter filing → characters, themes, plot threads (like community fan wikis, but personal).
- Business: Slack, meetings, docs, calls → internal wiki with optional human review.
- Competitive analysis, diligence, trips, courses, hobbies — any long-horizon accumulation.

## Architecture — three layers

1. **Raw sources** — curated, **immutable** documents (articles, papers, images, data). LLM reads; does not modify.
2. **The wiki** — LLM-owned markdown: summaries, entities, concepts, comparisons, overview, synthesis. Human reads; LLM writes.
3. **The schema** — e.g. `CLAUDE.md` / `AGENTS.md`: structure, conventions, workflows for ingest, answer, maintenance. Co-evolved with the human.

## Operations

- **Ingest** — add source to raw collection; LLM reads, discusses takeaways, writes summary page, updates index and entity/concept pages, appends log. One source may touch many pages. Human can supervise per source or batch.
- **Query** — answer from wiki pages with citations; **file** durable answers back into the wiki (not only chat history) so exploration compounds.
- **Lint** — periodic health: contradictions, stale claims, orphans, missing concept pages, missing links, gaps for web search; suggest next sources.

## Indexing and logging

- **`index.md`** — content catalog: links, one-line summaries, optional metadata; organized by category; update on ingest; read first when answering.
- **`log.md`** — append-only chronology (ingests, queries, lint). Consistent heading prefix (e.g. `## [2026-04-02] ingest | Title`) enables simple tooling (`grep`, `tail`).

## Optional CLI tools

At scale, add local search over markdown (e.g. **qmd**: hybrid BM25/vector + optional LLM rerank, CLI and MCP). Simpler custom scripts are fine.

## Tips

- Obsidian Web Clipper for articles → markdown.
- Download images locally (e.g. `raw/assets/`) so models can reference stable files; read text then images separately if needed.
- Graph view for structure; **Marp** for slides; **Dataview** on YAML frontmatter; **git** for history and collaboration.

## Why it works

Bookkeeping (cross-refs, consistency, contradiction tracking) burns humans out; LLMs scale maintenance cheaply. Human focuses on curation, direction, and meaning.

## Historical note

Spiritually related to **Vannevar Bush’s Memex (1945)** — curated personal store with **associative trails**. Bush did not solve who maintains trails; the LLM does.

## Closing

This document is **abstract**: directory layout, schema, page formats, tooling are domain-specific. Pick modules as needed; instantiate with your agent.
