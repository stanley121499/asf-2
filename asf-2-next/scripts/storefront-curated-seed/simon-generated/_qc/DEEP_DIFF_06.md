# DEEP_DIFF_06 — 缎面芭蕾交叉带平底鞋 (satin X-strap)

**Date:** 2026-11-01  
**Mode:** AUDIT ONLY — no regen, no upload  
**Product:** `c1010001-24a8-4f00-8000-000000000006` · 缎面芭蕾交叉带平底鞋  
**Trigger:** User PDP screenshot cream Angle A (`1/2`) — X-straps look wrong / floppy; **original straps much thicker**.  
**User artifact:** attached mobile screenshot (matches LIVE cream `sf-hero-34` / fallback).

Physical / colorway truth: `simon-product-refs/06-satin-ballet-xstrap/`  
Generated local: `simon-generated/products/06-satin-ballet-xstrap/`  
Live CDN bust: **`?v=20261101studio06`** (product 06 PDP packshots 5/5). Prior tokens (`deep06` / `p06qc` / `straptidy`) superseded for gallery.

**Prior QC context (do not treat as absolution):** `PER_PRODUCT_06.md` / `STRAP_TIDY_AUDIT.md` marked cream straps **PASS** for “taut vs prior floppy.” That pass **ignored width/thickness fidelity**. This deep diff overturns the comfort narrative. Post-fix below re-QCs LIVE `deep06` vs physical under the **width** standard (taut-only still invalid).

---

## Verdict (harsh)

**FAIL — buyer-risk HIGH (“different product”).**

Dominant delta vs physical cream + black-pink refs: **X-strap band width / elastic gauge**. Side-by-side strap crops show GEN/LIVE bands roughly **~35–45% narrower** in relative midfoot stack height than refs (cream side ~0.27 → ~0.16 of crop; black-pink side ~0.25 → ~0.14). Refs read as **dense, wide, coarse-ribbed structural elastic**; LIVE/GEN read as **narrow garment elastic** that still ripples / sags empty (cream hero) and looks dainty on-foot (lifestyle).

Secondary buyer-risk: black-pink **sole color invents chocolate brown** where colorway sole ref is **cream/off-white** (same family as cream physical sole). Cream **heel/sole warmth** also washed toward pale satin wrap.

Pink interior on black-pink: **present** (not missing) but **oversaturated** vs muted dusty/baby pink on refs — MAJOR color fidelity, not a missing-feature CRITICAL.

---

## Inventories

### A. Physical / colorway refs (`simon-product-refs/06-satin-ballet-xstrap/`)

| Colorway | Files (6 each) | Source |
|---|---|---|
| **cream** | `side-01.jpg`, `side-02.jpg`, `rear-01.jpg`, `topdown-01.jpg`, `topdown-insole-01.jpg`, `sole-01.jpg` | **Physical sample** (ground truth for silhouette / strap / heel / sole) |
| **black-pink** | same 6 filenames | **AI colorway canon** (manifest: generated 2026-10-19 from cream physical) — still the CW visual contract |

**Fidelity-test duplicates:** `_fidelity-tests/06-satin-ballet-xstrap/generated-black-pink-{side-01,side-02,rear-01,topdown-01,topdown-insole-01,sole-01}.jpg` (6) — historical BP gens; **not** PDP media.

**Ref count:** cream 6 + black-pink 6 + fidelity 6 = **18** (refs never uploaded as app media).

### B. Generated local (`simon-generated/products/06-satin-ballet-xstrap/`)

| Path | Role |
|---|---|
| `sf-fallback.png` | Listing fallback (= cream Angle A) |
| `cream/sf-hero-34.png` | PDP Angle A |
| `cream/sf-side.png` | PDP Angle B |
| `cream/sf-topdown-insole.png` | Storage only (not live 2-angle gallery) |
| `cream/sf-pair-or-sole.png` | Storage only |
| `cream/md-editorial-a.png` / `md-editorial-b.png` | Lifestyle storage |
| `black-pink/sf-hero-34.png` | PDP Angle A |
| `black-pink/sf-side.png` | PDP Angle B |
| `black-pink/sf-topdown-insole.png` | Storage only |
| `black-pink/sf-pair-or-sole.png` | Storage only |
| `black-pink/md-editorial-a.png` / `md-editorial-b.png` | Lifestyle storage |

**Local gen count:** **13** files.

Related lifestyle (outside product folder): `posts/post-06.png` (cream), `posts/post-09.png` (black-pink), `promos/promo-06-evening.jpg`.

