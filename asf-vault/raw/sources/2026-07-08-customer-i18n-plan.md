# Customer App — Multi-Language (i18n) Plan (2026)

**Project**: ASF-2 Next.js customer app (`asf-2-next/`)  
**Date**: July 2026  
**Companion prompts**: `2026-07-08-customer-i18n-agent-prompts.md`  
**Supersedes**: The language constraint in `docs/CUSTOMER_REDESIGN_PLAN_2026.md` (see [Updated language rule](#updated-language-rule))

---

## What We Are Doing

Add **bilingual support (Simplified Chinese + English)** to the customer-facing Next.js app. The app runs inside a **mobile WebView** — locale is a user preference, not a URL segment.

Two layers:

| Layer | What | How |
|-------|------|-----|
| **UI strings** | Nav labels, buttons, errors, empty states, toasts, FAQ | JSON message files + `useTranslation()` hook |
| **Database content** | Product names, descriptions, categories, brands, posts, etc. | Supabase **translation tables** joined at fetch time |

**Out of scope for this program**

- Admin panel translation UI (admin can seed via SQL for now)
- Locales beyond `zh-CN` and `en`
- Persisting locale to `user_details` or Supabase ( **`localStorage` only** for now)
- Admin routes, analytics, stocks, orders admin pages

---

## Decisions (Locked)

| Decision | Choice |
|----------|--------|
| Locales | `zh-CN` (default), `en` |
| Default locale | `zh-CN` |
| UI i18n approach | Client-side `LocaleProvider` + JSON files (no `[locale]` URL prefix) |
| Preference storage | `localStorage` key `asf_locale` |
| DB content | Separate translation tables per entity |
| Canonical language in base tables | `zh-CN` — `products.name`, `categories.name`, etc. remain Chinese |
| English content | Rows in `*_translations` tables with `locale = 'en'` |
| Fallback | If no English translation exists, show the base-table (Chinese) value |

---

## Updated Language Rule

**Old rule** (CUSTOMER_REDESIGN_PLAN_2026): *100% Simplified Chinese — any English string = bug.*

**New rule**: *No hardcoded user-visible UI strings in customer code. All UI text must come from `src/i18n/locales/{locale}.json` via `t("key")`. When `zh-CN` is selected, the UI must be Chinese; when `en` is selected, the UI must be English. Raw Supabase error strings must still be mapped to translated plain-language messages.*

Database content (product names, etc.) is **not** in JSON files — it comes from translation tables.

---

## Hard Constraints (Apply to Every Agent)

These carry over from the customer redesign and still apply:

| Constraint | Details |
|------------|---------|
| **WebView navigation** | Never `router.back()`. Use explicit `router.push('/target')`. Every screen needs a visible exit. |
| **No Buy Now** | No 「立即购买」 / Buy Now — only 「加入购物袋」 / Add to bag flow. |
| **Touch targets** | Minimum 56×56px. Bottom nav 64px height. |
| **Font sizes** | Body ≥ 16px. Secondary labels ≥ 14px. |
| **Icon labels** | Bottom nav shows text labels in the active locale below icons. |
| **No silent deletes** | Cart/wishlist removal shows undo toast (translated). |
| **Loading states** | Skeleton or spinner with translated loading text — never blank screen. |
| **TypeScript** | No `any`, no `!`, no `as unknown as T`. Double quotes for strings. Complete files only. |
| **Scope** | Only touch customer-facing routes and shared components they use. Do not refactor admin pages. |

---

## Tech Stack (Relevant)

- **Framework**: Next.js 14 App Router (`asf-2-next/`)
- **Styling**: Tailwind CSS + design tokens from customer redesign (`--color-accent`, etc.)
- **Backend**: Supabase (Postgres + Auth)
- **State**: React Context (`src/context/`)
- **Customer route group**: `src/app/(customer)/`
- **Auth routes** (customer-branded): `src/app/authentication/`
- **Context bundle**: `SlimLandingContextBundle` in `src/context/RouteContextBundles.tsx`

---

## Architecture

### UI i18n

```
src/i18n/
  types.ts              # Locale type, message key helpers
  format.ts             # formatDate(locale, iso), formatNumber(locale, n)
  locales/
    zh-CN.json          # Nested keys: nav.home, cart.title, errors.invalidCredentials
    en.json
src/context/
  LocaleContext.tsx     # Provider, useLocale(), useTranslation() → t("key")
```

**Provider placement**

1. `LocaleProvider` wraps customer content inside `(customer)/layout.tsx` (inside `SlimLandingContextBundle`).
2. A thin `LocaleHtmlLang` client component updates `document.documentElement.lang` when locale changes.
3. Auth pages (`/authentication/*`) must also be wrapped — add `LocaleProvider` in a shared auth layout or each auth page's parent.

**`useTranslation()` API**

```tsx
const { t, locale, setLocale } = useTranslation();
t("nav.home");           // "首页" | "Home"
t("cart.itemCount", { count: 3 }); // if interpolation needed
```

**localStorage**

- Key: `asf_locale`
- Values: `"zh-CN"` | `"en"`
- On first visit (no key): default `"zh-CN"`
- Invalid stored value: reset to `"zh-CN"`

### Database content i18n

**New tables** (all include `locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en'))` and `UNIQUE (parent_id, locale)`):

| Table | Parent FK | Translated fields |
|-------|-----------|-------------------|
| `product_translations` | `product_id → products.id` | `name`, `description`, `warranty_description`, `warranty_period` |
| `category_translations` | `category_id → categories.id` | `name` |
| `brand_translations` | `brand_id → brand.id` | `name` |
| `department_translations` | `department_id → departments.id` | `name` |
| `range_translations` | `range_id → ranges.id` | `name` |
| `post_translations` | `post_id → posts.id` | `name`, `caption`, `cta_text` |

**RLS**: Enable RLS; allow `SELECT` for `anon` and `authenticated` (same as parent tables). No write policies for customers.

**Resolution helper** (`src/i18n/resolveContent.ts`)

```ts
resolveField(locale, baseValue, translationValue): string
// zh-CN → baseValue
// en → translationValue ?? baseValue (fallback)
```

**ContentTranslationProvider** (`src/context/ContentTranslationContext.tsx`)

- On mount and when `locale` changes, batch-fetch translation rows for `en` only (when `zh-CN`, skip fetch — use base tables).
- Expose: `getProductTranslation(id)`, `getCategoryTranslation(id)`, etc.
- Used by client components to overlay display names on server-fetched props.

### Server vs client data fetching

Some customer pages fetch on the **server** (`page.tsx`):

- `src/app/(customer)/page.tsx` — home
- `src/app/(customer)/product-section/[[...categoryId]]/page.tsx` — catalog

These cannot read `localStorage`. Strategy:

1. **SSR defaults to `zh-CN`** (matches default locale) — acceptable first paint.
2. **Client components** apply English overlays from `ContentTranslationContext` after hydration when `locale === "en"`.
3. **Context providers** (`ProductContext`, `CategoryContext`, etc.) re-fetch or re-map when locale changes:
   - Update `fetch_products_with_computed_attributes` RPC to accept `p_locale TEXT DEFAULT 'zh-CN'`.
   - Client contexts call RPC with current locale from `useLocale()`.

Remove the temporary `CATEGORY_NAMES` client-side maps in:

- `src/app/(customer)/_components/HomePageClient.tsx`
- `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx`

### RPC change

Update `fetch_products_with_computed_attributes(p_locale TEXT DEFAULT 'zh-CN')` to:

- Join `product_translations` for the requested locale on `name`, `description`, `warranty_*`.
- Join `category_translations` inside the `product_categories` JSON aggregation.
- Fallback to base `products` / `categories` columns when translation row is missing.

SQL files live in `docs/sql/` (create new `CUSTOMER_I18N_*.sql` files).

### Seed data

Reference `temp/translation_migration.md` for existing Chinese content in base tables.

Seed English rows in translation tables for demo products/categories/posts. Agent 9 provides the SQL. Admin-entered English can be added later via SQL Editor.

---

## Language Picker (Settings)

Per customer redesign spec — now **fully functional** (not demo / not grayed out):

- Row in Settings → 「语言」/ "Language"
- Bottom sheet: 「简体中文」 and 「English」
- Selecting a locale calls `setLocale()`, persists to `localStorage`, re-renders app
- Remove any 「即将推出」 badge on English

---

## Customer Files Inventory

### UI string migration targets (~32 files)

**Layouts & infra (Agent 1)**

- `src/app/(customer)/layout.tsx`
- `src/app/layout.tsx` (or `LocaleHtmlLang` only)
- New: `src/i18n/*`, `src/context/LocaleContext.tsx`

**Shared components (Agents 2–3)**

- `src/components/home/bottom-nav.tsx`
- `src/components/navbar-home.tsx`
- `src/components/SearchOverlay.tsx`
- `src/components/OnboardingOverlay.tsx`
- `src/components/AnnouncementBottomSheet.tsx`
- `src/components/AlertComponent.tsx` (if customer toasts use hardcoded text)
- `src/components/home/ProductCard.tsx`
- `src/components/home/HomeHighlightsCard.tsx`
- `src/components/PostCard.tsx`
- `src/components/VideoLightboxModal.tsx`
- `src/components/ReviewsList.tsx`
- `src/components/ReviewModal.tsx`
- `src/components/stripe/OrderSuccess.tsx`

**Customer pages (Agents 4–8)**

- `src/app/(customer)/_components/HomePageClient.tsx`
- `src/app/(customer)/highlights/_components/HighlightsClient.tsx`
- `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx`
- `src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`
- `src/app/(customer)/cart/page.tsx`
- `src/app/(customer)/checkout/page.tsx`
- `src/app/(customer)/checkout/_components/CheckoutStripePayment.tsx`
- `src/app/(customer)/wishlist/page.tsx`
- `src/app/(customer)/order-details/page.tsx`
- `src/app/(customer)/order-details/[orderId]/page.tsx`
- `src/app/(customer)/settings/page.tsx`
- `src/app/(customer)/settings/components/OrdersList.tsx`
- `src/app/(customer)/notifications/page.tsx`
- `src/app/(customer)/rewards/_components/RewardsClient.tsx`
- `src/app/(customer)/support-chat/page.tsx`
- `src/app/order-success/page.tsx`

**Auth pages (Agent 8)**

- `src/app/authentication/sign-in/page.tsx`
- `src/app/authentication/sign-up/page.tsx`
- `src/app/authentication/forgot-password/page.tsx`
- `src/app/authentication/reset-password/page.tsx`

### DB / context targets (Agents 9–10)

- New SQL: `docs/sql/CUSTOMER_I18N_TRANSLATION_TABLES.sql`
- New SQL: `docs/sql/CUSTOMER_I18N_SEED_EN.sql`
- New SQL: `docs/sql/CUSTOMER_I18N_FETCH_PRODUCTS_RPC.sql`
- `asf-2-next/src/database.types.ts` — add translation table types
- `src/context/ContentTranslationContext.tsx` — new
- `src/context/RouteContextBundles.tsx` — add providers
- `src/context/product/ProductContext.tsx`
- `src/context/product/CategoryContext.tsx`
- `src/context/product/BrandContext.tsx`
- `src/context/product/DepartmentContext.tsx`
- `src/context/product/RangeContext.tsx`
- `src/context/post/PostContext.tsx`

### Doc update (Agent 11)

- `docs/CUSTOMER_REDESIGN_PLAN_2026.md` — replace language constraint row with new i18n rule

---

## Implementation Phases

| Phase | Agent | Scope | Est. files |
|-------|-------|-------|------------|
| 1 | Agent 1 | i18n foundation (provider, JSON scaffold, layout wiring) | ~8 new + 2 edited |
| 2 | Agent 2 | Shared nav + alerts + settings language picker | ~5 edited |
| 3 | Agent 3 | Overlay & social components | ~6 edited |
| 4 | Agent 4 | Home + Highlights | ~3 edited |
| 5 | Agent 5 | Product section + product details + ProductCard | ~4 edited |
| 6 | Agent 6 | Cart + checkout | ~3 edited |
| 7 | Agent 7 | Wishlist + orders + order success | ~5 edited |
| 8 | Agent 8 | Settings (remaining strings) + notifications + rewards + support + auth | ~8 edited |
| 9 | Agent 9 | DB translation tables + seed SQL + types | SQL + types |
| 10 | Agent 10 | RPC update + ContentTranslationContext + context locale wiring | ~8 edited |
| 11 | Agent 11 | Final sweep, remove hacks, update redesign doc, `tsc` | verification |

**Dependency order**

```
Agent 1 (foundation) ──┬──► Agents 2–8 (UI migration, any order after 1, but 2 before 3+)
                       │
                       └──► Agent 9 (DB) ──► Agent 10 (context/RPC) ──► Agent 11 (sweep)
```

Agents 2–8 can run in parallel after Agent 1, but **Agent 9 must complete before Agent 10**, and **Agent 10 before Agent 11**.

Recommended serial order for one operator: **1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11**.

---

## JSON Key Naming Convention

Use nested namespaces matching screen or component:

```
common.loading
common.undo
common.save
nav.home
nav.shop
nav.highlights
nav.wishlist
nav.profile
home.heroCta
home.categories
cart.title
cart.empty
cart.checkout
product.addToBag
product.outOfStock
settings.language
settings.languageZh
settings.languageEn
errors.invalidCredentials
errors.networkError
auth.signIn.title
auth.signUp.title
```

Both locale files **must have identical key trees**. Missing key in one locale = build-time or runtime console warning (implement a simple dev-only check in `t()`).

---

## Error Message Mapping

Keep the existing pattern from the redesign — map Supabase/auth errors to translation keys:

| Supabase / auth error | Key | zh-CN | en |
|-----------------------|-----|-------|-----|
| `Invalid login credentials` | `errors.invalidCredentials` | 邮箱或密码不正确，请重试 | Incorrect email or password. Please try again. |

Add mappings in a small `src/i18n/errorMap.ts` that returns a key from a raw error string.

---

## Verification Checklist (Agent 11)

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes (or only pre-existing issues)
- [ ] Settings language toggle switches all UI strings on every customer screen
- [ ] `localStorage.asf_locale` persists across refresh
- [ ] Default (cleared storage) shows Chinese
- [ ] English mode shows English UI strings
- [ ] Product/category names show English when translation rows exist
- [ ] Missing English translation falls back to Chinese name (no blank labels)
- [ ] No `CATEGORY_NAMES` hacks remain
- [ ] `<html lang>` reflects active locale
- [ ] `docs/CUSTOMER_REDESIGN_PLAN_2026.md` language row updated
- [ ] No hardcoded Chinese/English UI strings left in migrated customer files (grep audit)

---

## Related Sources

- `docs/CUSTOMER_REDESIGN_PLAN_2026.md` — design system, WebView constraints (language row superseded)
- `docs/CUSTOMER_REDESIGN_AGENT_PROMPTS_2026.md` — settings language picker UX spec (Agent 10 section)
- `temp/translation_migration.md` — Chinese content already applied to base tables
- `docs/sql/UPDATE_FETCH_PRODUCTS_RPC.sql` — current RPC to extend
