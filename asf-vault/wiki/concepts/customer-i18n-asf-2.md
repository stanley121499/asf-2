---
title: "Customer i18n — ASF-2"
type: concept
updated: 2026-07-16
sources: 8
tags: [asf-2, i18n, expo, supabase, customer, malay]
---

# Customer i18n — ASF-2

Trilingual customer experience: **Simplified Chinese (default)**, **English**, and **Bahasa Melayu (`ms`)**.

## Architecture (two layers)

| Layer | Mechanism | Persistence / fallback |
|-------|-----------|------------------------|
| UI chrome | JSON catalogs + `useTranslation()` / `t("key")` | Expo: AsyncStorage `asf_locale`; Web (stashed): `localStorage` |
| Catalog content | Supabase `*_translations` tables | Overlay with `resolveField`; missing EN/MS → base Chinese |

Supported locales: `zh-CN`, `en`, `ms`.

Intl mapping: `zh-CN` → `zh-CN`, `en` → `en`, `ms` → `ms-MY`.

## Where it ships

| Surface | Status |
|---------|--------|
| **`asf-customer-app`** (Expo) | **Shipped 2026-07-08** zh-CN/en; **`ms` shipped 2026-07-16** — Profile picker (3 options), content overlays for `en`/`ms`, no ProductContext RPC |
| **`asf-2-next`** (Next.js) | Partially built then **stashed**; SQL/RPC artifacts in `docs/sql/CUSTOMER_I18N_*.sql` (EN + MS migration/seed docs) |
| **`asf-staff-app`** | Out of scope |

## Hard rules

- Customer UI strings must come from locale JSON keys (no hardcoded chrome)
- Expo ProductContext: **direct selects only** — never call `fetch_products_with_computed_attributes` for locale
- Locale preference is device-local only (no `user_details.preferred_locale` yet)
- Relative time / distance labels use `t()` keys (`notifications.relative.*`, `locations.distance.*`)

## DB (applied on `gswszoljvafugtdikimn`)

Tables: `product_translations`, `category_translations`, `brand_translations`, `department_translations`, `range_translations`, `post_translations`.

- Locale CHECK: `('zh-CN', 'en', 'ms')` (widened 2026-07-16)
- English + Malay seeds cover current minimart demo catalog (20 products each, etc.)
- Locale-aware RPC exists for web/callers that use it — **Expo must not call it** for ProductContext

SQL: `docs/sql/CUSTOMER_I18N_*.sql`, `supabase/migrations/20260716120000_customer_i18n_ms_locale.sql`

## Known gaps

- Stripe PaymentSheet follows OS language
- Notification titles/bodies stored as plaintext at insert time
- Web UI parity pending stash re-apply (incl. Malay)
- Staff app multilingual not started
- Optional: auto-detect device locale on first launch

## Sources

- [[wiki/sources/2026-07-16-expo-customer-ms-locale-session-accomplishment]] — Malay session outcome SOT
- [[wiki/sources/2026-07-16-expo-customer-ms-locale-plan]] / [[wiki/sources/2026-07-16-expo-customer-ms-locale-agent-prompts]]
- [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]] — bilingual session outcome SOT
- [[wiki/sources/2026-07-08-expo-customer-i18n-plan]] / [[wiki/sources/2026-07-08-expo-customer-i18n-agent-prompts]]
- [[wiki/sources/2026-07-08-customer-i18n-plan]] / [[wiki/sources/2026-07-08-customer-i18n-agent-prompts]]
- [[wiki/sources/2026-04-25-mobile-apps-progress]] — Expo vs RPC constraint
- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
