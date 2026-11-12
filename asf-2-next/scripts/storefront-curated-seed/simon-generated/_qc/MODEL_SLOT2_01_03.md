# Model as gallery image 2 — products 01 / 02 / 03

**Date:** 2026-11-02  
**Cache-bust:** `?v=20261102model0103`  
**Scope:** Both colorways × products 01, 02, 03 (6 slot-2 rows)  
**Not touched:** Heroes (`sf-hero-34` / arr 10), fallbacks (arr 1), spin frames/assets

## Intent

PDP gallery per colorway:

| Slot | Arr | Content |
|---|---|---|
| 1 | 10 | Studio packshot Angle A (`sf-hero-34`) — **unchanged** |
| 2 | 11 | **Model wearing that exact shoe** (was side packshot `sf-side`) |

## Method

- **Source:** Existing nurse-composition `md-editorial-a.png` per colorway (full/near-full body lifestyle; not WhatsApp rembg).
- **Local:** Overwrote `products/{folder}/{cw}/sf-side.png` with that editorial. Packshot sides backed up under `simon-generated/_bak_p0103model_20261102/`.
- **Storage:** Upserted webp to the existing `…/{colorId}/sf-side.webp` object path (same row, new pixels).
- **DB:** Updated only the six `arrangement = 11` `product_medias` rows → `?v=20261102model0103`.

URL map: `scripts/storefront-curated-seed/.tmp/simon_model_slot2_01_03_urls.json`

## Inventory

| Product | Colorway | Scene (md-editorial-a) | Shoe lock | Verdict |
|---|---|---|---|---|
| 01 MJ buckle | black | Full-body scrub sink / wash station | Black knit instep MJ + buckle; on-foot clear | **PASS** |
| 01 MJ buckle | beige | Full-body seated nurses station + tablet | Beige knit MJ + tonal buckle; both shoes readable | **PASS** |
| 02 X-strap | black | Full-body elevator + navy scrubs | Black knit X elastic (no buckle); on-foot clear | **PASS** |
| 02 X-strap | beige | Full-body atrium walk + sand scrubs | Beige knit X straps; mid-stride on-foot | **PASS** |
| 03 ankle | blush | Full-body ward / clipboard | Blush knit **ankle** strap + buckle; slim heel | **PASS** |
| 03 ankle | beige | Full-body corridor + stethoscope | Beige knit ankle strap; on-foot clear | **PASS** |

**Confirmed:** No rembg / cutout of physical WhatsApp refs. Assets are AI lifestyle nurse compositions already on disk.

## CDN / DB verify

- Sample CDN HTTP **200** `image/webp`, `Last-Modified` **2026-11-02** ~12:58 UTC; portrait **864×1152**.
- Sample hero `01 black sf-hero-34` still `Last-Modified` **2026-11-01** (untouched by this agent).
- All six arr-11 tokens = `?v=20261102model0103`; all arr-10 / fallback tokens unchanged (`studio01` / `studio02b` / `studio03`).

## Simon device check

1. Force-quit Expo / clear image cache.
2. Open PDP for products 01, 02, 03 — both colorways.
3. Swipe **1 → 2**: studio hero, then nurse/model on-foot (not side packshot).
4. Confirm spin UI is not this agent’s concern (leave for spin-removal agent).
