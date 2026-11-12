#!/usr/bin/env python3
"""Generate delete + insert SQL for Simon storefront catalog cutover."""

from __future__ import annotations

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
GEN = SCRIPT_DIR / "simon-generated"
TMP = SCRIPT_DIR / ".tmp"
OUT = SCRIPT_DIR / "simon-cutover-sql"
CATALOG_PATH = GEN / "CATALOG_IDS.json"


def esc(value: str) -> str:
    """Escape single quotes for SQL string literals."""
    return value.replace("'", "''")


def write_delete_sql() -> Path:
    """Hard-delete curated mock rows (dddd/eeee/4444/3333); keep bbbb* soft-deleted."""
    sql = """-- Simon cutover: remove curated mock catalog (safe: no order_items on dddd*)
-- KEPT: soft-deleted bbbb* legacy demo products (order history), auth, orders

-- Clear carts pointing at curated products
DELETE FROM public.add_to_carts WHERE product_id::text LIKE 'dddd%';

-- Junctions
DELETE FROM public.post_products WHERE product_id::text LIKE 'dddd%' OR post_id::text LIKE 'eeee%';
DELETE FROM public.promotion_products WHERE product_id::text LIKE 'dddd%' OR promotion_id::text LIKE '4444%' OR promotion_id::text LIKE '3333%';

-- Medias
DELETE FROM public.product_medias WHERE product_id::text LIKE 'dddd%' OR id::text LIKE 'a360%';
DELETE FROM public.post_medias WHERE post_id::text LIKE 'eeee%';

-- Colors / stock / categories / translations
DELETE FROM public.product_colors WHERE product_id::text LIKE 'dddd%' OR id::text LIKE 'a350%';
DELETE FROM public.product_stock WHERE product_id::text LIKE 'dddd%';
DELETE FROM public.product_categories WHERE product_id::text LIKE 'dddd%';
DELETE FROM public.product_translations WHERE product_id::text LIKE 'dddd%';
DELETE FROM public.post_translations WHERE post_id::text LIKE 'eeee%';

-- Soft-delete any remaining sales/events on curated if present (keep rows if FK blocks)
DELETE FROM public.product_events WHERE product_id::text LIKE 'dddd%';

-- Core entities
DELETE FROM public.products WHERE id::text LIKE 'dddd%';
UPDATE public.posts SET active = false, status = 'Archived', deleted_at = NOW()
WHERE id::text LIKE 'eeee%' AND deleted_at IS NULL;
DELETE FROM public.posts WHERE id::text LIKE 'eeee%'
  AND NOT EXISTS (SELECT 1 FROM public.post_medias pm WHERE pm.post_id = posts.id)
  AND NOT EXISTS (SELECT 1 FROM public.post_products pp WHERE pp.post_id = posts.id);

-- Hard-delete curated posts after children cleared
DELETE FROM public.post_medias WHERE post_id::text LIKE 'eeee%';
DELETE FROM public.post_products WHERE post_id::text LIKE 'eeee%';
DELETE FROM public.post_translations WHERE post_id::text LIKE 'eeee%';
DELETE FROM public.posts WHERE id::text LIKE 'eeee%';

UPDATE public.promotions SET active = false, status = 'DRAFT', deleted_at = NOW()
WHERE (id::text LIKE '4444%' OR id::text LIKE '3333%') AND deleted_at IS NULL;
DELETE FROM public.promotion_products WHERE promotion_id::text LIKE '4444%' OR promotion_id::text LIKE '3333%';
DELETE FROM public.promotions WHERE id::text LIKE '4444%' OR id::text LIKE '3333%';

-- Soft-delete old footwear taxonomy tiles that only served the mock catalog
UPDATE public.categories
SET active = false, deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a330%' AND deleted_at IS NULL;

UPDATE public.ranges
SET active = false, deleted_at = COALESCE(deleted_at, NOW())
WHERE id::text LIKE 'a320%' AND deleted_at IS NULL;
"""
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "01_delete_curated.sql"
    path.write_text(sql, encoding="utf-8")
    return path


