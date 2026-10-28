-- =============================================================================
-- Expo Customer Storefront Curated Seed — Agent 02 taxonomy + translations
-- =============================================================================
-- 3 departments, 6 ranges, 12 categories, 6 brands (zh canonical + en/ms).
-- media_url placeholders — Agent 15 fills with Supabase Storage URLs.
-- Idempotent: fixed UUIDs + ON CONFLICT DO UPDATE.
-- Mirror: asf-2-next/supabase/migrations/ (same filename).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Departments (a3100001-*)
-- ---------------------------------------------------------------------------
INSERT INTO public.departments (id, name, active, media_url, created_at) VALUES
  ('a3100001-24a8-4f00-8000-000000000001', '男鞋', true, NULL, NOW()),
  ('a3100001-24a8-4f00-8000-000000000002', '女鞋', true, NULL, NOW()),
  ('a3100001-24a8-4f00-8000-000000000003', '配件护理', true, NULL, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 2) Ranges (a3200001-*)
-- ---------------------------------------------------------------------------
INSERT INTO public.ranges (id, name, active, media_url, department_id, created_at) VALUES
  ('a3200001-24a8-4f00-8000-000000000001', '运动休闲', true, NULL, 'a3100001-24a8-4f00-8000-000000000001', NOW()),
  ('a3200001-24a8-4f00-8000-000000000002', '正装通勤', true, NULL, 'a3100001-24a8-4f00-8000-000000000001', NOW()),
  ('a3200001-24a8-4f00-8000-000000000003', '日常通勤', true, NULL, 'a3100001-24a8-4f00-8000-000000000002', NOW()),
  ('a3200001-24a8-4f00-8000-000000000004', '时尚靴履', true, NULL, 'a3100001-24a8-4f00-8000-000000000002', NOW()),
  ('a3200001-24a8-4f00-8000-000000000005', '穿戴配件', true, NULL, 'a3100001-24a8-4f00-8000-000000000003', NOW()),
  ('a3200001-24a8-4f00-8000-000000000006', '护理精选', true, NULL, 'a3100001-24a8-4f00-8000-000000000003', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  media_url = EXCLUDED.media_url,
  department_id = EXCLUDED.department_id,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 3) Categories (a3300001-*)
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (id, name, active, media_url, arrangement, range_id, created_at) VALUES
  ('a3300001-24a8-4f00-8000-000000000001', '跑鞋', true, '', 1, 'a3200001-24a8-4f00-8000-000000000001', NOW()),
  ('a3300001-24a8-4f00-8000-000000000002', '板鞋球场', true, '', 2, 'a3200001-24a8-4f00-8000-000000000001', NOW()),
  ('a3300001-24a8-4f00-8000-000000000003', '正装皮鞋', true, '', 1, 'a3200001-24a8-4f00-8000-000000000002', NOW()),
  ('a3300001-24a8-4f00-8000-000000000004', '男靴', true, '', 2, 'a3200001-24a8-4f00-8000-000000000002', NOW()),
  ('a3300001-24a8-4f00-8000-000000000005', '一脚蹬', true, '', 1, 'a3200001-24a8-4f00-8000-000000000003', NOW()),
  ('a3300001-24a8-4f00-8000-000000000006', '休闲运动鞋', true, '', 2, 'a3200001-24a8-4f00-8000-000000000003', NOW()),
  ('a3300001-24a8-4f00-8000-000000000007', '短靴', true, '', 1, 'a3200001-24a8-4f00-8000-000000000004', NOW()),
  ('a3300001-24a8-4f00-8000-000000000008', '时尚高帮', true, '', 2, 'a3200001-24a8-4f00-8000-000000000004', NOW()),
  ('a3300001-24a8-4f00-8000-000000000009', '包袋', true, '', 1, 'a3200001-24a8-4f00-8000-000000000005', NOW()),
  ('a3300001-24a8-4f00-8000-000000000010', '帽袜', true, '', 2, 'a3200001-24a8-4f00-8000-000000000005', NOW()),
  ('a3300001-24a8-4f00-8000-000000000011', '护理套装', true, '', 1, 'a3200001-24a8-4f00-8000-000000000006', NOW()),
  ('a3300001-24a8-4f00-8000-000000000012', '腰带与小物', true, '', 2, 'a3200001-24a8-4f00-8000-000000000006', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  range_id = EXCLUDED.range_id,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 4) Brands (a3400001-*) — zh canonical name
-- ---------------------------------------------------------------------------
INSERT INTO public.brand (id, name, active, media_url, created_at) VALUES
  ('a3400001-24a8-4f00-8000-000000000001', '模力', true, NULL, NOW()),
  ('a3400001-24a8-4f00-8000-000000000002', 'ASF 工作室', true, NULL, NOW()),
  ('a3400001-24a8-4f00-8000-000000000003', '球场线', true, NULL, NOW()),
  ('a3400001-24a8-4f00-8000-000000000004', '越野型', true, NULL, NOW()),
  ('a3400001-24a8-4f00-8000-000000000005', '柔步', true, NULL, NOW()),
  ('a3400001-24a8-4f00-8000-000000000006', '北径', true, NULL, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  media_url = EXCLUDED.media_url,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 5) Translations — en + ms
