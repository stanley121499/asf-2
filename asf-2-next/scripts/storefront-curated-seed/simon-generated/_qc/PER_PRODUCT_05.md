# PER_PRODUCT_05 — Satin Mary Jane (instep) QC

**Product:** 05 `05-satin-maryjane` · 缎面玛丽珍平底鞋  
**Date:** 2026-11-01  
**Cache-bust:** `?v=20261101p05qc`  
**Gallery:** 2 angles only (`sf-hero-34` arr 10 + `sf-side` arr 11) + fallback  
**Refs truth:** `simon-product-refs/05-satin-maryjane/{cream,black-pink}/`

## Hard rules checked

| Rule | Cream | Black-pink |
|---|---|---|
| Single **instep** MJ strap + small buckle (not ankle / not X) | required | required |
| Strap **professionally taut** (no limp arch / crumple) | required | required |
| Buckle | cream **fabric-covered** + silver prong | black covered + silver prong |
| Heel / interior | **pale cream/yellow heel**; pale tan/nude lining — no invented pillow pad | **pink lining + pink insole by design**; black heel preferred |
| Material | satin sheen (not knit) | satin sheen (not knit) |

## Before (local disk prior to this pass)

| Shot | Verdict | Vision issue |
|---|---|---|
| cream `sf-hero-34` | **FAIL** | Exposed gold/champagne metal buckle frame vs physical cream fabric-covered buckle |
| cream `sf-side` | **FAIL** | Silver/metal buckle body; strap soft-pass but hardware wrong |
| `sf-fallback` | **FAIL** | Same as cream hero (gold metal buckle) |
| black-pink `sf-hero-34` | PASS | Taut MJ; pink interior; black covered buckle; MODEL MATCH peek |
| black-pink `sf-side` | PASS | Taut MJ; pink rim; black heel; Angle B left |

## Actions

1. Regenerated cream Angle A + Angle B with physical buckle refs (`topdown-insole`, `side-02`, `front`, `side-01`) until fabric-covered cream buckle + pale heel matched.
2. Angle B flipped to **toe-left** for storefront convention.
3. `sf-fallback.png` ← cream Angle A.
4. Black-pink packshots kept (already ref-aligned / strap-tidy).
5. Lifestyle spot-check: `posts/post-05.png` (pink insole, taut MJ) + `promos/promo-03-satin-elegance.jpg` (cream covered buckle, pale heel) — **no regen**.
6. Upserted 5 webps to `product_medias` storage; DB `media_url` → `?v=20261101p05qc`.

Backup: `simon-generated/_bak_p05qc_20261101/`  
URL map: `.tmp/simon_p05qc_urls.json`

## After — LIVE CDN vision proof (`?v=20261101p05qc`)

CDN `last-modified` 2026-11-01 ~09:46 UTC, HTTP 200 webp for all five.

| Shot | Colorway | Result | Vision proof |
|---|---|---|---|
| `sf-hero-34` | cream | **PASS** | Cream satin; taut instep strap; **cream fabric-covered square buckle** + silver prong; pale yellow-cream block heel; pale beige/nude lining (not pink); soft square toe; studio white |
| `sf-side` | cream | **PASS** | Toe-left Angle B; taut MJ; tonal cream covered buckle; pale creamy-yellow heel + sole edge; pale tan lining peek; satin sheen |
| `sf-fallback` | (cream primary) | **PASS** | Same as cream hero — covered buckle, pale heel, no metal-gold frame |
| `sf-hero-34` | black-pink | **PASS** | Matte black satin; **pink interior** + MODEL MATCH; taut black MJ strap; black covered buckle + silver prong; black low heel |
| `sf-side` | black-pink | **PASS** | Toe-left; pink lining rim clear; taut strap/buckle; black heel; no invented Achilles pillow |

### Lifestyle (spot, not gallery)

| Asset | Result | Notes |
|---|---|---|
| `posts/post-05.png` | **PASS** | On-foot black MJ; pink insole + crest; straps taut |
| `promos/promo-03-satin-elegance.jpg` | **PASS** | Cream MJ; tonal covered buckle; pale heel |

## Live URLs

```
…/c1010001-…0005/fallback.webp?v=20261101p05qc
…/c1010001-…0005/c1500501-…0001/sf-hero-34.webp?v=20261101p05qc
…/c1010001-…0005/c1500501-…0001/sf-side.webp?v=20261101p05qc
…/c1010001-…0005/c1500501-…0002/sf-hero-34.webp?v=20261101p05qc
…/c1010001-…0005/c1500501-…0002/sf-side.webp?v=20261101p05qc
```

## Score

| Bucket | Pass | Fail |
|---|---:|---:|
| Live packshots (5) | **5** | **0** |
| Lifestyle spot (2) | **2** | **0** |

**PRODUCT 05 overall: PASS** under `?v=20261101p05qc`.
