---
title: "ASF-2 User Flow Audit 2026-04-13"
type: source
updated: 2026-04-13
tags: [asf-2, audit, user-flows, gaps, customer, admin]
---

# ASF-2 User Flow Audit 2026-04-13

**Raw source:** [raw/sources/2026-04-13-user-flow-audit.md](../../raw/sources/2026-04-13-user-flow-audit.md)  
**Produced:** 2026-04-13 code inspection of `asf-2-next`  
**Supersedes:** [FEATURES.md](../../raw/sources/docs/FEATURES.md) and [CUSTOMER_FACING.md](../../raw/sources/docs/CUSTOMER_FACING.md) for the Next.js app  
**Entity:** [[wiki/entities/asf-2]]

## Summary

Comprehensive code-level audit of all routes in `asf-2-next`. Identifies every working flow, every gap, and every mock-data placeholder across customer and admin surfaces. As of 2026-04-13, the Next.js app has fixed several CRA bugs (product variants, wishlist, cart) but introduced new gaps and contains fully mock analytics and checkout.

## Customer flow status

| Status | Flows |
|---|---|
| ✅ Working | Sign up/in, browse (home/section/details/highlights), wishlist, cart, settings/profile |
| 🔴 Mock data | Checkout (all hardcoded), notifications (Chinese mock strings) |
| 🟡 Partial | Support (form only, never creates ticket), rewards (points real; stamps use localStorage) |
| ❌ Missing | Password reset, customer order history list, order tracking, cancel order, promo codes |

**Critical missing route:** `/my-orders` — customer has no navigation path to past order history.

## Admin/staff flow status

| Status | Flows |
|---|---|
| ✅ Working | Products (CRUD, categories), stock (all sub-pages), posts, orders list+detail, payments, users, internal chat, home page builder |
| 🔴 Broken | Dashboard (3 nav buttons only), all analytics (hardcoded chart data), promotions (not migrated to Next.js) |
| 🟡 Partial | Support page (unclear if wired to TicketContext), product scheduling (Array(10) bug) |
| ❌ Missing | Ship order button, print label, RBAC middleware |

## Analytics gap detail

All 4 analytics tabs (`/analytics/products`, `/analytics/categories`, `/analytics/users`, `/analytics/support`) use hardcoded static chart values (e.g., `{ x: "Jan", y: 50 }`) and `Array(10).fill(null)` to repeat data. The time range selector is purely cosmetic — it updates state but does not filter any query. **Real queries must use:** `payments`, `order_items`, `orders`, `user_details`, `tickets` tables.

## New DB tables required

`notifications`, `staff_roles`, `user_stamps`, `push_tokens`, soft-delete columns on `products`/`orders`, shipping columns on `orders`.

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/production-readiness-asf-2]]
- [[wiki/sources/2026-04-13-immediate-execution-plan]]
- [[wiki/sources/doc-critical-bugs]]
- [[wiki/sources/doc-features]]

## Open questions

- Is the `/support` admin page reading from TicketContext or is it also placeholder?
- Does stock UX pain warrant a Quick Stock Entry feature before launch, or post-launch?
