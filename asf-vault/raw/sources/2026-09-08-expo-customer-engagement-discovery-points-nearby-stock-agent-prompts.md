# Expo Customer Engagement — Agent Prompts (2026-09-08)

**Companion plan (required reading for every agent):**  
`asf-vault/raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md`

**Repo root:** `asf-2/` (workspace may be `/Users/stanley/Documents/GIthub/asf-2` or equivalent)

**Why 7 agents:** Two features share foundations (schema, notifications) but diverge into admin Rewards, Expo ceremony, store-stock admin, proximity server, and Expo background location. Fewer agents force schema+UI+Expo into one context and blow a 200k window mid-edit. Seven keeps each pass one coherent slice with explicit file lists.

**Run order (strict unless noted):**

```
1 → 2 → 3 → 4 → 5 → 6 → 7
```

| Agent | Slice |
|-------|--------|
| 1 | DB migrations, seeds (settings, templates, demo notifs pattern), TypeScript types |
| 2 | Rewards settings admin + `POST /api/rewards/content-view` |
| 3 | Expo: content-view hooks + AchievementCeremony (Feature A only) |
| 4 | Store product stock APIs + web admin UI (color/size × store) |
| 5 | Location snapshot API + nearby matcher cron + `createCustomerNotification` wiring |
| 6 | Expo: Always location, nearby pref toggle, deep-link smoke; apply/document demo seeds |
| 7 | QC / acceptance against plan §13 |

**Parallelism:** After Agent 1, Agents **2** and **4** may run in **separate chats** in parallel. Agent **3** needs Agent **2**. Agent **5** needs Agent **1** (and benefits from Agent **4** stock existing for real tests). Agent **6** needs **5**. Agent **7** last.

**Do not:**
- Commit, push, or merge unless Stanley explicitly asks
- Run `npm start` / `expo start` / production builds (dev servers may already be running)
- Implement web **customer** award UX (Expo only for Feature A/B client)
- Add ceremony UI for nearby notifications
- Client-INSERT into `notifications` or client-mutate `user_points`
- Add Firebase
- Treat `products.stock_place` as store stock
- Touch Classic/Atelier/Noir themes unless a shared component requires it — prefer Storefront + shared libs; wire award on shared PDP route so all themes benefit if PDP is shared

**How to use:** Copy **one** agent section into a fresh chat. Tell the agent to read the **plan file first**, then only the files listed for that agent. Paste this shared-rules block once per chat if helpful.

---

## Shared rules (every agent)

### Coding standards
1. Double quotes for strings
2. Strict TypeScript — no `any`, no non-null assertion `!`, no `as unknown as T`
3. JSDoc on new exported functions/types/modules
4. Error handling on async paths; log server errors without leaking secrets
5. Complete code — no `TODO` placeholders for required behavior
6. Prefer existing patterns in the touched package (`asf-2-next` vs `asf-customer-app`)
7. i18n: user-facing Expo strings via locale files (`zh-CN` / `en` / `ms`)

### Points & notifications authority
- Points balance changes: **service role / server API only**
- Notifications: **`createCustomerNotification`** only (see `asf-2-next/src/app/api/_lib/customerNotifications.ts`)
- Expo Push already implemented — reuse; do not reinvent sender

### Locked product rules (do not reopen)
- Login required for awards
- Default 1 point; admin-editable `content_view_points`
- Post/promo trigger = linked-products open from Home/Highlights
- Nearby: 1.5 km, 1 push/product/7 days, Always location, **no** in-app ceremony
- Stock: store × product × color × size via `store_locations`

---

# Agent 1 — Database schema, seeds, generated types

### Goal
Create all new tables/columns, seed rewards settings + nearby templates (+ demo notification seed strategy), sync TypeScript `Database` types so later agents compile.

