BRIEF_REV=20261102-diffbg

# HERO_GENERATION_BRIEF — Cross-catalog `sf-hero-34` lock

**Audience:** Any agent regenerating Simon storefront Angle-A heroes (`sf-hero-34` + matching `sf-fallback`).  
**Status:** Rules document only. **Do not generate, upload, or touch DB until a human explicitly asks.**  
**Evidence source:** Home “最新商品” 2×3 grid screenshot (2026-11-02 ~21:47 + ~22:15 FAIL attach) + camlock QC notes (`HERO_CAMLOCK_01_02.md`, `03_04`, `05_06`).  
**Out of scope / forbidden media:** Model slot2 (`sf-model` / arrangement 11), sides, posts, promos, rembg/cutouts. **NO 3D** — no mesh, no photogrammetry, no turntable / spin viewer / fake-3D.

---

## Why this brief exists

Heroes can pass **per-batch** QC and still **fail on the home grid**, where six tiles sit next to each other. Humans spot these failure classes instantly:

| Grid position | Tile (typical pairing) | Human FAIL | Rule class |
|---|---|---|---|
| **Top left** | Knit ballet X (02 black) | **Wrong X-strap vs physical refs** (topology / band mass not matching refs) — 2026-11-02 ~22:15 home-grid FAIL | Strap fidelity |
| **Bottom right** | Satin Mary Jane (light CW) | Camera **higher / more overhead** than peers — more footbed, flatter silhouette | Camera lock |
| **Top right** | Satin ballet X (light CW) | **Wrong strap geometry** vs sibling / physical refs (not a clean thick X) | Strap fidelity |
| **Middle left** | Knit ankle strap (beige) | **Glowing arc / halo** in BG; others are flat muted fields | Background lock |
| **All six tiles** | Full home grid | **Same ~taupe BG** across 01–06 — latest batch wrongly unified; tiles look identical greige | Per-product BG hex |

Agents must treat the **home grid as the final exam**, not a single isolated hero.

---

## Mandatory pipeline (do this or don’t ship)

**Do not freeform GenerateImage.** Prefer a Weavy / Comfy-style **locked-plate** workflow. Same plate for every SKU; only silhouette + colorway + **assigned BG hex** change in the prompt. Ship only after the hard QC gate below.

### M1. Inputs (already exist — don’t re-ask the human)

1. **Gold hero plate** — Simon-approved cream X (or the attached gold plate for this run). Defines camera, crop, height, lighting family.
2. **Physical refs per SKU** under `simon-product-refs/` (front / side / topdown as available for that product + colorway).
3. **This brief** — camera (§1), BG (§2 + hex table), strap (§3), lighting (§4), FAIL mappings (§6).

If any of these are missing from the workspace / chat attachments, stop and report — do **not** invent a new angle or ask the human to re-describe camera from scratch.

### M2. Locked plate workflow (Weavy / Comfy-style — preferred)

1. **Plate = camera truth.** Gold plate locks toe **7:00**, crop, shoe height in frame, lighting family. Every regen must match that plate — not a prose “elevated / medium” label.
2. **Structure lock.** ControlNet depth and/or canny (or equivalent) **from the gold plate** so angle / pitch / foreshortening cannot drift.
3. **Identity lock.** IP-Adapter / reference image from **physical photos for that SKU + colorway** (materials, strap mass, buckle, interior color). **Physical-ref match is mandatory** for straps — never invent topology.
4. **BG lock.** Flat muted warm-neutral field **per product hex** (§2.1 table) — no arcs, glows, vignettes, radial gradients (§2.2). **Do not unify all SKUs to one taupe.**
5. **Batch discipline.** Run all in-scope SKUs / CWs against the **same plate**. Prompt deltas = **silhouette class + colorway + product BG hex only** (MJ / X / ankle + knit/satin + CW colors + §2.1 hex). Do not change camera language per product.
6. **Cursor `GenerateImage` fallback (allowed only if plate workflow unavailable).** Still require:
   - Gold plate attached / referenced as the camera lock on every call.
   - Contact-sheet gate vs gold before any ship (§M3).
   - **Never** independent “creative” angles, new heights, or one-off compositions without the plate.

