# Customer App — Multi-Language (i18n) Agent Prompts (2026)

Run agents **in order** (1 → 11). Each agent builds on previous work.

**Before every agent**, read the full plan: `asf-vault/raw/sources/2026-07-08-customer-i18n-plan.md` (or repo copy at `docs/CUSTOMER_I18N_PLAN_2026.md` if mirrored).

**Project root**: `asf-2-next/` inside the `asf-2` monorepo.

---

## SHARED CONTEXT (Read before every agent)

**Stack**: Next.js 14 App Router, TypeScript strict, Tailwind CSS, Supabase, react-icons, customer redesign design tokens.

**Locales**: `zh-CN` (default), `en` only.

**Storage**: `localStorage` key `asf_locale`. No `user_details` column. No URL locale prefix.

**UI rule**: No hardcoded user-visible strings in customer code. Use `t("namespace.key")` from `useTranslation()`.

**DB rule**: Product/category/brand/post names come from translation tables (Agent 9+). Until Agent 10 lands, keep displaying base-table values.

**Non-negotiable (carry over from customer redesign)**:
- No `any`, no `!` non-null assertion, no `as unknown as T`
- Double quotes for all strings
- Complete files only — no `// ... rest of code` placeholders
- Never `router.back()` — always `router.push('/explicit-route')`
- No Buy Now / 立即购买 — only add-to-bag flow
- Min 56×56px touch targets; bottom nav 64px
- Body text min 16px; secondary min 14px
- Map Supabase errors to `t("errors.*")` keys — never show raw error strings
- Run `npx tsc --noEmit` at end; fix all errors before declaring done
- **Customer scope only** — do not modify admin pages under `src/app/orders`, `src/app/products`, `src/app/analytics`, etc.

**Design tokens** (unchanged): `--color-bg`, `--color-text`, `--color-panel`, `--color-accent #C9A96E`, `--color-danger`, `--color-muted`, `--color-border`.

**Directory conventions** (created by Agent 1):
```
src/i18n/types.ts
src/i18n/format.ts
src/i18n/errorMap.ts
src/i18n/resolveContent.ts
src/i18n/locales/zh-CN.json
src/i18n/locales/en.json
src/context/LocaleContext.tsx
src/context/ContentTranslationContext.tsx  (stub until Agent 10)
```

---

## AGENT 1 — i18n Foundation

**Goal**: Scaffold locale infrastructure. No page migrations yet except minimal wiring.

**Files to create**:
- `src/i18n/types.ts`
- `src/i18n/format.ts`
- `src/i18n/errorMap.ts`
- `src/i18n/resolveContent.ts`
- `src/i18n/locales/zh-CN.json`
- `src/i18n/locales/en.json`
- `src/context/LocaleContext.tsx`
- `src/components/LocaleHtmlLang.tsx`

**Files to edit**:
- `src/app/(customer)/layout.tsx`
- `src/app/layout.tsx` (add `<LocaleHtmlLang />` inside body if needed)
- `src/context/RouteContextBundles.tsx` (only if auth needs bundle — see below)

**Task: `types.ts`**
```ts
export type Locale = "zh-CN" | "en";
export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_STORAGE_KEY = "asf_locale";
export const SUPPORTED_LOCALES: readonly Locale[] = ["zh-CN", "en"];
```

**Task: `LocaleContext.tsx`**
- `"use client"`
- Read `localStorage` on mount (`LOCALE_STORAGE_KEY`), validate, default `zh-CN`
- `locale`, `setLocale(loc)` — writes localStorage, updates state
- `useTranslation()` returns `{ t, locale, setLocale }`
- `t(key: string, params?: Record<string, string | number>)` — dot-path lookup in JSON; dev-only `console.warn` on missing key; simple `{name}` interpolation
- Import messages: `zh-CN.json`, `en.json`

**Task: JSON files**
Seed with **common + nav** keys only (other agents add keys):
```json
{
  "common": { "loading": "...", "undo": "...", "cancel": "...", "save": "...", "close": "..." },
  "nav": { "home": "...", "shop": "...", "highlights": "...", "wishlist": "...", "profile": "..." }
}
```
zh-CN uses current hardcoded Chinese from `bottom-nav.tsx`. en uses natural English.

