---
title: "ASF-2 Immediate Execution Plan 2026-04-13"
type: source
updated: 2026-04-13
tags: [asf-2, execution, plan, steps, stripe, delyva, analytics]
---

# ASF-2 Immediate Execution Plan 2026-04-13

**Raw source:** [raw/sources/2026-04-13-immediate-execution-plan.md](../../raw/sources/2026-04-13-immediate-execution-plan.md)  
**Goal:** Everything working end-to-end with real data (~15 dev days / ~3 weeks solo)  
**Constraint:** Analytics must use real data (boss requirement). UX polish deferred.  
**Entity:** [[wiki/entities/asf-2]]

## Summary

12-step concrete plan to take `asf-2-next` from current state (mock checkout, fake analytics, missing routes) to fully functional. Each step includes exact file paths, SQL, code patterns, and dependency mapping.

## Step index

| Step | What | Days | Depends on |
|---|---|---|---|
| 1 | DB Migrations (6 SQL blocks) | 1 | — |
| 1g | `shipping_address_structured JSONB` on orders | < 5 min | After Step 1 |
| 2 | Stripe + Delyva API routes | 2 | Steps 1 + 1g |
| 3 | Checkout rewrite (real cart + Stripe) | 2 | Step 2 |
| 4 | Customer order history page | 0.5 | Step 1 |
| 5 | Real notifications (NotificationContext) | 1.5 | Step 1 |
| 6 | Password reset pages | 0.5 | — |
| 7 | Support form → real TicketContext | 0.5 | Step 1 |
| 8 | Real analytics (all 4 tabs + dashboard KPIs) | 2 | After Step 3 for data |
| 9 | Delivery UI in admin orders page | 1 | Step 2 |
| 10 | Promotions module (context + UI + checkout) | 2 | Step 1 |
| 11 | Rewards stamps → Supabase | 0.5 | Step 1 (DONE) |
| 12 | Basic RBAC middleware | 1 | Last |

## Critical path

Steps 1 → 2 → 3 are the critical path. Once real orders exist in the DB, analytics (Step 8) and delivery UI (Step 9) become meaningful. All other steps are independent of 2-3 and can run in parallel.

## Key implementation notes

- **Stripe webhook** creates the order, not the client — only trust server-side confirmation
- **`SUPABASE_SERVICE_ROLE_KEY`** needed in webhook handler to bypass RLS
- **RBAC middleware** uses existing `src/middleware.ts` in `asf-2-next`; protect admin paths, require `staff_roles` row or `ADMIN_EMAIL` env match
- **Analytics time range** needs a `getDateRange(label)` utility and all queries must accept `dateFrom`/`dateTo`
- **Rewards fix** is a direct drop-in: replace `localStorage` with `SELECT/INSERT/UPDATE` on `user_stamps` table (DONE in Phase 0)
- **`shipping_address_structured JSONB`**: `orders.shipping_address` is TEXT (display-only). Add `shipping_address_structured JSONB` via `docs/sql/PHASE_0B_SHIPPING_ADDRESS_STRUCTURED.sql` before Phase 2. At checkout (Step 3) save both columns. `create-shipment` API route reads from `shipping_address_structured`.
- **`push_tokens` table**: Deferred to Phase 5/6 (mobile apps). Not needed for web Phases 1–4.
- **`staff_roles` bootstrap**: Table has SELECT-own RLS only (intentional — no self-assign). Add first owner via Supabase SQL editor: `INSERT INTO staff_roles (user_id, role) VALUES ('<uuid>', 'owner');`
- **`notifications` INSERT**: No client INSERT policy (intentional). All inserts use service role key from server (Stripe webhook, status change handlers).

## New files created

- `src/app/api/stripe/create-payment-intent/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/delivery/rates/route.ts`
- `src/app/api/delivery/create-shipment/route.ts`
- `src/app/api/delivery/tracking/[orderId]/route.ts`
- `src/app/(customer)/my-orders/page.tsx`
- `src/app/authentication/forgot-password/page.tsx`
- `src/app/authentication/reset-password/page.tsx`
- `src/context/NotificationContext.tsx`
- `src/context/PromotionContext.tsx`
- `src/utils/analyticsDateRange.ts`

## Related

- [[wiki/entities/asf-2]]
- [[wiki/concepts/production-readiness-asf-2]]
- [[wiki/sources/2026-04-13-production-roadmap]]
- [[wiki/sources/2026-04-13-user-flow-audit]]
- [[wiki/sources/2026-04-13-delyva-delivery-integration]]

## Open questions

- Flat shipping rate at checkout (RM10) vs live Delyva quote — depends on whether product weights are in DB schema
- Promotions: does `promotions` table already have all required columns or do migrations add them?