### M3. Hard QC gate before any upload / `?v=` bump

1. Build a **contact sheet of all heroes vs the gold plate** (and ideally a home-grid-style 2×3 for six-product ships).
2. **Automatic FAIL** if any cell shows:
   - Wrong clock angle (toe not 7:00 / yaw drift)
   - Height / pitch outlier vs gold or majority
   - BG artifact (arc, glow, vignette, seam)
   - **Same / near-identical BG hex across products** (grid tiles read as one taupe) — violate §2.1
   - Wrong strap class or thickness vs **physical refs** / sibling CW (cite: **top-left = 02 black X-strap FAIL**)
3. **Human grid screenshot only for fails** — ask for a marked home-grid shot when a cell fails visual QC; do not spam the human for PASS cells.
4. **Regenerate fails through the same plate only.** Do not invent a second lock. Re-sheet and re-gate until every in-scope cell PASS.

### M4. Explicitly forbidden

| Forbidden | Why |
|---|---|
| Freeform one-off gens with **no gold plate** | Angle/height drift; grid FAIL |
| **rembg** / WhatsApp cutouts pasted on flat BG | Sticker edges, wrong shadow |
| **3D models**, meshes, photogrammetry, turntable / spin viewers, fake-3D | Out of scope; not Angle-A studio heroes |
| Claiming **PASS** without side-by-side vs **gold + physical refs** | Per-tile “looks fine” is not QC |
| Changing camera / lighting family mid-batch | Cross-catalog mismatch on home grid |
| **Unifying all products to one ~taupe / same greige BG** | Home grid looks identical; §2.1 FAIL |
| Inventing straps without **physical refs** attached | Top-left 02 black X FAIL class |
| Touching model slot2 / arr 11 unless human scoped it | Separate asset class |

### M5. Agent runbook (execute in order)

- [ ] **Confirm scope** — which products / CWs; human said generate / upload is allowed (else docs-only stop).
- [ ] **Locate gold plate** + attach / path it; do not re-ask for camera description.
- [ ] **Locate physical refs** under `simon-product-refs/` for each SKU+CW in scope — **strap QC requires ref match**.
- [ ] **Read this brief** §§1–4 + FAIL table §6 (camera / BG hex / straps). Confirm `BRIEF_REV=20261102-diffbg`.
- [ ] **Assign BG hex** from §2.1 table per product (01–06). Do **not** reuse one taupe for the batch.
- [ ] **Generate via locked plate** (structure + identity + per-product BG hex). Same plate for whole batch; prompt deltas = silhouette + colorway + BG hex only. **No 3D. No rembg. No arcs.**
- [ ] **Build contact sheet** vs gold (all heroes in scope) **and** a home-grid-style 2×3 for BG differentiation.
- [ ] **Run checklist** §5 / §M3 — fail wrong clock, height outlier, BG artifact, **identical BG across products**, strap class/thickness vs refs (esp. **02 black X**).
- [ ] **Regen fails only** through the **same plate**; re-sheet.
- [ ] **Ship only after all PASS** — then upload webp + DB `?v=` if human authorized. Never claim PASS without gold + refs side-by-side.
- [ ] **Human grid screenshot** only if something still fails after plate-locked regen.

---

## 1. Locked camera (NON-NEGOTIABLE)

### 1.1 Orientation

1. **Toe / shoe midline → 7 o’clock** (bottom-left diagonal). Heel sits roughly **1–2 o’clock**.
2. Same **yaw / pointing direction** for every SKU and colorway. Do not rotate one shoe more face-on or more profile than peers.
3. Single shoe, centered, square frame (~1:1). Soft contact shadow under the sole — studio render, **not** cutout-on-white.

### 1.2 Height / distance / pitch (identical across catalog)

1. **One catalog lock** for all six products and all active colorways.  
   - Same camera **height**, **distance**, **lens feel**, and **pitch**.  
   - If product A shows a moderate side wall + modest footbed, product B must show the **same** relationship — not more top-down, not flatter eye-level.
