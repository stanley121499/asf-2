# Product 05 deep ref diff

**Product:** Satin Mary Jane instep (`05-satin-maryjane`) · 缎面玛丽珍平底鞋  
**Product ID:** `c1010001-24a8-4f00-8000-000000000005`  
**Audit date:** 2026-11-01  
**Mode:** AUDIT + FIX pass (`deep05`) — see Post-fix below  
**Live gallery surface:** 2-angle (`arr` 10 hero + 11 side) + product fallback  
**Cache-bust on live rows:** `?v=20261101deep05` (was `?v=20261101p05qc`)  
**Ground truth:** cream **physical** WhatsApp refs. black-pink is **AI secondary** (2026-10-19) — construction judged against cream physical; color/interior against black-pink secondary refs + manifest.

---

## Ref inventory (paths)

### Cream — physical (primary truth)

| Path | What it proves |
|---|---|
| `simon-product-refs/05-satin-maryjane/cream/side-01.jpg` | Soft-square / rounded-square toe; **single INSTEP** MJ strap (~1.5–2 cm); **cream fabric-covered** square buckle + light prong; pale **yellow-cream** low block heel + thin sole edge; light tan/nude lining; white footbed + MODEL MATCH crest under strap |
| `simon-product-refs/05-satin-maryjane/cream/side-02.jpg` | Outer-side profile; strap dual-edge topstitch; fabric-covered buckle (bulky wrap, not bare metal); pale yellow heel vs cooler pearlescent satin upper; soft-square toe |
| `simon-product-refs/05-satin-maryjane/cream/front-01.jpg` | Front-on soft-square toe; cream covered buckle (no metal frame visible); tan lining; MODEL MATCH at heel bed |
| `simon-product-refs/05-satin-maryjane/cream/topdown-insole-01.jpg` | Top-down: strap ~2–2.5 cm with dual topstitch; **fully fabric-wrapped** buckle + light prong; greyish textured footbed; pale pink/nude side walls; soft-square toe |
| `simon-product-refs/05-satin-maryjane/cream/rear-top-insole-01.jpg` | Rear/top: center-back heel seam; covered buckle + cream keeper loop; MODEL MATCH + **1982** banner; slim flush collar (**no** Achilles pillow) |
| `simon-product-refs/05-satin-maryjane/cream/sole-01.jpg` | Outsole **pale yellow/cream** (NOT dark brown); floral/clover forefoot grid; size **37** mid circle; horizontal-ridged heel; fabric-covered buckle visible on flank |

### Black-pink — AI secondary refs (colorway only; not physical)

| Path | Notes |
|---|---|
| `…/black-pink/side-01.jpg` | Matte black satin; pink lining + pink insole; low black heel; strap ~1.5–2 cm; buckle often reads **matte black coated/metal**, not clear satin wrap |
| `…/black-pink/side-02.jpg` | Same; pink interior; black heel; buckle again hard black frame more than cream-style fabric pillow |
| `…/black-pink/front-01.jpg` | Soft-square toe; pink insole MODEL MATCH; buckle/hardware inconsistent (metal glints / non-satin strap risk) |
| `…/black-pink/topdown-insole-01.jpg` | Pink footbed + branding; black exterior; strap/buckle geometry for colorway |
| `…/black-pink/rear-top-insole-01.jpg` | Heel seam; pink interior; no pillow collar |
| `…/black-pink/sole-01.jpg` | Outsole reads **black/near-black** with clover grid + 37 + ridged heel (differs from cream pale-yellow sole) |

**Manifest lock (must hold):** smooth satin (not knit); single **instep** MJ strap (not ankle / not X); small **tonal covered** buckle + **silver** prong; soft-square toe; very low block heel; cream → pale cream/yellow heel + light tan interior; black-pink → black exterior + **pink** lining/insole + prefer black heel; MODEL MATCH when insole visible.  
**Sole note:** physical cream sole is **pale yellow**, not the manifest “Dark brown” string — treat cream `sole-01.jpg` as truth for cream. Black-pink secondary sole is black; local generated sole often drifts dark brown.

