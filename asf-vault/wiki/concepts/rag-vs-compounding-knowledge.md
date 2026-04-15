---
title: "RAG vs compounding wiki knowledge"
type: concept
updated: 2026-04-09
sources: 1
tags: [rag, knowledge-base, llm-wiki]
---

# RAG vs compounding wiki knowledge

## Typical RAG-style behavior

In many setups (file uploads, NotebookLM-style tools, classic RAG), the system **indexes** documents and, at query time, **retrieves relevant fragments** and **generates an answer**. Each question can require **re-finding and re-assembling** evidence. Cross-document synthesis is repeated work; **structure does not necessarily persist** in the artifact layer.

## LLM Wiki behavior

Here, the LLM **writes forward**: it merges new material into **stable pages** with **wikilinks**, updates summaries, and records **contradictions** or open questions. The next query can **start from compiled structure** ([[index.md]], hub pages) rather than only from raw chunk retrieval.

## Complement, not always replacement

Vector search and chunk retrieval can still be added later for very large wikis; the **index-first** approach scales to moderate size without extra infra. The design choice is where the **canonical synthesis** lives: primarily in **curated markdown pages**, not only in ephemeral chat.

## Related

- [[wiki/concepts/llm-wiki-pattern]]
- [[wiki/sources/llm-wiki-idea]]