### C. Live Supabase / CDN (spot-check 2026-11-01)

Product medias (**5 / 5** for 06):

| Surface | color_id | URL token | HTTP | Last-Modified |
|---|---|---|---|---|
| fallback | null | `…/0006/fallback.webp?v=20261101p06qc` | 200 | 09:49:49 GMT |
| cream hero | `…0001` `#F5F0E8` | `…/0001/sf-hero-34.webp?v=20261101p06qc` | 200 | 09:49:49 GMT |
| cream side | `…0001` | `…/0001/sf-side.webp?v=20261101p06qc` | 200 | 09:49:49 GMT |
| black-pink hero | `…0002` `#111111` | `…/0002/sf-hero-34.webp?v=20261101p06qc` | 200 | 09:49:49 GMT |
| black-pink side | `…0002` | `…/0002/sf-side.webp?v=20261101p06qc` | 200 | 09:49:49 GMT |

Decoded LIVE webp ≈ local PNG (MAD ~0.6–1.0; webp loss). **User screenshot = LIVE cream hero.**

Posts:

| Post | media |
|---|---|
| `c201…0006` 换衣间门口 · 缎面芭蕾 | `…/posts/c201…0006.webp?v=20261101p06qc` |
| `c201…0009` 夜间病房 · 黑粉芭蕾 | `…/posts/c201…0009.webp?v=20261101straptidy` |

Promo: `c301…0006` 夜色轻舞 → `…/promos/c301…0006.webp?v=20261101straptidy`.

---

## Physical truth cheat-sheet (what refs actually show)

### Cream (physical)

- **Upper:** low-luster cream satin / matte-satin; soft square toe.
- **X-straps:** **wide** matching cream **coarse-ribbed elastic**; empty sample shows some natural slack/wave at heel wrap — but bands are **visually thick / high gauge**.
- **Crossing:** substantial midfoot X; attachment occupies a large vertical share of the quarter.
- **Interior:** light tan / cream lining + cream footbed; black MODEL MATCH crest when open. **Not pink.**
- **Heel:** distinct **warm yellowish / goldish cream block** (not satin-camouflaged pale).
- **Sole:** **pale yellowish cream** outsole; floral/clover forefoot grid; size **37** circle; ridged heel block (`sole-01`).

### Black-pink (colorway canon refs)

- **Upper:** matte black satin-ish; soft square toe.
- **X-straps:** **wide black coarse-ribbed elastic** (same layout as cream).
- **Interior:** **pink** lining + pink-toned insole; black MODEL MATCH.
- **Heel:** low black block; thin black edge in side shots.
- **Sole (`sole-01`):** **cream/off-white** outsole (floral grid + 37 + ridged heel) — **not** dark chocolate. Manifest `promptLock.sole.color: "Dark brown"` is **wrong vs these refs**.

---

## Focus axes (user-flagged)

| Axis | Physical / ref | LIVE / GEN | Severity |
|---|---|---|---|
| **X-strap width** | Wide structural band (~¼–⅓ of midfoot stack in side crops) | Narrow ribbon (~½ of ref relative height) | **CRITICAL** |
| **X-strap thickness / gauge** | Dense coarse ribs; bulk at edges | Fine ribs; paper-thin profile; still ripples empty | **CRITICAL** |
| **Floppy / tension** | Empty physical has some slack; still “heavy elastic” | Cream LIVE hero still soft/wavy; lifestyle cream still soft | **CRITICAL** (cream PDP) / **MAJOR** (bp packshot taut but still thin) |
| **Crossing geometry** | Lower/bulkier overlap; wide attachment | Higher/sharper X; skinny insert into topline | **CRITICAL** (silhouette change) |
| **Heel** | Cream: warm yellow block. BP: black block | Cream: pale satin-wrap + washed sole. BP: OK black but sole lip | **MAJOR** (cream) / **MINOR–MAJOR** (bp) |
| **Sole** | Cream + BP refs: **pale cream** outsole family | Cream pair shot: warm tan wrong tone. BP pair shot: **chocolate brown** | **CRITICAL** (bp sole invent) / **MAJOR** (cream sole tone) |
| **Satin** | Soft textile grain | Cream: plastic pearlescence. BP: dead matte / faux-leather | **MAJOR** |
| **Pink interior (bp only)** | Muted dusty / baby pink | Present; brighter bubblegum; pink rim OK on side | **MAJOR** (hue) — not missing |
| **Buyer-risk different product** | Wide-strap satin ballet with pale sole | Thin-strap delicate ballet; cream floppy; bp sole brown if shown | **YES — HIGH** |

