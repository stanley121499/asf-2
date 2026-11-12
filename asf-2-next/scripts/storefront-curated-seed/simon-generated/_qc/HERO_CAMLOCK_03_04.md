# HERO_CAMLOCK_03_04 — locked 7 o’clock camera

**When:** 2026-11-02  
**Scope:** Product **03** beige `sf-hero-34` + `sf-fallback`; Product **04** cream + black-almond `sf-hero-34` + cream `sf-fallback`.  
**Cache-bust:** `?v=20261102cam7_0304`  
**Not touched:** Product 03 blush (inactive, still `?v=20261102warm0304`), model slot2 / arr **11**, spin, editorials, posts, promos. **No rembg.**

---

## Locked camera (non-negotiable)

| Rule | Spec |
|---|---|
| Toe direction | **7 o’clock** (bottom-left) |
| Camera | **Same height / distance / pitch** on every hero — medium ¾, **not** elevated top-down outliers |
| Pointing | Same shoe yaw across 03 beige + 04 cream + 04 BA |
| BG | Muted warm-gray studio field (unique quiet tint per product) |
| Fidelity | Strap / buckle / heel vs physical refs |

Height lock ref: prior cream mute hero (medium ¾) — **not** the elevated cream-X gold.

---

## Muted backgrounds

| Product | Tint | Measured live corner avg |
|---|---|---|
| **03** | Muted warm stone | **`#C1B9AE`** `(193,185,174)` |
| **04** | Muted cool greige | cream/BA **`#C4BEB6`** `(196,190,182)` |

---

## Side-by-side vision QC (`cmp-live-cam7-trio.jpg`)

| Asset | Toe 7 o’clock | Cam height vs peers | Strap / heel | BG | Verdict |
|---|---|---|---|---|---|
| 03 beige `sf-hero-34` / fallback | **PASS** | **PASS** — matched medium ¾; heel+toe align with 04 | Wide ankle strap; beige covered square buckle + silver prong; slim brown sole/heel; knit ribs | Muted stone | **PASS** |
| 04 cream `sf-hero-34` / fallback | **PASS** | **PASS** — shared lock | Cream fabric-covered buckle + silver prong; cream sole/heel; soft-square satin | Muted greige | **PASS** |
| 04 black-almond `sf-hero-34` | **PASS** | **PASS** — same pitch as cream | Black covered buckle + silver prong; black sole/heel; almond interior | Same greige | **PASS** |

Cmp artifacts: `_qc/.tmp-camlock0304/cmp/cmp-live-cam7-trio.jpg`, `cmp-cam7a-trio.jpg`, `cmp-*-live-vs-cam7a.jpg`.

---

## Actions

1. Studio AI regen (GenerateImage) with cream mute as height lock + physical refs; explicit reject of higher/top-down.
2. Soft corner-field unify toward muted stone/greige (no rembg).
3. Installed PNG → `products/{03,04}/…`; beige/cream → `sf-fallback`.
4. Backup: `simon-generated/_bak_cam7_0304_20261102/`
5. Uploaded 5 webps; DB `product_medias` arr **1** + **10** only → `?v=20261102cam7_0304`. Blush left on warm0304. Arr **11** unchanged.
6. URL map: `.tmp/simon_cam7_0304_urls.json`

---

## Live URLs

```
…/c1010001-…0003/fallback.webp?v=20261102cam7_0304
…/c1010001-…0003/c1500301-…0002/sf-hero-34.webp?v=20261102cam7_0304   # beige only
…/c1010001-…0004/fallback.webp?v=20261102cam7_0304
…/c1010001-…0004/c1500401-…0001/sf-hero-34.webp?v=20261102cam7_0304   # cream
…/c1010001-…0004/c1500401-…0002/sf-hero-34.webp?v=20261102cam7_0304   # black-almond
```

Host: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/`

---

## Confirm

**PRODUCT 03 (beige) + 04 heroes PASS** under `?v=20261102cam7_0304` — toe at 7 o’clock, shared medium camera height (no higher-angle outliers), muted warm-grays, strap/heel fidelity held, blush + model slot2 untouched.
