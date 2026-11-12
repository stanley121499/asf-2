# Simon generated media — run log


## 2026-11-07 — 01 black heel-collar fix (`?v=20261107blackcollar`)

- Cursor GenerateImage: ban cream collar → solid black cushion matching exterior (physical rear/side refs). Tan footbed peek optional; result is all-black interior.
- Preferred: `preferred-cursor+02black/p01-black-cursor-v1-blackcollar.png` (+ overwrite `p01-black-cursor-v1.png`). Bak: `preferred-cursor+02black/bak/p01-black-cursor-v1-pre-blackcollar.png`.
- Desathue re-ran for 01 black only → `preferred-desathue/p01-black-cursor-v1-desathue.png`.
- Installed `products/01-knit-maryjane-buckle/black/sf-hero-34.png`; shipped storage upsert + DB URL `?v=20261107blackcollar`.

## 2026-11-04 — CURSOR_V3 preferred heroes (`?v=20261104cursorv3`)

- Shipped **all 11** active CW `sf-hero-34` (+ 6 light `sf-fallback` clones) from `_qc/.tmp-fal-test/preferred-cursor+02black/`.
- Includes v3 fixes already in preferred: **01 black** under-shadow + **06** cream/BP BG fixes. Sheet: `cmp/cmp-cursor-plus-02black-all11-v3.jpg`.
- Upload: `.tmp/upload_cursorv3.py` — 17 webps upserted; DB arr 1+10 → `?v=20261104cursorv3`.
- Slot2 / inactive 03 blush untouched (`?v=20261102warm0304`). Bak: `_bak_cursorv3_20261104/`.

## 2026-11-02 — HERO_DIFFBG_GATE (`?v=20261102diffbggate` on 02)

- Hard QC after diffBG batch (`BRIEF_REV=20261102-diffbg`).
- FAIL→fix: **02** X-crossing vs PHYS; shipped `?v=20261102diffbggate`.
- BG distinctness 01–06 + cam vs gold: PASS. Notes: `_qc/HERO_DIFFBG_GATE.md`.

## 2026-11-02 — HERO_DIFFBG_05_06 (`?v=20261102diffbg0506`)

- BRIEF_REV=`20261102-diffbg`. Scope 05+06 heroes + cream fallbacks only.
- Gold-plate cam lock; §2.1 BG hex `#C4B8A8` (05) / `#BEB6A9` (06); 06 X strap fidelity vs refs.
- No rembg / no 3D; arr 11 untouched (`?v=20261102model0406`).
- QC: `_qc/HERO_DIFFBG_05_06.md`. Scratch: `_qc/.tmp-diffbg0506/`.

## 2026-11-02 — HERO_DIFFBG_01_02 (`?v=20261102diffbg0102`)

- Regenerated Product **01** + **02** `sf-hero-34` (+ beige fallbacks) only.
- Brief `BRIEF_REV=20261102-diffbg`: distinct BG hex 01 `#C8C0B4` / 02 `#D2C4B0`; fixed top-left 02 black X vs physical refs; cam toe 7:00 = gold cream X.
- Upload: `.tmp/upload_diffbg0102.py` — 6 webps; DB arr 1+10 → `?v=20261102diffbg0102`.
- QC: `_qc/HERO_DIFFBG_01_02.md`. No rembg/3D; model slot2 untouched.

## 2026-10-19 — Product 03 (knit ankle strap)

Agent generated blush + beige + fallback (13 images). No black colorway.

> **2026-11-02 catalog note:** Blush is **not** a real physical CW (`blush/` refs = beige clones). Live `#E8C4C4` remains inactive; declared CW is beige only. See `_qc/03-BLUSH_NOT_A_REAL_CW.md`. Do not regenerate or reactivate blush on reseed.

### Output paths

