-- =============================================================================
-- Expo Customer Storefront Theme — Agent 2 taxonomy + catalog seed
-- =============================================================================
-- Purpose: department → range → category → brand tree; remap footwear demo
--   products; en + ms translations. No colorways / post_products / promo images.
-- Dual-path mirror: asf-2-next/supabase/migrations/ (same filename).
-- Idempotent: fixed UUIDs + ON CONFLICT / upserts.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) Wire existing herbal ranges → herbal departments (do not orphan live rows)
-- ---------------------------------------------------------------------------
UPDATE public.ranges SET department_id = '4e81c815-a81c-4b3b-aa6e-a274dd5537ff'
WHERE id IN (
  '6298ea66-4bc7-4d93-a014-b87f9f661e39', -- 免疫增强
  'cbf134d2-d139-4717-a4d8-870ea873f4ba'  -- 消化健康
)
  AND deleted_at IS NULL;

UPDATE public.ranges SET department_id = 'd5a053cc-cc9b-449e-9ca4-a53d5e3f52bf'
WHERE id IN (
  '46105533-a728-469f-97f4-6a38ab4ce631', -- 压力与睡眠
  '1693a619-72df-4cc7-b28e-944d810ea213', -- 认知支持
  'ab898881-2dd3-4ed5-bf88-f28ed4f75419'  -- 能量与活力
)
  AND deleted_at IS NULL;

UPDATE public.ranges SET department_id = 'dc30f462-f90c-4880-8cc7-dd666b8ef20d'
WHERE id = '054d9d06-41b3-4a83-8b06-7ff7ca3f189c' -- 疼痛缓解
  AND deleted_at IS NULL;

-- Soft-delete legacy flat footwear categories (replaced by storefront tree below)
UPDATE public.categories
SET deleted_at = COALESCE(deleted_at, NOW()),
    active = false
WHERE id IN (
  'aaaaaaaa-1111-1111-1111-000000000001',
  'aaaaaaaa-1111-1111-1111-000000000002',
  'aaaaaaaa-1111-1111-1111-000000000003',
  'aaaaaaaa-1111-1111-1111-000000000004'
)
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 1) Storefront departments (≥3) — fixed UUIDs a2100001-…
-- ---------------------------------------------------------------------------
INSERT INTO public.departments (id, name, active, media_url, created_at) VALUES
  (
    'a2100001-24a8-4f00-8000-000000000001',
    '男鞋',
    true,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    NOW()
  ),
  (
    'a2100001-24a8-4f00-8000-000000000002',
    '女鞋',
    true,
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80',
    NOW()
  ),
  (
    'a2100001-24a8-4f00-8000-000000000003',
    '配件护理',
    true,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  media_url = EXCLUDED.media_url,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 2) Storefront ranges (≥2 per department) — fixed UUIDs a2200001-…
