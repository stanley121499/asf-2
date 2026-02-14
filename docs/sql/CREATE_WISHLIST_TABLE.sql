-- Wishlist table + security (Supabase / Postgres)
--
-- This creates a per-user wishlist linking `user_details` to `products`.
-- It also enables RLS so users can only see/modify their own wishlist rows.
--
-- NOTE:
-- - This file is intended to be run in your Supabase SQL editor or migration system.
-- - If your project uses `gen_random_uuid()` (pgcrypto) instead of `uuid_generate_v4()`,
--   you can swap the default expression accordingly.

-- Step 0: Ensure UUID generator exists (required for uuid_generate_v4()).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create wishlist table.
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_details(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Step 2: Enable Row Level Security (RLS).
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Step 3: Policies (only allow current user).
-- Read: user can only read their own wishlist rows.
CREATE POLICY "wishlist_select_own"
  ON wishlist
  FOR SELECT
  USING (user_id = auth.uid());

-- Insert: user can only create rows for themself.
CREATE POLICY "wishlist_insert_own"
  ON wishlist
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Delete: user can only delete their own rows.
CREATE POLICY "wishlist_delete_own"
  ON wishlist
  FOR DELETE
  USING (user_id = auth.uid());