```
simon-generated/products/03-knit-ankle-strap/
  blush/
    sf-hero-34.png
    sf-side.png
    sf-topdown-insole.png
    sf-pair-or-sole.png          # PAIR
    md-editorial-a.png           # P02 crosswalk
    md-editorial-b.png           # P03 café
  beige/
    sf-hero-34.png
    sf-side.png
    sf-topdown-insole.png
    sf-pair-or-sole.png          # SOLE
    md-editorial-a.png           # P04 stairwell
    md-editorial-b.png           # P05 wet street / reflection
  sf-fallback.png                # beige primary 3/4
```

### QC

- `_qc/03-blush-notes.md`
- `_qc/03-beige-notes.md`
- `_qc/03-fallback-notes.md`

### Pose bank

Claimed P02–P05 in `POSE_BANK_USED.md` (P01 reserved by example).

## Product 05 — satin Mary Jane (instep)

Completed: 2026-10-19

- cream: 6 images (pair for sf-pair-or-sole); poses P04, P08
- black-pink: 6 images (sole for sf-pair-or-sole); poses P11, P16; cream + black-pink refs attached
- sf-fallback.png (cream primary)
- Output: `products/05-satin-maryjane/` (13 files)
- QC: `_qc/05-cream-notes.md`, `_qc/05-black-pink-notes.md`, `_qc/05-fallback-notes.md`

## Product 06 — satin ballet X-strap

Completed: 2026-10-19  
Images: 13 (6 cream + 6 black-pink + 1 fallback)  
Pose IDs: P13, P12 (cream); P14, P15 (black-pink)

### Cream
- `products/06-satin-ballet-xstrap/cream/sf-hero-34.png`
- `products/06-satin-ballet-xstrap/cream/sf-side.png`
- `products/06-satin-ballet-xstrap/cream/sf-topdown-insole.png`
- `products/06-satin-ballet-xstrap/cream/sf-pair-or-sole.png` (pair)
- `products/06-satin-ballet-xstrap/cream/md-editorial-a.png` (P13 office lobby)
- `products/06-satin-ballet-xstrap/cream/md-editorial-b.png` (P12 beach boardwalk)

### Black-pink
- `products/06-satin-ballet-xstrap/black-pink/sf-hero-34.png`
- `products/06-satin-ballet-xstrap/black-pink/sf-side.png`
- `products/06-satin-ballet-xstrap/black-pink/sf-topdown-insole.png`
- `products/06-satin-ballet-xstrap/black-pink/sf-pair-or-sole.png` (sole)
- `products/06-satin-ballet-xstrap/black-pink/md-editorial-a.png` (P14 night bokeh)
- `products/06-satin-ballet-xstrap/black-pink/md-editorial-b.png` (P15 garden path)

### Fallback
- `products/06-satin-ballet-xstrap/sf-fallback.png` (cream hero)

### QC
- `_qc/06-cream-notes.md` — PASS 6/6
- `_qc/06-black-pink-notes.md` — PASS 6/6
- `_qc/06-fallback-notes.md` — PASS

## Product 04 — satin ankle strap

Completed: 2026-10-19

### cream
- products/04-satin-ankle-strap/cream/sf-hero-34.png
- products/04-satin-ankle-strap/cream/sf-side.png
- products/04-satin-ankle-strap/cream/sf-topdown-insole.png
- products/04-satin-ankle-strap/cream/sf-pair-or-sole.png
- products/04-satin-ankle-strap/cream/md-editorial-a.png (P06)
- products/04-satin-ankle-strap/cream/md-editorial-b.png (P07)

### black-almond
- products/04-satin-ankle-strap/black-almond/sf-hero-34.png
- products/04-satin-ankle-strap/black-almond/sf-side.png
- products/04-satin-ankle-strap/black-almond/sf-topdown-insole.png
- products/04-satin-ankle-strap/black-almond/sf-pair-or-sole.png
- products/04-satin-ankle-strap/black-almond/md-editorial-a.png (P08)
- products/04-satin-ankle-strap/black-almond/md-editorial-b.png (P09)

### fallback
- products/04-satin-ankle-strap/sf-fallback.png

