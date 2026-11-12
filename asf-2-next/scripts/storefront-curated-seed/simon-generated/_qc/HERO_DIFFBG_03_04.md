# HERO_DIFFBG_03_04 — distinct BG hex heroes

**When:** 2026-11-02  
**Brief:** `_qc/HERO_GENERATION_BRIEF.md` (`BRIEF_REV=20261102-diffbg`)  
**Scope:** Product **03** beige `sf-hero-34` + `sf-fallback`; Product **04** cream + black-almond `sf-hero-34` + cream `sf-fallback`.  
**Cache-bust:** `?v=20261102diffbg0304`  
**Not touched:** Product 03 blush (inactive), model slot2 / arrangement **11**, sides, spin, editorials, posts, promos. **No rembg. No 3D.**

---

## Gold plate / camera lock

| Rule | Spec |
|---|---|
| Gold | Cream X PASS plate (`_qc/.tmp-diffbg0304/gold/gold-cream-x-crop.png` + user attach) |
| Toe | **7 o’clock** (bottom-left) |
| Height / pitch | Same as gold plate across 03 beige + 04 cream + 04 BA |
| BG | Flat muted fields — **distinct per-product hex** (§2.1); **no glowing arcs** |
| Fidelity | Ankle strap / covered buckle / heel vs `simon-product-refs/` |

---

## Distinct backgrounds (§2.1)

| Product | Tint | Target hex | Measured ship / live corner |
|---|---|---|---|
| **03** | Deeper muted taupe | `#B9B2A6` `(185,178,166)` | `#B9B2A6` (spread ~0) |
| **04** | Lighter linen | `#D8CFC2` `(216,207,194)` | cream `#D8CFC2`; BA `#D9D0C3` (~L1 3) |

Soft corner-field unify only (preserve shoe + soft contact shadow). **No rembg.** Hexes differ from 01 `#C8C0B4` / 02 `#D2C4B0` / 05 `#C4B8A8` / 06 `#BEB6A9`.

---

## Contact-sheet QC vs gold

Proof: `_qc/.tmp-diffbg0304/cmp/cmp-diffbg-ship-vs-gold.jpg` + `cmp-bg-03-vs-04.jpg`.

| Asset | C1 Toe 7:00 | C2 Cam height vs gold | S1/S2 Strap / heel vs refs | B1 Flat BG no arc | B1b Distinct hex | Verdict |
|---|---|---|---|---|---|---|
| 03 beige `sf-hero-34` / fallback | **PASS** | **PASS** | Wide ankle strap; beige covered square buckle + silver prong; knit ribs; slim brown sole/heel | Flat taupe | `#B9B2A6` | **PASS** |
| 04 cream `sf-hero-34` / fallback | **PASS** | **PASS** | Cream covered buckle + silver prong; cream sole/heel; soft-square satin | Flat linen | `#D8CFC2` | **PASS** |
| 04 black-almond `sf-hero-34` | **PASS** | **PASS** | Black fabric-covered buckle + prong; black sole/heel; almond/cream footbed | Flat linen | `#D8CFC2` family | **PASS** |

### Inactive / untouched

- 03 blush — **not shipped** (still prior warm token).
- Model slot2 / arr **11** — unchanged (`?v=20261102model0103` / `?v=20261102model0406`).

---

## Actions

1. Locked-plate studio regen (`GenerateImage`) with gold cream-X crop + physical refs; prompt deltas = silhouette + colorway + §2.1 BG hex only.
2. Soft seamless-field BG unify to `#B9B2A6` (03) / `#D8CFC2` (04) — no rembg, no arcs.
3. Contact sheet vs gold → checklist §5 / §M3 → all in-scope **PASS**.
4. Installed PNG → `products/{03,04}/…`; beige/cream → `sf-fallback`.
5. Backup: `simon-generated/_bak_diffbg0304_20261102/`
6. Uploaded 5 webps; DB `product_medias` arr **1** + **10** only → `?v=20261102diffbg0304`.
7. URL map: `.tmp/simon_diffbg0304_urls.json`
8. Workbench: `_qc/.tmp-diffbg0304/`

---

## Live URLs

```
…/c1010001-…0003/fallback.webp?v=20261102diffbg0304
…/c1010001-…0003/c1500301-…0002/sf-hero-34.webp?v=20261102diffbg0304   # beige only
…/c1010001-…0004/fallback.webp?v=20261102diffbg0304
…/c1010001-…0004/c1500401-…0001/sf-hero-34.webp?v=20261102diffbg0304   # cream
…/c1010001-…0004/c1500401-…0002/sf-hero-34.webp?v=20261102diffbg0304   # black-almond
```

Host: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/`

---

## Confirm

**PRODUCT 03 (beige) + 04 heroes PASS** under `?v=20261102diffbg0304` — gold-plate camera lock (toe 7:00, same height), distinct flat BGs `#B9B2A6` / `#D8CFC2` (no arcs, not unified taupe with 01/02/05/06), ankle-strap / buckle / heel fidelity vs refs, blush + model slot2 untouched. No 3D / rembg.
