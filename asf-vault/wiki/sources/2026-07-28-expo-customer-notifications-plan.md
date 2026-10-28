---
title: "Expo customer notifications plan 2026-07-28"
type: source
updated: 2026-07-28
tags: [asf-2, expo, notifications, push, nextjs, customer]
---

# Expo customer notifications plan 2026-07-28

**Raw:** [2026-07-28-expo-customer-notifications-plan.md](../../raw/sources/2026-07-28-expo-customer-notifications-plan.md)  
**Companion prompts:** [2026-07-28-expo-customer-notifications-agent-prompts.md](../../raw/sources/2026-07-28-expo-customer-notifications-agent-prompts.md) (implementation pack; may be deleted after run)

## Summary

Approved plan to ship a **full customer notification system**: Expo Push (not Firebase), in-app inbox (already partial), staff-editable DB templates (multilang + default fallback), Next.js admin promo compose, three preference toggles (Orders · Claims & support · Promotions), deep links, and `preferred_locale` sync. **Out of scope:** staff Expo push (low stock / new order to managers).

## Locked decisions (abbrev)

| # | Choice |
|---|--------|
| Templates | DB editable (B) |
| Promo audience | All with push token + promotions pref on (A) |
| Prefs | Three toggles (A) |
| Admin UI | Next.js only (B) |
| i18n | Staff fill zh-CN/en/ms; one default; missing → default → en |
| Scope | Customer complete; no staff-mobile push |

## Agent pack

**Eight** sequential agents (resized after review — five was too coarse): (1) schema (2) helper+push (3) Stripe only (4) claims/warranty/physical (5) order-status API + support RLS fix (6) admin templates (7) admin campaigns (8) Expo client. See companion prompts.

## Related

- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/concepts/customer-i18n-asf-2]]
- [[wiki/concepts/production-readiness-asf-2]]
- [[wiki/entities/asf-2]]
