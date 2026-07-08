---
title: "Source: Customer i18n plan — Next.js (2026-07-08)"
type: source
updated: 2026-07-08
sources: 1
tags: [ingest, asf-2, i18n, nextjs]
raw: "raw/sources/2026-07-08-customer-i18n-plan.md"
---

# Source: Customer i18n plan — Next.js (2026-07-08)

**Raw:** [2026-07-08-customer-i18n-plan.md](../../raw/sources/2026-07-08-customer-i18n-plan.md)

## Summary

Original bilingual plan targeting **`asf-2-next`** (localStorage `asf_locale`, translation tables, locale-aware RPC). Partially implemented then **superseded as the phone SOT** once Expo apps were pulled — see session accomplishment. Still the conceptual design reference for web parity and SQL/RPC artifacts under `docs/sql/CUSTOMER_I18N_*.sql`.

## Contradictions / open tension

- Redesign docs historically required 100% hardcoded Chinese; this plan replaces that with keyed i18n.
- Assumes WebView delivery; Expo is the APK/iPhone test surface per [[wiki/sources/2026-04-25-mobile-apps-progress]].

## Related

- [[wiki/concepts/customer-i18n-asf-2]]
- [[wiki/sources/2026-07-08-customer-i18n-agent-prompts]]
- [[wiki/sources/2026-07-08-customer-i18n-session-accomplishment]]
- [[wiki/sources/2026-07-08-expo-customer-i18n-plan]]
