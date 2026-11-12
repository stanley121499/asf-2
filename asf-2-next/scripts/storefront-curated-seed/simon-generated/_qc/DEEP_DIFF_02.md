# Product 02 deep ref diff

**SKU:** 针织芭蕾交叉带平底鞋 (`c1010001-24a8-4f00-8000-000000000002`)  
**Slug:** `02-knit-ballet-xstrap`  
**Date:** 2026-11-01  
**Mode:** FIX + LIVE re-QC (post `?v=20261101studio02b` — **studio AI regen, not cutout/rembg**)  
**Live gallery:** 2 angles + fallback (`sf-hero-34`, `sf-side`, `sf-fallback`)  
**Cache-bust on live:** `?v=20261101studio02b`

**Audit verdict (pre-fix):** Live packshots were recognizably “knit X-strap ballet,” but did **not** match the physical sample’s strap mass — X elastic read as thin ribbon vs wide webbing. Prior “taut X + no pillow” PASS under-weighted gauge.

**Post-fix verdict:** See **Post-fix** sections — `deep02` cleared CRITICAL thin-ribbon; `studio02` replaced packshots with catalog-matched **professional studio** AI photos; `studio02b` clears remaining beige `sf-side` strap-gauge MAJOR vs `side-hand-01`. **Confirmed: not cutout/crop/rembg of WhatsApp refs.**

---

## Ref inventory (paths)

Physical truth under `simon-product-refs/02-knit-ballet-xstrap/` (WhatsApp samples; **not** in app media).

### Black (`#111111`)

| Path | Role |
|---|---|
| `black/side-01.jpg` | Outer side — strap width, attachment into sidewall/welt, low black block heel |
| `black/side-insole-01.jpg` | Inner-ish side — X + tan insole + MODEL MATCH crest peek |
| `black/front-01.jpg` | Front ¾ — square-blunt toe, wide X covering midfoot, strap gauge |
| `black/topdown-insole-01.jpg` | Top-down — X width vs opening, dense matte elastic, crest |
| `black/rear-01.jpg` | Heel back — vertical strip + pull tab; **NO** pillow; straps into heel strip |
| `black/sole-01.jpg` | Outsole — floral/clover forefoot, size **37**, ridged heel block |

### Beige (`#D6C6A8`)

| Path | Role |
|---|---|
| `beige/side-01.jpg` | Outer side — oatmeal knit, wide beige X, medium-brown sole/heel |
| `beige/side-hand-01.jpg` | Hand-held side — best strap thickness / square toe read |
| `beige/topdown-01.jpg` | Top-down — X width, ribbed toe, tan insole |
| `beige/rear-01.jpg` | Heel — tan vertical strip, straps into strip, **NO** pillow |
| `beige/sole-01.jpg` | Front/upper-ish sole-adjacent view (sample set) |
| `beige/sole-02.jpg` | Outsole — brown floral forefoot, **37**, ridged heel |

### Manifest lock (reminders)

- Strap: **TWO wide flat elastic bands**, clear X, **NO buckle**
- Heel: vertical strip + small pull tab only; `heelCollar: NONE`
- mustNot: padded back cushion / pillow heel collar
- Sole: floral forefoot / size 37 / ridged heel; black CW = black sole; beige CW = medium tan/brown

---

## Live media inventory (URLs + `?v=`)

From Supabase `product_medias` for product `…0002` (queried 2026-11-01).

| Color | arrangement | Shot | URL |
|---|---:|---|---|
| *(product fallback)* | 1 | `fallback.webp` | `…/c1010001-…0002/fallback.webp?v=20261101studio02b` |
| `#111111` black `c1500201-…0001` | 10 | `sf-hero-34.webp` | `…/0002/c1500201-…0001/sf-hero-34.webp?v=20261101studio02b` |
| `#111111` black | 11 | `sf-side.webp` | `…/0002/c1500201-…0001/sf-side.webp?v=20261101studio02b` |
| `#D6C6A8` beige `c1500201-…0002` | 10 | `sf-hero-34.webp` | `…/0002/c1500201-…0002/sf-hero-34.webp?v=20261101studio02b` |
| `#D6C6A8` beige | 11 | `sf-side.webp` | `…/0002/c1500201-…0002/sf-side.webp?v=20261101studio02b` |

**Identity check:** `fallback.webp` MD5 == beige `sf-hero-34.webp` (beige Angle A copy). Local disk PNGs under `simon-generated/products/02-knit-ballet-xstrap/{black,beige}/` match the same generation batch used for this CDN token.

Full base:  
`https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000002/`

---

## Colorway black — shot-by-shot diffs

