# Expo Customer Engagement — Discovery Points + Nearby Wishlist Stock (2026-09-08)

**Project**: ASF-2 — primarily `asf-customer-app/` (Expo) + `asf-2-next/` (API + web admin)  
**Date**: September 8, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley (Simon ceremony feedback noted)  
**Companion prompts**: `2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts.md`

**Builds on / must respect**:
- Expo Push + inbox — `wiki/concepts/mobile-app-architecture-asf-2.md`, plan `2026-07-28-expo-customer-notifications-plan.md`, helper `asf-2-next/src/app/api/_lib/customerNotifications.ts`
- Ceremony / 仪式感 — `wiki/concepts/expo-customer-ceremony-motion-asf-2.md` (add-to-bag tray is **too weak** for achievement moments; ramp up for discovery points only)
- Store locator — `wiki/concepts/store-locations-feature-asf-2.md`, table `store_locations`
- Points — `user_points`, `user_points_logs`, contexts `PointsMembershipContext`; order earn via `pointsConfig.ts` (unchanged)
- Wishlist — `wishlist` (products only); Expo `WishlistContext`
- Storefront Home/Highlights feed — `StorefrontFeedBlock` (image / See all → linked products; tile → PDP)
- Customer i18n — `zh-CN` | `en` | `ms`

---

## 1. What we are building

Two customer-engagement features for the **Expo customer app first** (web customer surfaces out of scope except **admin** config/stock UIs).

### Feature A — First-view discovery points

When a **logged-in** customer opens content for the **first time**, award a configurable number of points (default **1**), once forever per `(user, content_type, content_id)`.

| Content | Trigger |
|---------|---------|
| **Product** | First open of PDP (`browse/[productId]`) |
| **Post** | First open of the **linked-products** surface from Home or Highlights (image press / See all — same path that shows products linked to the post) |
| **Promo** | Same as post: first open of linked-products from Home or Highlights for that promotion |

**Guests**: no award. Optional quiet “sign in to earn points” once — no fake confetti.

**UX**: Not a blocking modal. Stronger **仪式感** than `AddedToBagTray` (Simon: bag tray felt too little): short confetti/gold particle burst (~1.5–2.5s), stronger success haptic, ceremony strip with “+N 积分” (and equivalents). Only when the server returns `awarded: true`.

**Admin**: Web **Rewards settings** page — edit `content_view_points` (integer ≥ 0; default 1). Changing the amount affects **future** awards only (past awards stay as logged).

### Feature B — Nearby wishlist stock alerts

When a logged-in customer has a product in **wishlist**, and they are within **1.5 km** of a `store_locations` row that has **in-stock** inventory for that product (per color/size), send a **normal phone push + inbox row** (same system as orders/promos).

| Rule | Value |
|------|--------|
| Radius | 1.5 km |
| Cooldown | Max **1 push per product per user per 7 days** |
| Location | **Background Always** (with permission UX + OEM battery tip) |
| Ceremony | **None** — OS notification + inbox only |
| Stock grain | Per **store × product × color × size** |
| Deep link | Existing `product:<uuid>` (optional metadata: `store_location_id`, mall name in body) |

**Clarify misconception**: Product create today has free-text `stock_place` / `stock_code` only — **not** a `store_locations` picker. Per-store stock is **new** and must plug into the existing `store_locations` system.

### Demo inbox fill

`notifications` is often empty. Seed a handful of **fake/demo** inbox rows (mixed types including a sample nearby-stock message) so demos don’t show an empty bell. Prefer targeting known demo/test users (or all users with `push_tokens` / wishlist); document how Stanley applies seeds.

---

## 2. Why

| Today | Gap |
|-------|-----|
| Points mostly order-centric; Expo mainly displays balance | No content-discovery earn path |
| Wishlist exists | No location-aware alerts |
| `product_stock` is global (no store FK) | Cannot truthfully say “in stock at this mall” |
| Expo Push + inbox shipped | Nearby type + pref + background location missing |
| Ceremony pack | Achievement layer deferred; bag tray too weak for “you earned a point” |

**Outcomes**: browsing new content feels rewarding; saved items can pull customers into nearby stores; demos show a lived-in notification inbox.

---

## 3. Locked decisions

