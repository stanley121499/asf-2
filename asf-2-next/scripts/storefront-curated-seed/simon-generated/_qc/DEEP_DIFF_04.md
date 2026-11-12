# Product 04 deep ref diff

**Product:** Satin ankle-strap flat (`04-satin-ankle-strap`)  
**Product ID:** `c1010001-24a8-4f00-8000-000000000004`  
**Audit date:** 2026-11-01  
**Mode:** STUDIO FIX PASS `studio04b` — BA live hero+side satin sheen regen (no rembg) + C8 editorial; cream live still `?v=20261101studio04`  
**Live gallery surface:** 2-angle (`arr` 10 hero + 11 side) + product fallback  
**Cache-bust on live rows:** cream + fallback `?v=20261101studio04`; black-almond hero+side `?v=20261101studio04b`  
**Ground truth:** cream **physical** WhatsApp refs. black-almond has **no physical sample** — structure judged against cream physical; color/interior against black-almond secondary AI refs + manifest.

---

## Ref inventory (paths)

### Cream — physical (primary truth)

| Path | What it proves |
|---|---|
| `simon-product-refs/04-satin-ankle-strap/cream/side-01.jpg` | Soft-**square** toe; **wide** ankle strap (~1.5–2.5 cm); cream satin-**covered** chunky rectangular buckle + silver prong; visible elastic gusset at buckle side; cream/off-white low block heel + cream sole edge; tan lining; slim flush heel topline (no pillow) |
| `simon-product-refs/04-satin-ankle-strap/cream/side-rear-01.jpg` | Same strap width; covered buckle; strap through center-back heel loop; vertical heel strip; cream heel/sole; tan lining under strap |
| `simon-product-refs/04-satin-ankle-strap/cream/rear-01.jpg` | Rear geometry: slim collar into tan lining; vertical satin strip + strap loop; **no** Achilles pillow; white/cream sole edge |
| `simon-product-refs/04-satin-ankle-strap/cream/topdown-insole-01.jpg` | Blunt square toe from above; wide strap; covered buckle; cream textured footbed; MODEL MATCH crest + year banner; almond/tan side walls |
| `simon-product-refs/04-satin-ankle-strap/cream/front-insole-01.jpg` | Square toe front-on; wide strap; covered buckle; light footbed + branding |
| `simon-product-refs/04-satin-ankle-strap/cream/sole-01.jpg` | **Cream/off-white** outsole (not dark brown); floral/clover forefoot grid; size **37** mid; horizontal-ridged heel block; square sole outline |

### Black-almond — AI secondary refs (colorway only; not physical)

| Path | Notes |
|---|---|
| `…/black-almond/side-01.jpg` | Black exterior; wide ankle strap; cream/almond interior; low black heel; soft-square toe intended |
| `…/black-almond/topdown-insole-01.jpg` | Square toe; cream footbed + MODEL MATCH; almond lining |
| `…/black-almond/front-insole-01.jpg` | Square toe; cream footbed — **buckle sometimes reads brighter/silver vs covered black** (secondary-ref pollution risk) |
| `…/black-almond/rear-01.jpg` | Slim heel back; black covered strap/loop; almond lining |
| `…/black-almond/sole-01.jpg` | Dark/black outsole; floral grid; 37; ridged heel |

**Manifest lock (must hold):** smooth satin (not knit); wide ankle strap + large tonal **covered** buckle + silver prong; soft V throat; slim flush heel (**no** padded collar); cream colorway → cream sole/heel; black-almond → black exterior + almond lining + cream footbed (never black insole / wrinkled almond pad).

---

## Live media inventory (URLs + `?v=`)

Queried `product_medias` via Supabase MCP (`product_id = c1010001-24a8-4f00-8000-000000000004`). HTTP 200; CDN ≈ local disk (webp encode; mean abs RGB Δ ≈ 0.5–0.8 at 512²).

