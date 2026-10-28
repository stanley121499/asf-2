# Expo Customer App — Perf + Engagement Mid-Record (2026-09-14)

**Date**: 2026-09-14  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo) + related Next admin/API where noted  
**Stakeholder**: Stanley (+ Simon for APK preview)  
**Status**: Mid-session checkpoint — **not** a final accomplishment  
**Git**: Much work is **local / uncommitted**. **Verify `git status` before the next EAS build.** Do not assume HEAD matches device APK.

**Treat this file as the vault source of truth** for engagement + performance decisions and ship state as of 2026-09-14. Prefer this over chat memory. Plan + QC from 2026-09-08 remain authoritative for original feature design; this mid-record supersedes them where status or kill-switch differs.

**Related plan:** `raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md`  
**Related QC:** `raw/sources/2026-09-08-expo-customer-engagement-qc-notes.md`  
**Agent prompts:** **deleted** (raw + wiki) — do **not** re-create or re-ingest prompt dumps for this engagement.

---

## 0. Do not re-do / do not re-ingest

| Item | Guidance |
|------|----------|
| Agent prompt dumps (`*-agent-prompts.md`) for this engagement | **Gone on purpose.** Do not recreate under `raw/` or `wiki/sources/`. |
| Guest discovery awards | **Locked no** — do not add guest awards. |
| Nearby in-app ceremony | **Locked no** — push + inbox only. |
| Using `products.stock_place` as store stock | **Wrong** — use `store_product_stock` / admin store stock UI. |
| Vercel MCP for Stanley’s deploy | **Do not use** — `git push` for his Vercel. |
| Measuring perf only in Expo Go | Insufficient — release APK differs (no Metro first-route tax; bundling box absent). |
| Re-enabling nearby without new APK proof | **Forbidden until crash verified fixed** on a rebuild with kill-switch off path tested first. |

---

## 1. Engagement features — decisions + status

### Locked decisions

| # | Decision |
|---|----------|
| 1 | **No guest awards** — login required for discovery points |
| 2 | Default **1 pt**, admin-editable (Rewards settings on web admin) |
| 3 | **Expo customer UX first**; web admin for settings + per-store stock |
| 4 | Discovery: first view of **product / post / promo** awards points + **strong ceremony** |
| 5 | Posts/promos award via **linked-products** opens from Home/Highlights (not new detail routes) |
| 6 | Nearby wishlist stock: **1.5 km**, **push + inbox**, **7-day cooldown**, **Always** location |
| 7 | Nearby: **NO in-app ceremony** |
| 8 | Stock source = **per-store** `store_product_stock` (not product-editor `stock_place` text) |

### Implementation status (as of mid-record)

- Discovery points + ceremony path: implemented earlier (see 2026-09-08 QC). Home linked-products award path covered; Highlights linked-products was a known P2 FAIL on QC (confirm before claiming fixed).
- Nearby matcher / cron / prefs / admin stock: implemented earlier per plan + QC.
- **Nearby runtime on device: kill-switched OFF by default** (see §2) after APK crash correlation.

---

## 2. Nearby kill-switch (2026-09-14)

**Why:** Instant APK crash correlated with nearby feature after TaskManager / background location work.

**Mechanism:**

- Flag: `NEARBY_STOCK_ALERTS_ENABLED` from `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED`
- Must be exact string `"true"` (case-insensitive) to enable; **default OFF**
- When off: `BackgroundLocationRegistrar` **not loaded** (Providers soft/require gate); settings toggle **hidden**
- Code: `asf-customer-app/lib/nearbyStockAlerts.ts`, `components/Providers.tsx`, `components/BackgroundLocationRegistrar.tsx`, notification-settings UI

**Critical for agents / builders:**

- Kill-switch is **baked at build time** via Expo public env → **must rebuild APK** for OFF (or ON) to take effect on Simon/Stanley devices.
- Keep nearby **off** until a new APK proves cold start stable without background location registration.
- Do not “fix” by flipping env in Expo Go alone and declaring APK safe.

---

## 3. Performance work (in code / local tree)

Intent: faster cold start, less jank on first nav, clearer empty loading, fix Home feed hero image layout.

| Area | What landed (do not re-invent blindly) |
|------|----------------------------------------|
| Boot / debug logging | Tags `[boot]` / `[mem]` / `[tap]` / `[nav]` / `[prio]` |
| Priority load | **P0** first products page; **P1** windowing; **P2** focus retain + **5m TTL** (promotions, stores, claims, warranty) |
| Idle warm | Order: routes **PRELOAD** → image prefetch (**cap 10**) → catalog `loadMore` → notifications |
| Idle scheduler | `InteractionManager` → `scheduleAfterIdle` (`lib/scheduleAfterIdle`) |
| Empty loading UX | `PageLoadingSkeleton` on empty loading states |
| Bundling box | **Expo Go DEV only** — not in release APK |
| Home feed hero | `StorefrontFeedBlock` **aspectRatio** + tile-style `Image` sizing (fixes stretch → missing → grey) |
| Nav delay mental model | Data warm ≠ mount/bundle; Expo Go pays **first-route Metro tax**; PRELOAD helps but is not full APK parity |

**Backlog (optional, not started as requirement):** FlashList, New Architecture — later.

---

## 4. Deploy / crash / environment notes

| Topic | Fact |
|-------|------|
| Expo Go ≠ APK | Behavior, push, and perf differ; do not equate. |
| Push in Expo Go | WARN expected on SDK 53+; soft-fail push is intentional. |
| Resilience | Soft-fail push / `RootErrorBoundary` / `earlyCrashLog` patterns in play — preserve when editing boot. |
| Vercel | **Do not use Vercel MCP**; Stanley deploys via **git push**. |
| EAS | Account/project: **stanley12149** / **asf-customer-app** |
| API | `https://asf-2.vercel.app` |
| Uncommitted work | Mid-record assumes **local changes may not be on remote**. Always `git status` (+ diff) before EAS preview/production. |

---

## 5. Open items (next agents)

1. **Nearby stays OFF** until crash verified fixed on a **new APK** (kill-switch default).
2. **Measure remaining perf on release/preview APK**, not only Expo Go.
3. **Commit** (when Stanley asks) + **EAS preview rebuild** still needed for Simon/Stanley installable APK that includes kill-switch + perf.
4. Confirm Highlights linked-products discovery award gap (QC P2) if still open.
5. Optional backlog only: FlashList / New Arch — do not block APK ship on these.

---

## 6. Suggested next session checklist

1. `git status` / `git diff` on `asf-customer-app` (and any Next API pieces tied to engagement).
2. Confirm `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED` is **unset or not `"true"`** in EAS env for the safe rebuild.
3. EAS preview build → install → cold-start smoke (no instant crash).
4. Perf smoke on that APK (Home → Shop → PDP), ignore Expo-Go-only bundling box.
5. Only then consider a **separate** APK with nearby re-enabled for crash bisect.

---

## 7. File pointers (non-exhaustive)

- Nearby kill-switch: `asf-customer-app/lib/nearbyStockAlerts.ts`
- Conditional load: `asf-customer-app/components/Providers.tsx`
- Background location: `asf-customer-app/components/BackgroundLocationRegistrar.tsx`
- Idle helper: `asf-customer-app/lib/scheduleAfterIdle.ts`
- Skeleton: `asf-customer-app/components/PageLoadingSkeleton.tsx`
- Discovery ceremony host: `asf-customer-app/components/motion/ContentViewAwardHost.tsx`
