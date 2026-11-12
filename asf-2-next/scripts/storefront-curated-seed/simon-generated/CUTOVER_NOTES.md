# Simon storefront catalog cutover — 2026-10

## Result

Customer-facing live catalog is **only** Simon’s 6 flats (**11 active** colorways — product 03 blush `#E8C4C4` is inactive / not a real CW; beige `#D6C6A8` only for 03; 78 product medias), plus 10 posts and 6 promos.

| Metric | Count |
|---|---|
| Live products (`deleted_at IS NULL`) | **6** |
| Simon product medias | **78** |
| Live published posts | **10** |
| Live published promos | **6** |
| Curated `dddd*` products remaining | **0** |
| Soft-deleted legacy `bbbb*` (kept for order history) | **20** |

## Storage

Prefix: `storefront-curated/2026-10/simon/`

| Bucket | Path pattern |
|---|---|
| `product_medias` | `…/products/{productId}/[fallback\|{colorId}/{shot}].webp` |
| `post_medias` | `…/posts/{postId}.webp` |
| `medias` | `…/promos/{promoId}.webp` |

WhatsApp physical refs under `simon-product-refs/` were **not** uploaded.

## Taxonomy (Shop visibility)

| Field | ID | Name |
|---|---|---|
| department | `a3100001-24a8-4f00-8000-000000000002` | 女鞋 |
| range (occupation) | `a4200001-24a8-4f00-8000-000000000001` | 护士 |
| category | `a4300001-24a8-4f00-8000-000000000001` | 鞋履 |
| brand | `a3400001-24a8-4f00-8000-000000000001` | 模力 |

Products appear under Shop → **护士** → **鞋履**, and on Home via newest / feed.

## Deleted vs kept

### Hard-deleted
- All curated mock products `dddd*` (+ colors `a350*`, medias `a360*`, stock, translations, junctions)
- Curated posts `eeee*` (+ medias, translations, `post_products`)
- Curated / draft promos `4444*` and `3333*` (+ `promotion_products`)
- Cart rows pointing at curated products

### Soft-deleted / left inactive
- Legacy demo products `bbbb*` (already soft-deleted; **kept** — order_items / sales_logs reference them)
- Soft-deleted posts `cccccccc*` (already inactive)
- Old footwear taxonomy tiles `a330*` / ranges `a320*` (mock catalog only) — soft-deleted if still active

### Untouched
- Auth users, orders, payments, non-curated sales history
- Occupation Shop ranges `a420*` / categories `a430*` (re-activated 护士 / 鞋履)

## Stable IDs

See `CATALOG_IDS.json` in this folder (`c101*` products, `c150*` colors, `c160*` medias, `c201*` posts, `c301*` promos).

## Scripts / SQL

| Path | Role |
|---|---|
| `../simon_cutover_upload.py` | Upload generated PNG/JPG → Storage WEBP |
| `../simon_cutover_generate_sql.py` | Build delete + insert SQL |
| `../simon-cutover-sql/01_delete_curated.sql` | Delete curated mock |
| `../simon-cutover-sql/02_insert_simon_catalog.sql` | Full insert payload |
| `../.tmp/simon_*_media_urls.json` | Uploaded URL maps |

## Sample public URLs

- Product fallback: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000001/fallback.webp`
- Color hero: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/product_medias/storefront-curated/2026-10/simon/products/c1010001-24a8-4f00-8000-000000000001/c1500101-24a8-4f00-8000-000000000001/sf-hero-34.webp`
- Post: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000001.webp`
- Promo: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-10/simon/promos/c3010001-24a8-4f00-8000-000000000001.webp`

## Home hero image (DB-controlled)

Storefront / Atelier Expo Home and Next customer Home read the cover from
`homepage_elements`, **not** from a hardcoded Unsplash / fixed post UUID in app code.

| Field | Value |
|---|---|
| Table | `homepage_elements` |
| Row id (seeded) | `55550000-0000-0000-0000-000000000010` |
| `type` | `hero` |
| `contentType` | `post` |
| `targetId` | `posts.id` whose first `post_medias.media_url` is the cover |
| Current default | Simon post-04 `c2010001-24a8-4f00-8000-000000000004` |

### Swap the hero (no redeploy)

Point the hero element at another live post:

```sql
UPDATE homepage_elements
SET "targetId" = 'c2010001-24a8-4f00-8000-000000000001'  -- e.g. post-01
WHERE type = 'hero';
```

Or keep the same post and change its media URL:

```sql
UPDATE post_medias
SET media_url = 'https://…/your-new-cover.webp'
WHERE post_id = (
  SELECT "targetId" FROM homepage_elements WHERE type = 'hero' LIMIT 1
);
```

Expo falls back to a baked-in Simon post-04 URL if the row/media is missing;
image load failure still uses the in-app gradient. Reload / reopen Home to see the change (hero element is fetched on mount; post medias also update via realtime).

## RLS note

Supabase advisors still flag many catalog tables with RLS disabled. That is pre-existing and was not changed in this cutover.
