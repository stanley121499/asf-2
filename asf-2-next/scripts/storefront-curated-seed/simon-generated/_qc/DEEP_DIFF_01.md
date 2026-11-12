# Product 01 deep ref diff

**SKU:** `01-knit-maryjane-buckle` · 针织玛丽珍扣带平底鞋  
**Product id:** `c1010001-24a8-4f00-8000-000000000001`  
**Audit date:** 2026-11-01  
**Scope:** Initial section = AUDIT ONLY vs `?v=20261101p01qc`. **Post-fix** = full studio regen + upload live `?v=20261101studio01` (see bottom).  
**Live gallery rule:** Angle A `sf-hero-34` + Angle B `sf-side` + product `sf-fallback` only.

Honest bar: generated must not look like a different shoe. Strap width/thickness vs physical is critical. Prefer over-listing diffs.

---

## Ref inventory (paths)

Root: `asf-2-next/scripts/storefront-curated-seed/simon-product-refs/01-knit-maryjane-buckle/`

### Black (6)

| File | Role |
|---|---|
| `black/side-01.jpg` | Lateral profile — strap width, buckle, heel collar, sole |
| `black/rear-01.jpg` | Heel rear — **vertical webbing strip**, padded black collar, strap/buckle from behind |
| `black/sole-01.jpg` | Outsole — checkered forefoot, size 37 recess, ridged heel block |
| `black/topdown-insole-01.jpg` | Top-down — vamp V, strap width, MODEL MATCH |
| `black/topdown-insole-02.jpg` | Best insole/strap top-down |
| `black/topdown-insole-03.jpg` | Alternate top-down — shallow V-notch, thick strap |

### Beige (6)

| File | Role |
|---|---|
| `beige/side-01.jpg` | High-angle side — thick strap, padded tan collar, dark brown sole |
| `beige/side-02.jpg` | Cleaner lateral — strap weave vs body ribs, collar thickness |
| `beige/rear-top-01.jpg` | Heel rear — **vertical webbing strip**, padded tan collar, strap/buckle |
| `beige/topdown-insole-01.jpg` | Top-down — wide strap, shallow V, MODEL MATCH |
| `beige/front-insole-01.jpg` | Front/overhead — rib scale, buckle, V throat |
| `beige/sole-01.jpg` | Outsole — floral/clover forefoot, size 37, brown sole |

### Ref truth (locked from photos + `manifest.json` promptLock)

- Silhouette: women’s flat Mary Jane, **soft square / rounded-square toe**, single **instep** strap (not ankle, not X).
- Strap: **wide ~1.5–2+ cm**, denser woven / seed-stitch / cross-hatch than body rib; substantial thickness (not ribbon).
- Buckle: tonal matte plastic/covered, **rounded square** (angle can read rounder); silver prong; sized to strap.
- Heel collar: **present** padded pillow — black CW = **black** collar; beige CW = **tonal tan** collar.
- Heel back: **vertical webbing reinforcement / pull strip** centered on heel (visible on both `black/rear-01` and `beige/rear-top-01`). Not a dangling loop; flush strip.
- Upper: rib knit — vertical on toe box; ribs follow contour / go more horizontal around heel.
- Opening: **shallow center V-notch** at vamp throat + smooth piping.
- Insole: light tan + black **MODEL MATCH** crest / 1982.
- Sole/heel: very low flat block — black CW black sole; beige CW **dark brown / medium tan** sole; black checkered forefoot vs beige floral grips (sole not in live gallery).

---

## Live media inventory (URLs + ?v=)

Queried `product_medias` for product `c1010001-…0001`. Cache-bust: **`?v=20261101p01qc`**.

| Shot | Color | arr | media_id | URL |
|---|---|---:|---|---|
| **fallback** | (null / product-level) | 1 | `c1600100-…0001` | `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000001/fallback.webp?v=20261101p01qc` |
| Angle A hero | black `#111111` | 10 | `c1600111-…0001` | `…/c1500101-24a8-4f00-8000-000000000001/sf-hero-34.webp?v=20261101p01qc` |
| Angle B side | black | 11 | `c1600112-…0001` | `…/c1500101-24a8-4f00-8000-000000000001/sf-side.webp?v=20261101p01qc` |
| Angle A hero | beige `#D6C6A8` | 10 | `c1600121-…0001` | `…/c1500101-24a8-4f00-8000-000000000002/sf-hero-34.webp?v=20261101p01qc` |
| Angle B side | beige | 11 | `c1600122-…0001` | `…/c1500101-24a8-4f00-8000-000000000002/sf-side.webp?v=20261101p01qc` |

