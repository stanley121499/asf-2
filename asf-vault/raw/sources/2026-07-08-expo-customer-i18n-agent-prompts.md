# Expo Customer App — Multi-Language (i18n) Agent Prompts (2026)

Run agents **in order** (1 → 10). Each builds on the previous.

**Before every agent**, read:

1. `asf-vault/raw/sources/2026-07-08-expo-customer-i18n-plan.md`
2. This file — the AGENT N section only
3. Skim `asf-vault/raw/sources/2026-04-25-mobile-apps-progress.md` for Expo constraints (especially: **no ProductContext RPC**)

**Project root for all edits**: `asf-customer-app/`  
**Repo root**: `/Users/stanley/Documents/GIthub/asf-2`

---

## SHARED CONTEXT (Read before every agent)

**Stack**: Expo SDK ~54, expo-router ~6, React Native 0.81, NativeWind 4 + heavy inline styles, TypeScript strict, Supabase JS, AsyncStorage, Stripe React Native PaymentSheet.

**Locales**: `zh-CN` (default), `en` only.

**Storage**: AsyncStorage key `asf_locale`. Never use `localStorage` / `window`.

**UI rule**: No hardcoded user-visible strings. Use `t("namespace.key")` from `useTranslation()`.

**DB rule**: Product/category/etc. display names overlay from `*_translations` via `ContentTranslationContext` (Agent 9). Until then base table values are OK. **Do not** call `fetch_products_with_computed_attributes`.

**Non-negotiable**:
- No `any`, no `!` non-null assertion, no `as unknown as T`
- Double quotes for all strings
- Complete files only — no `// ... rest of code`
- Prefer explicit `router.push("/path")` over ambiguous back navigation when adding CTAs
- No Buy Now — only add-to-bag
- Keep feature-flag gates intact
- Run `cd asf-customer-app && npx tsc --noEmit` at end; fix errors before declaring done
- **Scope**: only `asf-customer-app/` (plus optional docs/sql references). Do not modify `asf-staff-app` or re-apply web stash unless asked

**Theme**: `constants/theme.ts` — `colors.bg`, `colors.text`, `colors.panel`, `colors.accent` (`#C9A96E`), `colors.danger`, `colors.muted`, `colors.border`.

**Fonts**: `PlayfairDisplay_400Regular` (display), `Inter_400Regular` (body).

**Reuse**: JSON key trees should match the web i18n namespaces (`nav`, `cart`, `settings`, …). You may copy implementations from git stash trees:
- `stash@{1}^3:asf-2-next/src/i18n/*`
- `stash@{1}^3:asf-2-next/src/context/LocaleContext.tsx`
- `stash@{1}^3:asf-2-next/src/context/ContentTranslationContext.tsx`

Adapt storage to AsyncStorage and remove any DOM/`document`/`window` code.

**DB status**: Translation tables + English seed + RPC already applied on project `gswszoljvafugtdikimn`. Agents verify/use; do not re-run SQL unless verifying.

---

## AGENT 1 — i18n Foundation (Expo)

**Goal**: Scaffold locale infrastructure inside Expo. No full screen migrations yet.

**Create**:
- `i18n/types.ts` — `Locale`, `DEFAULT_LOCALE`, `LOCALE_STORAGE_KEY = "asf_locale"`, `SUPPORTED_LOCALES`
- `i18n/format.ts` — `formatDate`, `formatNumber` via `Intl` (Hermes-safe)
- `i18n/errorMap.ts` — `getErrorTranslationKey(raw)`
- `i18n/resolveContent.ts` — `resolveField(locale, base, translated)`
- `i18n/locales/zh-CN.json` — seed at least `common`, `nav` (include `nav.locations`), `errors`, `settings.language*`
- `i18n/locales/en.json` — matching keys
- `context/LocaleContext.tsx` — AsyncStorage load/save; `useLocale()`, `useTranslation()` with `{param}` interpolation
- `context/ContentTranslationContext.tsx` — stub pass-through + empty getters until Agent 9

**Edit**:
- `components/Providers.tsx` — wrap with `LocaleProvider` → `ContentTranslationProvider` around `RouteContextBundle` (order: Locale outside ContentTranslation)

