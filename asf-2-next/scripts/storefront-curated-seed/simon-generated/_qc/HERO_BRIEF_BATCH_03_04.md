# HERO_BRIEF_BATCH_03_04 — gold-plate locked heroes

**When:** 2026-11-02  
**Brief:** `_qc/HERO_GENERATION_BRIEF.md` (Mandatory pipeline)  
**Scope:** Product **03** beige `sf-hero-34` + `sf-fallback`; Product **04** cream + black-almond `sf-hero-34` + cream `sf-fallback`.  
**Cache-bust:** `?v=20261102brief0304`  
**Not touched:** Product 03 blush (inactive), model slot2 / arrangement **11**, sides (except as prior), spin, editorials, posts, promos. **No rembg. No 3D.**

---

## Gold plate / camera lock

| Rule | Spec |
|---|---|
| Gold | Attached cream X PASS (stored `_qc/.tmp-brief0304/gold/gold-cream-x-crop.png`) |
| Toe | **7 o’clock** (bottom-left) |
| Height / pitch | Same as gold plate — identical across 03 beige + 04 cream + 04 BA |
| BG | Flat muted warm-gray / greige — **no glowing arcs** (prior 03 FAIL class) |
| Fidelity | Ankle strap / covered buckle / heel vs `simon-product-refs/` |

---

## Muted backgrounds

| Product | Tint | Target | Measured ship corner |
|---|---|---|---|
| **03** | Muted warm stone | `#C1B9AE` `(193,185,174)` | `#C1B9AE` |
| **04** | Muted cool greige | `#C4BEB6` `(196,190,182)` | cream/BA ~`#B8B4AE` family (flat field, no arc) |

Soft corner-field unify only (preserve shoe + contact shadow). **No rembg.**

---

## Contact-sheet QC vs gold

Proof: `_qc/.tmp-brief0304/cmp/cmp-brief-ship-vs-gold.jpg` (+ `cmp-brief-a-vs-gold.jpg` pre-ship).

| Asset | C1 Toe 7:00 | C2 Cam height vs gold | S1/S2 Strap / heel vs refs | B1 Flat BG no arc | Verdict |
|---|---|---|---|---|---|
| 03 beige `sf-hero-34` / fallback | **PASS** | **PASS** | Wide ankle strap; beige covered square buckle + silver prong; knit ribs; slim brown sole/heel | Flat stone | **PASS** |
| 04 cream `sf-hero-34` / fallback | **PASS** | **PASS** | Cream covered buckle + silver prong; cream sole/heel; soft-square satin | Flat greige | **PASS** |
| 04 black-almond `sf-hero-34` | **PASS** | **PASS** (B candidate — A had metallic buckle risk) | Black fabric-covered buckle + silver prong; black sole/heel; almond lining + cream footbed | Flat greige | **PASS** |

### Rejected during QC

- **04 BA A** — buckle read as gunmetal/metallic → replaced by **B** (fabric-covered + silver prong).

### Inactive / untouched

- 03 blush — **not shipped** (inactive CW).
- Model slot2 / arr **11** — still `?v=20261102model0103` (03) / `?v=20261102model0406` (04).

---

## Actions

1. Locked-plate studio regen (`GenerateImage`) with gold cream-X crop + physical refs; prompt deltas = silhouette + colorway only.
2. Soft seamless-field BG unify toward mute stone/greige (no rembg).
3. Contact sheet vs gold → checklist §5 / §M3 → all in-scope **PASS**.
4. Installed PNG → `products/{03,04}/…`; beige/cream → `sf-fallback`.
5. Backup: `simon-generated/_bak_brief0304_20261102/`
6. Uploaded 5 webps; DB `product_medias` arr **1** + **10** only → `?v=20261102brief0304`.
7. URL map: `.tmp/simon_brief0304_urls.json`
8. Workbench: `_qc/.tmp-brief0304/`

---

## Live URLs

```
…/c1010001-…0003/fallback.webp?v=20261102brief0304
…/c1010001-…0003/c1500301-…0002/sf-hero-34.webp?v=20261102brief0304   # beige only
…/c1010001-…0004/fallback.webp?v=20261102brief0304
…/c1010001-…0004/c1500401-…0001/sf-hero-34.webp?v=20261102brief0304   # cream
…/c1010001-…0004/c1500401-…0002/sf-hero-34.webp?v=20261102brief0304   # black-almond
```

Host: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/`

---

## Confirm

**PRODUCT 03 (beige) + 04 heroes PASS** under `?v=20261102brief0304` — gold-plate camera lock (toe 7:00, same height), flat muted BGs (no glowing arcs), ankle-strap / buckle / heel fidelity vs refs, blush + model slot2 untouched. No 3D / rembg.
