# Storefront occupation taxonomy + Home filter — QC notes (Agent 08)

**Date**: 2026-09-03  
**Scope**: Plan §7 / Agent 08 independent verification  
**Method**: Re-ran Agent 01 SQL audits via Supabase MCP; static read of Storefront Home/Shop, libs, FeedBlock, CategoryRail, product-list, locales. **No device UI.**  
**Verdict**: **Implementation-complete pending device QC.**

---

## QC matrix

| ID | Check | Result | Evidence |
|----|--------|--------|----------|
| D1 | `kind_key` present; ≥3 occupations; ≥3 kinds; ≥2 empty combos | **PASS** | Column `categories.kind_key` (text). Occupations: 护士 / 电工 / 厨师 (3). Kinds: `shoes`, `bags`, `accessories` (3×3 category rows). Empty Published combos: 厨师×包袋, 电工×配件 (product_count 0). |
| D2 | Remapped + unassigned products both exist | **PASS** | Published remapped (kind-linked): **45**. Published unassigned (`range_id`+`category_id` null): **35**. |
| D3 | Posts cover each kind for hero testing | **PASS** | shoes: 3 posts; bags: 1; accessories: 2 (via `category_id` and/or linked products). |
| S1 | Shop sidebar occupations only | **PASS** | `Shop.tsx` → `buildOccupationSidebarItems(ranges)`. DB: only 3 non-deleted ranges (all occupation spine). No dept/brand sidebar rows. |
| S2 | Category tiles + products by occupation | **PASS** | `resolveOccupationCategoryTiles` + `filterOccupationShopProducts` / `productMatchesOccupationSelection`. |
| S3 | Coming soon on empty category | **PASS** | `isComingSoonCategory` → product area shows `t("shop.comingSoon")` with empty list (not blank-only). |
| S4 | No department/brand in Shop UI | **PASS** | Sidebar/tiles are range/category only. `department_id`/`brand_id` appear only on product mapping for eligibility shape, not UI. |
| H1 | Category rail All + kinds | **PASS** | `StorefrontHomeCategoryRail`: synthetic All + `listKindKeys`; quiet gold underline aesthetic. |
| H2 | Filter refilters hero + arrivals + feed | **PASS** | `kindFilter` drives `pickLatestPostForHome`, `filterProductsForHome` → arrivals, `postMatchesHomeFilter` / `promotionMatchesHomeFilter` → feed; pagination resets on filter change. |
| H3 | Hero = post; tap → linked products | **PASS** | Hero from `pickLatestPostForHome`; `openHero` → `openLinkedProducts(router, "post", id)`. |
| H4 | No product hero fallback | **PASS** | `heroPostCandidateId === null` → omit hero block; comments + code path never pick a product hero. |
| H5 | Arrivals See all all vs kind | **PASS** | `openArrivalsSeeAll` → `openBrowseProductList` with `scope: "all"` or `scope: "kind"` + `kindKey`. Route `product-list.tsx` registered in browse `_layout`. |
| H6 | Feed See all → linked list | **PASS** | Home always passes `onSeeAll` → `openLinkedProducts`. `StorefrontFeedBlock` shows See all whenever `onSeeAll` provided (Agent 07 fix). |
| H7 | Unassigned only under All | **PASS** | `filterProductsForHome`: All keeps all eligible; kind requires `productMatchesKindKey` (unassigned never match). |
| R1 | Classic/Atelier/Noir unchanged when selected | **SKIP** | Device theme switch not run. Static: occupation/Home-filter wiring lives under `themes/storefront` + `components/storefront` + `lib/storefront`; no `kind_key` / occupation helpers in classic/atelier/noir screens. (Unrelated local diffs may exist elsewhere — out of this pack’s scope.) |
| I1 | en / zh-CN / ms strings present | **PASS** | Spot-check: `home.categoryFilterAll`, `home.seeAll`, `home.comingSoon` / `shop.comingSoon`, `browse.allProducts`, `browse.kindProducts`, `home.kind.{shoes,bags,accessories}` in all three locales. |

**Counts**: PASS **15** · FAIL **0** · SKIP **1**

---

## SQL re-audit (Agent 01 keys)

- `kind_key` column: present  
- Occupations × kinds: 护士 / 电工 / 厨师 × shoes / bags / accessories  
- Empty combos (≥2): 厨师×bags=0, 电工×accessories=0  
- Unassigned published: 35 · Remapped published: 45  
- Posts per kind: shoes≥1, bags≥1, accessories≥1  

`npx tsc --noEmit` (asf-customer-app): **clean** (exit 0).

---

## Fixes applied (Agent 08)

None. No clear Storefront defects found beyond what Agent 07 already fixed (feed See all always when `onSeeAll` provided).

---

## Open for Stanley (device smoke)

1. Storefront Shop: tap each occupation; confirm tiles + products; open empty combo → Coming soon.  
2. Storefront Home: switch All / shoes / bags / accessories; confirm hero, arrivals, feed update.  
3. Hero tap → linked products; arrivals See all (All vs kind); feed See all → linked list.  
4. Theme switch Classic / Atelier / Noir → confirm prior IA (R1).  
5. Locale spot-check en / zh-CN / ms on device for All / See all / Coming soon / product-list titles.

---

## Ambiguous / out of scope (not fixed)

- Unrelated dirty diffs under classic/noir Home (if present in working tree) — not part of this occupation pack; do not treat as Agent 08 regressions without Stanley confirmation.  
- Device-only visual polish of rail / Coming soon copy.

---

## Program status

**Implementation-complete; device polish landed (See all outline/alignment, post kind-filter precision, SDK 57).**  
Canonical write-up: `raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-accomplishment.md`.
