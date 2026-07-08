# Customer i18n — Session Accomplishment (2026-07-08)

**Date**: 2026-07-08  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo) bilingual UI + Supabase content translations  
**Related (partial / stashed)**: `asf-2-next` UI i18n was built first, then discovered Expo is the phone/APK surface; web work remains in git stash

---

## 1. What we set out to do

Add **Simplified Chinese + English** support for the customer experience:

- UI chrome via translation keys (not hardcoded strings)
- Product / category / brand / post **content** via Supabase translation tables
- Default locale `zh-CN`; preference in local storage / AsyncStorage only
- Customer-only (no staff app, no admin translation UI)

---

## 2. Important discovery mid-session

Initial plans and an 11-agent implementation targeted **`asf-2-next`** (Next.js), following redesign docs that described a mobile **WebView**.

After pull, **`asf-customer-app/` and `asf-staff-app/`** appeared on `main` (they had not been on this local clone). Progress docs confirm:

- Customer testing uses **Expo Go / APK**, not WebView of Next
- Customer UI is a **native Expo mirror** of the Next redesign
- ProductContext must keep **direct Supabase selects** — **not** `fetch_products_with_computed_attributes` (RPC caused crashes)

**Conclusion**: Phone i18n belongs in **`asf-customer-app`**. Web i18n is useful for web/WebView but was not the APK path. DB translation layer benefits both.

---

## 3. Plans & agent prompts written

| Raw source | Purpose |
|------------|---------|
| `raw/sources/2026-07-08-customer-i18n-plan.md` | Original **Next.js** i18n plan (zh-CN/en, tables, localStorage) |
| `raw/sources/2026-07-08-customer-i18n-agent-prompts.md` | 11 web agents |
| `raw/sources/2026-07-08-expo-customer-i18n-plan.md` | **Expo** plan (AsyncStorage, no RPC, Profile language picker) |
| `raw/sources/2026-07-08-expo-customer-i18n-agent-prompts.md` | 10 Expo agents |
| This file | Session outcome / source of truth for what landed |

---

## 4. Database (Supabase project `gswszoljvafugtdikimn`)

Applied via project-scoped MCP (`.cursor/mcp.json` → `supabase-asf-2`):

1. **Translation tables** (RLS SELECT for `anon` + `authenticated`):
   - `product_translations`
   - `category_translations`
   - `brand_translations`
   - `department_translations`
   - `range_translations`
   - `post_translations`
2. **English seed** aligned to **live minimart catalog** (not the older herbs UUID seed alone): 20 products, 4 categories, 7 brands, 6 departments, 11 ranges, 6 posts
3. **RPC** `fetch_products_with_computed_attributes(p_locale)` updated for web/RPC callers — **Expo ProductContext must not use this RPC**

SQL checked into repo under `docs/sql/CUSTOMER_I18N_*.sql`.

---

## 5. Expo app delivery (`asf-customer-app`) — COMPLETE

Ten agents run serially; `npx tsc --noEmit` clean after final sweep.

### Infrastructure

- `i18n/` — types, format, errorMap, resolveContent, `locales/zh-CN.json`, `locales/en.json`
- `context/LocaleContext.tsx` — AsyncStorage key `asf_locale`, `useTranslation()`, default `zh-CN`
- `context/ContentTranslationContext.tsx` — batch-fetch EN rows; overlay via `resolveField`
- `components/Providers.tsx` — `LocaleProvider` → `ContentTranslationProvider` → `RouteContextBundle`

### UX

- Tab labels use `t("nav.*")` including **门店 / Stores**
- Profile **语言** row + modal (简体中文 / English); preference persists
- Screens migrated: home, browse, PDP, highlights, locations, cart, checkout, wishlist, orders, profile subpages, auth
- Auth ZH/EN unified under `auth.*`
- Product/category/post display names use content translation helpers; interim `CATEGORY_NAMES` removed
- Duplicate **账户设置** menu row removed (account remains via top-right edit icon)

### Explicit non-goals / known gaps

- Stripe PaymentSheet follows **OS** language
- DB-stored notification title/body not re-translated for older rows
- Some unused admin-style English alerts in contexts not on customer paths
- `asf-staff-app` untouched
- Web (`asf-2-next`) i18n remains in **git stash** (`wip: customer i18n in asf-2-next*`) — not on working tree after pull

---

## 6. Next.js app (`asf-2-next`) — PARTIAL / STASHED

Eleven agents completed UI + ContentTranslation + RPC wiring against Next before Expo was on disk. That work was **stashed** so `main` could fast-forward to include mobile apps.

To re-apply web i18n later: pop/apply stash carefully against post-pull `asf-2-next` (expect conflicts with courier/checkout/profile commits).

---

## 7. Language rule update

**Old redesign rule**: 100% Simplified Chinese hardcoded; English = bug.  
**New rule**: No hardcoded customer UI strings — use `t()`; default `zh-CN`; DB content via translation tables.

`docs/CUSTOMER_REDESIGN_PLAN_2026.md` was updated in the **web** agent pass (may be in stash, not on current working tree).

---

## 8. How to verify (Expo)

```bash
cd asf-customer-app
npm install --legacy-peer-deps
npx expo start
```

1. Clear / leave unset `asf_locale` → Chinese UI  
2. 我的 → 语言 → English → chrome + names switch  
3. Kill and reopen app → preference persists  
4. Confirm product names e.g. “Coca-Cola Classic”, categories e.g. “Beverages”

---

## Related wiki / docs

- Mobile progress: [[wiki/sources/2026-04-25-mobile-apps-progress]]
- Mobile architecture: [[wiki/concepts/mobile-app-architecture-asf-2]]
- Plans listed in §3