**CDN identity check:** `fallback.webp` MD5 **===** black `sf-hero-34.webp` (byte-identical). Local `sf-fallback.png` === `black/sf-hero-34.png` likewise.

**Local mirrors Read (same visual content as CDN encode sources):**

- `simon-generated/products/01-knit-maryjane-buckle/black/sf-hero-34.png`
- `…/black/sf-side.png`
- `…/beige/sf-hero-34.png`
- `…/beige/sf-side.png`
- `…/sf-fallback.png`

(Storage-only `sf-topdown-insole` / `sf-pair-or-sole` / `md-editorial-*` not in live gallery — noted only if they reinforce a ref truth that live A/B miss.)

---

## Colorway black — shot-by-shot diffs

### Angle A — `sf-hero-34` (live CDN + local)

Compared primarily to `black/side-01`, `black/topdown-insole-02/03`, `black/rear-01`.

- **Strap width/thickness — FAIL (CRITICAL):** Live strap reads **noticeably thinner / daintier** than physical. Ref strap is a wide heavy woven band (~¼ of opening span in top-down); live strap is a slimmer ribbon relative to vamp/opening. Same failure mode user flagged.
- **Strap texture — FAIL (MAJOR):** Ref strap = denser honeycomb / cross-hatch woven, distinct from body ribs. Live strap mostly continues **same rib-knit** as upper (or invents decorative perforations) — wrong material language.
- **Buckle size — FAIL (MAJOR):** Live buckle is smaller / less chunky than ref’s oversized matte square that nearly matches strap width. Silver prong OK.
- **Buckle shape/material — soft OK:** Matte black rounded-square + silver prong roughly correct family; scale is the problem.
- **Strap path / attachment — FAIL (MINOR→MAJOR):** Attachment sits a bit forward/low vs ref mid-arch seam; strap tail past buckle shorter / neater than physical (physical shows more strap end).
- **Toe shape — FAIL (MAJOR):** Ref = blunt soft-square / squircle. Live = more **almond / tapered** — reads like a different last.
- **Opening / vamp — FAIL (MAJOR):** Ref shallow center **V-notch**; live reads deeper **U / oval** throat, exposing more tan insole. Vamp length slightly long vs some refs but opening shape is the buyer-facing mismatch.
- **Heel collar — FAIL (MAJOR):** Black padded collar **is present** (correct color rule) but **under-stated** vs rear ref’s thick smooth black cushion + piping roll. Looks like a thin binding more than a comfort pillow.
- **Heel vertical webbing strip — FAIL (CRITICAL):** Ref `rear-01` clearly shows centered **grosgrain/webbing vertical strip**. Live Angle A: **absent**. Heel back is plain knit → different construction.
- **Pull-tab loop:** Ref strip is flush webbing (not a tall dangling tab). Live invents neither strip nor tab — still missing the strip.
- **Rib knit scale/direction — FAIL (MAJOR):** Ref: strong vertical ribs on toe, horizontal wrap at heel. Live: finer, more uniform ribs; heel direction change weak.
- **Piping — FAIL (MINOR):** Live piping thinner / less distinct than ref’s smooth black binding with slight sheen.
- **Sole/heel color — PASS-ish:** Matte black sole + low block correct family.
- **Heel height/shape — FAIL (MINOR→MAJOR):** Live block slightly **taller / sharper-edged** than physical’s very flat integrated lift.
- **Insole/lining — PASS (partial):** Tan footbed + black print fragment visible — correct color contrast. Full MODEL MATCH crest not readable at this angle (acceptable for 3/4).
- **Proportions — FAIL (MAJOR):** Overall silhouette sleeker/less chunky than physical sample; combined with thin strap + pointed toe → “different product” risk.
- **Invented parts:** No X-straps / ankle strap (good). Missing heel webbing (bad omission).