2. **Reject overhead / bird’s-eye / elevated outliers** even if the toe still points 7:00.  
   - Symptom (bottom-right FAIL): more insole/heel-cup visible, shoe looks shorter/foreshortened, cyan “horizon” guide through the pack would sit differently vs neighbors.
3. **Do not invent a second “elevated vs medium” dialect per batch.**  
   Prior notes mixed “elevated 3/4” (01–02, 05–06) with “medium ¾” (03–04). That wording drift **caused** cross-catalog mismatch.  
   → Pick **one** lock from a gold tile (or a PASS majority contact sheet) and force every regen to match **that** tile — not the prose label.
4. Silhouette bias trap: ankle-strap openings show more footbed than Mary Jane / X at the **same** pitch. Judge height by **sole edge foreshortening + top-of-toe-box tilt + heel-block height**, not “how much insole I see” alone.

### 1.3 How to prove camera lock before upload

1. Build a **side-by-side contact sheet** of all heroes being shipped (minimum: one light CW per product 01–06; better: full active CW set).
2. Overlay a shared horizontal guide (~mid shoe).
3. Vision-check: toe 7:00 on every cell; **no cell clearly higher/lower** than the majority.
4. If one cell is an outlier → **FAIL that cell**, regen only outliers to majority lock — do not “average” by regenerating the whole catalog without a lock ref.

---

## 2. Background rules

### 2.1 Required look — **distinct per-product hex (MANDATORY)**

1. Flat muted warm-neutral studio field — low chroma, quiet stone/linen/taupe **family**, but **each product 01–06 MUST use a clearly distinct hex**.
2. Soft, even fill. Shoe grounded with a **subtle contact shadow** only.
3. **Same-family greige that looks identical on the home grid = FAIL.** Latest batch wrongly unified all tiles to ~one taupe — **forbidden**.
4. Still **not** peachy-bright, cool blue studio, or pure white cyclorama. Distinct ≠ loud.

#### Required BG hex table (use these exact values)

| Product | Folder | BG hex | Notes (still low-chroma) |
|---|---|---|---|
| **01** | `01-knit-maryjane-buckle` | `#C8C0B4` | Cooler stone greige |
| **02** | `02-knit-ballet-xstrap` | `#D2C4B0` | Warm sand-greige (not peach) |
| **03** | `03-knit-ankle-strap` | `#B9B2A6` | Deeper muted taupe |
| **04** | `04-satin-ankle-strap` | `#D8CFC2` | Lighter linen |
| **05** | `05-satin-maryjane` | `#C4B8A8` | Mid warm stone |
| **06** | `06-satin-ballet-xstrap` | `#BEB6A9` | Soft olive-greige |

Both colorways of a product share that product’s hex. All six hexes must remain **visually separable** on a 2×3 home-grid contact sheet.

### 2.2 Hard bans (middle-left FAIL class + unified-taupe FAIL)

| Ban | Why humans notice |
|---|---|
| **One shared taupe / identical greige for 01–06** | Home grid reads as six copies of the same set; latest-batch FAIL |
| Glowing arcs / halos / rings behind heel or upper corner | Breaks flat field; looks like a vignette or bad composite |
| Radial gradients, spotlight pools, soft vignettes | Grid neighbors look “cleaner”; one tile feels dirty |
| Hard paper edge / seam / floor horizon line | Reads as different set |
| rembg cutout + flat paste | Hard edge, wrong shadow, “sticker” look |
| Busy texture, marble, wood floor, colored cyclorama | Breaks catalog unity |
| Peachy-bright / coral / saturated warm sand | Too loud vs muted family |

### 2.3 QC for BG

- Zoom corners of every hero. Corner average ≈ that product’s §2.1 hex (± small render drift OK; **cross-product collision = FAIL**).  
- No brighter crescent, smear, or circular falloff vs center.  
- On a **home-grid 2×3**, all six product BGs must be **clearly different** at a glance.  
- If unifying tint after gen: **seamless corner flood only** to the **assigned product hex** — preserve shoe + soft shadow; still **no rembg**. Never flood every SKU to the same hex.

---

## 3. Per-silhouette strap rules (match physical refs — never invent)