Compared live CDN (and matching local PNGs) against black physical refs above. **No shot is a clean PASS.**

### `sf-hero-34` (Angle A)

- **Silhouette:** Still a sporty knit ballet flat, but toe reads **rounder / puffier** than ref front/topdown’s **blunter square** toe. Throat looks more open.
- **X-strap width/thickness:** **FAIL — CRITICAL.** Live bands are clearly **narrower and flatter** than ref front + topdown + side-insole. Ref elastic has **visual mass** (wide webbing covering a large share of the midfoot); live X leaves large empty triangles and reads like thin ribbon.
- **Layering:** Live cross has a clean geometric bump; ref cross looks **thicker / softer-edged** where bands stack.
- **Tension:** Live is **over-taut / tidy** (post strap-tidy). Physical empties show more natural slack/bow. Packshot choice, but it further hides the “heavy elastic” character.
- **Attachment:** Live straps disappear into a neat topline/side seam. Refs show **deeper / lower** sidewall–welt integration and more bulk at the join.
- **Heel back:** No full invented Mary-Jane pillow, but collar is **soft / slightly thickened** vs rear ref’s slim flush knit + vertical strip. Pull tab present but **heel strip less architectural** than `rear-01`.
- **Sole:** Low black block heel OK in type/height.
- **Insole:** Tan footbed + dark crest print present (good direction); exact MODEL MATCH crest fidelity not proven equal to ref topdown.
- **Knit:** Ribs readable, but slightly more uniform/CGI than organic WhatsApp knit.
- **Proportions:** Midfoot dominated by thin X → shoe looks lighter / less “sock-hybrid with chunky elastic.”

### `sf-side` (Angle B)

- **Silhouette:** Low profile OK; toe still softer than ref side’s blunt box.
- **X-strap:** **FAIL — CRITICAL.** Side view makes the gauge gap obvious: ref `side-01` / `side-insole-01` straps occupy a large fraction of sidewall height; live straps are a **slim band** with less edge bulk.
- **Layering/tension:** Live X is sharp and geometric; ref X is heavier and less “drawn with a ruler.”
- **Attachment:** Live shows a clean vertical meet at the midfoot; ref join looks **chunkier**.
- **Heel back:** Small pull-tab visible. Residual **soft collar lip** vs ref rear/side flush topline — not as bad as the old beige pillow bug, but **not ref-true**.
- **Sole / insole rim:** Black sole + tan lining peek OK.
- **Knit:** Diagonal side ribs OK-ish; slightly over-smooth.

### Fallback

- Not used for black; see beige (fallback = beige hero).

---

## Colorway beige — shot-by-shot diffs

### `sf-hero-34` (Angle A) — also = live `fallback.webp`

- **Silhouette:** Oatmeal knit ballet OK at a glance; toe leans **almond/rounded** vs ref side-hand / topdown **square-blunt**.
- **X-strap width/thickness:** **FAIL — CRITICAL.** Side-hand + topdown + rear refs show **wide, dense, opaque** beige elastic. Live straps are **thinner, flatter, less substantial** — same buyer mismatch as black.
- **Layering/tension:** Live X taut and neat; physical empty shoes show **slack / inward fold** at rear. Live underplays material thickness at the cross.
- **Attachment:** Live midfoot join looks sewn-thin; refs read as **heavier webbing** entering the collar/welt.
- **Heel back:** Small tan pull tab present; **vertical heel strip weaker** than `beige/rear-01` (which shows a clear stitched tan strip wrapping the strap ends). No full fake pillow on hero, but collar is not as **paper-thin flush** as rear ref.
- **Sole:** Medium-brown low block — **colorway OK** (not the cream/white sole bug class).
- **Insole:** Tan, mostly blank in this angle — acceptable for ¾; branding not demanded here.
- **Knit:** Vertical toe ribs + diagonal sides present; live ribs a bit sharper/cleaner than sample photos.
- **Proportions:** Thin X + open throat → product looks more “delicate ballet” than the **sturdy elastic cage** on the sample.

### `sf-side` (Angle B)

- **Silhouette:** **MAJOR drift** — live side reads longer / more almond; ref `side-01` / `side-hand` are **squarer and shorter** in the toe.
- **X-strap:** **FAIL — CRITICAL.** Zoom vs `side-hand-01`: ref strap is **~much thicker and wider** relative to sidewall; live is single-ply flat elastic with a visible vertical stitch at the join.
- **Layering/tension:** Live over-stretched tidy X; ref elastic has soft drape and more edge volume.
- **Heel:** Pull-tab / strip hints present but **underbuilt** vs rear ref. Slight collar thickness remains.
- **Sole:** Brown sole/heel OK.
- **Knit:** Diagonal ribs OK; slightly flatter than hand-held ref texture.

