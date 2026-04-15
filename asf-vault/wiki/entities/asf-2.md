---
title: "ASF-2 (project)"
type: entity
updated: 2026-04-13
sources: 71
tags: [project, ecommerce, supabase, react, nextjs, mobile, stripe, delyva]
---

# ASF-2 (project)

**ASF-2** is a full-stack **e-commerce and social media management** platform with separate **admin** and **customer** experiences. As of 2026-04-13 the active codebase is `asf-2-next` (Next.js 14 App Router). The original CRA app at `asf-2/src` is frozen as reference.

## Current Stack

- **Web app:** Next.js 14 App Router (`asf-2-next`), TypeScript, Tailwind, Flowbite React, `expo-router`-style file routing
- **Backend:** Next.js API Route Handlers (`app/api/`) — server-side Node.js on Vercel. **No separate Express server.**
- **Data:** **Supabase** (PostgreSQL, Auth, Storage, Realtime) — ~42 tables
- **State:** **35+** React Context providers ([[wiki/concepts/context-provider-architecture-asf-2]])
- **Payments:** Stripe (integration planned — API routes not yet built as of 2026-04-13)
- **Delivery:** Delyva (Malaysian multi-courier aggregator — integration planned)
- **Mobile (planned):** Two Expo + React Native apps sharing the same Supabase backend and Next.js API routes

## Active Codebases

| Path | Purpose | Status |
|---|---|---|
| `asf-2-next/` | Next.js web app — admin panel + customer storefront + API backend | **Active** |
| `asf-2/src/` | Original CRA/Vite app | Frozen reference |
| `asf-staff-app/` (planned) | Staff/boss mobile app (Expo) | Not started |
| `asf-customer-app/` (planned) | Customer mobile app (Expo) | Not started |

## Documentation corpus

- **Hub:** [docs/README.md](../../raw/sources/docs/README.md) — doc index (note: some linked module files absent from disk per [[wiki/concepts/asf-2-documentation-index-gaps]])
- **Batch ingest 2026-04-09:** [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — 66 docs files

## Production readiness (2026-04-13 assessment)

Full analysis in [[wiki/concepts/production-readiness-asf-2]].

**Working:** product browsing, wishlist, cart, admin (products/stock/posts/orders), auth  
**Broken/mock:** checkout (mock), analytics (hardcoded), promotions (not migrated), notifications (mock), dashboard (nav-only)  
**Missing:** customer order history, password reset, ship-order UI, RBAC middleware, delivery tracking

The **immediate execution plan** ([[wiki/sources/2026-04-13-immediate-execution-plan]]) covers 12 steps (~15 days) to reach full functionality.

## High-signal problem areas (pre-Next.js migration)

- **Customer product page (CRA):** Variants, gallery, stock broken — **fixed in Next.js app**
- **Async forEach bug:** Still present in `ProductContext.tsx` in Next.js app
- **Performance:** Multiple audits and fix rounds documented in raw corpus
- **Soft delete:** Not implemented — FK errors on product deletion

## Related

- [[wiki/concepts/context-provider-architecture-asf-2]]
- [[wiki/concepts/asf-2-documentation-index-gaps]]
- [[wiki/concepts/production-readiness-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/batch-2026-04-09-docs-and-root-readme]]
- [[wiki/sources/2026-04-13-production-roadmap]]
- [[wiki/sources/2026-04-13-immediate-execution-plan]]
- [[wiki/sources/2026-04-13-user-flow-audit]]