| # | Decision |
|---|----------|
| 1 | No points until login |
| 2 | Always same amount for product/post/promo; default **1**; **admin-editable** under Rewards settings |
| 3 | Post/promo award = open linked-products from Home/Highlights (not a new detail route) |
| 4 | **Expo only** for customer UX; web admin for settings + store stock |
| 5 | Build real per-store stock (color/size) tied to `store_locations` |
| 6 | 1.5 km; 1 push / product / 7 days |
| 7 | Background **Always** location |
| 8 | Ramp 仪式感 for **discovery points only**; nearby = normal notification |
| 9 | Demo/fake notifications seeded for non-empty inbox |
| 10 | Coding standards: double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc on new modules |
| 11 | Points mutations **server-side only** (service role); client never self-increments balance |
| 12 | Nearby uses `createCustomerNotification` + Expo Push; no client INSERT into `notifications` |

---

## 4. Current state (verified 2026-09-08)

### Exists
- `user_points`, `user_points_logs` (`type` text), `membership_tiers`, `user_stamps`
- `wishlist` — `(user_id, product_id)` unique; products only
- `product_stock` — `(product_id, color_id, size_id, count)` — **no store**
- `store_locations` — lat/lng, malls, feature flag `store_locations`
- Expo location for **store list sort** only (`expo-location`, Haversine) — not background Always, not wishlist matching
- Notifications stack: `push_tokens`, `notification_preferences` (`orders_push`, `claims_push`, `promotions`), `notification_templates`, `notifications`, `createCustomerNotification`, Expo client token registration
- Deep links: `product:<uuid>`, order/claim/registration/ticket paths — `asf-customer-app/lib/notificationNavigation.ts`
- Home/Highlights: `StorefrontFeedBlock` → `onImagePress` / `onSeeAll` / `onProductPress`
- Motion: `AddedToBagTray`, `lib/motion.ts`, `lib/haptics.ts` — use as baseline to **exceed** for points ceremony
- `products.stock_place`, `products.stock_code` — free text; leave as-is (do not treat as store stock)

### Missing
- `content_view_awards` / discovery award API
- `rewards_settings` (or equivalent) + admin UI
- `store_product_stock` (or store-scoped stock) + admin UI
- Nearby preference, templates, matcher job, location snapshots
- Background Always permission flow
- Demo notification seeds
- Stronger AchievementCeremony for points

### Explicit non-goals (this program)
- Web customer PDP/Home award UX
- Separate “likes” system (wishlist = liked)
- Staff-app push
- Per-store stock on staff Expo (web admin first is enough unless trivial to share API)
- Changing order points earn % (Rewards settings may later host more keys; v1 = content view amount only)
- Replacing global `product_stock` (keep for online/cart; store stock is additive for retail proximity)

---

## 5. Architecture

### Feature A

```
Expo PDP or linked-products open (signed in)
  → POST /api/rewards/content-view { contentType, contentId }
      → auth user
      → read rewards_settings.content_view_points
      → INSERT content_view_awards ON CONFLICT DO NOTHING
      → if inserted: increment user_points + insert user_points_logs
      → { awarded, points, balance? }
  → if awarded: AchievementCeremony (confetti + haptic + strip)
```

### Feature B

```
Expo (Always location granted)
  → periodic / significant-change → POST /api/location/snapshot { lat, lng, accuracy? }
      → store user_location_snapshots (latest or append with prune)

Cron / scheduled job (Vercel cron or Supabase pg_cron / edge — pick one repo-consistent approach)
  → for users with recent snapshot + nearby pref on + wishlist
  → Haversine ≤ 1.5 km to active store_locations
  → store_product_stock.count > 0 for wishlist product (any variant OR prefer any in-stock SKU)
  → cooldown table / query: no send if last nearby push for (user, product) < 7 days
  → createCustomerNotification({ type: "wishlist_nearby_stock", ... })
      → inbox + Expo push
```

**Stock match rule (v1):** product is “available at store” if **any** row for that `product_id` + `store_location_id` has `count > 0` (regardless of which color/size the user last viewed). Metadata may include first matching store + optional color/size labels later.

### Demo seeds

```
Service-role / migration seed
  → INSERT notifications for demo user(s)
  → types mix: order_confirmed-ish copy, promotion, wishlist_nearby_stock, claim/ticket sample
  → metadata deep_links that won’t crash navigation (use real product ids from seed catalog when possible)
```

---

## 6. Data model

### 6.1 `rewards_settings`

Single-row or key/value store. Recommended **single-row** table:

| Column | Type | Notes |
|--------|------|--------|
| `id` | int PK CHECK (id = 1) | singleton |
| `content_view_points` | int NOT NULL DEFAULT 1 | CHECK ≥ 0 |
| `updated_at` | timestamptz | |
| `updated_by` | uuid NULL | staff user |

