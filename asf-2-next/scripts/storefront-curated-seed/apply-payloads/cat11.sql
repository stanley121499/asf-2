INSERT INTO public.products (
  id, name, price, status, description, brand_id, category_id, department_id, range_id, created_at, updated_at
) VALUES
  ('dddd1101-24a8-4f00-8000-000000000001', '鞋类护理四件套', 59, 'Published', '精选护理套装，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000003', 'a3300001-24a8-4f00-8000-000000000011', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '218 hours', NOW()),
  ('dddd1102-24a8-4f00-8000-000000000002', '麂皮护理套装', 69, 'Published', '精选护理套装，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000004', 'a3300001-24a8-4f00-8000-000000000011', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '217 hours', NOW()),
  ('dddd1103-24a8-4f00-8000-000000000003', '皮革清洁套装', 49, 'Published', '精选护理套装，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000011', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '216 hours', NOW()),
  ('dddd1104-24a8-4f00-8000-000000000004', '小白鞋清洁套装', 55, 'Published', '精选护理套装，舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000011', 'a3100001-24a8-4f00-8000-000000000003', 'a3200001-24a8-4f00-8000-000000000006', NOW() - INTERVAL '215 hours', NOW())
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
  ('a3501101-24a8-4f00-8000-000000000001', 'dddd1101-24a8-4f00-8000-000000000001', '#FFFFFF', true, NOW(), NOW()),
  ('a3501102-24a8-4f00-8000-000000000001', 'dddd1102-24a8-4f00-8000-000000000002', '#FFFFFF', true, NOW(), NOW()),
  ('a3501103-24a8-4f00-8000-000000000001', 'dddd1103-24a8-4f00-8000-000000000003', '#FFFFFF', true, NOW(), NOW()),
  ('a3501104-24a8-4f00-8000-000000000001', 'dddd1104-24a8-4f00-8000-000000000004', '#FFFFFF', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  color = EXCLUDED.color,
  active = EXCLUDED.active,
  deleted_at = NULL,
  updated_at = NOW();

INSERT INTO public.product_medias (id, product_id, media_url, arrangement, color_id, created_at, updated_at) VALUES
  ('a3601101-24a8-4f00-8000-000000000001', 'dddd1101-24a8-4f00-8000-000000000001', '', 10, 'a3501101-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601101-24a8-4f00-8000-000000000002', 'dddd1101-24a8-4f00-8000-000000000001', '', 1, NULL, NOW(), NOW()),
  ('a3601102-24a8-4f00-8000-000000000001', 'dddd1102-24a8-4f00-8000-000000000002', '', 10, 'a3501102-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601102-24a8-4f00-8000-000000000002', 'dddd1102-24a8-4f00-8000-000000000002', '', 1, NULL, NOW(), NOW()),
  ('a3601103-24a8-4f00-8000-000000000001', 'dddd1103-24a8-4f00-8000-000000000003', '', 10, 'a3501103-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601103-24a8-4f00-8000-000000000002', 'dddd1103-24a8-4f00-8000-000000000003', '', 1, NULL, NOW(), NOW()),
  ('a3601104-24a8-4f00-8000-000000000001', 'dddd1104-24a8-4f00-8000-000000000004', '', 10, 'a3501104-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a3601104-24a8-4f00-8000-000000000002', 'dddd1104-24a8-4f00-8000-000000000004', '', 1, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  color_id = EXCLUDED.color_id,
  updated_at = NOW();

INSERT INTO public.product_translations (product_id, locale, name, description) VALUES
  ('dddd1101-24a8-4f00-8000-000000000001', 'en', 'Shoe Care 4-Piece Kit', 'Premium 护理套装 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1101-24a8-4f00-8000-000000000001', 'ms', 'Shoe Care 4-Piece Kit', '护理套装 premium untuk gaya harian dan keselesaan.'),
  ('dddd1102-24a8-4f00-8000-000000000002', 'en', 'Suede Care Kit', 'Premium 护理套装 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1102-24a8-4f00-8000-000000000002', 'ms', 'Suede Care Kit', '护理套装 premium untuk gaya harian dan keselesaan.'),
  ('dddd1103-24a8-4f00-8000-000000000003', 'en', 'Leather Cleaning Kit', 'Premium 护理套装 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1103-24a8-4f00-8000-000000000003', 'ms', 'Leather Cleaning Kit', '护理套装 premium untuk gaya harian dan keselesaan.'),
  ('dddd1104-24a8-4f00-8000-000000000004', 'en', 'White Sneaker Cleaning Kit', 'Premium 护理套装 crafted for everyday comfort and refined Malaysian retail style.'),
  ('dddd1104-24a8-4f00-8000-000000000004', 'ms', 'White Sneaker Cleaning Kit', '护理套装 premium untuk gaya harian dan keselesaan.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO public.product_categories (id, product_id, category_id, created_at, updated_at) VALUES
  ('a3541101-24a8-4f00-8000-000000000001', 'dddd1101-24a8-4f00-8000-000000000001', 'a3300001-24a8-4f00-8000-000000000011', NOW(), NOW()),
  ('a3541102-24a8-4f00-8000-000000000001', 'dddd1102-24a8-4f00-8000-000000000002', 'a3300001-24a8-4f00-8000-000000000011', NOW(), NOW()),
  ('a3541103-24a8-4f00-8000-000000000001', 'dddd1103-24a8-4f00-8000-000000000003', 'a3300001-24a8-4f00-8000-000000000011', NOW(), NOW()),
  ('a3541104-24a8-4f00-8000-000000000001', 'dddd1104-24a8-4f00-8000-000000000004', 'a3300001-24a8-4f00-8000-000000000011', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  category_id = EXCLUDED.category_id,
  updated_at = NOW();

INSERT INTO public.product_stock (id, product_id, color_id, size_id, count, created_at) VALUES
  ('a3551101-24a8-4f00-8000-000000000001', 'dddd1101-24a8-4f00-8000-000000000001', NULL, NULL, 25, NOW()),
  ('a3551102-24a8-4f00-8000-000000000001', 'dddd1102-24a8-4f00-8000-000000000002', NULL, NULL, 25, NOW()),
  ('a3551103-24a8-4f00-8000-000000000001', 'dddd1103-24a8-4f00-8000-000000000003', NULL, NULL, 25, NOW()),
  ('a3551104-24a8-4f00-8000-000000000001', 'dddd1104-24a8-4f00-8000-000000000004', NULL, NULL, 25, NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  count = EXCLUDED.count;