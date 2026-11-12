# HERO_DIFFBG_05_06 — Distinct §2.1 BG hex heroes

**Date:** 2026-11-02  
**BRIEF_REV:** `20261102-diffbg`  
**Scope:** Products **05** + **06** `sf-hero-34` (+ cream `sf-fallback` clones) only  
**Cache-bust:** `?v=20261102diffbg0506`  
**Method:** GenerateImage locked to gold cream-X plate + physical refs. Strict corner-seed flood to §2.1 hexes. **No rembg / cutouts / 3D.**  
**Not touched:** model slot2 / arr 11 (still `?v=20261102model0406`), `sf-side`, spin, editorials, posts, products 01–04.

**Overall verdict: PASS**

---

## M1 inputs

| Input | Path |
|---|---|
| Gold plate (Simon PASS cream X) | `_qc/.tmp-diffbg0506/gold/user-cream-x-pass.png` + `gold-cream-x-512.png` / `gold-cream-x-crop.png` |
| Physical refs 05 | `simon-product-refs/05-satin-maryjane/{cream,black-pink}/…` |
| Physical refs 06 | `simon-product-refs/06-satin-ballet-xstrap/{cream,black-pink}/…` |
| Brief | `_qc/HERO_GENERATION_BRIEF.md` §§1–4 + §2.1 hex table + M3 |

Camera lock: toe **7:00**, same height/distance/pitch as gold. Strap emphasis: **06 X plank mass** vs physical refs / gold.

### §2.1 BG hex (mandatory)

| Product | Tint | Hex | Measured ship corner |
|---|---|---|---|
| **05** | Mid warm stone | `#C4B8A8` | both CWs `#C4B8A8` (spread **0**) |
| **06** | Soft olive-greige | `#BEB6A9` | both CWs `#BEB6A9` (spread **0**) |

Distinct from each other and from prior unified taupe (`#D8D1C8` / `#CDC8C1`).

---

## M3 contact-sheet gate (BEFORE upload)

| Sheet | Path |
|---|---|
| Candidates vs gold | `_qc/.tmp-diffbg0506/cmp/cmp-diffbg0506-a-vs-gold.jpg` |
| Ship set vs gold | `_qc/.tmp-diffbg0506/cmp/cmp-diffbg0506-ship-final.jpg` |
| BG hex pair (05 vs 06) | `_qc/.tmp-diffbg0506/cmp/cmp-diffbg0506-bg-hex.jpg` |

### Checklist §5 / M3

| Asset | C1 toe 7:00 | C2 height=gold | B1 flat BG | B1b §2.1 hex | S1/S2 straps vs refs | L1 soft shadow | Verdict |
|---|---|---|---|---|---|---|---|
| 05 cream `sf-hero-34` / fallback | YES | YES vs gold sole foreshortening + heel-block | flat stone | `#C4B8A8` | MJ single instep; cream covered buckle + silver prong | YES | **PASS** |
| 05 black-pink `sf-hero-34` | YES | YES matched cream sibling | flat stone | `#C4B8A8` | black fabric-covered buckle + silver prong; pink lining | YES | **PASS** |
| 06 cream `sf-hero-34` / fallback | YES | YES matched gold | flat olive-greige | `#BEB6A9` | wide coarse-ribbed cream X plank mass (not skinny / not Y) | YES | **PASS** |
| 06 black-pink `sf-hero-34` | YES | YES matched | flat olive-greige | `#BEB6A9` | wide black X; pink insole; cream/tan sole lip | YES | **PASS** |

**Overall in-scope: 6 / 6 PASS** (4 heroes + 2 cream fallbacks). Residual fails: **none**.

Forbidden checks: no rembg, no 3D, model slot2 untouched, no BG arcs/glows/vignettes, BGs not unified taupe.

---

## Local install paths

```
simon-generated/products/05-satin-maryjane/cream/sf-hero-34.png
simon-generated/products/05-satin-maryjane/black-pink/sf-hero-34.png
simon-generated/products/05-satin-maryjane/sf-fallback.png
simon-generated/products/06-satin-ballet-xstrap/cream/sf-hero-34.png
simon-generated/products/06-satin-ballet-xstrap/black-pink/sf-hero-34.png
simon-generated/products/06-satin-ballet-xstrap/sf-fallback.png
```

Scratch: `_qc/.tmp-diffbg0506/{gold,refs,gen,ship,cmp,bak,live}/`  
Prior bak: `_qc/.tmp-diffbg0506/bak/` (pre-diffbg brief0506 heroes).

---

## Ship

1. Backed up prior heroes → `_qc/.tmp-diffbg0506/bak/`.
2. Locked-plate regen; corner-seed flood to §2.1 hex; contact-sheet PASS vs gold before upload.
3. Upserted 6 webps; DB `product_medias` arr **1** + **10** only → `?v=20261102diffbg0506`.
4. URL map: `storefront-curated-seed/.tmp/simon_diffbg0506_urls.json`  
   SQL: `storefront-curated-seed/.tmp/simon_diffbg0506_apply.sql`

### Live URLs

```
…/c1010001-…0005/fallback.webp?v=20261102diffbg0506
…/c1010001-…0005/c1500501-…0001/sf-hero-34.webp?v=20261102diffbg0506
…/c1010001-…0005/c1500501-…0002/sf-hero-34.webp?v=20261102diffbg0506
…/c1010001-…0006/fallback.webp?v=20261102diffbg0506
…/c1010001-…0006/c1500601-…0001/sf-hero-34.webp?v=20261102diffbg0506
…/c1010001-…0006/c1500601-…0002/sf-hero-34.webp?v=20261102diffbg0506
```

CDN verify: HTTP **200**, `last-modified` 2026-11-02 14:27 GMT. Arr **11** still `?v=20261102model0406`.

### Confirm

**PRODUCT 05 + 06 heroes PASS** under `?v=20261102diffbg0506` — gold-plate locked, toe 7:00, §2.1 distinct hexes `#C4B8A8` / `#BEB6A9`, 06 X strap fidelity held, no rembg/3D, model slot2 untouched.