### `fallback` (= beige hero)

- Inherits **all beige hero CRITICAL/MAJOR** items. Same file as beige Angle A on CDN.

---

## Severity summary: CRITICAL / MAJOR / MINOR

| Sev | Finding | Where |
|---|---|---|
| **CRITICAL** | **X-strap width/thickness far below physical** — original webbing much thicker/wider; live reads thin ribbon | All live: black hero, black side, beige hero, beige side, fallback |
| **CRITICAL** | **X visual mass / midfoot coverage** — live leaves large open throat; refs’ wide X dominate the instep (product character change) | All live packshots |
| **CRITICAL** | **Strap material heft** — ref = dense matte/opaque elastic; live = finer, flatter, slightly sheenier band | All live packshots |
| **MAJOR** | Residual **soft Achilles collar lip** (not full old pillow, but not slim flush rear-ref truth) | Especially black side + beige side; soft on heroes |
| **MAJOR** | **Heel vertical reinforcement strip** understated / fused into knit vs clear stitched strip on `*/rear-01` | Both CWs live sides/heroes |
| **MAJOR** | **Toe shape drift** toward rounder/almond vs ref rounded-square / blunt box | Black hero; beige hero; **worst on beige side** |
| **MAJOR** | **Attachment construction** — live thin vertical seam / higher join vs ref low bulky welt/sidewall anchor | All live sides + heroes |
| **MAJOR** | **Tension style** — over-taut geometric X vs physical empty slack (changes perceived elastic gauge) | All live (strap-tidy overshoot) |
| **MINOR** | Knit ribs over-uniform / studio CGI smoothness vs WhatsApp organic knit | All live |
| **MINOR** | Studio seamless BG vs tile floor (expected for packshots) | All live |
| **MINOR** | Insole crest only partially comparable by angle; not a colorway fail | Black hero mainly |
| **MINOR** | Fallback duplicates beige hero by design | fallback |

### Counts

| Severity | Count |
|---|---:|
| **CRITICAL** | **3** |
| **MAJOR** | **5** |
| MINOR | 4 |

*(CRITICAL/MAJOR apply across both colorways’ live gallery — 5/5 live assets fail hard strap gauge.)*

---

## Buyer-risk note

This SKU’s shopping signal is the **chunky crossed elastic**, not just “has an X.” A buyer comparing PDP packshots to the physical shoe (or to seller WhatsApp refs) will notice the live straps first: they look **cheaper, thinner, and less secure**. That is a classic **expectation mismatch → return / “not as pictured”** risk.

Secondary risks: slightly **rounder toe** and a **soft heel collar** (after a known pillow hallucination history on beige) can compound distrust even when colorway (black vs oatmeal + brown sole) is roughly right.

**Prior PASS notes (`PER_PRODUCT_02`, strap-tidy “PASS”) optimized for taut tidy X and no full pillow — they did not catch strap gauge.** This deep diff reverses that for thickness: **FAIL until straps match ref width/mass.**

---

## Post-fix (2026-11-01 · `?v=20261101deep02`)

### Actions

1. Regenerated 2-angle gallery (black + beige hero/side) with physical refs attached; iterated A→E until strap mass dominated midfoot (round **E** shipped). Explicit locks: **wide dense X webbing**, taut, **no heel pillow**, soft-square toe, vertical heel strip + pull tab.
2. Overwrote locals under `simon-generated/products/02-knit-ballet-xstrap/{black,beige}/` + `sf-fallback.png` (= beige hero).
3. Upserted 5 webps to Supabase storage; `product_medias.media_url` → `?v=20261101deep02` (5/5 rows).
4. Vision re-QC on **LIVE CDN** downloads (not locals only) vs physical refs; comparison grids under `_qc/.tmp-p02-deep/`.

### Live URLs

```
…/c1010001-…0002/fallback.webp?v=20261101deep02
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261101deep02
…/c1010001-…0002/c1500201-…0001/sf-side.webp?v=20261101deep02
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261101deep02
…/c1010001-…0002/c1500201-…0002/sf-side.webp?v=20261101deep02
```

Identity: live `fallback.webp` == beige `sf-hero-34.webp`.

### Live vision re-QC (harsh)