---

## Shot-by-shot

### LIVE PDP (what the buyer sees) — 5 assets

| Shot | CW | vs ref | Notes | Grade |
|---|---|---|---|---|
| `sf-hero-34` / fallback | cream | cream `side-01` / `topdown-*` | **User-fail surface.** Thin floppy X; fine rib; high sharp cross; pale heel vs warm block; satin over-smooth. Matches user screenshot. | **CRITICAL FAIL** |
| `sf-side` | cream | cream `side-02` | Strap width collapse obvious in side crop; attachment stub skinny; sole lip thicker/paler than physical thin warm edge; topline piping heavier. | **CRITICAL FAIL** |
| `sf-hero-34` | black-pink | bp `side-01` / `topdown-insole` | Pink interior + MODEL MATCH visible — good presence. Straps still **too narrow**; satin too matte; X less bulky. | **CRITICAL FAIL** (width) |
| `sf-side` | black-pink | bp `side-02` | Thin elastic vs wide ref; pink rim oversaturated; visible sole lip; mild edge wobble. | **CRITICAL FAIL** (width) |

### Storage / non-gallery gens — still fidelity debt

| Shot | CW | vs ref | Grade |
|---|---|---|---|
| `sf-topdown-insole` | cream | cream `topdown-insole-01` | Narrower straps; lower/wider V vs ref; warmer flesh lining; crest layout drift; rolled piping. | **CRITICAL** (strap) + **MAJOR** (geometry/lining) |
| `sf-topdown-insole` | black-pink | bp `topdown-insole-01` | Straps thinner; pink brighter; collar soft/wavy; satin dead. | **CRITICAL** (strap) + **MAJOR** (pink/satin) |
| `sf-pair-or-sole` | cream | cream `sole-01` | Pair composition invent; sole RGB warmer/lighter than physical olive-cream; straps thin/floppy on pair. | **MAJOR** (sole tone) + **CRITICAL** (strap) |
| `sf-pair-or-sole` | black-pink | bp `sole-01` | **Chocolate brown sole** vs ref **cream sole** — invents wrong SKU language. Straps thin/floppy at edge. | **CRITICAL** (sole color) + **CRITICAL** (strap) |
| `md-editorial-a/b` | cream | cream sides | On-foot X **thin** (~1 cm visual); some slack; nurse comps. | **CRITICAL** (strap width) |
| `md-editorial-a/b` | black-pink | bp sides | Pink insole clear (good); straps thin; satin flat. | **CRITICAL** (strap) / **PASS-ish** pink presence |
| `posts/post-06` | cream lifestyle | cream | Same thin floppy X narrative as PDP. LIVE `?v=20261101p06qc`. | **CRITICAL FAIL** |
| `posts/post-09` | bp lifestyle | bp | Pink piping OK; straps still narrow vs ref width; taut on foot masks gauge. | **MAJOR–CRITICAL** (width) |
| `promos/promo-06` | bp campaign | bp | Pink insole readable historically; strap width still thin-family. | **MAJOR** |

### Ref-only notes (no gen counterpart in live gallery)

| Ref | Observation |
|---|---|
| cream `rear-01` | Vertical satin heel strip + elastic through heel; soft structure; wide straps still. Gen packshots underplay strip bulk. |
| bp `rear-01` | Pink cavity loud; straps can look slack empty — gauge still wider than LIVE. |
| cream/bp `sole-01` | Shared pale cream outsole language + floral + 37 + ridged heel. Gen bp sole **breaks** this. |

---

## Severity rollup (unique findings)

### CRITICAL — 6

1. **X-strap width** systematically thinner than cream + bp refs (LIVE + local + lifestyle).  
2. **X-strap thickness / elastic gauge** — flimsy fine-rib vs dense coarse-rib (user: “original much thicker”).  
3. **Cream LIVE Angle A still floppy / soft** — user screenshot = CDN; prior “taut PASS” insufficient.  
4. **Crossing geometry / silhouette** changed by skinny straps (dainty ballet vs chunky X ballet).  
5. **Black-pink `sf-pair-or-sole` sole color** chocolate vs ref cream sole.  
6. **Buyer-risk different product** on primary cream PDP + reinforced by lifestyle thin straps.

### MAJOR — 7

