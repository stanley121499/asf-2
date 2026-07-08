---
title: "Customer i18n — ASF-2"
type: concept
updated: 2026-07-08
sources: 5
tags: [asf-2, i18n, expo, supabase, customer]
---

# Customer i18n — ASF-2

Bilingual customer experience: **Simplified Chinese (default)** and **English**.

## Architecture (two layers)

| Layer | Mechanism | Persistence / fallback |
|-------|-----------|------------------------|
| UI chrome | JSON catalogs + `useTranslation()` / `t("key")` | Expo: AsyncStorage `asf_locale`; Web (stashed): `localStorage` |
| Catalog content | Supabase `*_translations` tables | Overlay with `resolveField`; missing EN → base Chinese |

Supported locales only: `zh-CN`, `en`.

## Where it ships

| Surface | Status |
|---------|--------|
| **`asf-customer-app`** (Expo) | **Shipped 2026-07-08** — Profile language picker, content overlays, no ProductContext RPC |
| **`asf-2-next`** (Next.js) | Partially built then **stashed**; SQL/RPC artifacts in `docs/sql/CUSTOMER_I18N_*.sql` |
| **`asf-staff-app`** | Out of scope |

## Hard rules

- Customer UI strings must come from locale JSON keys (no hardcoded chrome)
- Expo ProductContext: **direct selects only** — never call `fetch_products_with_computed_attributes` for locale (progress doc: RPC crashes)
- Locale preference is device-local only (no `user_details.preferred_locale` yet)

## DB (applied on `gswszoljvafugtdikimn`)

Tables: `product_translations`, `category_translations`, `brand_translations`, `department_translations`, `range_translations`, `post_translations`. English seed covers current minimart demo catalog. Locale-aware RPC exists for web/callers that use it.

## Known gaps

- Stripe PaymentSheet follows OS language
- Notification titles/bodies stored as plaintext at insert time
- Web UI parity pending stash re-apply
- Staff app bilingual not started

## Sources

- [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]] — session outcome SOT
- [[wiki/sources/2026-07-08-expo-customer-i18n-plan]] / [[wiki/sources/2026-07-08-expo-customer-i18n-agent-prompts]]
- [[wiki/sources/2026-07-08-customer-i18n-plan]] / [[wiki/sources/2026-07-08-customer-i18n-agent-prompts]]
- [[wiki/sources/2026-04-25-mobile-apps-progress]] — Expo vs RPC constraint
- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
