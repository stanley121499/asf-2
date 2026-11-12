# PER_PRODUCT_01 — Knit Mary Jane buckle QC

**SKU:** 01 · `01-knit-maryjane-buckle` · 针织玛丽珍扣带平底鞋  
**Date:** 2026-11-01  
**Cache-bust:** `?v=20261101p01qc`  
**Gallery:** 2-angle only (Angle A `sf-hero-34` + Angle B `sf-side`) + product `sf-fallback`

## Physical refs Read (vision)

| Colorway | Refs Read |
|---|---|
| **black** | `side-01.jpg`, `rear-01.jpg`, `topdown-insole-01.jpg` (+ manifest sole/topdowns listed) |
| **beige** | `side-01.jpg`, `side-02.jpg`, `rear-top-01.jpg` (+ manifest front-insole/sole listed) |

### Ref truth (checklist)

| Check | Black | Beige |
|---|---|---|
| Silhouette | MJ, rounded toe, single **instep** strap | Same |
| Strap/buckle | Knit strap + matte **black** square buckle | Knit/woven strap + matte **beige** buckle |
| Heel collar | **PRESENT** — smooth **black** padded collar | **PRESENT** — smooth **tan/beige** padded collar |
| Material | Ribbed knit | Ribbed knit (oatmeal) |
| Insole | Tan + brand print | Tan + brand print |
| Sole/heel | Black low block | Dark brown / medium tan low block |
| Invented parts | None on refs | None on refs |

**Hard rule:** 01-black keeps real black padded heel collar + tan insole (do **not** strip padding).

## Disk packshots Read (vision)

Paths under `simon-generated/products/01-knit-maryjane-buckle/`:

| Shot | Verdict | What was Read |
|---|---|---|
| `black/sf-hero-34.png` | **PASS** | MJ + black buckle; **black padded collar**; tan insole; ribbed knit; Angle A |
| `black/sf-side.png` | **PASS** | Left profile; taut MJ strap; **black padded collar**; tan insole; Angle B |
| `beige/sf-hero-34.png` | **PASS** | MJ + beige buckle; **tan padded collar**; dark brown sole; Angle A |
| `beige/sf-side.png` | **PASS** | Left profile; taut MJ; **tan padded collar**; dark brown sole; Angle B |
| `sf-fallback.png` | **PASS** | = black Angle A (same black collar + tan insole) |

## CDN finals Read (vision) — after upsert

Downloaded public webp → PNG, then Read:

`…/c1010001-…0001/{fallback\|c1500101-…0001\|c1500101-…0002}/…webp?v=20261101p01qc`

| CDN asset | HTTP | Verdict | Match vs refs |
|---|---|---|---|
| black `sf-hero-34.webp` | 200 | **PASS** | MJ, knit, black buckle, **black padded collar**, tan insole, Angle A |
| black `sf-side.webp` | 200 | **PASS** | Same structure; Angle B left |
| beige `sf-hero-34.webp` | 200 | **PASS** | MJ, knit, beige buckle, **tan padded collar**, brown sole, Angle A |
| beige `sf-side.webp` | 200 | **PASS** | Same; denser strap weave visible; Angle B left |
| `fallback.webp` | 200 | **PASS** | Identical to black hero |

## What was fixed

| Item | Action |
|---|---|
| Structural regen | **None required** — disk + CDN already matched refs on silhouette / strap / heel collar / knit / orientation |
| Storage upsert | Re-uploaded all 5 webps to same paths (bytes match prior straptidy encode) |
| DB | `product_medias` ×5 for product `c1010001-…0001` → `?v=20261101p01qc` |
| Lifestyle | `post-01` (beige), `post-07` (black) Read — MJ + heel/strap **not clearly wrong**; left alone |

## Lifestyle spot-check (01 only)

| Asset | Heel/strap | Action |
|---|---|---|
| `posts/post-01.png` | Beige MJ strap+buckle present; no ankle/X miss | No regen |
| `posts/post-07.png` | Black MJ; **black padded collar** visible on foot | No regen |

## DB rows (post-update)

| id | arr | color | media_url token |
|---|---:|---|---|
| `c1600100-…` | 1 | fallback | `?v=20261101p01qc` |
| `c1600111-…` | 10 | black | `?v=20261101p01qc` |
| `c1600112-…` | 11 | black | `?v=20261101p01qc` |
| `c1600121-…` | 10 | beige | `?v=20261101p01qc` |
| `c1600122-…` | 11 | beige | `?v=20261101p01qc` |

URL map: `storefront-curated-seed/.tmp/simon_p01qc_urls.json`

## Final scorecard (storefront)

| Shot | Pass/Fail |
|---|---|
| black Angle A | **PASS** |
| black Angle B | **PASS** |
| beige Angle A | **PASS** |
| beige Angle B | **PASS** |
| fallback | **PASS** |

**Proof:** Physical refs Read → disk packshots Read → CDN `?v=20261101p01qc` downloaded and Read again; all five match ref checklist (MJ silhouette, instep strap/buckle, colorway-correct padded heel collar present, ribbed knit, correct A/B orientation, no invented parts).
