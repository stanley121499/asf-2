# Expo Customer Notifications — Full Implementation Plan (2026-07-28)

**Project**: ASF-2 — primarily `asf-customer-app/` (Expo) + `asf-2-next/` (API + staff admin UI)  
**Date**: July 28, 2026  
**Status**: Approved for implementation (awaiting agent passes)  
**Stakeholder**: Stanley  
**Companion prompts**: `2026-07-28-expo-customer-notifications-agent-prompts.md`

**Builds on / must respect**:
- Mobile architecture + Expo Push (no Firebase) — wiki `wiki/concepts/mobile-app-architecture-asf-2.md`, source `2026-04-13-mobile-app-strategy.md`
- Production readiness / notifications gap — `wiki/concepts/production-readiness-asf-2.md`
- Immediate execution plan Step 5 (in-app NotificationContext already shipped) — `2026-04-13-immediate-execution-plan.md`
- Customer i18n — `wiki/concepts/customer-i18n-asf-2.md` (locales `zh-CN` | `en` | `ms`; notification plaintext gap)
- Claims notify helpers — `asf-2-next/src/modules/claims/claimNotifications.ts`
- Stripe webhook inserts — `asf-2-next/src/app/api/stripe/webhook/route.ts`
- Existing Expo inbox — `asf-customer-app/context/NotificationContext.tsx`, `app/(tabs)/profile/notifications.tsx`

---

## 1. What we are building

A **complete customer notification system**:

1. **In-app inbox** (already partially shipped) backed by `public.notifications`
2. **Push** via **Expo Push Notification Service** (EPS) — free; rate limit 600/sec/project; ≤100 msgs/request — **not Firebase**
3. **Staff-editable transactional templates** (DB) with multilanguage + default-locale fallback
4. **Staff-composed promotional campaigns** in **Next.js admin only** (send now → all eligible customers)
5. **Customer preference toggles** (Orders · Claims & support · Promotions)
6. **Deep links** from tap → order / claim / collection / browse path
7. **Locale sync** so push/inbox copy matches the customer’s language

**Target surfaces**:
- `asf-customer-app/` — register tokens, prefs UI, locale sync, badge, deep links, inbox polish
- `asf-2-next/` — shared notify helper, producers, admin templates + promo compose APIs/pages

**Explicitly out of scope**:
- `asf-staff-app` push (new order → manager, low stock, tickets → support, etc.)
- Email / SMS
- Promo segments, scheduling, A/B
- Firebase project / `google-services.json` management
- Changing announcement **banners** beyond optional future link (existing `announcements` table stays as in-app banners)

---

## 2. Why

| Today | Problem |
|-------|---------|
| Inbox UI + `NotificationContext` exist | Table often empty; many events never notify |
| Stripe / claims / warranty insert English plaintext | No locale; no push |
| Order status updates | Log only — **no customer notification** |
| Support ticket create | Client INSERT into `notifications` — **fails RLS** (SELECT/UPDATE own only; no INSERT) |
| No `push_tokens` | Cannot reach lock screen |
| Locale only in AsyncStorage | Server cannot pick language for push |
| No admin compose | Cannot send promos or edit transactional copy |

**Core outcome:** after implementation, a customer who allows notifications gets lock-screen + inbox alerts for orders/claims, can opt out of promos, and staff can edit templates and blast promos from Next.js — without touching the staff mobile app.

---

## 3. Locked decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Transactional copy | **B — DB templates** staff can edit wording; variables fixed/whitelisted per type |
| 2 | Promo audience (v1) | **A — all customers with a push token**, still filtered by **promotions pref on** |
| 3 | Preference toggles | **Yes — three toggles (A):** Orders · Claims & support · Promotions |
| 4 | Staff compose UI | **B — Next.js admin only** (not staff Expo) |
| 5 | Languages | Staff write **zh-CN / en / ms**; pick **one default**; missing locale → default → hard fallback `en` |
| 6 | Deep links | **Yes** via `notifications.metadata` |
| 7 | Scope | **Customer notifications fully**; admin pages to manage customer notifs; **no staff-mobile push** |
| 8 | Push provider | Expo Push Notification Service (free; 600/s; batch ≤100) |
| 9 | Insert authority | Service role / server only — never client INSERT |
| 10 | Pref behavior | **Transactional:** always insert inbox row; skip **push** if category off. **Promo:** skip **both** if promotions off |
| 11 | Coding standards | Double quotes; strict TS; no `any`; no `!`; no `as unknown as T`; JSDoc on new modules/functions |

