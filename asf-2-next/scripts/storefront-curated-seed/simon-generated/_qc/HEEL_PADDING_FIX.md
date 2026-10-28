# Heel padding (collar) color fix — 2026-10-25

## Verdict (Product 01 black)

| Part | Physical refs | Broken generated (app) | Fixed |
|---|---|---|---|
| Exterior | Black ribbed knit | Black (OK) | Black |
| Heel collar / back padding | **Black** smooth padded lining | **Tan/beige** (WRONG) | **Black** |
| Insole | Tan/beige + MODEL MATCH | Tan (OK) | Tan + MODEL MATCH |

Refs used: `simon-product-refs/01-knit-maryjane-buckle/black/{side,rear,topdown-insole-*}`.

User screenshot matched the bad generated hero (tan collar + tan insole).

## Regenerated (01 black)

| File | Action |
|---|---|
| `sf-hero-34.png` | Regenerated + uploaded |
| `sf-side.png` | Regenerated + uploaded |
| `sf-topdown-insole.png` | Regenerated + uploaded |
| `md-editorial-a.png` | Regenerated + uploaded (heel visible → black collar) |
| `md-editorial-b.png` | Regenerated + uploaded (heel visible → black collar) |
| `sf-pair-or-sole.png` | Already correct (black collar) — left |
| `sf-fallback.png` | Beige colorway shoe — N/A |

## Upload / DB

- Bucket paths (upsert webp):  
  `product_medias/storefront-curated/2026-10/simon/products/c1010001-…0001/c1500101-…0001/{shot}.webp`
- Cache-bust query: `?v=20261025heel1792941263` on media rows  
  `c1600111`, `c1600112`, `c1600113`, `c1600115`, `c1600116`
- CDN check: hero webp `content-length: 55098`, `last-modified` after upload

### Also (02 black topdown)

- Regenerated `02-knit-ballet-xstrap/black/sf-topdown-insole.png`
- Uploaded `…/c1010001-…0002/c1500201-…0001/sf-topdown-insole.webp`
- DB row `c1600213` → `?v=20261025heel1792941391`

## Spot-check other black colorways

| Product | Result |
|---|---|
| **02 black** hero/side | PASS — black collar + tan insole |
| **02 black** topdown | Was FAIL (tan collar); regenerated + uploaded with black collar (`?v=20261025heel…`) |
| **04 black-almond** | PASS vs refs — satin family intentionally has **tan** collar/lining |
| **05 / 06 black-pink** | PASS by design — **pink** interior (not the 01 tan-collar bug) |
| **01 fallback** | Beige exterior — not black |