1. Cream **heel color/construction** (warm yellow block → pale satin wrap).  
2. Cream **sole edge tone / lip thickness**.  
3. **Satin read** wrong both ways (cream too glossy synthetic; bp too matte leather).  
4. Black-pink **pink oversaturation** (bubblegum vs dusty).  
5. **Topline piping / collar** heavier / soft-wavy vs flush physical.  
6. Cream **topdown geometry** (X placement / V shape) off.  
7. Manifest / promptLock **`sole.color: Dark brown`** contradicts physical + bp sole refs (process debt that enabled sole drift).

### MINOR — 5

1. MODEL MATCH crest micro-layout / year cartouche variance.  
2. Toe box soft-round vs sharper square in some gens.  
3. Empty physical cream also has natural elastic slack (truth is not rigid ribbon) — but that does **not** excuse thinner gauge.  
4. Black-pink side heel height micro variance.  
5. Promo/post cache tokens split (`p06qc` vs `straptidy`) — ops noise only.

---

## Buyer-risk statement

A shopper comparing LIVE cream Angle A (screenshot) to a real sample / factory photo would conclude:

- Straps are a **different component** (narrow soft elastic vs wide heavy elastic).  
- The shoe feels **cheaper / flimsier** in media than physical.  
- On black-pink, if sole imagery ever surfaces, **brown vs cream sole** reads as **another SKU**.  
- Pink lining exists (good) but hue push still adds “styled different” risk.

**Not** a soft residual. **Not** absolved by “straps are tidier than last week.” Thickness/width is the product identity for this X-strap silhouette.

---

## Counts

| Bucket | Count |
|---:|---:|
| Physical cream refs | 6 |
| Black-pink colorway refs | 6 |
| Fidelity-test BP gens | 6 |
| Local generated product files | 13 |
| Live `product_medias` rows (06) | 5 |
| Live related posts audited | 2 |
| Live promo audited | 1 |
| LIVE/local PDP shots graded | 5 |
| **CRITICAL findings** | **6** |
| **MAJOR findings** | **7** |
| **MINOR findings** | **5** |
| Overall product grade | **FAIL** |
| Buyer-risk “different product” | **HIGH — YES** |

---

## Explicit non-actions (audit-only section above)

- Audit section itself performed no regen.  
- Refs remain off-app.

## Regen gates (still open after Post-fix)

1. Lock strap **width ≥ physical** (side + topdown) — **still open** on LIVE `deep06`.  
2. Cream: restore **warm yellow heel block** + soft satin (not over-corded elastic / plastic pearl).  
3. Black-pink: keep muted pink; cream sole language is now correct (do not force black outsole).  
4. Re-audit LIVE cream hero against cream `side-01`/`side-02`/`topdown-01` before any width PASS.

---

## Post-fix — `?v=20261101deep06` (2026-11-01)

**Mode:** FIX + LIVE vision re-QC vs physical / colorway refs.  
**Token:** `?v=20261101deep06` on product 06 `product_medias` (5/5), post-06, post-09, promo-06.  
**CDN spot-check:** HTTP 200 webp; cream hero `Last-Modified: Sun, 01 Nov 2026 10:13:04 GMT`.  
**URL map:** `../.tmp/simon_deep06_urls.json`  
**Local backup:** `simon-generated/_bak_deep06_20261101/`  
**Proof grids:** `_qc/.tmp-p06-deep06/LIVE-QC-cream-v6.png`, `LIVE-QC-bp-v6.png`

### What shipped

| Surface | Action |
|---|---|
| cream `sf-hero-34` / `sf-side` / `sf-fallback` | Regenerated thicker X; warm cream heel (no gold plate); uploaded |
| black-pink `sf-hero-34` / `sf-side` | Regenerated thicker black X; muted pink; cream sole lip; uploaded |
| cream + bp `sf-topdown-insole`, `sf-pair-or-sole`, `md-editorial-*` | Regenerated; storage upsert |
| `posts/post-06`, `posts/post-09` | Regenerated + uploaded + DB `?v=` |
| `promos/promo-06-evening` | Regenerated + uploaded (`medias` bucket) + DB `?v=` |
| `manifest.json` promptLock | `sole.color` → pale cream/off-white (both CWs); strap width lock; mustNot skinny ribbon / chocolate sole / bubblegum pink / gold heel |

### LIVE vs ref — harsh re-grade