---

## 4. Current state (verified 2026-07-28)

### Exists
- Table `notifications`: `id, user_id, type, title, body, read_at, metadata, created_at`
- RLS: `notifications_select_own` (SELECT), `notifications_update_own` (UPDATE) — **no INSERT policy**
- Expo + Next `NotificationContext` (fetch, realtime INSERT, mark read / mark all)
- Producers (hardcoded English inserts):
  - Stripe webhook: `order_confirmed`, `payment_failed`, `order_fulfillment_error`
  - Claims: `claim_created`, `claim_status_changed`
  - Warranty credits: `warranty_credit_issued`
- Feature flag key `notifications` exists in FeatureFlagsContext (do not invent a parallel flag unless needed)

### Missing
- Table `push_tokens` (**does not exist**)
- `expo-notifications` in customer app (**not installed**)
- Order status → customer notification
- Template / prefs / campaigns tables
- `user_details.preferred_locale`
- Admin UI for templates / promos

### Wiki note
`push_tokens` was deferred from Phase 0 to mobile Phase 5 in production roadmap raw source — this program creates it.

---

## 5. Architecture

```
Domain event (Stripe / order status / claims / warranty / support / admin promo)
    → createCustomerNotification(...)   [Next.js server, service role]
         → load prefs + preferred_locale
         → resolve copy (templates or campaign i18n + default fallback)
         → INSERT notifications
         → if push allowed: load push_tokens → POST Expo Push API
Expo app
    → permission + getExpoPushTokenAsync → upsert push_tokens
    → sync preferred_locale on language change
    → NotificationContext realtime → inbox
    → tap → mark read + router deep link from metadata
```

**Expo Push cost:** free; no monthly volume cap. Throughput limit 600 notifications/second/project; max 100 notifications per HTTP request. Use chunking + throttle (recommend `expo-server-sdk` in Next if dependency is acceptable, or manual chunking).

---

## 6. Data model

### 6.1 `push_tokens`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | default `gen_random_uuid()` |
| `user_id` | uuid NOT NULL | FK auth.users / user_details |
| `token` | text NOT NULL | Expo push token |
| `platform` | text NOT NULL | `ios` \| `android` |
| `app` | text NOT NULL | `customer` (leave room for future `staff` without implementing it) |
| `updated_at` | timestamptz | |
| UNIQUE | `(user_id, platform, app)` | upsert on register |

RLS: user can SELECT/INSERT/UPDATE/DELETE **own** rows only.

### 6.2 `notification_templates`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `type` | text NOT NULL | e.g. `order_confirmed` |
| `locale` | text NOT NULL | `zh-CN` \| `en` \| `ms` |
| `title_template` | text NOT NULL | `{{var}}` placeholders |
| `body_template` | text NOT NULL | |
| `updated_at` | timestamptz | |
| `updated_by` | uuid NULL | staff user id |
| UNIQUE | `(type, locale)` | |

RLS: authenticated users **SELECT** (optional — or server-only read via service role). **Writes only via staff API** (service role), not open client UPDATE.

**Seed** every type × three locales with sensible defaults (English can be primary seed; zh-CN/ms translations required in seed so inbox is not English-only on day one).

### 6.3 `notification_preferences`

| Column | Type | Default |
|--------|------|---------|
| `user_id` | uuid PK | |
| `orders_push` | boolean | `true` |
| `claims_push` | boolean | `true` |
| `promotions` | boolean | `true` |  <!-- both inbox+push for promo --> |
| `updated_at` | timestamptz | |

RLS: user manage own. Missing row ⇒ treat as all defaults `true`.

**UI labels (A):**
- Orders → `orders_push`
- Claims & support → `claims_push`
- Promotions → `promotions`

### 6.4 `user_details.preferred_locale`

- `preferred_locale text NULL` CHECK (`zh-CN` | `en` | `ms`)
- Expo language picker writes AsyncStorage **and** updates this column when signed in
- Resolver: `preferred_locale` → if null, campaign/template **default_locale** → `en`

### 6.5 `notification_campaigns`

