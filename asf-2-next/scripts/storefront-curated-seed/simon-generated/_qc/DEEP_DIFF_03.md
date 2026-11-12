# DEEP_DIFF_03 — Knit ankle-strap (harsh ref-diff)

**Re-audited after p03qc cutout ship; supersedes nocushion-era findings.**

**SKU:** 03 · `03-knit-ankle-strap` · 针织踝带扣平底鞋 · `c1010001-24a8-4f00-8000-000000000003`  
**Audit only:** no regen, no upload (this pass).  
**When:** 2026-11-01 ~18:01–18:05 local (UTC+8)  
**Live token:** `?v=20261101p03qc` (confirmed in `product_medias`; object `Last-Modified` ~09:59 UTC)  
**Prior stale file:** audited `?v=20261101nocushion` AI gens that still invented an Achilles pillow. That era is **obsolete** for live Shop.

**Grading standard:** physical refs under `simon-product-refs/03-knit-ankle-strap/` + `manifest.json` promptLock (`heelCollar: NONE`, slim flush topline, vertical strip + strap loop only — **not** product-01 Mary Jane padded collar). Live packshots are **physical rembg cutouts** (beige) + **PIL blush shift** (blush), not free AI reinvented heels.

---

## Verdict (one line)

**Heel pillow is gone on live.** Construction (strap width, covered buckle, knit heel, slim strip/loop) now tracks the physical sample because the gallery *is* the sample cut out. Remaining buyer risk is **colorway authenticity** (blush has no unique physical photos) and **commerce presentation** (awkward opening hero, rembg halo, no live sole shot).

| Severity | Count |
|---|---:|
| **CRITICAL** | **3** |
| **MAJOR** | **6** |
| **MINOR** | **5** |

**Pillow on live:** **GONE** (heroes, sides, fallback, post-03, promo-05). Explicit: the user-screenshot horseshoe Achilles cushion is **not** what Shop serves on `p03qc`.

---

## Ref inventory (physical truth)

Root: `simon-product-refs/03-knit-ankle-strap/`  
Source claim: WhatsApp physical samples 2026-10-13 (`manifest.json`).

### Beige (`beige/`) — Read

| File | MD5 | What it establishes |
|---|---|---|
| `side-01.jpg` | `7289d668…` | Lateral 3/4-ish: **ribbed knit continuous around heel**; wide **smooth** ankle strap; **color-matched covered** square buckle + silver prong; white elastic gusset at buckle; low **dark brown** block heel; square-ish toe; tan lining peek |
| `side-02.jpg` | `61aa1b09…` | Cleaner side: same construction; strap ~**1.5–2 cm** tall with edge topstitch; back = **knit + center vertical smooth loop/tab** (strap threaded); topline is **not** a separate 01-style rolled smooth collar |
| `rear-01.jpg` | `3a8fa3ae…` | Rear: **center-back smooth vertical strip** w/ stitching → flat loop; knit quarters; strap wide; **no Mary Jane horizontal pillow collar** |
| `extra-rear-01.jpg` | `3a8fa3ae…` | **Byte-identical duplicate** of `rear-01.jpg` |
| `topdown-insole-01.jpg` | `dd0c8c7a…` | Top-down: square toe, vertical ribs, wide strap, tan insole **`LUMIXIU SHOES`** + crown crest |
| `front-insole-01.jpg` | `1847dace…` | Front/high opening into throat — **source of live Angle A** after rembg; flat interior heel wall; strip/loop only |
| `sole-01.jpg` | `701060c5…` | Outsole **dark chocolate brown**; floral/clover forefoot grid; mid size **37**; ridged heel block |
| `extra-sole-01.jpg` | `701060c5…` | **Byte-identical duplicate** of `sole-01.jpg` |

### Blush (`blush/`) — Read + hash

| File | MD5 | Note |
|---|---|---|
| `side-01.jpg` | `7289d668…` | **IDENTICAL to beige/side-01.jpg** |
| `side-02.jpg` | `61aa1b09…` | **IDENTICAL to beige/side-02.jpg** |
| `topdown-insole-01.jpg` | `dd0c8c7a…` | **IDENTICAL to beige/topdown-insole-01.jpg** |
| `topdown-insole-02.jpg` | `1847dace…` | **IDENTICAL to beige/front-insole-01.jpg** |

