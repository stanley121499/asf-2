---
title: "Warranty Discount Credits System — Design Spec (ASF-2, July 9, 2026)"
type: source
updated: 2026-07-17
tags: [warranty, credits, claims, feature-flags, supabase, asf-2, nextjs]
raw: "raw/sources/2026-07-09-warranty-discount-credits-design.md"
---

# Warranty Discount Credits System — Design Spec (ASF-2, July 9, 2026)

**Raw source**: [raw/sources/2026-07-09-warranty-discount-credits-design.md](../../raw/sources/2026-07-09-warranty-discount-credits-design.md)

> Companion implementation prompts (7 sequential agents) lived at `raw/sources/2026-07-09-warranty-discount-credits-agent-prompts.md`. They were **executed** (feature shipped in `asf-2-next`) and the transient prompt file was removed during the 2026-07-17 vault cleanup. Execution details are folded into this page.

## Summary

Evolves the flag-gated **Post-Purchase Claims** module ([[wiki/concepts/post-purchase-claims-module-asf-2]]) into a **human-verified warranty credit system**. Customers submit a multi-item claim and see an **estimated** credit from merchant-configured time tiers; **nothing is issued automatically**. Staff review evidence and approve (with optional per-item % override), which issues **fixed RM warranty credits** locked to the customer account. Credits are applied **one-click in cart** on any product, are **single-use**, and **expire 1 year** after approval. Web-only (`asf-2-next`) in v1.

## Key claims

- **Estimate → Verify → Issue+Redeem** three-stage model; the estimate stage is non-binding customer-facing copy ("Estimated credit if approved").
- **Critical anti-abuse rule**: tiers are recommendations only — no credit/refund/cart discount without staff approval; all issuance and cart validation is **server-side** (service role).
- **Credit math**: `credit_amount_myr = line_item_paid_price × approved_percent / 100` → fixed RM amount (not % off next purchase).
- **Default tier table** (merchant-editable): 0–30d → 75%, 31–60d → 50%, 61–90d → 25%, 91–365d → 10%, 366+ → ineligible for auto tier.
- **Auto tiers apply to `manufacturing_defect` only**; `size_exchange` / `wrong_item` / `delivery_damage` have no auto tier (staff set %, often 100%).
- **Multi-item claims** via new `claim_items` join; **one credit per line item** (not one lump sum).
- **Delivery date source fix**: first `order_status_logs` row with `new_status = 'delivered'` (fallback `order.updated_at`) — no longer `order.created_at`, closing a known claims-module gap.
- **New tables**: `warranty_policies`, `warranty_discount_tiers`, `claim_items`, `warranty_credits` (+ optional `warranty_claim_type_rules`); `claims` extended with `eligibility_start_at`, `policy_id`.
- **New APIs**: `/api/warranty/eligibility`, `/api/warranty/credits`, `/api/warranty/credits/apply`, `/api/warranty/claims/approve`, `/api/warranty/policies` — mirror the `promotions/validate` pattern.
- **New UI**: staff `/settings/warranty` (tier editor) + upgraded `/claims` queue/detail; customer multi-item claim flow, `/my-account/warranty-credits`, cart one-click apply, checkout consumption.
- **Reuse boundary**: deliberately **not** shared with `promotions` (separate table prevents cross-module discount abuse); keeps `claims` feature flag and `claimPolicyConfig.ts` as fallback.

## Outline

1. Executive summary and critical no-auto-issue rule
2. Gaps in v1 claims module vs warranty model
3. Locked design decisions (redemption, basis, scope, expiry, multi-item)
4. Three-stage model (estimate / verify / issue+redeem)
5. Credit calculation formula + default tier table
6. Claim types and per-type tier behavior
7. Abuse-prevention safeguards
8. Data model (new tables, `claims` extension, delivery-date query)
9. New API routes
10. Staff + customer UI surfaces
11. Integration with claims / promotions / payments / notifications
12. Key file paths and rollout/migration order
13–14. Customer + staff UX copy rules
15–18. Migration, out-of-scope, success criteria, ER diagram

## Implementation status (as of 2026-07-17)

Shipped in `asf-2-next` — code present in the working tree confirms all seven agents ran: migration `supabase/migrations/20260709120000_warranty_discount_credits.sql` + mirror `docs/sql/step_12_warranty_discount_credits.sql`; warranty module (`src/modules/warranty/*`); API routes under `src/app/api/warranty/*` + `_lib/warrantyCredits.ts`; `WarrantyPolicyContext` + `WarrantyCreditContext`; staff `/settings/warranty`; customer `/my-account/warranty-credits`; cart/checkout credit apply. A parallel `asf-customer-app` port (Expo) also appears in progress despite v1 being scoped web-only.

## Open questions

- Was `warranty_claim_type_rules` created in DB, or deferred to `claimPolicyConfig.ts`? (design left it optional)
- Is the `asf-customer-app` warranty port shipping in the same release, or ahead of the design's "web-only v1" scope?
- Migration run on which Supabase project(s) — dev/staging only or production?
- One-credit-per-checkout limit: still enforced, or stacked later?

## Wikilinks

- [[wiki/concepts/warranty-discount-credits-asf-2]]
- [[wiki/concepts/post-purchase-claims-module-asf-2]]
- [[wiki/sources/2026-06-26-post-purchase-claims-module]]
- [[wiki/entities/asf-2]]
- [[wiki/concepts/context-provider-architecture-asf-2]]
