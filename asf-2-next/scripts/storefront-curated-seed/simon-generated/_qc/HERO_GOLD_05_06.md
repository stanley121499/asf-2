# HERO_GOLD_05_06 — Warm-neutral heroes + strap QC

**Products:** 05 `05-satin-maryjane` · 06 `06-satin-ballet-xstrap`  
**Date:** 2026-11-02  
**Cache-bust:** `?v=20261102warm0506`  
**Scope:** `sf-hero-34` (+ cream `sf-fallback` clones) only. **Model slot2 untouched. No rembg.**

## Gold angle

Simon PASS cream X PDP (product 06 cream Angle A): toe bottom-left, **slight-right toe/head yaw**, tidy straps, soft studio contact shadow.

## Warm-neutral backgrounds (unique vs 01–04)

Style lock: warm field like user attach (~`#F7F3F0` cream/bone), **not** pure `#FFFFFF` / `#F7F7F5`.

| Product | Tint name | Documented hex | Notes |
|---|---|---|---|
| **05** | warm biscuit | **`#F0DCC7`** | Soft apricot-stone field (measured corner avg both CWs ≈ `#F0DCC7` / `#EEDBC6`) |
| **06** | warm linen | **`#EBDED0`** | Warm greige linen field (measured corner avg both CWs = `#EBDED0`) |

These are intentionally distinct from each other and from the shared warm-field style of the 02 screenshot.

## Method

1. Studio AI regen (`GenerateImage`) with gold cream-X angle lock + physical refs as `reference_image_paths` only.  
2. Gentle seamless-field unify so both colorways of a product share one warm tint (no rembg / no WhatsApp cutouts).  
3. Uploaded 6 webps (05/06 heroes ×2 + fallbacks). DB `product_medias.media_url` → `?v=20261102warm0506` for arrangement **1** and **10** only.  
4. Backup: `simon-generated/_bak_warm0506_20261102/`  
5. URL map: `.tmp/simon_warm0506_urls.json`  
6. Proof grid: `_qc/.tmp-p0506-warm/STRAP_QC_GRID.jpg`

## Strap QC vs physical refs (vision)

| Shot | Colorway | Ref lock | Strap verdict | Angle / yaw | Studio / bg |
|---|---|---|---|---|---|
| `sf-hero-34` / fallback | **06 cream** | `cream/side-02`, `cream/topdown-01` + Simon PASS gold | **PASS** — wide coarse-ribbed X, taut/tidy, plank mass held (Simon strap PASS fidelity kept) | **PASS** gold yaw | **PASS** warm linen `#EBDED0`, soft shadow, not rembg |
| `sf-hero-34` | **06 black-pink** | cream X width + `black-pink/side-01` | **PASS** — wide black X, tidy cross; pink insole + MODEL MATCH; cream sole lip | **PASS** | **PASS** same `#EBDED0` |
| `sf-hero-34` / fallback | **05 cream** | `cream/side-01`, `front-01` | **PASS** — single instep MJ strap, cream fabric-covered buckle + silver prong, tidy taut | **PASS** | **PASS** warm biscuit `#F0DCC7` |
| `sf-hero-34` | **05 black-pink** | `black-pink/side-01`, cream structure | **PASS** — black covered buckle + silver prong, tidy strap; pink lining; tan sole lip | **PASS** | **PASS** same `#F0DCC7` |

### MINOR residuals

- 05 BP insole crest OCR can drift (“MODEL MATCH” vs micro-glyph variance).  
- 06 cream elastic can read slightly cooler/lighter than satin upper (physical refs also show elastic vs upper tonal split).  
- Soft-square toe on 05 can read softly rounded under 3/4; structure still Mary Jane not X.

## Confirm

**PRODUCT 05 + 06 heroes PASS** under `?v=20261102warm0506` — warm unique tints documented, gold yaw locked, straps vision-checked vs physical refs, studio AI only (no rembg), model slot2 not modified.
