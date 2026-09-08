# Expo Customer Engagement — QC notes (Agent 7)

**Date**: 2026-09-08  
**Scope**: Plan §13 Testing / acceptance + locked confirmations  
**Method**: Supabase MCP SQL audits; static read of Next APIs/admin + Expo award/ceremony/location/prefs; Agents 1–6 status notes. **No device UI / Expo Go Always location / live cron invoke.**  
**Verdict**: **Implementation-complete pending device / native E2E.** One Highlights wiring gap (P2). No P0 blockers for Home discovery path + seeded demo inbox + server nearby pipeline.

**Demo user**: `stanley121499@gmail.com` → `f94dfdc6-1212-4893-8617-b248ba26ab8c`

---

## Locked confirmations

| Check | Result | Evidence |
|-------|--------|----------|
| Ceremony only on awarded content-view; **no** ceremony on nearby path | **PASS** | `AchievementCeremony` mounted only via `ContentViewAwardHost` when `awarded === true && points > 0` (`asf-customer-app/components/motion/ContentViewAwardHost.tsx`). Nearby uses `createCustomerNotification` only (`wishlistNearbyMatcher.ts`); no ceremony import on notification/inbox paths. |
| `products.stock_place` **not** used as store stock | **PASS** | Matcher reads `store_product_stock` only. Admin: `StoreProductStockSection` + `/api/store-product-stock`; `product-editor.tsx` keeps free-text `stock_place` separately with comment to leave as-is. |

---

## QC matrix (plan §13)

### Feature A — Discovery points

| ID | Check | Result | Evidence |
|----|--------|--------|----------|
| A1 | Guest opens PDP → no points change, no ceremony | **PASS** | `ContentViewAwardHost`: guest branch shows one-time `rewards.signInToEarnPoints` alert; does **not** call `requestContentViewAward`. Ceremony only after `awarded === true`. Route: `browse/[productId].tsx`. |
| A2 | Logged-in first PDP → +N + ceremony once; second open silent | **SKIP** | Device not run. Static: host on PDP; API `POST /api/rewards/content-view` INSERT ON CONFLICT + unique `(user_id, content_type, content_id)`; ceremony gated on `awarded`. Live DB: `content_view_awards` count = 0 (no prior E2E awards). |
| A3a | Post/promo linked-products first open → award (Home) | **PASS** | Storefront `Home.tsx` `onImagePress` / `onSeeAll` → `openLinkedProducts`; `linked-products.tsx` mounts `LinkedProductsAwardHost` (maps `promotion` → `promo`). |
| A3b | Same from Highlights tab | **FAIL** | `themes/storefront/screens/Highlights.tsx` has **no** `openLinkedProducts` / linked-products navigation (feed-style only). Plan expected Home **or** Highlights; Home covers demo path. |
| A4 | Linked product then PDP can award **both** post + product | **PASS** | Distinct award keys (`post`/`promo` vs `product`); hosts on both routes. Static only. |
| A5 | Admin changes N 1→2 → new awards 2; old unchanged | **PASS** | `/settings/rewards` + `GET/PATCH /api/rewards/settings`; award API reads `rewards_settings.content_view_points` and snapshots into `points_awarded`. Live singleton: `content_view_points = 1`. Device admin click not run. |
| A6 | Reduced motion: no particle spam; still strip | **PASS** | `AchievementCeremony`: `useReducedMotion` → `skipParticles`; strip + `hapticAchievement` still run. |

### Feature B — Nearby wishlist stock

| ID | Check | Result | Evidence |
|----|--------|--------|----------|
| B1 | Wishlist + stock + ≤1.5 km → push + inbox | **SKIP** | E2E not run: `user_location_snapshots` = 0, `wishlist_nearby_push_log` = 0. Code: matcher + cron `POST /api/cron/wishlist-nearby` + `vercel.json` `*/15`. Demo stock: 22 rows, Pavilion KL + Suria KLCC (`count > 0`). |
| B2 | Outside radius → no send | **PASS** | `findStoresWithinRadius` / `NEARBY_RADIUS_KM = 1.5` in `wishlistNearbyMatcher.ts`. |
| B3 | Second trigger within 7 days same product → no send | **PASS** | `wishlist_nearby_push_log` + `NEARBY_COOLDOWN_MS` (7d); `pickFirstEligibleMatch` skips cooldown set. |
| B4 | Pref off → no inbox/push | **PASS** | `categoryForNotificationType("wishlist_nearby_stock")` → `nearby_stock`; skip when `nearby_stock_push === false` in `customerNotifications.ts`; matcher also skips pref-off users. |
| B5 | Tap notification → PDP | **PASS** | Nearby demo row: `deep_link` `product:dddd0101-24a8-4f00-8000-000000000001` (product exists). `resolveNotificationHref` → `/(tabs)/browse/${id}`; inbox only `router.push` when href non-null. **Device tap not run.** |
| B6 | Always permission denied → no crash; soft prompt | **SKIP** | Device/native not run. Static: `backgroundLocation.ts` soft-fails denied/Expo Go; settings link via `openAppLocationSettings`; notification-settings nearby toggle + location hint. **Always needs native build (not Expo Go)** — Agent 6. |

