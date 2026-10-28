-- Agents 28-29: curated storefront posts (10) + post_products + translations + placeholder medias

INSERT INTO public.posts (
  id, name, caption, photo_size, caption_position, cta_text, status, active,
  department_id, range_id, category_id, brand_id, time_post, created_at
) VALUES
  (
    'eeee0001-24a8-4f00-8000-000000000001',
    '男鞋新季精选',
    '从球场到街头 — 男鞋部门本季精选。',
    '1:1', 'bottom', '查看全部', 'Published', true,
    'a3100001-24a8-4f00-8000-000000000001', NULL, NULL, NULL,
    TIMESTAMP '2026-08-24 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000002',
    '运动休闲系列',
    '缓震舒适，日常百搭 — 运动休闲系列。',
    '1:1', 'bottom', '探索系列', 'Published', true,
    NULL, 'a3200001-24a8-4f00-8000-000000000001', NULL, NULL,
    TIMESTAMP '2026-08-23 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000003',
    '球场经典分类',
    '干净线条与经典廓形 — 板鞋球场分类精选。',
    '1:1', 'bottom', '进入分类', 'Published', true,
    NULL, NULL, 'a3300001-24a8-4f00-8000-000000000002', NULL,
    TIMESTAMP '2026-08-22 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000004',
    '球场线品牌故事',
    '球场 DNA 延续 — 球场线品牌精选。',
    '1:1', 'bottom', '了解品牌', 'Published', true,
    NULL, NULL, NULL, 'a3400001-24a8-4f00-8000-000000000003',
    TIMESTAMP '2026-08-21 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000005',
    '造型师精选 A',
    '跨品类造型师推荐 — 经由 post_products 显式关联。',
    '1:1', 'bottom', '查看搭配', 'Published', true,
    NULL, NULL, NULL, NULL,
    TIMESTAMP '2026-08-20 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000006',
    '造型师精选 B',
    '同一商品可出现在多篇帖子 — 多对多证明。',
    '1:1', 'bottom', '查看搭配', 'Published', true,
    NULL, NULL, NULL, NULL,
    TIMESTAMP '2026-08-19 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000007',
    '女鞋日常灵感',
    '通勤与周末 — 女鞋部门灵感拼贴。',
    '1:1', 'bottom', '查看全部', 'Published', true,
    'a3100001-24a8-4f00-8000-000000000002', NULL, NULL, NULL,
    TIMESTAMP '2026-08-18 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000008',
    '短靴衣橱必备',
    '秋冬短靴必备清单 — 短靴分类精选。',
    '1:1', 'bottom', '进入分类', 'Published', true,
    NULL, NULL, 'a3300001-24a8-4f00-8000-000000000007', NULL,
    TIMESTAMP '2026-08-17 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000009',
    '穿戴配件点睛',
    '包袋与帽袜 — 穿戴配件点睛之选。',
    '1:1', 'bottom', '探索配件', 'Published', true,
    NULL, NULL, 'a3300001-24a8-4f00-8000-000000000009', NULL,
    TIMESTAMP '2026-08-16 10:00:00', NOW()
  ),
  (
    'eeee0001-24a8-4f00-8000-000000000010',
    '越野型户外特辑',
    '户外机能与耐用设计 — 越野型品牌特辑。',
    '1:1', 'bottom', '了解品牌', 'Published', true,
    NULL, NULL, NULL, 'a3400001-24a8-4f00-8000-000000000004',
    TIMESTAMP '2026-08-15 10:00:00', NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  caption = EXCLUDED.caption,
  photo_size = EXCLUDED.photo_size,
  caption_position = EXCLUDED.caption_position,
  cta_text = EXCLUDED.cta_text,
  status = EXCLUDED.status,
  active = EXCLUDED.active,
  department_id = EXCLUDED.department_id,
  range_id = EXCLUDED.range_id,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  time_post = EXCLUDED.time_post,
  deleted_at = NULL;

-- Explicit post_products (Stylist A / B / accessories; M2M proof dddd0201 on posts 3+5)
INSERT INTO public.post_products (post_id, product_id, created_at) VALUES
  -- Stylist A (post 005)
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0101-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0201-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0203-24a8-4f00-8000-000000000003', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0301-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0401-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0601-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0701-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000005', 'dddd0801-24a8-4f00-8000-000000000001', NOW()),
  -- Stylist B (post 006)
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0501-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0602-24a8-4f00-8000-000000000002', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0702-24a8-4f00-8000-000000000002', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0801-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0803-24a8-4f00-8000-000000000003', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0503-24a8-4f00-8000-000000000003', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0605-24a8-4f00-8000-000000000005', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000006', 'dddd0704-24a8-4f00-8000-000000000004', NOW()),
  -- Accessories post 009: 帽袜 extras (category already covers 包袋)
  ('eeee0001-24a8-4f00-8000-000000000009', 'dddd1001-24a8-4f00-8000-000000000001', NOW()),
  ('eeee0001-24a8-4f00-8000-000000000009', 'dddd1002-24a8-4f00-8000-000000000002', NOW()),
  -- M2M proof: classic court sneaker also on category post 003
  ('eeee0001-24a8-4f00-8000-000000000003', 'dddd0201-24a8-4f00-8000-000000000001', NOW())
