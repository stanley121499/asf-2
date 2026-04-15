---
title: "Source: Customer App — Fix Prompts Round 6 (March 2026)"
type: source
updated: 2026-04-09
tags: [ingest, asf-2, raw-doc]
raw: "raw/sources/docs/CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND6.md"
---

# Source: Customer App — Fix Prompts Round 6 (March 2026)

**Raw:** [CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND6.md](../../raw/sources/docs/CUSTOMER_REDESIGN_BUGFIX_PROMPTS_2026_ROUND6.md)

## Summary

These are the remaining agent tasks needed after the Round 5 direct code patches. The following bugs were directly fixed in code (run `git diff` to verify): - `RewardsClient.tsx` now has `<BottomNavbar />` - `bottom-nav.tsx` now uses `<button onClick={() => router.push(href)}>` for all 5 tabs (Flutter WebView fix)

## Document outline (first headings)

- AGENT 1 — Fix support-chat: Don't auto-redirect guests to sign-in
- AGENT 2 — Flutter WebView: Remove all fullscreen API calls to avoid crashes
- AGENT 3 — Flutter WebView: Ensure viewport and safe area is correctly set
- AGENT 4 — Final TypeScript + verification

## Key claims / scope

- This page is the **per-source** wiki entry for one mirrored doc; the authoritative text is always the raw file.
- For cross-doc themes (performance rounds, redesign prompts), use [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] and [[wiki/entities/asf-2]].

## Related

- [[wiki/entities/asf-2]]
- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — corpus overview
- Related theme: customer UX / redesign program

## Open questions

- _(Fill after deep read or when using this doc to drive work.)_