### Demo

| ID | Check | Result | Evidence |
|----|--------|--------|----------|
| D1 | Demo user inbox not empty after seed | **PASS** | SQL: **6** notifications for `f94dfdc6-1212-4893-8617-b248ba26ab8c` — types: `order_confirmed`, `promotion`, `wishlist_nearby_stock`, `claim_status_changed`, `ticket_replied`, `warranty_registration_activated`. Seed: `asf-2-next/docs/sql/SEED_DEMO_CUSTOMER_NOTIFICATIONS.sql`. |

### Regression

| ID | Check | Result | Evidence |
|----|--------|--------|----------|
| R1 | Existing order/claim/promo notifications still work | **PASS** | Pref categories extended; nearby mapped to new `nearby_stock_push`, not dumped into `claims`. Templates for nearby × `en`/`ms`/`zh-CN` present (n=3). |
| R2 | Global `product_stock` / cart unchanged | **PASS** | Store stock API documents no mutation of `product_stock`; separate `store_product_stock` table. |
| R3 | Store locator tab still works | **SKIP** | Device not run; no intentional edits to locator Haversine UI in this pack. |

**Counts**: PASS **11** · FAIL **1** · SKIP **5**  
(matrix rows: A1, A3a, A4–A6, B2–B5, D1, R1–R2 = PASS; A3b = FAIL; A2, B1, B6, R3 = SKIP)

---

## Schema / infra spot-check (Agents 1–5)

| Item | Result |
|------|--------|
| Migration `20260908160000_expo_customer_engagement_discovery_nearby.sql` | Present (repo root + `asf-2-next` copy) |
| Tables live | `rewards_settings`, `content_view_awards`, `store_product_stock`, `user_location_snapshots`, `wishlist_nearby_push_log` |
| `nearby_stock_push` column | Present |
| Rewards singleton | 1 row, `content_view_points = 1` |
| Nearby templates | 3 locales |
| Admin Rewards | `/settings/rewards` + sidebar gated by `rewards` |
| Store stock admin | `StoreProductStockSection` on product editor |
| Cron | `vercel.json` → `/api/cron/wishlist-nearby` `*/15`; docs `CRON_WISHLIST_NEARBY.md` |

---

## P0 blockers vs P2 polish

### P0 blockers
**None.** Home PDP + Home linked-products award paths, Rewards admin/API, store stock, nearby matcher/cron/prefs, and demo inbox are in place for a staged demo without Highlights.

### P2 polish / follow-ups
1. **Highlights → linked-products** missing (`A3b`) — post/promo discovery awards unavailable from Highlights tab.  
2. **Demo deep links** for order/claim/ticket/registration use non-UUID placeholders (`order:demo-1001`, `claim:demo-clm-01`, …) → tap marks read only (safe no-op). Nearby + promotion product links are real UUIDs.  
3. **Feature B E2E** unproven until native Always location writes snapshots and cron runs with wishlist ∩ stock ∩ radius.  
4. **Expo Go**: background Always location unavailable — document/use a native build for nearby demos.

---

## Open for Stanley (device smoke)

1. Signed-in: first PDP → ceremony +1; reopen same product → silent.  
2. Home: post/promo image or See all → linked-products → ceremony once.  
3. Guest PDP → soft sign-in prompt, no ceremony.  
4. Admin: set content view points to 2; open new content → +2.  
5. Prefs: toggle Nearby stock; confirm persistence.  
6. Native build: Always location → snapshot row; wishlist product with Pavilion/Suria stock; trigger cron → inbox + push; cooldown re-run.  
7. Tap nearby inbox row → PDP.  
8. Optional: wire Highlights to `openLinkedProducts` (P2).

---

## Program status

**Agents 1–6 delivered; Agent 7 QC filed.** Status: implementation-complete, **pending device/native E2E**; one P2 FAIL (Highlights linked-products).
