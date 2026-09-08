-- =============================================================================
-- Demo / staging: seed store_product_stock for nearby-wishlist tests (Agent 4)
-- =============================================================================
-- Purpose: Give Agent 5/6 truthful in-stock rows at 1–2 KL malls without
--   grinding the admin UI. Does NOT touch global product_stock or stock_place.
--
-- HOW STANLEY APPLIES
-- -------------------
-- 1) Ensure Agent 1 migration is applied (`store_product_stock` exists).
-- 2) Run this file in Supabase SQL Editor (or MCP execute_sql / psql).
-- 3) Re-run safe: upserts by unique (store, product, color, size) via
--    DELETE of tagged demo rows then INSERT (see demo_marker below).
--
-- Seeded stores (active KL malls):
--   - Model Match Pavilion KL  (Pavilion Kuala Lumpur)
--   - Model Match Suria KLCC   (Suria KLCC)
--
-- Seeded products (curated catalog UUIDs + their active colors; size_id NULL
-- because the current catalog has colors but no product_sizes rows):
--   - 云感缓震跑鞋 (dddd0101-…)
--   - 轻量训练跑鞋 (dddd0102-…)
--   - 经典白网球鞋 (dddd0201-…)
--   - 迷你斜挎包   (dddd0901-…)
-- =============================================================================

DO $$
DECLARE
  demo_marker TEXT := 'expo_store_stock_2026-09-08';
  pavilion_id UUID;
  klcc_id UUID;
BEGIN
  SELECT id INTO pavilion_id
  FROM public.store_locations
  WHERE mall_name = 'Pavilion Kuala Lumpur'
    AND active = TRUE
    AND deleted_at IS NULL
  ORDER BY sort_order, name
  LIMIT 1;

  SELECT id INTO klcc_id
  FROM public.store_locations
  WHERE mall_name = 'Suria KLCC'
    AND active = TRUE
    AND deleted_at IS NULL
  ORDER BY sort_order, name
  LIMIT 1;

  IF pavilion_id IS NULL AND klcc_id IS NULL THEN
    RAISE NOTICE 'SEED_STORE_PRODUCT_STOCK_DEMO: no Pavilion KL / Suria KLCC stores found; skip';
    RETURN;
  END IF;

  -- Remove prior demo rows for these products at the target stores (idempotent re-seed).
  -- We key demo by product_id set below rather than a metadata column (table has none).
  DELETE FROM public.store_product_stock
  WHERE product_id IN (
      'dddd0101-24a8-4f00-8000-000000000001'::uuid,
      'dddd0102-24a8-4f00-8000-000000000002'::uuid,
      'dddd0201-24a8-4f00-8000-000000000001'::uuid,
      'dddd0901-24a8-4f00-8000-000000000001'::uuid
    )
    AND store_location_id IN (
      SELECT x FROM unnest(ARRAY[pavilion_id, klcc_id]) AS t(x) WHERE x IS NOT NULL
    );

  INSERT INTO public.store_product_stock (
    store_location_id,
    product_id,
    color_id,
    size_id,
    count,
    updated_at
  )
  SELECT
    store_id,
    c.product_id,
    c.id AS color_id,
    NULL::uuid AS size_id,
    CASE
      WHEN store_id = pavilion_id THEN 5
      ELSE 3
    END AS count,
    NOW()
  FROM public.product_colors c
  CROSS JOIN LATERAL (
    SELECT unnest(
      ARRAY_REMOVE(ARRAY[pavilion_id, klcc_id], NULL)
    ) AS store_id
  ) stores
  WHERE c.product_id IN (
      'dddd0101-24a8-4f00-8000-000000000001'::uuid,
      'dddd0102-24a8-4f00-8000-000000000002'::uuid,
      'dddd0201-24a8-4f00-8000-000000000001'::uuid,
      'dddd0901-24a8-4f00-8000-000000000001'::uuid
    )
    AND c.active = TRUE
    AND c.deleted_at IS NULL;

  RAISE NOTICE 'SEED_STORE_PRODUCT_STOCK_DEMO (%) applied for Pavilion=% KLCC=%',
    demo_marker, pavilion_id, klcc_id;
END $$;

-- Quick verify (optional):
-- SELECT sps.count, sl.mall_name, p.name, pc.color
-- FROM store_product_stock sps
-- JOIN store_locations sl ON sl.id = sps.store_location_id
-- JOIN products p ON p.id = sps.product_id
-- LEFT JOIN product_colors pc ON pc.id = sps.color_id
-- WHERE sl.mall_name IN ('Pavilion Kuala Lumpur', 'Suria KLCC')
-- ORDER BY sl.mall_name, p.name, pc.color;
