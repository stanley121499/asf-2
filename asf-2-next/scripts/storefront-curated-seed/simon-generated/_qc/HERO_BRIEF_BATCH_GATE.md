# HERO_BRIEF_BATCH_GATE — M3 hard QC gate (brief-locked heroes)

**When:** 2026-11-02  
**Brief:** `_qc/HERO_GENERATION_BRIEF.md` §M3 / §5  
**Scope:** Active colorways products **01–06** (`sf-hero-34`; 03 **beige only**).  
**Inputs:** Batch notes `HERO_BRIEF_BATCH_01_02.md`, `_03_04.md`, `_05_06.md` + live CDN `?v=20261102brief*` + gold attach + prior-fail home grid.  
**Workbench:** `_qc/.tmp-brief-gate/`  
**Forbidden:** rembg, 3D, model slot2 / arr 11 edits.

---

## Overall verdict: **PASS**

All in-scope active heroes PASS after gate. One gate-loop regen shipped for **04** BG outliers only.

| Product | Active CWs | Cache-bust (live) | Gate verdict |
|---|---|---|---|
| **01** | black, beige (+ fallback=beige) | `?v=20261102brief0102` | **PASS** |
| **02** | black, beige (+ fallback=beige) | `?v=20261102brief0102` | **PASS** |
| **03** | beige only (+ fallback) | `?v=20261102brief0304` | **PASS** |
| **04** | cream, black-almond (+ cream fallback) | `?v=20261102briefgate` | **PASS** (after gate regen) |
| **05** | cream, black-pink (+ cream fallback) | `?v=20261102brief0506` | **PASS** |
| **06** | cream, black-pink (+ cream fallback) | `?v=20261102brief0506` | **PASS** |

03 blush remains inactive / frozen (`?v=20261102warm0304`). Model slot2 untouched.

---

## Contact sheets (mandatory)

| Sheet | Path |
|---|---|
| All active CWs vs gold + cyan mid guide | `_qc/.tmp-brief-gate/cmp/cmp-gate-final-all-vs-gold.jpg` |
| Home-grid style 2×3 | `_qc/.tmp-brief-gate/cmp/cmp-gate-final-homegrid.jpg` |
| Prior-fail focus (02 X / 03 BG / 06 angle) | `_qc/.tmp-brief-gate/cmp/cmp-gate-prior-fails.jpg` |
| Strap zooms 02/06 vs gold | `_qc/.tmp-brief-gate/cmp/cmp-gate-strap-zooms.jpg` |
| 04 FAIL→GATE fix (cream / BA) | `_qc/.tmp-brief-gate/cmp/cmp-gate-04-04-cream-fix.jpg`, `…-04-ba-fix.jpg` |

---

## Per-SKU checklist (§5 / M3)

| Asset | C1 toe 7:00 | C2 height vs gold | B1 flat muted BG | S1/S2 straps vs refs | Prior-fail map | Verdict |
|---|---|---|---|---|---|---|
| 01 black | YES | YES | flat greige ~`#CBC5C0` | MJ + black covered buckle + silver prong | — | **PASS** |
| 01 beige | YES | YES | flat | MJ + beige covered buckle | — | **PASS** |
| 02 black | YES | YES | flat | thick plank X | top-R sibling topology OK | **PASS** |
| 02 beige | YES | YES | flat (mild soft field; no arc) | thick plank X vs black sibling + refs | **top-right strap class FIXED** | **PASS** |
| 03 beige | YES | YES | perfectly flat `#C1B9AE` (corner spread 0) | ankle strap + beige covered buckle + prong | **middle-left arc FIXED** | **PASS** |
| 04 cream | YES | YES | flat `#C4BEB6` after gate | ankle + cream covered buckle + prong | gate cleared TR cloudy vignette | **PASS** |
| 04 black-almond | YES | YES | flat `#C4BEB6` after gate | ankle + black covered buckle + prong; almond/cream footbed | same | **PASS** |
| 05 cream | YES | YES | flat stone `#D8D1C8` | MJ + cream covered buckle | not overhead outlier | **PASS** |
| 05 black-pink | YES | YES | flat | MJ + black buckle; pink lining | — | **PASS** |
| 06 cream | YES | YES matched gold | flat greige `#CDC7C0` | wide coarse-ribbed X plank | **bottom-right angle FIXED** | **PASS** |
| 06 black-pink | YES | YES | flat | wide black X; pink insole; cream sole lip | — | **PASS** |

---

## Prior fails from home-grid attach → status

| Grid fail | Rule class | Mapped live tile | Gate result |
|---|---|---|---|
| **Top-right strap** | §3.2 X topology / thickness | 02 beige (+ 06 cream sibling) | Clean taut centered X; matches gold / dark sibling |
| **Middle-left arc** | §2 BG arc/glow | 03 beige | Flat muted stone; corner luminance range **0** |
| **Bottom-right angle** | §1 height/pitch outlier | 06 cream | Same cyan mid-guide as gold / catalog majority; not overhead |

---

## Gate FAIL loop (04 only)

### First pass FAIL

- **04 cream** + **04 black-almond** live under `?v=20261102brief0304`: TR cloudy smudge / vignette (y=40 luminance range ~36 / ~27). Automatic **B1 FAIL** (arc/glow/vignette class).
- Proof: `_qc/.tmp-brief-gate/cmp/cmp-gate-topstrips.jpg`, `zoom-tr-04-cream.jpg`.

### Regen (same plate only)

1. `GenerateImage` locked to gold cream-X crop + `simon-product-refs/04-satin-ankle-strap/{cream,black-almond}` refs. Prompt delta = silhouette + CW only. **No 3D / rembg.**
2. Strict corner-seed flood → muted greige `#C4BEB6` (preserve shoe + soft contact shadow).
3. Installed PNG → `products/04-satin-ankle-strap/{cream,black-almond}/sf-hero-34.png`; cream → `sf-fallback.png`.
4. Uploaded 3 webps; DB arr **1** + **10** only → `?v=20261102briefgate`.
5. Re-sheet + re-gate → **PASS** (corner range **0.0** both CWs).

Backup: `simon-generated/_bak_briefgate04_20261102/`  
URL map: `storefront-curated-seed/.tmp/simon_briefgate04_urls.json`  
SQL: `storefront-curated-seed/.tmp/simon_briefgate04_apply.sql`

### Live URLs (04 gate)

```
…/c1010001-…0004/fallback.webp?v=20261102briefgate
…/c1010001-…0004/c1500401-…0001/sf-hero-34.webp?v=20261102briefgate   # cream
…/c1010001-…0004/c1500401-…0002/sf-hero-34.webp?v=20261102briefgate   # black-almond
```

---

## Confirm

**BATCH GATE PASS.** No open FAILs on active 01–06 heroes. Prior home-grid fails (top-right strap / middle-left arc / bottom-right angle) cleared. 04 BG outliers regenerated under the same gold plate and shipped as `?v=20261102briefgate`. No rembg / no 3D / model slot2 untouched.