| Shot | Width vs physical | Other | Grade |
|---|---|---|---|
| cream Angle A / fallback | **Improved vs p06qc thin ribbon**, still **under** cream `topdown-01` / `side-02` plank mass | Warm cream heel OK-ish; satin soft; MODEL MATCH visible | **CRITICAL residual (width)** |
| cream Angle B | Better than prior skinny; still short of physical side-02 relative midfoot fill | Corded rib overcooked vs physical finer elastic | **CRITICAL residual (width)** + **MAJOR (rib texture)** |
| bp Angle A | Closer; still leaves more pink triangle than bp topdown chunky X | Muted pink OK; cream sole lip **correct** vs sole-01 (not chocolate) | **MAJOR–CRITICAL residual (width)** |
| bp Angle B | Improved mass; may still read slightly thinner than bp/cream physical sides | Cream sole lip OK; pink muted | **MAJOR residual (width)** |
| bp `sf-pair-or-sole` (storage) | — | **Chocolate sole FIXED → pale cream** matching sole-01 | **PASS (sole color)** |
| cream floppy Angle A | — | No longer soft/wavy empty ribbon; packshot tension OK | **PASS (floppy CRITICAL cleared)** |

### Severity after fix

#### FIXED (cleared from prior CRITICAL/MAJOR rollup)

1. ~~Cream LIVE Angle A floppy / soft~~ → taut packshot tension OK (width still separate).  
2. ~~Black-pink `sf-pair-or-sole` chocolate sole~~ → cream/off-white sole language.  
3. ~~Manifest `sole.color: Dark brown` process debt~~ → pale cream lock.  
4. Black-pink pink oversaturation → dialed to muted dusty/baby (soft residual only).  
5. Prior taut-only “PASS” narrative explicitly superseded by width re-QC.

#### REMAINING CRITICAL — 3

1. **X-strap width** still below cream physical (LIVE cream A/B clearest; bp improved but not fully matched to topdown plank coverage). User “original much thicker” not fully closed.  
2. **Crossing geometry / silhouette** still slightly daintier than chunky physical X while width residual remains.  
3. **Buyer-risk “different product”** still **elevated** on cream PDP until width matches `side-02` / `topdown-01` plank mass (reduced vs p06qc ribbon, not gone).

#### REMAINING MAJOR — 4

1. Cream **strap rib texture** over-corded / coarse vs physical smoother fine elastic.  
2. Cream **heel / sole edge warmth** still slightly yellow-shifted vs physical olive-cream.  
3. Cream **satin** can still read synthetic vs soft textile grain.  
4. Lifestyle (post-06/09, editorials, promo-06) width improved with packshots but not independently proven equal to physical gauge.

#### MINOR — unchanged / soft

MODEL MATCH micro-layout; toe soft-square variance; empty physical natural slack is not an excuse for thin gauge.

### Counts (post-fix)

| Bucket | Pre-fix | Post-fix remaining |
|---|---:|---:|
| CRITICAL | 6 | **3** |
| MAJOR | 7 | **4** |
| Overall | FAIL | **FAIL** (width gate open) |
| Buyer-risk different product | HIGH | **MEDIUM–HIGH** (improved, not clear) |

### Verdict

**FAIL — do not call width PASS.** `deep06` cleared floppy cream + chocolate BP sole + manifest sole debt and thickened straps vs `p06qc`, but LIVE cream A/B still fail the physical **width** standard that invalidated the prior tautness-only pass. Next regen must overshoot strap width to cream `topdown-01` / `side-02` plank coverage before any PASS.

---

## Studio regen confirm — `?v=20261101studio06` (2026-11-01)

**Confirmed:** full professional studio packshots (no rembg, no crops).

| Shot | Studio | Angle | Notes |
|---|---|---|---|
| cream Angle A / fallback | white seamless + soft contact shadow | toe bottom-left 3/4 | thick cream X, taut; warm cream heel/sole |
| cream Angle B | white seamless + soft contact shadow | side left | clear dual X bands, thick + tidy |
| black-pink Angle A | white seamless + soft contact shadow | toe bottom-left 3/4 | thick black X, taut; muted pink + MODEL MATCH; cream sole lip |
| black-pink Angle B | white seamless + soft contact shadow | side left | thick black X, dusty pink rim; cream sole lip |

CDN: HTTP 200 webp, cream hero `Last-Modified: Sun, 01 Nov 2026 10:16:04 GMT`.  
URL map: `../.tmp/simon_studio06_urls.json`. Backup: `_bak_studio06_20261101/`.
