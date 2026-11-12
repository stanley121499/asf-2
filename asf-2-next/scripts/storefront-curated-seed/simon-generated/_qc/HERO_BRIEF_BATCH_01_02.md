# HERO_BRIEF_BATCH_01_02 — Locked-plate heroes (brief M1–M5)

**Date:** 2026-11-02  
**Scope:** Products **01** + **02** `sf-hero-34` (+ beige `sf-fallback` clones) only  
**Cache-bust:** `?v=20261102brief0102`  
**Method:** GenerateImage locked to gold plate + physical refs. **No rembg / cutouts / 3D.**  
**Not touched:** model slot2 / arr 11, `sf-side`, spin, editorials, posts, products 03–06.

---

## M1 inputs

| Input | Path |
|---|---|
| Gold plate (Simon PASS cream X) | `_qc/.tmp-brief0102/gold/user-cream-x-pass.png` + `gold-cream-x-crop.png` |
| Live gold lock (06 cream) | `_qc/.tmp-brief0102/gold/06-cream-live-hero.png` |
| Physical refs 01 | `simon-product-refs/01-knit-maryjane-buckle/{black,beige}/…` |
| Physical refs 02 | `simon-product-refs/02-knit-ballet-xstrap/{black,beige}/…` |
| Brief | `_qc/HERO_GENERATION_BRIEF.md` §§1–4 + M3 |

Camera lock: toe **7:00**, same height/distance/pitch as gold (not higher).

---

## M3 contact-sheet gate (BEFORE upload)

| Sheet | Path |
|---|---|
| Disk gens vs gold + cyan mid guide | `_qc/.tmp-brief0102/cmp/cmp-v1-vs-gold.jpg` |
| Strap zooms vs gold + physical topdowns | `_qc/.tmp-brief0102/cmp/cmp-strap-zooms-v1.jpg` |
| LIVE CDN vs gold (post-ship proof) | `_qc/.tmp-brief0102/cmp/cmp-live-cdn-vs-gold.jpg` |

### Checklist §5 / M3

| Asset | C1 toe 7:00 | C2 height=gold | B1 flat muted BG | S1/S2 straps vs refs | L1 soft shadow | Verdict |
|---|---|---|---|---|---|---|
| 01 black `sf-hero-34` | YES | YES | `#CBC5C0` | MJ wide + black square buckle + silver prong | YES | **PASS** |
| 01 beige `sf-hero-34` | YES | YES | `#CAC5BF` | MJ + beige covered buckle + prong | YES | **PASS** |
| 01 `sf-fallback` | = beige | = | = | = | YES | **PASS** (MD5===beige webp) |
| 02 black `sf-hero-34` | YES | YES | `#CBC5C0` | Thick plank X (~¼–⅓ toe-box); slim collar; no buckle | YES | **PASS** |
| 02 beige `sf-hero-34` | YES | YES | `#CBC5BF` | Same X topology as black + beige topdown ref | YES | **PASS** |
| 02 `sf-fallback` | = beige | = | = | = | YES | **PASS** (MD5===beige webp) |

**Overall in-scope: 6 / 6 PASS.** Residual fails: **none**.

Forbidden checks: no rembg, no 3D, model slot2 untouched, no BG arcs/glows/vignettes.

---

## Local install paths

```
simon-generated/products/01-knit-maryjane-buckle/black/sf-hero-34.png
simon-generated/products/01-knit-maryjane-buckle/beige/sf-hero-34.png
simon-generated/products/01-knit-maryjane-buckle/sf-fallback.png
simon-generated/products/02-knit-ballet-xstrap/black/sf-hero-34.png
simon-generated/products/02-knit-ballet-xstrap/beige/sf-hero-34.png
simon-generated/products/02-knit-ballet-xstrap/sf-fallback.png
```

Scratch: `_qc/.tmp-brief0102/{gold,refs,gen,ship,cmp,bak,live}/`

---

## Ship

1. Backed up prior heroes → `_qc/.tmp-brief0102/bak/`.
2. Locked-plate regen; contact-sheet PASS vs gold before upload.
3. Upserted webp; DB `product_medias` hero+fallback → `?v=20261102brief0102`.
4. URL map: `storefront-curated-seed/.tmp/simon_brief0102_urls.json`  
   SQL: `storefront-curated-seed/.tmp/simon_brief0102_apply.sql`

### Live URLs

```
…/c1010001-…0001/fallback.webp?v=20261102brief0102
…/c1010001-…0001/c1500101-…0001/sf-hero-34.webp?v=20261102brief0102
…/c1010001-…0001/c1500101-…0002/sf-hero-34.webp?v=20261102brief0102
…/c1010001-…0002/fallback.webp?v=20261102brief0102
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261102brief0102
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261102brief0102
```
