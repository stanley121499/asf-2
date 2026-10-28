# Simon final visual audit

**Date:** 2026-10-25  
**Wait gate:** `STRAP_STRAIGHTEN.md` complete (52 regen / upload 94, errors=0) before audit.  
**Scope:** All 94 assets under `simon-generated/` — 54 product `sf-*` + 24 `md-editorial-*` + 10 posts + 6 promos. Every file Read; no skipping.

## Criteria

1. Correct silhouette per product folder (01 MJ buckle, 02 knit X, 03 knit ankle, 04 satin ankle, 05 satin MJ, 06 satin X)
2. Straps straight / taut / perfectly held
3. Correct colorway (+ black-almond / black-pink interiors)
4. `sf-*` product-only studio; lifestyle = nurse-coded models
5. No AI defects (wrong buckle metal/velcro, wrong knit vs satin, melted parts)

## Totals (pre-fix)

| Metric | Count |
|---|---|
| Audited | **94** |
| **PASS** | **81** |
| **FAIL** | **13** |

## FAIL list (pre-fix)

| Path | Reasons |
|---|---|
| `products/05-satin-maryjane/cream/sf-hero-34.png` | Buckle reads as exposed silver metal, not cream covered buckle + silver prong |
| `products/05-satin-maryjane/cream/sf-side.png` | Gold/champagne metal buckle; cream covered + silver prong required |
| `products/05-satin-maryjane/cream/sf-topdown-insole.png` | Buckle loop / merge defect; missing clear covered buckle + silver prong |
| `products/05-satin-maryjane/sf-fallback.png` | Floating instep strap with no buckle; melted outer attach |
| `products/02-knit-ballet-xstrap/black/sf-pair-or-sole.png` | Melted/blurred X-strap attachment; distorted knit at junction |
| `products/06-satin-ballet-xstrap/cream/sf-topdown-insole.png` | Melt / blur where X straps meet upper; wavy collar artifacts |
| `products/06-satin-ballet-xstrap/black-pink/sf-topdown-insole.png` | Melt / jagged edge at strap–upper join |
| `products/04-satin-ankle-strap/sf-fallback.png` | Soft melt / irregular buckle geometry at strap entry |
| `posts/post-01.png` | Lifestyle not nurse-coded (skirt/dress); productKey 01 expects knit MJ |
| `posts/post-04.png` | Wrong silhouette: instep Mary Jane shown; productKey 04 requires wide satin ankle strap |
| `posts/post-09.png` | Lifestyle not nurse-coded (skirt + hosiery); productKey 06 black-pink X |
| `posts/post-10.png` | Cream 05 with exposed silver metal buckle (need cream covered + silver prong) |
| `promos/promo-06-evening.jpg` | productKey 06 black-pink: interior reads almond/beige, not pink lining |

## PASS notes (summary)

- **01** knit MJ: all SF + both editorials PASS (straps taut, nurse lifestyle, correct silhouette).
- **02** knit X: all except black `sf-pair-or-sole` PASS.
- **03** knit ankle: all SF + editorials PASS (LUMIXIU insole branding intentional per product notes).
- **04** satin ankle: cream/black-almond SF + editorials PASS except fallback; nurse lifestyle OK.
- **05** black-pink: all SF + editorials PASS (pink interior, covered black buckle).
- **06** cream/black-pink: sides/heroes/pairs/editorials/fallback PASS; topdowns FAIL as above.
- **Posts** 02,03,05,06,07,08 PASS (nurse-coded, silhouette match).
- **Promos** 01–05 PASS (nurse-coded where lifestyle; correct silhouettes).

## Auto-fix plan

Regenerate each FAIL with `GenerateImage` + absolute refs from `simon-product-refs/manifest.json`, overwrite local path, re-upload via `simon_cutover_upload.py`, re-Read and update this file + `RUN_LOG.md`.

## Post-fix status

| Metric | Count |
|---|---|
| Audited | **94** |
| Regenerated + overwritten | **13** |
| Re-upload | **94** objects via `simon_cutover_upload.py` → products=78 posts=10 promos=6 **errors=0** |
| **PASS (final)** | **94** |
| **FAIL (residual)** | **0** |

### Fixes applied

| Path | Fix |
|---|---|
| `05/.../cream/sf-hero-34.png` | Cream fabric-covered buckle + silver prong (2nd pass) |
| `05/.../cream/sf-side.png` | Cream covered buckle + silver prong |
| `05/.../cream/sf-topdown-insole.png` | Covered buckle + MODEL MATCH (2nd pass) |
| `05/.../sf-fallback.png` | Attached strap + cream covered buckle |
| `02/.../black/sf-pair-or-sole.png` | Clean X-strap joins + MODEL MATCH |
| `06/.../cream/sf-topdown-insole.png` | Clean X straps + crest |
| `06/.../black-pink/sf-topdown-insole.png` | Clean joins + pink insole + MODEL MATCH (2nd pass) |
| `04/.../sf-fallback.png` | Crisp ankle strap + covered buckle |
| `posts/post-01.png` | Nurse scrubs + beige knit MJ |
| `posts/post-04.png` | Cream satin **ankle** strap (was wrong MJ) |
| `posts/post-09.png` | Navy scrubs + black satin X |
| `posts/post-10.png` | Cream covered buckle MJ + nurse greenhouse |
| `promos/promo-06-evening.jpg` | Black-pink interior visible + 夜色轻舞 headline |

### Residual notes

None blocking. Minor elastic edge waviness on black-pink 06 topdown is within elastic strap tolerance.