**Task: `format.ts`**
- `formatDate(locale: Locale, iso: string): string`
- `formatNumber(locale: Locale, n: number): string`
Use `Intl.DateTimeFormat` / `Intl.NumberFormat`.

**Task: `errorMap.ts`**
- `getErrorTranslationKey(raw: string): string` — map known Supabase strings to `errors.*` keys
- Seed `errors.invalidCredentials` in both JSON files

**Task: `resolveContent.ts`**
- `resolveField(locale: Locale, base: string | null, translated: string | null | undefined): string`
- `zh-CN` → `base ?? ""`; `en` → `translated ?? base ?? ""`

**Task: `LocaleHtmlLang.tsx`**
- Client component; `useEffect` sets `document.documentElement.lang` to `"zh"` or `"en"`

**Task: layouts**
- Wrap `(customer)/layout.tsx` children with `<LocaleProvider>`
- Ensure auth routes get `LocaleProvider` — create `src/app/authentication/layout.tsx` with `<LocaleProvider>{children}</LocaleProvider>` if it does not exist

**Task: `ContentTranslationContext.tsx` stub**
Create a minimal stub that exports `ContentTranslationProvider` (pass-through children) and `useContentTranslation()` returning empty getters — Agent 10 fills this in.

**Do NOT** migrate page strings yet.

**Verification**: `npx tsc --noEmit`. App boots; `LocaleProvider` does not crash. Nav still shows hardcoded Chinese until Agent 2.

---

## AGENT 2 — Shared Navigation, Alerts & Settings Language Picker

**Depends on**: Agent 1

**Files to edit**:
- `src/components/home/bottom-nav.tsx`
- `src/components/navbar-home.tsx`
- `src/components/AlertComponent.tsx` (only if it contains hardcoded customer-visible strings)
- `src/context/AlertContext.tsx` (only if alert messages are composed here with hardcoded text)
- `src/app/(customer)/settings/page.tsx` (language picker section only + any nav-adjacent strings in header)

**Files to extend**:
- `src/i18n/locales/zh-CN.json` — add `settings.*`, `alerts.*` keys
- `src/i18n/locales/en.json` — mirror keys

**Task: `bottom-nav.tsx`**
Replace hardcoded labels with `t("nav.home")`, etc. Keep 5 tabs as currently implemented (首页/购物/精选/收藏/我的).

**Task: `navbar-home.tsx`**
Translate any visible strings (search aria-labels, badge tooltips if present). Do not change layout or behavior.

**Task: Settings language picker**
Add a **偏好设置** / Preferences section (or row in existing menu) per redesign spec:
- Row label: `t("settings.language")`
- Shows current locale display name (`t("settings.languageZh")` or `t("settings.languageEn")`)
- Tap opens bottom sheet with two options: 简体中文 / English
- Selecting calls `setLocale("zh-CN")` or `setLocale("en")`
- **No** 「即将推出」 badge — English must be selectable
- Use design system styles (white card, `--color-border`, 56px tap targets)

Add keys:
```
settings.language
settings.languageZh
settings.languageEn
settings.preferences
```

**Verification**: Toggle language in Settings → bottom nav labels switch. `tsc` clean.

---

## AGENT 3 — Overlay & Social Components

**Depends on**: Agent 1 (Agent 2 recommended but not blocking)

**Files to edit**:
- `src/components/SearchOverlay.tsx`
- `src/components/OnboardingOverlay.tsx`
- `src/components/AnnouncementBottomSheet.tsx`
- `src/components/PostCard.tsx`
- `src/components/VideoLightboxModal.tsx`

**JSON namespaces to add**: `search.*`, `onboarding.*`, `announcement.*`, `post.*`, `video.*`

**Task**: Replace every user-visible string with `t()`. Preserve all behavior (localStorage for recent searches, onboarding gate, dismiss logic, like/save demo).

**Onboarding**: 3 steps — translate titles, body copy, button labels (「下一步」「开始购物」etc.).

**Search**: Translate placeholder, trending label, recent label, empty state, close button.

**PostCard**: Translate comment sheet UI, like/save labels, demo placeholders.

**Verification**: Open search overlay and onboarding in both locales. `tsc` clean.

---

## AGENT 4 — Home Page & Highlights

**Depends on**: Agent 1

**Files to edit**:
- `src/app/(customer)/_components/HomePageClient.tsx`
- `src/app/(customer)/highlights/_components/HighlightsClient.tsx`
- `src/components/home/HomeHighlightsCard.tsx`

