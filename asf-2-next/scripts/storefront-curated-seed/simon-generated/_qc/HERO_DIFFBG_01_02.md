# HERO_DIFFBG_01_02 — Distinct BG hex + 02 black X fix

**Date:** 2026-11-02  
**BRIEF_REV:** `20261102-diffbg`  
**Scope:** Products **01** + **02** `sf-hero-34` (+ beige `sf-fallback` clones) only  
**Cache-bust:** `?v=20261102diffbg0102`  
**Method:** GenerateImage locked to cream-X gold plate + physical refs; soft corner flood to §2.1 hex. **No rembg / cutouts / 3D.**  
**Not touched:** model slot2 / arr 11, `sf-side`, spin, editorials, posts, products 03–06.

---

## Why

Home-grid FAIL (~22:15):

1. **Top-left = 02 black X-strap** wrong vs physical refs (band mass / topology).
2. **All tiles same ~taupe BG** — latest batch unified; violate brief §2.1 distinct hex table.

Gold plate = cream X attachment (camera lock: toe **7:00**, same height/pitch).

---

## M1 inputs

| Input | Path |
|---|---|
| Gold plate (Simon PASS cream X) | `_qc/.tmp-diffbg0102/gold/user-cream-x-gold.png` + `06-cream-live-hero.png` |
| Fail grid attach | `_qc/.tmp-diffbg0102/gold/user-fail-grid.png` |
| Physical refs 01 | `simon-product-refs/01-knit-maryjane-buckle/{black,beige}/…` |
| Physical refs 02 | `simon-product-refs/02-knit-ballet-xstrap/{black,beige}/…` |
| Brief | `_qc/HERO_GENERATION_BRIEF.md` `BRIEF_REV=20261102-diffbg` |

---

## §2.1 BG hex (mandatory distinct)

| Product | Target hex | LIVE CDN corner avg |
|---|---|---|
| **01** | `#C8C0B4` cooler stone greige | black/beige **`#C8C0B5`** |
| **02** | `#D2C4B0` warm sand-greige | black **`#D1C5B0`** · beige **`#D1C4B0`** |

Home-grid 2×2 proof: `_qc/.tmp-diffbg0102/cmp/cmp-homegrid-2x2-ship.jpg` — 01 vs 02 clearly separable.

---

## M3 contact-sheet gate

| Sheet | Path |
|---|---|
| Ship vs gold + cyan mid guide | `_qc/.tmp-diffbg0102/cmp/cmp-ship-vs-gold.jpg` |
| Strap zooms PHYS \| OLD fail \| NEW \| GOLD | `_qc/.tmp-diffbg0102/cmp/cmp-strap-old-new-phys.jpg` |
| Home-grid 2×2 BG check | `_qc/.tmp-diffbg0102/cmp/cmp-homegrid-2x2-ship.jpg` |
| LIVE CDN vs gold | `_qc/.tmp-diffbg0102/cmp/cmp-live-cdn-vs-gold.jpg` |

### Checklist §5 / M3

| Asset | C1 toe 7:00 | C2 height=gold | B1 flat BG | B1b distinct hex | S1/S2 straps vs refs | L1 soft shadow | Verdict |
|---|---|---|---|---|---|---|---|
| 01 black `sf-hero-34` | YES | YES | `#C8C0B4` | cooler stone | MJ wide + black square buckle + silver prong | YES | **PASS** |
| 01 beige `sf-hero-34` | YES | YES | `#C8C0B4` | same as 01 | MJ + beige covered buckle + prong | YES | **PASS** |
| 01 `sf-fallback` | = beige | = | = | = | = | YES | **PASS** (MD5===beige webp) |
| 02 black `sf-hero-34` | YES | YES | `#D2C4B0` | warm sand ≠ 01 | Thick plank X (~¼–⅓ toe-box); slim collar; no buckle — fixed vs top-left FAIL | YES | **PASS** |
| 02 beige `sf-hero-34` | YES | YES | `#D2C4B0` | same as 02 | Same X topology as black + beige topdown ref | YES | **PASS** |
| 02 `sf-fallback` | = beige | = | = | = | = | YES | **PASS** (MD5===beige webp) |

**Overall in-scope: 6 / 6 PASS.** Residual fails: **none**.

Forbidden checks: no rembg, no 3D, model slot2 untouched, no BG arcs/glows/vignettes, BGs not unified taupe.

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

Scratch: `_qc/.tmp-diffbg0102/{gold,refs,gen,ship,cmp,bak,live}/`

---

## Ship

1. Backed up prior heroes → `_qc/.tmp-diffbg0102/bak/`.
2. Locked-plate regen (02 black iterated v2 for physical-ref X mass); soft flood to §2.1 hex; contact-sheet PASS vs gold before upload.
3. Upserted webp; DB `product_medias` hero+fallback → `?v=20261102diffbg0102`.
4. URL map: `storefront-curated-seed/.tmp/simon_diffbg0102_urls.json`  
   SQL: `storefront-curated-seed/.tmp/simon_diffbg0102_apply.sql`

### Live URLs

```
…/c1010001-…0001/fallback.webp?v=20261102diffbg0102
…/c1010001-…0001/c1500101-…0001/sf-hero-34.webp?v=20261102diffbg0102
…/c1010001-…0001/c1500101-…0002/sf-hero-34.webp?v=20261102diffbg0102
…/c1010001-…0002/fallback.webp?v=20261102diffbg0102
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261102diffbg0102
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261102diffbg0102
```
