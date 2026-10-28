---
title: "Expo customer Storefront occupation taxonomy plan 2026-09-03"
type: source
updated: 2026-09-03
sources: 1
tags: [asf-2, expo, customer-app, storefront, taxonomy, occupation, home-filter]
---

# Expo customer Storefront occupation taxonomy plan 2026-09-03

**Raw:** [2026-09-03-expo-customer-storefront-occupation-taxonomy-plan.md](../../raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-plan.md)  
**Prompts:** [2026-09-03-expo-customer-storefront-occupation-taxonomy-agent-prompts.md](../../raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-agent-prompts.md) · [[wiki/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-agent-prompts]]

## Summary

Planned Storefront-only (4th theme) program: browse taxonomy becomes **range = occupation** + **category = product type** (shared `kind_key` across occupations). Departments/brands drop out of Storefront Shop UI. Mock seed first; remap products when sensible; unassigned stay for Home **All** only. Shop left rail = occupations; right = category tiles + products; empty combos = Coming soon. Home gains a top **category-type filter rail** that refilters hero + arrivals + feed; hero = latest matching **post** → linked list; Latest arrivals 2×3 + See all (all vs kind); See all on every feed 2×3. Partially **supersedes** [[wiki/sources/2026-08-24-expo-customer-storefront-theme-plan]] Home hero + Shop sidebar IA.

## Key claims

- Scope locked to `themes/storefront` + shared storefront components/libs
- New `categories.kind_key` for Home chips (`shoes` / `bags` / …)
- Eight agents (~200k-friendly): seed → libs → Shop → Home rail → Home hero/See all → product-list+i18n → smoke → QC
- Classic / Atelier / Noir unchanged

## Related

- [[wiki/sources/2026-08-24-expo-customer-storefront-theme-session-accomplishment]]
- [[wiki/concepts/expo-customer-theme-skins-asf-2]]
- [[wiki/entities/asf-2]]

## Open questions

- None material for kickoff; mock occupation/kind names may be adjusted in Agent 01