Attach the product’s **physical refs** (`simon-product-refs/…`) on every regen. `promptLock` / camlock notes win over “pretty default ballet straps.”  
**Physical-ref match is mandatory.** Home-grid FAIL cite: **top-left = product 02 black X-strap wrong** (2026-11-02 ~22:15 screenshot) — regen must match 02 knit X physical refs, not a hallucinated / under-built / wrong-topology X.

### 3.1 Mary Jane buckle — Products **01** (knit), **05** (satin)

| Must | Must not |
|---|---|
| **Single** wide strap across **instep / midfoot** (MJ), not around the ankle | X / criss-cross elastics |
| Square **covered** buckle + visible **silver prong** (tonal cover: black / beige / cream per CW) | Naked huge chrome fashion buckle, round buckle, no prong |
| Knit 01: ribbed upper + strap continuity; padded collar as in refs | Invented pillow collar on slim styles |
| Satin 05: glossy/satin upper; cream CW cream lining; black-pink → **pink** lining/insole | Wrong interior color |

### 3.2 Ballet X elastic — Products **02** (knit), **06** (satin)

| Must | Must not |
|---|---|
| **Two wide plank** elastic bands forming a **clean taut centered X** matching **physical refs** | Single diagonal strap, Y / V / triangle “overlap blob”, skinny ribbons, invented topology |
| Band mass ~**¼–⅓ of toe-box width** (thick enough — top-right FAIL was under-built / wrong topology; **top-left 02 black** also FAIL vs refs) | Hair-thin straps; one strap dominating so X disappears; “looks like an X” without ref match |
| No MJ buckle on X products | Buckle + X mashup |
| Slim heel / no Achilles pillow collar (esp. 02) | Fat padded collar invent |
| 06 cream: coarse-ribbed / substantial elastic mass; black-pink: black X + pink interior + cream sole lip per refs | Hallucinated hardware |

**Home-grid FAIL cites:**
- **Top-left = product 02 black** — X-strap wrong vs physical refs (mandatory regen to refs).
- **Top-right** — light satin X sibling must show the **same X topology** as the dark knit X sibling (and as `side` / `topdown` physical refs) — not a single band or collapsed Y.

### 3.3 Ankle strap + buckle — Products **03** (knit beige only), **04** (satin)

| Must | Must not |
|---|---|
| **Wide strap around the ankle** (higher than MJ) + large **fabric-covered square buckle** + silver prong | MJ midfoot strap; X elastics |
| 03: beige covered buckle; knit ribs; slim brown sole/heel | Reactivating blush as a real CW; inventing second CW |
| 04 cream: cream covered buckle, cream sole/heel, soft-square satin toe | Wrong toe shape |
| 04 black-almond: black exterior, **almond lining + cream/white textured footbed** | Solid wrong-color pad |

### 3.4 Cross-CW consistency

- Dark and light CWs of the **same product** share strap **topology**; only color/material changes.  
- Home grid often pairs dark left / light right of the same silhouette — strap FAIL is obvious when left is X and right is not.  
- **Refs win over sibling:** if both CWs drift from physical truth, both FAIL (do not lock to a wrong sibling).

---

## 4. Lighting / shadow consistency

1. Soft diffused key, typically **upper-left** feel; gentle highlight on toe box (satin) without blown specular fireballs.
2. **One soft contact shadow** under the shoe, slightly toward bottom-right / behind — same side for all tiles.
3. No second mystery shadow, no colored bounce, no rim-light halo (halo often becomes the “glowing arc” BG FAIL).
4. Exposure matched across catalog: no one tile much brighter/darker unless CW material demands it (black knit vs cream satin) — background luminance still stays in the muted family **at that product’s hex**.

---

## 5. QC checklist — PASS required before any upload

Agents **must not** upload or bump `?v=` until every box is PASS. Prefer writing a short QC note under `_qc/` with the contact-sheet path.  
This section is the detailed checklist for **§ Mandatory pipeline → M3 / M5**. Skip M2/M3 → do not ship.

### 5.1 Contact sheet (mandatory)