-- ---------------------------------------------------------------------------
INSERT INTO public.department_translations (department_id, locale, name) VALUES
  ('a3100001-24a8-4f00-8000-000000000001', 'en', 'Men''s footwear'),
  ('a3100001-24a8-4f00-8000-000000000001', 'ms', 'Kasut lelaki'),
  ('a3100001-24a8-4f00-8000-000000000002', 'en', 'Women''s footwear'),
  ('a3100001-24a8-4f00-8000-000000000002', 'ms', 'Kasut wanita'),
  ('a3100001-24a8-4f00-8000-000000000003', 'en', 'Accessories & care'),
  ('a3100001-24a8-4f00-8000-000000000003', 'ms', 'Aksesori & penjagaan')
ON CONFLICT (department_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO public.range_translations (range_id, locale, name) VALUES
  ('a3200001-24a8-4f00-8000-000000000001', 'en', 'Sport casual'),
  ('a3200001-24a8-4f00-8000-000000000001', 'ms', 'Sukan kasual'),
  ('a3200001-24a8-4f00-8000-000000000002', 'en', 'Formal commute'),
  ('a3200001-24a8-4f00-8000-000000000002', 'ms', 'Komuter rasmi'),
  ('a3200001-24a8-4f00-8000-000000000003', 'en', 'Daily commute'),
  ('a3200001-24a8-4f00-8000-000000000003', 'ms', 'Komuter harian'),
  ('a3200001-24a8-4f00-8000-000000000004', 'en', 'Fashion boots'),
  ('a3200001-24a8-4f00-8000-000000000004', 'ms', 'But fesyen'),
  ('a3200001-24a8-4f00-8000-000000000005', 'en', 'Wearables'),
  ('a3200001-24a8-4f00-8000-000000000005', 'ms', 'Aksesori pakai'),
  ('a3200001-24a8-4f00-8000-000000000006', 'en', 'Care essentials'),
  ('a3200001-24a8-4f00-8000-000000000006', 'ms', 'Penjagaan terpilih')
ON CONFLICT (range_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO public.category_translations (category_id, locale, name) VALUES
  ('a3300001-24a8-4f00-8000-000000000001', 'en', 'Running shoes'),
  ('a3300001-24a8-4f00-8000-000000000001', 'ms', 'Kasut lari'),
  ('a3300001-24a8-4f00-8000-000000000002', 'en', 'Court sneakers'),
  ('a3300001-24a8-4f00-8000-000000000002', 'ms', 'Kasut gelanggang'),
  ('a3300001-24a8-4f00-8000-000000000003', 'en', 'Dress shoes'),
  ('a3300001-24a8-4f00-8000-000000000003', 'ms', 'Kasut rasmi'),
  ('a3300001-24a8-4f00-8000-000000000004', 'en', 'Men''s boots'),
  ('a3300001-24a8-4f00-8000-000000000004', 'ms', 'But lelaki'),
  ('a3300001-24a8-4f00-8000-000000000005', 'en', 'Slip-ons'),
  ('a3300001-24a8-4f00-8000-000000000005', 'ms', 'Kasut slip-on'),
  ('a3300001-24a8-4f00-8000-000000000006', 'en', 'Casual sneakers'),
  ('a3300001-24a8-4f00-8000-000000000006', 'ms', 'Sneaker kasual'),
  ('a3300001-24a8-4f00-8000-000000000007', 'en', 'Ankle boots'),
  ('a3300001-24a8-4f00-8000-000000000007', 'ms', 'But buku lali'),
  ('a3300001-24a8-4f00-8000-000000000008', 'en', 'Fashion high-tops'),
  ('a3300001-24a8-4f00-8000-000000000008', 'ms', 'High-top fesyen'),
  ('a3300001-24a8-4f00-8000-000000000009', 'en', 'Bags'),
  ('a3300001-24a8-4f00-8000-000000000009', 'ms', 'Beg'),
  ('a3300001-24a8-4f00-8000-000000000010', 'en', 'Caps & socks'),
  ('a3300001-24a8-4f00-8000-000000000010', 'ms', 'Topi & stokin'),
  ('a3300001-24a8-4f00-8000-000000000011', 'en', 'Care kits'),
  ('a3300001-24a8-4f00-8000-000000000011', 'ms', 'Kit penjagaan'),
  ('a3300001-24a8-4f00-8000-000000000012', 'en', 'Belts & small goods'),
  ('a3300001-24a8-4f00-8000-000000000012', 'ms', 'Tali pinggang & aksesori')
ON CONFLICT (category_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO public.brand_translations (brand_id, locale, name) VALUES
  ('a3400001-24a8-4f00-8000-000000000001', 'en', 'MODEL MATCH'),
  ('a3400001-24a8-4f00-8000-000000000001', 'ms', 'MODEL MATCH'),
  ('a3400001-24a8-4f00-8000-000000000002', 'en', 'ASF Studio'),
  ('a3400001-24a8-4f00-8000-000000000002', 'ms', 'ASF Studio'),
  ('a3400001-24a8-4f00-8000-000000000003', 'en', 'Courtline'),
  ('a3400001-24a8-4f00-8000-000000000003', 'ms', 'Courtline'),
  ('a3400001-24a8-4f00-8000-000000000004', 'en', 'Trailform'),
  ('a3400001-24a8-4f00-8000-000000000004', 'ms', 'Trailform'),
  ('a3400001-24a8-4f00-8000-000000000005', 'en', 'Softstep'),
  ('a3400001-24a8-4f00-8000-000000000005', 'ms', 'Softstep'),
  ('a3400001-24a8-4f00-8000-000000000006', 'en', 'Nordpath'),
  ('a3400001-24a8-4f00-8000-000000000006', 'ms', 'Nordpath')
ON CONFLICT (brand_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();
