# PER_PRODUCT_04 — 缎面踝带扣平底鞋 (satin ankle strap)

**Date:** 2026-11-01  
**Cache-bust:** `?v=20261101p04qc`  
**Product ID:** `c1010001-24a8-4f00-8000-000000000004`  
**Gallery:** 2-angle (arr 10 hero + 11 side) + product fallback  

## Ref truth (heel + sole)

Physical cream refs under `simon-product-refs/04-satin-ankle-strap/cream/`:

| Ref | Heel / sole truth |
|---|---|
| `rear-01.jpg`, `side-01.jpg` | Slim flush topline; vertical satin strip + strap loop only; **no** padded Achilles pillow |
| `side-rear-01.jpg` | Same construction; tan lining flush (do not invent rolled collar pad) |
| `sole-01.jpg` + side edges | **Cream / off-white** outsole + low block heel (not dark brown / wood) |

Black-almond refs: same slim heel geometry; black exterior + almond lining + cream footbed.

## Prior CDN re-verify (`?v=20261101nocushion04` / `straptidy`)

User distrust of prior QC was **justified**.

| Shot | Live before | Verdict |
|---|---|---|
| cream `sf-hero-34` | Slim heel OK, but **dark brown sole** vs cream physical | **FAIL** sole |
| cream `sf-side` | **Invented padded heel collar** + dark brown sole | **FAIL** heel + sole |
| `sf-fallback` (= old cream hero) | Same as cream hero | **FAIL** sole |
| black-almond hero / side | Slim heel; black exterior + cream/almond interior | **PASS** (kept) |
| cream `md-editorial-a/b` | Slim heel on feet | **PASS** (no lifestyle regen) |
| black-almond `md-editorial-b` | Slim heel on feet | **PASS** (no lifestyle regen) |

## Actions this pass

1. Regenerated cream `sf-hero-34.png` + `sf-side.png` with cream physical refs; forced slim heel + cream sole + satin sheen.  
2. Copied cream hero → `sf-fallback.png`.  
3. Re-uploaded **all five** gallery/fallback objects (cream + black-almond + fallback) as webp.  
4. Updated `product_medias.media_url` → `?v=20261101p04qc`.  
5. Corrected `simon-product-refs/manifest.json` cream `soleHeel` / sole color notes (physical cream sole).

## Live verification after upload (`?v=20261101p04qc`)

Fetched CDN webp → PNG; vision vs refs. HTTP 200; `last-modified` 2026-11-01 ~09:45 UTC.

| Shot | Colorway | Live URL token | Heel pillow | Satin | Sole | Result |
|---|---|---|---|---|---|---|
| `sf-hero-34` | cream | `…/c1500401-…0001/sf-hero-34.webp?v=20261101p04qc` | none / slim flush | soft cream sheen | cream/off-white | **PASS** |
| `sf-side` | cream | `…/c1500401-…0001/sf-side.webp?v=20261101p04qc` | none / slim flush | soft cream sheen | cream/off-white | **PASS** |
| `sf-fallback` | product (cream Angle A) | `…/fallback.webp?v=20261101p04qc` | none (byte-identical to cream hero; len 47760) | soft cream sheen | cream/off-white | **PASS** |
| `sf-hero-34` | black-almond | `…/c1500401-…0002/sf-hero-34.webp?v=20261101p04qc` | none / slim flush | low-sheen black satin | black | **PASS** |
| `sf-side` | black-almond | `…/c1500401-…0002/sf-side.webp?v=20261101p04qc` | none / slim flush | soft black satin | dark heel block | **PASS** |

### Lifestyle (spot-check; heel already OK → not regenerated)

| Asset | Heel | Result |
|---|---|---|
| `cream/md-editorial-a.png` | slim flush | PASS (local) |
| `cream/md-editorial-b.png` | slim flush | PASS (local) |
| `black-almond/md-editorial-b.png` | slim flush | PASS (local) |

## Sample live URLs

```
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000004/c1500401-24a8-4f00-8000-000000000001/sf-hero-34.webp?v=20261101p04qc
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000004/c1500401-24a8-4f00-8000-000000000001/sf-side.webp?v=20261101p04qc
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000004/fallback.webp?v=20261101p04qc
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000004/c1500401-24a8-4f00-8000-000000000002/sf-hero-34.webp?v=20261101p04qc
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000004/c1500401-24a8-4f00-8000-000000000002/sf-side.webp?v=20261101p04qc
```

URL map: `../.tmp/simon_p04qc_urls.json`

## Verdict

**Product 04 gallery packshots: PASS (5/5 live).**  
Prior `nocushion04` cream claim was incomplete: cream **side still had pillow** and cream **soles were wrong dark brown** until this `p04qc` pass.
