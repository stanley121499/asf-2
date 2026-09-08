-- =============================================================================
-- Expo Customer Engagement — Discovery Points + Nearby Wishlist Stock (schema)
-- =============================================================================
-- Purpose: rewards_settings, content_view_awards, store_product_stock,
--   user_location_snapshots (upsert-latest), wishlist_nearby_push_log,
--   notification_preferences.nearby_stock_push, wishlist_nearby_stock templates.
-- Apply before Agents 2–6 (rewards APIs, Expo ceremony, store stock admin,
--   nearby cron, Expo Always location / demo inbox).
-- Idempotent: IF NOT EXISTS / ON CONFLICT / DROP POLICY IF EXISTS.
-- Demo inbox rows: NOT applied here — see docs/sql/SEED_DEMO_CUSTOMER_NOTIFICATIONS.sql
--   (set demo_user_id or target users with push_tokens / wishlist).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) rewards_settings (singleton)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content_view_points INTEGER NOT NULL DEFAULT 1
    CHECK (content_view_points >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.rewards_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rewards_settings_select_authenticated ON public.rewards_settings;
CREATE POLICY rewards_settings_select_authenticated
  ON public.rewards_settings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS rewards_settings_select_anon ON public.rewards_settings;
CREATE POLICY rewards_settings_select_anon
  ON public.rewards_settings
  FOR SELECT
  TO anon
  USING (true);

-- Writes via admin API + service role only (no INSERT/UPDATE policies for clients).

INSERT INTO public.rewards_settings (id, content_view_points)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) content_view_awards (idempotent discovery awards)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_view_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('product', 'post', 'promo')),
  content_id UUID NOT NULL,
  points_awarded INTEGER NOT NULL CHECK (points_awarded >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT content_view_awards_user_content_unique
    UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_content_view_awards_user_id
  ON public.content_view_awards (user_id);

CREATE INDEX IF NOT EXISTS idx_content_view_awards_content
  ON public.content_view_awards (content_type, content_id);

ALTER TABLE public.content_view_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_view_awards_select_own ON public.content_view_awards;
CREATE POLICY content_view_awards_select_own
  ON public.content_view_awards
  FOR SELECT
  USING (user_id = auth.uid());

-- No client INSERT/UPDATE/DELETE — award via service-role API only.

-- ---------------------------------------------------------------------------
-- 3) store_product_stock (per store × product × color × size)
-- color_id / size_id nullable to match product_stock; UNIQUE NULLS NOT DISTINCT.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_product_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_location_id UUID NOT NULL
    REFERENCES public.store_locations (id) ON DELETE CASCADE,
  product_id UUID NOT NULL
    REFERENCES public.products (id) ON DELETE CASCADE,
  color_id UUID REFERENCES public.product_colors (id) ON DELETE CASCADE,
  size_id UUID REFERENCES public.product_sizes (id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT store_product_stock_store_sku_unique
    UNIQUE NULLS NOT DISTINCT (store_location_id, product_id, color_id, size_id)
);

CREATE INDEX IF NOT EXISTS idx_store_product_stock_store_product
  ON public.store_product_stock (store_location_id, product_id);

CREATE INDEX IF NOT EXISTS idx_store_product_stock_product_id
  ON public.store_product_stock (product_id);

ALTER TABLE public.store_product_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_product_stock_select_active_stores
  ON public.store_product_stock;
CREATE POLICY store_product_stock_select_active_stores
  ON public.store_product_stock
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.store_locations sl
      WHERE sl.id = store_location_id
        AND sl.active = TRUE
        AND sl.deleted_at IS NULL
    )
  );

-- Writes via staff API + service role only.

-- ---------------------------------------------------------------------------
-- 4) user_location_snapshots (one row per user — upsert-latest)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_location_snapshots (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy_m NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_location_snapshots_recorded_at
  ON public.user_location_snapshots (recorded_at DESC);

ALTER TABLE public.user_location_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_location_snapshots_select_own
  ON public.user_location_snapshots;
CREATE POLICY user_location_snapshots_select_own
  ON public.user_location_snapshots
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_location_snapshots_insert_own
  ON public.user_location_snapshots;
CREATE POLICY user_location_snapshots_insert_own
  ON public.user_location_snapshots
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_location_snapshots_update_own
  ON public.user_location_snapshots;
CREATE POLICY user_location_snapshots_update_own
  ON public.user_location_snapshots
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5) wishlist_nearby_push_log (7-day cooldown)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist_nearby_push_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  store_location_id UUID NOT NULL
    REFERENCES public.store_locations (id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications (id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_nearby_push_log_cooldown
  ON public.wishlist_nearby_push_log (user_id, product_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_wishlist_nearby_push_log_sent_at
  ON public.wishlist_nearby_push_log (sent_at DESC);

ALTER TABLE public.wishlist_nearby_push_log ENABLE ROW LEVEL SECURITY;

-- Service role only for matcher writes; users may SELECT own cooldown history.
DROP POLICY IF EXISTS wishlist_nearby_push_log_select_own
  ON public.wishlist_nearby_push_log;
CREATE POLICY wishlist_nearby_push_log_select_own
  ON public.wishlist_nearby_push_log
  FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6) notification_preferences.nearby_stock_push
-- ---------------------------------------------------------------------------
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS nearby_stock_push BOOLEAN NOT NULL DEFAULT TRUE;

-- ---------------------------------------------------------------------------
-- 7) Seed notification_templates — wishlist_nearby_stock × locales
-- ---------------------------------------------------------------------------
INSERT INTO public.notification_templates (type, locale, title_template, body_template)
VALUES
  (
    'wishlist_nearby_stock',
    'en',
    'In stock nearby',
    '{{product_name}} is available at {{mall_name}} ({{store_name}}). Come pick it up while it lasts.'
  ),
  (
    'wishlist_nearby_stock',
    'zh-CN',
    '附近门店有货',
    '{{product_name}} 在 {{mall_name}}（{{store_name}}）有货，欢迎就近选购。'
  ),
  (
    'wishlist_nearby_stock',
    'ms',
    'Ada stok berdekatan',
    '{{product_name}} tersedia di {{mall_name}} ({{store_name}}). Datang ambil sebelum kehabisan.'
  )
ON CONFLICT (type, locale) DO UPDATE
SET
  title_template = EXCLUDED.title_template,
  body_template = EXCLUDED.body_template,
  updated_at = NOW();
