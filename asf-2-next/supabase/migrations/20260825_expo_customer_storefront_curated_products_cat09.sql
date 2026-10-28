-- =============================================================================
-- Expo Customer Storefront Curated Seed — Agent 11 products cat09
-- Category: 包袋 (4 SKUs)
-- =============================================================================

INSERT INTO public.products (
  id, name, price, status, description, brand_id, category_id, department_id, range_id, created_at, updated_at
) VALUES
  ('dddd0901-24a8-4f00-8000-000000000001', '迷你斜挎包', 129, 'Published', '精选包袋，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000005', 'a3300001-24a8-4f00-8000-000000000009', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '198 hours', NOW()),
  ('dddd0902-24a8-4f00-8000-000000000002', '托特购物袋', 99, 'Published', '精选包袋，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000009', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '197 hours', NOW()),
  ('dddd0903-24a8-4f00-8000-000000000003', '双肩通勤包', 189, 'Published', '精选包袋，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000009', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '196 hours', NOW()),
  ('dddd0904-24a8-4f00-8000-000000000004', '皮质手拿包', 149, 'Published', '精选包袋，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000009', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '195 hours', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  brand_id = EXCLUDED.brand_id,
  category_id = EXCLUDED.category_id,
  department_id = EXCLUDED.department_id,
  range_id = EXCLUDED.range_id,
  created_at = EXCLUDED.created_at,
  deleted_at = NULL,
  updated_at = NOW();

INSERT INTO public.product_colors (id, product_id, color, active, created_at, updated_at) VALUES
  ('a3500901-24a8-4f00-8000-000000000001', 'dddd0901-24a8-4f00-8000-000000000001', '#111111', true, NOW(), NOW()),
  ('a3500901-24a8-4f00-8000-000000000002', 'dddd0901-24a8-4f00-8000-000000000001', '#78350F', true, NOW(), NOW()),
  ('a3500902-24a8-4f00-8000-000000000001', 'dddd0902-24a8-4f00-8000-000000000002', '#F5F0E8', true, NOW(), NOW()),
  ('a3500902-24a8-4f00-8000-000000000002', 'dddd0902-24a8-4f00-8000-000000000002', '#111111', true, NOW(), NOW()),
  ('a3500903-24a8-4f00-8000-000000000001', 'dddd0903-24a8-4f00-8000-000000000003', '#111111', true, NOW(), NOW()),
  ('a3500903-24a8-4f00-8000-000000000002', 'dddd0903-24a8-4f00-8000-000000000003', '#1E3A5F', true, NOW(), NOW()),
  ('a3500904-24a8-4f00-8000-000000000001', 'dddd0904-24a8-4f00-8000-000000000004', '#78350F', true, NOW(), NOW()),
  ('a3500904-24a8-4f00-8000-000000000002', 'dddd0904-24a8-4f00-8000-000000000004', '#111111', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  color = EXCLUDED.color,
  active = EXCLUDED.active,
  deleted_at = NULL,
  updated_at = NOW();

INSERT INTO public.product_medias (id, product_id, media_url, arrangement, color_id, created_at, updated_at) VALUES
  ('a3600901-24a8-4f00-8000-000000000001', 'dddd0901-24a8-4f00-8000-000000000001', '', 10, 'a3500901-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3600901-24a8-4f00-8000-000000000002', 'dddd0901-24a8-4f00-8000-000000000001', '', 11, 'a3500901-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3600901-24a8-4f00-8000-000000000003', 'dddd0901-24a8-4f00-8000-000000000001', '', 1, NULL, NOW(), NOW()),
  ('a3600902-24a8-4f00-8000-000000000001', 'dddd0902-24a8-4f00-8000-000000000002', '', 10, 'a3500902-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3600902-24a8-4f00-8000-000000000002', 'dddd0902-24a8-4f00-8000-000000000002', '', 11, 'a3500902-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3600902-24a8-4f00-8000-000000000003', 'dddd0902-24a8-4f00-8000-000000000002', '', 1, NULL, NOW(), NOW()),
  ('a3600903-24a8-4f00-8000-000000000001', 'dddd0903-24a8-4f00-8000-000000000003', '', 10, 'a3500903-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3600903-24a8-4f00-8000-000000000002', 'dddd0903-24a8-4f00-8000-000000000003', '', 11, 'a3500903-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3600903-24a8-4f00-8000-000000000003', 'dddd0903-24a8-4f00-8000-000000000003', '', 1, NULL, NOW(), NOW()),
  ('a3600904-24a8-4f00-8000-000000000001', 'dddd0904-24a8-4f00-8000-000000000004', '', 10, 'a3500904-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3600904-24a8-4f00-8000-000000000002', 'dddd0904-24a8-4f00-8000-000000000004', '', 11, 'a3500904-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3600904-24a8-4f00-8000-000000000003', 'dddd0904-24a8-4f00-8000-000000000004', '', 1, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  color_id = EXCLUDED.color_id,
  updated_at = NOW();

INSERT INTO public.product_translations (product_id, locale, name, description) VALUES
  ('dddd0901-24a8-4f00-8000-000000000001', 'en', 'Mini Crossbody Bag', 'Premium 包袋 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd0901-24a8-4f00-8000-000000000001', 'ms', 'Mini Crossbody Bag', '包袋 premium untuk gaya harian dan keselesaan.'),
  ('dddd0902-24a8-4f00-8000-000000000002', 'en', 'Tote Shopper Bag', 'Premium 包袋 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd0902-24a8-4f00-8000-000000000002', 'ms', 'Tote Shopper Bag', '包袋 premium untuk gaya harian dan keselesaan.'),
  ('dddd0903-24a8-4f00-8000-000000000003', 'en', 'Commuter Backpack', 'Premium 包袋 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd0903-24a8-4f00-8000-000000000003', 'ms', 'Commuter Backpack', '包袋 premium untuk gaya harian dan keselesaan.'),
  ('dddd0904-24a8-4f00-8000-000000000004', 'en', 'Leather Clutch', 'Premium 包袋 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd0904-24a8-4f00-8000-000000000004', 'ms', 'Leather Clutch', '包袋 premium untuk gaya harian dan keselesaan.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO public.product_categories (id, product_id, category_id, created_at, updated_at) VALUES
  ('a3540901-24a8-4f00-8000-000000000001', 'dddd0901-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000009', NOW(), NOW()),
  ('a3540902-24a8-4f00-8000-000000000001', 'dddd0902-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000009', NOW(), NOW()),
  ('a3540903-24a8-4f00-8000-000000000001', 'dddd0903-24a8-4f00-8000-000000000003', 'a3300001-24a8-4f00-8000-000000000009', NOW(), NOW()),
  ('a3540904-24a8-4f00-8000-000000000001', 'dddd0904-24a8-4f00-8000-000000000004', 'a3300001-24a8-4f00-8000-000000000009', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  category_id = EXCLUDED.category_id,
  updated_at = NOW();

INSERT INTO public.product_stock (id, product_id, color_id, size_id, count, created_at) VALUES
  ('a3550901-24a8-4f00-8000-000000000001', 'dddd0901-24a8-4f00-8000-000000000001', NULL, NULL, 25, NOW()),
  ('a3550902-24a8-4f00-8000-000000000001', 'dddd0902-24a8-4f00-8000-000000000002', NULL, NULL, 25, NOW()),
  ('a3550903-24a8-4f00-8000-000000000001', 'dddd0903-24a8-4f00-8000-000000000003', NULL, NULL, 25, NOW()),
  ('a3550904-24a8-4f00-8000-000000000001', 'dddd0904-24a8-4f00-8000-000000000004', NULL, NULL, 25, NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  count = EXCLUDED.count;
