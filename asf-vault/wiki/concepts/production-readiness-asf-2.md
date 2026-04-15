---
title: "Production Readiness — ASF-2"
type: concept
updated: 2026-04-13
sources: 5
tags: [asf-2, production, gaps, plan, stripe, delyva]
---

# Production Readiness — ASF-2

This page synthesises the gap analysis and execution plan for taking ASF-2 from its current state to a production-ready product. See also [[wiki/entities/asf-2]] for the project overview.

---

## Current State (as of 2026-04-13)

The Next.js app (`asf-2-next`) is the active development target. The original CRA app (`asf-2/src`) is frozen as reference. The Next.js app has fixed several CRA bugs (product variants, cart, wishlist) but has significant remaining gaps.

### What works
- Product browsing, wishlist, cart (real data)
- Admin: products, stock, posts, orders, payments, users, internal chat
- Auth (sign up / sign in)
- Settings / profile

### What is broken or mock
- **Checkout**: entirely mock data — hardcoded cart items, hardcoded address, no Stripe
- **Analytics**: all charts use hardcoded static numbers; time range selector is cosmetic only
- **Promotions**: not migrated to Next.js app at all
- **Notifications**: hardcoded mock strings
- **Dashboard**: just 3 navigation buttons, no KPIs

### What is missing
- Customer order history page (`/my-orders`)
- Password reset flow
- Ship order + print label UI in admin
- Customer order tracking (Delyva)
- RBAC middleware (any authenticated user can access admin routes)
- Real notifications backend
- Support form → ticket creation
- Rewards stamps backed by DB (currently localStorage)

---

## The Blocker Chain

```
Real orders can't exist → because checkout is mock
Real analytics can't exist → because no real orders
Delivery tracking meaningless → because no real shipments
```

This makes **checkout the single most important fix**. It requires:
1. DB migrations (soft delete + shipping columns + notifications table)
2. Stripe API routes in `asf-2-next/src/app/api/`
3. Checkout page rewrite

---

## Execution Plan (12 steps, ~15 days)

Full detail in [[wiki/sources/2026-04-13-immediate-execution-plan]].

| Step | What | Days |
|---|---|---|
| 1 | DB migrations | 1 |
| 2 | Stripe + Delyva API routes | 2 |
| 3 | Checkout rewrite | 2 |
| 4–7 | Missing customer features (order history, password reset, notifications, support) | 3 |
| 8 | Real analytics | 2 |
| 9 | Delivery admin UI | 1 |
| 10–12 | Promotions, rewards stamps, RBAC | 3.5 |

---

## Architecture Principle: Next.js IS the Backend

A key clarification from the 2026-04-13 planning session: `asf-2-next` API Route Handlers (`app/api/`) are server-side Node.js functions when deployed on Vercel. Stripe secret keys and Delyva API keys live exclusively there — never in the browser. Mobile apps call these same HTTPS endpoints. **No separate Express/Fastify backend is needed.**

---

## Full Product Scope (beyond immediate fixes)

See [[wiki/sources/2026-04-13-production-roadmap]] for the complete 8-phase plan including:
- Phase 5: Staff mobile app (`asf-staff-app`, Expo + React Native)
- Phase 6: Customer mobile app (`asf-customer-app`, Expo + React Native)
- Phase 7: Community / messaging / ticketing UI
- Phase 8: Production hardening (RLS audit, Sentry, rate limiting, indexes)

---

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-04-13-production-roadmap]]
- [[wiki/sources/2026-04-13-immediate-execution-plan]]
- [[wiki/sources/2026-04-13-user-flow-audit]]
- [[wiki/sources/2026-04-13-delyva-delivery-integration]]
- [[wiki/sources/doc-critical-bugs]]
- [[wiki/sources/doc-features]]
