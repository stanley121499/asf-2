# Simon strap-tidy audit — 2026-11-01

Physical truth: `simon-product-refs/`  
Generated: `simon-generated/`  
Live gallery: **2 angles + fallback only** (`sf-hero-34`, `sf-side`, `sf-fallback`)  
Cache-bust token: **`?v=20261101straptidy`**

Trigger: PDP screenshot of **06 cream / Angle A (1/2)** — X-straps limp, rippled, uneven tension, slightly off-center vs premium packshot standard.

## Scope audited

| Surface | Count | Notes |
|---|---:|---|
| Live packshots (2 angles × 12 CWs + 6 fallbacks) | 30 | Strap QC focus |
| Lifestyle posts with prominent straps | 2 | `post-05` (05 MJ), `post-09` (06 X) |
| Kept without regen | 03 all, 04 black-almond, 05 black-pink | Already structured / soft-pass |

Refs never uploaded as app media.

## Before (strap FAIL)

| Asset | Issue |
|---|---|
| `06-cream/sf-hero-34` | Floppy X, ripples, off-center (user screenshot) |
| `06-cream/sf-side` | Same limp elastic / uneven X |
| `06/sf-fallback` | Cream hero copy |
| `06-black-pink` hero + side | Floppy / rippled X |
| `02` black + beige hero + side + fallback | Floppy X |
| `01` black + beige hero + side | MJ strap slack / buckle crumple |
| `04-cream` hero (+ side soft) | Collapsed ankle strap |
| `05-cream` hero + side (stricter) | Soft MJ arch / buckle bulk |
| `post-05` | MJ strap ripples on foot |
| `post-09` | X-strap ripples on foot |

**Hard strap fails regenerated:** 16 packshots + 5 fallbacks refreshed from heroes + 2 posts.

## Regenerated + uploaded

### Packshots

| Path | Fix |
|---|---|
| `06-satin-ballet-xstrap/cream/sf-hero-34.png` | Taut centered X; cream/pale sole preserved |
| `06-satin-ballet-xstrap/cream/sf-side.png` | Taut X; Angle B left |
| `06-satin-ballet-xstrap/sf-fallback.png` | Copied from cream hero |
| `06-satin-ballet-xstrap/black-pink/sf-hero-34.png` | Taut X; pink insole / MODEL MATCH |
| `06-satin-ballet-xstrap/black-pink/sf-side.png` | Taut X; pink rim |
| `02-knit-ballet-xstrap/beige/sf-hero-34.png` | Taut X on ribbed knit |
| `02-knit-ballet-xstrap/beige/sf-side.png` | Taut X; Angle B |
| `02-knit-ballet-xstrap/black/sf-hero-34.png` | Taut X |
| `02-knit-ballet-xstrap/black/sf-side.png` | Taut X (re-gen after wrong single-strap miss) |
| `02-knit-ballet-xstrap/sf-fallback.png` | Copied from black hero |
| `01-knit-maryjane-buckle/beige/sf-hero-34.png` | Taut MJ + buckle |
| `01-knit-maryjane-buckle/beige/sf-side.png` | Taut MJ (re-gen after ankle-strap miss) |
| `01-knit-maryjane-buckle/black/sf-hero-34.png` | Taut MJ; **black collar** preserved |
| `01-knit-maryjane-buckle/black/sf-side.png` | Taut MJ; black collar |
| `01-knit-maryjane-buckle/sf-fallback.png` | Copied from black hero |
| `04-satin-ankle-strap/cream/sf-hero-34.png` | Taut ankle oval; cream sole |
| `04-satin-ankle-strap/cream/sf-side.png` | Taut ankle; Angle B |
| `04-satin-ankle-strap/sf-fallback.png` | Copied from cream hero |
| `05-satin-maryjane/cream/sf-hero-34.png` | Taut MJ; pale cream heel; covered buckle |
| `05-satin-maryjane/cream/sf-side.png` | Taut MJ; Angle B |
| `05-satin-maryjane/sf-fallback.png` | Copied from cream hero |

### Lifestyle

| Path | Fix |
|---|---|
| `posts/post-05.png` | On-foot MJ straps taut; pink insole |
| `posts/post-09.png` | On-foot X straps taut; pink insole |

Upload: `simon_two_angle_upload.py` + targeted post upsert with `CACHE_BUST = v=20261101straptidy`.

## DB / CDN

| Table | Rows with `?v=20261101straptidy` |
|---|---|
| `product_medias` (Simon) | **30 / 30** |
| `post_medias` (Simon) | **10 / 10** (05/09 re-uploaded; others token-bumped) |
| `promotions` (Simon) | **6 / 6** (token-bumped) |

CDN spot-checks (06 cream hero/side, 02 beige hero, post-05) returned **200**.

## After

| Bucket | Verdict |
|---|---|
| 06 cream hero/side (trigger) | **PASS** vs before — straps markedly tidier / more geometric (before/after grid) |
| 02 / 06 other CWs | **PASS** hard; elastic texture can still read lightly soft up close |
| 01 / 04-cream / 05-cream | **PASS** hard — buckle + strap tension improved |
| 03 / 04-black-almond / 05-black-pink | Kept (already structured / soft-pass) |

### Soft residuals (non-blocking)

1. Wide elastic X material can still show faint rib texture (physical straps are elastic, not rigid ribbon).
2. `05-black-pink` packshots not re-run — already relatively tidy; pink lining OK from refalign.
3. `03` ankle straps already held a structured oval — left alone.
4. Expo / Image cache: **force-quit the app** so `?v=20261101straptidy` is fetched.

## Rules preserved

- Two-angle storefront only
- `01-black` black collar + tan insole
- Cream 04/05/06 pale cream/yellow sole/heel (not dark brown)
- Satin reads as satin on 04/05/06
- Refs not used as app media
- Same storage paths upserted

## Artifacts

- Backup: `simon-generated/_bak_strap_tidy_20261101/`
- `.tmp/simon_two_angle_media_urls.json`
- `.tmp/simon_straptidy_post_urls.json`
- `.tmp/simon_straptidy_apply.sql`