**No unique blush physical photos exist in-repo.** Blush folder is a copy of beige. Live blush packshots are a **PIL color shift** of beige rembg cutouts — not a second sample.

### Ref construction lock (checklist)

| Check | Physical truth |
|---|---|
| Silhouette | Square-toe flat; **ankle** strap (not instep Mary Jane) |
| Ankle strap width | **Wide** smooth band ≈ **1.5–2 cm**; edge topstitch; not dainty |
| Buckle | **Large square, color-matched / covered**; silver **prong only** |
| Heel back | **Slim flush topline** + **vertical smooth strip/loop**; knit exterior continuous — **NO** product-01 padded pillow collar |
| Counter material | **Knit** around heel; smooth only on **strap + center-back strip/loop** |
| Sole | **Dark brown** (both CWs per available refs) |
| Lining / insole | Tan / nude; brand **`LUMIXIU SHOES`** when visible |
| Elastic | White stretch insert near buckle — **present on sample** (loud, not optional) |
| mustNot | X-straps; MJ-only strap; blank insole; **padded Achilles pillow / thick rolled collar** |

---

## Live inventory (`product_medias`)

Queried 2026-11-01 via Supabase. Product `c1010001-24a8-4f00-8000-000000000003`. Gallery = **fallback + 2 angles** only.

| arr | color_id | CW | `media_url` token | CDN object `Last-Modified` | etag (webp) |
|---:|---|---|---|---|---|
| 1 | null | product fallback | **`?v=20261101p03qc`** | 2026-11-01 09:59:19 GMT | `8c6e4f08…` (= beige hero bytes) |
| 10 | `…0001` `#E8C4C4` | blush | **`?v=20261101p03qc`** | 09:59:00 | `cd23494a…` hero |
| 11 | `…0001` | blush | same | 09:59:01 | `c2beaf3c…` side |
| 10 | `…0002` `#D6C6A8` | beige | **`?v=20261101p03qc`** | 09:59:03 | `8c6e4f08…` hero |
| 11 | `…0002` | beige | same | 09:59:03 | `f69bc61f…` side |

Full URLs (live):

```
…/c1010001-…0003/fallback.webp?v=20261101p03qc
…/c1010001-…0003/c1500301-…0001/sf-hero-34.webp?v=20261101p03qc
…/c1010001-…0003/c1500301-…0001/sf-side.webp?v=20261101p03qc
…/c1010001-…0003/c1500301-…0002/sf-hero-34.webp?v=20261101p03qc
…/c1010001-…0003/c1500301-…0002/sf-side.webp?v=20261101p03qc
```

HTTP: all **200** `image/webp`. Host prefix:  
`https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000003/`

### Related live lifestyle (03-linked)

| Surface | Token | Notes |
|---|---|---|
| `post_medias` post-03 `…/post_medias/…/c2010001-…0003.webp` | `?v=20261101p03qc` | Heel flush / no pillow on-model |
| promo 通勤必备 `…/medias/…/c3010001-…0005.webp` | `?v=20261101p03qc` | Heel flush; distance softens strap/knit identity |

### Disk vs CDN (this audit)

| Asset | Disk MAD@512 vs CDN decoded | Verdict |
|---|---:|---|
| beige `sf-hero-34` | **0.22** | Live ≈ disk (webp encode) |
| beige `sf-side` | **0.30** | Live ≈ disk |
| blush `sf-hero-34` | **0.25** | Live ≈ disk |
| blush `sf-side` | **0.32** | Live ≈ disk |
| `sf-fallback` | **0.22** | Live ≈ disk; **byte-equal** to beige hero webp |

CDN beige↔blush hero MAD ≈ **1.25**; side MAD ≈ **1.75** — still near clones (PIL shift is timid vs catalog hex gap).

**Unlike the nocushion-era audit:** disk is **not** mid-regen ahead of CDN. Buyers and disk agree on `p03qc` pixels.

