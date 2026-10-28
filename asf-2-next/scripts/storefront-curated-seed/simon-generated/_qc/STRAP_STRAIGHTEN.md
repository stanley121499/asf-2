# Strap straighten QC — 2026-10-25

**Goal:** All Simon packshot straps look straight, taut, symmetrical, professionally held up (not sagging / twisted / askew).

**Prompt addendum (every regen):** strap(s) perfectly straight, taut, symmetrically aligned, professionally adjusted as in premium e-commerce product photography, not crooked, not sagging, not twisted, not loose.

**Refs:** `simon-product-refs/manifest.json` colorway `refs` (+ existing packshot for framing). Physical WhatsApp refs = reference only.

## Regenerated count

| Kind | Count | Notes |
|---|---:|---|
| `sf-hero-34` | 12 | All 6 products × 2 colorways |
| `sf-side` | 12 | All colorways |
| `sf-topdown-insole` | 12 | All colorways |
| `sf-pair-or-sole` | 6 | Pair colorways only (sole undersides skip — no strap) |
| `sf-fallback` | 6 | One per product (primary CW) |
| **Storefront packshots** | **48** | |
| `md-editorial-a` | 3 | 01-black, 02-black, 03-blush (nurse wardrobe kept) |
| `posts/post-01.png` | 1 | Beige MJ hotel lobby; straps taut |
| **Lifestyle** | **4** | |
| **TOTAL regenerated** | **52** | |

## Skipped / kept

| Asset | Reason |
|---|---|
| `sf-pair-or-sole` for beige / black-almond / black-pink “B” CWs | Sole underside shots — straps not visible |
| `promo-01-new-season.jpg` | Regen garbled Chinese headline; kept original |
| Other `md-editorial-*`, posts 02–10, promos 02–06 | Spot-check; packshots were primary; not all re-run |

## Sample local paths

```
simon-generated/products/01-knit-maryjane-buckle/black/sf-hero-34.png
simon-generated/products/02-knit-ballet-xstrap/beige/sf-side.png
simon-generated/products/03-knit-ankle-strap/blush/sf-hero-34.png
simon-generated/products/04-satin-ankle-strap/cream/sf-side.png
simon-generated/products/05-satin-maryjane/cream/sf-hero-34.png
simon-generated/products/06-satin-ballet-xstrap/black-pink/sf-topdown-insole.png
simon-generated/products/01-knit-maryjane-buckle/sf-fallback.png
simon-generated/posts/post-01.png
```

## Upload

`simon_cutover_upload.py` → **94** upserts, **errors=0**  
Prefix unchanged: `storefront-curated/2026-10/simon/...` (DB URLs unchanged).