---

## Live media inventory (URLs + `?v=`)

Queried `product_medias` via Supabase MCP (`product_id = c1010001-24a8-4f00-8000-000000000005`). HTTP 200 webp; `last-modified` 2026-11-01 ~09:46 UTC. Local PNG ≈ CDN after decode (mean abs RGB Δ ≈ 0.2–0.7 at 128²). **Fallback PNG byte-identical to cream hero.**

| Role | color_id | arr | Live URL |
|---|---|---|---|
| Product fallback | `null` | 1 | `…/000000000005/fallback.webp?v=20261101p05qc` |
| Cream hero | `…0001` (`#F5F0E8`) | 10 | `…/0001/sf-hero-34.webp?v=20261101p05qc` |
| Cream side | `…0001` | 11 | `…/0001/sf-side.webp?v=20261101p05qc` |
| Black-pink hero | `…0002` (`#111111`) | 10 | `…/0002/sf-hero-34.webp?v=20261101p05qc` |
| Black-pink side | `…0002` | 11 | `…/0002/sf-side.webp?v=20261101p05qc` |

Full host prefix:  
`https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000005/`

### Local / storage-only (not in live 2-angle gallery)

| Path | Status |
|---|---|
| `…/cream/sf-topdown-insole.png` | Disk only |
| `…/cream/sf-pair-or-sole.png` | Disk only — **pair ¾, NOT a sole shot** |
| `…/cream/md-editorial-a.png` / `md-editorial-b.png` | Disk / storage only |
| `…/black-pink/sf-topdown-insole.png` | Disk only |
| `…/black-pink/sf-pair-or-sole.png` | Disk only — sole underside |
| `…/black-pink/md-editorial-a.png` / `md-editorial-b.png` | Disk / storage only |

Lifestyle spot (linked to 05): `posts/post-05.png` (black-pink), `promos/promo-03-satin-elegance.jpg` (cream).

---

## Colorway cream — shot-by-shot diffs

Compare live CDN + matching local packshots to cream **physical** refs. **Do not call PASS unless no material diffs.**

### Live `sf-hero-34` (+ fallback — same pixels)

| Check | Physical cream | Live / local | Diff |
|---|---|---|---|
| Silhouette / toe | Soft-square, blunt | Soft-square retained in ¾; corners slightly softer | **MINOR** |
| **Strap width** | ~1.5–2 cm flat dual-topstitch band | Visibly **wider / puffier / more padded** than side-02 / topdown physical | **MAJOR** — bulkier strap identity |
| Strap path | Taut instep MJ | Taut; attachment OK | **OK** geometry |
| **Buckle** | Cream **fabric-covered** square + silver/light prong | Cream fabric-covered + silver prong | **Covering OK** vs prior gold-metal FAIL — wrap still **chunkier / puffier** than physical — **MINOR→MAJOR** |
| Heel collar | Slim flush; no pillow | Slim; no invented Achilles pillow | **OK** |
| Heel / sole edge | Pale yellow-cream block + thin pale sole | Pale yellow-cream heel + sole edge | **OK** (matches physical better than “dark brown” myth) |
| Satin | Pearlescent real sheen, slight ripples | Cleaner studio satin; slightly warmer ivory | **MINOR** |
| Interior | Light tan / nude (± pink cast) | Tan/beige sueded lining peek | **MINOR** texture drift |
| Branding | MODEL MATCH crest | Partial crest under strap | **OK** / incomplete — **MINOR** |

**Verdict:** Not a clean PASS. Covered-buckle regression is largely fixed, but **strap is thicker/puffier than the physical sample** and buckle wrap is over-built. Fallback inherits every hero defect.

### Live `sf-side`

