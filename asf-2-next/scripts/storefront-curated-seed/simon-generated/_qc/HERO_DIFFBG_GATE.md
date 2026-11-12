# HERO_DIFFBG_GATE — hard QC after distinct-BG batch

**When:** 2026-11-02  
**Brief:** `_qc/HERO_GENERATION_BRIEF.md` (`BRIEF_REV=20261102-diffbg`)  
**Inputs:** `HERO_DIFFBG_01_02.md`, `_03_04.md`, `_05_06.md` + live `?v=20261102diffbg*`  
**Workbench:** `_qc/.tmp-diffbg-gate/`  
**Forbidden:** rembg, 3D, model slot2 / arr 11 edits.

---

## Overall verdict: **PASS** (after gate loop on 02)

| Product | Active CWs | Cache-bust (live) | Gate verdict |
|---|---|---|---|
| **01** | black, beige (+ fallback) | `?v=20261102diffbg0102` | **PASS** |
| **02** | black, beige (+ fallback) | `?v=20261102diffbggate` | **PASS** (after gate regen) |
| **03** | beige only (+ fallback) | `?v=20261102diffbg0304` | **PASS** |
| **04** | cream, black-almond (+ cream fallback) | `?v=20261102diffbg0304` | **PASS** |
| **05** | cream, black-pink (+ cream fallback) | `?v=20261102diffbg0506` | **PASS** |
| **06** | cream, black-pink (+ cream fallback) | `?v=20261102diffbg0506` | **PASS** |

03 blush inactive (still prior warm token). Model slot2 untouched.

---

## Hard-fail checklist

| # | Hard fail | Result |
|---|---|---|
| **1** | Home grid BGs look the same (must be visibly distinct 01–06) | **PASS** — live corner hexes match §2.1 table (±webp drift); 2×3 + swatch sheet separable |
| **2** | Top-left (02 black) X-strap wrong vs physical refs | **FAIL → FIXED** — first-pass live had mirrored X layering vs PHYS; gate regen matches PHYS crossing |
| **3** | Cam not matching gold (toe 7:00 / height) | **PASS** — toe ~7:00 catalog-wide; cyan mid-guide vs gold crop; no overhead outlier |

---

## Live BG hex map (CDN corners after gate)

| Product | §2.1 target | Live corner (primary tile) |
|---|---|---|
| **01** | `#C8C0B4` | `#C8C0B5` |
| **02** | `#D2C4B0` | `#D1C5B0` (webp) |
| **03** | `#B9B2A6` | `#BAB2A7` |
| **04** | `#D8CFC2` | `#D8CFC2` |
| **05** | `#C4B8A8` | `#C5B8A8` |
| **06** | `#BEB6A9` | `#BDB6A9` |

Closest pair remains **03 vs 06** (still distinct olive/taupe; not unified taupe). Both colorways of a product share that product’s hex (by design).

---

## Contact sheets (mandatory)

| Sheet | Path |
|---|---|
| Final home-grid 2×3 | `_qc/.tmp-diffbg-gate/cmp/cmp-gate-final-homegrid.jpg` |
| BG corner swatches 01–06 | `_qc/.tmp-diffbg-gate/cmp/cmp-gate-bg-corners.jpg` / `cmp-gate-bg-swatches.jpg` |
| 02 X fix (PHYS / OLD / NEW) | `_qc/.tmp-diffbg-gate/cmp/cmp-gate-02-xfix-v1.jpg` / `cmp-gate-02-final.jpg` |
| X-crossing zoom | `_qc/.tmp-diffbg-gate/cmp/cmp-gate-x-crossing-zoom.jpg` |
| Cam vs gold | `_qc/.tmp-diffbg-gate/cmp/cmp-gate-cam-vs-gold.jpg` |

---

## Per-SKU checklist (§5 / M3)

| Asset | C1 toe 7:00 | C2 height vs gold | B1 flat BG | B1b distinct hex | S1/S2 straps vs refs | Verdict |
|---|---|---|---|---|---|---|
| 01 black / beige | YES | YES | flat stone | `#C8C0B4` | MJ + covered buckle + prong | **PASS** |
| 02 black / beige | YES | YES | flat sand | `#D2C4B0` | Thick plank X; **PHYS crossing order** (gate) | **PASS** |
| 03 beige | YES | YES | flat deeper taupe | `#B9B2A6` | Ankle + beige covered buckle | **PASS** |
| 04 cream / BA | YES | YES | flat linen | `#D8CFC2` | Ankle + covered buckle; BA almond footbed | **PASS** |
| 05 cream / BP | YES | YES | flat mid stone | `#C4B8A8` | MJ; BP pink lining | **PASS** |
| 06 cream / BP | YES | YES | flat olive-greige | `#BEB6A9` | Wide X plank; BP pink insole | **PASS** |

---

## Gate FAIL loop (02 only)

### First pass FAIL

- Live `?v=20261102diffbg0102` **02 black** (and beige sibling): X **layering mirrored** vs physical `front` / `side` / `topdown` refs (PHYS = viewer-right strap on top at crossing; live had opposite). Band mass / cam / BG hex were otherwise OK.
- Proof: `_qc/.tmp-diffbg-gate/cmp/cmp-gate-x-crossing-zoom.jpg`, `cmp-gate-02-hardfail.jpg`.

### Regen (same plate only)

1. `GenerateImage` locked to gold cream-X crop + `simon-product-refs/02-knit-ballet-xstrap/{black,beige}` (+ black topology refs for beige). Prompt delta = CW + **PHYS X crossing order**. **No 3D / rembg.**
2. Strict corner-seed flood → `#D2C4B0` (preserve shoe + soft contact shadow).
3. Installed PNG → `products/02-knit-ballet-xstrap/{black,beige}/sf-hero-34.png`; beige → `sf-fallback.png`.
4. Uploaded 3 webps; DB arr **1** + **10** only → `?v=20261102diffbggate`.
5. Re-sheet + re-gate → **PASS**.

Backup: `_qc/.tmp-diffbg-gate/bak/`  
URL map: `storefront-curated-seed/.tmp/simon_diffbggate_urls.json`  
SQL: `storefront-curated-seed/.tmp/simon_diffbggate_apply.sql`

### Live URLs (02 gate)

```
…/c1010001-…0002/fallback.webp?v=20261102diffbggate
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261102diffbggate   # black
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261102diffbggate   # beige
```

---

## Confirm

**DIFFBG GATE PASS.** Hard fails: (1) distinct §2.1 BGs on home grid — PASS; (2) 02 black X vs PHYS — FAIL cleared via same-plate regen `?v=20261102diffbggate`; (3) cam toe 7:00 / height vs gold — PASS. No rembg / no 3D / model slot2 untouched.
