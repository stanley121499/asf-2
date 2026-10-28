INSERT INTO public.products (
  id, name, price, status, description, brand_id, category_id, department_id, range_id, created_at, updated_at
) VALUES
  ('dddd1001-24a8-4f00-8000-000000000001', '品牌棒球帽', 79, 'Published', '精选帽袜，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000010', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '208 hours', NOW()),
  ('dddd1002-24a8-4f00-8000-000000000002', '船员袜三双装', 39, 'Published', '精选帽袜，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000005', 'a3300001-24a8-4f00-8000-000000000010', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '207 hours', NOW()),
  ('dddd1003-24a8-4f00-8000-000000000003', '运动短袜三双装', 45, 'Published', '精选帽袜，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000010', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '206 hours', NOW()),
  ('dddd1004-24a8-4f00-8000-000000000004', '针织冷帽', 69, 'Published', '精选帽袜，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000010', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000005', NOW() - INTERVAL '205 hours', NOW())
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
  ('a3501001-24a8-4f00-8000-000000000001', 'dddd1001-24a8-4f00-8000-000000000001', '#111111', true, NOW(), NOW()),
  ('a3501001-24a8-4f00-8000-000000000002', 'dddd1001-24a8-4f00-8000-000000000001', '#F5F0E8', true, NOW(), NOW()),
  ('a3501001-24a8-4f00-8000-000000000003', 'dddd1001-24a8-4f00-8000-000000000001', '#1E3A5F', true, NOW(), NOW()),
  ('a3501002-24a8-4f00-8000-000000000001', 'dddd1002-24a8-4f00-8000-000000000002', '#FFFFFF', true, NOW(), NOW()),
  ('a3501002-24a8-4f00-8000-000000000002', 'dddd1002-24a8-4f00-8000-000000000002', '#9CA3AF', true, NOW(), NOW()),
  ('a3501002-24a8-4f00-8000-000000000003', 'dddd1002-24a8-4f00-8000-000000000002', '#111111', true, NOW(), NOW()),
  ('a3501003-24a8-4f00-8000-000000000001', 'dddd1003-24a8-4f00-8000-000000000003', '#FFFFFF', true, NOW(), NOW()),
  ('a3501003-24a8-4f00-8000-000000000002', 'dddd1003-24a8-4f00-8000-000000000003', '#111111', true, NOW(), NOW()),
  ('a3501003-24a8-4f00-8000-000000000003', 'dddd1003-24a8-4f00-8000-000000000003', '#2563EB', true, NOW(), NOW()),
  ('a3501004-24a8-4f00-8000-000000000001', 'dddd1004-24a8-4f00-8000-000000000004', '#111111', true, NOW(), NOW()),
  ('a3501004-24a8-4f00-8000-000000000002', 'dddd1004-24a8-4f00-8000-000000000004', '#6B7280', true, NOW(), NOW()),
  ('a3501004-24a8-4f00-8000-000000000003', 'dddd1004-24a8-4f00-8000-000000000004', '#7F1D1D', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  color = EXCLUDED.color,
  active = EXCLUDED.active,
  deleted_at = NULL,
  updated_at = NOW();

INSERT INTO public.product_medias (id, product_id, media_url, arrangement, color_id, created_at, updated_at) VALUES
  ('a3601001-24a8-4f00-8000-000000000001', 'dddd1001-24a8-4f00-8000-000000000001', '', 10, 'a3501001-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601001-24a8-4f00-8000-000000000002', 'dddd1001-24a8-4f00-8000-000000000001', '', 11, 'a3501001-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601001-24a8-4f00-8000-000000000003', 'dddd1001-24a8-4f00-8000-000000000001', '', 12, 'a3501001-24a8-4f00-8000-000000000003', NOW(), NOW()),
  ('a3601001-24a8-4f00-8000-000000000004', 'dddd1001-24a8-4f00-8000-000000000001', '', 1, NULL, NOW(), NOW()),
  ('a3601002-24a8-4f00-8000-000000000001', 'dddd1002-24a8-4f00-8000-000000000002', '', 10, 'a3501002-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601002-24a8-4f00-8000-000000000002', 'dddd1002-24a8-4f00-8000-000000000002', '', 11, 'a3501002-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601002-24a8-4f00-8000-000000000003', 'dddd1002-24a8-4f00-8000-000000000002', '', 12, 'a3501002-24a8-4f00-8000-000000000003', NOW(), NOW()),
  ('a3601002-24a8-4f00-8000-000000000004', 'dddd1002-24a8-4f00-8000-000000000002', '', 1, NULL, NOW(), NOW()),
  ('a3601003-24a8-4f00-8000-000000000001', 'dddd1003-24a8-4f00-8000-000000000003', '', 10, 'a3501003-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601003-24a8-4f00-8000-000000000002', 'dddd1003-24a8-4f00-8000-000000000003', '', 11, 'a3501003-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601003-24a8-4f00-8000-000000000003', 'dddd1003-24a8-4f00-8000-000000000003', '', 12, 'a3501003-24a8-4f00-8000-000000000003', NOW(), NOW()),
  ('a3601003-24a8-4f00-8000-000000000004', 'dddd1003-24a8-4f00-8000-000000000003', '', 1, NULL, NOW(), NOW()),
  ('a3601004-24a8-4f00-8000-000000000001', 'dddd1004-24a8-4f00-8000-000000000004', '', 10, 'a3501004-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601004-24a8-4f00-8000-000000000002', 'dddd1004-24a8-4f00-8000-000000000004', '', 11, 'a3501004-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601004-24a8-4f00-8000-000000000003', 'dddd1004-24a8-4f00-8000-000000000004', '', 12, 'a3501004-24a8-4f00-8000-000000000003', NOW(), NOW()),
  ('a3601004-24a8-4f00-8000-000000000004', 'dddd1004-24a8-4f00-8000-000000000004', '', 1, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  color_id = EXCLUDED.color_id,
  updated_at = NOW();

INSERT INTO public.product_translations (product_id, locale, name, description) VALUES
  ('dddd1001-24a8-4f00-8000-000000000001', 'en', 'Logo Baseball Cap', 'Premium 帽袜 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1001-24a8-4f00-8000-000000000001', 'ms', 'Logo Baseball Cap', '帽袜 premium untuk gaya harian dan keselesaan.'),
  ('dddd1002-24a8-4f00-8000-000000000002', 'en', 'Crew Socks 3-Pack', 'Premium 帽袜 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1002-24a8-4f00-8000-000000000002', 'ms', 'Crew Socks 3-Pack', '帽袜 premium untuk gaya harian dan keselesaan.'),
  ('dddd1003-24a8-4f00-8000-000000000003', 'en', 'Sport Ankle Socks 3-Pack', 'Premium 帽袜 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1003-24a8-4f00-8000-000000000003', 'ms', 'Sport Ankle Socks 3-Pack', '帽袜 premium untuk gaya harian dan keselesaan.'),
  ('dddd1004-24a8-4f00-8000-000000000004', 'en', 'Knit Beanie', 'Premium 帽袜 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1004-24a8-4f00-8000-000000000004', 'ms', 'Knit Beanie', '帽袜 premium untuk gaya harian dan keselesaan.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO public.product_categories (id, product_id, category_id, created_at, updated_at) VALUES
  ('a3541001-24a8-4f00-8000-000000000001', 'dddd1001-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000010', NOW(), NOW()),
  ('a3541002-24a8-4f00-8000-000000000001', 'dddd1002-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000010', NOW(), NOW()),
  ('a3541003-24a8-4f00-8000-000000000001', 'dddd1003-24a8-4f00-8000-000000000003', 'a3300001-24a8-4f00-8000-000000000010', NOW(), NOW()),
  ('a3541004-24a8-4f00-8000-000000000001', 'dddd1004-24a8-4f00-8000-000000000004', 'a3300001-24a8-4f00-8000-000000000010', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  category_id = EXCLUDED.category_id,
  updated_at = NOW();

INSERT INTO public.product_stock (id, product_id, color_id, size_id, count, created_at) VALUES
  ('a3551001-24a8-4f00-8000-000000000001', 'dddd1001-24a8-4f00-8000-000000000001', NULL, NULL, 25, NOW()),
  ('a3551002-24a8-4f00-8000-000000000001', 'dddd1002-24a8-4f00-8000-000000000002', NULL, NULL, 25, NOW()),
  ('a3551003-24a8-4f00-8000-000000000001', 'dddd1003-24a8-4f00-8000-000000000003', NULL, NULL, 25, NOW()),
  ('a3551004-24a8-4f00-8000-000000000001', 'dddd1004-24a8-4f00-8000-000000000004', NULL, NULL, 25, NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  count = EXCLUDED.count;