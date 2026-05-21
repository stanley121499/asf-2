-- =============================================================================
-- Missing indexes for common lookups (Phase 8 — production hardening)
--
-- Run these statements in the Supabase SQL Editor for your project.
-- Review `pg_indexes` / Dashboard first to avoid duplicate index names.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);

CREATE INDEX IF NOT EXISTS idx_add_to_carts_user_id ON add_to_carts (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