| Column | Notes |
|--------|--------|
| `id` | uuid PK |
| `title_i18n` | jsonb `{ "zh-CN": "...", "en": "...", "ms": "..." }` |
| `body_i18n` | jsonb same shape |
| `default_locale` | `zh-CN` \| `en` \| `ms` |
| `deep_link` | text NULL — e.g. `/(tabs)/browse` or `product:<uuid>` (document convention in code) |
| `status` | `draft` \| `sending` \| `sent` \| `failed` |
| `created_by` | uuid |
| `sent_at` | timestamptz NULL |
| `recipient_count` | int NULL |
| `error_summary` | text NULL |
| `created_at` | timestamptz |

Writes via staff API only.

### 6.6 Existing `notifications`

No schema change required. Continue storing resolved `title`/`body` (final language) + `metadata` JSON.

Suggested `metadata` keys:
- `order_id`, `claim_id`, `registration_id`, `ticket_id`, `campaign_id`
- `deep_link` (string path or structured target)
- `status` (for order/claim status changes)

---

## 7. Notification types & producers

| Type | Pref category | Producer |
|------|---------------|----------|
| `order_confirmed` | orders | Stripe webhook (migrate) |
| `payment_failed` | orders | Stripe webhook (migrate) |
| `order_fulfillment_error` | orders | Stripe webhook (migrate) |
| `order_status_changed` | orders | **New** — when staff/admin updates order status (`OrderContext.updateOrderStatus` and/or admin order page path — one shared server helper preferred) |
| `claim_created` | claims | `notifyClaimSubmitted` |
| `claim_status_changed` | claims | `notifyClaimStatusChange` |
| `warranty_credit_issued` | claims | `warrantyCredits.ts` |
| `warranty_registration_activated` | claims | Physical warranty activate API |
| `warranty_registration_claimed` | claims | Physical warranty claim API (voucher issued) |
| `ticket_created` | claims | Support create — **must be service-role API**, not client insert |
| `ticket_replied` | claims | When staff replies (if a clear hook exists; else stub helper + wire best available path) |
| `promotion` | promotions | Admin campaign send |

### Template variables (whitelist examples)

| Type | Allowed vars |
|------|----------------|
| `order_confirmed` | `order_label`, `order_id` |
| `order_status_changed` | `order_label`, `order_id`, `old_status`, `new_status`, `status_label` |
| `payment_failed` | (none or `amount_label`) |
| `claim_*` | `claim_label`, `claim_id`, `status_label` |
| `warranty_credit_issued` | `amount_rm`, `claim_label` |
| `warranty_registration_*` | `registration_label`, `code`, `amount_rm` |
| `ticket_*` | `ticket_label` |

Interpolation: replace `{{name}}` only; unknown vars left empty or stripped; never `eval`.

---

## 8. Locale resolution (locked)

```
function resolveLocale(userPreferred, defaultLocale):
  if userPreferred in {zh-CN, en, ms}: try that
  else use defaultLocale
  if content for chosen locale is empty/missing: use defaultLocale content
  if still empty: use en content
  if still empty: use any non-empty locale present
```

Applies to **templates** and **campaigns** the same way.

---

## 9. Shared server helper

Location (suggested): `asf-2-next/src/app/api/_lib/customerNotifications.ts` (+ maybe `expoPush.ts`)

```ts
createCustomerNotification({
  supabase,          // service role client
  userId,
  type,
  vars?,             // Record<string, string>
  metadata?,
  // For promotion / one-off already-resolved copy:
  resolvedTitle?,
  resolvedBody?,
})
```

Steps:
1. Load prefs (defaults if missing)
2. Map `type` → category (`orders` | `claims` | `promotions`)
3. If promotions and `promotions === false` → return early (no row)
4. Resolve locale from `user_details.preferred_locale`
5. If not using resolvedTitle/Body: load template for type+locale with fallback; interpolate vars
6. INSERT `notifications`
7. If category push flag false (orders/claims) → return after insert
8. Else load `push_tokens` for `app = customer`; send Expo push with title/body; include data payload for deep link

**Do not** import this helper into client bundles.

---

## 10. Next.js admin UI

### 10.1 Notification templates
- Route suggestion: `/notifications/templates` (admin, RBAC-gated like other staff pages)
- List types; edit three locale title/body fields; show allowed vars; save via API
- Preview with sample var values

