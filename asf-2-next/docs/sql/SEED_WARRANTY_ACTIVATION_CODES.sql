-- =============================================================================
-- Seed helper: sample warranty activation codes (dev / staging)
-- =============================================================================
-- Run AFTER migration 20260717140000_physical_warranty_registration.sql
-- (or docs/sql/step_13_physical_warranty_registration.sql).
--
-- How to run:
--   1. Supabase Dashboard → SQL Editor → paste this file → Run
--   2. Or: psql "$DATABASE_URL" -f docs/sql/SEED_WARRANTY_ACTIVATION_CODES.sql
--
-- Inserts 40 unused codes (ASF-TEST-0001 … ASF-TEST-0040) split across the
-- first two non-deleted products found in `products`. Safe to re-run: codes
-- that already exist are skipped (ON CONFLICT DO NOTHING via unique index).
-- =============================================================================

WITH target_products AS (
  SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM products
  WHERE deleted_at IS NULL
  ORDER BY created_at NULLS LAST, id
  LIMIT 2
),
code_rows AS (
  SELECT
    'ASF-TEST-' || lpad(gs::text, 4, '0') AS code,
    CASE
      WHEN gs <= 20 THEN (SELECT id FROM target_products WHERE rn = 1)
      ELSE COALESCE(
        (SELECT id FROM target_products WHERE rn = 2),
        (SELECT id FROM target_products WHERE rn = 1)
      )
    END AS product_id,
    CASE
      WHEN gs <= 20 THEN 'Dev seed batch A'
      ELSE 'Dev seed batch B'
    END AS batch_label
  FROM generate_series(1, 40) AS gs
)
INSERT INTO warranty_activation_codes (code, product_id, batch_label, status)
SELECT
  cr.code,
  cr.product_id,
  cr.batch_label,
  'unused'
FROM code_rows cr
WHERE cr.product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM warranty_activation_codes existing
    WHERE existing.code = cr.code
  );

-- Sanity check (optional): SELECT code, product_id, status FROM warranty_activation_codes WHERE code LIKE 'ASF-TEST-%' ORDER BY code;