QC: _qc/04-cream-notes.md, _qc/04-black-almond-notes.md, _qc/04-fallback-notes.md

## PROMOS — campaign banners

Completed: 2026-10-19  
Agent card: GENERATION_HANDOFF.md §7 PROMOS  
Count: 6 × 16:9 (did not regenerate product galleries)

### Output

```
simon-generated/promos/
  promo-01-new-season.jpg     # 新季女鞋 — P01 black knit Mary Jane
  promo-02-members.jpg        # 会员专属 — P04 cream satin ankle
  promo-03-satin-elegance.jpg # 缎面优雅 — P05 cream satin Mary Jane
  promo-04-limited-offer.jpg  # 限时特惠 — P02 beige knit X-strap
  promo-05-commute.jpg        # 通勤必备 — P03 blush knit ankle
  promo-06-evening.jpg        # 夜色轻舞 — P06 black-pink satin X-strap
  promo_spec.json
```

### Style refs

Used existing `products/*/sf-hero-34.png` as `reference_image_paths` for product fidelity.

### QC (spot)

- Chinese headlines legible on all 6
- Distinct themes / products / colorways mixed across catalog
- Photorealistic campaign layout (text left, shoe hero right)

## Posts — feed/home heroes (16:9)

Completed: 2026-10-19  
Count: 10 (`post-01.png` … `post-10.png`)  
Spec: `posts/posts_spec.json`  
Scenes: POST-S01…POST-S10 (new editorial scenes; not product-gallery pose bank P01–P16)

### Output paths

```
simon-generated/posts/
  post-01.png   # 01 beige knit Mary Jane — hotel elevator
  post-02.png   # 02 black knit X-strap — art gallery
  post-03.png   # 03 blush knit ankle — garden wedding
  post-04.png   # 04 cream satin ankle — riverside pier
  post-05.png   # 05 black-pink satin MJ — tram stop
  post-06.png   # 06 cream satin X-strap — laundry balcony
  post-07.png   # 01 black knit Mary Jane — rainy café
  post-08.png   # 02 beige knit X-strap — museum courtyard
  post-09.png   # 06 black-pink satin X — jazz stairs
  post-10.png   # 05 cream satin MJ — greenhouse
  posts_spec.json
```

### Product mix

| Post | Folder | Colorway |
|---|---|---|
| 01 | 01-knit-maryjane-buckle | beige |
| 02 | 02-knit-ballet-xstrap | black |
| 03 | 03-knit-ankle-strap | blush |
| 04 | 04-satin-ankle-strap | cream |
| 05 | 05-satin-maryjane | black-pink |
| 06 | 06-satin-ballet-xstrap | cream |
| 07 | 01-knit-maryjane-buckle | black |
| 08 | 02-knit-ballet-xstrap | beige |
| 09 | 06-satin-ballet-xstrap | black-pink |
| 10 | 05-satin-maryjane | cream |

Refs: simon-generated product packshots + physical refs under `simon-product-refs/`.  
Stop after posts (PROMOS card separate).

## 2026-10-25 — Strap audit + nurse lifestyle retheme

### Part A — Strap fidelity

Audit: `_qc/STRAP_AUDIT.md`  
Inspected all 54 storefront packshots (`sf-hero-34`, `sf-side`, `sf-topdown-insole`, `sf-pair-or-sole`, `sf-fallback`).

**FAIL count: 3** (all Product 05 cream / fallback buckle hardware fidelity):

| Path | Fix |
|---|---|
| `products/05-satin-maryjane/cream/sf-topdown-insole.png` | Regenerated — covered cream buckle + MODEL MATCH insole (was Velcro-like) |
| `products/05-satin-maryjane/cream/sf-hero-34.png` | Regenerated — cream/silver buckle, matte pale heel (not gold metal) |
| `products/05-satin-maryjane/sf-fallback.png` | Replaced with fixed cream hero (no gold heel trim) |

