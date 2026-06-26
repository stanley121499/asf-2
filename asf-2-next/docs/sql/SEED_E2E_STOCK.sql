-- =============================================================================
-- E2E / dev: ensure catalog products are purchasable (in stock)
-- =============================================================================
-- Run in Supabase SQL Editor (or psql) against your project.
-- Fixes UI "缺货" when every product_stock row has count = 0 or rows are missing.
--
-- 1) Bump existing rows to a safe minimum
UPDATE public.product_stock
SET count = 50
WHERE count IS NULL OR count < 1;

-- 2) Insert a default stock row for products that have no product_stock row yet
--    (one row per product: no color/size — shared pool until variant rows are added)
--    The customer apps resolve stock by exact (color_id, size_id) match first, then fall
--    back to this shared (NULL, NULL) row when no variant-specific rows exist.
INSERT INTO public.product_stock (id, product_id, color_id, size_id, count, created_at)
SELECT gen_random_uuid(), p.id, NULL, NULL, 100, now()
FROM public.products p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_stock ps
    WHERE ps.product_id = p.id
  );
