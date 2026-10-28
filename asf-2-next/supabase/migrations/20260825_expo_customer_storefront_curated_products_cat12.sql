-- =============================================================================
-- Expo Customer Storefront Curated Seed — Agent 14 products cat12
-- Category: 腰带与小物 (4 SKUs)
-- =============================================================================

INSERT INTO public.products (
  id, name, price, status, description, brand_id, category_id, department_id, range_id, created_at, updated_at
) VALUES
  ('dddd1201-24a8-4f00-8000-000000000001', '真皮腰带', 89, 'Published', '精选腰带与小物，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000005', 'a3300001-24a8-4f00-8000-000000000012', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '228 hours', NOW()),
  ('dddd1202-24a8-4f00-8000-000000000002', '编织休闲腰带', 79, 'Published', '精选腰带与小物，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000012', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '227 hours', NOW()),
  ('dddd1203-24a8-4f00-8000-000000000003', '鞋拔金属款', 35, 'Published', '精选腰带与小物，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000003', 'a3300001-24a8-4f00-8000-000000000012', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '226 hours', NOW()),
  ('dddd1204-24a8-4f00-8000-000000000004', '鞋带三双装', 29, 'Published', '精选腰带与小物，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000005', 'a3300001-24a8-4f00-8000-000000000012', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '225 hours', NOW())
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
  ('a3501201-24a8-4f00-8000-000000000001', 'dddd1201-24a8-4f00-8000-000000000001', '#111111', true, NOW(), NOW()),
  ('a3501201-24a8-4f00-8000-000000000002', 'dddd1201-24a8-4f00-8000-000000000001', '#78350F', true, NOW(), NOW()),
  ('a3501202-24a8-4f00-8000-000000000001', 'dddd1202-24a8-4f00-8000-000000000002', '#1E3A5F', true, NOW(), NOW()),
  ('a3501202-24a8-4f00-8000-000000000002', 'dddd1202-24a8-4f00-8000-000000000002', '#78350F', true, NOW(), NOW()),
  ('a3501203-24a8-4f00-8000-000000000001', 'dddd1203-24a8-4f00-8000-000000000003', '#C0C0C0', true, NOW(), NOW()),
  ('a3501203-24a8-4f00-8000-000000000002', 'dddd1203-24a8-4f00-8000-000000000003', '#111111', true, NOW(), NOW()),
  ('a3501204-24a8-4f00-8000-000000000001', 'dddd1204-24a8-4f00-8000-000000000004', '#FFFFFF', true, NOW(), NOW()),
  ('a3501204-24a8-4f00-8000-000000000002', 'dddd1204-24a8-4f00-8000-000000000004', '#111111', true, NOW(), NOW()),
  ('a3501204-24a8-4f00-8000-000000000003', 'dddd1204-24a8-4f00-8000-000000000004', '#9CA3AF', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  color = EXCLUDED.color,
  active = EXCLUDED.active,
  deleted_at = NULL,
  updated_at = NOW();

INSERT INTO public.product_medias (id, product_id, media_url, arrangement, color_id, created_at, updated_at) VALUES
  ('a3601201-24a8-4f00-8000-000000000001', 'dddd1201-24a8-4f00-8000-000000000001', '', 10, 'a3501201-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601201-24a8-4f00-8000-000000000002', 'dddd1201-24a8-4f00-8000-000000000001', '', 11, 'a3501201-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601201-24a8-4f00-8000-000000000003', 'dddd1201-24a8-4f00-8000-000000000001', '', 1, NULL, NOW(), NOW()),
  ('a3601202-24a8-4f00-8000-000000000001', 'dddd1202-24a8-4f00-8000-000000000002', '', 10, 'a3501202-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601202-24a8-4f00-8000-000000000002', 'dddd1202-24a8-4f00-8000-000000000002', '', 11, 'a3501202-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601202-24a8-4f00-8000-000000000003', 'dddd1202-24a8-4f00-8000-000000000002', '', 1, NULL, NOW(), NOW()),
  ('a3601203-24a8-4f00-8000-000000000001', 'dddd1203-24a8-4f00-8000-000000000003', '', 10, 'a3501203-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601203-24a8-4f00-8000-000000000002', 'dddd1203-24a8-4f00-8000-000000000003', '', 11, 'a3501203-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601203-24a8-4f00-8000-000000000003', 'dddd1203-24a8-4f00-8000-000000000003', '', 1, NULL, NOW(), NOW()),
  ('a3601204-24a8-4f00-8000-000000000001', 'dddd1204-24a8-4f00-8000-000000000004', '', 10, 'a3501204-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601204-24a8-4f00-8000-000000000002', 'dddd1204-24a8-4f00-8000-000000000004', '', 11, 'a3501204-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a3601204-24a8-4f00-8000-000000000003', 'dddd1204-24a8-4f00-8000-000000000004', '', 12, 'a3501204-24a8-4f00-8000-000000000003', NOW(), NOW()),
  ('a3601204-24a8-4f00-8000-000000000004', 'dddd1204-24a8-4f00-8000-000000000004', '', 1, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  color_id = EXCLUDED.color_id,
  updated_at = NOW();

INSERT INTO public.product_translations (product_id, locale, name, description) VALUES
  ('dddd1201-24a8-4f00-8000-000000000001', 'en', 'Genuine Leather Belt', 'Premium 腰带与小物 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1201-24a8-4f00-8000-000000000001', 'ms', 'Genuine Leather Belt', '腰带与小物 premium untuk gaya harian dan keselesaan.'),
  ('dddd1202-24a8-4f00-8000-000000000002', 'en', 'Woven Casual Belt', 'Premium 腰带与小物 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1202-24a8-4f00-8000-000000000002', 'ms', 'Woven Casual Belt', '腰带与小物 premium untuk gaya harian dan keselesaan.'),
  ('dddd1203-24a8-4f00-8000-000000000003', 'en', 'Metal Shoe Horn', 'Premium 腰带与小物 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1203-24a8-4f00-8000-000000000003', 'ms', 'Metal Shoe Horn', '腰带与小物 premium untuk gaya harian dan keselesaan.'),
  ('dddd1204-24a8-4f00-8000-000000000004', 'en', 'Shoelaces 3-Pack', 'Premium 腰带与小物 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1204-24a8-4f00-8000-000000000004', 'ms', 'Shoelaces 3-Pack', '腰带与小物 premium untuk gaya harian dan keselesaan.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO public.product_categories (id, product_id, category_id, created_at, updated_at) VALUES
  ('a3541201-24a8-4f00-8000-000000000001', 'dddd1201-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000012', NOW(), NOW()),
  ('a3541202-24a8-4f00-8000-000000000001', 'dddd1202-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000012', NOW(), NOW()),
  ('a3541203-24a8-4f00-8000-000000000001', 'dddd1203-24a8-4f00-8000-000000000003', 'a3300001-24a8-4f00-8000-000000000012', NOW(), NOW()),
  ('a3541204-24a8-4f00-8000-000000000001', 'dddd1204-24a8-4f00-8000-000000000004', 'a3300001-24a8-4f00-8000-000000000012', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  category_id = EXCLUDED.category_id,
  updated_at = NOW();

INSERT INTO public.product_stock (id, product_id, color_id, size_id, count, created_at) VALUES
  ('a3551201-24a8-4f00-8000-000000000001', 'dddd1201-24a8-4f00-8000-000000000001', NULL, NULL, 25, NOW()),
  ('a3551202-24a8-4f00-8000-000000000001', 'dddd1202-24a8-4f00-8000-000000000002', NULL, NULL, 25, NOW()),
  ('a3551203-24a8-4f00-8000-000000000001', 'dddd1203-24a8-4f00-8000-000000000003', NULL, NULL, 25, NOW()),
  ('a3551204-24a8-4f00-8000-000000000001', 'dddd1204-24a8-4f00-8000-000000000004', NULL, NULL, 25, NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  count = EXCLUDED.count;
