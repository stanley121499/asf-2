-- Step 10 — Promotions module (run in Supabase SQL editor)
--
-- IMPORTANT: If `promotions` already existed from an older schema, `CREATE TABLE IF NOT EXISTS`
-- does nothing — you MUST run section 2 so columns like `deleted_at` exist before indexes/RLS.

-- =============================================================================
-- 1) Greenfield: create tables when they do not exist
-- =============================================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotion_products (
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, product_id)
);

-- =============================================================================
-- 2) Legacy `promotions` table: add any missing Step 10 columns
--    (fixes: ERROR column "deleted_at" does not exist — e.g. partial indexes on code)
-- =============================================================================
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_value NUMERIC;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS max_uses INTEGER;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill rows that gained NULLable columns (safe no-ops on already-new tables)
UPDATE promotions
SET name = COALESCE(NULLIF(trim(BOTH FROM name), ''), NULLIF(trim(BOTH FROM code), ''), 'Promotion')
WHERE name IS NULL OR trim(BOTH FROM name) = '';

UPDATE promotions
SET discount_type = COALESCE(discount_type, 'percentage')
WHERE discount_type IS NULL;

UPDATE promotions
SET discount_value = COALESCE(discount_value, 0)
WHERE discount_value IS NULL;

UPDATE promotions
SET active = COALESCE(active, true)
WHERE active IS NULL;

UPDATE promotions
SET uses_count = COALESCE(uses_count, 0)
WHERE uses_count IS NULL;

UPDATE promotions
SET created_at = COALESCE(created_at, NOW())
WHERE created_at IS NULL;

-- Map legacy `amount` / `type` into new fields when those columns still exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'amount'
  ) THEN
    UPDATE promotions
    SET discount_value = COALESCE(discount_value, amount, 0)
    WHERE amount IS NOT NULL AND (discount_value IS NULL OR discount_value = 0);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'type'
  ) THEN
    UPDATE promotions
    SET discount_type = CASE
      WHEN lower(coalesce(type::text, '')) LIKE '%percent%' THEN 'percentage'
      ELSE 'fixed'
    END
    WHERE discount_type IS NULL OR discount_type NOT IN ('percentage', 'fixed');
  END IF;
END $$;

-- Normalize any remaining invalid discount_type before optional constraint
UPDATE promotions SET discount_type = 'fixed'
WHERE discount_type IS NOT NULL AND discount_type NOT IN ('percentage', 'fixed');

-- Optional: add CHECK only if your table has no such constraint yet (skip if duplicate name error)
-- ALTER TABLE promotions ADD CONSTRAINT promotions_discount_type_check
--   CHECK (discount_type IN ('percentage', 'fixed'));

-- =============================================================================
-- 3) Optional index (partial on code) — only valid AFTER deleted_at exists
-- =============================================================================
CREATE INDEX IF NOT EXISTS promotions_code_idx ON promotions (code) WHERE deleted_at IS NULL;

-- =============================================================================
-- 4) Orders
-- =============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- =============================================================================
-- 5) RLS
-- =============================================================================
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_select_active_authenticated" ON promotions;
CREATE POLICY "promotions_select_active_authenticated"
  ON promotions FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND active = true
  );

ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
