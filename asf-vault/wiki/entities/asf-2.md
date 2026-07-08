---
title: "ASF-2 (project)"
type: entity
updated: 2026-07-08
sources: 81
tags: [project, ecommerce, supabase, react, nextjs, mobile, stripe, delyva, i18n]
---

# ASF-2 (project)

**ASF-2** is a full-stack **e-commerce and social media management** platform with separate **admin** and **customer** experiences. As of 2026-07-08, the **Expo customer app** supports bilingual UI (zh-CN default + English) with Supabase content translation tables; both Expo mobile apps remain built with Pixel2Motion splash; Next.js includes store locations and claims modules.

## Current Stack

- **Web app:** Next.js 14 App Router (`asf-2-next`), TypeScript, Tailwind, Flowbite React
- **Backend:** Next.js API Route Handlers (`app/api/`) — server-side Node.js on Vercel. **No separate Express server.**
- **Data:** **Supabase** (PostgreSQL, Auth, Storage, Realtime) — includes `store_locations`, `feature_flags`
- **State:** **35+** React Context providers ([[wiki/concepts/context-provider-architecture-asf-2]])
- **Payments:** Stripe — integrated (Next.js API + native `@stripe/stripe-react-native` in customer mobile app)
- **Delivery:** Delyva (Malaysian multi-courier aggregator — integrated in API)
- **Mobile:** Two Expo SDK 54 + React Native apps, expo-router v6, NativeWind

## Active Codebases

| Path | Purpose | Status |
|---|---|---|
| `asf-2-next/` | Next.js web app — admin panel + customer storefront + API backend | **Active — functionally complete** |
| `asf-staff-app/` | Staff/boss mobile app (Expo + RN) | **Built — MODEL MATCH splash intro** |
| `asf-customer-app/` | Customer mobile app (Expo + RN) | **Built — APK deployed; MODEL MATCH splash; bilingual i18n (zh-CN/en) shipped 2026-07-08** |
| `asf-2/src/` | Original CRA/Vite app | Frozen reference |

## Documentation corpus

- **Hub:** [docs/README.md](../../raw/sources/docs/README.md) — doc index (note: some linked module files absent from disk per [[wiki/concepts/asf-2-documentation-index-gaps]])
- **Batch ingest 2026-04-09:** [[wiki/sources/batch-2026-04-09-docs-and-root-readme]] — 66 docs files

## Production readiness (2026-04-25 assessment)

Both mobile apps are functional. Web app 12-step execution plan completed.

**Web app (asf-2-next):** checkout with Stripe ✅, analytics ✅, RBAC middleware ✅, Delyva delivery ✅, promotions ✅, notifications ✅  
**Staff mobile app:** all CRUD screens built, chat (WhatsApp-style) ✅, role-based tabs ✅, analytics ✅  
**Customer mobile app:** full UI match to Next.js web, Stripe native PaymentSheet ✅, APK distributed ✅

**Remaining:** production Vercel deploy for new routes (store locations API), EAS iOS build for staff app

**Store locations (2026-06-26):** `store_locations` table + 10 Malaysian mall seeds; customer web `/stores`, admin `/store-locations`; customer mobile 门店 tab; staff dashboard CRUD for owner/manager. See [[wiki/concepts/store-locations-feature-asf-2]].

**Animated splash (2026-06-26):** Pixel2Motion pipeline for Simon MODEL MATCH logo; Variation 7 letter cascade embedded via WebView on both mobile apps. Motion SOT: `asf-customer-app/assets/splash/pixel2motion-output/`. See [[wiki/concepts/pixel2motion-splash-asf-2]].

**Post-purchase claims (2026-06-26):** Reusable `claims` module (feature flag + config-driven policy); shoe-store default; customer order-item entry + staff queue. SQL: `asf-2-next/docs/sql/step_11_claims.sql`. See [[wiki/concepts/post-purchase-claims-module-asf-2]].

**Customer i18n (2026-07-08):** Expo `asf-customer-app` — AsyncStorage `asf_locale`, JSON `t()`, Profile language picker, `ContentTranslationContext` overlays for six `*_translations` tables (seeded for live minimart catalog on `gswszoljvafugtdikimn`). Expo ProductContext must **not** use locale RPC. Next.js UI i18n was prototyped then **git-stashed**. SQL: `docs/sql/CUSTOMER_I18N_*.sql`. See [[wiki/concepts/customer-i18n-asf-2]], [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]].

See [[wiki/sources/2026-04-25-mobile-apps-progress]] for full mobile app details and schema corrections.

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
- [[wiki/sources/2026-04-25-mobile-apps-progress]]
- [[wiki/sources/2026-06-26-store-locations-feature]]
- [[wiki/concepts/store-locations-feature-asf-2]]
- [[wiki/sources/2026-06-26-pixel2motion-model-match-splash]]
- [[wiki/concepts/pixel2motion-splash-asf-2]]
- [[wiki/sources/2026-06-26-post-purchase-claims-module]]
- [[wiki/concepts/post-purchase-claims-module-asf-2]]
- [[wiki/concepts/customer-i18n-asf-2]]
- [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]]
