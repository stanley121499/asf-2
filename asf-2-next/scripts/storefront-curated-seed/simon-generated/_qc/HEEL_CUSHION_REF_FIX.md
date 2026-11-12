# Heel cushion ref fix — 2026-11-01

## Bug

PDP screenshot of Simon **03** blush knit ankle-strap flat showed an invented **padded back cushion / pillow heel collar** at the Achilles. Physical samples do **not** have that.

Do **not** confuse with **01** Mary Jane, which **does** have a smooth padded heel collar (black colorway = black collar).

## Refs — product 03 heel/back (truth)

Physical refs under `simon-product-refs/03-knit-ankle-strap/`:

| View | What heel/back shows |
|---|---|
| `beige/rear-01.jpg`, `beige/extra-rear-01.jpg` | Slim flush topline; **no** pillow pad. Flat tan lining. Center-back **smooth vertical strip** with stitching; ankle strap through a **small flat loop** (pull-tab loop). |
| `beige/side-01.jpg`, `beige/side-02.jpg` | Same: thin heel rim; vertical strip/loop only. |
| `blush/side-01.jpg`, `blush/side-02.jpg` | Same construction in blush; no rear photos for blush — use beige rear for heel geometry. |

**Wrong in prior generated:** bulbous stuffed horizontal “comfort pillow” at heel collar (visible on 3/4 heroes, sides, fallback, lifestyle).

## Regenerated (local + storage upsert)

Cache-bust token: **`?v=20261101nocushion`**  
2-angle gallery preserved (arr 10 hero + 11 side).

### Product 03 (primary fix)

| File | Action |
|---|---|
| `blush/sf-hero-34.png` | Regenerated (no fake cushion; LUMIXIU SHOES) |
| `blush/sf-side.png` | Regenerated |
| `beige/sf-hero-34.png` | Regenerated |
| `beige/sf-side.png` | Regenerated |
| `sf-fallback.png` | = beige Angle A |
| `blush/md-editorial-a.png`, `blush/md-editorial-b.png` | Regenerated (storage; not in PDP gallery) |
| `beige/md-editorial-a.png`, `beige/md-editorial-b.png` | Regenerated (storage) |
| `posts/post-03.png` | Regenerated + uploaded |
| `promos/promo-05-commute.jpg` | Regenerated + uploaded |

### Cross-SKU audit

| SKU | Refs heel | Generated before | Action |
|---|---|---|---|
| **01** MJ | **Has** padded collar (black=black) | Correct rule | No change |
| **02** X-strap black | Vertical strip + pull tab; **no** pillow | Side PASS | No change |
| **02** X-strap beige | Same — **no** pillow | Invented pillow on hero/side | Regenerated beige hero/side + fallback |
| **03** | **No** pillow | Invented pillow | Fixed (above) |
| **04** cream satin | Rear/side-rear: thin rim, **no** pillow | Invented collar pad on cream packshots + lifestyle | **Fixed** in follow-up below (`?v=20261101nocushion04`) |
| **05 / 06** | Different construction / intentional pink interiors | Not the 03 pillow bug | Left |

## Manifest promptLock updates

- `03`: `heelCollar: NONE`; mustNot padded back cushion
- `02`: same NONE rule
- `04`: same NONE rule (for future gens)

## Upload / DB

- Bucket upserts (webp) same paths under `storefront-curated/2026-10/simon/…`
- `product_medias` cache-bust for 03 fallback+both angles and 02 beige fallback+angles → `?v=20261101nocushion`
- `post_medias` / `promotions.image_url` for post-03 / promo-05 → same token
- URL map: `../.tmp/simon_nocushion_urls.json`

### Sample URLs

```
…/c1010001-…0003/c1500301-…0001/sf-hero-34.webp?v=20261101nocushion
…/c1010001-…0003/c1500301-…0001/sf-side.webp?v=20261101nocushion
…/c1010001-…0003/fallback.webp?v=20261101nocushion
```

CDN check: hero/side/fallback `last-modified` 2026-11-01 ~08:29 UTC, HTTP 200 webp.

---

## Follow-up — product 04 cream (2026-11-01 later)

Prior pass updated `manifest.json` `mustNot` for 04 but left hallucinated cream packshots on disk/CDN.

### Refs — product 04 heel/back (truth)

Physical refs under `simon-product-refs/04-satin-ankle-strap/`:

| View | What heel/back shows |
|---|---|
| `cream/rear-01.jpg`, `cream/side-rear-01.jpg` | Slim flush topline into flat tan lining; **no** pillow pad. Center-back vertical satin strip; wide ankle strap + cream covered buckle. |
| `cream/side-01.jpg` | Same thin heel rim; no rolled Achilles cushion. |
| `black-almond/rear-01.jpg`, `black-almond/side-01.jpg` | Same construction (black exterior, almond lining); **no** padded collar. |

### Audit before regen

| Asset | Heel pad? | Action |
|---|---|---|
| `cream/sf-hero-34.png` | FAIL — invented pillow | Regenerated |
| `cream/sf-side.png` | FAIL / residual collar | Regenerated |
| `sf-fallback.png` | FAIL (= old cream hero) | = new cream Angle A |
| `black-almond/sf-hero-34.png`, `sf-side.png` | PASS (thin rim) | Left |
| `cream/md-editorial-a.png` | PASS | Left |
| `cream/md-editorial-b.png` | FAIL | Regenerated |
| `black-almond/md-editorial-b.png` | FAIL (puffy collar on foot) | Regenerated |
| `posts/post-04.png` | FAIL | Regenerated |
| `promos/promo-02-members.jpg` | FAIL | Regenerated |

### Regenerated (local + storage upsert)

Cache-bust token: **`?v=20261101nocushion04`**  
2-angle gallery preserved (cream arr 10 + 11; black-almond unchanged).

| File | Action |
|---|---|
| `cream/sf-hero-34.png` | Regenerated (thin heel; MODEL MATCH; cream buckle) |
| `cream/sf-side.png` | Regenerated (Angle B left; thin heel) |
| `sf-fallback.png` | = cream Angle A |
| `cream/md-editorial-b.png` | Regenerated (storage; not in PDP gallery) |
| `black-almond/md-editorial-b.png` | Regenerated (storage) |
| `posts/post-04.png` | Regenerated + uploaded |
| `promos/promo-02-members.jpg` | Regenerated + uploaded |

### Upload / DB (04)

- Packshot webp upserts under cream colorway + product fallback paths
- Editorial webp upserts (storage only)
- Post → `post_medias` bucket `…/posts/{postId}.webp`
- Promo → `medias` bucket `…/promos/{promoId}.webp`
- `product_medias` cream fallback + Angle A/B → `?v=20261101nocushion04`
- `post_medias` post-04 + `promotions.image_url` promo-02 → same token
- URL map: `../.tmp/simon_nocushion04_urls.json` / `simon_nocushion04_db.json`

### Sample URLs

```
…/c1010001-…0004/c1500401-…0001/sf-hero-34.webp?v=20261101nocushion04
…/c1010001-…0004/c1500401-…0001/sf-side.webp?v=20261101nocushion04
…/c1010001-…0004/fallback.webp?v=20261101nocushion04
```

CDN check: cream hero/side/fallback + post-04 + promo-02 `last-modified` 2026-11-01 ~08:36–08:37 UTC, HTTP 200 webp.
