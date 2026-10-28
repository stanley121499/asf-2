-- =============================================================================
-- Expo Customer Storefront Theme — Agent 3 colorways + post/promo link seed
-- =============================================================================
-- Purpose: product_colors + color-scoped medias; posts taxonomy ∪ post_products;
--   multi-post product proof; promotions.image_url. Demo data for R6–R10.
-- Dual-path mirror: asf-2-next/supabase/migrations/ (same filename).
-- Idempotent: fixed UUIDs + ON CONFLICT / guarded inserts.
-- Depends on: Agent 1 DDL + Agent 2 taxonomy/catalog seed.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A) product_colors (≥8 products × 2–4 active colors; distinct hex values)
--    Fixed UUIDs: a2500001-24a8-4f00-8000-…
--    Example 3-colorway product: bbbbbbbb-1111-1111-1111-000000000001
-- ---------------------------------------------------------------------------
INSERT INTO public.product_colors (id, product_id, color, active, created_at, updated_at) VALUES
  -- Product 001 Classic Court — 3 colorways (handoff exemplar)
  ('a2500001-24a8-4f00-8000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000001', '#F5F5F5', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000001', '#111111', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000001', '#1E3A5F', true, NOW(), NOW()),
  -- Product 002 Urban Runner — 3
  ('a2500001-24a8-4f00-8000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000002', '#E11D48', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000005', 'bbbbbbbb-1111-1111-1111-000000000002', '#0EA5E9', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000006', 'bbbbbbbb-1111-1111-1111-000000000002', '#22C55E', true, NOW(), NOW()),
  -- Product 003 Night Street High-Top — 2
  ('a2500001-24a8-4f00-8000-000000000007', 'bbbbbbbb-1111-1111-1111-000000000003', '#0F172A', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000008', 'bbbbbbbb-1111-1111-1111-000000000003', '#7C3AED', true, NOW(), NOW()),
  -- Product 004 Minimal Derby — 3
  ('a2500001-24a8-4f00-8000-000000000009', 'bbbbbbbb-1111-1111-1111-000000000004', '#78350F', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000010', 'bbbbbbbb-1111-1111-1111-000000000004', '#1C1917', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000011', 'bbbbbbbb-1111-1111-1111-000000000004', '#A8A29E', true, NOW(), NOW()),
  -- Product 005 Chelsea Boot — 2
  ('a2500001-24a8-4f00-8000-000000000012', 'bbbbbbbb-1111-1111-1111-000000000005', '#171717', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000013', 'bbbbbbbb-1111-1111-1111-000000000005', '#92400E', true, NOW(), NOW()),
  -- Product 006 Trail Hiker — 3
  ('a2500001-24a8-4f00-8000-000000000014', 'bbbbbbbb-1111-1111-1111-000000000006', '#365314', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000015', 'bbbbbbbb-1111-1111-1111-000000000006', '#57534E', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000016', 'bbbbbbbb-1111-1111-1111-000000000006', '#B45309', true, NOW(), NOW()),
  -- Product 007 Soft Knit Slip-On — 2
  ('a2500001-24a8-4f00-8000-000000000017', 'bbbbbbbb-1111-1111-1111-000000000007', '#FCE7F3', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000018', 'bbbbbbbb-1111-1111-1111-000000000007', '#64748B', true, NOW(), NOW()),
  -- Product 008 Retro Court Low — 4
  ('a2500001-24a8-4f00-8000-000000000019', 'bbbbbbbb-1111-1111-1111-000000000008', '#FEF3C7', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000020', 'bbbbbbbb-1111-1111-1111-000000000008', '#DC2626', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000021', 'bbbbbbbb-1111-1111-1111-000000000008', '#2563EB', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000022', 'bbbbbbbb-1111-1111-1111-000000000008', '#111827', true, NOW(), NOW()),
  -- Product 009 Platform Sandal — 2
  ('a2500001-24a8-4f00-8000-000000000023', 'bbbbbbbb-1111-1111-1111-000000000009', '#FDF2F8', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000024', 'bbbbbbbb-1111-1111-1111-000000000009', '#BE123C', true, NOW(), NOW()),
  -- Product 010 Penny Loafer — 3
  ('a2500001-24a8-4f00-8000-000000000025', 'bbbbbbbb-1111-1111-1111-000000000010', '#292524', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000026', 'bbbbbbbb-1111-1111-1111-000000000010', '#854D0E', true, NOW(), NOW()),
  ('a2500001-24a8-4f00-8000-000000000027', 'bbbbbbbb-1111-1111-1111-000000000010', '#44403C', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  color = EXCLUDED.color,
  active = EXCLUDED.active,
  deleted_at = NULL,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- A2) product_medias with color_id (≥1 distinct HTTPS image per color)
--     Fixed UUIDs: a2600001-24a8-4f00-8000-…
--     arrangement starts at 10 so product-level media (arrangement 1) stays default
-- ---------------------------------------------------------------------------
INSERT INTO public.product_medias (id, product_id, media_url, arrangement, color_id, created_at, updated_at) VALUES
  -- 001 Classic Court
  ('a2600001-24a8-4f00-8000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000001',
   'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000001',
   'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000002', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000001',
   'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=80', 12,
   'a2500001-24a8-4f00-8000-000000000003', NOW(), NOW()),
  -- 002 Urban Runner
  ('a2600001-24a8-4f00-8000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000002',
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000004', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000005', 'bbbbbbbb-1111-1111-1111-000000000002',
   'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000005', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000006', 'bbbbbbbb-1111-1111-1111-000000000002',
   'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80', 12,
   'a2500001-24a8-4f00-8000-000000000006', NOW(), NOW()),
  -- 003 Night Street
  ('a2600001-24a8-4f00-8000-000000000007', 'bbbbbbbb-1111-1111-1111-000000000003',
   'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000007', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000008', 'bbbbbbbb-1111-1111-1111-000000000003',
   'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000008', NOW(), NOW()),
  -- 004 Derby
  ('a2600001-24a8-4f00-8000-000000000009', 'bbbbbbbb-1111-1111-1111-000000000004',
   'https://images.pexels.com/photos/292999/pexels-photo-292999.jpeg?auto=compress&cs=tinysrgb&w=1200', 10,
   'a2500001-24a8-4f00-8000-000000000009', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000010', 'bbbbbbbb-1111-1111-1111-000000000004',
   'https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=1200', 11,
   'a2500001-24a8-4f00-8000-000000000010', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000011', 'bbbbbbbb-1111-1111-1111-000000000004',
   'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1200&q=80', 12,
   'a2500001-24a8-4f00-8000-000000000011', NOW(), NOW()),
  -- 005 Chelsea
  ('a2600001-24a8-4f00-8000-000000000012', 'bbbbbbbb-1111-1111-1111-000000000005',
   'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000012', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000013', 'bbbbbbbb-1111-1111-1111-000000000005',
   'https://images.unsplash.com/photo-1605812860427-4024433a70fd?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000013', NOW(), NOW()),
  -- 006 Trail Hiker
  ('a2600001-24a8-4f00-8000-000000000014', 'bbbbbbbb-1111-1111-1111-000000000006',
   'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000014', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000015', 'bbbbbbbb-1111-1111-1111-000000000006',
   'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000015', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000016', 'bbbbbbbb-1111-1111-1111-000000000006',
   'https://images.unsplash.com/photo-1528701800489-20be3c2ea5b0?auto=format&fit=crop&w=1200&q=80', 12,
   'a2500001-24a8-4f00-8000-000000000016', NOW(), NOW()),
  -- 007 Soft Knit
  ('a2600001-24a8-4f00-8000-000000000017', 'bbbbbbbb-1111-1111-1111-000000000007',
   'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000017', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000018', 'bbbbbbbb-1111-1111-1111-000000000007',
   'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000018', NOW(), NOW()),
  -- 008 Retro Court — 4
  ('a2600001-24a8-4f00-8000-000000000019', 'bbbbbbbb-1111-1111-1111-000000000008',
   'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000019', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000020', 'bbbbbbbb-1111-1111-1111-000000000008',
   'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000020', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000021', 'bbbbbbbb-1111-1111-1111-000000000008',
   'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1200&q=80', 12,
   'a2500001-24a8-4f00-8000-000000000021', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000022', 'bbbbbbbb-1111-1111-1111-000000000008',
   'https://images.pexels.com/photos/1240892/pexels-photo-1240892.jpeg?auto=compress&cs=tinysrgb&w=1200', 13,
   'a2500001-24a8-4f00-8000-000000000022', NOW(), NOW()),
  -- 009 Platform Sandal
  ('a2600001-24a8-4f00-8000-000000000023', 'bbbbbbbb-1111-1111-1111-000000000009',
   'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=80', 10,
   'a2500001-24a8-4f00-8000-000000000023', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000024', 'bbbbbbbb-1111-1111-1111-000000000009',
   'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000024', NOW(), NOW()),
  -- 010 Penny Loafer
  ('a2600001-24a8-4f00-8000-000000000025', 'bbbbbbbb-1111-1111-1111-000000000010',
   'https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=1200', 10,
   'a2500001-24a8-4f00-8000-000000000025', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000026', 'bbbbbbbb-1111-1111-1111-000000000010',
   'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=80', 11,
   'a2500001-24a8-4f00-8000-000000000026', NOW(), NOW()),
  ('a2600001-24a8-4f00-8000-000000000027', 'bbbbbbbb-1111-1111-1111-000000000010',
   'https://images.unsplash.com/photo-1614252233457-5ef2da62be0b?auto=format&fit=crop&w=1200&q=80', 12,
   'a2500001-24a8-4f00-8000-000000000027', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  media_url = EXCLUDED.media_url,
  arrangement = EXCLUDED.arrangement,
  color_id = EXCLUDED.color_id,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- B) Posts — update 6 existing + insert 2 new (≥8 total)
--    One primary taxonomy FK per post (predictable resolver demos).
--    Link styles:
--      000001 department → 男鞋
--      000002 range      → 运动休闲
--      000003 category   → 跑鞋球场 (a230…0002, 3 products)
--      000004 brand      → Courtline
--      000005 / 000006   → explicit post_products only
--      000007 department → 女鞋
--      000008 range      → 穿戴配件
-- ---------------------------------------------------------------------------
UPDATE public.posts SET
  department_id = 'a2100001-24a8-4f00-8000-000000000001',
  range_id = NULL,
  category_id = NULL,
  brand_id = NULL,
  status = 'Published',
  active = true,
  deleted_at = NULL,
  time_post = TIMESTAMP '2026-08-24 10:00:00',
  name = '男鞋新季精选',
  caption = '从球场到街头 — 男鞋部门最新上架。'
WHERE id = 'cccccccc-1111-1111-1111-000000000001';

UPDATE public.posts SET
  department_id = NULL,
  range_id = 'a2200001-24a8-4f00-8000-000000000001',
  category_id = NULL,
  brand_id = NULL,
  status = 'Published',
  active = true,
  deleted_at = NULL,
  time_post = TIMESTAMP '2026-08-23 10:00:00',
  name = '运动休闲系列',
  caption = '轻量缓震与日常舒适 — 运动休闲系列特辑。'
WHERE id = 'cccccccc-1111-1111-1111-000000000002';

UPDATE public.posts SET
  department_id = NULL,
  range_id = NULL,
  category_id = 'a2300001-24a8-4f00-8000-000000000002',
  brand_id = NULL,
  status = 'Published',
  active = true,
  deleted_at = NULL,
  time_post = TIMESTAMP '2026-08-22 10:00:00',
  name = '球场经典分类',
  caption = '干净侧影与清晰线条 — 球场鞋分类精选。'
WHERE id = 'cccccccc-1111-1111-1111-000000000003';

UPDATE public.posts SET
  department_id = NULL,
  range_id = NULL,
  category_id = NULL,
  brand_id = 'a2400001-24a8-4f00-8000-000000000002',
  status = 'Published',
  active = true,
  deleted_at = NULL,
  time_post = TIMESTAMP '2026-08-21 10:00:00',
  name = 'Courtline 品牌故事',
  caption = 'Courtline 品牌精选 — 球场血统延续至今。'
WHERE id = 'cccccccc-1111-1111-1111-000000000004';

-- Explicit M2M posts (no taxonomy FKs)
UPDATE public.posts SET
  department_id = NULL,
  range_id = NULL,
  category_id = NULL,
  brand_id = NULL,
  status = 'Published',
  active = true,
  deleted_at = NULL,
  time_post = TIMESTAMP '2026-08-20 10:00:00',
  name = '造型师精选 A',
  caption = '跨品类编辑推荐 — 通过 post_products 显式关联。'
WHERE id = 'cccccccc-1111-1111-1111-000000000005';

UPDATE public.posts SET
  department_id = NULL,
  range_id = NULL,
  category_id = NULL,
  brand_id = NULL,
  status = 'Published',
  active = true,
  deleted_at = NULL,
  time_post = TIMESTAMP '2026-08-19 10:00:00',
  name = '造型师精选 B',
  caption = '同一商品可出现在多篇帖子 — 多对多证明。'
WHERE id = 'cccccccc-1111-1111-1111-000000000006';

INSERT INTO public.posts (
  id, name, caption, photo_size, caption_position, status, active,
  department_id, range_id, category_id, brand_id, time_post, created_at
) VALUES
  (
    'cccccccc-1111-1111-1111-000000000007',
    '女鞋日常灵感',
    '通勤与周末 — 女鞋部门灵感拼贴。',
    '1:1',
    'bottom',
    'Published',
    true,
    'a2100001-24a8-4f00-8000-000000000002',
    NULL,
    NULL,
    NULL,
    TIMESTAMP '2026-08-18 10:00:00',
    NOW()
  ),
  (
    'cccccccc-1111-1111-1111-000000000008',
    '穿戴配件点睛',
    '腰带、斜挎与帽款 — 穿戴配件系列。',
    '1:1',
    'bottom',
    'Published',
    true,
    NULL,
    'a2200001-24a8-4f00-8000-000000000005',
    NULL,
    NULL,
    TIMESTAMP '2026-08-17 10:00:00',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  caption = EXCLUDED.caption,
  photo_size = EXCLUDED.photo_size,
  caption_position = EXCLUDED.caption_position,
  status = EXCLUDED.status,
  active = EXCLUDED.active,
  department_id = EXCLUDED.department_id,
  range_id = EXCLUDED.range_id,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  time_post = EXCLUDED.time_post,
  deleted_at = NULL;

-- Post medias for new posts (007 / 008); keep existing 001–006 medias
INSERT INTO public.post_medias (post_id, media_url, media_type, arrangement, created_at)
SELECT v.post_id, v.media_url, 'image', 1, NOW()
FROM (VALUES
  (
    'cccccccc-1111-1111-1111-000000000007'::uuid,
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'cccccccc-1111-1111-1111-000000000008'::uuid,
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80'
  )
) AS v(post_id, media_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.post_medias pm
  WHERE pm.post_id = v.post_id AND pm.arrangement = 1
);

-- Refresh medias on existing posts 001–006 (idempotent URL upsert via delete+insert of arrangement 1)
-- Keep simple: only ensure they still have arrangement=1 rows (already seeded).

-- Post translations en + ms (upsert by post_id + locale)
INSERT INTO public.post_translations (id, post_id, locale, name, caption, created_at, updated_at) VALUES
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000001', 'en',
   'Men''s Season Edit', 'From court to street — latest from the men''s department.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000001', 'ms',
   'Pilihan Musim Lelaki', 'Dari gelanggang ke jalan — terbaru dari jabatan kasut lelaki.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000002', 'en',
   'Sport Lifestyle Range', 'Cushioned comfort for everyday — sport lifestyle edit.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000002', 'ms',
   'Julat Gaya Hidup Sukan', 'Keselesaan berbantalan untuk setiap hari — suntingan gaya hidup sukan.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000003', 'en',
   'Court Classics Category', 'Clean silhouettes and sharp lines — court category picks.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000003', 'ms',
   'Kategori Klasik Gelanggang', 'Siluet bersih dan garis tegas — pilihan kategori gelanggang.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000004', 'en',
   'Courtline Brand Story', 'Courtline selections — court DNA carried forward.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000004', 'ms',
   'Cerita Jenama Courtline', 'Pilihan Courtline — DNA gelanggang diteruskan.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000005', 'en',
   'Stylist Edit A', 'Cross-category picks linked via post_products.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000005', 'ms',
   'Suntingan Stylist A', 'Pilihan silang kategori melalui post_products.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000006', 'en',
   'Stylist Edit B', 'Same product on multiple posts — many-to-many proof.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000006', 'ms',
   'Suntingan Stylist B', 'Produk sama pada beberapa pos — bukti many-to-many.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000007', 'en',
   'Women''s Daily Inspiration', 'Commute to weekend — women''s department collage.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000007', 'ms',
   'Inspirasi Harian Wanita', 'Dari perjalanan ke hujung minggu — kolaj jabatan wanita.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000008', 'en',
   'Wearable Accessories Edit', 'Belts, crossbodies, and caps — wearable accessories range.', NOW(), NOW()),
  (gen_random_uuid(), 'cccccccc-1111-1111-1111-000000000008', 'ms',
   'Suntingan Aksesori Dipakai', 'Tali pinggang, beg silang dan topi — julat aksesori dipakai.', NOW(), NOW())
ON CONFLICT (post_id, locale) DO UPDATE SET
  name = EXCLUDED.name,
  caption = EXCLUDED.caption,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- B2) post_products — explicit M2M (≥2 posts; shared product 001 on both)
--     Product bbbbbbbb-…000001 appears on posts 005 AND 006.
-- ---------------------------------------------------------------------------
INSERT INTO public.post_products (post_id, product_id, created_at) VALUES
  -- Post 005 stylist A (≥3 products for Home 2×3)
  ('cccccccc-1111-1111-1111-000000000005', 'bbbbbbbb-1111-1111-1111-000000000001', NOW()),
  ('cccccccc-1111-1111-1111-000000000005', 'bbbbbbbb-1111-1111-1111-000000000002', NOW()),
  ('cccccccc-1111-1111-1111-000000000005', 'bbbbbbbb-1111-1111-1111-000000000011', NOW()),
  ('cccccccc-1111-1111-1111-000000000005', 'bbbbbbbb-1111-1111-1111-000000000012', NOW()),
  -- Post 006 stylist B — shared product 001 + more
  ('cccccccc-1111-1111-1111-000000000006', 'bbbbbbbb-1111-1111-1111-000000000001', NOW()),
  ('cccccccc-1111-1111-1111-000000000006', 'bbbbbbbb-1111-1111-1111-000000000013', NOW()),
  ('cccccccc-1111-1111-1111-000000000006', 'bbbbbbbb-1111-1111-1111-000000000014', NOW()),
  ('cccccccc-1111-1111-1111-000000000006', 'bbbbbbbb-1111-1111-1111-000000000015', NOW())
ON CONFLICT (post_id, product_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- C) Promotions — set image_url on ≥4 active; keep promotion_products intact
-- ---------------------------------------------------------------------------
UPDATE public.promotions SET
  image_url = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=1400&q=80',
  active = true,
  status = 'Published',
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000001';

UPDATE public.promotions SET
  image_url = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80',
  active = true,
  status = 'Published',
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000002';

UPDATE public.promotions SET
  image_url = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80',
  active = true,
  status = 'Published',
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000003';

UPDATE public.promotions SET
  image_url = 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1400&q=80',
  active = true,
  status = 'Published',
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000004';

-- Ensure each promo still has ≥3 storefront product links (repair if empty)
INSERT INTO public.promotion_products (promotion_id, product_id)
SELECT v.promotion_id, v.product_id
FROM (VALUES
  ('33330000-0000-0000-0000-000000000001'::uuid, 'bbbbbbbb-1111-1111-1111-000000000007'::uuid),
  ('33330000-0000-0000-0000-000000000001'::uuid, 'bbbbbbbb-1111-1111-1111-000000000008'::uuid),
  ('33330000-0000-0000-0000-000000000001'::uuid, 'bbbbbbbb-1111-1111-1111-000000000009'::uuid),
  ('33330000-0000-0000-0000-000000000002'::uuid, 'bbbbbbbb-1111-1111-1111-000000000001'::uuid),
  ('33330000-0000-0000-0000-000000000002'::uuid, 'bbbbbbbb-1111-1111-1111-000000000002'::uuid),
  ('33330000-0000-0000-0000-000000000002'::uuid, 'bbbbbbbb-1111-1111-1111-000000000003'::uuid),
  ('33330000-0000-0000-0000-000000000003'::uuid, 'bbbbbbbb-1111-1111-1111-000000000004'::uuid),
  ('33330000-0000-0000-0000-000000000003'::uuid, 'bbbbbbbb-1111-1111-1111-000000000005'::uuid),
  ('33330000-0000-0000-0000-000000000003'::uuid, 'bbbbbbbb-1111-1111-1111-000000000006'::uuid),
  ('33330000-0000-0000-0000-000000000004'::uuid, 'bbbbbbbb-1111-1111-1111-000000000014'::uuid),
  ('33330000-0000-0000-0000-000000000004'::uuid, 'bbbbbbbb-1111-1111-1111-000000000015'::uuid),
  ('33330000-0000-0000-0000-000000000004'::uuid, 'bbbbbbbb-1111-1111-1111-000000000016'::uuid)
) AS v(promotion_id, product_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.promotion_products pp
  WHERE pp.promotion_id = v.promotion_id AND pp.product_id = v.product_id
);
