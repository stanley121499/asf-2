---
title: "ASF-2 Production Roadmap 2026"
type: source
updated: 2026-04-13
tags: [asf-2, roadmap, production, mobile, stripe, delyva, expo]
---

# ASF-2 Production Roadmap 2026

**Raw source:** [raw/sources/2026-04-13-production-roadmap.md](../../raw/sources/2026-04-13-production-roadmap.md)  
**Produced:** 2026-04-13 planning session  
**Entity:** [[wiki/entities/asf-2]]

## Summary

The definitive production build-out plan for ASF-2. Covers the complete architecture across three client surfaces (web, customer mobile, staff mobile), all integration phases, and a rough timeline. This is the highest-level planning document for taking ASF-2 from its current state to a production-ready product.

## Top-level outline

1. **Final Architecture** — Next.js API routes as the sole backend; Supabase as shared data layer; Expo+RN for both mobile apps; Delyva for delivery; Stripe for payments
2. **Phase 0** — Database migrations (soft delete, shipping fields, staff roles, notifications, rewards stamps) + critical bug fixes (forEach/async, useEffect, useCallback)
3. **Phase 1** — Stripe payment integration (API routes: `create-payment-intent`, `webhook`)
4. **Phase 2** — Delyva delivery integration (rate quote, shipment booking, tracking)
5. **Phase 3** — Promotions module (PromotionContext + admin UI + checkout coupon)
6. **Phase 4** — Missing customer features (password reset, order history, notifications, support tickets)
7. **Phase 5** — Staff mobile app (`asf-staff-app`, Expo, RBAC via `staff_roles`)
8. **Phase 6** — Customer mobile app (`asf-customer-app`, Expo, Stripe RN SDK)
9. **Phase 7** — Community/messaging/ticketing UI
10. **Phase 8** — Production hardening (RLS audit, rate limiting, Sentry, indexes)

## Key claims

- **Next.js API routes ARE the backend.** No separate Express server needed. Mobile apps call the same HTTPS endpoints as the web frontend.
- Staff app can start being built **immediately after Phase 0** — it reads from Supabase contexts directly.
- Customer app checkout screen is blocked until **Phase 1 (Stripe)** is complete.
- Timeline: ~16–18 weeks solo; ~10–12 weeks with two developers. Phases 5 and 6 parallelizable.

## Environment variables required

Documented in raw source: Stripe (3 keys), Delyva (4 keys), Supabase service role key, admin email bootstrap.

## Related concepts / entities

- [[wiki/entities/asf-2]]
- [[wiki/concepts/production-readiness-asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-04-13-immediate-execution-plan]]
- [[wiki/sources/2026-04-13-mobile-app-strategy]]
- [[wiki/sources/2026-04-13-delyva-delivery-integration]]

## Open questions

- When will product weights be added to the DB schema? (Required for accurate Delyva rate quotes — flat rate MVP until then)
- Will COD (Cash on Delivery) be offered as a payment option?
- Community/messaging UI (Phase 7) — is this a launch requirement or post-launch?