**JSON namespaces**: `home.*`, `highlights.*`

**Task: HomePageClient**
- Replace all hardcoded UI strings with `t()`
- **Keep** `CATEGORY_NAMES` map for now (removed in Agent 11 after DB translations) — but wrap display as `locale === "zh-CN" ? (CATEGORY_NAMES[cat.name] ?? cat.name) : cat.name` so English mode shows DB name until Agent 10
- Translate: hero CTA, section headings (新品/分类/精选), tier labels, empty states, points nudges

**Task: HighlightsClient + HomeHighlightsCard**
- Translate feed empty state, load more, section titles

**Verification**: Home and `/highlights` render in both locales. `tsc` clean.

---

## AGENT 5 — Product Browse & Details

**Depends on**: Agent 1

**Files to edit**:
- `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx`
- `src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`
- `src/components/home/ProductCard.tsx`

**JSON namespaces**: `product.*`, `catalog.*`, `filter.*`

**Task: ProductSectionClient**
- Translate: filter sheet, sort options, empty grid, quick-view sheet, search-within-section placeholder
- Same `CATEGORY_NAMES` interim pattern as Agent 4 (locale-aware fallback)

**Task: ProductDetailsClient**
- Translate: size/color labels, add-to-bag, out of stock, complete-the-look, warranty, reviews section headers
- Product **name/description** stay from props for now (DB layer in Agent 10)

**Task: ProductCard**
- Translate: add-to-bag toast, wishlist aria-label if visible text exists

**Verification**: Browse catalog and open a product in both locales. `tsc` clean.

---

## AGENT 6 — Cart & Checkout

**Depends on**: Agent 1

**Files to edit**:
- `src/app/(customer)/cart/page.tsx`
- `src/app/(customer)/checkout/page.tsx`
- `src/app/(customer)/checkout/_components/CheckoutStripePayment.tsx`

**JSON namespaces**: `cart.*`, `checkout.*`, `points.*`

**Task**: Translate all labels, empty states, undo toasts, points redemption copy, Stripe loading/error strings visible to customer, order summary headings.

Keep all cart/checkout logic unchanged.

**Verification**: Cart with items and checkout page in both locales. `tsc` clean.

---

## AGENT 7 — Wishlist & Orders

**Depends on**: Agent 1

**Files to edit**:
- `src/app/(customer)/wishlist/page.tsx`
- `src/app/(customer)/order-details/page.tsx`
- `src/app/(customer)/order-details/[orderId]/page.tsx`
- `src/app/(customer)/settings/components/OrdersList.tsx`
- `src/components/stripe/OrderSuccess.tsx`
- `src/app/order-success/page.tsx` (if separate from component)

**JSON namespaces**: `wishlist.*`, `orders.*`, `orderSuccess.*`

**Task**: Translate tab labels (products/posts on wishlist), empty states, order list, order detail timeline stages, status labels, 「再次购买」, contact support, success celebration copy.

Use `formatDate(locale, ...)` from `src/i18n/format.ts` for date displays instead of hardcoded `"zh-CN"`.

**Verification**: Wishlist, order list, order detail, success page in both locales. `tsc` clean.

---

## AGENT 8 — Settings (remaining), Notifications, Rewards, Support & Auth

**Depends on**: Agents 1–2 (language picker already in settings from Agent 2)

**Files to edit**:
- `src/app/(customer)/settings/page.tsx` (all strings **except** re-breaking language picker)
- `src/app/(customer)/notifications/page.tsx`
- `src/app/(customer)/rewards/_components/RewardsClient.tsx`
- `src/app/(customer)/support-chat/page.tsx`
- `src/app/authentication/sign-in/page.tsx`
- `src/app/authentication/sign-up/page.tsx`
- `src/app/authentication/forgot-password/page.tsx`
- `src/app/authentication/reset-password/page.tsx`

**JSON namespaces**: `settings.*`, `notifications.*`, `rewards.*`, `support.*`, `auth.*`, `faq.*`

**Task: Settings**
Translate: profile card, menu rows, account form labels, save/logout, guest state, FAQ accordion (5 items from redesign spec — translate questions **and** answers).

**Task: Notifications**
Translate: title, mark-all-read, date groups (今天/昨天/更早), empty state.

