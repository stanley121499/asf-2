# Simon storefront media generation — agent handoff

**Purpose:** Hand this file (or one **Agent task card** section) to an implementation agent so it can generate app-ready product / post / promo images from Simon’s physical refs.

**Repo root:** `/Users/stanley/Documents/GIthub/asf-2`  
**Refs library:** `asf-2-next/scripts/storefront-curated-seed/simon-product-refs/`  
**Machine catalog:** `manifest.json` (read `promptLock` + `colorways.*.refs` for every generation)  
**Human summary:** `README.md`

---

## 0. Non-negotiables (read first)

1. **Simon’s WhatsApp / ref JPGs are REFERENCES ONLY.** Never upload them to Supabase or use them as `product_medias` / posts / promos in the app.
2. **All app media must be newly generated** (storefront packshots + editorial model shots).
3. **Product fidelity > pretty fiction.** Attach the listed ref paths as `reference_image_paths`. Merge that product’s `promptLock` into every prompt.
4. **Model shots must not be boring catalog crops** (no plain tile + cuffed jeans + holding a shoe). Match the energy of the current Storefront hero Simon likes:  
   [Unsplash editorial — footwear as hero, real place, attitude](https://images.unsplash.com/photo-1556906781-9a412961c28c)  
   → cinematic lifestyle, interesting pose/location, shoes sharp, unique scene per colorway.
5. **Never reuse the same pose/scene across products or colorways.** Only the shoe changes is not allowed — change outfit, location, pose, time-of-day, crop.
6. **Insole branding** when the shot looks into the shoe: print must be legible and correct for that product (`MODEL MATCH` vs `LUMIXIU SHOES` — see catalog). Blank or hallucinated brand text = fail.
7. **AI colorways** (no physical sample): always also attach the physical sibling colorway refs (`cream` for P04/P05/P06). Interior rules:
   - P04 `black-almond`: black exterior, **almond lining + cream/white textured footbed** (not a wrinkled solid almond pad)
   - P05/P06 `black-pink`: black exterior, **pink lining + pink-toned insole**

---

## 1. What we generate (scope)

### 1.1 Product gallery (app `product_medias`)

| Per colorway | Type | Shot ID | Description |
|---|---|---|---|
| 1 | Storefront | `sf-hero-34` | White `#F7F7F5` studio, single shoe, classic 3/4 front, soft shadow, no model |
| 2 | Storefront | `sf-side` | Studio side profile, same BG |
| 3 | Storefront | `sf-topdown-insole` | Studio top-down / elevated so insole + branding readable |
| 4 | Storefront | `sf-pair-or-sole` | Studio: **pair** of shoes 3/4 **or** sole underside (alternate by colorway — see §3) |
| 5 | Model editorial | `md-editorial-a` | Unique lifestyle editorial (see §4 pose bank — pick ONE unused) |
| 6 | Model editorial | `md-editorial-b` | Second unique lifestyle editorial (different pose + location from A) |

| Extra per product | Type | Shot ID | Description |
|---|---|---|---|
| 1 | Storefront | `sf-fallback` | Neutral hero when no color selected — prefer primary colorway 3/4, or both colors suggested tastefully without looking like two SKUs |

**Per product:** `(6 × 2 colorways) + 1 fallback = 13 images`  
**All 6 products:** `13 × 6 = 78` product images

### 1.2 Posts & promos (later / separate agents)

| Asset | Count | Notes |
|---|---|---|
| Posts | 8–10 | 16:9 editorial heroes featuring these flats (can include models — unique scenes) |
| Promos | 4–6 | 16:9 campaign banners; legible zh headlines OK |

Do **not** mix post/promo work into a product colorway agent.

---

## 2. Output layout (generated app media)

Save under:

```
asf-2-next/scripts/storefront-curated-seed/simon-generated/
  products/
    01-knit-maryjane-buckle/
      black/
        sf-hero-34.png
        sf-side.png
        sf-topdown-insole.png
        sf-pair-or-sole.png
        md-editorial-a.png
        md-editorial-b.png
      beige/
        …same 6…
      sf-fallback.png
    02-knit-ballet-xstrap/
      …
  _qc/
    {productId}-{colorway}-notes.md   # agent writes short QC after generation
```

Also append paths into a run log: `simon-generated/RUN_LOG.md`.

Use `GenerateImage` (Cursor) or equivalent. Prefer `aspect_ratio` `1:1` for storefront; `3:4` or `4:3` for editorial model; posts/promos later use `16:9`.

---

## 3. Product catalog (quick)

| ID | Folder | Colorways | Strap / material | Branding when insole visible |
|---|---|---|---|---|
| 01 | `01-knit-maryjane-buckle` | black, beige | Single **instep** strap + buckle / **ribbed knit** | `MODEL MATCH` |
| 02 | `02-knit-ballet-xstrap` | black, beige | **X elastic** (no buckle) / **ribbed knit** | `MODEL MATCH` |
| 03 | `03-knit-ankle-strap` | **beige only** | Wide **ankle** strap + large buckle / **knit** | `LUMIXIU SHOES` |
| 04 | `04-satin-ankle-strap` | cream, black-almond* | Wide **ankle** strap / **satin** | `MODEL MATCH` |
| 05 | `05-satin-maryjane` | cream, black-pink* | Single **instep** strap / **satin** | `MODEL MATCH` |
| 06 | `06-satin-ballet-xstrap` | cream, black-pink* | **X elastic** / **satin** (not knit) | `MODEL MATCH` |

\*AI-generated colorway — pair with physical `cream` (or listed `alsoAttachPhysical`) refs.

**Do not confuse:**
- 01 vs 05: knit vs satin Mary Jane (both instep buckle)
- 02 vs 06: knit vs satin X-strap
- 03 vs 04: knit vs satin ankle strap
- 03 has **no black** colorway
- 03 has **no real blush/pink** colorway — `blush/` refs are beige clones; catalog sells **beige `#D6C6A8` only**. Do not generate or reseed `#E8C4C4` as an active second CW.

For `sf-pair-or-sole`: colorway A → pair; colorway B → sole (keeps variety).

---

## 4. Editorial pose bank (use once each)

Assign **different** IDs to every `md-editorial-*` across the whole project. Mark used IDs in `simon-generated/POSE_BANK_USED.md`.

| Pose ID | Brief |
|---|---|
| P01 | Sitting on sunlit concrete city ledge, one knee up, shoes hero (Unsplash-adjacent energy) |
| P02 | Mid-stride crosswalk, motion blur background, shoes sharp |
| P03 | Sitting on café terrace chair, legs crossed at ankle, soft morning light |
| P04 | Looking down stairwell, camera above, shoes on step |
| P05 | Leaning on rain-wet railing, puddle reflection of shoes |
| P06 | Park bench, golden hour, one foot pointed toward camera |
| P07 | Bookstore aisle soft light, standing ¾, shoes in foreground |
| P08 | Apartment doorway threshold, stepping in |
| P09 | Rooftop / parking deck late afternoon, seated on curb |
| P10 | Market street walk, cropped mid-thigh to feet |
| P11 | Studio-adjacent lifestyle: colored wall mural backdrop, standing pose |
| P12 | Beach promenade / boardwalk wood planks, walking |
| P13 | Office lobby marble floor, elegant standing crop |
| P14 | Night street bokeh lights, seated on low wall |
| P15 | Garden stone path, soft shade, standing |
| P16 | Train platform / transit steps (no logos), seated |

**Outfit:** vary per shot (linen, denim, slip dress, wide trousers, etc.). Southeast / East Asian model preferred for Malaysian retail tone. No watermarks, no brand overlays, no illegible fake text in scene.

**Approved vibe example (already generated):**  
`assets/example-editorial-model-p01-beige-maryjane.jpg` (Cursor assets) — ledge sit, P01 beige knit Mary Jane. Do **not** copy this pose again.

---

## 5. Shared prompt templates

### 5.1 Storefront packshot

```text
Premium e-commerce studio packshot. Exact product match to reference photos.
{PROMPT_LOCK_SILHOUETTE_STRAP_UPPER_HEEL}.
Colorway: {COLORWAY_DESCRIPTION}.
{SHOT_SPECIFIC_ANGLE}.
Pure white background #F7F7F5, soft natural contact shadow, photorealistic,
Malaysian premium footwear retail.
Single product focus, no model, no hands, no props, no text, no watermark.
MUST include correct insole branding when the opening is visible: {BRANDING}.
MUST NOT: {MUST_NOT_LIST}.
```

### 5.2 Editorial model

```text
Cinematic fashion editorial photograph. Footwear is the clear hero.
Young Southeast or East Asian woman, natural styling, photorealistic skin.
Pose/scene: {POSE_BANK_BRIEF} — unique; do not reuse a prior scene.
Outfit: {OUTFIT}.
She wears the EXACT shoe from references: {PROMPT_LOCK + COLORWAY}.
Shallow depth of field, premium campaign lighting, no catalog tile floor,
no holding a spare shoe toward camera, no text, no watermark.
Product accuracy critical: strap type, material (knit vs satin), toe shape, heel, colors.
Attach reference images for product fidelity.
```

### 5.3 Always attach refs

From `manifest.json` → `products[id].colorways[name].refs`  
Absolute prefix:

`/Users/stanley/Documents/GIthub/asf-2/asf-2-next/scripts/storefront-curated-seed/simon-product-refs/`

For AI colorways also attach `alsoAttachPhysical` if present.

---

## 6. Agent sizing (200k context)

| Unit | Work | Why this size |
|---|---|---|
| **One colorway agent** | 6 images (4 SF + 2 MD) + QC note | Fits comfortably: read manifest slice + ~6–12 refs + 6 gens + file copies |
| **Do not** | All 6 products in one agent | Image outputs + refs will thrash context |
| **Do not** | One image per agent | Too small / wasteful |

**Recommended run order:** Product 01 black → 01 beige → 01 fallback → 02 … through 06.  
**Parallel OK:** different products in parallel; avoid two agents writing the same folder.

**Posts agent / Promos agent:** only after all 78 product images exist (they should pull from `simon-generated/products/` as style refs, plus physical refs for accuracy).

---

## 7. Agent task cards (copy one card per agent)

Each card is self-contained. Paste **one card** + tell the agent to read `manifest.json` for that product’s `promptLock` and refs.

---

### AGENT CARD — `P01-black`

```text
You are generating app media for Simon Product 01, colorway BLACK only.

## Context files (read these)
- asf-2-next/scripts/storefront-curated-seed/simon-product-refs/GENERATION_HANDOFF.md (§0–5)
- asf-2-next/scripts/storefront-curated-seed/simon-product-refs/manifest.json → product id "01", colorway "black"

## Product lock
- Knit Mary Jane, single INSTEP strap + buckle (NOT ankle, NOT X-strap)
- Black ribbed knit exterior; MODEL MATCH on tan insole when visible
- Refs under: …/01-knit-maryjane-buckle/black/ (all listed in manifest)

## Generate exactly 6 files into
…/simon-generated/products/01-knit-maryjane-buckle/black/
1. sf-hero-34.png — studio 3/4
2. sf-side.png — studio side
3. sf-topdown-insole.png — insole MODEL MATCH readable
4. sf-pair-or-sole.png — PAIR (both shoes) studio
5. md-editorial-a.png — pose from bank (claim unused ID in POSE_BANK_USED.md)
6. md-editorial-b.png — different unused pose ID

## Rules
- Refs = reference_image_paths only; not for app upload
- Editorial must be Unsplash-hero energy, unique poses, not tile feet crops
- Write _qc/01-black-notes.md: pass/fail per shot + pose IDs used
- Append to simon-generated/RUN_LOG.md

Stop after this colorway. Do not start beige or other products.
```

---

### AGENT CARD — `P01-beige`

```text
Same as P01-black but colorway BEIGE (oatmeal knit, dark brown heel/sole).
Output: …/01-knit-maryjane-buckle/beige/ (same 6 filenames).
sf-pair-or-sole = SOLE underside (floral pattern, size 37) to differ from black’s pair shot.
Claim two NEW pose IDs not used by P01-black.
Read manifest product 01 colorway beige refs + promptLock.
Stop after beige.
```

---

### AGENT CARD — `P01-fallback`

```text
Generate only sf-fallback.png for product 01 into
…/simon-generated/products/01-knit-maryjane-buckle/sf-fallback.png
Studio packshot, beige or black as primary listing hero (pick beige), #F7F7F5, 3/4.
Attach beige refs. No model. Short QC note. Stop.
```

---

### AGENT CARD — `P02-black` / `P02-beige` / `P02-fallback`

```text
Product 02 = KNIT ballet with TWO wide elastic X straps, NO buckle.
Folder: 02-knit-ballet-xstrap/{black|beige}/
Same 6-file pattern as P01 cards. Copy structure; swap promptLock/refs from manifest id "02".
pair vs sole: black→pair, beige→sole.
Unique pose IDs. Do not confuse with product 06 (satin X-strap).
```

---

### AGENT CARD — `P03-beige` / `P03-fallback`

```text
Product 03 = KNIT wide ANKLE strap + large buckle. Colorway: beige #D6C6A8 ONLY (no black, no blush).
Branding: LUMIXIU SHOES on insole when visible.
Folder: 03-knit-ankle-strap/beige/
Do NOT treat blush/ as a real CW — those refs are beige clones; #E8C4C4 stays inactive.
Same 6-file pattern for beige (+ fallback). Unique poses. Do not confuse with product 04 (satin ankle).
```

---

### AGENT CARD — `P04-cream` / `P04-black-almond` / `P04-fallback`

```text
Product 04 = SATIN wide ANKLE strap + buckle. MODEL MATCH branding.
cream = physical refs. black-almond = AI colorway: black exterior, almond lining + cream/white footbed
(attach cream refs + black-almond refs). Avoid wrinkled almond “pad” insole.
Folder: 04-satin-ankle-strap/{cream|black-almond}/
Same 6-file pattern. Unique poses.
```

---

### AGENT CARD — `P05-cream` / `P05-black-pink` / `P05-fallback`

```text
Product 05 = SATIN Mary Jane INSTEP strap + small buckle (not ankle).
cream physical; black-pink = black exterior + pink interior (attach cream + black-pink refs).
Folder: 05-satin-maryjane/{cream|black-pink}/
Same 6-file pattern. Unique poses. Do not confuse with 01 (knit) or 04 (ankle).
```

---

### AGENT CARD — `P06-cream` / `P06-black-pink` / `P06-fallback`

```text
Product 06 = SATIN (smooth, NOT knit) ballet with X elastic straps.
cream physical; black-pink = black exterior + pink interior.
Folder: 06-satin-ballet-xstrap/{cream|black-pink}/
Same 6-file pattern. Unique poses. Do not confuse with 02 (knit X-strap).
```

---

### AGENT CARD — `POSTS` (run after all products)

```text
Generate 8–10 post heroes (16:9) for Storefront feed/home.
Use simon-generated product images + physical refs for shoe accuracy.
Editorial lifestyle OK (models allowed) — each post unique scene.
Mix products across posts. No duplicate poses from product gallery.
Save to simon-generated/posts/post-01.png … and a posts_spec.json with prompts + linked product ids (placeholder UUIDs OK if catalog IDs not assigned yet).
Read GENERATION_HANDOFF §1.2. Stop after posts.
```

---

### AGENT CARD — `PROMOS` (run after posts)

```text
Generate 4–6 promo banners 16:9 with legible Chinese sale headlines
(e.g. 新季女鞋 / 会员专属) and Simon flats as product heroes.
Save to simon-generated/promos/. Write promo_spec.json.
Do not regenerate product galleries.
```

---

## 8. QC checklist (every agent)

For each image, note pass/fail:

- [ ] Correct product silhouette (strap type + material)
- [ ] Correct colorway (incl. interior rules for AI colors)
- [ ] Insole brand correct when visible
- [ ] Storefront: pure `#F7F7F5`, no model
- [ ] Editorial: unique pose ID, not catalog tile crop, shoes sharp
- [ ] Files saved to correct paths
- [ ] `POSE_BANK_USED.md` + `RUN_LOG.md` updated

**Fail → regenerate that shot only** before ending the turn.

---

## 9. Totals cheat sheet

| Item | Count |
|---|---|
| Products | 6 |
| Colorways | 12 |
| Images / colorway | 6 |
| Fallbacks | 6 |
| **Product images total** | **78** |
| Colorway agents | 12 |
| Fallback agents | 6 (or fold into first colorway agent if desired) |
| Posts | 8–10 |
| Promos | 4–6 |

---

## 10. Suggested operator message (paste to orchestrator)

```text
Implement Simon media generation using
asf-2-next/scripts/storefront-curated-seed/simon-product-refs/GENERATION_HANDOFF.md

Run ONE agent card at a time (start with P01-black).
Do not upload Simon ref WhatsApp photos to the app.
Follow pose bank uniqueness and editorial style rules.
When P01–P06 product images are done, run POSTS then PROMOS cards.
```

---

*Last updated: 2026-10-19 — aligned with simon-product-refs catalog + editorial direction approved in chat.*
