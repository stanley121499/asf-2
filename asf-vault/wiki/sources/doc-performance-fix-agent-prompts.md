---
title: "Source: Performance Fix — Agent Prompts"
type: source
updated: 2026-04-09
tags: [ingest, asf-2, raw-doc]
raw: "raw/sources/docs/PERFORMANCE_FIX_AGENT_PROMPTS.md"
---

# Source: Performance Fix — Agent Prompts

**Raw:** [PERFORMANCE_FIX_AGENT_PROMPTS.md](../../raw/sources/docs/PERFORMANCE_FIX_AGENT_PROMPTS.md)

## Summary

**Reference**: `docs/PERFORMANCE_AUDIT_2026.md` **How to use**: Copy one task block at a time and pass it to the model (e.g., Claude Sonnet). Each task is scoped to a small set of files so the model can read them fully and apply changes without hitting context limits. Complete tasks in order since some build on each...

## Document outline (first headings)

- Task 1 — Fix Critical Correctness Bugs (Quick Wins)
- Bug 1: ProductContext realtime UPDATE wipes computed fields
- Bug 2: ConfirmDeleteModal rendered inside the product card loop
- Code quality: Remove console.log calls
- Rules
- Task 2 — Fix OrderContext: Memoization + Stale Closure
- Issues to fix
- Additional rules
- Task 3 — Fix UserContext N+1 Query + PaymentContext All-Users Fetch
- Fix 1: UserContext N+1 query

## Key claims / scope

- This page is the **per-source** wiki entry for one mirrored doc; the authoritative text is always the raw file.
- For cross-doc themes (performance rounds, redesign prompts), use [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] and [[wiki/entities/asf-2]].

## Related

- [[wiki/entities/asf-2]]
- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — corpus overview
- Related theme: performance / media (see also raw PERFORMANCE_ISSUES.md)

## Open questions

- _(Fill after deep read or when using this doc to drive work.)_

