# HERO_MUTE_BG_01_02 — muted BG + thicker 02 X + camera-facing yaw

**Date:** 2026-11-02  
**Scope:** Products **01** + **02** `sf-hero-34` (+ beige `sf-fallback` clones) only  
**Cache-bust:** `?v=20261102mute0102`  
**Method:** Full studio AI regen (GenerateImage + physical refs). **No rembg / cutouts.**  
**Not touched:** spin sets, `sf-side`, model slot2 / editorials / posts.

---

## Why (vs `?v=20261102warm0102`)

User home-grid feedback:

1. Warm-neutral heroes read **too bright / too peachy** (`#DFCFBB` / `#EED1AB`).
2. **Product 02 black X-straps too thin** vs physical plank elastic.
3. **“Slightly more right”** = shoe should **point toward the camera more** (face-on elevated 3/4). **01 black** was the worst flat left-profile mismatch on the grid.

---

## Muted warm-gray backdrops (NOT peach sand)

| Product | Tint name | Target | Corner avg (shipped PNG) | Notes |
|---|---|---|---|---|
| **01** | Quiet stone | **`#E8E4DF`** | black **`#EBE9E4`** `(235,233,228)` · beige **`#E8E7E3`** `(232,231,227)` | Low chroma (~5–7); light quiet oatmeal |
| **02** | Quiet linen | **`#EDEAE6`** | black **`#EBE8E3`** `(235,232,227)` · beige **`#E9E6E1`** `(233,230,225)` | Low chroma (~8); slightly warmer/linen vs 01, still muted |

Old warm0102 for contrast: 01 `#DFCFBB` chroma~36 · 02 `#EED1AB` chroma~67.

---

## Camera yaw (gold / face-on family)

Elevated 3/4; **toe bottom-left**; **head/toe yawed toward viewer** so soft-square toe face + vamp top + opening are visible (not a long side silhouette). Locked to cream gold-angle pass + shared 01/02 hero family after mute regen.

Especially fixed **01 black** vs prior flat left-profile grid fail.

---

## Strap QC vs physical refs

### Product 01 — knit Mary Jane buckle

| CW | Refs Read | Strap truth | Shipped |
|---|---|---|---|
| black | `topdown-insole-02.jpg`, `side-01.jpg` | Single wide woven MJ strap (~1.5–2 cm) + matte black square buckle + silver prong; black padded collar | **PASS** — wide strap + buckle present |
| beige | `topdown-insole-01.jpg`, `front-insole-01.jpg` | Same MJ geometry; tonal beige buckle; tan collar | **PASS** |

`mustNot`: X straps.

### Product 02 — knit ballet X-strap

| CW | Refs Read | Strap truth | Shipped |
|---|---|---|---|
| **black** | `topdown-insole-01.jpg`, `side-01.jpg`, `side-insole-01.jpg` + cream gold pass | Two **wide plank** elastic bands (~¼–⅓ toe-box width); clean taut X; black heel | **PASS** — widened vs warm0102 thin fail (see `cmp-02black-strap-v6.jpg`) |
| **beige** | `topdown-01.jpg`, `side-hand-01.jpg`, `side-01.jpg` | Same X plank geometry | **PASS** — matched black hero width + physical |

Proof: `_qc/.tmp-mute0102/gen/cmp-02black-strap-v6.jpg` (PHYS topdown | OLD warm thin | NEW v6).

---

## Final vision QC (disk + CDN `?v=20261102mute0102`)

| Asset | BG muted low-chroma? | Face-on yaw family? | Strap vs refs | Studio (not rembg) | Verdict |
|---|---|---|---|---|---|
| 01 black `sf-hero-34` | YES `#EBE9E4` | YES (fixed vs flat profile) | MJ wide + black buckle | YES soft shadow | **PASS** |
| 01 beige `sf-hero-34` | YES `#E8E7E3` | YES | MJ wide + beige buckle | YES | **PASS** |
| 01 `sf-fallback` | = beige hero | = | = | YES | **PASS** |
| 02 black `sf-hero-34` | YES `#EBE8E3` | YES | Thick X plank vs topdown | YES | **PASS** |
| 02 beige `sf-hero-34` | YES `#E9E6E1` | YES | Thick X plank vs topdown/side-hand | YES | **PASS** |
| 02 `sf-fallback` | = beige hero | = | = | YES | **PASS** |

**Overall storefront heroes in scope: 6 / 6 PASS**

---

## Actions

1. Read physical refs (01 MJ + 02 X) + gold angle pass + user grid fails.
2. Iterated studio heroes until muted BG hexes, face-on yaw family, and 02 X plank thickness matched refs (vision strap zoom).
3. Installed PNG → `simon-generated/products/{01,02}/…/sf-hero-34.png`; beige → `sf-fallback.png`.
4. Uploaded webp upserts; DB `product_medias` hero+fallback → `?v=20261102mute0102`.
5. Left `sf-side`, spin, model slot2 untouched.

## Live URLs

```
…/c1010001-…0001/fallback.webp?v=20261102mute0102
…/c1010001-…0001/c1500101-…0001/sf-hero-34.webp?v=20261102mute0102
…/c1010001-…0001/c1500101-…0002/sf-hero-34.webp?v=20261102mute0102
…/c1010001-…0002/fallback.webp?v=20261102mute0102
…/c1010001-…0002/c1500201-…0001/sf-hero-34.webp?v=20261102mute0102
…/c1010001-…0002/c1500201-…0002/sf-hero-34.webp?v=20261102mute0102
```

URL map: `storefront-curated-seed/.tmp/simon_mute0102_urls.json`