### Read first
1. Plan: `asf-vault/raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md` (§6 Data model, §6.7 types, §12 security)
2. Migration style: `supabase/migrations/*.sql` (and `asf-2-next` copies if the repo duplicates)
3. Existing notifications migration: `supabase/migrations/20260728140000_expo_customer_notifications.sql` (or nearest match)
4. Types: `asf-2-next/database.types.ts`, `asf-2-next/src/database.types.ts`, `asf-customer-app/database.types.ts` (keep in sync)
5. Tables to confirm live: `notification_preferences`, `notifications`, `product_stock`, `store_locations`, `wishlist`, `user_points`, `user_points_logs`

### Implement

#### A. Migration SQL
Dated migration matching repo convention. Create/alter:

1. **`rewards_settings`** — singleton row; `content_view_points int NOT NULL DEFAULT 1 CHECK (>= 0)`; seed id=1
2. **`content_view_awards`** — unique `(user_id, content_type, content_id)`; CHECK content_type; RLS SELECT own; no client write
3. **`store_product_stock`** — FKs to store/product/color/size; unique composite; `count >= 0`; indexes; RLS per plan
4. **`user_location_snapshots`** — prefer **one row per user upsert** (`user_id` PK) unless you document why append-only; RLS own INSERT/UPDATE/SELECT
5. **`wishlist_nearby_push_log`** — cooldown log; indexes on `(user_id, product_id, sent_at)`
6. **`notification_preferences.nearby_stock_push`** — boolean NOT NULL DEFAULT true
7. Enable **RLS** on all new tables; policies as plan §6

#### B. Templates
Seed `notification_templates` for type `wishlist_nearby_stock` × `zh-CN` | `en` | `ms` with `{{product_name}}`, `{{mall_name}}` (and `{{store_name}}` if useful). Re-run safe (ON CONFLICT update or delete+insert pattern used by prior notif migration).

#### C. Demo notifications seed
Provide a **safe seed** (SQL file under `docs/sql/` or migration section commented as “demo”):

- Insert ≥5 inbox rows for a configurable demo `user_id` **or** for every user that already has a `push_tokens` / `wishlist` row
- Mix types: e.g. `order_confirmed`, `promotion`, `wishlist_nearby_stock`, `claim_status_changed`, `ticket_replied` (plaintext title/body OK for demo; metadata `deep_link` / `product_id` using real product UUIDs from DB when possible)
- Document in migration header: how Stanley sets `demo_user_id` or runs the script
- Do **not** spam production unknowns without a clear WHERE clause

#### D. Types
Update all `database.types.ts` copies used by Next + customer app.

#### E. Header comment
Purpose + “apply before Agents 2–6”.

### Out of scope
APIs, admin UI, Expo app, cron logic, ceremony.

### Verification
- [ ] Valid Postgres; singleton rewards_settings row exists
- [ ] Templates present for nearby × 3 locales
- [ ] Types compile for new tables/columns
- [ ] Demo seed instructions written for Stanley

### Done criteria
Migration + seeds + types in working tree. No git commit unless asked.

---

# Agent 2 — Rewards settings admin + content-view award API

### Prerequisite
Agent 1 applied (types available).

### Goal
Staff can edit `content_view_points` under **Rewards settings**. Customers (Expo later) can call an idempotent award API that mutates points only on first view.

### Read first
1. Plan §§6.1–6.2, §7, §8.1, §12
2. `asf-2-next/src/app/api/_lib/apiAuth.ts`
3. `asf-2-next/src/app/api/_lib/supabaseServiceRole.ts`
4. Staff settings pattern: `asf-2-next/src/app/settings/warranty/page.tsx` (+ API routes it uses)
5. Points shapes: `user_points`, `user_points_logs`; web award reference `asf-2-next/src/components/stripe/OrderSuccess.tsx` (pattern only)
6. `asf-2-next/src/utils/pointsConfig.ts` — **do not** change order earn % unless needed; discovery amount lives in DB settings
7. Sidebar: `asf-2-next/src/components/sidebar.tsx` — add nav entry gated by `rewards` if appropriate

### Implement

#### A. API — settings
- `GET /api/rewards/settings` — auth staff; returns `{ content_view_points: number }`
- `PATCH /api/rewards/settings` — body `{ content_view_points: number }`; validate ≥ 0 integer; update singleton; set `updated_by`

