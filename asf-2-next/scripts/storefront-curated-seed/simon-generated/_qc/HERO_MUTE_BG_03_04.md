# HERO_MUTE_BG_03_04 — muted warm-gray heroes + more face-on yaw

**When:** 2026-11-02  
**Scope:** Product **03** beige `sf-hero-34` + `sf-fallback`; Product **04** cream + black-almond `sf-hero-34` + cream `sf-fallback`.  
**Cache-bust:** `?v=20261102mute0304`  
**Not touched:** Product 03 blush (inactive), model slot2 / `sf-side` / arr **11**, spin, editorials, posts, promos. **No rembg.**

---

## Why

Home-grid biscuit/linen heroes for 03/04 read too bright / too chroma vs quieter neighbors, and LIVE yaw was too side-profile. Regenerate with **more camera-facing 3/4** (toe bottom-left, toe-box face + vamp opening more visible) and **unique muted warm-gray** studio fields.

---

## Muted backgrounds (unique per product)

| Product | Tint name | Measured ship corner avg | vs prior warm0304 |
|---|---|---|---|
| **03** | Muted warm stone | **`#CBC2B6`** `(203,194,182)` chroma≈21 | Prior biscuit ~`#F2E9DB` — darker, quieter |
| **04** | Muted cool greige | cream **`#C5BFB7`** · BA **`#C6C0B8`** chroma≈14 | Prior linen ~`#E8E2D6` — darker, lower chroma |

03 is intentionally a touch warmer/darker than 04’s cooler greige so the grid still separates SKUs without peach biscuit.

---

## Angle / fidelity

Gold yaw lock: cream X PASS / elevated 3/4 — toe bottom-left, **more face-on** than LIVE side silhouette.

| Asset | Yaw vs LIVE | Strap / heel | BG | Verdict |
|---|---|---|---|---|
| 03 beige `sf-hero-34` / fallback | More elevated 3/4; vamp readable | Wide ankle strap + beige covered square buckle + silver prong; slim dark-brown heel, no pillow | Muted stone `#CBC2B6` | **PASS** (yaw improved vs biscuit LIVE; residual less extreme than gold X) |
| 04 cream `sf-hero-34` / fallback | Clear face-on lift vs LIVE profile | Cream fabric-covered buckle + silver prong; cream sole/heel; soft-square | Muted greige `#C5BFB7` | **PASS** |
| 04 black-almond `sf-hero-34` | Matched cream mute pose | Black fabric-covered buckle + silver prong; black sole/heel; almond lining | Same greige `#C6C0B8` | **PASS** |

---

## Actions

1. Studio AI regen (GenerateImage) — gold / cream face-on refs; physical refs for strap/heel; **no rembg**.
2. Soft seamless-field unify to unique muted targets (corner-field lerp only).
3. Installed PNG → `simon-generated/products/{03,04}/…`; beige/cream → `sf-fallback`.
4. Backup: `simon-generated/_bak_mute0304_20261102/`
5. Uploaded 5 webps; DB `product_medias` arr **1** + **10** only → `?v=20261102mute0304` (03 beige + fallback; 04 both CWs + fallback). Blush hero URL left on warm0304. Arr **11** unchanged.
6. URL map: `.tmp/simon_mute0304_hero_urls.json`

---

## Live URLs

```
…/c1010001-…0003/fallback.webp?v=20261102mute0304
…/c1010001-…0003/c1500301-…0002/sf-hero-34.webp?v=20261102mute0304   # beige only
…/c1010001-…0004/fallback.webp?v=20261102mute0304
…/c1010001-…0004/c1500401-…0001/sf-hero-34.webp?v=20261102mute0304   # cream
…/c1010001-…0004/c1500401-…0002/sf-hero-34.webp?v=20261102mute0304   # black-almond
```

Host: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/`

---

## Confirm

**PRODUCT 03 (beige) + 04 heroes PASS** under `?v=20261102mute0304` — muted unique warm-grays, more camera-facing yaw vs LIVE biscuit/linen side profiles, strap/heel fidelity held, blush + model slot2 untouched.
