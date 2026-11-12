# MODEL SLOT 2 — products 04 / 05 / 06

**Date:** 2026-11-02  
**Scope:** Gallery image 2 (arrangement `11`) only — both colorways each  
**Cache-bust:** `?v=20261102model0406`  
**Upload script:** `../simon_model_slot2_0406_upload.py`  
**URL map:** `../.tmp/simon_model_slot2_0406_urls.json`

## Intent

Replace former side-view packshot (`sf-side` / Angle B) with a **nurse/lifestyle model wearing that exact shoe**. Keep **hero** (`sf-hero-34`, arr 10) and **fallback** untouched. **Do not remove spin** (other agent). **No WhatsApp rembg** — all shots are AI studio/lifestyle generations with physical refs attached.

## Live DB (`product_medias`)

| Product | Colorway | media id | Path | Token |
|---|---|---|---|---|
| 04 | cream | `c1600412-…` | `…/0004/…0001/sf-model.webp` | `?v=20261102model0406` |
| 04 | black-almond | `c1600422-…` | `…/0004/…0002/sf-model.webp` | `?v=20261102model0406` |
| 05 | cream | `c1600512-…` | `…/0005/…0001/sf-model.webp` | `?v=20261102model0406` |
| 05 | black-pink | `c1600522-…` | `…/0005/…0002/sf-model.webp` | `?v=20261102model0406` |
| 06 | cream | `c1600612-…` | `…/0006/…0001/sf-model.webp` | `?v=20261102model0406` |
| 06 | black-pink | `c1600622-…` | `…/0006/…0002/sf-model.webp` | `?v=20261102model0406` |

Heroes / fallback still on prior studio tokens (`studio04` / `studio04b` / `studio05` / `studio06`) — **unchanged** (CDN `Last-Modified` 2026-11-01).

## Local assets

`simon-generated/products/{04,05,06}-*/{colorway}/sf-model.png` (3:4, 864×1152). Former `sf-side.png` retained on disk only (not in gallery).

## Composition / silhouette QC (CDN Read)

| SKU | Frame | Shoe read | Verdict |
|---|---|---|---|
| 04 cream | Full-body lobby nurse (lab coat) | Wide **ankle** strap + large square buckle, cream satin flat | **PASS** |
| 04 black-almond | Full-body outdoor courtyard walk (charcoal scrubs) | Black wide ankle strap + buckle flat | **PASS** |
| 05 cream | Full-body lobby glass-door walk (sage scrubs) | Cream satin **Mary Jane** instep strap + small buckle | **PASS** |
| 05 black-pink | Near-full seated park bench golden hour | Black MJ instep strap; pink insole + crest peek | **PASS** |
| 06 cream | Full-body scrub doorway lean (blue scrubs) | Cream satin **X elastic** (no buckle) | **PASS** |
| 06 black-pink | Full-body corridor stand (black scrubs) | Black wide X elastic straps | **PASS** |

## Constraints preserved

- [x] Heroes (arr 10) not regenerated / not re-uploaded
- [x] Fallback (arr 1) untouched
- [x] Spin not deleted / not modified by this pass
- [x] No WhatsApp / physical ref JPG uploaded as app media
- [x] 6/6 arr-11 rows → `sf-model.webp?v=20261102model0406`

## Device checklist

1. Force-quit Expo / clear image cache so `?v=20261102model0406` loads.
2. PDP swipe: image 1 = hero packshot, image 2 = model lifestyle (not side packshot).
3. Spot-check strap family per product (04 ankle / 05 MJ / 06 X).
