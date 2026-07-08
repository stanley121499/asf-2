# Expo Customer App — Multi-Language (i18n) Plan (2026)

**Project**: ASF-2 Expo customer app (`asf-customer-app/`)  
**Date**: July 8, 2026  
**Companion prompts**: `2026-07-08-expo-customer-i18n-agent-prompts.md`  
**Related (web, secondary)**: `2026-07-08-customer-i18n-plan.md` — i18n was first built for `asf-2-next`; phone/APK testing uses this Expo app instead.

---

## What We Are Doing

Port bilingual support (**Simplified Chinese + English**) into the **Expo / React Native** customer app at `asf-customer-app/`.

This is a **native Expo app** (Expo SDK 54, expo-router v6, NativeWind + inline styles). It is **not** a WebView of `asf-2-next`. Screens and strings live in RN files under `app/` and `components/`.

Two layers (same architecture as web):

| Layer | What | How |
|-------|------|-----|
| **UI strings** | Tab labels, buttons, errors, empty states, auth, checkout | JSON message files + `useTranslation()` |
| **Database content** | Product / category / brand / post names | Existing Supabase `*_translations` tables (already created + seeded) |

**Out of scope**

- `asf-staff-app` (staff Expo app)
- Admin / `asf-2-next` (web i18n remains in git stash until separately re-applied)
- Locales beyond `zh-CN` and `en`
- Persisting locale to `user_details` (**AsyncStorage only**)
- Switching ProductContext to `fetch_products_with_computed_attributes` RPC (banned — caused crashes; progress doc)

---

## Decisions (Locked)

| Decision | Choice |
|----------|--------|
| Target app | `asf-customer-app/` only |
| Locales | `zh-CN` (default), `en` |
| Preference storage | AsyncStorage key `asf_locale` |
| UI i18n | Client `LocaleProvider` + JSON (no URL locale segments) |
| DB content | Reuse live tables `product_translations`, `category_translations`, `brand_translations`, `department_translations`, `range_translations`, `post_translations` |
| Product fetch | Keep **direct** `supabase.from("products").select(...)`; overlay EN via `ContentTranslationContext` |
| JSON key trees | Reuse namespaces from web stash (`nav`, `cart`, `settings`, …) for alignment |
| Canonical base-table language | Chinese (or bilingual Chinese+English labels already in base names) |

---

## App Understanding (Current State)

### Route tree (29 routes)

```
app/
  _layout.tsx                    # fonts, AppProviders, maintenance, SplashIntro
  index.tsx                      # auth gate
  cart.tsx / wishlist.tsx
  (auth)/ sign-in | sign-up | forgot-password
  (tabs)/
    _layout.tsx                  # 首页 / 购物 / 精选 / 门店 / 我的
    index.tsx                    # Home
    highlights.tsx / locations.tsx
    browse/ index.tsx | [productId].tsx
    profile/
      index.tsx                  # hub — language picker goes here
      account.tsx | notifications.tsx | rewards.tsx | highlights.tsx
      orders/ index.tsx | [orderId].tsx
      support/ index.tsx
  checkout/ index.tsx | payment.tsx | success.tsx
```

### Provider tree today (`components/Providers.tsx`)

```
StripeProvider → AuthProvider → FeatureFlagsProvider → AlertProvider → RouteContextBundle
```

`RouteContextBundle` nests Announcement → Brand → Department → Range → Category → … → Product → (flagged) Post → Cart → Order → Wishlist → StoreLocation → Promotion → Notification.

Support mounts `TicketProvider` + `ConversationProvider` only under `profile/support/_layout.tsx`.

### String landscape

- ~365 lines of hardcoded Simplified Chinese across screens/components
- Auth split: **sign-in Chinese**, **sign-up / forgot-password mostly English** — unify via `t()`
- Interim `CATEGORY_NAMES` maps on Home + Browse (English DB name → Chinese display) — remove after ContentTranslation wires
- Context English alerts (`"Failed to fetch products"`) — map via `errorMap` / `t("errors.*")`
- `lib/relativeTime.ts` is Chinese-only (`formatRelativeTimeZh`)

### AsyncStorage keys already in use

| Key | Purpose |
|-----|---------|
| Supabase auth (via client) | Session |
| `onboarding_v1_done` | Onboarding |
| `asf-dismissed-announcements` | Announcements |
| `liked_posts` / `saved_posts` | Demo likes/saves |
| **`asf_locale` (new)** | Locale preference |

### DB (already applied on `gswszoljvafugtdikimn`)

Verified 2026-07-08 via Supabase MCP:

- Translation tables exist + RLS SELECT for anon/authenticated
- English rows seeded for live minimart catalog: 20 products, 4 categories, 7 brands, 6 departments, 11 ranges, 6 posts
- Locale-aware RPC exists on server but **Expo must not call it** for ProductContext

---

## Architecture (Expo)

### UI i18n

```
asf-customer-app/
  i18n/
    types.ts
    format.ts
    errorMap.ts
    resolveContent.ts
    locales/zh-CN.json
    locales/en.json
  context/
    LocaleContext.tsx          # AsyncStorage + useTranslation()
    ContentTranslationContext.tsx
```

**`t()` API**: same as web — `t("nav.home")`, `{param}` interpolation, missing-key warn in `__DEV__`.

**Provider placement**

```
StripeProvider
  AuthProvider
    FeatureFlagsProvider
      AlertProvider
        LocaleProvider                 ← ADD
          ContentTranslationProvider   ← ADD (inside Locale)
            RouteContextBundle
```

Update `components/Providers.tsx`.

### Content overlay (no RPC)

When `locale === "en"`, `ContentTranslationContext` batch-fetches:

```
product_translations, category_translations, brand_translations,
department_translations, range_translations, post_translations
WHERE locale = 'en'
```

Expose helpers:

- `translateProduct(id, field, base)`
- `translateCategory(id, baseName)`
- … brand / department / range / post

Use `resolveField(locale, base, translated)`: `zh-CN` → base; `en` → translated ?? base.

Screens that render product/category/post **names from context or local state** must call these helpers (Home, Browse, PDP, ProductCard, Highlights, Cart line items if name comes from product row).

### Language picker UX

On **Profile hub** (`app/(tabs)/profile/index.tsx`):

- Menu row: `t("settings.language")` showing `t("settings.languageZh")` or `t("settings.languageEn")`
- Modal / bottom sheet: 简体中文 | English
- `setLocale(...)` → AsyncStorage + re-render
- Available for guest and logged-in users

### Types

Add translation table Row types to `asf-customer-app/database.types.ts` if missing (copy from web / SQL).

---

## Updated Language Rule

**No hardcoded user-visible UI strings** in `asf-customer-app` customer screens/components. All labels/buttons/errors/empty states use `t("key")`. Default locale `zh-CN`. Database display names use translation helpers when locale is `en`.

---

## Hard Constraints

| Constraint | Details |
|------------|---------|
| **Expo SDK 54** | Keep compatible; AsyncStorage `^2.2.0`; `legacy-peer-deps` |
| **No ProductContext RPC** | Direct selects only |
| **No Buy Now** | Only add-to-bag flow |
| **TypeScript** | No `any`, no `!`, no `as unknown as T`. Double quotes. Complete files. |
| **Theme** | Use `constants/theme.ts` (`colors.accent` `#C9A96E`, etc.) |
| **Feature flags** | Don’t break gated modules (highlights, rewards, wishlist, store_locations, promotions) |
| **Touch / type** | Prefer ≥16px body text; spacious touch targets |
| **Scope** | `asf-customer-app` only |

---

## Implementation Phases

| Phase | Agent | Scope | Est. complexity |
|-------|-------|-------|-----------------|
| 1 | Agent 1 | Foundation: i18n modules, LocaleProvider (AsyncStorage), stub ContentTranslation, wire Providers | Medium |
| 2 | Agent 2 | Tabs + Profile language picker | Small–Medium |
| 3 | Agent 3 | Shared components + relativeTime + distance helpers | Medium |
| 4 | Agent 4 | Home + Highlights + Locations | Medium |
| 5 | Agent 5 | Browse + Product detail | Medium |
| 6 | Agent 6 | Cart + Checkout + Payment + Success | Large string volume |
| 7 | Agent 7 | Wishlist + Orders | Medium |
| 8 | Agent 8 | Profile remainder + Auth (unify ZH/EN) + Account | Medium–Large |
| 9 | Agent 9 | ContentTranslation live + type tables + drop CATEGORY_NAMES | Medium |
| 10 | Agent 10 | Context alert strings, maintenance copy, final grep + `tsc` | Medium |

**Dependency**

```
1 ──► 2─8 (UI migration; 2 before other UI preferred)
1 ──► 9 (DB overlay) ──► 10
```

Serial recommendation: **1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10**.

**Skip vs web program**

- No SQL agent (tables + EN seed already on Supabase)
- No RPC agent (forbidden for Expo ProductContext)
- No `LocaleHtmlLang` / root `<html lang>`

---

## JSON Namespaces (reuse web trees)

```
common, nav, settings, alerts, errors, search, onboarding,
home, highlights, catalog, filter, product, cart, checkout,
points, wishlist, orders, orderSuccess, notifications,
rewards, support, faq, auth, review, post, video
```

**Expo-only keys to add** (extend both JSON files as needed):

```
nav.locations          # 门店 / Stores
locations.*            # store finder strings
profile.account.*      # if account strings differ from web settings
auth.forgot.*          # forgotten-password flow
```

---

## Reuse From Web Stash

Working tree currently has **no** i18n source under `asf-2-next` (stashed). Agents should:

1. Prefer extracting from `git stash` trees (`stash@{1}^3:asf-2-next/src/i18n/...`, `LocaleContext.tsx`, `ContentTranslationContext.tsx`) **and** adapting AsyncStorage, **or**
2. Recreate from this plan + prompts using identical key names

Do **not** leave Expo depending on `asf-2-next` imports at runtime — copy into `asf-customer-app/i18n` and `asf-customer-app/context`.

---

## Verification Checklist (Agent 10)

- [ ] `cd asf-customer-app && npx tsc --noEmit` clean
- [ ] Clear `asf_locale` → Chinese UI
- [ ] Profile → Language → English → tabs + screens switch
- [ ] Preference survives app kill (AsyncStorage)
- [ ] EN mode shows English product/category names from DB (with seed applied)
- [ ] Missing translation falls back to base Chinese (no blank titles)
- [ ] No leftover `CATEGORY_NAMES` in Home/Browse
- [ ] Sign-up / forgot-password no longer hardcode English-only UI
- [ ] Feature-flagged tabs still mount correctly when enabled

---

## Related Sources

- `asf-vault/raw/sources/2026-04-25-mobile-apps-progress.md` — Expo architecture, no-RPC rule
- `asf-vault/raw/sources/2026-07-08-customer-i18n-plan.md` — original web plan (concepts)
- `docs/sql/CUSTOMER_I18N_TRANSLATION_TABLES.sql` — table DDL (already applied)
- `docs/sql/CUSTOMER_I18N_SEED_EN.sql` — seed reference (live catalog may already be applied)
- Web i18n WIP: git stashes `wip: customer i18n in asf-2-next*`
