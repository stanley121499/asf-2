---
title: "Post-Purchase Claims Module — ASF-2 (June 26, 2026)"
type: source
updated: 2026-06-26
tags: [claims, warranty, feature-flags, supabase, asf-2, nextjs, modular]
---

# Post-Purchase Claims Module — ASF-2 (June 26, 2026)

**Raw source**: [raw/sources/2026-06-26-post-purchase-claims-module.md](../../raw/sources/2026-06-26-post-purchase-claims-module.md)

## Summary

Reusable **Post-Purchase Claims** module for `asf-2-next`: feature-flagged (`claims`), dedicated `claims` + `claim_status_change_logs` tables, configurable policy layer (`claimPolicyConfig.ts`), customer flow from order items, and staff queue/detail patterned on Support. Default config is **shoe-store warranty & returns**; other verticals swap config only.

## Key claims

- **Not named “warranty” in code** — generic claims module; warranty is one claim type in policy config.
- **Why separate from tickets** — needs order/item linkage, evidence, resolutions, eligibility windows.
- **Portability** — change `src/modules/claims/claimPolicyConfig.ts` per client; no page/schema changes.
- **Customer entry** — order detail per-item **报告问题** → `/claims/new`; settings + `/claims` list; product page policy accordions.
- **Staff** — `/claims` queue + `/claims/[id]` detail; approve/reject/resolve; refund link to payments; optional conversation.
- **Integrations** — notifications on submit/status; audit log; `applyClaimStatusChange` shared helper.
- **Prerequisite** — run `asf-2-next/docs/sql/step_11_claims.sql` before use.

## Outline

1. Problem, design rationale, module boundaries
2. Feature flag, routes, middleware, sidebar
3. Database schema, RLS, types
4. Policy config layer and shoe-store defaults
5. Context bundles and file layout
6. Customer journey (PDP, orders, submit, list)
7. Staff journey (queue, detail, boss config deferred)
8. Integrations and eligibility logic
9. Decision table (why each approach)
10. Gaps, file index, test checklist

## Open questions

- Customer vs admin both at `/claims` — collision risk; may need `/my-claims` split like store locations `/stores`.
- When to move policy from code to DB for multi-tenant boss UI?
- Mobile app parity for customer claims in `asf-customer-app`?
- Eligibility should use delivery timestamp not `order.created_at`.

## Wikilinks

- [[wiki/entities/asf-2]]
- [[wiki/concepts/post-purchase-claims-module-asf-2]]
- [[wiki/concepts/store-locations-feature-asf-2]]
- [[wiki/concepts/context-provider-architecture-asf-2]]
- [[wiki/sources/2026-06-26-store-locations-feature]]