**Do NOT** migrate screen strings yet (except if needed to compile).

**Verification**: `npx tsc --noEmit`. App boots; toggling locale via a temporary console/dev call is optional. Document for Agent 2: language picker not yet in UI.

**Handoff**: Agent 2 can use `t("nav.*")` and `setLocale`.

---

## AGENT 2 — Tabs + Profile Language Picker

**Depends on**: Agent 1

**Edit**:
- `app/(tabs)/_layout.tsx` — tab titles via `t("nav.home|shop|highlights|locations|profile")`
- `app/(tabs)/profile/index.tsx` — language row + Modal selector (`setLocale`); translate sticky header / guest CTA / menu labels that are clearly hub chrome (`settings.*` / `nav.*` keys). Prefer adding keys rather than inventing one-offs.

**Extend JSON**: `settings.language`, `settings.languageZh`, `settings.languageEn`, `settings.selectLanguage`, `settings.preferences`, `nav.locations`

**UX**:
- Language row visible for guest and logged-in
- Modal options: 简体中文 / English (both selectable — no “coming soon”)
- Persist via Agent 1 AsyncStorage

**Verification**: Switch language → tab labels flip. `tsc` clean.

**Handoff**: Agent 3+ migrate remaining profile strings; do not remove language picker.

---

## AGENT 3 — Shared Components & Helpers

**Depends on**: Agent 1

**Edit**:
- `components/OnboardingOverlay.tsx`
- `components/OrderProgressTracker.tsx`
- `components/OrderStatusBadge.tsx`
- `components/ProductCard.tsx` (UI chrome only — product **name** overlay can wait for Agent 9 if awkward)
- `components/ChatWindow.tsx` (visible chrome strings)
- `components/AlertBanner.tsx` / any hardcoded dismiss strings
- `components/AnnouncementBanner.tsx`
- `components/NotificationRow.tsx` (chrome, not DB title/body)
- `components/SubPageHeader.tsx` if it has default titles
- `lib/relativeTime.ts` — locale-aware relative time (rename/generalize; accept `Locale`)
- `lib/storeLocationDistance.ts` — distance labels (`最近`, `100 m 内`, etc.)

**JSON**: `onboarding.*`, `orders.status*`, `orders.timeline*`, `post.*` (like/comment chrome), `common.*`, `locations.*` distance fragments, `announcement.*`

**Verification**: `tsc` clean. No behavior changes.

---

## AGENT 4 — Home + Highlights + Locations

**Depends on**: Agent 1

**Edit**:
- `app/(tabs)/index.tsx` — section titles, CTAs, empty states; keep interim `CATEGORY_NAMES` but locale-aware (`zh-CN` map, `en` raw name) until Agent 9
- `app/(tabs)/highlights.tsx`
- `app/(tabs)/profile/highlights.tsx`
- `app/(tabs)/locations.tsx`

**JSON**: `home.*`, `highlights.*`, `locations.*`

**Verification**: Screens render both locales. `tsc` clean.

---

## AGENT 5 — Browse + Product Detail

**Depends on**: Agent 1

**Edit**:
- `app/(tabs)/browse/index.tsx` — search placeholder, sort, empty, filters, same `CATEGORY_NAMES` interim pattern as Home
- `app/(tabs)/browse/[productId].tsx` — size/color, stock, add-to-bag, accordion labels, validation messages

**JSON**: `catalog.*`, `filter.*`, `product.*`, `search.placeholder`

**Do not** change ProductContext fetch strategy.

**Verification**: Browse + PDP in both locales. `tsc` clean.

---

## AGENT 6 — Cart + Checkout + Payment + Success

**Depends on**: Agent 1

**Edit**:
- `app/cart.tsx`
- `app/checkout/index.tsx`
- `app/checkout/payment.tsx`
- `app/checkout/success.tsx`
- `lib/checkoutApi.ts` — only if user-visible reason strings are composed there (map API reasons → keys)

**JSON**: `cart.*`, `checkout.*`, `points.*`, `orderSuccess.*`

Largest string volume — stay focused on these files only.

**Verification**: Walk cart → checkout → success string coverage in both locales. `tsc` clean.

---

## AGENT 7 — Wishlist + Orders