#### B. API — content view award
- `POST /api/rewards/content-view`
- Body: `{ contentType: "product" | "post" | "promo", contentId: string }` (uuid)
- Auth: customer session (same pattern as other customer APIs)
- Steps:
  1. Validate body
  2. Optionally verify content exists (product/post/promo row) — recommended
  3. Read `content_view_points` from settings (if 0: still insert award with 0? **locked: if 0, no balance change but still record award to prevent later surprise when settings increase** — OR skip insert when 0; **prefer: record award with 0 and return awarded true only if points > 0 for ceremony**. Document choice in code comment.)
  4. INSERT `content_view_awards` ON CONFLICT DO NOTHING RETURNING
  5. If new row and points > 0: upsert/increment `user_points`, insert `user_points_logs` with type `content_view_product` | `content_view_post` | `content_view_promo`
  6. Return `{ awarded: boolean, points: number, alreadyAwarded: boolean }`

#### C. Admin page
- Route e.g. `/settings/rewards` (App Router)
- Load current value; number input; save; success/error
- Gate: logged-in staff + `rewards` feature flag (match warranty page patterns)
- Sidebar link “Rewards” / “积分设置” under settings area

#### D. Schemas
Zod (or existing `apiSchemas.ts` style) for bodies.

### Out of scope
Expo client, ceremony, store stock, nearby/cron, demo seeds application.

### Verification
- [ ] Staff can change points amount and reload sees new value
- [ ] Double POST same content → second `awarded: false`
- [ ] Points balance increases only once
- [ ] Unauthenticated POST → 401

### Done criteria
Settings UI + both APIs working. No commit unless asked.

---

# Agent 3 — Expo discovery points + AchievementCeremony

### Prerequisite
Agent 2 award API available (or mock against typed contract if API not deployed — prefer real API).

### Goal
Expo customer app awards points on first PDP / first post-or-promo linked-products open, with **stronger 仪式感 than `AddedToBagTray`**. Guests do not award.

### Read first
1. Plan §§1 Feature A, §9.1, §11, ceremony wiki notes in plan intro
2. `asf-customer-app/components/motion/AddedToBagTray.tsx` — baseline to **exceed**
3. `asf-customer-app/lib/motion.ts`, `lib/haptics.ts`
4. PDP entry: `asf-customer-app/app/(tabs)/browse/[productId].tsx` + theme `ProductDetail` screens as needed
5. Home/Highlights Storefront: `components/storefront/StorefrontFeedBlock.tsx`, theme `Home.tsx` / `Highlights.tsx` — find `onImagePress` / `onSeeAll` / linked list open
6. Auth: how app reads current user (Auth context)
7. `PointsMembershipContext` — display only; **do not** client-increment points
8. Locale JSON files under `asf-customer-app` i18n

### Implement

#### A. Client award helper
- e.g. `lib/contentViewAward.ts`
- `requestContentViewAward({ contentType, contentId })` → fetch Next API with user session cookies/headers per existing `apiFetch` / supabase session pattern used in the app
- In-memory Set debounce per session; server idempotent anyway
- Return awarded/points for UI

#### B. Wire triggers
1. **Product:** on PDP focus/mount when `productId` valid and user signed in
2. **Post / promo:** when user opens linked-products from Home or Highlights (image / See all). Pass `post` or `promo` id as `contentId`. Do **not** award on mere feed scroll impressions.

#### C. AchievementCeremony
- New component under `components/motion/`
- On `awarded === true` && points > 0: confetti or gold particle burst (~1.5–2.5s), stronger success haptic, bottom/top strip “+{n} 积分” (i18n)
- Respect `useReducedMotion` — strip + haptic only
- Non-blocking (no modal); dismiss automatically
- Do **not** use for nearby notifications

#### D. Guest UX
- If guest hits trigger: optional one-time soft toast “Sign in to earn points” (i18n); no ceremony loop

### Out of scope
Background location, notification prefs, store stock, web admin, Agent 2 API changes unless bugfix required.