ON CONFLICT (post_id, product_id) DO NOTHING;

-- Placeholder medias (Agents 32-35 replace URLs with generated editorial)
INSERT INTO public.post_medias (post_id, media_url, media_type, arrangement, created_at)
SELECT v.post_id, '', 'image', 1, NOW()
FROM (VALUES
  ('eeee0001-24a8-4f00-8000-000000000001'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000002'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000003'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000004'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000005'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000006'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000007'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000008'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000009'::uuid),
  ('eeee0001-24a8-4f00-8000-000000000010'::uuid)
) AS v(post_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.post_medias pm
  WHERE pm.post_id = v.post_id AND pm.arrangement = 1
);

DELETE FROM public.post_translations
WHERE post_id::text LIKE 'eeee0001-24a8-4f00-8000-%';

INSERT INTO public.post_translations (id, post_id, locale, name, caption, cta_text, created_at, updated_at) VALUES
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000001', 'en', 'Men''s Season Edit', 'From court to street — latest from the men''s department.', 'Shop all', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000001', 'ms', 'Pilihan Musim Lelaki', 'Dari gelanggang ke jalan — terbaru dari jabatan kasut lelaki.', 'Lihat semua', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000002', 'en', 'Sport Lifestyle Range', 'Cushioned comfort for everyday — sport lifestyle edit.', 'Explore', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000002', 'ms', 'Julat Gaya Hidup Sukan', 'Keselesaan berbantalan untuk setiap hari.', 'Terokai', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000003', 'en', 'Court Classics Category', 'Clean silhouettes — court category picks.', 'Shop category', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000003', 'ms', 'Kategori Klasik Gelanggang', 'Siluet bersih — pilihan kategori gelanggang.', 'Lihat kategori', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000004', 'en', 'Courtline Brand Story', 'Courtline selections — court DNA carried forward.', 'Meet brand', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000004', 'ms', 'Cerita Jenama Courtline', 'Pilihan Courtline — DNA gelanggang diteruskan.', 'Kenali jenama', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000005', 'en', 'Stylist Edit A', 'Cross-category picks linked via post_products.', 'View looks', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000005', 'ms', 'Suntingan Stylist A', 'Pilihan silang kategori melalui post_products.', 'Lihat gaya', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000006', 'en', 'Stylist Edit B', 'Same product on multiple posts — many-to-many proof.', 'View looks', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000006', 'ms', 'Suntingan Stylist B', 'Produk sama pada berbilang pos — bukti many-to-many.', 'Lihat gaya', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000007', 'en', 'Women''s Daily Inspiration', 'Commute and weekend — women''s department collage.', 'Shop all', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000007', 'ms', 'Inspirasi Harian Wanita', 'Berulang-alik dan hujung minggu — jabatan kasut wanita.', 'Lihat semua', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000008', 'en', 'Ankle Boot Essentials', 'Fall/winter ankle boot checklist.', 'Shop category', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000008', 'ms', 'Asas Boot Buku Lali', 'Senarai boot buku lali musim luruh/sejuk.', 'Lihat kategori', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000009', 'en', 'Accessories Finishing Touches', 'Bags and caps/socks — finishing touches.', 'Explore', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000009', 'ms', 'Sentuhan Akhir Aksesori', 'Beg dan topi/stoking — sentuhan akhir.', 'Terokai', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000010', 'en', 'Trailform Outdoor Edit', 'Outdoor function and durable design — Trailform.', 'Meet brand', NOW(), NOW()),
  (gen_random_uuid(), 'eeee0001-24a8-4f00-8000-000000000010', 'ms', 'Suntingan Luar Trailform', 'Fungsi luar dan reka bentuk tahan lasak — Trailform.', 'Kenali jenama', NOW(), NOW());