**Verdict: FAIL — not PASS.**

### Angle B — `sf-side` (live CDN + local)

Compared primarily to `black/side-01`, `black/rear-01`.

- **Strap width/thickness — FAIL (CRITICAL):** Side profile makes thinness worse. Ref strap fills a large fraction of sidewall height; live strap is a **narrow band** with oversized-looking empty space above/below.
- **Strap texture — FAIL (MAJOR):** Live strap = body rib knit; ref = distinct woven webbing.
- **Buckle — FAIL (MAJOR):** Square matte black OK in type, but **smaller** and sits lower on sidewall; strap tip stubby.
- **Heel collar — FAIL (MAJOR):** Smooth black pad present but thinner / less pillow than ref; less separation from knit body.
- **Heel webbing strip — FAIL (CRITICAL):** Not visible on rear/side of live — omitted.
- **Toe — FAIL (MAJOR):** More rounded-almond than blunt square of side ref.
- **Opening — FAIL (MAJOR):** Longer/more open throat vs ref; more insole exposed.
- **Rib direction — FAIL (MINOR→MAJOR):** Live side ribs mostly horizontal (OK-ish) but finer scale; toe transition less sculpted.
- **Sole/heel — FAIL (MINOR):** Black correct; heel block a touch taller/more architectural.
- **Insole — PASS (color):** Tan + logo scrap OK.
- **Silhouette — FAIL (MAJOR):** Clean studio shoe, but proportions (thin strap + open throat + sharper heel) diverge from chunky physical Mary Jane.

**Verdict: FAIL — not PASS.**

### Fallback — `fallback.webp` / `sf-fallback.png`

- **Byte-identical to black Angle A.** Every black Angle A diff **inherits**.
- **Extra product-level issue — FAIL (MAJOR):** Fallback is **black-only**. Beige is a first-class colorway; shared null-`color_id` fallback means any fallback/path that uses arrangement 1 shows the **wrong colorway** for beige buyers.

**Verdict: FAIL (same as black A + beige-fallback risk).**

---

## Colorway beige — shot-by-shot diffs

### Angle A — `sf-hero-34` (live CDN + local)

Compared to `beige/side-01`, `beige/side-02`, `beige/topdown-insole-01`, `beige/front-insole-01`, `beige/rear-top-01`.

- **Strap width/thickness — FAIL (CRITICAL):** Live strap thinner than physical top-down/side where strap is a **wide woven plank** across instep. Live looks delicate next to ref.
- **Strap texture — FAIL (MAJOR):** Ref strap = tighter flat weave / chevron distinct from body. Live uses body-like rib or honeycomb perforations + edge ribs — not matching physical strap fabric.
- **Buckle size/shape — FAIL (MAJOR):** Live buckle is **chunkier / taller square** relative to sidewall than physical (physical reads slimmer rounded-rect / soft square from side; rear can look rounder). Scale + chunkiness off — buyer may clock “wrong hardware.”
- **Buckle color/material — soft OK:** Tonal matte beige + prong family correct.
- **Strap path — FAIL (MINOR):** Slightly higher / more arched; keeper loop / tuck stylized vs physical.
- **Toe shape — FAIL (MAJOR):** Ref soft square / duckbill; live more **bulbous-round / almond**. Softens the product identity.
- **Opening / vamp — FAIL (MAJOR):** Live **deeper V / more scooped throat** than shallow physical V; more footbed shown.
- **Heel collar — FAIL (MAJOR):** Tan padded collar **present** (correct vs black-collar mistake) but **puffier / more cylindrical** than physical’s smoother rolled cushion. Over-cooked pillow vs under-cooked black — still wrong thickness.
- **Heel vertical webbing strip — FAIL (CRITICAL):** Clear on `beige/rear-top-01`; **missing** on live hero.
- **Rib knit — FAIL (MAJOR):** Live finer / more uniform; physical ribs more dimensional and direction-changing (vertical toe → horizontal heel).
- **Piping — FAIL (MINOR):** Live thin tonal bind; physical edge slightly heavier / more finished.
- **Sole/heel color — PASS:** Dark brown / medium tan contrast vs oatmeal upper — correct family vs cream-satin mistakes on other SKUs.
- **Heel profile — FAIL (MINOR→MAJOR):** Live block slightly taller / squarer than soft flat physical.
- **Insole — PASS (color):** Tan footbed + partial black crest OK; full MODEL MATCH not required at 3/4.
- **Proportions — FAIL (MAJOR):** Plumper body + thinner strap + deeper opening = “same category, different shoe.”
- **No invented ankle/X:** Good.