**Task: Rewards**
Translate: tier names display, points history labels, stamp card, how-to-earn nudges.

**Task: Support chat**
Translate: ticket form labels, submit/cancel, top bar. Keep `<ChatWindow>` internals unchanged unless they contain hardcoded customer strings.

**Task: Auth pages**
Translate all form labels, errors (use `getErrorTranslationKey`), buttons, hero subtext, guest browse links. Password placeholder `••••••••` stays as-is.

**Verification**: Full settings scroll, notifications, rewards, support, all 4 auth pages in both locales. `tsc` clean.

---

## AGENT 9 — Database Translation Tables & Seed SQL

**Depends on**: Agent 1 (parallel with Agents 2–8 OK)

**Files to create**:
- `docs/sql/CUSTOMER_I18N_TRANSLATION_TABLES.sql`
- `docs/sql/CUSTOMER_I18N_SEED_EN.sql`

**Files to edit**:
- `asf-2-next/src/database.types.ts` — add Row/Insert/Update types for all 6 translation tables

**Do NOT** run SQL against production — produce files for human to paste into Supabase SQL Editor.

**Task: `CUSTOMER_I18N_TRANSLATION_TABLES.sql`**

Create tables:
1. `product_translations` — `(id, product_id, locale, name, description, warranty_description, warranty_period, created_at, updated_at)` UNIQUE `(product_id, locale)`
2. `category_translations` — `(id, category_id, locale, name, ...)` UNIQUE `(category_id, locale)`
3. `brand_translations`
4. `department_translations`
5. `range_translations`
6. `post_translations` — includes `caption`, `cta_text`

For each table:
- `locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en'))`
- FK to parent with `ON DELETE CASCADE`
- `updated_at` trigger optional
- Enable RLS + `SELECT` policy for `anon, authenticated`
- Indexes on `(parent_id, locale)`

**Task: `CUSTOMER_I18N_SEED_EN.sql`**

Seed English translations for entities referenced in `temp/translation_migration.md` (use those UUIDs). Examples:
- Category `Handbag` id → name `Handbags`
- Products → English names/descriptions (reasonable translations of the Chinese in migration file)
- Posts → English captions

At minimum seed: all categories, all brands, departments, ranges from migration file, and 10+ products.

**Task: `database.types.ts`**

Add table definitions matching the SQL. Keep alphabetical order within `Tables`.

**Verification**: SQL is valid Postgres. Types compile. Document in SQL file header: "Run TABLES first, then SEED."

---

## AGENT 10 — RPC, ContentTranslationContext & Context Locale Wiring

**Depends on**: Agents 1 and 9 (UI agents 2–8 should be done or mostly done)

**Files to create**:
- `docs/sql/CUSTOMER_I18N_FETCH_PRODUCTS_RPC.sql`
- `src/context/ContentTranslationContext.tsx` (replace stub)

**Files to edit**:
- `src/context/RouteContextBundles.tsx` — add `ContentTranslationProvider` inside `LocaleProvider` tree (customer bundle only)
- `src/context/product/ProductContext.tsx`
- `src/context/product/CategoryContext.tsx`
- `src/context/product/BrandContext.tsx`
- `src/context/product/DepartmentContext.tsx`
- `src/context/product/RangeContext.tsx`
- `src/context/post/PostContext.tsx`
- `src/app/(customer)/_components/HomePageClient.tsx` — use content translation for display names
- `src/app/(customer)/product-section/[[...categoryId]]/_components/ProductSectionClient.tsx` — same

**Task: RPC `CUSTOMER_I18N_FETCH_PRODUCTS_RPC.sql`**

Replace `fetch_products_with_computed_attributes()` with version accepting:
```sql
fetch_products_with_computed_attributes(p_locale TEXT DEFAULT 'zh-CN')
```

Logic:
- When `p_locale = 'zh-CN'`: return `products.name`, `products.description` as today
- When `p_locale = 'en'`: `COALESCE(pt.name, p.name)`, etc. from `product_translations`
- Category names inside `product_categories` JSON: join `category_translations` similarly
- Preserve soft-delete filters from `docs/sql/UPDATE_FETCH_PRODUCTS_RPC.sql`

**Task: `ContentTranslationContext.tsx`**

