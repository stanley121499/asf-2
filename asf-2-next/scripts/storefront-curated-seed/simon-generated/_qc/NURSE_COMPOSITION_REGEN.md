# Nurse composition regen — 2026-10-28

## Intent (before → after)

| Before | After |
|---|---|
| Many waist-down / shin crops with near-identical walking pose | Majority **full-body or near-full-body** frames |
| Same corridor/white clinical backdrop with scrub color swap | Distinct **settings** + poses + camera heights per asset |
| Lifestyle felt like “outfit swapped on same crop” | Storytelling nurse-life scenes (station, break room, courtyard, commute, overnight) |
| Packshots mixed into lifestyle work historically | **PDP packshots untouched** (2-angle system preserved) |

## Counts regenerated

| Surface | Count | Notes |
|---|---|---|
| Posts (`post-01`…`post-10`) | **10** | Live feed / homepage |
| Promos (`promo-01`…`promo-06`) | **6** | Campaign banners w/ zh headlines |
| Product `md-editorial-a/b` | **24** | 6 products × 2 colorways × 2 |
| **Total** | **40** | |
| Storefront `sf-hero-34` / `sf-side` / fallback | **0** | Intentionally not regenerated |

Backup of prior assets: `simon-generated/_bak_nurse_comp_20261028/`

## Composition variety (shot audit)

### Posts (10)

| ID | Colorway shoe | Frame | Setting | Hospital? |
|---|---|---|---|---|
| post-01 | 01 beige MJ | full-body standing | nurses station + chart | yes |
| post-02 | 02 black X | full-body walking | overnight ward corridor | yes |
| post-03 | 03 blush ankle | seated near-full | staff break room | yes |
| post-04 | 04 cream satin ankle | full-body seated | hospital courtyard bench | yes (grounds) |
| post-05 | 05 black-pink MJ | full-body mid-stride | elevator lobby | yes |
| post-06 | 06 cream satin X | full-body doorway lean | scrub / utility doorway | yes |
| post-07 | 01 black MJ | near-full seated stool | overnight nurses station | yes |
| post-08 | 02 beige X | full-body commute | outdoor hospital grounds | nurse-life |
| post-09 | 06 black-pink X | full-body / env wide | overnight ward corridor | yes |
| post-10 | 05 cream MJ | full-body 3/4 walk | main lobby glass doors | yes |

**Full-body / near-full-body:** 10/10  
**Clearly clinical / hospital:** ~9/10 (post-08 commute outdoor)

### Promos (6)

All full-body model campaigns with zh headlines; settings: nurses station, lobby sofa, atrium corridor, courtyard, dusk entrance, overnight corridor.

### md-editorial (24)

Unique scene per colorway pair (scrub room, corridor day/night, elevator, break couch, lobby, courtyard, patient doorway, atrium, lounge, transit stop, pantry window, etc.). Majority full-body; a few seated mid/near-full for variety.

**Approx full-body:** ~20/24  
**Hospital / clinical:** ~18/24  
**Outdoor nurse-life / commute:** ~6/24

## Upload / DB

- Script: `../simon_nurse_comp_upload.py`
- Cache-bust token: **`?v=20261028nursecomp`**
- Storage upsert (webp, same paths):
  - `post_medias/storefront-curated/2026-10/simon/posts/{postId}.webp` × 10
  - `medias/storefront-curated/2026-10/simon/promos/{promoId}.webp` × 6
  - `product_medias/.../simon/products/{productId}/{colorId}/md-editorial-{a\|b}.webp` × 24
- DB updates:
  - `post_medias.media_url` → new `?v=20261028nursecomp` (10 rows)
  - `promotions.image_url` → new `?v=20261028nursecomp` (6 rows)
  - `posts.name` / `caption` refreshed to match new scenes
- **Not** re-inserted into color `product_medias` gallery (two-angle PDP intact). Editorials remain storage + disk for posts/promos primary lifestyle UX.
- URL maps: `.tmp/simon_nurse_comp_{editorial,post,promo}_urls.json`
- Apply SQL: `.tmp/simon_nurse_comp_apply.sql`

### CDN verify (sample)

| Asset | HTTP | last-modified |
|---|---|---|
| post-01 webp | 200 | 2026-10-28 |
| promo-01 webp | 200 | 2026-10-28 |
| 01-black md-editorial-a | 200 | 2026-10-28 |
| 01-black sf-hero-34 (`?v=3`) | 200 | **2026-10-25** (unchanged) |

## Preserved constraints

- [x] No WhatsApp/ref photos uploaded as app media
- [x] 2-angle storefront gallery unchanged
- [x] 01-black heel collar remains black on regenerated lifestyle shots (prompt-locked)
- [x] Shoe silhouette locks (MJ / X / ankle; knit vs satin) called out per prompt

## Residual / Simon device check

1. **Force-quit Expo / clear image cache** — URLs cache-busted but native Image may still show old blobs until restart.
2. Spot-check strap fidelity on device (esp. 03 ankle buckle size, 02/06 X straps vs MJ).
3. Promo Chinese text is AI-rendered into the image (not a separate overlay) — confirm glyphs look clean on phone.
4. `md-editorial-*` are **not** in PDP swipe gallery by design; lifestyle discovery is via posts/promos.
5. If any single shot still feels “same crop,” regenerate that one ID only using the shot list in this file.

## Device checklist

- [ ] Home feed posts show new full-body compositions
- [ ] Promo carousel shows new banners
- [ ] PDP still `1 / 2` packshots only
- [ ] 01 black MJ heel collar still black on packshots
