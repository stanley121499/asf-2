-- Step 10: Alter existing promotions table to match the new schema.
-- Run this in Supabase SQL editor INSTEAD of STEP_10_PROMOTIONS_MIGRATION.sql
-- (the CREATE TABLE IF NOT EXISTS was a no-op because the table already existed).

-- ── 1. Drop old `amount` column if discount_value already exists ──────────────
DO $$
BEGIN
  -- If both columns exist, just drop the old one
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotions' AND column_name = 'amount'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotions' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE promotions DROP COLUMN amount;
  -- If only amount exists (no discount_value yet), rename it
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE promotions RENAME COLUMN amount TO discount_value;
  END IF;
END $$;

-- ── 2. Add missing columns ────────────────────────────────────────────────────
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS code           TEXT UNIQUE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS description    TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_type  TEXT NOT NULL DEFAULT 'fixed'
  CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_value NUMERIC;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS start_date     TIMESTAMPTZ;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS end_date       TIMESTAMPTZ;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS active         BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS max_uses       INTEGER;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS uses_count     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ;

-- Make discount_value NOT NULL after backfilling nulls from old rows
UPDATE promotions SET discount_value = 0 WHERE discount_value IS NULL;
ALTER TABLE promotions ALTER COLUMN discount_value SET NOT NULL;

-- ── 3. promotion_products join table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotion_products (
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id)   ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, product_id)
);

-- ── 4. orders: promo tracking columns ────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- ── 5. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS promotions_code_idx   ON promotions (code)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS promotions_active_idx ON promotions (active) WHERE deleted_at IS NULL;

-- ── 6. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE promotions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_select_active"  ON promotions;
CREATE POLICY "promotions_select_active"
  ON promotions FOR SELECT TO authenticated
  USING (active = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "promotion_products_select" ON promotion_products;
CREATE POLICY "promotion_products_select"
  ON promotion_products FOR SELECT TO authenticated
  USING (true);