| Shot | Strap width/mass | Heel pillow | Notes |
|---|---|---|---|
| black `sf-hero-34` | **PASS** (CRITICAL cleared) — wide dense X, midfoot coverage matches topdown/front character | **PASS** — slim flush + pull tab; no Achilles pillow | Angle more elevated/top-down than classic ¾; soft-square toe OK |
| black `sf-side` | **PASS** (CRITICAL cleared) — bands ~⅓ opening height; dense matte webbing, taut | **PASS** — no fake pillow; strip/tab present but still a bit fused | Heel strip less architectural than `rear-01` |
| beige `sf-hero-34` | **PASS** (CRITICAL cleared) — chunky opaque beige X dominates instep vs prior ribbon | **PASS** — clear tan vertical strip + tab; no pillow | Best CW of the set for strap mass |
| beige `sf-side` | **SOFT PASS / residual MAJOR** — much wider than pre-fix, still ~slightly under side-hand absolute gauge | **PASS** — no full pillow; slight soft topline lip residual | Toe still a touch almond vs blunt box |
| fallback | inherits beige hero | inherits beige hero | OK |

### Severity after fix

| Sev | Finding | Status |
|---|---|---|
| **CRITICAL** | X-strap width/thickness far below physical (thin ribbon) | **CLEARED** on all 5 live assets |
| **CRITICAL** | X visual mass / midfoot coverage | **CLEARED** (heroes strong; beige side soft residual → MAJOR) |
| **CRITICAL** | Strap material heft (dense opaque vs fine ribbon) | **CLEARED** |
| **MAJOR** | Beige side strap gauge still slightly under `side-hand-01` / `side-01` absolute width | **REMAINING** |
| **MAJOR** | Heel vertical reinforcement strip understated vs `*/rear-01` (esp. black) | **REMAINING** (improved, not equal) |
| **MAJOR** | Soft Achilles collar lip / residual thickness | **DOWNGRADED → MINOR** — no fake pillow on live |
| **MAJOR** | Toe drift (almond vs blunt box) | **DOWNGRADED → MINOR** on heroes; soft residual on beige side |
| **MAJOR** | Attachment / over-taut geometric X vs physical empty slack | **DOWNGRADED → MINOR** (packshot tautness kept by design; joins bulkier with wider straps) |

### Remaining CRITICAL / MAJOR (return)

| Severity | Count | Items |
|---|---:|---|
| **CRITICAL** | **0** | — |
| **MAJOR** | **2** | (1) beige `sf-side` strap gauge still slightly under physical max; (2) heel vertical strip still understated vs rear refs (both CWs, worse on black) |

Honest residual: generative packshots now read as **chunky elastic X** (buyer-risk thin-ribbon fail fixed), but beige side + heel-strip architecture are not pixel-matched to WhatsApp refs. Further loop would need another beige-side-only regen and/or black rear-strip emphasis — not blocking the prior CRITICAL bar.

---

## Post-fix (2026-11-01 · `?v=20261101studio02`) — STUDIO REGEN (not cutout)

### Confirm: studio AI packshots, not cutout/rembg

| Check | Result |
|---|---|
| Source | Fresh `GenerateImage` studio renders (catalog Angle A/B locked to Product 01 packshot camera) |
| Background | Seamless soft white `#F7F7F5` cyclorama + soft contact shadow |
| Lighting | Even commercial packshot light (not WhatsApp tile / hand / phone flash) |
| Process | **No** rembg, **no** cutout, **no** crop-of-ref pasted on white |
| Physical refs | Attached as **identity** refs only (strap gauge / heel strip / color) |

### Actions

1. Regenerated 2-angle gallery as professional studio AI photos (black + beige hero/side). Iterated A→C; shipped **C heroes** (max strap mass) + **B sides** (kept X intact — C black side hallucinated single strap and was rejected).
2. Overwrote locals under `simon-generated/products/02-knit-ballet-xstrap/{black,beige}/` + `sf-fallback.png` (= beige hero).
3. Upserted 5 webps to Supabase storage; `product_medias.media_url` → `?v=20261101studio02` (5/5 rows).
4. Vision re-QC on **LIVE CDN** downloads vs physical refs; grids under `_qc/.tmp-p02-deep/qc-live-*.jpg` + `live-studio02/`.

### Live URLs

```
…/c1010001-…0002/fallback.webp?v=20261101studio02
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261101studio02
…/c1010001-…0002/c1500201-…0001/sf-side.webp?v=20261101studio02
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261101studio02
…/c1010001-…0002/c1500201-…0002/sf-side.webp?v=20261101studio02
```

Identity: live `fallback.webp` == beige `sf-hero-34.webp`.

### Live vision re-QC (harsh)

