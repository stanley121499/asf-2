-- =============================================================================
-- RLS audit — user-scoped tables (Phase 8)
--
-- Run and verify in the Supabase SQL Editor. This file documents **expected**
-- Row Level Security for tables tied to end users. The repository cannot read
-- your live Dashboard policies — use Authentication → Policies to confirm each
-- table has at least one **user-scoped SELECT** (and appropriate write rules).
--
-- FLAG / VERIFY IN DASHBOARD (must exist before trusting client-side queries):
--   - orders: SELECT where user_id = auth.uid() (plus any staff override policies)
--   - add_to_carts: SELECT/INSERT/UPDATE/DELETE scoped to user_id = auth.uid()
--   - notifications: SELECT (and UPDATE for read_at) where user_id = auth.uid()
--   - user_stamps: ALL where user_id = auth.uid()
--   - user_details: this table has **no user_id column**; the row PK `id` is the
--     auth user id — policies must use id = auth.uid()
--
-- If any table above lacks a user-scoped SELECT policy, treat it as a **GAP**
-- until policies are added (cross-user reads are possible with anon key).
--
-- Related: promotion RLS templates live in docs/sql/step_10_promotions.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Example: customers read only their rows (adjust names if policies already exist).
-- DROP POLICY IF EXISTS "orders_select_own" ON orders;
-- CREATE POLICY "orders_select_own"
--   ON orders FOR SELECT
--   USING (user_id = auth.uid());

-- Example: users insert their own orders (if created from client).
-- CREATE POLICY "orders_insert_own"
--   ON orders FOR INSERT
--   WITH CHECK (user_id = auth.uid());

-- Example: users update only their rows (e.g. cancel) — tighten as needed.
-- CREATE POLICY "orders_update_own"
--   ON orders FOR UPDATE
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- add_to_carts
-- -----------------------------------------------------------------------------
ALTER TABLE add_to_carts ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "carts_select_own"
--   ON add_to_carts FOR SELECT
--   USING (user_id = auth.uid());

-- CREATE POLICY "carts_insert_own"
--   ON add_to_carts FOR INSERT
--   WITH CHECK (user_id = auth.uid());

-- CREATE POLICY "carts_update_own"
--   ON add_to_carts FOR UPDATE
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid());

-- CREATE POLICY "carts_delete_own"
--   ON add_to_carts FOR DELETE
--   USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "notifications_select_own"
--   ON notifications FOR SELECT
--   USING (user_id = auth.uid());

-- CREATE POLICY "notifications_update_own"
--   ON notifications FOR UPDATE
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- user_stamps
-- -----------------------------------------------------------------------------
ALTER TABLE user_stamps ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "user_stamps_all_own"
--   ON user_stamps FOR ALL
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- user_details (PK id = auth user id; **not** user_id)
-- -----------------------------------------------------------------------------
ALTER TABLE user_details ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "user_details_select_own"
--   ON user_details FOR SELECT
--   USING (id = auth.uid());

-- CREATE POLICY "user_details_update_own"
--   ON user_details FOR UPDATE
--   USING (id = auth.uid())
--   WITH CHECK (id = auth.uid());
