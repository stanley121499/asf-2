INSERT INTO public.products (
  id, name, price, status, description, brand_id, category_id,
  department_id, range_id, created_at, updated_at, deleted_at
) VALUES
  -- Grid order (created_at DESC / newest-first): 2, 6, 3, 4, 1, 5
  ('c1010001-24a8-4f00-8000-000000000001', '针织玛丽珍扣带平底鞋', 189, 'Published', 'Simon 精选女鞋平底 — 针织玛丽珍扣带平底鞋。舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '4 hours', NOW(), NULL),
  ('c1010001-24a8-4f00-8000-000000000002', '针织芭蕾交叉带平底鞋', 189, 'Published', 'Simon 精选女鞋平底 — 针织芭蕾交叉带平底鞋。舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '0 hours', NOW(), NULL),
  ('c1010001-24a8-4f00-8000-000000000003', '针织踝带扣平底鞋', 199, 'Published', 'Simon 精选女鞋平底 — 针织踝带扣平底鞋。舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '2 hours', NOW(), NULL),
  ('c1010001-24a8-4f00-8000-000000000004', '缎面踝带扣平底鞋', 219, 'Published', 'Simon 精选女鞋平底 — 缎面踝带扣平底鞋。舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '3 hours', NOW(), NULL),
  ('c1010001-24a8-4f00-8000-000000000005', '缎面玛丽珍平底鞋', 219, 'Published', 'Simon 精选女鞋平底 — 缎面玛丽珍平底鞋。舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '5 hours', NOW(), NULL),
  ('c1010001-24a8-4f00-8000-000000000006', '缎面芭蕾交叉带平底鞋', 219, 'Published', 'Simon 精选女鞋平底 — 缎面芭蕾交叉带平底鞋。舒适耐穿，日常百搭。', 'a3400001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '1 hours', NOW(), NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, price = EXCLUDED.price, status = EXCLUDED.status,
  description = EXCLUDED.description, brand_id = EXCLUDED.brand_id,
  category_id = EXCLUDED.category_id, department_id = EXCLUDED.department_id,
  range_id = EXCLUDED.range_id, deleted_at = NULL,
  created_at = EXCLUDED.created_at,
  updated_at = NOW();