---

## What changed vs stale `nocushion` audit

| Topic | Stale `?v=20261101nocushion` finding | Live `?v=20261101p03qc` now |
|---|---|---|
| Heel pillow | **CRITICAL** — invented padded Achilles collar on hero + side | **CLEARED** — slim flush + strip/loop; matches rear/side refs |
| Smooth heel collar DNA (01 bleed) | **CRITICAL** | **CLEARED** on packshots (knit continuous; rembg of real sample) |
| Strap mass | Overcooked AI chunk | **Matches sample** (same photo) |
| Buckle | Covered on CDN; metal risk on in-flight disk | **Covered tonal + silver prong** on live (physical truth) |
| Disk ≠ CDN race | **CRITICAL** ops | **Resolved** for gallery rows |
| Blush authenticity | CRITICAL (clone refs + near-identical gens) | **Still CRITICAL** (clone refs + PIL tint) |
| Token honesty | `nocushion` lied (pillow remained) | `p03qc` matches cutout ship |

---

## Per-colorway shot diffs

### Beige (`#D6C6A8` · `c1500301-…0002`)

#### LIVE CDN — `sf-hero-34.webp?v=20261101p03qc` (= **fallback**)

Source: rembg of `beige/front-insole-01.jpg` → white studio.

| Check | Ref | Live | Diff |
|---|---|---|---|
| Heel pillow | None (slim + strip/loop) | Flat interior heel wall; **no** horseshoe pillow | **PASS** (fixes nocushion CRITICAL) |
| Counter | Knit + strip only | Knit + center loop; strip readable under strap | **PASS** |
| Strap width | ~1.5–2 cm wide | Same wide band (physical pixels) | **PASS** |
| Buckle | Covered tonal square + silver prong | Covered tonal; prong visible | **PASS** |
| Toe | Square | Square retained in opening view | **PASS** |
| Sole | Dark brown | Barely shown (opening angle) | **MAJOR** gallery gap — sole truth deferred |
| Lining / brand | Tan + LUMIXIU | Tan footbed; crest partially under strap | Soft pass / **MINOR** occlusion |
| Commerce framing | Classic ¾ hero expected by buyers | **Looking into shoe throat** as Angle A | **MAJOR** presentation risk |

#### LIVE CDN — `sf-side.webp?v=20261101p03qc`

Source: rembg of `beige/side-02.jpg`.

| Check | Ref | Live | Diff |
|---|---|---|---|
| Heel | Slim + loop | Slim flush; vertical strip/loop; **no pillow** | **PASS** |
| Strap | Wide smooth | Wide; edge topstitch retained | **PASS** |
| Buckle | Covered + white elastic gusset | Covered + **loud white elastic** (sample-true) | **PASS vs ref** (buyer may dislike elastic — not a media lie) |
| Knit continuity | Full heel knit | Knit continuous | **PASS** |
| Sole / heel block | Dark brown low block | Dark brown edge + low block | **PASS** (profile only) |
| Cutout | N/A (tiled floor ref) | Soft RGB fringe / floating on white | **MAJOR** rembg presentation |

### Blush (`#E8C4C4` · `c1500301-…0001`)

#### LIVE CDN — `sf-hero-34.webp` / `sf-side.webp` (`?v=20261101p03qc`)

Same geometry as beige (same rembg parents) + PIL blush shift.

| Check | Ref / catalog | Live | Diff |
|---|---|---|---|
| Heel pillow | None | **Gone** (same as beige) | **PASS** |
| Strap / buckle / knit / toe | Beige physical (only available) | Matches beige cutout structure | Structure **PASS**; color **FAIL** |
| Color vs `#E8C4C4` | Dusty rose / pale pink | Knit samples ~RGB (137,100,90) hero / (98,68,56) side — **taupe-mauve**, not light dusty rose | **CRITICAL** |
| vs beige | Distinct CW | MAD≈1.25–1.75 — buyers may not separate | **CRITICAL** |
| Physical blush proof | Manifest lists blush refs | Refs are **beige byte-clones** | **CRITICAL** inventory |

### Storage-only / not in live 2-angle gallery

