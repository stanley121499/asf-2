---
title: "Source: Expo customer Malay locale session accomplishment (2026-07-16)"
type: source
updated: 2026-07-16
sources: 1
tags: [ingest, asf-2, i18n, expo, malay, supabase]
raw: "raw/sources/2026-07-16-expo-customer-ms-locale-session-accomplishment.md"
---

# Source: Expo customer Malay locale session accomplishment (2026-07-16)

**Raw:** [2026-07-16-expo-customer-ms-locale-session-accomplishment.md](../../raw/sources/2026-07-16-expo-customer-ms-locale-session-accomplishment.md)

## Summary

Session deliverable adding **Bahasa Melayu (`ms`)** as a third Expo customer locale on top of zh-CN + en. Nine agents completed: UI catalog (~717 keys), Profile picker, generalized content overlays, DB CHECK migration, Malay minimart seed (54 rows) on `gswszoljvafugtdikimn`. Default remains `zh-CN`; AsyncStorage `asf_locale` unchanged. `tsc` + key-parity clean.

## Key claims

- App locale code is `ms`; Intl formatting uses `ms-MY`
- `ContentTranslationContext` fetches for any non–`zh-CN` locale (`.eq("locale", locale)`)
- Six `*_translations` tables now allow `locale IN ('zh-CN', 'en', 'ms')`
- Malay seed mirrors English UUID set for live minimart catalog
- Stripe PaymentSheet + notification plaintext remain known gaps

## Related

- [[wiki/concepts/customer-i18n-asf-2]]
- [[wiki/sources/2026-07-16-expo-customer-ms-locale-plan]]
- [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
