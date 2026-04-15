---
title: "Context provider architecture (ASF-2)"
type: concept
updated: 2026-04-09
sources: 2
tags: [react, context, architecture, asf-2]
---

# Context provider architecture (ASF-2)

ASF-2 uses a **Context-heavy** frontend: `App.tsx` composes **35+** providers (ProviderComposer pattern) covering auth, catalog, products, posts, community, orders, cart, and more.

## Implications

- **Pros:** Clear per-domain state boundaries; matches large admin surface area.
- **Cons:** Documented **re-render** and coupling risks; deep provider trees complicate performance tuning (see [PERFORMANCE_ISSUES.md](../../raw/sources/docs/PERFORMANCE_ISSUES.md), [CONTEXTS.md](../../raw/sources/docs/CONTEXTS.md)).

## Sources

- [ARCHITECTURE.md](../../raw/sources/docs/ARCHITECTURE.md)
- [CONTEXTS.md](../../raw/sources/docs/CONTEXTS.md)

## Related

- [[wiki/entities/asf-2]]