-- ---------------------------------------------------------------------------
INSERT INTO public.ranges (id, name, active, media_url, department_id, created_at) VALUES
  (
    'a2200001-24a8-4f00-8000-000000000001',
    '运动休闲',
    true,
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80',
    'a2100001-24a8-4f00-8000-000000000001',
    NOW()
  ),
  (
    'a2200001-24a8-4f00-8000-000000000002',
    '正装与靴',
    true,
    'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80',
    'a2100001-24a8-4f00-8000-000000000001',
    NOW()
  ),
  (
    'a2200001-24a8-4f00-8000-000000000003',
    '日常通勤',
    true,
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
    'a2100001-24a8-4f00-8000-000000000002',
    NOW()
  ),
  (
    'a2200001-24a8-4f00-8000-000000000004',
    '时尚靴履',
    true,
    'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=800&q=80',
    'a2100001-24a8-4f00-8000-000000000002',
    NOW()
  ),
  (
    'a2200001-24a8-4f00-8000-000000000005',
    '穿戴配件',
    true,
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80',
    'a2100001-24a8-4f00-8000-000000000003',
    NOW()
  ),
  (
    'a2200001-24a8-4f00-8000-000000000006',
    '护理精选',
    true,
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    'a2100001-24a8-4f00-8000-000000000003',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  media_url = EXCLUDED.media_url,
  department_id = EXCLUDED.department_id,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 3) Storefront categories (≥2 per range) — fixed UUIDs a2300001-…
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (
  id, name, active, media_url, arrangement, range_id, created_at
) VALUES
  (
    'a2300001-24a8-4f00-8000-000000000001',
    '跑鞋',
    true,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    1,
    'a2200001-24a8-4f00-8000-000000000001',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000002',
    '板鞋与球场',
    true,
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
    2,
    'a2200001-24a8-4f00-8000-000000000001',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000003',
    '正装皮鞋',
    true,
    'https://images.unsplash.com/photo-1614252237019-59c05d0d3fc4?w=800&q=80',
    1,
    'a2200001-24a8-4f00-8000-000000000002',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000004',
    '男靴',
    true,
    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80',
    2,
    'a2200001-24a8-4f00-8000-000000000002',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000005',
    '一脚蹬',
    true,
    'https://images.unsplash.com/photo-1603808033192-082d59538bcd?w=800&q=80',
    1,
    'a2200001-24a8-4f00-8000-000000000003',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000006',
    '休闲运动鞋',
    true,
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    2,
    'a2200001-24a8-4f00-8000-000000000003',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000007',
    '短靴',
    true,
    'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=800&q=80',
    1,
    'a2200001-24a8-4f00-8000-000000000004',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000008',
    '时尚高帮',
    true,
    'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
    2,
    'a2200001-24a8-4f00-8000-000000000004',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000009',
    '包袋',
    true,
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    1,
    'a2200001-24a8-4f00-8000-000000000005',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000010',
    '帽袜',
    true,
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80',
    2,
    'a2200001-24a8-4f00-8000-000000000005',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000011',
    '护理套装',
    true,
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    1,
    'a2200001-24a8-4f00-8000-000000000006',
    NOW()
  ),
  (
    'a2300001-24a8-4f00-8000-000000000012',
    '腰带与小物',
    true,
    'https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=800&q=80',
    2,
    'a2200001-24a8-4f00-8000-000000000006',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  range_id = EXCLUDED.range_id,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 4) Storefront brands (≥4) — fixed UUIDs a2400001-… (table: brand singular)
-- ---------------------------------------------------------------------------
INSERT INTO public.brand (id, name, active, media_url, created_at) VALUES
  (
    'a2400001-24a8-4f00-8000-000000000001',
    'ASF Studio',
    true,
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    NOW()
  ),
  (
    'a2400001-24a8-4f00-8000-000000000002',
    'Courtline',
    true,
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
    NOW()
  ),
  (
    'a2400001-24a8-4f00-8000-000000000003',
    'Trailform',
    true,
    'https://images.unsplash.com/photo-1520256862855-398228c41684?w=800&q=80',
    NOW()
  ),
  (
    'a2400001-24a8-4f00-8000-000000000004',
    'Softstep',
    true,
    'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=800&q=80',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  media_url = EXCLUDED.media_url,
  deleted_at = NULL;

-- ---------------------------------------------------------------------------
-- 5) Remap ≥12 active footwear products (bbbbbbbb-…) to coherent tree
-- ---------------------------------------------------------------------------
-- C1 跑鞋
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000001',
  range_id = 'a2200001-24a8-4f00-8000-000000000001',
  category_id = 'a2300001-24a8-4f00-8000-000000000001',
  brand_id = 'a2400001-24a8-4f00-8000-000000000001',
  updated_at = NOW()
WHERE id IN (
  'bbbbbbbb-1111-1111-1111-000000000002',
  'bbbbbbbb-1111-1111-1111-000000000012'
)
  AND deleted_at IS NULL;

-- C2 板鞋与球场
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000001',
  range_id = 'a2200001-24a8-4f00-8000-000000000001',
  category_id = 'a2300001-24a8-4f00-8000-000000000002',
  brand_id = 'a2400001-24a8-4f00-8000-000000000002',
  updated_at = NOW()
WHERE id IN (
  'bbbbbbbb-1111-1111-1111-000000000001',
  'bbbbbbbb-1111-1111-1111-000000000008',
  'bbbbbbbb-1111-1111-1111-000000000014'
)
  AND deleted_at IS NULL;

-- C3 正装皮鞋
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000001',
  range_id = 'a2200001-24a8-4f00-8000-000000000002',
  category_id = 'a2300001-24a8-4f00-8000-000000000003',
  brand_id = 'a2400001-24a8-4f00-8000-000000000002',
  updated_at = NOW()