### Verification
- [ ] First PDP award + ceremony; second open silent
- [ ] Post linked-products awards once
- [ ] Guest no points mutation
- [ ] Reduced motion OK
- [ ] `npx tsc --noEmit` in customer app (or project norm) clean for touched files

### Done criteria
Feature A client complete on Expo. No commit unless asked.

---

# Agent 4 — Store product stock API + web admin UI

### Prerequisite
Agent 1 schema for `store_product_stock`.

### Goal
Staff can set **per-store × color × size** inventory tied to `store_locations`, enabling truthful nearby alerts later.

### Read first
1. Plan §§6.3, §8.2, §4 misconception note
2. Product editor: `asf-2-next/src/app/products/create/[[...slugs]]/product-editor.tsx` (note `stock_place` / `stock_code` — leave them)
3. Store locations API: `asf-2-next/src/app/api/store-locations/`
4. `product_stock` usage / types — mirror color/size ids
5. `StoreLocationContext` / admin list patterns

### Implement

#### A. API
- Staff-authenticated routes to:
  - List stock for a `product_id` (join store name/mall)
  - Upsert batch rows `{ storeLocationId, colorId, sizeId, count }[]`
- Validate FKs; reject negative counts
- Service role writes

#### B. Admin UI
- On product create/edit: section **“门店库存 / Store stock”**
- Load active stores × product’s colors × sizes (same variant model as global stock UI if one exists; otherwise build a clear matrix or grouped editors)
- Save upserts via API
- Empty state when no colors/sizes yet

#### C. Demo-friendly seed (optional but recommended)
- SQL or script: for 1–2 active KL malls + a few popular product variants, set `count > 0` so Agent 5/6 can test nearby without manual grind
- Document which stores/products were seeded

### Out of scope
Expo UI, content-view points, cron, background location.

### Verification
- [ ] Upsert then reload shows saved counts
- [ ] Global `product_stock` unchanged by this UI
- [ ] Unique constraint respected (update not duplicate)

### Done criteria
Staff can maintain store stock. No commit unless asked.

---

# Agent 5 — Location snapshot API + nearby matcher + notify

### Prerequisite
Agent 1. Agent 4 stock data ideal for E2E; can unit-test matcher with fixtures.

### Goal
Server accepts user location snapshots and runs a secured job that sends **at most one** `wishlist_nearby_stock` notification per product per user per 7 days when within 1.5 km of a store with stock.

### Read first
1. Plan §§5 Feature B, §6.4–6.7, §7 cron, §10
2. `asf-2-next/src/app/api/_lib/customerNotifications.ts` — extend category mapping for `wishlist_nearby_stock` → **`nearby_stock_push` pref** (extend types; do not dump into `claims`)
3. `asf-2-next/src/app/api/_lib/expoPush.ts` (indirect via createCustomerNotification)
4. `asf-customer-app/lib/storeLocationDistance.ts` — port Haversine to Next util
5. Prefs loading inside `createCustomerNotification` — **extend** to read `nearby_stock_push` and skip inbox+push when false
6. Existing cron patterns in repo if any (`vercel.json` crons, etc.)

### Implement

#### A. Prefs + category
- Update `NotificationPrefCategory` / `categoryForNotificationType` / prefs fetch defaults for `nearby_stock_push`
- Template vars for nearby type wired in `notificationTemplateVars.ts` if required by existing pattern

#### B. `POST /api/location/snapshot`
- Customer auth
- Body `{ latitude, longitude, accuracyM? }`
- Upsert `user_location_snapshots`
- Validate lat/lng ranges

#### C. Matcher job `POST /api/cron/wishlist-nearby` (name flexible)
- Authorize via cron secret (`CRON_SECRET` or existing env convention)
- Algorithm per plan §10
- On send: `createCustomerNotification` with type `wishlist_nearby_stock`, vars, metadata deep_link `product:<uuid>`
- Insert `wishlist_nearby_push_log`
- Cap per user per run (max 1 product) to reduce bursts
- Structured logs (counts considered/sent/skipped)

