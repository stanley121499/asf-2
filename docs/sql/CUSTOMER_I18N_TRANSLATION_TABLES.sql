-- Customer App i18n — translation tables
--
-- Run order:
--   1. CUSTOMER_I18N_TRANSLATION_TABLES.sql  (this file)
--   2. CUSTOMER_I18N_SEED_EN.sql
--
-- Do NOT run against production without review. Paste into Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION customer_i18n_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- product_translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  name TEXT NOT NULL,
  description TEXT,
  warranty_description TEXT,
  warranty_period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_product_translations_product_id_locale
  ON product_translations (product_id, locale);

DROP TRIGGER IF EXISTS product_translations_set_updated_at ON product_translations;
CREATE TRIGGER product_translations_set_updated_at
  BEFORE UPDATE ON product_translations
  FOR EACH ROW
  EXECUTE FUNCTION customer_i18n_set_updated_at();

ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_translations_select_public" ON product_translations;
CREATE POLICY "product_translations_select_public"
  ON product_translations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- category_translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_category_translations_category_id_locale
  ON category_translations (category_id, locale);

DROP TRIGGER IF EXISTS category_translations_set_updated_at ON category_translations;
CREATE TRIGGER category_translations_set_updated_at
  BEFORE UPDATE ON category_translations
  FOR EACH ROW
  EXECUTE FUNCTION customer_i18n_set_updated_at();

ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "category_translations_select_public" ON category_translations;
CREATE POLICY "category_translations_select_public"
  ON category_translations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- brand_translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brand_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_brand_translations_brand_id_locale
  ON brand_translations (brand_id, locale);

DROP TRIGGER IF EXISTS brand_translations_set_updated_at ON brand_translations;
CREATE TRIGGER brand_translations_set_updated_at
  BEFORE UPDATE ON brand_translations
  FOR EACH ROW
  EXECUTE FUNCTION customer_i18n_set_updated_at();

ALTER TABLE brand_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_translations_select_public" ON brand_translations;
CREATE POLICY "brand_translations_select_public"
  ON brand_translations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- department_translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS department_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (department_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_department_translations_department_id_locale
  ON department_translations (department_id, locale);

DROP TRIGGER IF EXISTS department_translations_set_updated_at ON department_translations;
CREATE TRIGGER department_translations_set_updated_at
  BEFORE UPDATE ON department_translations
  FOR EACH ROW
  EXECUTE FUNCTION customer_i18n_set_updated_at();

ALTER TABLE department_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "department_translations_select_public" ON department_translations;
CREATE POLICY "department_translations_select_public"
  ON department_translations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- range_translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS range_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  range_id UUID NOT NULL REFERENCES ranges(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (range_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_range_translations_range_id_locale
  ON range_translations (range_id, locale);

DROP TRIGGER IF EXISTS range_translations_set_updated_at ON range_translations;
CREATE TRIGGER range_translations_set_updated_at
  BEFORE UPDATE ON range_translations
  FOR EACH ROW
  EXECUTE FUNCTION customer_i18n_set_updated_at();

ALTER TABLE range_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "range_translations_select_public" ON range_translations;
CREATE POLICY "range_translations_select_public"
  ON range_translations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- post_translations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  name TEXT NOT NULL,
  caption TEXT,
  cta_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_post_translations_post_id_locale
  ON post_translations (post_id, locale);

DROP TRIGGER IF EXISTS post_translations_set_updated_at ON post_translations;
CREATE TRIGGER post_translations_set_updated_at
  BEFORE UPDATE ON post_translations
  FOR EACH ROW
  EXECUTE FUNCTION customer_i18n_set_updated_at();

ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_translations_select_public" ON post_translations;
CREATE POLICY "post_translations_select_public"
  ON post_translations
  FOR SELECT
  TO anon, authenticated
  USING (true);
