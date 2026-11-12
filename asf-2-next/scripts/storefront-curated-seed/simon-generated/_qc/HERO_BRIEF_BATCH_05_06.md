# HERO_BRIEF_BATCH_05_06 — Locked-plate heroes (brief M1–M5)

**Date:** 2026-11-02  
**Scope:** Products **05** + **06** `sf-hero-34` (+ cream `sf-fallback` clones) only  
**Cache-bust:** `?v=20261102brief0506`  
**Method:** GenerateImage locked to gold cream-X plate + physical refs. Corner flood BG unify (strict seed-only). **No rembg / cutouts / 3D.**  
**Not touched:** model slot2 / arr 11 (still `?v=20261102model0406`), `sf-side`, spin, editorials, posts, products 01–04.

**Overall verdict: PASS**

---

## M1 inputs

| Input | Path |
|---|---|
| Gold plate (Simon PASS cream X attach) | `_qc/.tmp-brief0506/gold/user-cream-x-pass.png` + `gold-cream-x.png` |
| Physical refs 05 | `simon-product-refs/05-satin-maryjane/{cream,black-pink}/…` |
| Physical refs 06 | `simon-product-refs/06-satin-ballet-xstrap/{cream,black-pink}/…` |
| Brief | `_qc/HERO_GENERATION_BRIEF.md` §§1–4 + M3 |

Camera lock: toe **7:00**, same height/distance/pitch as gold. Prior fails avoided: **06 cream wrong strap**, **05 cream higher angle**.

Muted BG targets (held from mute0506/cam7):

| Product | Tint | Hex |
|---|---|---|
| **05** | quiet warm stone | `#D8D1C8` |
| **06** | quiet warm greige | `#CDC8C1` |

---

## M3 contact-sheet gate (BEFORE upload)

| Sheet | Path |
|---|---|
| Candidates vs gold | `_qc/.tmp-brief0506/cmp/cmp-brief0506c-vs-gold.jpg` |
| Ship set vs gold | `_qc/.tmp-brief0506/cmp/cmp-brief0506-ship-final.jpg` |
| LIVE CDN vs gold | `_qc/.tmp-brief0506/cmp/cmp-live-cdn-vs-gold.jpg` |

### Checklist §5 / M3

| Asset | C1 toe 7:00 | C2 height=gold | B1 flat muted BG | S1/S2 straps vs refs | L1 soft shadow | Verdict |
|---|---|---|---|---|---|---|
| 05 cream `sf-hero-34` / fallback | YES | YES (C pass after A/B higher rejects; sole foreshortening + heel-block vs gold) | stone `#D8D1C8` family | MJ single instep; cream covered buckle + silver prong | YES | **PASS** |
| 05 black-pink `sf-hero-34` | YES | YES matched cream sibling | same stone | black fabric-covered buckle + silver prong; pink lining | YES | **PASS** |
| 06 cream `sf-hero-34` / fallback | YES | YES matched gold closely | greige `#CDC8C1` family | wide coarse-ribbed cream X plank mass (not skinny / not Y) | YES | **PASS** |
| 06 black-pink `sf-hero-34` | YES | YES matched | same greige | wide black X; pink insole; cream sole lip | YES | **PASS** |

**Overall in-scope: 6 / 6 PASS** (4 heroes + 2 cream fallbacks). Residual fails: **none**.

### Rejected during QC

- 05 cream A/B — higher pitch / more footbed than gold → regenerated to C.
- Aggressive BG flood (target-as-match) ate cream upper → replaced with strict corner-seed-only flood.

Forbidden checks: no rembg, no 3D, model slot2 untouched, no BG arcs/glows/vignettes.

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

Scratch: `_qc/.tmp-brief0506/{gold,refs,gen,ship,cmp,bak,live-after}/`  
Prior bak: `simon-generated/_bak_brief0506_20261102/`

---

## Ship

1. Backed up prior heroes → `_qc/.tmp-brief0506/bak/` + `_bak_brief0506_20261102/`.
2. Locked-plate regen; contact-sheet PASS vs gold before upload.
3. Upserted 6 webps; DB `product_medias` arr **1** + **10** only → `?v=20261102brief0506`.
4. URL map: `storefront-curated-seed/.tmp/simon_brief0506_urls.json`  
   SQL: `storefront-curated-seed/.tmp/simon_brief0506_apply.sql`

### Live URLs

```
…/c1010001-…0005/fallback.webp?v=20261102brief0506
…/c1010001-…0005/c1500501-…0001/sf-hero-34.webp?v=20261102brief0506
…/c1010001-…0005/c1500501-…0002/sf-hero-34.webp?v=20261102brief0506
…/c1010001-…0006/fallback.webp?v=20261102brief0506
…/c1010001-…0006/c1500601-…0001/sf-hero-34.webp?v=20261102brief0506
…/c1010001-…0006/c1500601-…0002/sf-hero-34.webp?v=20261102brief0506
```

### Confirm

**PRODUCT 05 + 06 heroes PASS** under `?v=20261102brief0506` — gold-plate locked, toe 7:00, 06 cream X fidelity held, 05 cream height not overhead outlier, flat muted BGs, model slot2 untouched.