#### D. Wire cron
- `vercel.json` cron entry **or** documented Supabase `pg_cron` calling the endpoint — pick what the repo already uses for scheduled work; if none, Vercel cron is fine and document env secret for Stanley

### Out of scope
Expo background task UI (Agent 6), store stock admin (Agent 4), discovery points.

### Verification
- [ ] Pref off → skipped
- [ ] Distance > 1.5 km → skipped
- [ ] Cooldown blocks second send within 7 days
- [ ] Happy path inserts `notifications` + log row
- [ ] category mapping does not send nearby when only `claims_push` toggled (independent pref)

### Done criteria
Server proximity pipeline complete. No commit unless asked.

---

# Agent 6 — Expo Always location + nearby pref + demo inbox

### Prerequisite
Agents 1 + 5 (snapshot + matcher). Agent 3 optional.

### Goal
Expo requests Background Always location, posts snapshots, exposes nearby pref toggle, and ensures demo inbox seeds are applied/documented so the notifications page is not empty.

### Read first
1. Plan §§9.2–9.3, §11
2. `asf-customer-app/lib/pushNotifications.ts`
3. `asf-customer-app/app/(tabs)/profile/notification-settings.tsx`
4. `asf-customer-app/app/(tabs)/profile/notifications.tsx`
5. `asf-customer-app/lib/notificationNavigation.ts`
6. `asf-customer-app/context/NotificationContext.tsx`
7. Existing foreground location usage in Locations screens
8. Expo docs patterns already in app for permissions

### Implement

#### A. Permissions + background updates
- Flow: explain → foreground → upgrade to **Always**
- Register background location task; on updates call `POST /api/location/snapshot`
- Handle denied/restricted without crashes; link to settings; keep existing OEM battery tip pattern
- Only run when user logged in and (optionally) pref enabled

#### B. Prefs UI
- Fourth toggle: Nearby stock (`nearby_stock_push`)
- Load/save with existing prefs API/table patterns (extend types after Agent 1)

#### C. Deep link
- Confirm `wishlist_nearby_stock` metadata with `product:` opens PDP via existing navigator; fix gaps only if needed

#### D. Demo notifications
- Apply Agent 1 demo seed for Stanley’s demo user (via Supabase MCP/SQL if available, or document exact SQL)
- Confirm inbox shows multiple rows
- If seed requires a user uuid, resolve from `auth.users` / `push_tokens` and record the uuid in a short note at bottom of this agent’s summary

### Out of scope
Rewarding points ceremony, store stock admin, changing matcher algorithm (bugfixes OK).

### Verification
- [ ] Pref toggle persists
- [ ] Snapshot rows update when location granted (dev test)
- [ ] Inbox has demo rows
- [ ] Tapping nearby demo row navigates safely

### Done criteria
Feature B client + demo inbox ready. No commit unless asked.

---

# Agent 7 — QC acceptance

### Prerequisite
Agents 1–6 complete (or note SKIP with reason).

### Goal
Walk plan §13 checklist; file defects first; no drive-by refactors.

### Read first
1. Plan §13
2. This prompts file (all agent done criteria)
3. Spot-check key files changed by Agents 1–6

### Implement
- Produce a QC notes markdown under `asf-vault/raw/sources/2026-09-08-expo-customer-engagement-qc-notes.md` **or** report in chat if Stanley prefers later ingest
- For each §13 item: PASS / FAIL / SKIP + evidence (file path, SQL, or manual step)
- List P0 blockers vs P2 polish
- Confirm no ceremony on nearby path; ceremony only on awarded content-view
- Confirm `stock_place` not used as store stock

### Out of scope
Building new features; large refactors.

### Done criteria
QC report delivered. No commit unless asked.

---

## Copy-paste starter (optional)

```text
You are implementing ASF-2 Agent N from:
asf-vault/raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-agent-prompts.md

Read the companion plan first:
asf-vault/raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md

Follow Shared rules + only that Agent section. Do not commit unless I ask.
Repo root: asf-2/
```