RLS: public/authenticated **SELECT** optional; writes via **admin API + service role** only.

Seed: one row `content_view_points = 1`.

### 6.2 `content_view_awards`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid NOT NULL | FK auth.users |
| `content_type` | text NOT NULL | CHECK `product` \| `post` \| `promo` |
| `content_id` | uuid NOT NULL | |
| `points_awarded` | int NOT NULL | snapshot of amount at award time |
| `created_at` | timestamptz | |
| UNIQUE | `(user_id, content_type, content_id)` | idempotency |

RLS: user SELECT own; **no** client INSERT/UPDATE (award via API).

### 6.3 `store_product_stock`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `store_location_id` | uuid NOT NULL | FK `store_locations` |
| `product_id` | uuid NOT NULL | FK `products` |
| `color_id` | uuid NOT NULL | FK `product_colors` (align with `product_stock`) |
| `size_id` | uuid NOT NULL | FK / nullable only if existing `product_stock` allows null — **match existing nullability** |
| `count` | int NOT NULL DEFAULT 0 | CHECK ≥ 0 |
| `updated_at` | timestamptz | |
| UNIQUE | `(store_location_id, product_id, color_id, size_id)` | |

RLS: public SELECT for active stores’ rows (or server-only read for matcher + staff API write). Prefer: anon/authenticated SELECT `count` for active non-deleted stores; writes staff API only.

Indexes: `(store_location_id, product_id)`, `(product_id)` for wishlist joins.

### 6.4 `user_location_snapshots`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid NOT NULL | |
| `latitude` | numeric NOT NULL | |
| `longitude` | numeric NOT NULL | |
| `accuracy_m` | numeric NULL | |
| `recorded_at` | timestamptz NOT NULL DEFAULT now() | |

RLS: user INSERT/SELECT own; prune old rows (keep last N or last 24–48h) in API or cron.

Alternatively upsert **one row per user** (`user_id` PK) if history is unnecessary — **prefer upsert-latest** for simplicity unless debugging needs history.

### 6.5 `wishlist_nearby_push_log`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid NOT NULL | |
| `product_id` | uuid NOT NULL | |
| `store_location_id` | uuid NOT NULL | |
| `notification_id` | uuid NULL | FK notifications |
| `sent_at` | timestamptz NOT NULL DEFAULT now() | |

Cooldown: before send, reject if exists row for `(user_id, product_id)` with `sent_at > now() - interval '7 days'`.

### 6.6 `notification_preferences` extension

Add column:

| Column | Default |
|--------|---------|
| `nearby_stock_push` | `true` |

**Pref behavior:** when false → skip **inbox + push** for nearby type (same as promotions family), **or** insert inbox / skip push only — **locked: skip both** when off (customer explicitly doesn’t want nearby nagging).

### 6.7 Notification type

| Type | Pref | Notes |
|------|------|--------|
| `wishlist_nearby_stock` | `nearby_stock_push` | Extend `categoryForNotificationType` / prefs loader — **do not** mis-map to `claims` |

Templates × locales (`zh-CN`, `en`, `ms`) with vars e.g. `product_name`, `mall_name`, `store_name`.

Metadata example:

```json
{
  "deep_link": "product:<product_uuid>",
  "product_id": "<uuid>",
  "store_location_id": "<uuid>"
}
```

### 6.8 `user_points_logs.type`

Use stable strings, e.g. `content_view_product`, `content_view_post`, `content_view_promo` (or single `content_view` + metadata — prefer distinct types for admin readability).

---

## 7. APIs (Next.js)

All under `asf-2-next/src/app/api/…`, service role where mutating points/stock/notifications.

| Route | Auth | Purpose |
|-------|------|---------|
| `GET/PATCH /api/rewards/settings` | Staff (owner/manager or existing admin gate) | Read/update `content_view_points` |
| `POST /api/rewards/content-view` | Customer session | Idempotent award |
| `GET/PUT /api/store-product-stock` (or nested under products/stores) | Staff | List/upsert store×SKU counts |
| `POST /api/location/snapshot` | Customer | Upsert latest lat/lng |
| `POST /api/cron/wishlist-nearby` (or similar) | Cron secret | Run matcher |

Reuse patterns from `apiAuth.ts`, `supabaseServiceRole.ts`, `createCustomerNotification`.

**Content-view response shape (suggested):**

```ts
{ awarded: boolean; points: number; alreadyAwarded?: boolean }
```

---

## 8. Admin UI (web)

### 8.1 Rewards settings

