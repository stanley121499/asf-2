# Store Locations Feature — ASF-2 (June 26, 2026)

**Date**: 2026-06-26  
**Context**: Implementation of a cross-platform physical store locator for ASF-2. Covers database schema, feature flags, web admin CRUD, customer discovery surfaces (web + mobile), staff mobile management, testing, and deployment notes.

---

## 1. Problem and scope

ASF-2 needed a way for customers to find physical retail stores in Malaysian shopping malls, and for staff/owners to manage those locations without a separate backend.

### V1 decisions (confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Customer mobile 4th tab | Replace **wishlist** with **门店 (locations)** | User instruction; wishlist heart icons on product cards remain |
| Customer web bottom nav | Same — 4th item becomes 门店 | Match mobile UX |
| Map UX | External **Google Maps** + **Waze** links only | No embedded map/pins in v1 |
| Management | Next.js admin + staff mobile CRUD | Consistent with promotions pattern |
| Soft delete | `deleted_at` + `active = false` on delete | Matches promotions and other management tables |

### Out of scope (v1)

- Embedded maps, geolocation, “nearest store”
- Realtime live updates (tables not yet in `supabase_realtime` publication)
- Production Vercel deploy (code exists locally; `asf-2.vercel.app` returned 404 for new routes at test time)

---

## 2. Database

### 2.1 Prerequisites

The `feature_flags` table did **not** exist on remote ASF Supabase before this work. Two migrations were applied (via Supabase MCP, project `gswszoljvafugtdikimn`):

1. `docs/sql/FEATURE_FLAGS_MIGRATION.sql` — creates `feature_flags`, RLS read-all for anon/authenticated, seeds all platform flags including `store_locations`
2. `docs/sql/STORE_LOCATIONS_MIGRATION.sql` — creates `store_locations`, RLS, seeds 10 Malaysian malls

Repo copies also live at:

- `docs/sql/STORE_LOCATIONS_MIGRATION.sql`
- `supabase/migrations/20260626160000_store_locations.sql`

### 2.2 Table: `public.store_locations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` |
| `name` | TEXT NOT NULL | Store display name (e.g. "ASF Pavilion KL") |
| `mall_name` | TEXT NOT NULL | Mall name |
| `address_line_1` | TEXT NOT NULL | |
| `address_line_2` | TEXT | Optional |
| `city`, `state` | TEXT NOT NULL | |
| `postcode` | TEXT | Optional |
| `country` | TEXT NOT NULL | Default `'Malaysia'` |
| `phone`, `opening_hours` | TEXT | Optional |
| `latitude`, `longitude` | NUMERIC | Optional (reserved for future maps) |
| `google_maps_url`, `waze_url` | TEXT | Validated as URLs on API |
| `sort_order` | INTEGER NOT NULL | Default 0; public lists sort asc |
| `active` | BOOLEAN NOT NULL | Default true |
| `created_at` | TIMESTAMPTZ NOT NULL | |
| `deleted_at` | TIMESTAMPTZ | Soft delete; no `updated_at` (matches promotions) |

Partial index: `store_locations_active_idx` on `(sort_order, name)` where `deleted_at IS NULL AND active = TRUE`.

### 2.3 RLS policies

| Policy | Role | Operation | Rule |
|--------|------|-----------|------|
| `store_locations_public_read` | anon, authenticated | SELECT | `active = TRUE AND deleted_at IS NULL` |
| `store_locations_authenticated_insert` | authenticated | INSERT | `WITH CHECK (true)` |
| `store_locations_authenticated_update` | authenticated | UPDATE | `USING (true)` |

Writes from admin/staff apps go through Next.js API routes using the **service role key**, which bypasses RLS. Policies are defence-in-depth.

### 2.4 Feature flag

- Key: `store_locations`
- Seeded in `feature_flags` with `enabled = true` by default
- Registered in all three apps' `FeatureFlagsContext` `FEATURE_KEYS` arrays

### 2.5 Seed data (10 Malaysian malls)

Pavilion KL, Mid Valley Megamall, The Gardens Mall, Sunway Pyramid, 1 Utama, IOI City Mall, Suria KLCC, Queensbay Mall, Gurney Plaza, Imago Shopping Mall KK — each with phone, hours, Google Maps and Waze URLs, `sort_order` 1–10.

---

## 3. Architecture by surface

### 3.1 Data access patterns (important)

ASF-2 uses **two different patterns** depending on surface:

| Surface | Read | Write | Why |
|---------|------|-------|-----|
| **Customer mobile** | Direct Supabase (anon key + RLS) | None | Same as wishlist; RLS filters active rows |
| **Customer web** | `fetch("/api/store-locations")` via context | None | Uses `SlimLandingContextBundle` + `StoreLocationProvider` |
| **Web admin** | Same API context | POST/PATCH/DELETE via API | Service role on server; Zod validation |
| **Staff mobile** | `apiFetch("/api/store-locations")` | Same | **Must** follow `PromotionContext` pattern, not direct Supabase |

Staff mobile `EXPO_PUBLIC_API_URL` points to `https://asf-2.vercel.app` — staff CRUD **requires** deploying `asf-2-next` with the new API routes, or pointing the env var at a local dev machine.

### 3.2 Next.js API (`asf-2-next`)

| Route | Methods | Behaviour |
|-------|---------|-----------|
| `/api/store-locations` | GET, POST | List non-deleted; create with Zod |
| `/api/store-locations/[id]` | GET, PATCH, DELETE | Single row; soft-delete sets `deleted_at` + `active = false` |

Schemas: `storeLocationCreateBodySchema`, `storeLocationPatchBodySchema`, `storeLocationIdParamSchema` in `src/app/api/_lib/apiSchemas.ts`.

Context: `src/context/StoreLocationContext.tsx` — mirrors `PromotionContext` (fetch API, no realtime).

Route bundles (`src/context/RouteContextBundles.tsx`):

- `FullAdminContextBundle` — admin CRUD pages
- `SlimLandingContextBundle` — customer page, gated with `<Gate flag="store_locations" Provider={StoreLocationProvider}>`

### 3.3 Web admin pages

| Route | File | Purpose |
|-------|------|---------|
| `/store-locations` | `src/app/store-locations/page.tsx` | List, search, active badge |
| `/store-locations/create` | `src/app/store-locations/create/page.tsx` | Create form |
| `/store-locations/[id]` | `src/app/store-locations/[id]/page.tsx` | Edit + soft-delete |

Sidebar entry in `src/components/sidebar.tsx`, gated by `isEnabled("store_locations")`, icon `HiOutlineLocationMarker`.

### 3.4 Customer web

| Route | File | Notes |
|-------|------|-------|
| **`/stores`** | `src/app/(customer)/stores/page.tsx` | Customer discovery (see §4 route conflict) |
| | `src/app/(customer)/stores/_components/StoreLocationsClient.tsx` | Cards: mall, address, phone, hours, map links |

Bottom nav (`src/components/home/bottom-nav.tsx`): 4th item `门店` → **`/stores`** (not `/store-locations`).

Wishlist page `/wishlist` remains reachable by direct URL but is no longer in bottom nav.

### 3.5 Customer mobile (`asf-customer-app`)

| Item | Detail |
|------|--------|
| Context | `context/StoreLocationContext.tsx` — read-only Supabase + realtime subscription |
| Tab | `app/(tabs)/locations.tsx` replaces deleted `wishlist.tsx` |
| Layout | `app/(tabs)/_layout.tsx` — `name="locations"`, title 门店, icon `location-outline`, gated by flag |
| Bundle | `context/RouteContextBundle.tsx` — `Gate flag="store_locations"` |

### 3.6 Staff mobile (`asf-staff-app`)

| Item | Detail |
|------|--------|
| Context | `context/StoreLocationContext.tsx` — `apiFetch` to Next.js API |
| Bundle | `context/AdminContextBundle.tsx` — sibling of `PromotionProvider` |
| Screens | `app/(app)/locations/index.tsx`, `create.tsx`, `[id].tsx` |
| Dashboard | `app/(app)/(tabs)/dashboard/index.tsx` — `locations` action for **owner** and **manager** only |

---

## 4. Route conflict (bug found during testing)

### Problem

Initial implementation placed customer page at `src/app/(customer)/store-locations/page.tsx` and admin at `src/app/store-locations/page.tsx`.

Next.js route groups like `(customer)` **do not add a URL segment**. Both resolved to `/store-locations`, causing:

> You cannot have two parallel pages that resolve to the same path.

All affected routes returned **HTTP 500**.

### Fix

Follow existing repo convention (customer routes use distinct names from admin, e.g. `order-details` vs `orders`):

- **Customer discovery** → `/stores` under `(customer)/stores/`
- **Admin CRUD** → `/store-locations` (unchanged)
- Bottom nav updated to `/stores`

---

## 5. TypeScript types

