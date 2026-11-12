# HERO_GOLD_01_02 — Warm-neutral heroes + strap QC

**Date:** 2026-11-02  
**Scope:** Products **01** + **02** `sf-hero-34` (+ beige `sf-fallback` clones) only  
**Cache-bust:** `?v=20261102warm0102`  
**Method:** Full studio AI regen (GenerateImage + physical refs). **No rembg / cutouts.**  
**Not touched:** spin sets, `sf-side`, model slot2 / editorials / posts.

---

## Gold angle lock

Cream X PDP (Simon PASS attachment): elevated 3/4; **toe bottom-left**; **head/toe yaws slightly right**; soft contact shadow.

## Warm-neutral backdrops (NOT `#FFFFFF`)

| Product | Tint name | Documented hex (corner avg of shipped hero) | Notes |
|---|---|---|---|
| **01** | Warm stone | **`#DFCFBB`** `(223,207,187)` | Black hero corner sample; beige CW ~`#C5B7A5` (same stone family, slightly cooler mottling) |
| **02** | Warm sand | **`#EED1AB`** `(238,209,171)` | Beige hero/fallback; black CW ~`#F1CEA8` |

Fail LIVE screenshot used a cream/warm field — same language, distinct tint per product.

---

## Physical refs Read (strap truth)

### Product 01 — knit Mary Jane buckle

| CW | Refs Read | Strap truth |
|---|---|---|
| **black** | `topdown-insole-02.jpg`, `side-01.jpg`, `rear-01.jpg` | **Single** wide woven MJ strap (~1.5–2 cm) + matte black square buckle + silver prong; black padded heel collar; vertical rear webbing |
| **beige** | `front-insole-01.jpg`, `side-02.jpg`, `topdown-insole-01.jpg`, `rear-top-01.jpg` | Same MJ geometry; tonal beige buckle; tan padded collar |

`mustNot`: X straps.

### Product 02 — knit ballet X-strap

| CW | Refs Read | Strap truth |
|---|---|---|
| **black** | `topdown-insole-01.jpg`, `front-01.jpg`, `side-01.jpg`, `side-insole-01.jpg` | **Two** wide flat elastic bands; clean centered **X** over midfoot/opening; front attach at opening side seams mid-arch; rear wraps heel; taut tidy |
| **beige** | `topdown-01.jpg`, `side-hand-01.jpg`, `side-01.jpg`, `rear-01.jpg` | Same X geometry (cleanest topdown ground truth for width + crossing) |

### LIVE fail (user attachment)

`assets/image-6fb03cc1-…` = Product **02 black** PDP: **broken X** — pinched/fused look, asymmetrical crossing, not matching physical topdown distinct over/under bands. Used as negative only.

Proof grids (scratch): `_qc/.tmp-hero-gold-0102/cmp/cmp-02b-e.jpg`, `cmp-ship-candidates.jpg`, `cmp-strap-zooms.jpg`.

---

## Final vision QC (disk + CDN `?v=20261102warm0102`)

| Asset | BG warm? | Gold yaw? | Strap vs refs | Studio (not rembg) | Verdict |
|---|---|---|---|---|---|
| 01 black `sf-hero-34` | YES stone `#DFCFBB` | YES toe BL + slight right | MJ single wide + black buckle; collar present | YES soft shadow | **PASS** |
| 01 beige `sf-hero-34` | YES stone family | YES | MJ single + beige buckle; tan collar | YES | **PASS** |
| 01 `sf-fallback` | = beige hero | = | = | YES | **PASS** |
| 02 black `sf-hero-34` | YES sand | YES | Two distinct elastic X; mirrors beige hero geometry; **not** live-fail pinched X (see `cmp-02b-e`) | YES | **PASS** |
| 02 beige `sf-hero-34` | YES sand `#EED1AB` | YES | Clean taut X vs beige `topdown-01` / side-hand | YES | **PASS** |
| 02 `sf-fallback` | = beige hero | = | = | YES | **PASS** |

**Overall storefront heroes in scope: 6 / 6 PASS**

---

## Actions

1. Read physical refs both products × both CWs + live fail + cream gold angle.
2. Regenerated AI studio heroes on warm stone (01) / warm sand (02); iterated 02 black until X matched beige hero + physical topdown (not fail).
3. Installed PNG → `simon-generated/products/{01,02}/…/sf-hero-34.png`; copied beige heroes → `sf-fallback.png`.
4. Uploaded webp upserts; DB `product_medias` hero+fallback rows → `?v=20261102warm0102`.
5. Left `sf-side`, spin, model slot2 untouched.

## Live URLs

```
…/c1010001-…0001/fallback.webp?v=20261102warm0102
…/c1010001-…0001/c1500101-…0001/sf-hero-34.webp?v=20261102warm0102
…/c1010001-…0001/c1500101-…0002/sf-hero-34.webp?v=20261102warm0102
…/c1010001-…0002/fallback.webp?v=20261102warm0102
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261102warm0102
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261102warm0102
```

URL map: `storefront-curated-seed/.tmp/simon_warm0102_urls.json`