| Asset | Status |
|---|---|
| `*/sf-topdown-insole.png` | Disk only (Oct 25) — not live |
| `beige/sf-pair-or-sole.png` | Disk rembg of sole — **matches** dark brown floral / 37 / ridged heel; **not** in Shop gallery |
| `*/md-editorial-*.png` | Disk/storage lifestyle (~17:58); not live 2-angle — do not treat as Shop |
| post-03 / promo-05 | Live on `p03qc`; heel pillow **absent**; promo distance softens wide-strap identity (**MAJOR** marketing risk if this is the commute hero) |

---

## CRITICAL / MAJOR / MINOR register

### CRITICAL (3)

1. **No unique blush physical ground truth** — `blush/*` refs are byte-clones of beige; catalog still sells `#E8C4C4` as a real second CW.
2. **Live blush is a PIL tint of the beige cutout**, not a photographed blush sample — colorway claim is synthetic.
3. **Beige vs blush packshots nearly interchangeable** (CDN MAD≈1.25 hero / 1.75 side; knit does not read as catalog dusty rose) — wrong-colorway order / trust risk.

### MAJOR (6)

1. **Live gallery omits sole underside** — physical `sole-01` / disk `sf-pair-or-sole` prove dark brown floral + 37; Shop 2-angle never shows it.
2. **Angle A is front-insole opening**, not a flattering ¾ commerce hero — first PDP frame is “into the throat”; good for heel proof, weak for desire / silhouette sales.
3. **rembg RGB halo / floating cutout** on white studio (baked fringe; no soft alpha) — cheap cutout look vs tiled-floor sample honesty.
4. **Fallback = beige hero only** — listing default never surfaces blush (compounds CW collapse).
5. **promo-05 lifestyle** at distance under-sells wide ankle strap / knit rib identity vs packshot truth (heel OK; fashion-weight soft).
6. **Stale disk topdowns / editorials** still sit beside live cutouts — reuse risk if someone ships storage assets without re-QC.

### MINOR (5)

1. Soft edge blur / aliasing on rembg silhouette.
2. Insole crest partially occluded by strap on opening heroes.
3. Duplicate ref files (`extra-rear` / `extra-sole`) waste inventory clarity.
4. White elastic gusset is visually loud — **matches sample**; note for buyers, not a construction lie.
5. Prior QC notes that marked 03 PASS under `nocushion` / early AI eras remain historically wrong — keep them from guiding future ships.

### Explicit non-issues on live `p03qc` packshots (do not re-charge)

- **Heel pillow / padded Achilles collar:** **GONE.** Do not re-cite the user-screenshot pillow as live.
- **Strap thickness:** matches physical wide ankle band (cutout).
- **Buckle covering:** color-matched covered square + silver prong (not bare metal frame).
- **Heel strip/loop + knit counter:** present; slim flush topline.
- **Materials:** ribbed knit upper + smooth strap — sample-true.
- **Sole color on side profile:** dark brown low block — sample-true.
- **Disk≠CDN race:** resolved for gallery rows.

---

## Buyer-risk

| Risk | Severity | Why it hurts |
|---|---|---|
| **Orders blush expecting `#E8C4C4` dusty rose** | **CRITICAL** | Photos are tinted beige sample; may not match real blush goods (if they exist) or the swatch |
| **Cannot tell blush from beige in PDP** | **CRITICAL** | Near-clone packshots → wrong CW cart |
| **Expects cushioned Achilles collar** | **Cleared on live** | Prior CRITICAL; pillow no longer sold on `p03qc` packshots / linked lifestyle |
| **Never sees outsole pattern / size mark** | **MAJOR** | Sole identity (floral / 37 / dark brown) is hidden unless storage sole ships |
| **First gallery frame is shoe-mouth opening** | **MAJOR** | Conversion / “is this the right shoe?” hesitation; construction-honest but commerce-harsh |
| **Cutout halo looks cheap vs sample photos** | **MAJOR** | Trust/quality perception, not silhouette fraud |
| **Strap looks heavy / elastic shows** | **MINOR→info** | Matches sample; returns if buyer wanted “dainty” — that would be sample vs taste, not media vs sample |