| Check | Physical (`side-01` / `side-02`) | Live | Diff |
|---|---|---|---|
| Toe | Soft-square | Soft-square / slightly rounded in pure side | **MINOR→borderline MAJOR** |
| Strap width | Medium flat ~1.5–2 cm | Reads **thicker / wider** with padded edge | **MAJOR** |
| Buckle | Cream covered + light prong | Cream covered + silver prong; perimeter stitch on wrap more “CGI” | Covering **OK**; bulk **MINOR** |
| Heel / sole | Pale yellow heel + pale sole edge | Pale yellow-cream heel + sole | **OK** |
| Lining | Nude/tan peek | Tan peek | **OK** |
| Satin | Soft physical sheen | Low–medium studio sheen | **MINOR** |

**Verdict:** **FAIL** on strap bulk vs physical. Hardware covering acceptable. Heel/sole color acceptable.

### Local `sf-topdown-insole` (not live gallery)

- Soft-square toe: **OK**.  
- Strap dual-stitch: present — width still on the stout side vs physical topdown — **MAJOR** residual.  
- Buckle: cream fabric-covered + silver prong — **OK** (better than historical Velcro/metal fails).  
- Footbed: cream/grey + MODEL MATCH — **OK**.  
- Lining tan vs physical pinkish-nude walls — **MINOR**.

### Local `sf-pair-or-sole` (pair ¾ — **not** a sole plate)

- **CRITICAL:** Buckles read as **exposed polished silver metal frames**, not cream fabric-covered. Directly contradicts physical `side-02` / `topdown` / `sole-01` flank.  
- Strap width closer to medium — still not a sole document.  
- Pale heel: roughly OK.  
- **Buyer-risk if ever reattached to gallery / ads.**

### Sole truth gap (cream)

- Physical `sole-01.jpg`: pale yellow clover + 37 + ridged heel.  
- Live 2-angle gallery **never shows outsole** — sole fidelity is invisible on PDP but still product truth.  
- Manifest “Dark brown” sole text is **wrong for cream physical** — do not regen to dark brown.

---

## Colorway black-pink — shot-by-shot diffs

Construction truth = cream physical. Color truth = black-pink secondary refs + promptLock (pink interior, black exterior, covered black buckle + silver prong).

### Live `sf-hero-34`

| Check | Cream physical + BP refs | Live | Diff |
|---|---|---|---|
| Silhouette / toe | Soft-square | Soft-square / blunt | **OK** / slight soften — **MINOR** |
| Strap width | Physical ~1.5–2 cm; BP AI refs medium-flat | **Thicker / more padded**; stronger edge bead | **MAJOR** vs physical construction |
| Buckle | Cream truth = **fabric wrap**; BP AI refs often hard black | Black tonal buckle + **silver** prong; wrap/cover ambiguous but bulkier than cream physical scale | **MAJOR** (hardware scale + finish) |
| Interior | Pink lining + pink insole (by design) | Pink lining + pink insole + MODEL MATCH peek | **OK** (colorway win) |
| Heel | Prefer black | Black low block | **OK** |
| Sole edge | BP side refs often show **tan/light** sole lip; cream physical pale yellow | Live edge reads **black** flush | **MAJOR** vs BP side-ref sole lip; construction choice vs cream pale sole |
| Satin | Satin sheen | Matte-satin / dull | **MINOR→MAJOR** under-sell |

**Verdict:** Pink interior correct. Strap/buckle bulk and sole-edge color still drift. Not PASS.

### Live `sf-side`

| Check | Refs / cream truth | Live | Diff |
|---|---|---|---|
| Toe | Soft-square | Rounded soft-square | **MINOR** |
| Strap | Medium satin band | Thick; edge stitch; tip can read pointed/V | **MAJOR** thickness; tip shape **MINOR** |
| **Buckle** | Fabric-covered tonal (cream truth); BP AI often metal | Reads **molded matte black / coated metal** more than satin-wrapped; prong silver/gunmetal | **CRITICAL** vs cream fabric-cover construction; also fights promptLock “covered buckle” |
| Interior | Pink | Pink rim clear | **OK** |
| Heel | Black low block | Black low block | **OK** |
| Sole edge | Tan lip on some BP sides / pale on cream | Black sole/heel unit | **MAJOR** |
| Material | Satin upper + satin strap | Strap can read **leather/synthetic** vs satin upper | **MAJOR** |

