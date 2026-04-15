-- Step 10: Promotions Module
-- Run in Supabase SQL editor before using the promotions feature.

-- ── promotions table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  description    TEXT,
  code           TEXT        UNIQUE,
  discount_type  TEXT        NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC     NOT NULL,
  start_date     TIMESTAMPTZ,
  end_date       TIMESTAMPTZ,
  active         BOOLEAN     NOT NULL DEFAULT true,
  max_uses       INTEGER,
  uses_count     INTEGER     NOT NULL DEFAULT 0,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS promotions_code_idx       ON promotions (code)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS promotions_active_idx     ON promotions (active)     WHERE deleted_at IS NULL;

-- ── promotion_products join table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotion_products (
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id)   ON DELETE CASCADE,
  PRIMARY KEY (promotion_id, product_id)
);

-- ── orders: add promo tracking columns ───────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- ── RLS: promotions ───────────────────────────────────────────────────────────
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read active non-deleted promotions (for cart validation)
CREATE POLICY "promotions_select_active"
  ON promotions FOR SELECT
  TO authenticated
  USING (active = true AND deleted_at IS NULL);

-- Service role bypasses RLS — admin writes go through API routes using service role key.

-- ── RLS: promotion_products ───────────────────────────────────────────────────
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotion_products_select"
  ON promotion_products FOR SELECT
  TO authenticated
  USING (true);
