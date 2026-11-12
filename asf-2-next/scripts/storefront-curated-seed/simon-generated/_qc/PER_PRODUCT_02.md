# PER_PRODUCT_02 — Knit ballet X-strap (针织芭蕾交叉带平底鞋)

**Date:** 2026-11-01  
**Owner scope:** Product 02 only (black + beige)  
**Gallery:** 2-angle only (`sf-hero-34`, `sf-side`) + `sf-fallback`  
**Cache-bust:** `?v=20261101p02qc`  
**Refs:** `simon-product-refs/02-knit-ballet-xstrap/` (physical samples) — **not** uploaded to app

## Ref truth (vision-read)

| Ref | Heel / back | Straps |
|---|---|---|
| `black/side-01.jpg`, `black/rear-01.jpg`, `black/front-01.jpg` | Slim flush topline; vertical heel strip + pull tab; **NO** padded pillow collar | Two wide elastic X; packshot target = taut/tidy |
| `beige/side-01.jpg`, `beige/rear-01.jpg`, `beige/side-hand-01.jpg` | Same — thin knit rim, vertical strip, **NO** pillow (prior bug invented pillow on beige) | Matching beige elastic X |

Manifest `promptLock.heelCollar`: **NONE**. `mustNot` includes padded back cushion / pillow heel collar.

## Final packshot vision QC (Read after regen)

Hard rule: physical refs + final files Read and compared. Lifestyle not required (X + heel match).

| Shot | Result | Vision proof vs refs |
|---|---|---|
| `black/sf-hero-34.png` | **PASS** | Ribbed black knit; clear taut X; slim heel rim, **no pillow**; tan insole peek; low black block heel; studio BG |
| `black/sf-side.png` | **PASS** | Side profile X taut; vertical pull tab only; **no** Achilles pillow; black sole/heel; tan lining rim |
| `beige/sf-hero-34.png` | **PASS** | Oatmeal ribbed knit; taut beige X; slim heel + small pull tab; **no invented pillow**; medium-brown low heel |
| `beige/sf-side.png` | **PASS** | Side X taut/tidy; flush heel topline matches beige rear/side refs; brown block heel; no pillow |
| `sf-fallback.png` | **PASS** | = beige Angle A hero copy; same heel/strap PASS criteria |

**Overall:** **5 / 5 PASS**

## Actions taken

1. Read physical refs (black side/rear/front; beige side/rear/side-hand).
2. Read prior packshots; regenerated all 5 with refs attached (square-ish ballet toe, taut X, explicit no-pillow lock).
3. Re-Read final PNGs in `simon-generated/products/02-knit-ballet-xstrap/` — all PASS.
4. Uploaded webp upserts to Supabase storage; updated `product_medias.media_url` → `?v=20261101p02qc`.
5. No WhatsApp / physical ref images written into app media tables.

## Live URLs

```
…/c1010001-…0002/fallback.webp?v=20261101p02qc
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261101p02qc
…/c1010001-…0002/c1500201-…0001/sf-side.webp?v=20261101p02qc
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261101p02qc
…/c1010001-…0002/c1500201-…0002/sf-side.webp?v=20261101p02qc
```

URL map: `../.tmp/simon_p02_qc_urls.json`
