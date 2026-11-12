# HERO_CAMLOCK_01_02 — Locked camera (toe 7:00) heroes

**Date:** 2026-11-02  
**Scope:** Products **01** + **02** `sf-hero-34` (+ beige `sf-fallback` clones) only  
**Cache-bust:** `?v=20261102cam7_0102`  
**Method:** Full studio AI regen (GenerateImage + gold cam refs + physical refs). **No rembg / cutouts.**  
**Not touched:** spin sets, `sf-side`, model slot2 / editorials / posts.

---

## Locked camera (NON-NEGOTIABLE)

1. **Toe / middle of shoe → 7 o’clock** (bottom-left-ish diagonal). Heel ~1–2 o’clock.
2. **Identical camera for every SKU/CW:** same height, distance, lens feel, pitch — elevated classic 3/4 matching cream gold Angle A. **NOT** higher top-down / bird’s-eye on any shoe.
3. Same pointing direction for all.
4. Muted low-chroma warm-gray BG (unique subtle tint per product OK).
5. Strap fidelity vs physical refs (**02 X thick enough** — plank elastic ~¼–⅓ toe-box width).

Gold lock refs: `_qc/.tmp-camlock0102/refs/gold-full-square.png`, `06-cream-hero-camlock.png`.

---

## Why (vs `?v=20261102mute0102`)

Mute0102 heroes passed muted BG + thicker 02 X, but camera pitch drifted toward **overhead / bird’s-eye** (too much footbed, weak side wall / heel block). That fails the locked-camera rule. Regen lowers pitch to gold cream 3/4 while keeping toe at **7:00**.

Proof: `_qc/.tmp-camlock0102/cmp/cmp-cam-height-old-new-gold.jpg` (OLD mute | NEW cam7 | GOLD 06 cream).

---

## Muted warm-gray backdrops

| Product | Tint | Corner avg (LIVE CDN) | Notes |
|---|---|---|---|
| **01** | Quiet stone greige | black **`#CDC9C3`** · beige **`#CBC6C1`** | Low chroma; slightly cooler than peach sand |
| **02** | Quiet linen greige | black **`#CBC6C0`** · beige **`#CBC5BF`** | Same family; subtle unique tint OK |

---

## Strap QC vs physical refs

### Product 01 — knit Mary Jane buckle

| CW | Refs | Strap truth | Shipped |
|---|---|---|---|
| black | `side-01`, `topdown-insole-02` | Single wide woven MJ + matte black square buckle + silver prong; black padded collar | **PASS** |
| beige | `side-02`, `front-insole-01` | Same MJ; tonal beige buckle; tan collar | **PASS** |

`mustNot`: X straps.

### Product 02 — knit ballet X-strap

| CW | Refs | Strap truth | Shipped |
|---|---|---|---|
| black | `topdown-insole-01`, `side-01` | Two **wide plank** elastic bands; clean taut centered X; no MJ buckle; slim heel (no pillow collar) | **PASS** — thick X held |
| beige | `topdown-01`, `side-hand-01` | Same X plank geometry | **PASS** |

---

## Final vision QC (disk + CDN `?v=20261102cam7_0102`)

Side-by-side: `_qc/.tmp-camlock0102/cmp/cmp-live-cdn-4up.jpg`, `cmp-v1-4up.jpg`.

| Asset | Toe 7:00? | Same horizon / cam height (not top-down)? | Strap vs refs | Muted BG | Studio (not rembg) | Verdict |
|---|---|---|---|---|---|---|
| 01 black `sf-hero-34` | YES | YES — matches gold pitch | MJ wide + black buckle | YES `#CDC9C3` | YES soft shadow | **PASS** |
| 01 beige `sf-hero-34` | YES | YES | MJ + beige buckle | YES `#CBC6C1` | YES | **PASS** |
| 01 `sf-fallback` | = beige hero | = | = | = | YES | **PASS** |
| 02 black `sf-hero-34` | YES | YES | Thick X plank | YES `#CBC6C0` | YES | **PASS** |
| 02 beige `sf-hero-34` | YES | YES | Thick X plank | YES `#CBC5BF` | YES | **PASS** |
| 02 `sf-fallback` | = beige hero | = | = | = | YES | **PASS** |

**Overall storefront heroes in scope: 6 / 6 PASS**

CDN fallback webp MD5 === beige hero webp for both products.

---

## Actions

1. Backed up mute0102 heroes → `_qc/.tmp-camlock0102/bak/`.
2. Regenerated studio heroes with gold cam lock + physical refs; vision QC 4-up + old-vs-new-vs-gold.
3. Installed PNG → `simon-generated/products/{01,02}/…/sf-hero-34.png`; beige → `sf-fallback.png`.
4. Uploaded webp upserts; DB `product_medias` hero+fallback → `?v=20261102cam7_0102`.
5. Left `sf-side`, spin, model slot2 untouched.

## Live URLs

```
…/c1010001-…0001/fallback.webp?v=20261102cam7_0102
…/c1010001-…0001/c1500101-…0001/sf-hero-34.webp?v=20261102cam7_0102
…/c1010001-…0001/c1500101-…0002/sf-hero-34.webp?v=20261102cam7_0102
…/c1010001-…0002/fallback.webp?v=20261102cam7_0102
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261102cam7_0102
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261102cam7_0102
```

URL map: `storefront-curated-seed/.tmp/simon_cam7_0102_urls.json`  
SQL: `storefront-curated-seed/.tmp/simon_cam7_0102_apply.sql`
