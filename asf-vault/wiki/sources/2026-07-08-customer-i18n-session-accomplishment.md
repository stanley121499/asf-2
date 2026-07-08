---
title: "Source: Customer i18n session accomplishment (2026-07-08)"
type: source
updated: 2026-07-08
sources: 1
tags: [ingest, asf-2, i18n, expo, supabase]
raw: "raw/sources/2026-07-08-customer-i18n-session-accomplishment.md"
---

# Source: Customer i18n session accomplishment (2026-07-08)

**Raw:** [2026-07-08-customer-i18n-session-accomplishment.md](../../raw/sources/2026-07-08-customer-i18n-session-accomplishment.md)

## Summary

Session deliverable for bilingual customer support (**zh-CN** default + **en**). Primary ship target is **`asf-customer-app`** (Expo). Mid-session discovery: Expo mobile apps were missing from the local clone until pull — phone/APK path is native Expo, not Next.js WebView. DB translation tables + English seed applied on Supabase `gswszoljvafugtdikimn`. Expo Agents 1–10 completed; `tsc` clean. Next.js UI i18n exists only in git stash. Also notes removal of duplicate Profile **账户设置** row (edit icon remains).

## Key claims

- Customer i18n for phone = Expo `LocaleProvider` + AsyncStorage `asf_locale` + JSON catalogs + `ContentTranslationContext` overlays
- Do **not** use `fetch_products_with_computed_attributes` inside Expo ProductContext
- Six `*_translations` tables live in production DB with EN rows for current minimart catalog
- Staff app and admin translation UI out of scope
- Web i18n plan/agents exist under `2026-07-08-customer-i18n-*.md`; Expo plan/agents under `2026-07-08-expo-customer-i18n-*.md`

## Related

- [[wiki/concepts/customer-i18n-asf-2]]
- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-04-25-mobile-apps-progress]]
- [[wiki/sources/2026-07-08-expo-customer-i18n-plan]]
- [[wiki/sources/2026-07-08-customer-i18n-plan]]

## Open questions

- Whether to re-apply stashed `asf-2-next` i18n and ship web parity
- Whether notification rows should store locale-neutral keys vs locale-at-insert
- Staff app bilingual requirements (not started)