| Role | color_id | arr | Live URL |
|---|---|---|---|
| Product fallback | `null` | 1 | `…/000000000004/fallback.webp?v=20261101p04qc` |
| Cream hero | `…0001` (`#F5F0E8`) | 10 | `…/0001/sf-hero-34.webp?v=20261101p04qc` |
| Cream side | `…0001` | 11 | `…/0001/sf-side.webp?v=20261101p04qc` |
| Black-almond hero | `…0002` (`#111111`) | 10 | `…/0002/sf-hero-34.webp?v=20261101p04qc` |
| Black-almond side | `…0002` | 11 | `…/0002/sf-side.webp?v=20261101p04qc` |

Full host prefix: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000004/`

**Fallback == cream hero** (byte-identical local PNG; identical CDN webp length 47760).

### Local / storage-only (not in live 2-angle gallery)

| Path | Status |
|---|---|
| `simon-generated/…/cream/sf-topdown-insole.png` | Disk only |
| `simon-generated/…/cream/sf-pair-or-sole.png` | Disk only |
| `simon-generated/…/cream/md-editorial-a.png` | Disk / storage only |
| `simon-generated/…/cream/md-editorial-b.png` | Disk / storage only |
| `simon-generated/…/black-almond/sf-topdown-insole.png` | Disk only |
| `simon-generated/…/black-almond/sf-pair-or-sole.png` | Disk only (sole underside) |
| `simon-generated/…/black-almond/md-editorial-a.png` | Disk / storage only |
| `simon-generated/…/black-almond/md-editorial-b.png` | Disk / storage only |

---

## Colorway cream — shot-by-shot diffs

Compare live CDN + matching local packshots to cream physical refs. **Do not call PASS unless no material diffs.**

### Live `sf-hero-34` (+ fallback — same pixels)

| Check | Physical cream | Live / local | Diff |
|---|---|---|---|
| Silhouette / toe | Soft-square, blunt front | Soft-square retained in ¾ (better than side) | Soft corners slightly more rounded than ref — **MINOR→borderline MAJOR** |
| Strap width | Wide ~1.5–2.5 cm flat band | Wide; roughly ref-matched | **Mostly OK** — not the thin-strap failure seen on other Simon SKUs |
| Strap body | Flat satin strap | Reads slightly **puffier / more padded** | **MINOR** |
| Buckle | Large cream **satin-covered** rectangle + silver prong | Covered cream buckle + silver prong | **OK** (holes more “studio-perfect” than dirty physical) |
| Heel collar | Slim flush; no pillow | Slim flush; no pillow | **OK** (prior pillow fail fixed on this `p04qc` asset) |
| Heel / sole color | Cream / off-white throughout | Cream block heel; sole edge drifts **warmer beige/tan** vs stark cream sole-01 | **MAJOR** residual sole-edge warmth |
| Satin | Soft real-world sheen, slight ripples | Cleaner studio sheen | **MINOR** |
| Interior | Tan lining + cream textured footbed + MODEL MATCH | Visible; branding readable (MODEL MATCH / 1982) | **OK** |
| Vamp | Soft V | Soft V / deep throat | **OK** / slightly deeper opening — **MINOR** |

**Verdict:** Not a clean PASS. Sole-edge warmth + slight toe softening remain. Heel pillow / dark-brown sole disasters from earlier passes are gone.

### Live `sf-side`

| Check | Physical (`side-01` / `side-rear-01`) | Live | Diff |
|---|---|---|---|
| Toe | Soft-**square** | Reads **rounded / oval** in side profile | **CRITICAL** — silhouette no longer matches square-toe SKU |
| Strap width | Wide | Wide; elastic gusset visible (ref also has gusset) | Width **OK** |
| Buckle | Cream covered + silver prong | Cream covered + silver prong | **OK** |
| Heel pillow | None | None / slim | **OK** |
| Sole / heel | Cream / off-white | Cream / off-white match | **OK** (better than hero edge) |
| Satin | Soft sheen | Low-sheen satin OK | **MINOR** polish |
| Lining | Tan peek | Tan peek | **OK** |

**Verdict:** **FAIL** on toe. A buyer shopping “square toe” from cream refs gets a round-toe side hero.

### Local `sf-topdown-insole` (not live gallery)

- Square toe: **OK** vs topdown/front refs.  
- Strap: wide — **OK**.  
- Buckle: cream covered + silver prong — **OK**.  
- Footbed: cream/beige textured + MODEL MATCH 1982 — **OK**.  
- Exterior cream warmer/ivory vs cooler physical white — **MINOR**.  
- Sole tip sliver slightly tan — **MINOR**.

### Local `sf-pair-or-sole` (pair ¾, not live)

- Square toe on both shoes: **OK**.  
- Wide straps + covered buckles: **OK**.  
- Outsole edge reads **tan/light-brown** vs cream physical sole — **MAJOR**.  
- Satin sheen stronger / more “bridal gloss” than physical — **MINOR**.

### Local `md-editorial-a` (storage only)

- Strap present and fairly wide — width not the main problem.  
- Finish reads **matte leather/synthetic**, weak satin — **MAJOR**.  
- Buckle leans **silver / metal-looking** vs fabric-covered cream — **CRITICAL** for lifestyle fidelity.  
- Heel taller / chunkier than near-flat physical — **MAJOR**.  
- Soft-square toe partially surviving — soft fail.

### Local `md-editorial-b` (storage only)

- Toe clearly **round**, not square — **CRITICAL**.  
- Heel / sole edge read **medium-brown / wood-stack** vs cream physical sole+heel — **CRITICAL** (reintroduces the exact sole-color lie the gallery just fixed).  
- Strap thick + tonal buckle somewhat OK — does not rescue sole/toe.  
- Satin weak / matte — **MAJOR**.

---

## Colorway black-almond — shot-by-shot diffs

Structure vs **cream physical**; color/interior vs black-almond secondary refs + manifest. No physical black sample exists — treat secondary refs as contaminated if they disagree with cream structure (esp. buckle covering).

### Live `sf-hero-34`

| Check | Expected | Live | Diff |
|---|---|---|---|
| Toe | Soft-square (cream + BA topdown/side refs) | **Round / almond** | **CRITICAL** |
| Strap width | Wide ankle band | Wide; elastic gusset visible | Width **OK** |
| Buckle | Matte **black fabric-covered** chunky rectangle + silver prong | Reads **gunmetal / dark metal frame** more than covered satin | **CRITICAL** hardware lie |
| Upper | Black satin soft sheen | Very matte — microfiber/leather read | **MAJOR** |
| Heel collar | Slim, no pillow | Slim | **OK** |
| Heel / sole | Dark / black | Black | **OK** |
| Interior | Almond lining + cream footbed (not black, not wrinkled almond pad) | Cream/almond visible | **OK** |
| Branding in ¾ | Optional | Not readable | **N/A** |

**Verdict:** **FAIL**. Round toe + metal-looking buckle = different product family from cream physical truth.

### Live `sf-side`

| Check | Expected | Live | Diff |
|---|---|---|---|
| Toe | Soft-square | **Round / almond** | **CRITICAL** |
| Strap | Wide | Wide | **OK** |
| Buckle | Black covered | Matte black chunky — better than hero metal, still hard-edged plastic/metal | **MAJOR** (not clearly fabric-wrapped like cream physical) |
| Heel block | Solid dark/black | **Gunmetal / metallic wood-grain** sheen on heel face | **MAJOR** |
| Lining | Almond | Almond/cream peek | **OK** |
| Satin | Soft black satin | Flat matte | **MAJOR** |
| Heel pillow | None | None | **OK** |

**Verdict:** **FAIL** on toe + heel finish + material read.

### Local `sf-topdown-insole` (not live)

- Square toe: **OK**.  
- Cream footbed + MODEL MATCH 1982 + almond lining: **OK** (avoids wrinkled-almond / black-insole fails).  
- Buckle reads **silver metal** rectangle — **CRITICAL** vs covered-black requirement (matches polluted BA `front-insole` secondary ref more than cream physical).  
- Strap width: acceptable.

### Local `sf-pair-or-sole` (sole underside)

- Square sole outline + floral grid + 37 + ridged heel: **OK** vs BA `sole-01` / cream sole pattern.  
- Color dark brown/espresso (manifest allows dark on BA): **OK** for black-almond (cream must stay cream — different rule).  
- Speck/dust on midsole: **MINOR** cleanliness.  
- Strap/buckle scrap at edge dark — **OK**.

### Local `md-editorial-a` (storage only)

- Square toe on worn pair: better than live packshots — **OK-ish**.  
- Buckles read **silver metal** — **CRITICAL**.  
- Cream insole + branding glimpse — interior colorway **OK**.  
- Left/right strap continuity awkward in POV (one strap reads detached/incomplete) — **MAJOR** artifact risk.  
- Satin acceptable low sheen.

### Local `md-editorial-b` (storage only)

- Square toe readable on feet — better than packshots.  
- Wide black strap + chunky black buckle — closer to intent.  
- Heel low block — **OK**.  
- Distance/lifestyle still soft on covered-vs-metal buckle — **MINOR/MAJOR**.  
- Not live gallery — still a buyer-risk if reused in marketing.

---

## Severity summary: CRITICAL / MAJOR / MINOR

### CRITICAL (buyer “wrong shoe” risk)

| # | Asset | Issue |
|---|---|---|
| C1 | Live cream `sf-side` | Toe reads **round** vs physical soft-**square** |
| C2 | Live black-almond `sf-hero-34` | Toe **round/almond** vs square |
| C3 | Live black-almond `sf-side` | Toe **round/almond** vs square |
| C4 | Live black-almond `sf-hero-34` | Buckle reads **gunmetal/metal** vs **fabric-covered** tonal buckle (cream physical truth) |
| C5 | Local cream `md-editorial-b` | **Brown/wood heel + dark sole edge** vs cream sole/heel physical |
| C6 | Local cream `md-editorial-a` | Buckle leans **bare metal/silver**; weak satin |
| C7 | Local black-almond `sf-topdown-insole` | **Silver metal buckle** vs covered black |
| C8 | Local black-almond `md-editorial-a` | **Silver metal buckles** (and strap continuity artifact) |

**CRITICAL count: 8**

### MAJOR

| # | Asset | Issue |
|---|---|---|
| M1 | Live cream hero / fallback | Sole edge **warmer beige/tan** vs stark cream `sole-01` |
| M2 | Live black hero + side | Upper reads **matte leather/microfiber**, not satin |
| M3 | Live black `sf-side` | Heel face **metallic/gunmetal** vs solid black |
| M4 | Live black `sf-side` | Buckle not clearly satin-wrapped |
| M5 | Local cream `sf-pair-or-sole` | Tan/light-brown sole edge vs cream sole |
| M6 | Local cream `md-editorial-a` | Heel taller/chunkier than near-flat ref; matte finish |
| M7 | Local cream `md-editorial-b` | Matte/weak satin |
| M8 | Black secondary refs → gens | BA `front-insole` silver buckle **pollutes** covered-buckle truth |

**MAJOR count: 8**

### MINOR

| # | Asset | Issue |
|---|---|---|
| m1 | Cream hero | Slightly puffier strap body; deeper vamp; studio sheen |
| m2 | Cream side / hero | Soft-corner rounding short of full round fail on hero only |
| m3 | Cream topdown | Ivory warmth vs cooler physical white |
| m4 | BA sole shot | Midsole dust/speck |
| m5 | Several | Elastic gusset / hole punch “CGI clean” vs dirty physical |
| m6 | Branding | Micro year/crest rendering variance when visible |

**MINOR count: 6**

### Explicit non-issues (called out so they are not waved as PASS overall)

- **Strap width on live packshots:** largely **matches** physical chunky ankle strap — product 04 is **not** primarily a “too-thin strap” SKU (unlike 01/02 pattern). Width is not the crisis; **toe + buckle covering + cream sole color history** are.  
- **Heel pillow on live cream gallery:** currently **absent** (slim) — prior FAIL fixed on `p04qc`. Do not re-credit as residual pillow.  
- **Cream dark-brown sole on live gallery:** fixed to cream/off-white — residual is **warm edge**, not full dark wood sole (except lifestyle `md-editorial-b`).

---

## Buyer-risk note

Harsh read: **live Shop gallery for product 04 is not buyer-safe end-to-end.**

1. **Square toe is the catalog promise.** Cream physical and BA topdown/sole refs are blunt soft-square. Live **cream side** and **both black-almond packshots** sell a **round toe**. That alone is a returns driver (“not the shoe in the photo”).  
2. **Buckle covering is hardware identity.** Physical cream uses a large **fabric-covered** buckle. Live black hero (and multiple storage assets) sell **metal/gunmetal**. Buyers notice hardware immediately.  
3. **Cream sole was already a known lie** (dark brown) and was mostly fixed on live 2-angle — but **hero sole edge still warms toward tan**, and **cream lifestyle B reverts to brown/wood heel**. Any reuse of lifestyle in ads reopens the sole lawsuit.  
4. **black-almond has no physical sample.** Secondary AI refs already drift (silver buckle on front-insole). Generations that copy those refs will keep failing covered-buckle truth unless cream physical buckle refs are forced every time.  
5. **Satin vs matte:** black live packshots under-sell satin; cream lifestyle under-sells sheen. Material mismatch is quieter than toe/buckle but still “different product” under hand inspection.  
6. **Fallback duplicates cream hero** — so every cream-hero defect (sole-edge warmth, soft toe corners) is also the listing fallback.

**Recommended fix order (documentation only — not executed):**  
1) Black live hero + side: force soft-square toe + black **covered** buckle + non-metallic heel.  
2) Cream live side: restore soft-square toe (keep cream sole + slim heel).  
3) Cream hero/fallback: neutralize sole-edge to cream/off-white matching `sole-01`.  
4) Kill or rebuild cream `md-editorial-b` (brown heel) and metal-buckle lifestyle/topdown assets before any marketing reuse.  
5) Stop trusting BA secondary buckle appearance; always attach cream physical buckle refs.

---

## Post-fix (`?v=20261101deep04`) — 2026-11-01

### Actions

1. Regenerated live cream `sf-hero-34` (soft-square toe + cream/off-white sole edge + covered buckle) and cream `sf-side` (soft-square side silhouette; cream sole/heel; covered buckle). Copied cream hero → `sf-fallback`.
2. Regenerated live black-almond `sf-hero-34` + `sf-side` with cream physical structure lock (soft-square toe + fabric-covered buckle + solid black heel; no gunmetal frame / metallic heel face).
3. Uploaded 5 webp objects; updated `product_medias.media_url` → `?v=20261101deep04`.
4. Vision re-QC against cream physical refs + CDN fetch (HTTP 200; `last-modified` ~2026-11-01 10:08 GMT; fallback byte-identical to cream hero webp).

URL map: `../.tmp/simon_p04_deep04_urls.json`

### Live gallery re-QC

| Shot | Colorway | Prior | Post-fix | Result |
|---|---|---|---|---|
| `sf-hero-34` / fallback | cream | M1 sole-edge warmth; soft toe corners | Soft-square toe; cream fabric-covered buckle; cream/off-white sole+heel; slim flush heel | **PASS** (live) |
| `sf-side` | cream | **C1** round toe | Soft-square blunt side tip; covered buckle; cream sole/heel; slim heel | **PASS** (live) |
| `sf-hero-34` | black-almond | **C2** round toe; **C4** metal buckle; M2 matte | Soft-square toe; black fabric-covered buckle + silver prong; solid black heel | **PASS** structure/hardware; residual matte read → **MAJOR** M2 |
| `sf-side` | black-almond | **C3** round toe; M3 metallic heel; M4 buckle | Soft-square tip; fabric-covered buckle; solid black heel (not gunmetal) | **PASS** structure/hardware; residual matte read → **MAJOR** M2 |

### Cleared vs residual

| ID | Was | Status |
|---|---|---|
| C1–C4 | Live cream side + BA hero/side toe + BA hero metal buckle | **CLEARED** on live `deep04` |
| M1 | Cream hero/fallback sole-edge warmth | **CLEARED** |
| M3 / M4 | BA side metallic heel / unclear buckle wrap | **CLEARED** |
| M2 | BA hero+side matte vs satin | **REMAINS** (live) — black still reads flat leather/microfiber more than soft satin |
| C5–C8 | Local cream `md-editorial-*`, BA topdown, BA `md-editorial-a` | **UNCHANGED** (not live gallery; not regenerated this pass) |
| M5–M8 | Local pair / lifestyle / BA-ref pollution | **UNCHANGED** (storage-only) |

### Remaining CRITICAL / MAJOR (return)

**Live gallery CRITICAL: 0**

**Live gallery MAJOR: 1**
- **M2** — black-almond live `sf-hero-34` + `sf-side`: upper/strap still read **matte leather/microfiber**, not soft black satin (buyer quieter than toe/buckle but material lie under hand inspection).

**Storage / non-live CRITICAL (still open if reused in marketing): 4**
- **C5** cream `md-editorial-b` — brown/wood heel + dark sole edge  
- **C6** cream `md-editorial-a` — metal-leaning buckle; weak satin  
- **C7** black-almond `sf-topdown-insole` — silver metal buckle  
- **C8** black-almond `md-editorial-a` — silver metal buckles (+ strap continuity artifact)

**Storage / non-live MAJOR (still open): 4**
- **M5** cream `sf-pair-or-sole` tan sole edge  
- **M6** cream `md-editorial-a` taller heel / matte  
- **M7** cream `md-editorial-b` weak satin  
- **M8** BA secondary-ref buckle pollution risk for future gens  

**Live Shop 2-angle buyer bar:** toe + covered buckle + cream sole/heel identity **match physical cream**. Remaining live risk is BA satin sheen only.

---

## Post-fix (`?v=20261101studio04`) — 2026-11-01

**Method lock:** full studio AI regen only (white seamless cyclorama + soft contact shadow). **No rembg / cutout / cream→black recolor.** Confirmed installed packshots are RGB with near-white corner pixels (studio floor), not alpha-masked crops.

### Actions

1. Regenerated cream live `sf-hero-34` + `sf-side` as white-seamless studio packshots (Angle A toe bottom-left; Angle B left profile; soft-square; cream fabric-covered buckle; cream sole/heel; satin sheen). Copied cream hero → `sf-fallback`.
2. Regenerated black-almond live `sf-hero-34` + `sf-side` as white-seamless studio packshots (same angles; soft-square; black fabric-covered buckle + silver prong; solid black heel; cream/almond interior; soft satin sheen intent).
3. Regenerated storage: cream `sf-pair-or-sole`, cream `md-editorial-a/b`, BA `sf-topdown-insole`, BA `md-editorial-a` (lifestyle editorials are full-scene AI, not cutouts).
4. Uploaded 10 webp objects; updated all 5 live `product_medias.media_url` → `?v=20261101studio04`.
5. CDN verify HTTP 200; `last-modified` 2026-11-01 10:18 GMT; corner pixels studio-white on all live rows; fallback byte-identical length to cream hero webp (33002).

URL map: `../.tmp/simon_p04_studio04_urls.json`

### Live gallery re-QC (CDN `?v=20261101studio04`)

| Shot | Colorway | Studio (not crop) | Soft-square | Fabric-covered buckle | Sole/heel | Satin | Result |
|---|---|---|---|---|---|---|---|
| `sf-hero-34` / fallback | cream | **YES** white seamless + contact shadow | **YES** | **YES** cream covered | cream/off-white | soft bridal sheen | **PASS** |
| `sf-side` | cream | **YES** | **YES** | **YES** | cream/off-white | soft sheen | **PASS** |
| `sf-hero-34` | black-almond | **YES** | **YES** | **YES** black covered + silver prong | black (correct for BA) | low-luster satin vs cream; can still read flatter than bridal | **PASS** structure/hardware; residual sheen → **MINOR→borderline MAJOR** |
| `sf-side` | black-almond | **YES** | soft-square intent (side tip slightly softer) | **YES** covered | black (correct) | low-luster / can read matte | residual sheen → **MAJOR** M2 quieter |

### Cleared vs residual (`studio04`)

| ID | Was | Status |
|---|---|---|
| C1–C4 | Live toe/buckle fails | **CLEARED** (prior `deep04`) + held on `studio04` |
| M1 | Cream sole-edge warmth | **CLEARED** / held |
| M2 | BA live matte vs satin | **REDUCED** — studio BA shows low-luster satin + covered buckle; still can read flatter than cream bridal satin → **REMAINS MAJOR (quieter)** |
| M3 / M4 | BA metallic heel / unclear wrap | **CLEARED** |
| C5 | cream `md-editorial-b` brown/wood heel | **CLEARED** — cream sole/heel + fabric-covered buckle + satin |
| C6 | cream `md-editorial-a` metal buckle | **CLEARED** — fabric-covered buckle + soft-square + satin + cream sole |
| C7 | BA `sf-topdown-insole` silver metal buckle | **CLEARED** — fabric-covered buckle + MODEL MATCH 1982 + soft-square (studio white seamless) |
| C8 | BA `md-editorial-a` silver metal / artifacts | **REMAINS** — lifestyle regen still drifts (matte / rounder toe / weak covered-buckle read) |
| M5 | cream `sf-pair-or-sole` tan sole edge | **CLEARED** — cream sole/heel pair studio |
| M6 / M7 | cream editorial heel/matte | **CLEARED** with C5/C6 regen |
| M8 | BA secondary-ref buckle pollution | **PROCESS** — still attach cream physical buckle refs for future gens (not an asset row) |

### Remaining CRITICAL / MAJOR (return)

**Live gallery CRITICAL: 0**

**Live gallery MAJOR: 1**
- **M2** — black-almond live `sf-hero-34` + `sf-side`: satin sheen improved vs prior flat microfiber but can still read **low-luster / near-matte** vs cream bridal satin under harsh QC (structure + fabric-covered buckle **PASS**; BA outsole correctly **black**, not cream).

**Storage / non-live CRITICAL: 1**
- **C8** black-almond `md-editorial-a` — still fails fabric-covered buckle / soft-square / satin vs cream physical lock (not in PDP 2-angle gallery; marketing reuse risk only).

**Storage / non-live MAJOR: 1 (process)**
- **M8** — BA secondary-ref buckle pollution risk for future gens (no disk asset to replace).

**Studio confirmation:** all five live gallery objects are **full white-seamless studio AI** packshots (RGB, near-white corners, soft contact shadows) — **not** rembg cutouts.

---

## Counts (return)

### Pre-fix audit

| Severity | Count |
|---|---|
| **CRITICAL** | **8** |
| **MAJOR** | **8** |
| **MINOR** | **6** |

### Post-fix remaining (`?v=20261101studio04`) — superseded by `studio04b` below

| Severity | Live gallery | Storage-only | Total open |
|---|---|---|---|
| **CRITICAL** | **0** | **1** (C8) | **1** |
| **MAJOR** | **1** (M2) | **1** (M8 process) | **2** |
| Live gallery rows fixed this pass | 5 (cream hero, cream side, fallback, BA hero, BA side) | | |
| Storage assets regenerated | cream pair, cream md-a/b, BA topdown, BA md-a | | |

---

## Post-fix (`?v=20261101studio04b`) — 2026-11-01

**Scope:** Remaining live **MAJOR M2** (BA hero+side low-luster/matte vs satin) + storage **CRITICAL C8** (BA `md-editorial-a`). Cream live gallery untouched (still `studio04`).

**Method lock:** full studio AI regen only (white seamless cyclorama + soft contact shadow). **No rembg / cutout.** BA geometry recolored/locked from cream studio Angle A/B + cream physical refs; sheen pushed with bridal-satin highlight language.

### Actions

1. Regenerated black-almond live `sf-hero-34` + `sf-side` as white-seamless studio packshots with **stronger bridal satin sheen** (soft luminous highlight bands on toe/vamp/strap), same Angle A/B locks, black fabric-covered buckle + silver prong, solid black heel + black sole, almond lining + cream footbed peek.
2. Regenerated storage BA `md-editorial-a` (lifestyle high-angle / white tights) forcing fabric-covered black satin buckle (clears silver-metal C8).
3. Uploaded 3 webp objects; updated BA live `product_medias` rows → `?v=20261101studio04b`.
4. CDN verify HTTP 200; `last-modified` 2026-11-01 10:25 GMT; BA hero corners near-white RGB; BA side near-white/light-gray studio floor; not alpha cutouts.

URL map: `../.tmp/simon_p04_studio04b_urls.json`

### Live gallery re-QC (CDN BA `?v=20261101studio04b`)

| Shot | Colorway | Studio (not crop) | Soft-square | Fabric-covered buckle | Sole/heel | Satin | Result |
|---|---|---|---|---|---|---|---|
| `sf-hero-34` | black-almond | **YES** white seamless + contact shadow | soft-square / blunt intent held | **YES** black covered + silver prong | black (correct) | soft bridal satin highlight on toe box / vamp (stronger vs `studio04` flat read) | **PASS** live M2 cleared |
| `sf-side` | black-almond | **YES** | soft-square side tip held | **YES** covered | black (correct) | soft satin luster along vamp/strap (stronger vs prior matte) | **PASS** live M2 cleared |
| cream live rows | cream | unchanged `studio04` | — | — | — | — | **PASS** (prior) |

### Cleared vs residual (`studio04b`)

| ID | Was | Status |
|---|---|---|
| M2 | BA live matte vs satin | **CLEARED** on live `studio04b` — soft bridal satin sheen readable on hero+side (still quieter than cream bridal under harsh QC → optional **MINOR** residual only) |
| C8 | BA `md-editorial-a` silver metal / artifacts | **CLEARED** — fabric-covered black buckle + continuous straps on regenerated lifestyle |
| C1–C7 / M1 / M3–M7 | prior clears | **HELD** |
| M8 | BA secondary-ref buckle pollution | **PROCESS** — still attach cream physical buckle refs for future gens |

### Remaining CRITICAL / MAJOR (return)

**Live gallery CRITICAL: 0**

**Live gallery MAJOR: 0**

**Storage / non-live CRITICAL: 0**

**Storage / non-live MAJOR: 1 (process)**
- **M8** — BA secondary-ref buckle pollution risk for future gens (no disk asset to replace).

**Studio confirmation:** BA live hero + side are **full white-seamless studio AI** packshots (RGB, near-white/light studio corners, soft contact shadows) — **not** rembg cutouts. Sheen improved to soft bridal satin vs prior low-luster matte.

### Counts (return) — after `studio04b`

| Severity | Live gallery | Storage-only | Total open |
|---|---|---|---|
| **CRITICAL** | **0** | **0** | **0** |
| **MAJOR** | **0** | **1** (M8 process) | **1** |
| Live BA rows fixed this pass | 2 (BA hero, BA side) | | |
| Storage assets regenerated | BA `md-editorial-a` | | |

**MD path:** `asf-2-next/scripts/storefront-curated-seed/simon-generated/_qc/DEEP_DIFF_04.md`
