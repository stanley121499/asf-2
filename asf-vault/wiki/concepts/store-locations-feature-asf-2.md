---
title: "Store locations feature (ASF-2)"
type: concept
updated: 2026-06-26
sources: 1
tags: [store-locations, feature-flags, routing, supabase, asf-2]
---

# Store locations feature (ASF-2)

Pattern and conventions for the **physical store locator** module added 2026-06-26. Primary source: [[wiki/sources/2026-06-26-store-locations-feature]].

## Purpose

Let customers discover ASF retail stores in Malaysian malls; let owner/manager staff maintain locations from web admin or staff mobile app.

## V1 UX

- Store cards: name, mall, address, phone, opening hours
- External map links (Google Maps, Waze) — no embedded map
- Customer mobile: 4th bottom tab **门店** replaces wishlist tab (heart wishlist on products unchanged)
- Customer web: bottom nav 门店 → **`/stores`**

## Data model

Table `public.store_locations` — soft delete via `deleted_at`; no `updated_at` (aligned with `promotions`). Sort public lists by `sort_order` asc, then `name` asc.

RLS: anon/authenticated SELECT only `active = true AND deleted_at IS NULL`.

## Access patterns (do not mix)

| Consumer | Read | Write |
|----------|------|-------|
| Customer mobile | Supabase anon + RLS | — |
| Customer web | `StoreLocationContext` → `/api/store-locations` | — |
| Web admin | Same context | API POST/PATCH/DELETE |
| Staff mobile | `apiFetch` → API | Same |

Staff catalog data uses direct Supabase (`RangeContext`); **management features** (promotions, store locations) use **Next.js API + service role**.

## Routing convention

Admin CRUD lives at `/store-locations`. Customer discovery at **`/stores`** because Next.js route groups `(customer)` do not add a path segment — placing both under `store-locations` caused a fatal route collision.

## Feature flag

Key: `store_locations` in `feature_flags`. All surfaces gate UI via `isEnabled("store_locations")`.

## Known gaps

- Production Vercel not yet serving new routes (staff `EXPO_PUBLIC_API_URL` → 404 until deploy)
- Tables not in `supabase_realtime` publication — initial fetch works; live updates need refresh

## Related

- [[wiki/entities/asf-2]]
- [[wiki/sources/2026-06-26-store-locations-feature]]
- [[wiki/concepts/context-provider-architecture-asf-2]]
