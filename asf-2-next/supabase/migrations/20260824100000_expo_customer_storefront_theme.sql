-- =============================================================================
-- Expo Customer Storefront Theme — schema (R7 DDL)
-- =============================================================================
-- Purpose: Colorway medias, post↔product linking, taxonomy parent FKs, promo
--   image_url, and Shop filter indexes. No seed data.
-- Dual-path mirror: asf-2-next/supabase/migrations/ (same filename).
-- Idempotent: IF NOT EXISTS / DO $$ guards for re-runs.
-- RLS: post_products left without RLS (mirrors posts / catalog peers).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) product_medias.color_id → product_colors (colorway medias)
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_medias
  ADD COLUMN IF NOT EXISTS color_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_medias_color_id_fkey'
  ) THEN
    ALTER TABLE public.product_medias
      ADD CONSTRAINT product_medias_color_id_fkey
      FOREIGN KEY (color_id)
      REFERENCES public.product_colors (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_medias_color_id
  ON public.product_medias (color_id)
  WHERE color_id IS NOT NULL;

COMMENT ON COLUMN public.product_medias.color_id IS
  'Optional product_colors row this media belongs to (Storefront swatch photos). NULL = product-level media.';

-- ---------------------------------------------------------------------------
-- 2) post_products (junction; style of promotion_products + created_at)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_products (
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_post_products_product_id
  ON public.post_products (product_id);

COMMENT ON TABLE public.post_products IS
  'Explicit many-to-many post ↔ product links (unioned with posts taxonomy FKs in Storefront resolvers).';

COMMENT ON COLUMN public.post_products.post_id IS
  'Post being linked.';

COMMENT ON COLUMN public.post_products.product_id IS
  'Product linked to the post.';

COMMENT ON COLUMN public.post_products.created_at IS
  'When the explicit link was created.';

-- ---------------------------------------------------------------------------
-- 3) posts taxonomy FKs (nullable; one primary dimension preferred in seed)
-- ---------------------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS department_id uuid NULL;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS range_id uuid NULL;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS category_id uuid NULL;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS brand_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_department_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_department_id_fkey
      FOREIGN KEY (department_id)
      REFERENCES public.departments (id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_range_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_range_id_fkey
      FOREIGN KEY (range_id)
      REFERENCES public.ranges (id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_category_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_category_id_fkey
      FOREIGN KEY (category_id)
      REFERENCES public.categories (id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_brand_id_fkey'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_brand_id_fkey
      FOREIGN KEY (brand_id)
      REFERENCES public.brand (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_department_id
  ON public.posts (department_id)
  WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_range_id
  ON public.posts (range_id)
  WHERE range_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_category_id
  ON public.posts (category_id)
  WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_brand_id
  ON public.posts (brand_id)
  WHERE brand_id IS NOT NULL;

COMMENT ON COLUMN public.posts.department_id IS
  'Optional taxonomy auto-link: products with this department_id.';

COMMENT ON COLUMN public.posts.range_id IS
  'Optional taxonomy auto-link: products with this range_id.';

COMMENT ON COLUMN public.posts.category_id IS
  'Optional taxonomy auto-link: products in this category (FK and/or product_categories).';

COMMENT ON COLUMN public.posts.brand_id IS
  'Optional taxonomy auto-link: products with this brand_id.';

-- ---------------------------------------------------------------------------
-- 4) ranges.department_id → departments
-- ---------------------------------------------------------------------------
ALTER TABLE public.ranges
  ADD COLUMN IF NOT EXISTS department_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ranges_department_id_fkey'
  ) THEN
    ALTER TABLE public.ranges
      ADD CONSTRAINT ranges_department_id_fkey
      FOREIGN KEY (department_id)
      REFERENCES public.departments (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ranges_department_id
  ON public.ranges (department_id)
  WHERE department_id IS NOT NULL;

COMMENT ON COLUMN public.ranges.department_id IS
  'Parent department for Shop next-level tiles (department → ranges).';

-- ---------------------------------------------------------------------------
-- 5) categories.range_id → ranges
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS range_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_range_id_fkey'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_range_id_fkey
      FOREIGN KEY (range_id)
      REFERENCES public.ranges (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_range_id
  ON public.categories (range_id)
  WHERE range_id IS NOT NULL;

COMMENT ON COLUMN public.categories.range_id IS
  'Parent range for Shop next-level tiles (range → categories).';

-- ---------------------------------------------------------------------------
-- 6) promotions.image_url (Home feed full-bleed)
-- ---------------------------------------------------------------------------
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS image_url text NULL;

COMMENT ON COLUMN public.promotions.image_url IS
  'Optional full-bleed image URL for Storefront Home promo feed blocks.';

-- ---------------------------------------------------------------------------
-- 7) Shop filter indexes on products (if missing)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_department_id
  ON public.products (department_id)
  WHERE department_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_range_id
  ON public.products (range_id)
  WHERE range_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products (category_id)
  WHERE category_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id
  ON public.products (brand_id)
  WHERE brand_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_created_at_desc
  ON public.products (created_at DESC)
  WHERE deleted_at IS NULL;