| Shot | Studio / angle | Strap width/mass | Heel pillow / strip | Notes |
|---|---|---|---|---|
| black `sf-hero-34` | **PASS** — catalog Angle A toe-bottom-left ¾, seamless studio | **PASS** — wide dense X (CRITICAL bar) | **PASS** — no fake pillow; strip/tab present | Heel strip less readable at classic ¾ than rear ref |
| black `sf-side` | **PASS** — left side profile, studio | **PASS** — chunky X vs prior ribbon | **SOFT** — tab + strip present; strip still a bit fused on black | Soft collar residual → MINOR |
| beige `sf-hero-34` | **PASS** — catalog Angle A, studio | **PASS** — bold opaque X | **PASS** — clear tan strip + tab, no pillow | Strongest CW for strip+strap |
| beige `sf-side` | **PASS** — left side, studio | **SOFT PASS / residual MAJOR** — much closer to side-hand; still ~slightly under absolute max | **PASS** — strip/tab visible, no full pillow | Primary residual gauge |
| fallback | inherits beige hero | inherits beige hero | inherits beige hero | OK |

### Remaining CRITICAL / MAJOR (return)

| Severity | Count | Items |
|---|---:|---|
| **CRITICAL** | **0** | — |
| **MAJOR** | **1** | beige `sf-side` X-strap gauge still slightly under `side-hand-01` absolute physical max (heel-strip MAJOR from `deep02` **downgraded → soft/MINOR** on studio02 — strip+tab visible both CWs; black strip still soft but not a buyer-risk miss) |

**Confirmed for parent:** Product 02 live `?v=20261101studio02` is a **professional studio AI regen**, not a cutout/crop/rembg of physical refs.

---

## Post-fix (2026-11-01 · `?v=20261101studio02b`) — beige `sf-side` strap max

### Confirm: studio AI packshot, not cutout/rembg

| Check | Result |
|---|---|
| Source | Fresh `GenerateImage` studio render (candidate **S** shipped) |
| Background | Seamless soft white `#F7F7F5` cyclorama + soft contact shadow |
| Lighting | Even commercial packshot light |
| Process | **No** rembg, **no** cutout, **no** crop-of-ref pasted on white |
| Physical refs | `beige/side-hand-01`, `beige/side-01`, `beige/topdown-01` as identity / gauge locks |

### Actions

1. Regenerated **beige `sf-side` only** (Angle B toe-left) with explicit max strap lock vs `side-hand-01` (iterated D→S; shipped **S** — thicker X than `studio02`, matching physical max coverage).
2. Overwrote local `simon-generated/products/02-knit-ballet-xstrap/beige/sf-side.png` (backup `_bak_p02studio02b_20261101/`).
3. Upserted beige `sf-side.webp` to Supabase storage; updated all 5 product `…0002` `product_medias.media_url` → `?v=20261101studio02b`.
4. Vision re-QC on **LIVE CDN** download vs `side-hand-01` + `side-01`; grids under `_qc/.tmp-p02-deep/studio02b/qc-final-studio02b*.jpg` + `live/`.

### Live URLs

```
…/c1010001-…0002/fallback.webp?v=20261101studio02b
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261101studio02b
…/c1010001-…0002/c1500201-…0001/sf-side.webp?v=20261101studio02b
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261101studio02b
…/c1010001-…0002/c1500201-…0002/sf-side.webp?v=20261101studio02b   ← regenerated
```

### Live vision re-QC (harsh) — beige `sf-side` vs `side-hand-01`

| Check | Result |
|---|---|
| Studio / angle | **PASS** — Angle B toe-left, seamless white, soft contact shadow (not rembg) |
| X-strap width/mass vs `side-hand-01` | **PASS** — bands dominate midfoot; gauge matches physical max (clears prior “slightly under” MAJOR). Also matches `side-01` side-profile character |
| Heel pillow / strip | **PASS** — slim flush + vertical strip/tab; no Achilles pillow |
| Knit / sole | **PASS** — oatmeal rib knit; medium-brown low block heel |

### Remaining CRITICAL / MAJOR (return)

| Severity | Count | Items |
|---|---:|---|
| **CRITICAL** | **0** | — |
| **MAJOR** | **0** | beige `sf-side` strap-gauge MAJOR from `studio02` **CLEARED** |

Soft residuals only (MINOR): hand-held WhatsApp refs still show more organic slack/3D strap volume than taut packshot lighting; black heel-strip architecture remains a soft/MINOR readability note from `studio02` (unchanged this pass).

**Confirmed for parent:** Product 02 live `?v=20261101studio02b` keeps studio AI packshots; beige `sf-side` strap gauge now matches `side-hand-01` max → remaining CRITICAL/MAJOR **0/0**.
