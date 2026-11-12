# HERO_GOLD_03_04 — warm-neutral studio heroes

**When:** 2026-11-02  
**Scope:** Product **03** + **04** `sf-hero-34` (+ product `sf-fallback` = primary CW hero) **ONLY**.  
**Token:** `?v=20261102warm0304`  
**Not touched:** `sf-side` / model slot2, spin, editorials, posts, promos.

**Gold angle (cream X PASS attachment):** elevated 3/4; toe **bottom-left**; head/toe box **slight rightward yaw**; soft contact shadow; studio AI (no rembg).

---

## Warm-neutral backgrounds (unique vs other SKUs)

Style ref: Product 02 live warm packshot (~`#F7F3F0`). **03/04 deliberately different.**

| Product | Name | Target hex | Measured ship (corner avg) | Notes |
|---|---|---|---|---|
| **03** | Warm Biscuit | **`#F1E6D8`** | beige `#EFE6D7` · blush `#F2E9D8` | Peach-sand paper; shared across both 03 CWs |
| **04** | Cool Linen | **`#E9E4D8`** | cream `#E7E1D5` · black-almond `#E6E0D4` | Stone linen; shared across both 04 CWs |
| 02 (ref only) | Warm Porcelain | ~`#F7F3F0` | — | Do not reuse for 03/04 |

---

## Vision QC vs physical refs

Refs: `simon-product-refs/03-knit-ankle-strap/beige/{side-01,side-02,rear-01}.jpg` · `04-satin-ankle-strap/cream/{side-01,side-rear-01,topdown-insole-01,sole-01}.jpg`  
Gold pose: cream X attachment + 02 warm-bg screenshot.

| Asset | Angle | Strap / buckle vs refs | Product locks | BG | Verdict |
|---|---|---|---|---|---|
| 03 beige `sf-hero-34` | Gold yaw | Wide ankle strap; fabric-covered square buckle + silver prong; tidy upright; empty opening (no foam) | Knit ribs; **slim flush heel / no pillow**; dark brown sole | Warm Biscuit | **PASS** |
| 03 blush `sf-hero-34` | Gold yaw | Same construction; dusty-rose strap + covered buckle | Dusty rose knit; slim heel no pillow; dark brown sole | Warm Biscuit | **PASS** |
| 04 cream `sf-hero-34` | Gold yaw | Wide ankle strap; **cream fabric-covered** buckle + silver prong; tidy | Satin sheen; **soft-square** toe; **cream** sole+heel | Cool Linen | **PASS** |
| 04 black-almond `sf-hero-34` | Gold yaw | Black covered buckle + silver prong; tidy | Soft-square intent; **black** sole+heel; cream/almond interior | Cool Linen | **PASS** |

---

## Live URLs

```
…/c1010001-…0003/fallback.webp?v=20261102warm0304
…/c1010001-…0003/c1500301-…0001/sf-hero-34.webp?v=20261102warm0304   # blush
…/c1010001-…0003/c1500301-…0002/sf-hero-34.webp?v=20261102warm0304   # beige
…/c1010001-…0004/fallback.webp?v=20261102warm0304
…/c1010001-…0004/c1500401-…0001/sf-hero-34.webp?v=20261102warm0304   # cream
…/c1010001-…0004/c1500401-…0002/sf-hero-34.webp?v=20261102warm0304   # black-almond
```

Host: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/`

Disk map JSON: `scripts/storefront-curated-seed/.tmp/simon_warm0304_hero_urls.json`

---

## Fallback identity

| Product | Fallback = |
|---|---|
| 03 | beige `sf-hero-34` |
| 04 | cream `sf-hero-34` |
