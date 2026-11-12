# PER PRODUCT 06 — 缎面芭蕾交叉带平底鞋 (satin X-strap)

**Date:** 2026-11-01  
**Owner:** Product 06 only  
**Cache-bust:** `?v=20261101p06qc`  
**Live gallery:** 2 angles + fallback (`sf-hero-34`, `sf-side`, `sf-fallback`)  
**Trigger:** User PDP screenshot cream Angle A — floppy / rippled X-straps (not packshot-tidy).

Physical truth: `simon-product-refs/06-satin-ballet-xstrap/`  
Generated: `simon-generated/products/06-satin-ballet-xstrap/`  
Backup before this pass: `simon-generated/_bak_p06qc_20261101/`

## Hard rules checked

1. **Straps:** taut, tidy, geometric X — industry packshot (not floppy / wavy / slack).
2. **Heel / interior per colorway refs:**
   - **cream:** pale cream/yellowish low block heel + light tan/cream interior (NOT pink).
   - **black-pink:** black exterior/heel + **pink** lining/insole + black MODEL MATCH when open.

Physical cream refs themselves show empty elastic slack — finals are styled tighter than raw sample photos while keeping silhouette / satin / pale sole.

## Vision verdict (LIVE CDN `?v=20261101p06qc`)

Proof artifacts (local):

- `assets/p06qc-LIVE-vs-before.png` — user-fail / BAK vs LIVE comparative grid → cream + black-pink **PASS**
- `assets/p06qc-cream-v5v6-grid.png` — LIVE cream vs user FAIL + black taut refs → LIVE cream straps tidy; v6 discarded (lost X)
- `assets/p06qc-before-after-grid.png` — regen before/after → AFTER straps cleaner
- `assets/p06qc-lifestyle-feet-compare.png` — cream lifestyle feet BEFORE vs AFTER v2 → AFTER taut

| Shot | Colorway | Straps | Heel / interior | Verdict |
|---|---|---|---|---|
| `sf-hero-34` Angle A | cream | Taut centered X vs user-fail floppy (LIVE-vs-before) | Pale cream heel; cream/tan interior (correct for cream) | **PASS** |
| `sf-side` Angle B | cream | Taut / upright vs BAK floppy side (LIVE-vs-before) | Pale cream heel; tan sole edge | **PASS** |
| `sf-fallback` (= cream A) | cream | Same as cream hero | Same as cream hero | **PASS** |
| `sf-hero-34` Angle A | black-pink | Razor-taut geometric X | Pink insole + MODEL MATCH; black heel | **PASS** |
| `sf-side` Angle B | black-pink | Taut X; pink rim visible | Pink lining; black heel | **PASS** |
| `posts/post-06` | cream lifestyle | AFTER v2 flush X vs BEFORE gaps (feet compare) | Pale cream heel on foot | **PASS** |
| `posts/post-09` | black-pink lifestyle | Already taut on-foot X | Pink lining glimpse | **PASS** (kept) |
| `cream/md-editorial-a` | cream lifestyle | AFTER v2 tighter vs BEFORE | Cream heel | **PASS** (storage; not PDP gallery) |
| `cream/md-editorial-b` | cream lifestyle | AFTER v2 tighter vs BEFORE | Cream heel | **PASS** (storage; not PDP gallery) |
| `black-pink/md-editorial-*` | black-pink | Taut; pink insole clear on A | Pink OK | **PASS** (kept) |

### Soft residual (non-blocking)

Empty cream elastic on cream satin can still read faintly softer than black-on-black contrast in isolated side crops; comparative grids vs the user-fail screenshot still clear **PASS**. Cream must **not** use pink insole (that is black-pink only).

## Regenerated + uploaded

| Local path | Action |
|---|---|
| `cream/sf-hero-34.png` | Regenerated taut X; pale cream heel |
| `cream/sf-side.png` | Regenerated taut X; Angle B left |
| `sf-fallback.png` | = cream Angle A |
| `black-pink/sf-hero-34.png` | Regenerated taut X; pink insole / MODEL MATCH |
| `black-pink/sf-side.png` | Regenerated taut X; pink rim |
| `cream/md-editorial-a.png` | Regenerated (on-foot X tidy) |
| `cream/md-editorial-b.png` | Regenerated (on-foot X tidy) |
| `posts/post-06.png` | Regenerated (cream lifestyle X tidy) |

URL map: `../.tmp/simon_p06qc_urls.json`

## DB / CDN

| Surface | Rows / files with `?v=20261101p06qc` |
|---|---|
| `product_medias` (06 fallback + 2 CW × 2 angles) | **5 / 5** |
| `post_medias` (post-06) | **1** |
| Storage editorials (cream md-a/b) | upserted (not in PDP gallery) |

CDN spot-check 2026-11-01 ~09:49 UTC — all **HTTP 200** webp, `Last-Modified: Sun, 01 Nov 2026 09:49:49 GMT`.

### Sample LIVE URLs

```
…/c1010001-…0006/c1500601-…0001/sf-hero-34.webp?v=20261101p06qc
…/c1010001-…0006/c1500601-…0001/sf-side.webp?v=20261101p06qc
…/c1010001-…0006/fallback.webp?v=20261101p06qc
…/c1010001-…0006/c1500601-…0002/sf-hero-34.webp?v=20261101p06qc
…/c1010001-…0006/c1500601-…0002/sf-side.webp?v=20261101p06qc
…/posts/c2010001-…0006.webp?v=20261101p06qc
```

## Rules preserved

- Two-angle storefront only on PDP
- Cream pale sole/heel (not dark brown)
- Black-pink pink interior
- Satin (not knit product 02)
- Refs not used as app media
- Same storage paths upserted

## App note

Force-quit Expo / clear image cache so `?v=20261101p06qc` is fetched.
