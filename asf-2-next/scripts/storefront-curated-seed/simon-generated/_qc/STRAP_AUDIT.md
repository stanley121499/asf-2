# Simon storefront — strap fidelity audit

**Date:** 2026-10-25  
**Scope:** All `sf-hero-34`, `sf-side`, `sf-topdown-insole`, `sf-pair-or-sole`, `sf-fallback` under `simon-generated/products/`; spot-check of `md-editorial-*`, posts, promos for wrong silhouette.

## Product lock (expected strap)

| ID | Folder | Expected strap |
|---|---|---|
| 01 | 01-knit-maryjane-buckle | Single INSTEP buckle Mary Jane (ribbed knit) |
| 02 | 02-knit-ballet-xstrap | TWO wide elastic X straps, NO buckle (ribbed knit) |
| 03 | 03-knit-ankle-strap | Wide ANKLE strap + large buckle (knit) |
| 04 | 04-satin-ankle-strap | Wide ANKLE strap + buckle (satin) |
| 05 | 05-satin-maryjane | Single INSTEP buckle (satin) |
| 06 | 06-satin-ballet-xstrap | TWO wide elastic X straps, satin NOT knit |

## Summary

| Metric | Count |
|---|---|
| Storefront shots inspected | **54** (48 colorway SF + 6 fallbacks) |
| **FAIL** | **3** |
| PASS | 51 |
| Editorial/post/promo strap silhouette (spot) | Mostly correct product family; lifestyle wardrobe is non-nurse (Part B regen) |

## FAIL list

| Path | Why |
|---|---|
| `products/05-satin-maryjane/cream/sf-topdown-insole.png` | Closure reads as **Velcro / strap-overlap without buckle**; physical refs require **covered cream buckle + silver prong**. Also gold-ish heel vs sample. |
| `products/05-satin-maryjane/cream/sf-hero-34.png` | Buckle reads as **metallic gold/champagne**, not tonal **cream covered buckle** matching promptLock / physical refs. |
| `products/05-satin-maryjane/sf-fallback.png` | **Gold metal buckle + gold heel trim** — wrong hardware vs cream covered buckle / dark-or-pale cream heel on physical sample. |

## PASS notes (by product)

### 01 knit Mary Jane — PASS (all 13)
Black + beige heroes, sides, topdowns, pair/sole, fallback: single instep buckle, ribbed knit. Editorials/posts spot-check match instep MJ.

### 02 knit X-strap — PASS (all 13)
Clear double elastic X, no buckle, ribbed knit. Pair (black) / sole (beige) OK.

### 03 knit ankle — PASS (all 13)
Wide ankle strap + large tonal buckle, knit upper. Insole LUMIXIU when visible. Note: beige physical sample itself reads warm nude/pinkish; generated beige topdown is consistent with ref, not a strap FAIL.

### 04 satin ankle — PASS (all 13)
Wide ankle strap + chunky buckle, smooth satin (not knit). Cream + black-almond OK.

### 05 satin Mary Jane — PARTIAL
- black-pink: all SF PASS (instep buckle, satin, pink interior).
- cream: **3 FAILs** above; `sf-side` and `sf-pair-or-sole` PASS silhouette (instep MJ) with acceptable buckle presence.

### 06 satin X-strap — PASS (all 13)
Double elastic X, no buckle, smooth satin (not knit). Cream + black-pink OK.

## Lifestyle / posts / promos (silhouette spot-check)

| Asset | Strap silhouette | Notes |
|---|---|---|
| md-editorial samples (01/02/03/04/05/06) | Match product family | Wardrobe is civilian lifestyle — **Part B nurse regen required** |
| posts 01–06 sample | Match assigned product | Same — nurse regen |
| promo-04 (beige X-strap packshot) | Correct X-strap | Product-only banner; Part B adds nurse-coded campaign |

## Action

1. Regenerate the **3 FAIL** storefront files with absolute `reference_image_paths` from `simon-product-refs/manifest.json` product 05 cream (+ cream for fallback).
2. Part B: regenerate **all** `md-editorial-a/b`, `posts/post-*.png`, `promos/promo-*.jpg` with Southeast/East Asian **nurse** (scrubs preferred). Do **not** put nurses in `sf-*`.
3. Re-upload overwritten objects to the same Supabase storage paths.
