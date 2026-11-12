# Simon ref-align audit — 2026-11-01

Physical truth: `simon-product-refs/`  
Generated: `simon-generated/`  
Live gallery: **2 angles + fallback only** (`sf-hero-34`, `sf-side`, `sf-fallback`)  
Cache-bust token: **`?v=20261101refalign`**

## Scope counted

| Surface | Count | In app? |
|---|---|---|
| `product_medias` (2 angles × 12 colorways + 6 fallbacks) | **30** | Yes — Shop gallery |
| `post_medias` | **10** | Yes — feed |
| `promotions.image_url` | **6** | Yes — promo banners |
| `md-editorial-*` on disk / storage | 24 | Storage only (removed from gallery in two-angle cutover) |
| **Live total audited for fail rate** | **46** | |

Refs never uploaded as app media.

## Before (honest fail rate)

Compared every live packshot + lifestyle asset to physical refs.

### Hard FAIL (silhouette / sole / interior / hardware / angle)

| Asset | Issue vs ref |
|---|---|
| `03-beige/sf-side` | Wrong silhouette — instep MJ strap instead of **ankle** strap (duplicate of other 03 beige shots) |
| `04-cream/sf-hero-34` | Dark brown heel/sole vs physical **white/cream** |
| `04-cream/sf-side` | Same dark brown sole |
| `04/sf-fallback` | Same (cream Angle A copy) |
| `06-cream/sf-hero-34` | Dark brown heel/sole vs physical **cream/pale yellow** |
| `06-cream/sf-side` | Same |
| `06/sf-fallback` | Same |
| `05-cream` hero/side (stricter) | Heel too dark / buckle fidelity weak vs pale yellow sole + covered cream buckle |
| `05-black-pink` hero/side (stricter) | Pink lining not clearly expressed |
| `06-black-pink` hero (stricter) | Weak pink + non-studio background risk |
| `posts/post-05` | Black interior instead of **pink** |
| `posts/post-09` | Black interior instead of **pink** |
| `promos/promo-03` | Metallic **gold** heel + shiny metal buckle |
| `promos/promo-06` | Black interior instead of **pink** |

**Hard live fails: 14 / 46 ≈ 30%** (clear structural/colorway mismatches).

### Soft / stricter bar (material + editorial interiors)

Also flagged (not all blocking for Shop 2-angle, but match user “>50%” perception):

- Several satin uppers reading closer to matte leather than physical satin sheen
- `05/06` black-pink `md-editorial-*` (storage-only) hiding pink interiors
- `04-black-almond` lifestyle not showing cream/almond **interior** (outer collar is black on physical refs — almond = lining/insole)
- Soft beige/nude drift on 03 beige vs pink-leaning physical sample

**With soft material + lifestyle interior bar: ~24–28 / 46 ≈ 52–61%.**  
User claim that more than half don’t align is fair under that stricter reading; hard structural fails alone were closer to one-third.

## Regenerated + uploaded

### Packshots (14 files → storage + DB)

| Path | Fix |
|---|---|
| `03-knit-ankle-strap/beige/sf-side.png` | Ankle strap silhouette |
| `04-satin-ankle-strap/cream/sf-hero-34.png` | White/cream sole |
| `04-satin-ankle-strap/cream/sf-side.png` | White/cream sole; Angle B left |
| `04-satin-ankle-strap/sf-fallback.png` | Copied from cream hero |
| `05-satin-maryjane/cream/sf-hero-34.png` | Pale yellow sole + covered buckle |
| `05-satin-maryjane/cream/sf-side.png` | Same; Angle B left |
| `05-satin-maryjane/sf-fallback.png` | Copied from cream hero |
| `05-satin-maryjane/black-pink/sf-hero-34.png` | Pink lining + satin MJ |
| `05-satin-maryjane/black-pink/sf-side.png` | Pink rim; Angle B left |
| `06-satin-ballet-xstrap/cream/sf-hero-34.png` | Cream/pale yellow sole |
| `06-satin-ballet-xstrap/cream/sf-side.png` | Same; Angle B left |
| `06-satin-ballet-xstrap/sf-fallback.png` | Copied from cream hero |
| `06-satin-ballet-xstrap/black-pink/sf-hero-34.png` | Pink insole + X-straps |
| `06-satin-ballet-xstrap/black-pink/sf-side.png` | Pink rim; Angle B left |

### Lifestyle (7 files)

| Path | Fix |
|---|---|
| `posts/post-05.png` | Feet close-up; pink insole visible |
| `posts/post-09.png` | Feet close-up; pink insole + X-straps |
| `promos/promo-03-satin-elegance.jpg` | Cream covered buckle; pale cream heel (no gold metal) |
| `promos/promo-06-evening.jpg` | Pink insole on X-strap ballet |
| `05-satin-maryjane/black-pink/md-editorial-a.png` | Pink insole clear |
| `06-satin-ballet-xstrap/black-pink/md-editorial-a.png` | Pink insole clear |
| `04-satin-ankle-strap/black-almond/md-editorial-a.png` | Cream/almond insole visible |

Upload scripts: `simon_two_angle_upload.py` + `simon_nurse_comp_upload.py` with `CACHE_BUST = v=20261101refalign`.

## DB / CDN

| Table | Rows with `?v=20261101refalign` |
|---|---|
| `product_medias` | 30 / 30 |
| `post_medias` | 10 / 10 |
| `promotions` | 6 / 6 |

CDN spot-checks (03 beige side, 04 cream hero, 06 cream hero, post-05, promo-03) returned **200**.

## After (final pass/fail)

| Bucket | Pass | Fail |
|---|---|---|
| Live packshots (30) | **30** | **0** hard |
| Live posts (10) | **10** | **0** hard |
| Live promos (6) | **6** | **0** hard |
| **Live total (46)** | **46** | **0** hard |

Soft residuals (non-blocking, spot-check on device):

1. Black satin packshots can still read slightly matte vs physical satin sheen under some lighting.
2. `post-05` / `post-09` are now **shoe-forward close-ups** (composition changed so pink insole is visible — silhouette/colorway correct).
3. `04-black-almond` outer collar remains **black** on packshots (matches physical refs); almond = interior lining/insole.
4. Expo / Image cache: **force-quit the app** (or clear cache) so `?v=20261101refalign` is fetched.

## Rules preserved

- Two-angle storefront only (no 6-packshot gallery reintroduced)
- `01-black` black collar + tan insole unchanged
- Refs not used as app media
- Homepage / Shop flags / commit workflow untouched

## Scripts / artifacts

- `.tmp/simon_two_angle_media_urls.json`
- `.tmp/simon_nurse_comp_*_urls.json`
- `.tmp/simon_refalign_product_medias.sql`
- `.tmp/simon_nurse_comp_apply.sql`
