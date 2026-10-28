# Expo Customer App — APK Crash + UI Polish Mid-Record (2026-09-28)

**Date**: 2026-09-28  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo)  
**Stakeholder**: Stanley (+ Simon for APK preview)  
**Status**: Mid-session checkpoint — **not** a final accomplishment  
**Git**: Much work may still be **local / uncommitted**. **Verify `git status` before the next EAS build.** Do not assume HEAD matches device APK.

**Treat this file as the vault source of truth** for APK crash root-cause, kill-switches, guest browse, and Home/Highlights UI polish as of 2026-09-28. Prefer this over chat memory.

**Prior mid-record (still useful; do not duplicate):** `raw/sources/2026-09-14-expo-customer-perf-engagement-mid-record.md`  
**Related plan:** `raw/sources/2026-09-08-expo-customer-engagement-discovery-points-nearby-stock-plan.md`  
**Related QC:** `raw/sources/2026-09-08-expo-customer-engagement-qc-notes.md`  
**Agent prompts:** **deleted** (raw + wiki, vault-wide `*agent-prompts*`) — do **not** re-create or re-ingest prompt dumps.

---

## 0. Do not re-do / do not re-ingest

| Item | Guidance |
|------|----------|
| Agent prompt dumps (`*-agent-prompts.md`) | **Gone on purpose** (vault-wide). Do not recreate under `raw/` or `wiki/sources/`. |
| Reinstalling `expo-task-manager` casually | **Forbidden for APK** until a deliberate safe cold-start path exists. Autolink alone can crash. |
| Treating "JS kill-switch alone" as enough for nearby | **Wrong** — native plugins must also stay out of the binary when nearby is off. |
| Blaming instant close on Expo SDK 57 alone | **Debunked** — see §1 (Sep 5 build already SDK 57 and opened). |
| Re-enabling nearby / push without Stanley asking | Keep both **OFF** until explicit re-enable + safe TaskManager init. |
| Guest discovery awards | Still **locked no** (unchanged from Sep 14). |
| Vercel MCP for Stanley's deploy | **Do not use** — `git push` for his Vercel. |
| Assuming `expo install --fix` left deps safe | It **restored** `expo-task-manager` once — remove again if it comes back. |

---

## 1. APK crash — resolved (root cause)

### What it was not

- Instant close was **not** Expo SDK 57 alone.
- Evidence: Sep 5 build `2f931d4d` / commit `7ce176d` was already SDK 57 and **opened** normally.
- Real delta: nearby stock work from `7c34ef3`+ (TaskManager + Always / FGS location).

### What it was

- Cause: `expo-task-manager` **autolink** + Always/FGS location from the nearby stock feature.
- JS kill-switches alone are **insufficient** — the package must be removed from dependencies and plugins stripped so native code is not linked into the APK.
- After one `expo install --fix`, task-manager was **accidentally restored** → **removed again**. Do not reinstall for APK until a safe cold-start path exists.

### Working state

- Working APK after task-manager removal (package absent from `package.json` as of mid-record verify).
- Nearby OFF: `NEARBY_STOCK_ALERTS_ENABLED` / `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED` must be exact `"true"` to re-enable.
- Push also kill-switched OFF by default (`EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED` / `PUSH_NOTIFICATIONS_ENABLED`).

### Verify steps (next agents)

1. `git status` / confirm dirty tree vs last EAS upload.
2. Confirm `expo-task-manager` is **not** in `asf-customer-app/package.json` (or lockfile as a direct dep).
3. Confirm nearby + push env flags are unset / not `"true"` for the safe APK.
4. EAS preview → new native **fingerprint** (dirty `*` commit is fine; fingerprint must change for native fixes).
5. Cold-start smoke on device — no instant close.

---

## 2. Deltas since 2026-09-14 mid-record

Summarize only what changed or was clarified after Sep 14. Locked engagement product decisions (no guest awards, discovery points, nearby design) remain as in the Sep 14 / Sep 8 sources — do not re-litigate.

| Area | Delta |
|------|--------|
| Crash root cause | Confirmed native autolink (`expo-task-manager` + Always/FGS), not SDK 57; JS OFF insufficient |
| Dep hygiene | Package removed; watch for `expo install --fix` restoring it |
| Guest browse | Fixed bounce: tabs + `NavigationSync` no longer redirect signed-out users to sign-in; **checkout still gated** |
| Home hero | Starts below nav + category chrome (no bleed under chrome) |
| Category rail | Chevron left of search toggles rail (default shown); chrome height adjusts |
| Highlights | Removed 查看全部 CTA (all themes); image tap still opens linked products |
| Discovery +1 ceremony | Confetti removed; quiet side-slide banner; later sized up + hold **1275ms** (50% longer) — see `lib/motion.ts` `achievementHold` |
| Dev recovery | ExpoAsset `[runtime not ready]` → splashScreen top-level `expo-asset` import; use lazy require. Missing `expo-constants` → broken `node_modules`; `expo install --fix` then `npx expo start -c` |
| EAS | Uploads **local tree**; dirty `*` commit; fingerprint must change for native fixes |

---

## 3. Still true from Sep 14 (carry forward)

- Nearby stays **off** until deliberate re-enable + safe TaskManager init + proven cold start.
- Push stays **off** until Stanley asks to re-enable.
- Perf work (P0–P2, idle warm, skeletons, Storefront hero sizing) still relevant — measure on APK, not Expo Go alone.
- No Vercel MCP; Expo account **stanley12149** / project **asf-customer-app**.
- API still `https://asf-2.vercel.app` (unchanged context).
- Soft-fail push / RootErrorBoundary / earlyCrashLog patterns — preserve when editing boot.

---

## 4. Open items (next agents)

1. Nearby remains OFF until safe TaskManager cold-start path + new APK proof.
2. Push remains OFF until Stanley explicitly requests re-enable.
3. **Verify git** before next EAS — much work may be uncommitted.
4. Do not reinstall `expo-task-manager` casually; if `expo install --fix` restores it, remove again before APK.
5. Optional: confirm Highlights linked-products discovery award gap from Sep 8 QC if still open (not re-validated this mid-record).

---

## 5. Suggested next session checklist

1. `git status` / `git diff` on `asf-customer-app`.
2. Grep `expo-task-manager` — must be absent from deps (and not re-autolinked).
3. Confirm `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED` and `EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED` are unset / not `"true"` for the safe rebuild.
4. EAS preview → install → cold-start smoke.
5. Guest browse smoke: open tabs signed-out without landing on sign-in; checkout still requires auth.
6. Home: hero below chrome; chevron toggles category rail; Highlights has no 查看全部; discovery +1 is quiet side banner (~1275ms hold).

---

## 6. File pointers (non-exhaustive)

- Nearby kill-switch: `asf-customer-app/lib/nearbyStockAlerts.ts`
- Push kill-switch: `asf-customer-app/lib/pushNotificationsEnabled.ts`
- Conditional load: `asf-customer-app/components/Providers.tsx`
- Background location (lazy TaskManager): `asf-customer-app/lib/backgroundLocation.ts`
- Guest nav: `asf-customer-app/components/NavigationSync.tsx`
- Home chrome / category rail: `asf-customer-app/themes/storefront/screens/Home.tsx`
- Ceremony hold: `asf-customer-app/lib/motion.ts` (`achievementHold: 1275`)
- Ceremony UI: `asf-customer-app/components/motion/AchievementCeremony.tsx`
- Award host: `asf-customer-app/components/motion/ContentViewAwardHost.tsx`