### 10.2 Compose promotion
- Route suggestion: `/notifications/campaigns` + `/notifications/campaigns/new`
- Fields: title/body × 3 locales, default locale select, deep link, confirm dialog (“Send to all customers with push + promotions enabled”)
- On send: create campaign row → status sending → iterate eligible users → `createCustomerNotification` type `promotion` → update counts/status
- History list: sent_at, recipient_count, status

Sidebar: add links under an appropriate admin section (Posts/Marketing-adjacent).

Staff auth: follow existing admin page patterns (`middlewareAuth` / `staff_roles`). Prefer API routes that verify staff before service-role writes.

---

## 11. Expo customer app

1. Add `expo-notifications` (compatible with current Expo SDK in app)
2. After signed-in session is ready: request permissions (not at cold splash); get token; upsert `push_tokens`
3. On `setLocale`: also `update user_details.preferred_locale` when `user` present
4. Profile: notification settings (three toggles) — either section on notifications screen or dedicated `profile/notification-settings` linked from hub + notifications header
5. Deep link handler in `NotificationRow` / inbox: read metadata → `router.push(...)`
6. Unread badge on Profile hub row / bell if present
7. Optional settings copy: Xiaomi/OPPO/vivo battery whitelist tip (ms/en/zh-CN)
8. All new chrome strings in `en.json` / `zh-CN.json` / `ms.json`

**Do not** run `npm start` / `expo start` (user likely already has a terminal).

---

## 12. Phased implementation (agent map)

**Eight agents** (not five): producers and the two admin products are split so no single pass has to hold Stripe webhook + claims/warranty + new APIs + both admin UIs + Expo client in one context window.

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| 0 | Agent 1 | Migrations + seeds + `database.types` sync |
| 1 | Agent 2 | `createCustomerNotification` + Expo push sender |
| 2 | Agent 3 | Stripe webhook producers only |
| 3 | Agent 4 | Claims + warranty-credit + physical-warranty producers |
| 4 | Agent 5 | Order-status notify API + support ticket notify (fix client INSERT) |
| 5 | Agent 6 | Next admin: **templates** only |
| 6 | Agent 7 | Next admin: **promo campaigns** only |
| 7 | Agent 8 | Expo: token register, locale sync, prefs, deep links, badge, polish |

**Strict order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.  
Agent 8 may optionally start after Agent 2 for early device work; end-to-end still needs 3–7.

---

## 13. Security

- No client INSERT on `notifications`
- Service role key only in Next Route Handlers / server modules
- Template/campaign mutations: staff-only
- Push tokens: own-row RLS
- Prefs: own-row RLS
- Validate deep_link / metadata to avoid open redirects (allow only internal path patterns)

---

## 14. Verification checklist (program-level)

- [ ] Migrations applied; tables exist; template seeds present for all types × locales
- [ ] Place test order / simulate webhook → inbox row in correct locale + push (physical device)
- [ ] Change order status in admin → customer gets `order_status_changed`
- [ ] Submit claim / status change → notify
- [ ] Support ticket create → notify (no RLS error)
- [ ] Toggle Promotions off → promo skipped; Orders toggle off → inbox still gets order row, no push
- [ ] Staff edits template → next event uses new copy
- [ ] Staff sends campaign → multiple users get promotion rows + pushes
- [ ] Tap notification → lands on correct screen
- [ ] Language switch syncs `preferred_locale` and affects next notification language
- [ ] Staff Expo app untouched for push

---

## 15. Related wiki / raw

- `wiki/concepts/mobile-app-architecture-asf-2.md`
- `wiki/concepts/customer-i18n-asf-2.md`
- `wiki/concepts/post-purchase-claims-module-asf-2.md`
- `wiki/concepts/warranty-discount-credits-asf-2.md`
- `wiki/concepts/physical-warranty-registration-asf-2.md`
- `raw/sources/2026-04-13-mobile-app-strategy.md`
- `raw/sources/2026-04-13-production-roadmap.md` (push_tokens deferred note)

---

## 16. Open tension (documented, not blocking)

- i18n wiki previously said locale is device-local only — this program **adds** `preferred_locale` sync by design (needed for push language).
- `requireStaffUser` in `apiAuth.ts` is currently a prototype (any authenticated user). Admin notification APIs should still follow the **same pattern as sibling admin APIs** in this repo; if a stronger `staff_roles` check exists on some routes, prefer that for campaign send.
