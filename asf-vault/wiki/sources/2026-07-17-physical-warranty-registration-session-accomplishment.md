---
title: "Physical warranty registration — session accomplishment (2026-07-17)"
type: source
updated: 2026-07-17
sources: 1
tags: [warranty, expo, physical-retail, registrations, asf-2]
---

# Physical warranty registration — session accomplishment

Summary of [raw/sources/2026-07-17-physical-warranty-registration-session-accomplishment.md](raw/sources/2026-07-17-physical-warranty-registration-session-accomplishment.md).

## Key claims

- Simon’s warranty hero is **physical retail**: card-in-box activation → Expo **My Collection** → claim once → redeem online or any partner store.
- Credit is **fixed RM** of original pair price × tier % on claim day; **one claim per registration forever**.
- **No** defect photos / staff approval for issuance; staff only **burns** vouchers in-store (manual till).
- Shipped: DB tables + flag `warranty_registration`, Next APIs, Expo hub/detail (premium redesign, Month 1–12, month-scoped calendar), staff redeem.
- Reuses `warranty_policies` / tiers; does not replace online claims, but supersedes them as the consignment customer path.

## Related

- Design: [raw/sources/2026-07-17-physical-warranty-registration-design.md](raw/sources/2026-07-17-physical-warranty-registration-design.md)
- Prior credits: [[wiki/concepts/warranty-discount-credits-asf-2]]
- Concept: [[wiki/concepts/physical-warranty-registration-asf-2]]
