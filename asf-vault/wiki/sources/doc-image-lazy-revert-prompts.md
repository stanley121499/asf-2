---
title: "Source: Image Fix — Revert to Native Lazy Loading"
type: source
updated: 2026-04-09
tags: [ingest, asf-2, raw-doc]
raw: "raw/sources/docs/IMAGE_LAZY_REVERT_PROMPTS.md"
---

# Source: Image Fix — Revert to Native Lazy Loading

**Raw:** [IMAGE_LAZY_REVERT_PROMPTS.md](../../raw/sources/docs/IMAGE_LAZY_REVERT_PROMPTS.md)

## Summary

**Goal:** Remove all `<LazyImage>` component usage and replace with plain `<img>` tags that have `loading="lazy"` and `decoding="async"`. This fixes the broken card layouts caused by the LazyImage wrapper div interfering with container sizing. **What to KEEP from previous agent runs:** - The `useMemo` media Map opti...

## Document outline (first headings)

- Task 1 — Revert Landing Components and Shared Card Components
- Task 2 — Revert `Highlights.tsx` and `home.tsx`
- Task 3 — Revert Stock Pages and Analytics Components
- Task 4 — Revert Category Page, Landing Sub-components, and Support Pages

## Key claims / scope

- This page is the **per-source** wiki entry for one mirrored doc; the authoritative text is always the raw file.
- For cross-doc themes (performance rounds, redesign prompts), use [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] and [[wiki/entities/asf-2]].

## Related

- [[wiki/entities/asf-2]]
- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — corpus overview
- Related theme: performance / media (see also raw PERFORMANCE_ISSUES.md)

## Open questions

- _(Fill after deep read or when using this doc to drive work.)_

