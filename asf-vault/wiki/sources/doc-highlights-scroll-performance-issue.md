---
title: "Source: Highlights Page — Scroll & Image Load Performance Issue"
type: source
updated: 2026-04-09
tags: [ingest, asf-2, raw-doc]
raw: "raw/sources/docs/HIGHLIGHTS_SCROLL_PERFORMANCE_ISSUE.md"
---

# Source: Highlights Page — Scroll & Image Load Performance Issue

**Raw:** [HIGHLIGHTS_SCROLL_PERFORMANCE_ISSUE.md](../../raw/sources/docs/HIGHLIGHTS_SCROLL_PERFORMANCE_ISSUE.md)

## Summary

**Date:** March 2026 **Reported By:** User (customer-facing) **Symptom:** App feels laggy, scrolling is choppy, images take a long time to appear — even with lazy loading already applied

## Document outline (first headings)

- Executive Summary
- Problem 1 — Image URLs Are Not Available on First Render (Data Architecture)
- Problem 2 — Extra Re-Render Cycle from `useEffect` Misuse
- Problem 3 — No Smart Preloading Strategy
- Problem 4 — Horizontal Carousel Has No Scroll UX Polish
- Proposed Fix Strategy
- Files to Be Created or Modified
- Expected Outcome After Fixes

## Key claims / scope

- This page is the **per-source** wiki entry for one mirrored doc; the authoritative text is always the raw file.
- For cross-doc themes (performance rounds, redesign prompts), use [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] and [[wiki/entities/asf-2]].

## Related

- [[wiki/entities/asf-2]]
- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — corpus overview
- Related theme: performance / media (see also raw PERFORMANCE_ISSUES.md)

## Open questions

- _(Fill after deep read or when using this doc to drive work.)_

