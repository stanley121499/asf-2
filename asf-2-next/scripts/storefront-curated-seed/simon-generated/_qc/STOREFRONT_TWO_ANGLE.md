# Simon storefront — strict 2-angle system

**Date:** 2026-10-25  
**Scope:** Storefront packshots + `product_medias` gallery wiring only.  
**Preserved on disk/storage (not in PDP color gallery):** `md-editorial-*`, posts, promos, legacy `sf-topdown-insole` / `sf-pair-or-sole` files.

---

## Orientation locks

| Shot | File | Arrangement | Orientation |
|---|---|---|---|
| **Angle A (hero)** | `sf-hero-34.png` | **10** | 3/4 view; toe toward **bottom-left**; toe closer to camera; opening/heel visible toward upper-right |
| **Angle B (side)** | `sf-side.png` | **11** | Pure side profile; shoe points **LEFT** (toe left, heel right); flat silhouette |
| **Fallback (listing)** | `sf-fallback.png` | **1** (`color_id` null) | Same as Angle A of the **primary** colorway |

Style refs (orientation only):

- Angle A: Cursor assets `image-ec884452-9fff-4045-808f-82b575cb07b7.png`
- Angle B: Cursor assets `image-601c471e-2895-4f2b-8694-7b4b0f33ddbd.png`

Product fidelity refs: `simon-product-refs/manifest.json` per colorway.

---

## Gallery wiring (`resolveProductGalleryMedias`)

When a color is selected, the resolver returns **only** medias with that `color_id` (sorted by `arrangement`).

| Per colorway | Rows |
|---|---|
| PDP swipe | **2** — arrangement 10 (hero) then 11 (side) |
| Listing / no color | **1** fallback — arrangement 1, `color_id` null |

Hard-deleted from `product_medias` (arr ≥ 12): topdown, pair/sole, and color-scoped `md-editorial-*` rows.  
Editorial **files** remain under `simon-generated/products/.../md-editorial-*.png` and prior storage paths (not deleted from Storage).

Cache-bust: media URLs use `?v=3`.

---

## Regenerated count

| Asset | Count |
|---|---|
| `sf-hero-34` (all products × 2 colorways) | **12** |
| `sf-side` | **12** |
| `sf-fallback` (primary Angle A copy) | **6** |
| **Total regenerated + uploaded** | **30** |

Upload script: `../simon_two_angle_upload.py`  
URL map: `../.tmp/simon_two_angle_media_urls.json`

### Primary colorways for fallback

| Product | Primary |
|---|---|
| 01 | beige |
| 02 | beige |
| 03 | beige |
| 04 | cream |
| 05 | cream |
| 06 | cream |

---

## Black MJ heel collar (P01 black)

Physical refs (`01-knit-maryjane-buckle/black/rear-01.jpg`, `side-01.jpg`, topdowns) show **black** padded heel collar matching the exterior — **not** tan.

Orientation style screenshots had tan collar (incorrect for this SKU). Regenerated Angle A/B use **black collar**.  
`manifest.json` `promptLock.heelCollar` updated to document black-vs-beige collar rule.

---

## Checklist

- [x] All 12 colorways have Angle A pointing bottom-left (consistent degree)
- [x] All 12 colorways have Angle B pointing left (pure side)
- [x] Straps taut / straight called out in prompts
- [x] P01 black collar black (matches physical refs)
- [x] Fallbacks = primary colorway Angle A
- [x] Uploaded webp upsert + `?v=3` on DB URLs
- [x] Soft/hard delete extras from gallery — **hard-deleted** 48 rows (arr 12–15)
- [x] Posts / promos / editorial files untouched as assets
- [ ] Visual spot-check on device PDP (expect `1 / 2` counter)
- [ ] App swipe polish (separate agent — **no rebuild required** for 2-image gallery; existing pager already swipes `galleryMedias`)

---

## Sample public URLs

```
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000001/fallback.webp?v=3
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000001/c1500101-24a8-4f00-8000-000000000001/sf-hero-34.webp?v=3
https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000001/c1500101-24a8-4f00-8000-000000000001/sf-side.webp?v=3
```

---

## App rebuild note

**No Expo/app rebuild required** for the 2-angle gallery cutover.  
`resolveProductGalleryMedias` already returns color-scoped rows by arrangement; with only arr 10+11 present, PDP shows `1 / 2`.  
Swipe UX improvements (if any) are a separate agent; this change is data/media only.
