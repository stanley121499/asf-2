# HERO_MUTE_BG_05_06 — Face-on yaw + muted warm-gray heroes

**Products:** 05 `05-satin-maryjane` · 06 `06-satin-ballet-xstrap`  
**Date:** 2026-11-02  
**Cache-bust:** `?v=20261102mute0506`  
**Scope:** `sf-hero-34` (+ cream `sf-fallback` clones) only. **Model slot2 untouched. No rembg.**

## Yaw lock (update vs warm0506)

User home-grid feedback: prior heroes read too side-profile. Regen to **more face-on 3/4** — toe still bottom-left, but open toe box / strap plane faces the camera more (gold cream-X PDP yaw family). Soft studio contact shadow retained.

## Muted quiet warm-grays (unique vs biscuit/linen + 01–04)

Prior warm0506 fields were too bright / too chromatic on the PLP grid:

| Prior | Hex | chroma | luma |
|---|---|---|---|
| 05 warm biscuit | `#F0DCC7` | ~41 | ~223 |
| 06 warm linen | `#EBDED0` | ~27 | ~224 |

Muted ship (corner avg, live CDN):

| Product | Tint name | Target | Measured ship | Notes |
|---|---|---|---|---|
| **05** | quiet warm stone | **`#D8D1C8`** | cream/bp ≈ `#D7D1C8` / `#D8D0C8` (chroma ~15–16, luma ~209) | Distinct from 06; quieter than biscuit |
| **06** | quiet warm greige | **`#CDC8C1`** | both CWs ≈ `#CCC7C0` (chroma ~12, luma ~200) | Slightly cooler/darker than 05 |

Both colorways of a product share one mute field.

## Method

1. Studio AI regen (`GenerateImage`) with gold cream-X face-on yaw lock + physical refs as `reference_image_paths` only (no rembg).  
2. Corner flood-fill seamless-field unify to exact mute hex (preserves shoe + soft shadow; cream upper not eaten).  
3. Uploaded 6 webps (05/06 heroes ×2 + cream fallbacks). DB `product_medias.media_url` → `?v=20261102mute0506` for arrangement **1** and **10** only.  
4. Backup: `simon-generated/_bak_mute0506_20261102/`  
5. URL map: `.tmp/simon_mute0506_urls.json`  
6. Workbench: `_qc/.tmp-mute0506/` (cmp vs gold, masks, ship)

## Strap / construction QC (vision)

| Shot | Colorway | Ref lock | Strap / buckle | Yaw | BG |
|---|---|---|---|---|---|
| `sf-hero-34` / fallback | **06 cream** | gold cream-X + prior PASS live straps + `cream/side-02`, `topdown-01` | **PASS** — wide coarse-ribbed X, taut/tidy mass held | **PASS** more face-on | **PASS** quiet greige `#CDC8C1` |
| `sf-hero-34` | **06 black-pink** | cream X mass + bp refs | **PASS** — wide black X; pink insole + MODEL MATCH; cream sole lip | **PASS** | **PASS** same greige |
| `sf-hero-34` / fallback | **05 cream** | `cream/side-01`, `front-01` | **PASS** — single MJ strap; cream fabric-covered buckle + silver prong | **PASS** | **PASS** quiet stone `#D8D1C8` |
| `sf-hero-34` | **05 black-pink** | `black-pink/side-01`, `front-01` | **PASS** — black covered buckle + silver prong; pink lining; tan sole lip | **PASS** | **PASS** same stone |

### MINOR residuals

- 05 BP insole crest OCR can drift (“MODEL MATCH” glyph variance).  
- Soft-square toe on 05 can read softly rounded under face-on 3/4; structure still Mary Jane not X.

## Not touched

- Model slot2 (`sf-model`, arrangement **11**) — still `?v=20261102model0406`  
- `sf-side`, spins, editorials, posts, promos

## Confirm

**PRODUCT 05 + 06 heroes PASS** under `?v=20261102mute0506` — face-on yaw, muted unique warm-grays documented, strap fidelity held (06 cream X mass kept), studio AI only (no rembg), model slot2 not modified.
