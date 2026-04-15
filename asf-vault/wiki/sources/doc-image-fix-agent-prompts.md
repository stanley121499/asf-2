---
title: "Source: Image Performance Fix — Agent Prompts"
type: source
updated: 2026-04-09
tags: [ingest, asf-2, raw-doc]
raw: "raw/sources/docs/IMAGE_FIX_AGENT_PROMPTS.md"
---

# Source: Image Performance Fix — Agent Prompts

**Raw:** [IMAGE_FIX_AGENT_PROMPTS.md](../../raw/sources/docs/IMAGE_FIX_AGENT_PROMPTS.md)

## Summary

**Reference document:** `docs/IMAGE_PERFORMANCE_AUDIT.md` **Project type:** Create React App (React + TypeScript + Tailwind CSS + Supabase) **Note:** The project is on Supabase Free plan — do NOT use Supabase image transformation URLs (`/storage/v1/render/image/...`). All fixes are front-end only.

## Document outline (first headings)

- Task 1 — Create the Reusable `<LazyImage>` Component
- Task 2 — Apply `LazyImage` to Landing Page Components: `HomeHighlightsCard`, `CategoryPreviewSidebar`, `Cart`, `Wishlist`
- Task 3 — Apply `LazyImage` to `Highlights.tsx` and `home.tsx` + Pre-build Media Maps
- Task 4 — Apply `LazyImage` to Stock Pages and Analytics Components
- Task 5 — Apply `LazyImage` to Category Page, Landing Sub-components, and Support Pages
- Task 6 — Fix Hardcoded Template Components and Add DNS Preconnect to `index.html`
- Verification Checklist

## Key claims / scope

- This page is the **per-source** wiki entry for one mirrored doc; the authoritative text is always the raw file.
- For cross-doc themes (performance rounds, redesign prompts), use [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] and [[wiki/entities/asf-2]].

## Related

- [[wiki/entities/asf-2]]
- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — corpus overview
- Related theme: performance / media (see also raw PERFORMANCE_ISSUES.md)

## Open questions

- _(Fill after deep read or when using this doc to drive work.)_