`store_locations` and `feature_flags` table types were added to all three projects (manual insert before regeneration):

- `asf-2-next/src/database.types.ts`
- `asf-customer-app/database.types.ts`
- `asf-staff-app/database.types.ts`

Regenerate after schema changes:

```bash
npx supabase gen types typescript --project-id gswszoljvafugtdikimn
```

---

## 6. Verification (2026-06-26)

### 6.1 Database integration test

Script: `asf-2-next/scripts/test-store-locations.mjs` — **18/18 passed**

- Feature flag readable and enabled
- 10 seeded stores visible to anon
- Sort order + map URLs present
- Create → visible to anon
- Deactivate → hidden by RLS
- Soft-delete → excluded from management list
- Cleanup restores count to 10

### 6.2 Local dev server API (after route fix)

| Endpoint | Result |
|----------|--------|
| GET `/api/store-locations` | 200 — 10 stores |
| POST create | 200 |
| PATCH update | 200 |
| DELETE soft | 200 — `deleted_at` set |
| POST `{}` invalid | 400 — Zod validation |
| GET invalid UUID | 400 |

### 6.3 Pages (localhost:3001 after cache clear)

| Route | HTTP |
|-------|------|
| `/stores` (customer) | 200 |
| `/store-locations` (admin) | 200 |
| `/store-locations/create` | 200 |

`asf-2-next` `npm run typecheck` passes.

### 6.4 Production gap

`https://asf-2.vercel.app/api/store-locations` and `/store-locations` returned **404** at test time — deploy required for staff mobile and production web.

---

## 7. Known gaps and follow-ups

| Gap | Impact | Suggested action |
|-----|--------|------------------|
| Not deployed to Vercel | Staff mobile CRUD fails against production API URL | Deploy `asf-2-next` |
| `store_locations` not in `supabase_realtime` | Customer mobile won't live-update without refresh | `ALTER PUBLICATION supabase_realtime ADD TABLE store_locations` |
| `feature_flags` not in realtime publication | Flag flips need page refresh | Same for `feature_flags` if live toggling desired |
| Wishlist tab removed | No dedicated browse-wishlist screen on mobile/web nav | Accepted UX trade-off; heart icons still work |

---

## 8. File index (implementation)

### SQL

- `docs/sql/FEATURE_FLAGS_MIGRATION.sql`
- `docs/sql/STORE_LOCATIONS_MIGRATION.sql`
- `supabase/migrations/20260626160000_store_locations.sql`

### Web (`asf-2-next`)

- `src/app/api/store-locations/route.ts`
- `src/app/api/store-locations/[id]/route.ts`
- `src/app/api/_lib/apiSchemas.ts` (Zod schemas)
- `src/context/StoreLocationContext.tsx`
- `src/context/RouteContextBundles.tsx`
- `src/context/FeatureFlagsContext.tsx`
- `src/app/store-locations/` (admin CRUD)
- `src/app/(customer)/stores/` (customer discovery)
- `src/components/sidebar.tsx`
- `src/components/home/bottom-nav.tsx`
- `scripts/test-store-locations.mjs`

### Customer mobile (`asf-customer-app`)

- `context/StoreLocationContext.tsx`
- `context/RouteContextBundle.tsx`
- `context/FeatureFlagsContext.tsx`
- `app/(tabs)/locations.tsx`
- `app/(tabs)/_layout.tsx`

### Staff mobile (`asf-staff-app`)

- `context/StoreLocationContext.tsx`
- `context/AdminContextBundle.tsx`
- `context/FeatureFlagsContext.tsx`
- `app/(app)/locations/` (index, create, [id])
- `app/(app)/(tabs)/dashboard/index.tsx`

---

## 9. Manual test checklist (for humans)

1. **Customer mobile** — 4th tab 门店 → 10 mall cards with Google Maps / Waze buttons
2. **Customer web** — `/stores` → same cards; bottom nav 门店 active state
3. **Admin web** — `/store-locations` → list; create/edit/soft-delete
4. **Staff mobile** — Dashboard → 门店 (owner/manager) → full CRUD (requires API reachable)
5. **Feature flag off** — disable `store_locations` in Supabase → tab hidden, pages redirect

---

## 10. Related prior work

- Stock display bug (same session, earlier): customer `ProductContext` had hardcoded `stock_count: 0` after RPC removal — fixed separately with `product_stock(count)` join.
- Supabase MCP was initially connected to wrong account (NM MEDIA 2); re-auth to ASF account required before migrations could apply.