**Verdict:** **FAIL.** Side packshot is the harshest BP failure: buckle covering + strap material/thickness + sole edge.

### Local `sf-topdown-insole` (not live)

- Pink insole + MODEL MATCH / 1982: **OK** colorway.  
- Buckle: **exposed black metal frame** — **CRITICAL** vs covered-buckle lock.  
- Strap ~1.5 cm: closer to ref width than live side — still metal hardware fail.

### Local `sf-pair-or-sole` (sole underside)

- Pattern: clover forefoot + 37 + ridged heel — **shape OK**.  
- Color: **dark chocolate brown** vs BP secondary ref **black** sole — **MAJOR**.  
- Buckle on flank: **matte black metal**, not fabric-covered — **CRITICAL**.  
- Not on live gallery, but storage asset is a landmine.

### Secondary-ref pollution

Black-pink AI refs already disagree with cream physical on buckle (hard black vs fabric wrap) and sole color (black vs cream pale yellow). Generations that copy BP refs without forcing cream buckle/sole-construction refs will keep failing. Treat BP refs as **color only**.

---

## Severity summary: CRITICAL / MAJOR / MINOR

### CRITICAL (buyer “wrong shoe” risk)

| # | Asset | Issue |
|---|---|---|
| C1 | Live black-pink `sf-side` | Buckle reads **molded/coated metal**, not **fabric-covered** tonal MJ buckle (cream physical construction) |
| C2 | Local cream `sf-pair-or-sole` | **Exposed silver metal** buckles — opposite of physical cream covered buckle |
| C3 | Local black-pink `sf-topdown-insole` | **Exposed black metal** buckle vs covered lock |
| C4 | Local black-pink `sf-pair-or-sole` | Flank buckle **metal** + sole color wrong (brown vs black ref) — hardware identity fail |

**CRITICAL count: 4**

### MAJOR

| # | Asset | Issue |
|---|---|---|
| M1 | Live cream `sf-hero-34` / fallback | Strap **wider / puffier** than physical ~1.5–2 cm band |
| M2 | Live cream `sf-side` | Same strap bulk vs physical side-01/02 |
| M3 | Live cream hero / side | Fabric-covered buckle **over-built / chunkier** than flat physical wrap |
| M4 | Live black-pink `sf-hero-34` | Strap thicker/padded vs physical construction + BP AI medium strap |
| M5 | Live black-pink `sf-hero-34` | Buckle scale/finish bulkier than cream physical; silver prong OK but wrap weak |
| M6 | Live black-pink `sf-side` | Strap reads **leather-like** vs satin upper / satin strap truth |
| M7 | Live black-pink hero + side | Sole edge **black** vs BP side-ref **tan lip** (and cream pale sole construction) |
| M8 | Local cream `sf-topdown-insole` | Strap still stout vs physical topdown width |
| M9 | Local black-pink `sf-pair-or-sole` | Outsole **dark brown** vs BP ref black (and ≠ cream pale yellow) |
| M10 | BP secondary refs → gens | AI buckle/sole already polluted; unsafe as construction truth |

**MAJOR count: 10**

### MINOR

| # | Asset | Issue |
|---|---|---|
| m1 | Cream hero / side | Studio ivory warmer than cooler physical pearl cream |
| m2 | Cream hero / side | Soft-corner toe rounding short of full round fail |
| m3 | Cream interiors | Sueded tan lining vs smoother nude physical |
| m4 | Cream / BP | Satin sheen cleaned / dulled vs physical grain |
| m5 | BP hero | Branding year/crest micro variance (e.g. 1931 glints vs 1982) |
| m6 | BP side | Strap tip geometry (pointed/V) vs squared physical tip |
| m7 | Several | Hole punches / stitch “CGI clean” vs dirty physical sample |

**MINOR count: 7**

### Explicit non-issues (do not re-fail)