- `"use client"`; depends on `useLocale()`
- When `locale === "en"`, fetch all rows from `category_translations`, `brand_translations`, `department_translations`, `range_translations`, `post_translations` in parallel (single mount + refetch on locale change)
- When `locale === "zh-CN"`, clear cache (use base tables)
- Expose:
  - `translateCategory(id, baseName)`
  - `translateBrand(id, baseName)`
  - `translateDepartment(id, baseName)`
  - `translateRange(id, baseName)`
  - `translatePost(id, field, baseValue)`
  - `translateProduct(id, field, baseValue)` — from `product_translations` fetch
- Use `resolveField` from `src/i18n/resolveContent.ts`

**Task: ProductContext**

- Import `useLocale()` — note: provider must be inside `LocaleProvider`
- Change RPC call to `supabase.rpc("fetch_products_with_computed_attributes", { p_locale: locale })`
- Re-fetch when `locale` changes (useEffect dependency)

**Task: Category/Brand/Department/Range/Post contexts**

- After base fetch, overlay translated `name` when `locale === "en"` using `ContentTranslationContext` OR join translations in fetch query:
  ```ts
  .from("categories")
  .select("*, category_translations(name)")
  ```
  Pick one consistent approach — prefer batch translation map from `ContentTranslationContext` to avoid N+1.

**Task: HomePageClient & ProductSectionClient**

- Remove `CATEGORY_NAMES` maps entirely
- Display `translateCategory(cat.id, cat.name)` for category pills
- For product cards on home (server props), use translation helpers on name/description

**Verification**: With seed SQL applied in Supabase, switch to English → product and category names show English. `tsc` clean.

---

## AGENT 11 — Final Sweep & Doc Update

**Depends on**: All agents 1–10

**Files to edit**:
- `docs/CUSTOMER_REDESIGN_PLAN_2026.md` — update language constraint row
- Any customer files still containing hardcoded Chinese/English UI strings found by audit

**Tasks**:

1. **Grep audit** across `asf-2-next/src/app/(customer)/`, `asf-2-next/src/app/authentication/`, and customer-shared components for:
   - Chinese characters in JSX text nodes (excluding comments)
   - Common English UI words (`"Loading"`, `"Submit"`, `"Cancel"`, etc.) outside JSON files
   - Leftover `CATEGORY_NAMES`
   - Hardcoded `toLocaleDateString("zh-CN")` — replace with `formatDate(locale, ...)`

2. **Fix** any stragglers with proper `t()` keys (add keys to both JSON files).

3. **Update `docs/CUSTOMER_REDESIGN_PLAN_2026.md`** hard constraints table:

   Replace:
   > **Language** | 100% Simplified Chinese...

   With:
   > **Language** | Bilingual via i18n. No hardcoded UI strings — all labels/buttons/errors use `t()` from `src/i18n/locales/`. Default locale `zh-CN`. Database content via translation tables. See `2026-07-08-customer-i18n-plan.md`.

4. **Update** the demo features table row for language toggle — remove "no actual translation" note; mark as implemented.

5. **Run** `npx tsc --noEmit` and `npm run lint` — fix new issues only.

6. **Manual test checklist** (document results in agent reply):
   - [ ] Clear localStorage → Chinese UI
   - [ ] Set English → all customer screens English
   - [ ] Refresh → preference persists
   - [ ] Product names English (if seed applied)
   - [ ] Fallback: delete one translation row → shows Chinese name, no crash

**Verification**: Grep audit clean. Docs updated. `tsc` clean.

---

## Parallelization Guide

| Can run in parallel | Must be serial |
|---------------------|----------------|
| Agents 2–8 after Agent 1 | 1 before all |
| Agent 9 after Agent 1 | 9 before 10 |
| | 10 before 11 |

**Minimum serial path**: 1 → 9 → 10 → 11, with 2–8 done any time after 1.

**Recommended for one operator**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 (~11 sessions).

---

## Copy-Paste Prompt Template

When starting each agent in a fresh chat, paste:

```
You are implementing the Customer App i18n program for asf-2-next.

Read these first:
1. asf-vault/raw/sources/2026-07-08-customer-i18n-plan.md
2. asf-vault/raw/sources/2026-07-08-customer-i18n-agent-prompts.md — AGENT N section

Execute AGENT N only. Do not work on other agents' files.
Follow SHARED CONTEXT rules. Run npx tsc --noEmit when done.
```

Replace `N` with 1–11.