- [ ] Built **side-by-side** sheet of all heroes in scope **vs gold plate** (ideally full 01–06 active CWs + fallbacks that clone a hero).
- [ ] Also check a **home-grid style 2×3** — BG hexes must be **clearly distinct** per product; straps match refs.

### 5.2 Per-tile checks

| # | Check | PASS means |
|---|---|---|
| C1 | Toe **7 o’clock** | Bottom-left diagonal; heel ~1–2 o’clock |
| C2 | **Same camera height/pitch** as majority lock | No overhead outlier (bottom-right class); no flatter eye-level outlier |
| C3 | Same pointing / yaw family | Not one shoe more profile than others |
| B1 | Flat muted warm-neutral BG | No arcs, glows, gradients, vignettes, seams (middle-left class) |
| B1b | **Distinct per-product BG hex** (§2.1) | 01–06 clearly different on 2×3; identical taupe = FAIL |
| B2 | Soft contact shadow only | Studio, not rembg sticker |
| S1 | Strap topology = product silhouette | MJ / X / ankle rules in §3 |
| S2 | Matches **physical refs** for that CW | Thickness, buckle, prong, interior color — **mandatory** |
| S2b | **02 black X** specifically | Not the top-left home-grid FAIL; band mass + topology = refs |
| S3 | Sibling CW same topology | Dark vs light of same product (and both match refs) |
| L1 | Lighting/shadow side consistent | Soft key + one contact shadow |
| X1 | Model slot2 / arr 11 untouched | Unless human explicitly scoped it |
| X2 | No rembg pipeline | Full studio regen or approved soft BG unify only |
| X3 | No 3D / turntable / fake-3D | 2D locked-plate studio only (§M4) |
| X4 | Side-by-side vs gold + refs | Claiming PASS without contact sheet = FAIL |

### 5.3 Fail / regen policy

1. Any single FAIL → do **not** ship that asset.  
2. Regen outliers through the **same gold plate** (§M2) to the majority lock (camera), to **§2.1 hex** (BG), or to **physical refs** (straps).  
3. Re-build contact sheet and re-run checklist.  
4. Only then upload webp + DB `?v=` (cache-bust token as human specifies, e.g. `20261102cam7x`).

---

## 6. Common failure modes from the home-grid screenshot → rules

Reference frame: **2 columns × 3 rows** under 最新商品 (dark CW often left, light CW right; silhouettes often grouped by row).

| Screenshot FAIL | Position | What went wrong | Rule to enforce |
|---|---|---|---|
| Wrong X-strap vs physical refs | **Top left** (= **product 02 black**) | Strap topology / band mass ≠ 02 knit X physical refs | §3.2 + mandatory physical-ref match; S2 / S2b |
| Wrong / different camera angle (higher) | **Bottom right** | Pitch drifted overhead vs other five tiles; more footbed, foreshortened shoe | §1 identical height/pitch; reject elevated outliers; contact-sheet guide line |
| Wrong strap | **Top right** | Strap topology ≠ X elastic truth (single diagonal / Y / collapsed bands) while sibling shows proper X | §3.2 thick centered X; refs attached; sibling CW topology match |
| Glowing arc BG artifact | **Middle left** | Non-flat BG (halo/arc/gradient) while peers are flat muted fields | §2 ban arcs/glows; corner zoom QC |
| Unified same taupe BG | **All / any 2×3** | Latest batch painted every product ~identical greige | §2.1 distinct hex table; B1b FAIL if tiles collide |
| (Latent) mixed “elevated” vs “medium” batch language | Cross-catalog | Batches locked to different prose heights → grid mismatch later | §1.2 one lock tile for whole catalog |
| (Latent) judging height only by insole visibility | Cross-silhouette | Ankle straps always show more cup → false “elevated” calls | §1.2 use sole foreshortening + toe-box top tilt |

---

## 7. How the human can help the agent

Stanley / Simon: agents go wrong less when feedback is **spatial, visual, and binary**.

### 7.1 Best inputs (in order of usefulness)

