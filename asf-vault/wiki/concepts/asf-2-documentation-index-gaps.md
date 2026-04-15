---
title: "ASF-2 docs index vs files on disk"
type: concept
updated: 2026-04-09
sources: 1
tags: [documentation, drift, asf-2]
---

# ASF-2 documentation index vs files on disk

[docs/README.md](../../raw/sources/docs/README.md) links to several **module** documents (for example `PRODUCTS_MODULE.md`, `STOCK_MODULE.md`, `ORDERS_MODULE.md`, `POSTS_MODULE.md`, `COMMUNITY_MODULE.md`) that **do not appear** in the copied `raw/sources/docs/` tree as of the 2026-04-09 ingest.

## Interpretation

- The **index is partially aspirational or stale** relative to the repo; rely on files that exist under `raw/sources/docs/` or the codebase for ground truth.
- When those modules are written later, re-ingest the new files and update this note.

## Related

- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]]
- [[wiki/entities/asf-2]]
