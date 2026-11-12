# HERO_CAMLOCK_05_06 — Locked 7 o’clock camera

**Products:** 05 `05-satin-maryjane` · 06 `06-satin-ballet-xstrap`  
**Date:** 2026-11-02  
**Cache-bust:** `?v=20261102cam7_0506`  
**Scope:** `sf-hero-34` (+ cream `sf-fallback` clones) only. **Model slot2 untouched. No rembg.**

## Camera lock (NON-NEGOTIABLE)

1. **Toe / midline points to 7 o’clock** (bottom-left).
2. **Identical camera height / distance / pitch** across all four colorways — moderate low-elevated 3/4 matching gold cream-X PASS. **Reject** any higher / bird’s-eye / top-down outlier.
3. Same pointing direction for every SKU.
4. Keep muted low-chroma warm-gray BG (unique tint per product).
5. Strap fidelity — especially **06 cream X** (wide coarse-ribbed elastic mass).

## Muted backgrounds (from mute0506)

| Product | Tint | Target | Measured ship corner |
|---|---|---|---|
| **05** | quiet warm stone | `#D8D1C8` | both CWs `#D8D1C8` |
| **06** | quiet warm greige | `#CDC8C1` | both CWs `#CDC8C1` |

## Method

1. Studio AI regen (`GenerateImage`) locked to gold cream-X camera crop + cream MJ lock sibling; physical refs for straps. Rejected higher-angle candidates (notably early 06 bp C).
2. Corner flood-fill seamless-field unify to exact mute hex (preserves shoe + soft shadow; no rembg).
3. Uploaded 6 webps (05/06 heroes ×2 + cream fallbacks). DB `product_medias.media_url` → `?v=20261102cam7_0506` for arrangement **1** and **10** only.
4. Backup: `simon-generated/_bak_cam7_0506_20261102/`
5. URL map: `.tmp/simon_cam7_0506_urls.json`
6. Workbench: `_qc/.tmp-cam7-0506/` — side-by-side grids in `cmp/`

## Vision side-by-side QC

Proof: `_qc/.tmp-cam7-0506/cmp/cmp-cam7-ship-final.jpg`

| Shot | Colorway | Toe 7:00 | Cam height vs lock | Strap / buckle | BG | Verdict |
|---|---|---|---|---|---|---|
| `sf-hero-34` / fallback | **05 cream** | **PASS** | **PASS** lock sibling | MJ strap; cream covered buckle + silver prong | stone `#D8D1C8` | **PASS** |
| `sf-hero-34` | **05 black-pink** | **PASS** | **PASS** matched | black covered buckle + silver prong; pink lining | same stone | **PASS** |
| `sf-hero-34` / fallback | **06 cream** | **PASS** | **PASS** matched | wide X elastic, taut/tidy mass held | greige `#CDC8C1` | **PASS** |
| `sf-hero-34` | **06 black-pink** | **PASS** | **PASS** (C rejected high; D locked) | wide black X; pink insole; cream sole lip | same greige | **PASS** |

### Rejected during QC

- Early 05 bp B — too flat side-profile vs lock.
- 06 bp C — noticeably higher camera / more footbed than siblings → **FAIL**, replaced by D.

## Not touched

- Model slot2 (`sf-model`, arrangement **11**) — still `?v=20261102model0406`
- `sf-side`, spins, editorials, posts, promos

## Confirm

**PRODUCT 05 + 06 heroes PASS** under `?v=20261102cam7_0506` — toe 7 o’clock, identical camera height across all four, muted unique warm-grays held, 06 cream X strap fidelity vision-checked, studio AI only (no rembg), model slot2 not modified.