1. **Gold screenshot** — attach the home grid or a single PASS tile and say: “Camera lock = this tile.”  
2. **Clock angle** — “Toe at 7 o’clock; heel 1–2; same as gold.”  
3. **Markup** — circle the bad region (overhead footbed, wrong strap junction, glowing arc).  
4. **FAIL with grid position** — e.g. `FAIL top-left 02 black X vs refs`, `FAIL bottom-right camera higher`, `FAIL top-right strap not X`, `FAIL middle-left BG arc`, `FAIL grid BGs identical taupe`.  
5. **Pair callouts** — “Top-left X must match physical refs; top-right must match that topology.”  
6. **Do-not list** — “No rembg. Don’t touch model slot2. Don’t regen 03–06 if only 01–02 failed. Don’t unify BG hexes.”

### 7.2 Phrases that work well

- `PASS camera on 01–04+06; FAIL 05 cream — higher pitch than majority.`  
- `Lock height to middle-right tile; regen only outliers.`  
- `FAIL top-left = 02 black X-strap — match physical refs.`  
- `06 cream strap FAIL — not a plank X; use side-02 / topdown-01 refs.`  
- `03 BG FAIL — glowing arc upper-left; must be flat muted like §2.1 #B9B2A6.`  
- `FAIL home grid — all BGs same taupe; use §2.1 hex table.`

### 7.3 Phrases that cause thrash (avoid)

- “Make it more elevated” / “more medium” **without** a lock image (agents will invent a new height).  
- “Fix all heroes” when only one grid cell failed.  
- “Looks off” with no position / no markup.  
- “Make BGs consistent” without clarifying **flat + distinct hexes** (agents may unify to one taupe).

### 7.4 When stopping the agent

If the human says **do not generate / no uploads**, agents stop image gen, storage upserts, and DB `media_url` edits immediately — documentation and QC notes only.

---

## 8. How you can help me avoid repeated mistakes

(Short section for Stanley — what helps the next agent pass first try.)

1. **Send the home-grid screenshot** whenever something feels wrong; mark **row/column** (or “bottom right / top right / middle left / top left”).  
2. **Pick one gold tile** as the camera lock and stick to it across batches — don’t rename the lock “elevated” in one chat and “medium” in the next.  
3. **Call strap FAILs against physical refs** (and sibling only after refs) — e.g. “top-left 02 black X must match refs,” not just “straps look weird.”  
4. **Say explicitly what not to touch** (model slot2, other products, rembg, unified taupe BG).  
5. **Prefer FAIL + position + rule class** (`camera` / `strap` / `BG` / `BG-hex`) over open-ended “regenerate everything.”  
6. If a batch already shipped with a `?v=` token, say whether the next fix should **replace in place** or use a **new cache-bust** — and whether inactive CWs (e.g. 03 blush) stay frozen.

---

## Quick reference — product → silhouette + BG hex

| Product | Folder | Hero strap family | BG hex |
|---|---|---|---|
| 01 | `01-knit-maryjane-buckle` | MJ buckle | `#C8C0B4` |
| 02 | `02-knit-ballet-xstrap` | X elastic planks | `#D2C4B0` |
| 03 | `03-knit-ankle-strap` | Ankle buckle (beige only active) | `#B9B2A6` |
| 04 | `04-satin-ankle-strap` | Ankle buckle | `#D8CFC2` |
| 05 | `05-satin-maryjane` | MJ buckle | `#C4B8A8` |
| 06 | `06-satin-ballet-xstrap` | X elastic planks | `#BEB6A9` |

**Refs root:** `asf-2-next/scripts/storefront-curated-seed/simon-product-refs/`  
**Generated heroes:** `asf-2-next/scripts/storefront-curated-seed/simon-generated/products/{folder}/…/sf-hero-34.png`  
**Related QC:** `_qc/HERO_CAMLOCK_01_02.md`, `_qc/HERO_CAMLOCK_03_04.md`, `_qc/HERO_CAMLOCK_05_06.md`

---

## Confirm

This file is **rules-only**. **3D is forbidden** (no mesh, photogrammetry, turntable, spin viewer, or fake-3D). Keep gold plate, toe 7:00, same camera height, no rembg, no arcs. Mandatory path = gold-plate locked workflow (§ Mandatory pipeline). No GenerateImage, no storage upload, no DB changes were performed while writing/updating it.