- Path suggestion: `/settings/rewards` or sidebar under existing Settings / Rewards admin area
- Gate with `rewards` feature flag and staff role (match warranty settings pattern: `asf-2-next/src/app/settings/warranty/page.tsx`)
- Field: content view points (number input)
- Save → PATCH API

### 8.2 Store product stock

- On product edit (or dedicated tab): matrix / list of **stores × colors × sizes** with count editors
- Only active `store_locations`
- Do not remove `stock_place` text fields in v1 (legacy)
- Must be usable for demo: seed some store stock for wishlist-able products at 1–2 KL malls near typical demo GPS

---

## 9. Expo client

### 9.1 Discovery points

- Shared helper `lib/contentViewAward.ts` (or similar): call API once per mount/open with in-memory + AsyncStorage debounce to avoid spam; server remains source of truth
- Wire:
  - PDP theme screens / `browse/[productId].tsx`
  - Home + Highlights linked-products open handlers (post id / promo id)
- `components/motion/AchievementCeremony.tsx` (name flexible): confetti/particles + haptic + strip; respect reduced motion
- i18n keys for strip copy

### 9.2 Nearby

- Request **foreground then Always** background permission with clear copy (zh/en/ms)
- Background location updates via `expo-location` (task name registered in `_layout` / entry)
- Respect `nearby_stock_push` pref; add 4th toggle on `notification-settings.tsx`
- No special in-app celebration on receive
- Ensure deep link from nearby notification opens PDP

### 9.3 Demo

- Seed SQL/script documented; after apply, inbox shows ≥4–6 rows for demo account

---

## 10. Cron / matcher details

1. Load snapshots newer than e.g. 2 hours (stale location → skip)
2. Pref `nearby_stock_push !== false`
3. Wishlist product ids
4. Stores within 1.5 km of snapshot
5. Intersection with `store_product_stock.count > 0`
6. Cooldown filter via `wishlist_nearby_push_log`
7. Cap sends per cron tick (e.g. max 1 product per user per run) to avoid bursts
8. Log + notify

Haversine: reuse formula from `asf-customer-app/lib/storeLocationDistance.ts` (port to server util).

---

## 11. i18n & prefs UI

- Pref label: Nearby stock / 附近有货 / (ms equivalent)
- Ceremony: “+{n} points” / “+{n} 积分”
- Permission rationale strings for Always location
- Template seeds for `wishlist_nearby_stock` in three locales

---

## 12. Security & abuse

- Award API: auth required; rate-limit lightly; unique constraint prevents double earn
- Do not accept `points` from client body — server reads settings
- Location snapshot: auth; reject absurd coords; no public read of others’ locations
- Cron endpoint: shared secret header
- RLS on new tables as specified
- Note: many legacy tables lack RLS (existing vault/advisor debt) — **new tables must enable RLS**

---

## 13. Testing / acceptance

### Feature A
- [ ] Guest opens PDP → no points change, no ceremony
- [ ] Logged-in first PDP → +N points, ceremony once; second open → no award
- [ ] Post linked-products first open → award `post`; promo likewise
- [ ] Opening linked product then PDP can award **both** post and product if both first-time
- [ ] Admin changes N from 1→2 → new content awards 2; old awards unchanged
- [ ] Reduced motion: no particle spam; still show strip

### Feature B
- [ ] Wishlist + stock at store + location within 1.5 km → push + inbox
- [ ] Outside radius → no send
- [ ] Second trigger within 7 days same product → no send
- [ ] Pref off → no inbox/push
- [ ] Tap notification → PDP
- [ ] Always permission denied → no crash; optional soft prompt

### Demo
- [ ] Demo user inbox not empty after seed

### Regression
- [ ] Existing order/claim/promo notifications still work
- [ ] Global `product_stock` / cart unchanged
- [ ] Store locator tab still works

---

## 14. Agent pack sizing

Designed for **~200k context** models: **7 sequential agents** (see companion prompts). Each agent owns one coherent surface (schema → awards admin/API → Expo ceremony → store stock admin → nearby server → Expo location/prefs/demo → QC). Do not merge 3–6 into one pass.

**Run order:** `1 → 2 → 3 → 4 → 5 → 6 → 7`

Agent 3 (Expo points) can start after Agent 2. Agent 6 needs Agents 1 + 5. Agent 4 independent of 2–3 after Agent 1.

---

## 15. Related wiki / raw

- [[wiki/concepts/expo-customer-ceremony-motion-asf-2]]
- [[wiki/concepts/store-locations-feature-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-07-28-expo-customer-notifications-plan]]
- Companion: `raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts.md`