- **Cream live buckle covering:** prior gold/champagne **metal** FAIL on hero/side/fallback is **largely fixed** on `?v=20261101p05qc` — residual is bulk, not bare metal.  
- **Cream live heel color:** pale yellow-cream matches physical; do **not** “fix” to dark brown.  
- **Heel pillow:** no invented Achilles cushion on live 05 packshots (unlike 03/04 history).  
- **Black-pink pink interior:** live hero/side correctly show pink lining/insole (colorway OK).  
- **Silhouette class:** still recognizably **instep MJ** (not ankle-04, not X-06) on live gallery.

---

## Buyer-risk note

Harsh read: **cream live gallery is partially recovered on buckle metal, but still sells a thicker, puffier strap than the physical shoe.** **Black-pink live side is not buyer-safe on hardware.**

1. **Strap thickness is the #1 cream residual.** Physical cream strap is a medium flat dual-topstitch band. Live cream hero/side/fallback sell a **padded wider strap**. Buyers who handle the sample will feel “different product” even if the buckle is covered.  
2. **Buckle covering is fixed on cream live — broken again on BP side + disk leftovers.** Cream physical = fabric wrap. Live BP side + local cream pair + local BP topdown/sole sell **metal/hard frames**. Hardware is the first thing eyes lock on.  
3. **Sole is a silent lie.** Cream physical outsole is **pale yellow clover/37**. Manifest “dark brown” is wrong for cream. BP local sole is brown; BP ref sole is black; live gallery hides the plate but shows **black sole edges** on BP. Any future sole shot or unboxing video will reopen trust damage.  
4. **black-pink has no physical sample.** Secondary AI refs already show hard black buckles and black soles. Using them as construction refs will keep regenerating metal buckles. Force **cream physical buckle + strap** refs on every BP regen.  
5. **Fallback = cream hero** — every cream strap-bulk / buckle-bulk defect is also the listing fallback.  
6. **Disk landmines:** `cream/sf-pair-or-sole.png` (silver metal buckles) and `black-pink/sf-pair-or-sole.png` / `sf-topdown-insole.png` (metal buckle, brown sole) must not re-enter gallery or marketing without rebuild.

**Recommended fix order (documentation only — not executed):**  
1) Live BP `sf-side` (+ hero if needed): force **black fabric-covered** buckle + silver prong + satin strap width matching cream physical.  
2) Live cream hero/side/fallback: slim strap to physical ~1.5–2 cm; keep covered buckle but flatten wrap bulk; keep pale yellow heel.  
3) Rebuild or quarantine local cream `sf-pair-or-sole` and BP topdown/sole (metal buckle / brown sole).  
4) Never darken cream sole to “manifest dark brown”; align cream sole plate to pale yellow `sole-01` if/when sole returns to gallery.  
5) Attach cream physical buckle/strap refs on all BP gens; treat BP AI refs as color-only.

**NO fixes applied in the original audit pass** (section above preserved). Fix pass executed after — see Post-fix.

---

## Post-fix re-QC (`?v=20261101deep05`)

**Date:** 2026-11-01  
**Actions:** Regenerated live 2-angle + fallback for both CWs; rebuilt local landmines (cream pair, cream topdown, BP topdown, BP sole). Uploaded 5 webps; DB `media_url` → `?v=20261101deep05`. Backup: `simon-generated/_bak_p05deep05_20261101/`. URL map: `.tmp/simon_p05deep05_urls.json`.  
**LIVE CDN proof:** HTTP 200 webp; `Last-Modified` 2026-11-01 ~10:07 UTC. Vision-read LIVE vs cream physical + BP color refs.

### Live gallery after fix

