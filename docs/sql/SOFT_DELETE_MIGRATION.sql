-- ============================================
-- SOFT DELETE MIGRATION (PASTE INTO SUPABASE SQL EDITOR)
-- ============================================
-- Purpose:
-- - Add deleted_at columns for soft delete across key tables
-- - Add missing active columns where needed
-- - Add partial indexes for performance
-- - Add documentation comments
--
-- Notes:
-- - This script is safe to re-run (IF NOT EXISTS guards)
-- - Orders/order_items/payments and *_logs tables are intentionally excluded

-- Add deleted_at columns to tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE brand ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE ranges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE product_folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE post_folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add active columns where missing (per docs/SOFT_DELETE_STRATEGY.md)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE product_folders ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE post_folders ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Partial indexes for fast "active rows" queries
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_colors_deleted_at ON product_colors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_sizes_deleted_at ON product_sizes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;

-- Composite indexes for common filters (optional but helpful)
-- Some deployments may not have an `active` column on these tables yet.
-- We conditionally create composite indexes only when the column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_products_active_deleted ON products(active, deleted_at);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'categories'
      AND column_name = 'active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_categories_active_deleted ON categories(active, deleted_at);
  END IF;
END $$;

-- Column comments
COMMENT ON COLUMN products.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN product_colors.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN product_sizes.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN categories.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN brand.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN departments.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN ranges.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN posts.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN product_folders.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';
COMMENT ON COLUMN post_folders.deleted_at IS 'Soft delete timestamp. NULL = active, timestamp = deleted';