**Verdict: FAIL — not PASS.**

### Angle B — `sf-side` (live CDN + local)

Compared to `beige/side-01`, `beige/side-02`, `beige/rear-top-01`.

- **Strap width/thickness — FAIL (CRITICAL):** Side view again shows strap **too thin** vs physical side refs where strap is a thick woven band with visible depth.
- **Strap texture — FAIL (MAJOR):** Live braided/chevron inventiveness still ≠ physical strap; better than black’s pure rib copy but not ref-true.
- **Buckle — FAIL (MAJOR):** Overscaled square vs physical side buckle; dominates sidewall height more than ref.
- **Heel collar — FAIL (MAJOR):** Present + tan (good) but thickness/roll exaggerated vs side-02.
- **Heel webbing strip — FAIL (CRITICAL):** Absent.
- **Toe — FAIL (MAJOR):** Blunter than black live but still not matching physical soft-square last.
- **Opening — FAIL (MINOR→MAJOR):** Soft V present (better than black’s U) but deeper/more open than ref.
- **Rib scale — FAIL (MINOR→MAJOR):** Finer corduroy-like ribs vs heavier physical gauge.
- **Sole/heel — PASS (color) / FAIL (MINOR shape):** Brown sole correct; heel a bit more architectural.
- **Insole — PASS (color).**
- **Silhouette — FAIL (MAJOR):** Studio tidy, but strap/buckle/collar/toe stack still drifts from sample.

**Verdict: FAIL — not PASS.**

### Fallback (beige context)

- Same file as black Angle A → **shows black shoe**, not beige.
- For beige PDP/cart fallback paths: **CRITICAL/MAJOR buyer mismatch** (wrong colorway entirely).

---

## Severity summary: CRITICAL / MAJOR / MINOR table

| ID | Severity | Finding | Where |
|---|---|---|---|
| C1 | **CRITICAL** | **Strap too thin** vs physical wide woven strap | black A, black B, beige A, beige B, fallback |
| C2 | **CRITICAL** | **Missing centered vertical heel webbing/reinforcement strip** (present on both colorway rear refs) | all live A/B + fallback |
| C3 | **CRITICAL** | **Product fallback is black Angle A only** — beige buyers can see wrong colorway | `fallback.webp` / arr 1 |
| M1 | **MAJOR** | Strap **texture wrong** (body rib / invented honeycomb vs denser woven seed-stitch) | black A/B; beige A/B (beige slightly better but still off) |
| M2 | **MAJOR** | **Buckle scale wrong** — black too small; beige too chunky vs side refs | black A/B; beige A/B |
| M3 | **MAJOR** | **Toe last wrong** — almond/bulbous vs soft-square / duckbill | black A/B; beige A/B |
| M4 | **MAJOR** | **Throat opening wrong** — deep U/scoop vs shallow center V-notch | black A/B (worse); beige A/B |
| M5 | **MAJOR** | **Heel collar thickness wrong** — black under-padded; beige over-puffy (color correct) | black A/B; beige A/B |
| M6 | **MAJOR** | **Rib knit scale/direction** too fine / too uniform vs physical directional ribs | all live packshots |
| M7 | **MAJOR** | Overall **proportion/chunkiness** — live sleeker/tidier; physical reads heavier Mary Jane | all live packshots |
| m1 | **MINOR** | Heel block slightly taller / sharper-edged | A/B both CWs |
| m2 | **MINOR** | Piping thinner / less finished | A/B both CWs |
| m3 | **MINOR** | Strap tip length / keeper styling | A/B both CWs |
| m4 | **MINOR** | MODEL MATCH crest only partially visible (angle-limited; color OK) | A/B both CWs |
| m5 | **MINOR** | Studio white packshot vs phone-on-tile ref lighting (expected; not identity) | all |

