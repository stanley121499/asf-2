# Post-Purchase Claims Module — ASF-2 (June 26, 2026)

**Date**: 2026-06-26  
**Context**: Implementation of a reusable, feature-flagged **Post-Purchase Claims** module for `asf-2-next`. Default configuration targets a **shoe retail** warranty/returns experience, but the module is designed to be copied to other client deployments (e.g. herb store freshness guarantees) by changing config only.

---

## 1. Problem and design rationale

### 1.1 What we were solving

ASF-2 had fragmented post-purchase support:

- Product-level `warranty_period` / `warranty_description` fields existed in the admin product editor but were **not shown** on the customer product page.
- Generic hardcoded copy on product details (“machine wash cold”, “30-day returns”) did not fit footwear.
- Order detail pages showed purchased items but had **no path** to report defects or start a warranty claim.
- Support tickets (`tickets` + `support-chat`) were generic — no linkage to orders, line items, or claim policy.

For a shoe company, customers need a clear distinction between:

- **Returns / size exchange** (short window, unworn condition)
- **Manufacturing defect warranty** (longer window, evidence required)
- **Delivery damage** (shorter window, photos of packaging)

For other verticals (herbs, electronics, apparel), the **workflow is the same** but labels and rules differ.

### 1.2 Core architectural decision: `claims`, not `warranty`

The module is named and coded as **Post-Purchase Claims** (`claims` feature flag, `claims` table). “Warranty” is one **claim type** inside configurable policy — not the module name.

**Why:**

| Approach | Problem |
|----------|---------|
| Hardcode “warranty” everywhere | Herb store has no warranty; awkward UX and code |
| Overload `tickets` table | No structured order/item linkage, resolutions, or eligibility |
| Generic `claims` + config | Same code, different copy/rules per client |

**Portable sentence:** *A customer can make a claim against a purchased item according to configurable business rules.*

### 1.3 Module boundaries

**Owned by the claims module:**

- Claim policy configuration (labels, types, windows, copy)
- Eligibility evaluation
- Claim submission, status tracking, staff review
- Status audit log
- Customer notifications on submit / status change
- Optional support conversation bridge

**Depends on existing platform modules:**

- `orders`, `order_items`, `products` (commerce linkage)
- `feature_flags` (toggle module per deployment)
- `notifications` (customer alerts)
- `payments` (refund handoff — link only, not auto-refund)
- `conversations` / `tickets` (optional chat thread)

---

## 2. Feature flag and routing

### 2.1 Feature flag

- **Key:** `claims`
- **Registered in:** `asf-2-next/src/context/FeatureFlagsContext.tsx` (`FEATURE_KEYS`)
- **Seeded in SQL:** `docs/sql/step_11_claims.sql` → `feature_flags` row
- **Default:** `enabled = true` in migration seed
- **Gating pattern:** `isEnabled("claims")` — same as `store_locations`, `support_chat`, etc.

When `claims` is off:

- Staff sidebar item hidden
- Customer pages redirect home
- `ClaimProvider` not mounted in `SlimLandingContextBundle`

### 2.2 Routes

| Surface | Route | Purpose |
|---------|-------|---------|
| Customer list | `/claims` | My claims |
| Customer submit | `/claims/new?orderId=&orderItemId=` | Prefilled claim form |
| Customer detail | `/claims/[claimId]` | Status, evidence, history |
| Staff queue | `/claims` | Admin layout, list + quick actions |
| Staff detail | `/claims/[claimId]` | Full review, approve/reject, refund link |

**Middleware** (`src/middlewareAuth.ts`):

- Customer: `/claims` added to `isCustomerProtectedPath` (session required)
- Admin: `/claims` added to `isAdminProtectedPath` segment roots

**Sidebar** (`src/components/sidebar.tsx`): “Claims” item with `MdAssignmentReturn`, gated by `claims`, placed before Support.

### 2.3 Route naming note

Unlike store locations (which had a customer/admin collision on `/store-locations`), claims uses **distinct paths** for customer `(customer)/claims` and admin `claims` — both resolve to `/claims` but Next.js distinguishes by layout group vs root admin app. **Verify in dev** if both layouts are active; if collision occurs, follow store-locations precedent (e.g. customer `/my-claims` vs admin `/claims`).

---

## 3. Database

### 3.1 Migration file

**Run in Supabase SQL editor before using the module:**