Products 01–04 and 06 storefront sets: **PASS** strap silhouette.

### Part B — Nurse model lifestyle regen

Regenerated **40** lifestyle assets (storefront `sf-*` packshots left product-only):

| Kind | Count |
|---|---|
| `md-editorial-a/b` (all 12 colorways) | **24** |
| `posts/post-01.png` … `post-10.png` | **10** |
| `promos/promo-01` … `promo-06` | **6** |

Direction: Southeast/East Asian nurse / nurse-coded wardrobe (scrubs preferred), unique cinematic scenes, product refs attached for strap fidelity.

### Upload

`simon_cutover_upload.py` — upserted **94** objects to same storage paths (`storefront-curated/2026-10/simon/...`).  
Result: products=78 posts=10 promos=6 **errors=0**. Catalog DB rows unchanged (media_url paths preserved).


## 2026-10-25 — Strap straighten (packshot tension / symmetry)

QC: `_qc/STRAP_STRAIGHTEN.md`

Regenerated **52** local assets with strap addendum (“perfectly straight, taut, symmetrically aligned…”):

| Kind | Count |
|---|---:|
| Storefront `sf-hero-34` / `sf-side` / `sf-topdown-insole` / pair / fallback | **48** |
| Lifestyle (`md-editorial-a` ×3 + `post-01`) | **4** |

Skipped sole-underside `sf-pair-or-sole` (no strap) and `promo-01` (Chinese text corrupted on regen).

### Upload

`simon_cutover_upload.py` — upserted **94** objects to same storage paths.  
Result: products=78 posts=10 promos=6 **errors=0**. Catalog schema / media URLs unchanged.

## 2026-10-25 — Final audit (all 94) + auto-fix

QC: `_qc/FINAL_AUDIT.md`

Waited for strap-straighten completion (`_qc/STRAP_STRAIGHTEN.md` + this log), then Read-audited every `sf-*`, `md-editorial-*`, `posts/post-*`, `promos/promo-*` (94 total).

### Pre-fix

| Metric | Count |
|---|---:|
| Audited | 94 |
| PASS | 81 |
| FAIL | 13 |

FAIL themes: Product 05 cream buckle (metal/floating), melt on 02 black pair + 06 topdowns + 04 fallback, lifestyle wardrobe (post-01/09), wrong silhouette (post-04 instep vs ankle), post-10 metal buckle, promo-06 almond interior vs pink.

### Auto-fix

Regenerated **13** FAIL paths with `GenerateImage` + `simon-product-refs/manifest.json` refs; overwrote locals; 05 cream hero/topdown and 06 black-pink topdown + promo-06 needed a second pass.

### Upload

`simon_cutover_upload.py` — upserted **94** objects to same Supabase paths.  
Result: products=78 posts=10 promos=6 **errors=0**.

### Final

**PASS 94 / FAIL 0** residual.

## 2026-10-25 — Strict two-angle storefront cutover

- Regenerated **30** packshots: 12× `sf-hero-34`, 12× `sf-side`, 6× `sf-fallback`.
- Orientation: Angle A toe bottom-left; Angle B points left.
- P01 black heel collar corrected to **black** (matches physical refs).
- Uploaded via `simon_two_angle_upload.py` (`?v=3`).
- Hard-deleted 48 `product_medias` rows (arr 12–15). Per product now: 1 fallback + 2 angles × 2 colors = **5** rows.
- Editorials/posts/promos files kept; removed from color gallery only.
- QC: `_qc/STOREFRONT_TWO_ANGLE.md`

## 2026-10-28 — Nurse composition regen
- Regenerated 40 lifestyle images (10 posts + 6 promos + 24 md-editorial)
- Left packshots alone (2-angle PDP)
- Upload: `simon_nurse_comp_upload.py`
- Cache-bust: `?v=20261028nursecomp`
- QC: `_qc/NURSE_COMPOSITION_REGEN.md`

## 2026-11-02 — Mute BG + face-on yaw heroes 05/06