WHERE id IN (
  'bbbbbbbb-1111-1111-1111-000000000004',
  'bbbbbbbb-1111-1111-1111-000000000010'
)
  AND deleted_at IS NULL;

-- C4 男靴
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000001',
  range_id = 'a2200001-24a8-4f00-8000-000000000002',
  category_id = 'a2300001-24a8-4f00-8000-000000000004',
  brand_id = 'a2400001-24a8-4f00-8000-000000000003',
  updated_at = NOW()
WHERE id IN (
  'bbbbbbbb-1111-1111-1111-000000000005',
  'bbbbbbbb-1111-1111-1111-000000000006'
)
  AND deleted_at IS NULL;

-- C5 一脚蹬
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000002',
  range_id = 'a2200001-24a8-4f00-8000-000000000003',
  category_id = 'a2300001-24a8-4f00-8000-000000000005',
  brand_id = 'a2400001-24a8-4f00-8000-000000000004',
  updated_at = NOW()
WHERE id IN (
  'bbbbbbbb-1111-1111-1111-000000000007',
  'bbbbbbbb-1111-1111-1111-000000000009'
)
  AND deleted_at IS NULL;

-- C6 休闲运动鞋
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000002',
  range_id = 'a2200001-24a8-4f00-8000-000000000003',
  category_id = 'a2300001-24a8-4f00-8000-000000000006',
  brand_id = 'a2400001-24a8-4f00-8000-000000000001',
  updated_at = NOW()
WHERE id IN (
  'bbbbbbbb-1111-1111-1111-000000000011',
  'bbbbbbbb-1111-1111-1111-000000000015'
)
  AND deleted_at IS NULL;

-- C7 短靴
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000002',
  range_id = 'a2200001-24a8-4f00-8000-000000000004',
  category_id = 'a2300001-24a8-4f00-8000-000000000007',
  brand_id = 'a2400001-24a8-4f00-8000-000000000003',
  updated_at = NOW()
WHERE id = 'bbbbbbbb-1111-1111-1111-000000000013'
  AND deleted_at IS NULL;

-- C8 时尚高帮
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000002',
  range_id = 'a2200001-24a8-4f00-8000-000000000004',
  category_id = 'a2300001-24a8-4f00-8000-000000000008',
  brand_id = 'a2400001-24a8-4f00-8000-000000000001',
  updated_at = NOW()
WHERE id = 'bbbbbbbb-1111-1111-1111-000000000003'
  AND deleted_at IS NULL;

-- C9 包袋
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000003',
  range_id = 'a2200001-24a8-4f00-8000-000000000005',
  category_id = 'a2300001-24a8-4f00-8000-000000000009',
  brand_id = 'a2400001-24a8-4f00-8000-000000000004',
  updated_at = NOW()
WHERE id = 'bbbbbbbb-1111-1111-1111-000000000019'
  AND deleted_at IS NULL;

-- C10 帽袜
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000003',
  range_id = 'a2200001-24a8-4f00-8000-000000000005',
  category_id = 'a2300001-24a8-4f00-8000-000000000010',
  brand_id = 'a2400001-24a8-4f00-8000-000000000004',
  updated_at = NOW()
WHERE id IN (
  'bbbbbbbb-1111-1111-1111-000000000017',
  'bbbbbbbb-1111-1111-1111-000000000020'
)
  AND deleted_at IS NULL;

-- C11 护理套装
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000003',
  range_id = 'a2200001-24a8-4f00-8000-000000000006',
  category_id = 'a2300001-24a8-4f00-8000-000000000011',
  brand_id = 'a2400001-24a8-4f00-8000-000000000002',
  updated_at = NOW()
WHERE id = 'bbbbbbbb-1111-1111-1111-000000000018'
  AND deleted_at IS NULL;

-- C12 腰带与小物
UPDATE public.products SET
  department_id = 'a2100001-24a8-4f00-8000-000000000003',
  range_id = 'a2200001-24a8-4f00-8000-000000000006',
  category_id = 'a2300001-24a8-4f00-8000-000000000012',
  brand_id = 'a2400001-24a8-4f00-8000-000000000004',
  updated_at = NOW()
WHERE id = 'bbbbbbbb-1111-1111-1111-000000000016'
  AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 6) Sync product_categories to primary category_id
-- ---------------------------------------------------------------------------
DELETE FROM public.product_categories
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE id::text LIKE 'bbbbbbbb-1111-1111-1111-%'
);