`asf-2-next/docs/sql/step_11_claims.sql`

### 3.2 Table: `public.claims`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` |
| `user_id` | UUID NOT NULL | Claimant |
| `order_id` | UUID FK → orders | Nullable |
| `order_item_id` | UUID FK → order_items | Nullable |
| `product_id` | UUID FK → products | Nullable |
| `claim_type` | TEXT NOT NULL | Config key, e.g. `manufacturing_defect` |
| `status` | TEXT NOT NULL | Default `submitted` |
| `reason` | TEXT | Short issue label |
| `description` | TEXT | Customer narrative |
| `evidence_urls` | TEXT[] | Photo URLs (v1: pasted links, not upload) |
| `requested_resolution` | TEXT | Customer preference |
| `approved_resolution` | TEXT | Staff outcome |
| `rejection_reason` | TEXT | |
| `staff_notes` | TEXT | Internal |
| `assigned_agent_id` | UUID | Staff assignment |
| `conversation_id` | UUID FK → conversations | Optional chat |
| `ticket_id` | UUID FK → tickets | Optional legacy bridge |
| `created_at`, `updated_at` | TIMESTAMPTZ | |
| `resolved_at` | TIMESTAMPTZ | Set on resolve |

**Status values:** `submitted`, `in_review`, `needs_info`, `approved`, `rejected`, `resolved`

### 3.3 Table: `public.claim_status_change_logs`

Audit trail mirroring `ticket_status_change_logs` / `order_status_logs` pattern:

- `claim_id`, `old_status`, `new_status`, `changed_by`, `notes`, `created_at`

### 3.4 RLS (basic)

- Customers: SELECT/INSERT/UPDATE own claims (`auth.uid() = user_id`)
- Staff operations in v1 rely on authenticated session + app-level access (prototype mode); production may need staff role policies or service-role API routes

### 3.5 Types

Manual insert into `asf-2-next/src/database.types.ts` for `claims` and `claim_status_change_logs`. Regenerate after migration:

```bash
npx supabase gen types typescript --project-id <project-id>
```

---

## 4. Policy configuration layer

**Single file to swap per client:** `asf-2-next/src/modules/claims/claimPolicyConfig.ts`

Exports:

- `ClaimPolicyConfig` — module label, UI titles, claim types, product-page copy
- `DEFAULT_CLAIM_POLICY_CONFIG` — shoe store defaults
- `claimPolicyConfig` — active config (import and replace for another vertical)
- `getClaimTypeConfig`, `getClaimStatusLabel`, `getClaimResolutionLabel`

### 4.1 Default shoe-store configuration

| Setting | Value |
|---------|-------|
| Module label | 保固与退换 / Warranty & Returns |
| Claim types | manufacturing_defect (90d), size_exchange (30d), wrong_item (30d), delivery_damage (14d) |
| Covered examples | Sole separation, stitching failure, hardware defect, material defect |
| Not covered | Normal wear, creasing, scuffs, water damage, outdoor wear after size issue |
| Care copy | Shoe-specific (no machine wash) |
| Shipping copy | 30-day unworn returns + 90-day defect warranty |

### 4.2 Porting to another vertical (example: herb store)

Change only `claimPolicyConfig.ts`:

- `moduleLabel` → “Order Issues” / 订单问题
- Replace `claimTypes` with e.g. `damaged_or_spoiled` (7 days), `wrong_item`, `missing_item`
- Update `careInstructions`, `shippingReturnCopy`, covered/not-covered bullets

**No changes** to contexts, pages, or database schema.

---

## 5. Module code layout

```
asf-2-next/src/modules/claims/
  claimPolicyConfig.ts    — per-client policy (THE portability surface)
  claimEligibility.ts     — delivery date + window checks
  claimNotifications.ts   — insert into notifications table
  claimStatusTransition.ts — staff status change + log + notify (shared helper)

asf-2-next/src/context/
  ClaimContext.tsx          — CRUD + realtime (modeled on TicketContext)
  ClaimStatusLogContext.tsx — audit log CRUD + realtime

asf-2-next/docs/sql/
  step_11_claims.sql        — migration + feature flag seed
```

---

## 6. Context bundles

`src/context/RouteContextBundles.tsx`:

| Bundle | Providers | Used by |
|--------|-----------|---------|
| `ClaimsCustomerProviders` | ClaimProvider + ClaimStatusLogProvider | Customer app via `SlimLandingContextBundle` Gate |
| `ClaimsContextBundle` | UserProvider + Claim + ClaimStatusLog | Staff queue |
| `ClaimsWithSupportContextBundle` | Above + Conversation + Ticket | Staff detail (chat bridge) |

Customer bundle gated: `<Gate flag="claims" Provider={ClaimsCustomerProviders}>` nested inside `SlimLandingContextBundle`.

---

## 7. Customer journey (implemented)

### 7.1 Product page

**File:** `src/app/(customer)/product-details/[productId]/_components/ProductDetailsClient.tsx`

When `claims` enabled:

- **材质与保养** accordion uses `claimPolicyConfig.careInstructions` (shoe care, not generic laundry)
- **配送与退货** uses `claimPolicyConfig.shippingReturnCopy`
- New **保固与退换** accordion: product `warranty_*` fields + policy covered/not-covered lists

### 7.2 Order detail — primary entry point

**File:** `src/app/(customer)/order-details/[orderId]/page.tsx`

Per line item (when order `delivered` or `completed`):

- Eligibility message from `evaluateClaimEligibility()`
- **报告问题** button → `/claims/new?orderId=…&orderItemId=…`

### 7.3 Claim submission

**File:** `src/app/(customer)/claims/new/page.tsx`

- Prefills order, item, product, color, size from query params
- Claim type selector from policy config
- Description required; photo URLs required when `requiresPhotos` for type
- Creates claim, status log, customer notification
- Redirects to claim detail

### 7.4 My claims

**Files:**

- `src/app/(customer)/claims/page.tsx` — list
- `src/app/(customer)/claims/[claimId]/page.tsx` — detail + status history
- `src/app/(customer)/settings/page.tsx` — link to module (gated)

---

## 8. Staff / boss journey (implemented)

### 8.1 Claims queue

**File:** `src/app/claims/page.tsx`

Pattern copied from `support/page.tsx`:

- Status tabs: All, New, In Review, Needs Info, Approved, Rejected, Resolved
- Search, “Assigned to me” filter
- List + selected claim preview panel
- Quick status actions via `applyClaimStatusChange()` (writes DB + log + notification)
- Assign agent dropdown
- Link to full detail page

### 8.2 Claim detail

**File:** `src/app/claims/[claimId]/page.tsx`

- Claim metadata, evidence photos, customer info
- Link to admin order page
- Staff notes, assignment
- Approve modal (pick resolution: replacement, refund, repair, store credit)
- Reject, request info, mark resolved
- **Refund handoff:** if `requested_resolution === "refund"` and payment exists → link to `/payments/[paymentId]` (manual refund via existing Payment UI — not automated)
- **Start conversation:** creates support `conversation`, links `conversation_id` on claim

### 8.3 Boss configuration (deferred)

Policy is **code/config-backed** in v1 (`claimPolicyConfig.ts`). Future: admin UI to edit policy in database per tenant.

---

## 9. Integrations

| Integration | Implementation | Notes |
|-------------|----------------|-------|
| Notifications | `claimNotifications.ts` | Types `claim_created`, `claim_status_changed` |
| Status audit | `claim_status_change_logs` + `ClaimStatusLogContext` | Same pattern as tickets/orders |
| Refunds | Link to payments detail page | Staff processes refund manually |
| Replacement | Approve with `approved_resolution: replacement` | No auto reorder in v1 |
| Store credit | Resolution option in config | Points integration deferred |
| Support chat | Optional `conversation_id` on claim | Staff detail “Start conversation” |

---

## 10. Eligibility logic

**File:** `src/modules/claims/claimEligibility.ts`

- Order must be `delivered` or `completed` before claiming
- Window starts from `order.created_at` + `eligibleDaysAfterDelivery` per claim type
- Returns `{ eligible, reason, eligibleUntil, daysRemaining }`
- `formatClaimLabel(id)` → `CL-XXXXXXXX` public reference

**Limitation (v1):** Uses order `created_at` as proxy for delivery date; ideal v2 uses actual delivery timestamp from `order_status_logs` or Delyva webhook.

---

## 11. Why each piece was built this way

