---
title: "Store Locations Feature — ASF-2 (June 26, 2026)"
type: source
updated: 2026-06-26
tags: [store-locations, feature-flags, supabase, asf-2, mobile, nextjs]
---

# Store Locations Feature — ASF-2 (June 26, 2026)

**Raw source**: [raw/sources/2026-06-26-store-locations-feature.md](../../raw/sources/2026-06-26-store-locations-feature.md)

## Summary

Cross-platform **physical store locator** shipped across ASF-2: Supabase table + RLS + feature flag, 10 seeded Malaysian mall locations, customer discovery on web (`/stores`) and mobile (4th tab 门店 replaces wishlist), admin CRUD on web (`/store-locations`), and staff mobile CRUD via Next.js API (`apiFetch` pattern).

V1 uses store cards with address, phone, hours, and external Google Maps / Waze links — no embedded maps.

## Key claims

- **Database**: `store_locations` table with soft delete (`deleted_at` + `active = false`). Public read RLS: active and non-deleted only. Applied remotely via Supabase MCP after `feature_flags` prerequisite migration.
- **Feature flag**: `store_locations` key in `feature_flags`; gated in all three apps.
- **Data access split**:
  - Customer mobile: direct Supabase read (RLS)
  - Customer web + admin web + staff mobile writes: Next.js `/api/store-locations` (service role server-side)
  - Staff mobile **must** use `apiFetch` like `PromotionContext`, not direct Supabase
- **Route conflict fixed**: `(customer)/store-locations` and `store-locations` both mapped to `/store-locations` → HTTP 500. Customer page moved to **`/stores`**; admin stays `/store-locations`.
- **Testing**: `scripts/test-store-locations.mjs` 18/18 DB checks; local API CRUD verified; pages 200 after fix.
- **Deploy gap**: `asf-2.vercel.app` returned 404 for new routes — staff mobile (`EXPO_PUBLIC_API_URL`) needs deploy or local API URL.

## Outline

1. Problem, V1 scope, out-of-scope
2. Database schema, RLS, seeds, `feature_flags` dependency
3. Architecture per surface (web admin, customer web/mobile, staff mobile)
4. Route conflict bug and `/stores` fix
5. Types, verification, known gaps (realtime publication, production deploy)
6. File index and manual test checklist

## Open questions

- When to add `store_locations` and `feature_flags` to `supabase_realtime` publication for live updates?
- Production deploy timeline for Vercel so staff mobile CRUD works against `EXPO_PUBLIC_API_URL`.
- Whether customer web URL `/stores` should be renamed (e.g. `/locations`) for consistency with mobile tab name.

## Wikilinks

- [[wiki/entities/asf-2]]
- [[wiki/concepts/store-locations-feature-asf-2]]
- [[wiki/concepts/context-provider-architecture-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-04-25-mobile-apps-progress]]
