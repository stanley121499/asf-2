-- Phase 0 — Foundation (production roadmap 2026-04-13)
--
-- Scope (excludes promotions schema changes; deferred to Phase 3):
--   - Shipping + soft-delete columns on orders
--   - Soft-delete on order_items
--   - staff_roles (RBAC for future staff app)
--   - notifications (customer/staff in-app notifications)
--   - user_stamps (persist rewards scratch grid; replaces localStorage)
--
-- Run in Supabase SQL editor or your migration pipeline.
-- Uses gen_random_uuid() (available on Supabase Postgres).

-- ---------------------------------------------------------------------------
-- Orders: Delyva / shipping metadata + soft delete
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delyva_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN orders.courier_code IS 'Courier identifier from Delyva or internal enum';
COMMENT ON COLUMN orders.tracking_number IS 'Carrier tracking number after shipment is booked';
COMMENT ON COLUMN orders.shipping_rate IS 'Quoted or charged shipping amount';
COMMENT ON COLUMN orders.shipping_label_url IS 'PDF/URL for shipping label';
COMMENT ON COLUMN orders.delyva_order_id IS 'Delyva API order id';
COMMENT ON COLUMN orders.deleted_at IS 'Soft delete; NULL = active order';

CREATE INDEX IF NOT EXISTS idx_orders_deleted_at_null
  ON orders (deleted_at)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Order line items: soft delete (e.g. hide lines when order is archived)
-- ---------------------------------------------------------------------------
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN order_items.deleted_at IS 'Soft delete; NULL = active line';

CREATE INDEX IF NOT EXISTS idx_order_items_deleted_at_null
  ON order_items (deleted_at)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Staff roles (one row per auth user; managed via service role / SQL)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'warehouse', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_roles_select_own" ON staff_roles;
CREATE POLICY "staff_roles_select_own"
  ON staff_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Notifications (inserts typically via service role / API; users read/update own)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, read_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reward stamps (9-slot grid per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  stamps BOOLEAN[] NOT NULL DEFAULT ARRAY[
    false, false, false, false, false, false, false, false, false
  ]::BOOLEAN[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id),
  CONSTRAINT user_stamps_nine_slots CHECK (array_length(stamps, 1) = 9)
);

ALTER TABLE user_stamps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stamps_select_own" ON user_stamps;
CREATE POLICY "user_stamps_select_own"
  ON user_stamps
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_stamps_insert_own" ON user_stamps;
CREATE POLICY "user_stamps_insert_own"
  ON user_stamps
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_stamps_update_own" ON user_stamps;
CREATE POLICY "user_stamps_update_own"
  ON user_stamps
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