- Regenerated Product **05** + **06** `sf-hero-34` (+ cream fallbacks) only.
- More face-on 3/4 yaw (gold cream-X family); muted unique warm-grays `#D8D1C8` (05) / `#CDC8C1` (06).
- Upload: `.tmp/upload_mute0506.py` — 6 webps; DB arr 1+10 → `?v=20261102mute0506`.
- Model slot2 untouched. No rembg.
- QC: `_qc/HERO_MUTE_BG_05_06.md`

## 2026-11-02 — Camlock 7 o’clock heroes 05/06

- Regenerated Product **05** + **06** `sf-hero-34` (+ cream fallbacks) only.
- Toe at **7 o’clock**; identical camera height/pitch (rejected higher-angle 06 bp C).
- Muted BGs kept `#D8D1C8` / `#CDC8C1`.
- Upload: `.tmp/upload_cam7_0506.py` — 6 webps; DB arr 1+10 → `?v=20261102cam7_0506`.
- Model slot2 untouched. No rembg.
- QC: `_qc/HERO_CAMLOCK_05_06.md`

## 2026-11-02 — Locked camera (toe 7:00) heroes 01/02

- Regenerated Product **01** + **02** `sf-hero-34` (+ beige fallbacks) only.
- Cam lock: toe **7 o’clock**; identical elevated 3/4 height/pitch (gold cream) — not mute0102 overhead.
- Muted greige BGs ~`#CDC9C3` / `#CBC6C0`; 02 X plank thickness held.
- Upload: `.tmp/upload_cam7_0102.py` — 6 webps; DB arr 1+10 → `?v=20261102cam7_0102`.
- Model slot2 untouched. No rembg.
- QC: `_qc/HERO_CAMLOCK_01_02.md`

## 2026-11-02 — Brief locked-plate heroes 03/04

- Regenerated Product **03** beige + **04** cream/BA `sf-hero-34` (+ fallbacks) only.
- Gold plate = attached cream X; toe **7 o’clock**; same camera height; flat muted BG (no arcs).
- 03 blush inactive not shipped; model slot2 untouched. No rembg / no 3D.
- Upload: `.tmp/upload_brief0304.py` — 5 webps; DB arr 1+10 → `?v=20261102brief0304`.
- QC: `_qc/HERO_BRIEF_BATCH_03_04.md` · sheet `_qc/.tmp-brief0304/cmp/cmp-brief-ship-vs-gold.jpg`

## 2026-11-02 — Brief locked-plate heroes 05/06

- Regenerated Product **05** + **06** `sf-hero-34` (+ cream fallbacks) only.
- Gold plate = attached cream X; toe **7 o’clock**; same camera height; flat muted BG.
- Avoided prior fails: 06 cream wrong strap; 05 cream higher angle.
- Upload: `.tmp/upload_brief0506.py` — 6 webps; DB arr 1+10 → `?v=20261102brief0506`.
- Model slot2 untouched. No rembg / no 3D.
- QC: `_qc/HERO_BRIEF_BATCH_05_06.md` · sheet `_qc/.tmp-brief0506/cmp/cmp-brief0506-ship-final.jpg`

## 2026-11-02 — DiffBG heroes 03/04 (`BRIEF_REV=20261102-diffbg`)

- Regenerated Product **03** beige + **04** cream/BA `sf-hero-34` (+ fallbacks) only.
- Gold plate cam lock; toe **7 o’clock**; flat BG no arcs; distinct hexes **03 `#B9B2A6`** / **04 `#D8CFC2`** (≠ 01/02/05/06).
- 03 blush inactive not shipped; model slot2 untouched. No rembg / no 3D.
- Uploaded 5 webps; DB arr 1+10 → `?v=20261102diffbg0304`.
- QC: `_qc/HERO_DIFFBG_03_04.md` · sheet `_qc/.tmp-diffbg0304/cmp/cmp-diffbg-ship-vs-gold.jpg`