| Decision | Rationale |
|----------|-----------|
| Dedicated `claims` table vs tickets | Structured order/item linkage, resolutions, evidence arrays, claim-specific statuses |
| Config file vs DB policy | Fastest path to multi-client copy-paste; one file swap per deployment |
| Feature flag `claims` | Matches platform module pattern (`store_locations`, `promotions`, etc.) |
| Photo URLs as text, not Storage upload | Minimizes v1 scope; upload can be added later |
| Customer starts from order item | Reduces bad data; staff sees exact SKU/size/color |
| Staff queue mirrors Support UI | Familiar UX; low design cost |
| `applyClaimStatusChange` helper | Single path for DB update + audit + notify (queue + detail) |
| Gate provider in SlimLanding | Avoids loading Claim realtime channel when module off |

---

## 12. Prerequisites and known gaps

### 12.1 Must do before testing

1. Run `docs/sql/step_11_claims.sql` on Supabase
2. Confirm `claims` row in `feature_flags` is `enabled`
3. Regenerate or verify `database.types.ts` matches remote schema

### 12.2 Known gaps (v1)

| Gap | Impact | Suggested follow-up |
|-----|--------|---------------------|
| SQL not applied on remote yet | Module will fail at runtime | Run migration |
| No photo upload to Supabase Storage | Customers paste URLs | Add storage bucket + upload UI |
| Eligibility uses `created_at` not delivery date | Window may be inaccurate | Use `delivered` status log timestamp |
| No staff RLS / API-only writes | Relies on prototype auth | Service-role API routes for staff |
| Replacement does not create order | Manual fulfillment | Hook to draft replacement order |
| Store credit not wired to points | Resolution label only | Integrate `PointsMembershipContext` |
| Mobile apps not updated | Web-only in v1 | Port customer claims screens to `asf-customer-app` |
| Customer/admin route collision risk | Possible 500 if both map to `/claims` | Test; split to `/my-claims` if needed |

---

## 13. File index

### SQL

- `asf-2-next/docs/sql/step_11_claims.sql`

### Module

- `asf-2-next/src/modules/claims/claimPolicyConfig.ts`
- `asf-2-next/src/modules/claims/claimEligibility.ts`
- `asf-2-next/src/modules/claims/claimNotifications.ts`
- `asf-2-next/src/modules/claims/claimStatusTransition.ts`

### Context

- `asf-2-next/src/context/ClaimContext.tsx`
- `asf-2-next/src/context/ClaimStatusLogContext.tsx`
- `asf-2-next/src/context/RouteContextBundles.tsx` (bundles + Gate)
- `asf-2-next/src/context/FeatureFlagsContext.tsx`

### Customer pages

- `asf-2-next/src/app/(customer)/claims/page.tsx`
- `asf-2-next/src/app/(customer)/claims/new/page.tsx`
- `asf-2-next/src/app/(customer)/claims/[claimId]/page.tsx`
- `asf-2-next/src/app/(customer)/order-details/[orderId]/page.tsx` (entry CTA)
- `asf-2-next/src/app/(customer)/product-details/.../ProductDetailsClient.tsx` (policy UI)
- `asf-2-next/src/app/(customer)/settings/page.tsx` (nav link)

### Staff pages

- `asf-2-next/src/app/claims/page.tsx`
- `asf-2-next/src/app/claims/[claimId]/page.tsx`
- `asf-2-next/src/components/sidebar.tsx`

### Auth / types

- `asf-2-next/src/middlewareAuth.ts`
- `asf-2-next/src/database.types.ts`

---

## 14. Manual test checklist

1. **Flag off** — disable `claims` in `feature_flags` → sidebar hidden, customer `/claims` redirects
2. **Product page** — warranty/care/shipping accordions show shoe copy
3. **Order detail** — delivered order shows 报告问题 on each item
4. **Submit claim** — form validates eligibility, photos when required, creates row + notification
5. **My claims** — list and detail show status and history
6. **Staff queue** — filter, assign, quick status change notifies customer
7. **Staff detail** — approve with resolution, reject, open payment link for refund, start conversation
8. **Portability** — change `claimPolicyConfig.ts` to herb-store labels; verify UI updates without code changes elsewhere

---

## 15. Related prior work

- **Store locations module** (2026-06-26): same feature-flag + context bundle + admin/customer split pattern — see `raw/sources/2026-06-26-store-locations-feature.md`
- **Support tickets**: `TicketContext`, `support/page.tsx` — UI pattern source for staff queue
- **Product warranty fields**: existed in `products` table and product editor; now surfaced on customer PDP when claims module on
