# PER_PRODUCT_03 — Knit ankle strap (LUMIXIU) — 2026-11-01

## Verdict

**PASS on live CDN** (`?v=20261101studio03`) as **professional studio ecommerce packshots**.

User rejected rembg/physical cutouts (`p03qc`). Regenerated with GenerateImage + physical refs as fidelity only. Soft white seamless, soft light, soft contact shadow. **Confirmed: no cutouts.**

## Hard rules

| Rule | Live |
|---|---|
| Angle A toe bottom-left ¾ | **PASS** |
| Angle B side pointing left | **PASS** |
| Heel slim flush + pull-tab/strip — **NO** padded pillow | **PASS** |
| Wide ankle strap + covered tonal buckle + silver prong | **PASS** |
| Studio (not rembg cutout) | **PASS** |
| Blush `#E8C4C4` ≠ beige `#D6C6A8` | **PASS** (MAD≈9+) |

## Shipped

| File | Notes |
|---|---|
| `beige/sf-hero-34.png` | Studio Angle A |
| `beige/sf-side.png` | Studio Angle B |
| `blush/sf-hero-34.png` | Studio Angle A dusty rose |
| `blush/sf-side.png` | Studio Angle B |
| `sf-fallback.png` | = beige Angle A |

Cache-bust: **`?v=20261101studio03`**  
URL map: `../.tmp/simon_studio03_urls.json`

## Remaining (see DEEP_DIFF_03 Post-fix)

- **CRITICAL (1):** no unique blush physical photos in-repo  
- **MAJOR (2):** sole not in 2-angle gallery; fallback beige-only  