**Bottom line for buyers right now:** live Shop 03 **construction** (heel, strap, buckle, knit) is **trustworthy relative to the beige physical sample**. The **nocushion pillow lie is fixed**. Do **not** trust the **blush colorway** as independently photographed truth.

---

## Counts

| | |
|---|---:|
| **CRITICAL** | **3** |
| **MAJOR** | **6** |
| **MINOR** | **5** |

Live token locked: **`?v=20261101p03qc`**.  
**Pillow on live:** **GONE.**  
Disk gallery PNGs ≈ CDN (MAD≈0.2–0.3).  
Master `DEEP_REF_DIFF_AUDIT.md`: **not present** — this file only refreshed.  
No regen / no upload performed by this audit.

---

## Post-fix — `?v=20261101studio03` (2026-11-01 ~18:16 local)

**User reject:** rembg / physical cutouts. Regenerated as **professional studio ecommerce photos** (GenerateImage + physical refs as fidelity only). **Confirmed: no cutouts on live.**

### Shipped

| Asset | Source | Notes |
|---|---|---|
| beige `sf-hero-34` | Studio regen | Angle A toe **bottom-left** ¾; soft shadow on white seamless |
| beige `sf-side` | Studio regen | Angle B pointing **LEFT** |
| blush `sf-hero-34` | Studio regen | Same angles; dusty-rose `#E8C4C4` distinct from beige |
| blush `sf-side` | Studio regen | Same |
| `sf-fallback` | = beige Angle A | Primary listing |

CDN `Last-Modified` ~2026-11-01 10:16–10:16 UTC · HTTP 200 webp · DB `product_medias` cache-bust **`?v=20261101studio03`**.  
URL map: `../.tmp/simon_studio03_urls.json`  
Disk MAD beige↔blush hero ≈ **9.3** / side ≈ **9.7** (was ~1.25 on p03qc cutouts).

### Vision re-QC LIVE vs refs

| Check | Result |
|---|---|
| Cutout / rembg halo | **CLEARED** — studio soft contact shadow; seamless white; no fringe mask |
| Angle A toe bottom-left ¾ | **PASS** |
| Angle B side pointing left | **PASS** |
| Heel slim flush + pull-tab / strip only | **PASS** — no padded Achilles pillow |
| Strap width ~1.5–2 cm wide | **PASS** |
| Covered tonal square buckle + silver prong | **PASS** |
| Ribbed knit + smooth strap materials | **PASS** |
| Dark brown low block heel / sole edge | **PASS** |
| Blush ≠ beige packshots | **PASS** (distinct; MAD≈9+) |

### Remaining CRITICAL / MAJOR after studio03

#### CRITICAL — **1**

1. **No unique blush physical ground truth in-repo** — `blush/*` refs remain byte-clones of beige. Live blush is a studio interpretation toward `#E8C4C4`, not a second photographed sample. (Packshot near-clone CRITICAL is **cleared**.)

#### MAJOR — **2**

1. **2-angle gallery still omits sole underside** — physical `sole-01` (dark brown floral + 37) not in Shop PDP by gallery lock.
2. **Fallback = beige Angle A only** — listing default never surfaces blush (catalog primary rule; compounds if buyer expects blush on listing tile).

#### Cleared vs prior p03qc deep audit

- rembg RGB halo / floating cutout presentation  
- Angle A front-insole throat framing  
- Beige↔blush near-interchangeable packshots (MAD≈1.25)  
- Pillow / padded collar (still gone; studio keeps slim+tab)

#### Lifestyle

Not regenerated this pass (not CRITICAL). post-03 / promo-05 may still be prior tokens — heel pillow already cleared on those; not cutout-blocked for construction CRITICAL.

### Post-fix counts

| | Prior p03qc audit | After studio03 |
|---|---:|---:|
| **CRITICAL** | 3 | **1** |
| **MAJOR** | 6 | **2** |

**Confirm no cutouts:** live `?v=20261101studio03` packshots are studio regenerations with soft shadows — **not** rembg of WhatsApp refs.