**Depends on**: Agent 1

**Edit**:
- `app/wishlist.tsx`
- `app/(tabs)/profile/orders/index.tsx`
- `app/(tabs)/profile/orders/[orderId].tsx`

**JSON**: `wishlist.*`, `orders.*`

Use `formatDate(locale, …)` for date displays.

**Verification**: `tsc` clean.

---

## AGENT 8 — Profile Remainder + Auth

**Depends on**: Agents 1–2 (do not break language picker)

**Edit**:
- `app/(tabs)/profile/index.tsx` — remaining strings not done in Agent 2
- `app/(tabs)/profile/account.tsx`
- `app/(tabs)/profile/notifications.tsx`
- `app/(tabs)/profile/rewards.tsx`
- `app/(tabs)/profile/support/index.tsx`
- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx` — currently English; move to `t("auth.*")`
- `app/(auth)/forgot-password.tsx` — same
- `app/_layout.tsx` — maintenance screen copy (`系统维护中` …)

**JSON**: `settings.*`, `notifications.*`, `rewards.*`, `support.*`, `faq.*` (if any), `auth.*`

Auth error mapping via `getErrorTranslationKey` + `t("errors.*")`.

**Verification**: Auth screens + profile subpages both locales. `tsc` clean.

---

## AGENT 9 — ContentTranslation Live Overlay

**Depends on**: Agents 1 (and preferably UI agents mostly done)

**Goal**: Wire real DB translation overlays. **No RPC.**

**Edit / implement**:
- Replace stub `context/ContentTranslationContext.tsx` with batch fetch of EN rows from six translation tables when `locale === "en"`
- Add table types to `database.types.ts` if missing
- Wire display sites:
  - `app/(tabs)/index.tsx` — categories + product titles via helpers; **delete `CATEGORY_NAMES`**
  - `app/(tabs)/browse/index.tsx` — same
  - `app/(tabs)/browse/[productId].tsx` — name/description
  - `components/ProductCard.tsx` — name
  - Highlights/posts caption/CTA if rendered from post fields
  - Cart line item titles if sourced from product rows

Helpers must use `resolveField`. Graceful empty maps if tables missing (dev warn).

**Optional**: Overlay inside CategoryContext/PostContext name fields on locale change — only if cleaner than per-screen helpers; keep ProductContext select unchanged.

**Verification**: With EN locale, product “Coca-Cola Classic” etc. appear. `tsc` clean. `CATEGORY_NAMES` gone.

---

## AGENT 10 — Final Sweep

**Depends on**: Agents 1–9

**Tasks**:
1. Grep `asf-customer-app` for Han characters in user-visible `Text` / string literals outside `i18n/locales/` and comments
2. Grep for leftover English UI in auth/checkout (“Create account”, “Loading”, “Submit”) outside JSON
3. Map context English alerts (`ProductContext`, `CartContext`, …) through `t`/`errorMap` where customer-visible
4. Confirm language picker + AsyncStorage persistence
5. `npx tsc --noEmit`
6. Document remaining gaps (e.g. Stripe native sheet system language, DB notification titles)

Do not expand into staff app.

**Verification checklist** (reply with status):
- [ ] Default Chinese
- [ ] English UI chrome
- [ ] English product names
- [ ] Fallback without crash
- [ ] `tsc` clean

---

## Parallelization Guide

| After Agent 1 | Serial |
|---------------|--------|
| Agents 2–8 can theoretically parallelize | Prefer serial for one operator |
| Agent 9 after 1 | Agent 9 before 10 |

**Recommended serial path**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

---

## Copy-Paste Prompt Template

```
You are implementing Expo customer i18n for ASF-2.

Read:
1. asf-vault/raw/sources/2026-07-08-expo-customer-i18n-plan.md
2. asf-vault/raw/sources/2026-07-08-expo-customer-i18n-agent-prompts.md — AGENT N only

Workspace: asf-customer-app/ under repo asf-2.

Execute AGENT N only. Follow SHARED CONTEXT.
Do NOT use fetch_products_with_computed_attributes.
Persist locale with AsyncStorage key asf_locale.
Run: cd asf-customer-app && npx tsc --noEmit
```

Replace `N` with 1–10.