**Counts for return:** **CRITICAL = 3** · **MAJOR = 7** · MINOR = 5  

*(Prior `PER_PRODUCT_01.md` “PASS” on these same CDN assets was too soft — structural strap thickness + missing heel webbing alone should have blocked pass under this bar.)*

---

## Buyer-risk note

A buyer comparing the PDP to a physical sample (or to WhatsApp ref photos) would reasonably conclude this is a **related but different Mary Jane**: thinner strap, wrong strap fabric, wrong buckle scale, softer/wrong toe last, wrong throat shape, and a heel back missing the vertical webbing strip that is obvious on both colorways in hand. Heel collar **color** rules (black collar on black; tan on beige) are largely respected — that is not enough. The shared **black fallback** adds a colorway-identity landmine for beige.

**Do not ship another “PASS” until strap width matches physical (~1.5–2+ cm woven band), heel webbing strip is restored, and beige has a beige-safe fallback path.**

---

## Method notes

- All 12 physical refs Read (vision).
- All 5 live `product_medias` URLs downloaded (`?v=20261101p01qc`), converted PNG, Read; local `sf-hero-34` / `sf-side` / `sf-fallback` Read.
- Side-by-side grids + strap/heel crops under `storefront-curated-seed/.tmp/deep_diff_01/` (audit scratch only).

---

## Post-fix re-QC — studio regen (`?v=20261101studio01`)

**Date:** 2026-11-01  
**Method:** Fully regenerated AI ecommerce studio packshots (physical refs as `reference_image_paths` only). **No rembg / cutout / phone-ref paste.** Abandoned earlier cutout/whitened-physical approach per user feedback.  
**Orientation locks:** Angle A = 3/4 toe **bottom-left**; Angle B = side profile pointing **left**.  
**Fallback:** = **beige** Angle A (primary CW per `STOREFRONT_TWO_ANGLE.md`), fixing prior black-only fallback.

### Live media (`product_medias`)

| Shot | Color | URL token |
|---|---|---|
| fallback | (null) | `…/fallback.webp?v=20261101studio01` (= beige hero) |
| Angle A | black | `…/c1500101-…0001/sf-hero-34.webp?v=20261101studio01` |
| Angle B | black | `…/c1500101-…0001/sf-side.webp?v=20261101studio01` |
| Angle A | beige | `…/c1500101-…0002/sf-hero-34.webp?v=20261101studio01` |
| Angle B | beige | `…/c1500101-…0002/sf-side.webp?v=20261101studio01` |

Live CDN downloaded + vision-Read after upload.

### What was fixed

| Prior ID | Fix |
|---|---|
| **C1** strap too thin | Regenerated wide/thick woven MJ straps on all A/B; vision vs side/top refs: substantial strap mass restored |
| **C2** missing heel webbing | Vertical heel webbing strip restored on heroes (visible 3/4 rear) + side rear edge |
| **C3** black-only fallback | Fallback now **beige** Angle A (studio regen) |
| **M1** strap texture | Distinct woven/honeycomb or dense knit strap vs body ribs |
| **M2** buckle scale | Chunky tonal rounded-square buckles sized to wider strap + silver prong |
| **M3–M7** toe / throat / collar / ribs / proportions | Soft-square toe, shallow V, black collar on black / tan on beige, heavier rib gauge, chunkier Mary Jane mass |
| Studio look | Pure white seamless + soft contact shadow + commercial lighting (not cutout) |

### Post-fix severity (live CDN)

| Severity | Remaining count | Notes |
|---|---:|---|
| **CRITICAL** | **0** | Strap width + heel strip + beige-safe fallback resolved |
| **MAJOR** | **0** | No buyer-facing “different product” geometry left at deep-diff bar |
| MINOR | ~2–3 | MODEL MATCH crest sometimes reads partially / slightly stylized at 3/4; heel webbing stronger on hero than pure side (angle-limited); minor knit-scale polish vs phone refs |

### Verdict

**PASS** for deep-diff ship bar on live `?v=20261101studio01` (both CWs × A/B + fallback). Studio photography language confirmed; no cutouts used in shipped assets.
