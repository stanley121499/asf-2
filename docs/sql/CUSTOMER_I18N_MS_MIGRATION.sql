-- Customer App i18n — widen locale CHECK to allow Malay (ms)
--
-- Run order:
--   1. CUSTOMER_I18N_TRANSLATION_TABLES.sql
--   2. CUSTOMER_I18N_SEED_EN.sql
--   3. CUSTOMER_I18N_MS_MIGRATION.sql  (this file)
--   4. CUSTOMER_I18N_SEED_MS.sql
--
-- Mirror of: supabase/migrations/20260716120000_customer_i18n_ms_locale.sql
-- Do NOT run against production without review. Paste into Supabase SQL Editor.

-- product_translations
ALTER TABLE product_translations DROP CONSTRAINT IF EXISTS product_translations_locale_check;
ALTER TABLE product_translations ADD CONSTRAINT product_translations_locale_check CHECK (locale IN ('zh-CN', 'en', 'ms'));

-- category_translations
ALTER TABLE category_translations DROP CONSTRAINT IF EXISTS category_translations_locale_check;
ALTER TABLE category_translations ADD CONSTRAINT category_translations_locale_check CHECK (locale IN ('zh-CN', 'en', 'ms'));

-- brand_translations
ALTER TABLE brand_translations DROP CONSTRAINT IF EXISTS brand_translations_locale_check;
ALTER TABLE brand_translations ADD CONSTRAINT brand_translations_locale_check CHECK (locale IN ('zh-CN', 'en', 'ms'));

-- department_translations
ALTER TABLE department_translations DROP CONSTRAINT IF EXISTS department_translations_locale_check;
ALTER TABLE department_translations ADD CONSTRAINT department_translations_locale_check CHECK (locale IN ('zh-CN', 'en', 'ms'));

-- range_translations
ALTER TABLE range_translations DROP CONSTRAINT IF EXISTS range_translations_locale_check;
ALTER TABLE range_translations ADD CONSTRAINT range_translations_locale_check CHECK (locale IN ('zh-CN', 'en', 'ms'));

-- post_translations
ALTER TABLE post_translations DROP CONSTRAINT IF EXISTS post_translations_locale_check;
ALTER TABLE post_translations ADD CONSTRAINT post_translations_locale_check CHECK (locale IN ('zh-CN', 'en', 'ms'));