def write_insert_sql() -> Path:
    """Insert Simon products, colors, medias, posts, promos with uploaded URLs."""
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    product_urls = json.loads(
        (TMP / "simon_product_media_urls.json").read_text(encoding="utf-8")
    )
    post_urls = json.loads((TMP / "simon_post_media_urls.json").read_text(encoding="utf-8"))
    promo_urls = json.loads(
        (TMP / "simon_promo_media_urls.json").read_text(encoding="utf-8")
    )

    tax = catalog["taxonomy"]
    url_by_media = {r["mediaId"]: r["url"] for r in product_urls}
    post_url_by_id = {r["postId"]: r["url"] for r in post_urls}
    promo_url_by_id = {r["promoId"]: r["url"] for r in promo_urls}

    lines: list[str] = [
        "-- Simon cutover: insert 6 products × 2 colorways + medias + posts + promos",
        "",
    ]

    # Products
    lines.append(
        "INSERT INTO public.products (\n"
        "  id, name, price, status, description, brand_id, category_id,\n"
        "  department_id, range_id, created_at, updated_at, deleted_at\n"
        ") VALUES"
    )
    prod_vals: list[str] = []
    for idx, (_pkey, prod) in enumerate(catalog["products"].items()):
        hours = idx
        desc = f"Simon 精选女鞋平底 — {prod['zh']}。舒适耐穿，日常百搭。"
        prod_vals.append(
            "  ("
            f"'{prod['id']}', '{esc(prod['zh'])}', {prod['price']}, 'Published', "
            f"'{esc(desc)}', '{tax['brandId']}', '{tax['categoryId']}', "
            f"'{tax['departmentId']}', '{tax['rangeId']}', "
            f"NOW() - INTERVAL '{hours} hours', NOW(), NULL)"
        )
    lines.append(",\n".join(prod_vals))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  name = EXCLUDED.name, price = EXCLUDED.price, status = EXCLUDED.status,\n"
        "  description = EXCLUDED.description, brand_id = EXCLUDED.brand_id,\n"
        "  category_id = EXCLUDED.category_id, department_id = EXCLUDED.department_id,\n"
        "  range_id = EXCLUDED.range_id, deleted_at = NULL,\n"
        "  updated_at = NOW();\n"
    )

    # Colors
    lines.append(
        "INSERT INTO public.product_colors "
        "(id, product_id, color, active, created_at, updated_at) VALUES"
    )
    color_vals: list[str] = []
    for prod in catalog["products"].values():
        for cw in prod["colorways"].values():
            active = "true" if cw.get("active", True) else "false"
            color_vals.append(
                f"  ('{cw['id']}', '{prod['id']}', '{cw['hex']}', {active}, NOW(), NOW())"
            )
        # Legacy / non-physical CWs (e.g. product 03 blush) — keep row, stay inactive
        for cw in prod.get("inactiveColorways", {}).values():
            color_vals.append(
                f"  ('{cw['id']}', '{prod['id']}', '{cw['hex']}', false, NOW(), NOW())"
            )
    lines.append(",\n".join(color_vals))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  product_id = EXCLUDED.product_id, color = EXCLUDED.color,\n"
        "  active = EXCLUDED.active, deleted_at = NULL, updated_at = NOW();\n"
    )

    # Medias
    lines.append(
        "INSERT INTO public.product_medias "
        "(id, product_id, media_url, arrangement, color_id, created_at, updated_at) VALUES"
    )
    media_vals: list[str] = []
    for rec in product_urls:
        color_sql = "NULL" if rec.get("colorId") is None else f"'{rec['colorId']}'"
        media_vals.append(
            f"  ('{rec['mediaId']}', '{rec['productId']}', '{esc(rec['url'])}', "
            f"{rec['arrangement']}, {color_sql}, NOW(), NOW())"
        )
    lines.append(",\n".join(media_vals))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  product_id = EXCLUDED.product_id, media_url = EXCLUDED.media_url,\n"
        "  arrangement = EXCLUDED.arrangement, color_id = EXCLUDED.color_id,\n"
        "  updated_at = NOW();\n"
    )

    # Translations
    lines.append(
        "INSERT INTO public.product_translations "
        "(product_id, locale, name, description) VALUES"
    )
    tr_vals: list[str] = []
    for prod in catalog["products"].values():
        desc_en = f"Premium {prod['en']} — Simon curated flat for everyday Malaysian retail."
        desc_ms = f"{prod['ms']} premium untuk gaya harian."
        tr_vals.append(
            f"  ('{prod['id']}', 'en', '{esc(prod['en'])}', '{esc(desc_en)}')"
        )
        tr_vals.append(
            f"  ('{prod['id']}', 'ms', '{esc(prod['ms'])}', '{esc(desc_ms)}')"
        )
    lines.append(",\n".join(tr_vals))
    lines.append(
        "ON CONFLICT (product_id, locale) DO UPDATE SET\n"
        "  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();\n"
    )

    # product_categories
    lines.append(
        "INSERT INTO public.product_categories "
        "(id, product_id, category_id, created_at, updated_at) VALUES"
    )
    pc_vals = [
        f"  ('{p['productCategoryId']}', '{p['id']}', '{tax['categoryId']}', NOW(), NOW())"
        for p in catalog["products"].values()
    ]
    lines.append(",\n".join(pc_vals))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  product_id = EXCLUDED.product_id, category_id = EXCLUDED.category_id,\n"
        "  updated_at = NOW();\n"
    )

    # stock
    lines.append(
        "INSERT INTO public.product_stock "
        "(id, product_id, color_id, size_id, count, created_at) VALUES"
    )
    st_vals = [
        f"  ('{p['stockId']}', '{p['id']}', NULL, NULL, 40, NOW())"
        for p in catalog["products"].values()
    ]
    lines.append(",\n".join(st_vals))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, count = EXCLUDED.count;\n"
    )

    # Posts
    lines.append(
        "INSERT INTO public.posts (\n"
        "  id, name, caption, photo_size, caption_position, cta_text, status, active,\n"
        "  department_id, range_id, category_id, brand_id, time_post, created_at, deleted_at\n"
        ") VALUES"
    )
    post_vals: list[str] = []
    for i, post in enumerate(catalog["posts"]):
        post_vals.append(
            "  ("
            f"'{post['id']}', '{esc(post['zh'])}', '{esc(post['caption'])}', "
            f"'16:9', 'bottom', '查看商品', 'Published', true, "
            f"'{tax['departmentId']}', '{tax['rangeId']}', '{tax['categoryId']}', "
            f"'{tax['brandId']}', "
            f"NOW() - INTERVAL '{i} days', NOW() - INTERVAL '{i} hours', NULL)"
        )
    lines.append(",\n".join(post_vals))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  name = EXCLUDED.name, caption = EXCLUDED.caption, status = 'Published',\n"
        "  active = true, deleted_at = NULL, department_id = EXCLUDED.department_id,\n"
        "  range_id = EXCLUDED.range_id, category_id = EXCLUDED.category_id,\n"
        "  brand_id = EXCLUDED.brand_id, time_post = EXCLUDED.time_post;\n"
    )

    # post_medias
    lines.append(
        "INSERT INTO public.post_medias "
        "(post_id, media_url, media_type, arrangement, created_at)\n"
        "SELECT v.post_id, v.media_url, 'image', 1, NOW()\n"
        "FROM (VALUES"
    )
    pm_vals = [
        f"  ('{p['id']}'::uuid, '{esc(post_url_by_id[p['id']])}')"
        for p in catalog["posts"]
    ]
    lines.append(",\n".join(pm_vals))
    lines.append(
        ") AS v(post_id, media_url)\n"
        "WHERE NOT EXISTS (\n"
        "  SELECT 1 FROM public.post_medias pm\n"
        "  WHERE pm.post_id = v.post_id AND pm.arrangement = 1\n"
        ");\n"
        "UPDATE public.post_medias pm SET media_url = v.media_url\n"
        "FROM (VALUES\n"
        + ",\n".join(pm_vals)
        + "\n) AS v(post_id, media_url)\n"
        "WHERE pm.post_id = v.post_id::uuid AND pm.arrangement = 1;\n"
    )

    # post_products
    lines.append("INSERT INTO public.post_products (post_id, product_id, created_at) VALUES")
    pp_vals = []
    for post in catalog["posts"]:
        pid = catalog["products"][post["productKey"]]["id"]
        pp_vals.append(f"  ('{post['id']}', '{pid}', NOW())")
    lines.append(",\n".join(pp_vals))
    lines.append("ON CONFLICT (post_id, product_id) DO NOTHING;\n")

    # post_translations
    lines.append(
        "INSERT INTO public.post_translations (post_id, locale, name, caption) VALUES"
    )
    ptr_vals = []
    for post in catalog["posts"]:
        ptr_vals.append(
            f"  ('{post['id']}', 'en', '{esc(post['en'])}', '{esc(post['caption'])}')"
        )
    lines.append(",\n".join(ptr_vals))
    lines.append(
        "ON CONFLICT (post_id, locale) DO UPDATE SET\n"
        "  name = EXCLUDED.name, caption = EXCLUDED.caption;\n"
    )

    # Promotions
    lines.append(
        "INSERT INTO public.promotions (\n"
        "  id, name, description, code, type, discount_type, discount_value,\n"
        "  minimum_purchase_amount, auto_apply, status, active,\n"
        "  start_date, end_date, max_uses, uses_count, image_url, created_at, deleted_at\n"
        ") VALUES"
    )
    promo_vals = []
    for promo in catalog["promos"]:
        desc = f"{promo['zh']} — Simon 女鞋平底精选优惠。"
        promo_vals.append(
            "  ("
            f"'{promo['id']}', '{esc(promo['zh'])}', '{esc(desc)}', '{promo['code']}', "
            f"'discount', '{promo['discountType']}', {promo['discountValue']}, "
            f"0, false, 'Published', true, "
            f"TIMESTAMPTZ '2026-10-01 00:00:00+00', TIMESTAMPTZ '2027-03-31 23:59:59+00', "
            f"NULL, 0, '{esc(promo_url_by_id[promo['id']])}', NOW(), NULL)"
        )
    lines.append(",\n".join(promo_vals))
    lines.append(
        "ON CONFLICT (id) DO UPDATE SET\n"
        "  name = EXCLUDED.name, description = EXCLUDED.description, code = EXCLUDED.code,\n"
        "  discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value,\n"
        "  status = 'Published', active = true, deleted_at = NULL,\n"
        "  image_url = EXCLUDED.image_url;\n"
    )

    # promotion_products — link each promo to its hero + all 6 products for feed richness
    lines.append("INSERT INTO public.promotion_products (promotion_id, product_id) VALUES")
    prp_vals: list[str] = []
    all_pids = [p["id"] for p in catalog["products"].values()]
    for promo in catalog["promos"]:
        hero = catalog["products"][promo["productKey"]]["id"]
        prp_vals.append(f"  ('{promo['id']}', '{hero}')")
        for pid in all_pids:
            if pid != hero:
                prp_vals.append(f"  ('{promo['id']}', '{pid}')")
    lines.append(",\n".join(prp_vals))
    lines.append("ON CONFLICT (promotion_id, product_id) DO NOTHING;\n")

    # Ensure occupation taxonomy stays visible for Shop
    lines.append(
        f"-- Ensure Shop occupation path is active\n"
        f"UPDATE public.ranges SET active = true, deleted_at = NULL "
        f"WHERE id = '{tax['rangeId']}';\n"
        f"UPDATE public.categories SET active = true, deleted_at = NULL "
        f"WHERE id = '{tax['categoryId']}';\n"
        f"UPDATE public.departments SET active = true, deleted_at = NULL "
        f"WHERE id = '{tax['departmentId']}';\n"
        f"UPDATE public.brand SET active = true, deleted_at = NULL "
        f"WHERE id = '{tax['brandId']}';\n"
    )

    # Sanity: unused url_by_media referenced for completeness check in notes
    _ = url_by_media

    path = OUT / "02_insert_simon_catalog.sql"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> None:
    """Generate both SQL phases."""
    d = write_delete_sql()
    print(f"Wrote {d}")
    i = write_insert_sql()
    print(f"Wrote {i}")


if __name__ == "__main__":
    main()