| Shot | Colorway | Result | Vision proof |
|---|---|---|---|
| `sf-hero-34` | cream | **PASS** (prior M1/M3 cleared) | Soft-square toe; **flat-medium** cream satin strap (~1.5–2 cm class, not prior puffy pad); **cream fabric-covered** square buckle + silver prong; pale yellow-cream heel/sole edge; tan/nude lining; slim collar |
| `sf-side` | cream | **PASS** w/ residual note | Toe-left; fabric-covered cream buckle + silver prong; pale heel/sole; tan lining. Strap dual-stitch present; gauge much closer to physical — residual edge roundness → **MINOR** only |
| `sf-fallback` | (cream) | **PASS** | Same pixels as cream hero |
| `sf-hero-34` | black-pink | **PASS** (prior M4/M5/M7 cleared) | Matte black satin; **pink** lining/insole + MODEL MATCH; black **fabric-covered** buckle + silver prong; flat dual-stitch strap; **tan sole lip** (not black flush); black low heel |
| `sf-side` | black-pink | **PASS** (prior **C1** + M6/M7 cleared) | Toe-left; buckle reads **fabric-wrapped black satin** (not molded metal); silver prong; satin strap (not leather); pink rim; tan sole lip; black heel |

### Local landmines after fix (not live gallery)

| Asset | Prior | After |
|---|---|---|
| cream `sf-pair-or-sole` | **C2** silver metal buckles | **PASS** — cream fabric-covered buckles + pale heel |
| cream `sf-topdown-insole` | **M8** stout strap | **PASS** — fabric-covered buckle; strap width closer to physical |
| BP `sf-topdown-insole` | **C3** black metal frame | **PASS** — black fabric-covered buckle; pink MODEL MATCH / 1982 (prong reads dark vs silver → **MINOR**) |
| BP `sf-pair-or-sole` | **C4** metal flank + brown sole | **PASS** — **black** clover/37/ridged sole; fabric-covered flank buckle |

### Severity after fix

#### CRITICAL remaining — **0**

| # | Status |
|---|---|
| C1 Live BP `sf-side` metal buckle | **CLEARED** |
| C2 Local cream pair silver metal | **CLEARED** |
| C3 Local BP topdown metal | **CLEARED** |
| C4 Local BP sole metal + brown | **CLEARED** |

#### MAJOR remaining — **0** (live + rebuilt locals)

| # | Status |
|---|---|
| M1–M3 Cream live strap/buckle bulk | **CLEARED** on LIVE (strap edge roundness demoted to MINOR) |
| M4–M5 BP hero strap/buckle bulk | **CLEARED** |
| M6 BP side leather-like strap | **CLEARED** |
| M7 BP sole-edge black flush | **CLEARED** (tan lip on live hero/side) |
| M8 Cream topdown stout strap | **CLEARED** (local rebuild) |
| M9 BP sole brown | **CLEARED** (local black sole) |
| M10 BP AI ref pollution | **Process residual** (not an asset fail) — keep attaching cream physical buckle/strap refs on future BP gens |

#### MINOR residuals (honest)

1. Cream live side: strap edge still slightly rounder than the flattest physical band.  
2. Cream live side toe soft-rounds vs sharper soft-square in some refs.  
3. BP topdown local: prong reads dark/black vs preferred silver.  
4. Studio satin sheen cleaner than physical pearl grain (cream + BP).  
5. Crest/year micro variance on some gens (e.g. stylized crest art).  
6. Cream pair insole crest cartoonish vs physical MODEL MATCH lock (local only).

### Counts (return — post-fix)

| Severity | Count |
|---|---|
| **CRITICAL** | **0** |
| **MAJOR** | **0** |
| **MINOR** | **6** (residuals) |
| Live gallery rows re-QC’d | 5 |
| Cache-bust | `?v=20261101deep05` |
| Overall live grade | **PASS** under deep-diff bar |

**MD path:** `asf-2-next/scripts/storefront-curated-seed/simon-generated/_qc/DEEP_DIFF_05.md`

---

## Counts (return — original audit, pre-fix)

| Severity | Count |
|---|---|
| **CRITICAL** | **4** |
| **MAJOR** | **10** |
| **MINOR** | **7** |
| Live gallery rows audited | 5 (cream hero, cream side, fallback, BP hero, BP side) |
| Physical cream refs read | 6 |
| Black-pink secondary refs read | 6 |
| Local non-live assets reviewed | 8 (+ lifestyle spot post-05 / promo-03) |

**MD path:** `asf-2-next/scripts/storefront-curated-seed/simon-generated/_qc/DEEP_DIFF_05.md`