INSERT INTO public.product_categories (id, product_id, category_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  p.id,
  p.category_id,
  NOW(),
  NOW()
FROM public.products p
WHERE p.id::text LIKE 'bbbbbbbb-1111-1111-1111-%'
  AND p.deleted_at IS NULL
  AND p.category_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 7) Translations — en + ms (zh remains canonical name on entity rows)
-- ---------------------------------------------------------------------------
INSERT INTO public.department_translations (department_id, locale, name) VALUES
  ('a2100001-24a8-4f00-8000-000000000001', 'en', 'Men''s Footwear'),
  ('a2100001-24a8-4f00-8000-000000000001', 'ms', 'Kasut Lelaki'),
  ('a2100001-24a8-4f00-8000-000000000002', 'en', 'Women''s Footwear'),
  ('a2100001-24a8-4f00-8000-000000000002', 'ms', 'Kasut Wanita'),
  ('a2100001-24a8-4f00-8000-000000000003', 'en', 'Accessories & Care'),
  ('a2100001-24a8-4f00-8000-000000000003', 'ms', 'Aksesori & Penjagaan')
ON CONFLICT (department_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO public.range_translations (range_id, locale, name) VALUES
  ('a2200001-24a8-4f00-8000-000000000001', 'en', 'Sport Casual'),
  ('a2200001-24a8-4f00-8000-000000000001', 'ms', 'Sukan Kasual'),
  ('a2200001-24a8-4f00-8000-000000000002', 'en', 'Formal & Boots'),
  ('a2200001-24a8-4f00-8000-000000000002', 'ms', 'Rasmi & But'),
  ('a2200001-24a8-4f00-8000-000000000003', 'en', 'Everyday Commute'),
  ('a2200001-24a8-4f00-8000-000000000003', 'ms', 'Harian & Komuter'),
  ('a2200001-24a8-4f00-8000-000000000004', 'en', 'Statement Boots'),
  ('a2200001-24a8-4f00-8000-000000000004', 'ms', 'But Fesyen'),
  ('a2200001-24a8-4f00-8000-000000000005', 'en', 'Wearables'),
  ('a2200001-24a8-4f00-8000-000000000005', 'ms', 'Aksesori Pakai'),
  ('a2200001-24a8-4f00-8000-000000000006', 'en', 'Care Essentials'),
  ('a2200001-24a8-4f00-8000-000000000006', 'ms', 'Penjagaan Asas')
ON CONFLICT (range_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO public.category_translations (category_id, locale, name) VALUES
  ('a2300001-24a8-4f00-8000-000000000001', 'en', 'Runners'),
  ('a2300001-24a8-4f00-8000-000000000001', 'ms', 'Kasut lari'),
  ('a2300001-24a8-4f00-8000-000000000002', 'en', 'Court & Low'),
  ('a2300001-24a8-4f00-8000-000000000002', 'ms', 'Court & rendah'),
  ('a2300001-24a8-4f00-8000-000000000003', 'en', 'Formal Shoes'),
  ('a2300001-24a8-4f00-8000-000000000003', 'ms', 'Kasut rasmi'),
  ('a2300001-24a8-4f00-8000-000000000004', 'en', 'Men''s Boots'),
  ('a2300001-24a8-4f00-8000-000000000004', 'ms', 'But lelaki'),
  ('a2300001-24a8-4f00-8000-000000000005', 'en', 'Slip-Ons'),
  ('a2300001-24a8-4f00-8000-000000000005', 'ms', 'Slip-on'),
  ('a2300001-24a8-4f00-8000-000000000006', 'en', 'Lifestyle Sneakers'),
  ('a2300001-24a8-4f00-8000-000000000006', 'ms', 'Sneaker gaya hidup'),
  ('a2300001-24a8-4f00-8000-000000000007', 'en', 'Ankle Boots'),
  ('a2300001-24a8-4f00-8000-000000000007', 'ms', 'But buku lali'),
  ('a2300001-24a8-4f00-8000-000000000008', 'en', 'Fashion High-Tops'),
  ('a2300001-24a8-4f00-8000-000000000008', 'ms', 'High-top fesyen'),
  ('a2300001-24a8-4f00-8000-000000000009', 'en', 'Bags'),
  ('a2300001-24a8-4f00-8000-000000000009', 'ms', 'Beg'),
  ('a2300001-24a8-4f00-8000-000000000010', 'en', 'Caps & Socks'),
  ('a2300001-24a8-4f00-8000-000000000010', 'ms', 'Topi & stoking'),
  ('a2300001-24a8-4f00-8000-000000000011', 'en', 'Care Kits'),
  ('a2300001-24a8-4f00-8000-000000000011', 'ms', 'Kit penjagaan'),
  ('a2300001-24a8-4f00-8000-000000000012', 'en', 'Belts & Small Goods'),
  ('a2300001-24a8-4f00-8000-000000000012', 'ms', 'Tali pinggang & kecil')
ON CONFLICT (category_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

INSERT INTO public.brand_translations (brand_id, locale, name) VALUES
  ('a2400001-24a8-4f00-8000-000000000001', 'en', 'ASF Studio'),
  ('a2400001-24a8-4f00-8000-000000000001', 'ms', 'ASF Studio'),
  ('a2400001-24a8-4f00-8000-000000000002', 'en', 'Courtline'),
  ('a2400001-24a8-4f00-8000-000000000002', 'ms', 'Courtline'),
  ('a2400001-24a8-4f00-8000-000000000003', 'en', 'Trailform'),
  ('a2400001-24a8-4f00-8000-000000000003', 'ms', 'Trailform'),
  ('a2400001-24a8-4f00-8000-000000000004', 'en', 'Softstep'),
  ('a2400001-24a8-4f00-8000-000000000004', 'ms', 'Softstep')
ON CONFLICT (brand_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- Refresh product en/ms (zh canonical on products.name)
INSERT INTO public.product_translations (product_id, locale, name, description) VALUES
  ('bbbbbbbb-1111-1111-1111-000000000001', 'en', 'Classic Court Sneaker', 'Clean lines and a breathable upper — the everyday court classic.'),
  ('bbbbbbbb-1111-1111-1111-000000000001', 'ms', 'Sneaker Court Klasik', 'Garisan bersih dan bahagian atas bernafas — klasik court harian.'),
  ('bbbbbbbb-1111-1111-1111-000000000002', 'en', 'Urban Runner', 'Light cushioning for city commutes and easy pace days.'),
  ('bbbbbbbb-1111-1111-1111-000000000002', 'ms', 'Pelari Bandar', 'Kusyen ringan untuk perjalanan bandar dan hari yang santai.'),
  ('bbbbbbbb-1111-1111-1111-000000000003', 'en', 'Night Street High-Top', 'Dark high-top profile with presence after sundown.'),
  ('bbbbbbbb-1111-1111-1111-000000000003', 'ms', 'High-Top Jalan Malam', 'Profil high-top gelap dengan kehadiran selepas matahari terbenam.'),
  ('bbbbbbbb-1111-1111-1111-000000000004', 'en', 'Minimal Leather Derby', 'Sharp derby cut for office hours and evening plans.'),
  ('bbbbbbbb-1111-1111-1111-000000000004', 'ms', 'Derby Kulit Minimal', 'Potongan derby tajam untuk pejabat dan rancangan petang.'),
  ('bbbbbbbb-1111-1111-1111-000000000005', 'en', 'Black Chelsea Boot', 'Elastic-side Chelsea boots — slip on a clean silhouette.'),
  ('bbbbbbbb-1111-1111-1111-000000000005', 'ms', 'But Chelsea Hitam', 'But Chelsea sisi elastik — siluet bersih yang mudah dipakai.'),
  ('bbbbbbbb-1111-1111-1111-000000000006', 'en', 'Trail Hiker Mid', 'Grippy mid-cut for weekend trails and light hikes.'),
  ('bbbbbbbb-1111-1111-1111-000000000006', 'ms', 'Hiker Jejak Mid', 'Potongan mid dengan cengkaman untuk jejak hujung minggu.'),
  ('bbbbbbbb-1111-1111-1111-000000000007', 'en', 'Soft Knit Slip-On', 'Sock-like fit for effortless everyday steps.'),
  ('bbbbbbbb-1111-1111-1111-000000000007', 'ms', 'Slip-On Knit Lembut', 'Muat seperti stoking untuk langkah harian tanpa usaha.'),
  ('bbbbbbbb-1111-1111-1111-000000000008', 'en', 'Retro Court Low', 'Retro colorways on a low court silhouette.'),
  ('bbbbbbbb-1111-1111-1111-000000000008', 'ms', 'Court Low Retro', 'Warna retro pada siluet court rendah.'),
  ('bbbbbbbb-1111-1111-1111-000000000009', 'en', 'Platform Sandal', 'Light platform sandal for summer proportions.'),
  ('bbbbbbbb-1111-1111-1111-000000000009', 'ms', 'Sandal Platform', 'Sandal platform ringan untuk proporsi musim panas.'),
  ('bbbbbbbb-1111-1111-1111-000000000010', 'en', 'Penny Loafer', 'Classic penny loafer — smart casual, anytime.'),
  ('bbbbbbbb-1111-1111-1111-000000000010', 'ms', 'Loafer Penny', 'Loafer penny klasik — smart casual bila-bila masa.'),
  ('bbbbbbbb-1111-1111-1111-000000000011', 'en', 'Chunky Dad Sneaker', 'Bold sole and retro shape for stacked street looks.'),
  ('bbbbbbbb-1111-1111-1111-000000000011', 'ms', 'Sneaker Dad Tebal', 'Tapak berani dan bentuk retro untuk gaya jalanan.'),
  ('bbbbbbbb-1111-1111-1111-000000000012', 'en', 'Performance Trainer', 'Multi-directional support for gym and daily wear.'),
  ('bbbbbbbb-1111-1111-1111-000000000012', 'ms', 'Trainer Prestasi', 'Sokongan pelbagai arah untuk gim dan pemakaian harian.'),
  ('bbbbbbbb-1111-1111-1111-000000000013', 'en', 'Suede Ankle Boot', 'Soft suede texture for layered autumn outfits.'),
  ('bbbbbbbb-1111-1111-1111-000000000013', 'ms', 'But Buku Lali Suede', 'Tekstur suede lembut untuk gaya berlapis musim luruh.'),
  ('bbbbbbbb-1111-1111-1111-000000000014', 'en', 'Canvas Low Classic', 'Light canvas low-tops that never go out of style.'),
  ('bbbbbbbb-1111-1111-1111-000000000014', 'ms', 'Kanvas Low Klasik', 'Low-top kanvas ringan yang tidak pernah ketinggalan zaman.'),
  ('bbbbbbbb-1111-1111-1111-000000000015', 'en', 'Sock Runner', 'Integrated sock collar for a closer, lighter run.'),
  ('bbbbbbbb-1111-1111-1111-000000000015', 'ms', 'Pelari Stoking', 'Kolar stoking bersepadu untuk lari lebih dekat dan ringan.'),
  ('bbbbbbbb-1111-1111-1111-000000000016', 'en', 'Leather Belt', 'Simple leather belt to finish the whole look.'),
  ('bbbbbbbb-1111-1111-1111-000000000016', 'ms', 'Tali Pinggang Kulit', 'Tali pinggang kulit mudah untuk melengkapkan penampilan.'),
  ('bbbbbbbb-1111-1111-1111-000000000017', 'en', 'Crew Socks 3-Pack', 'Comfortable crew socks in a ready-to-rotate pack.'),
  ('bbbbbbbb-1111-1111-1111-000000000017', 'ms', 'Stoking Crew 3 Helai', 'Stoking crew selesa dalam pek sedia putar.'),
  ('bbbbbbbb-1111-1111-1111-000000000018', 'en', 'Shoe Care Kit', 'Clean, condition, and polish — extend your footwear life.'),
  ('bbbbbbbb-1111-1111-1111-000000000018', 'ms', 'Kit Penjagaan Kasut', 'Bersih, rawat, dan poles — panjangkan hayat kasut.'),
  ('bbbbbbbb-1111-1111-1111-000000000019', 'en', 'Mini Crossbody', 'Light crossbody that frees your hands and finishes the outfit.'),
  ('bbbbbbbb-1111-1111-1111-000000000019', 'ms', 'Crossbody Mini', 'Crossbody ringan yang membebaskan tangan dan melengkapkan gaya.'),
  ('bbbbbbbb-1111-1111-1111-000000000020', 'en', 'Logo Cap', 'Classic baseball silhouette with MODEL MATCH attitude.'),
  ('bbbbbbbb-1111-1111-1111-000000000020', 'ms', 'Topi Logo', 'Siluet besbol klasik dengan sikap MODEL MATCH.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
