-- Feature Flags Migration
-- Run in Supabase SQL editor or migration pipeline.
--
-- Creates the `feature_flags` table used by all three apps (asf-customer-app,
-- asf-staff-app, asf-2-next) to control module visibility platform-wide.
-- Flipping `enabled` for a row disables/enables that feature in every app
-- simultaneously via a shared Supabase Realtime subscription.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         TEXT        PRIMARY KEY,
  enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  label       TEXT        NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically update `updated_at` whenever a row is changed.
CREATE OR REPLACE FUNCTION public.feature_flags_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.feature_flags_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- All authenticated and anonymous clients can read flags.
-- Flags gate UX only — no secrets are stored here.
DROP POLICY IF EXISTS "feature_flags_read_all" ON public.feature_flags;
CREATE POLICY "feature_flags_read_all"
  ON public.feature_flags
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Writes are restricted to the service role (Supabase dashboard / admin scripts).
-- No UPDATE / INSERT / DELETE policy is granted to anon or authenticated roles.

-- ---------------------------------------------------------------------------
-- Seed rows — all enabled = true so there is zero behaviour change on deploy.
-- To disable a feature: UPDATE feature_flags SET enabled = false WHERE key = '...';
-- ---------------------------------------------------------------------------
INSERT INTO public.feature_flags (key, label, description) VALUES
  ('announcements',     'Announcements',       'Top-of-screen banner driven by the announcements table'),
  ('highlights',        'Highlights / Posts',  'Customer highlights tab + staff post CMS'),
  ('wishlist',          'Wishlist',             'Customer save/unsave products'),
  ('cart',              'Cart & Checkout',      'Add-to-cart, checkout flow, and Stripe payments'),
  ('promotions',        'Promotions',           'Promo codes at checkout + staff promotion management'),
  ('rewards',           'Rewards / Stamps',     'Stamp grid, points ledger, and membership tiers'),
  ('notifications',     'Notifications',        'In-app notification bell and feed'),
  ('support_chat',      'Support Chat',         'Customer support tickets and live chat with staff'),
  ('orders',            'Orders',               'Customer order history and staff order management'),
  ('stocks',            'Stock Management',     'Stock overview, all-stock view, and per-product stock'),
  ('purchase_orders',   'Purchase Orders',      'Purchase order create / list / detail for warehouse staff'),
  ('stock_reports',     'Stock Reports',        'Stock count reports for warehouse staff'),
  ('analytics',         'Analytics',            'Revenue, products, categories, and user analytics'),
  ('user_management',   'User Management',      'Staff user list and profile management'),
  ('payments',          'Payments',             'Stripe payment list and detail for staff'),
  ('internal_chat',     'Internal Chat',        'Staff direct-message, group, and community chat (web admin)'),
  ('home_page_builder', 'Home Page Builder',    'Drag-and-drop homepage element editor (web admin)'),
  ('maintenance',       'Maintenance Mode',     'Show maintenance screen to all customers; staff unaffected'),
  ('signup',            'Customer Sign Up',     'Allow new customer registrations'),
  ('store_locations',   'Store Locations',      'Physical store locator and management CRUD')
ON CONFLICT (key) DO NOTHING;
