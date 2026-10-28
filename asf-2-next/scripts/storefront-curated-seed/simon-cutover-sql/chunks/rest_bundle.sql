INSERT INTO public.product_translations (product_id, locale, name, description) VALUES
  ('c1010001-24a8-4f00-8000-000000000001', 'en', 'Knit Mary Jane Buckle Flat', 'Premium Knit Mary Jane Buckle Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000001', 'ms', 'Kasut Mary Jane Knit Buckle', 'Kasut Mary Jane Knit Buckle premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000002', 'en', 'Knit Ballet X-Strap Flat', 'Premium Knit Ballet X-Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000002', 'ms', 'Kasut Ballet Knit X-Strap', 'Kasut Ballet Knit X-Strap premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000003', 'en', 'Knit Ankle Strap Flat', 'Premium Knit Ankle Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000003', 'ms', 'Kasut Knit Ankle Strap', 'Kasut Knit Ankle Strap premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000004', 'en', 'Satin Ankle Strap Flat', 'Premium Satin Ankle Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000004', 'ms', 'Kasut Satin Ankle Strap', 'Kasut Satin Ankle Strap premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000005', 'en', 'Satin Mary Jane Flat', 'Premium Satin Mary Jane Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000005', 'ms', 'Kasut Mary Jane Satin', 'Kasut Mary Jane Satin premium untuk gaya harian.'),
  ('c1010001-24a8-4f00-8000-000000000006', 'en', 'Satin Ballet X-Strap Flat', 'Premium Satin Ballet X-Strap Flat — Simon curated flat for everyday Malaysian retail.'),
  ('c1010001-24a8-4f00-8000-000000000006', 'ms', 'Kasut Ballet Satin X-Strap', 'Kasut Ballet Satin X-Strap premium untuk gaya harian.')
ON CONFLICT (product_id, locale) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();
INSERT INTO public.product_categories (id, product_id, category_id, created_at, updated_at) VALUES
  ('c1540101-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('c1540201-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000002', 'a4300001-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('c1540301-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000003', 'a4300001-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('c1540401-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000004', 'a4300001-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('c1540501-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000005', 'a4300001-24a8-4f00-8000-000000000001', NOW(), NOW()),
  ('c1540601-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000006', 'a4300001-24a8-4f00-8000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id, category_id = EXCLUDED.category_id,
  updated_at = NOW();
INSERT INTO public.product_stock (id, product_id, color_id, size_id, count, created_at) VALUES
  ('c1550101-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000001', NULL, NULL, 40, NOW()),
  ('c1550201-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000002', NULL, NULL, 40, NOW()),
  ('c1550301-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000003', NULL, NULL, 40, NOW()),
  ('c1550401-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000004', NULL, NULL, 40, NOW()),
  ('c1550501-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000005', NULL, NULL, 40, NOW()),
  ('c1550601-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000006', NULL, NULL, 40, NOW())
ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, count = EXCLUDED.count;
INSERT INTO public.posts (
  id, name, caption, photo_size, caption_position, cta_text, status, active,
  department_id, range_id, category_id, brand_id, time_post, created_at, deleted_at
) VALUES
  ('c2010001-24a8-4f00-8000-000000000001', '酒店大堂 · 针织玛丽珍', '奶油针织玛丽珍，轻盈步伐开启新日。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '0 days', NOW() - INTERVAL '0 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000002', '画廊漫步 · 交叉带芭蕾', '黑色针织交叉带，艺术空间里的利落剪影。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000003', '花园婚礼 · 踝带平底', '腮红针织踝带，温柔出席每一场仪式。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000004', '河畔暮色 · 缎面踝带', '奶油缎面踝带，暮光里的柔软光泽。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000005', '电车站 · 缎面玛丽珍', '黑粉缎面玛丽珍，都市夜色通勤灵感。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000006', '阳台晨光 · 缎面芭蕾', '奶油缎面交叉带，晨光里的日常诗意。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000007', '雨天咖啡馆 · 黑色玛丽珍', '黑色针织扣带，雨窗旁的沉稳节奏。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000008', '雕塑庭院 · 米色交叉带', '米色针织芭蕾，石柱光影中的自在步伐。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000009', '爵士楼梯 · 黑粉芭蕾', '黑粉缎面交叉带，阶梯上的夜色轻舞。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 hours', NULL),
  ('c2010001-24a8-4f00-8000-000000000010', '温室阳光 · 奶油玛丽珍', '奶油缎面玛丽珍，植物光影里的温柔停留。', '16:9', 'bottom', '查看商品', 'Published', true, 'a3100001-24a8-4f00-8000-000000000002', 'a4200001-24a8-4f00-8000-000000000001', 'a4300001-24a8-4f00-8000-000000000001', 'a3400001-24a8-4f00-8000-000000000001', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 hours', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, caption = EXCLUDED.caption, status = 'Published',
  active = true, deleted_at = NULL, department_id = EXCLUDED.department_id,
  range_id = EXCLUDED.range_id, category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id, time_post = EXCLUDED.time_post;
INSERT INTO public.post_medias (post_id, media_url, media_type, arrangement, created_at)
SELECT v.post_id, v.media_url, 'image', 1, NOW()
FROM (VALUES
  ('c2010001-24a8-4f00-8000-000000000001'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000001.webp'),
  ('c2010001-24a8-4f00-8000-000000000002'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000002.webp'),
  ('c2010001-24a8-4f00-8000-000000000003'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000003.webp'),
  ('c2010001-24a8-4f00-8000-000000000004'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000004.webp'),
  ('c2010001-24a8-4f00-8000-000000000005'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000005.webp'),
  ('c2010001-24a8-4f00-8000-000000000006'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000006.webp'),
  ('c2010001-24a8-4f00-8000-000000000007'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000007.webp'),
  ('c2010001-24a8-4f00-8000-000000000008'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000008.webp'),
  ('c2010001-24a8-4f00-8000-000000000009'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000009.webp'),
  ('c2010001-24a8-4f00-8000-000000000010'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000010.webp')
) AS v(post_id, media_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.post_medias pm
  WHERE pm.post_id = v.post_id AND pm.arrangement = 1
);
UPDATE public.post_medias pm SET media_url = v.media_url
FROM (VALUES
  ('c2010001-24a8-4f00-8000-000000000001'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000001.webp'),
  ('c2010001-24a8-4f00-8000-000000000002'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000002.webp'),
  ('c2010001-24a8-4f00-8000-000000000003'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000003.webp'),
  ('c2010001-24a8-4f00-8000-000000000004'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000004.webp'),
  ('c2010001-24a8-4f00-8000-000000000005'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000005.webp'),
  ('c2010001-24a8-4f00-8000-000000000006'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000006.webp'),
  ('c2010001-24a8-4f00-8000-000000000007'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000007.webp'),
  ('c2010001-24a8-4f00-8000-000000000008'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000008.webp'),
  ('c2010001-24a8-4f00-8000-000000000009'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000009.webp'),
  ('c2010001-24a8-4f00-8000-000000000010'::uuid, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/post_medias/storefront-curated/2026-10/simon/posts/c2010001-24a8-4f00-8000-000000000010.webp')
) AS v(post_id, media_url)
WHERE pm.post_id = v.post_id::uuid AND pm.arrangement = 1;
INSERT INTO public.post_products (post_id, product_id, created_at) VALUES
  ('c2010001-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000001', NOW()),
  ('c2010001-24a8-4f00-8000-000000000002', 'c1010001-24a8-4f00-8000-000000000002', NOW()),
  ('c2010001-24a8-4f00-8000-000000000003', 'c1010001-24a8-4f00-8000-000000000003', NOW()),
  ('c2010001-24a8-4f00-8000-000000000004', 'c1010001-24a8-4f00-8000-000000000004', NOW()),
  ('c2010001-24a8-4f00-8000-000000000005', 'c1010001-24a8-4f00-8000-000000000005', NOW()),
  ('c2010001-24a8-4f00-8000-000000000006', 'c1010001-24a8-4f00-8000-000000000006', NOW()),
  ('c2010001-24a8-4f00-8000-000000000007', 'c1010001-24a8-4f00-8000-000000000001', NOW()),
  ('c2010001-24a8-4f00-8000-000000000008', 'c1010001-24a8-4f00-8000-000000000002', NOW()),
  ('c2010001-24a8-4f00-8000-000000000009', 'c1010001-24a8-4f00-8000-000000000006', NOW()),
  ('c2010001-24a8-4f00-8000-000000000010', 'c1010001-24a8-4f00-8000-000000000005', NOW())
ON CONFLICT (post_id, product_id) DO NOTHING;
INSERT INTO public.post_translations (post_id, locale, name, caption) VALUES
  ('c2010001-24a8-4f00-8000-000000000001', 'en', 'Hotel Lobby · Knit Mary Jane', '奶油针织玛丽珍，轻盈步伐开启新日。'),
  ('c2010001-24a8-4f00-8000-000000000002', 'en', 'Gallery Walk · X-Strap Ballet', '黑色针织交叉带，艺术空间里的利落剪影。'),
  ('c2010001-24a8-4f00-8000-000000000003', 'en', 'Garden Wedding · Ankle Strap', '腮红针织踝带，温柔出席每一场仪式。'),
  ('c2010001-24a8-4f00-8000-000000000004', 'en', 'Riverside Blue Hour · Satin Ankle', '奶油缎面踝带，暮光里的柔软光泽。'),
  ('c2010001-24a8-4f00-8000-000000000005', 'en', 'Tram Stop · Satin Mary Jane', '黑粉缎面玛丽珍，都市夜色通勤灵感。'),
  ('c2010001-24a8-4f00-8000-000000000006', 'en', 'Laundry Balcony · Satin Ballet', '奶油缎面交叉带，晨光里的日常诗意。'),
  ('c2010001-24a8-4f00-8000-000000000007', 'en', 'Rainy Café · Black Mary Jane', '黑色针织扣带，雨窗旁的沉稳节奏。'),
  ('c2010001-24a8-4f00-8000-000000000008', 'en', 'Sculpture Courtyard · Beige X-Strap', '米色针织芭蕾，石柱光影中的自在步伐。'),
  ('c2010001-24a8-4f00-8000-000000000009', 'en', 'Jazz Club Stairs · Black-Pink Ballet', '黑粉缎面交叉带，阶梯上的夜色轻舞。'),
  ('c2010001-24a8-4f00-8000-000000000010', 'en', 'Conservatory Light · Cream Mary Jane', '奶油缎面玛丽珍，植物光影里的温柔停留。')
ON CONFLICT (post_id, locale) DO UPDATE SET
  name = EXCLUDED.name, caption = EXCLUDED.caption;
INSERT INTO public.promotions (
  id, name, description, code, type, discount_type, discount_value,
  minimum_purchase_amount, auto_apply, status, active,
  start_date, end_date, max_uses, uses_count, image_url, created_at, deleted_at
) VALUES
  ('c3010001-24a8-4f00-8000-000000000001', '新季女鞋', '新季女鞋 — Simon 女鞋平底精选优惠。', 'SIMONNEW', 'discount', 'percentage', 10, 0, false, 'Published', true, TIMESTAMPTZ '2026-10-01 00:00:00+00', TIMESTAMPTZ '2027-03-31 23:59:59+00', NULL, 0, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-10/simon/promos/c3010001-24a8-4f00-8000-000000000001.webp', NOW(), NULL),
  ('c3010001-24a8-4f00-8000-000000000002', '会员专属', '会员专属 — Simon 女鞋平底精选优惠。', 'SIMONMEMBER', 'discount', 'fixed', 20, 0, false, 'Published', true, TIMESTAMPTZ '2026-10-01 00:00:00+00', TIMESTAMPTZ '2027-03-31 23:59:59+00', NULL, 0, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-10/simon/promos/c3010001-24a8-4f00-8000-000000000002.webp', NOW(), NULL),
  ('c3010001-24a8-4f00-8000-000000000003', '缎面优雅', '缎面优雅 — Simon 女鞋平底精选优惠。', 'SIMONSATIN', 'discount', 'percentage', 12, 0, false, 'Published', true, TIMESTAMPTZ '2026-10-01 00:00:00+00', TIMESTAMPTZ '2027-03-31 23:59:59+00', NULL, 0, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-10/simon/promos/c3010001-24a8-4f00-8000-000000000003.webp', NOW(), NULL),
  ('c3010001-24a8-4f00-8000-000000000004', '限时特惠', '限时特惠 — Simon 女鞋平底精选优惠。', 'SIMONLIMIT', 'discount', 'percentage', 15, 0, false, 'Published', true, TIMESTAMPTZ '2026-10-01 00:00:00+00', TIMESTAMPTZ '2027-03-31 23:59:59+00', NULL, 0, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-10/simon/promos/c3010001-24a8-4f00-8000-000000000004.webp', NOW(), NULL),
  ('c3010001-24a8-4f00-8000-000000000005', '通勤必备', '通勤必备 — Simon 女鞋平底精选优惠。', 'SIMONCOMMUTE', 'discount', 'percentage', 10, 0, false, 'Published', true, TIMESTAMPTZ '2026-10-01 00:00:00+00', TIMESTAMPTZ '2027-03-31 23:59:59+00', NULL, 0, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-10/simon/promos/c3010001-24a8-4f00-8000-000000000005.webp', NOW(), NULL),
  ('c3010001-24a8-4f00-8000-000000000006', '夜色轻舞', '夜色轻舞 — Simon 女鞋平底精选优惠。', 'SIMONEVE', 'discount', 'percentage', 12, 0, false, 'Published', true, TIMESTAMPTZ '2026-10-01 00:00:00+00', TIMESTAMPTZ '2027-03-31 23:59:59+00', NULL, 0, 'https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/medias/storefront-curated/2026-10/simon/promos/c3010001-24a8-4f00-8000-000000000006.webp', NOW(), NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, code = EXCLUDED.code,
  discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value,
  status = 'Published', active = true, deleted_at = NULL,
  image_url = EXCLUDED.image_url;
INSERT INTO public.promotion_products (promotion_id, product_id) VALUES
  ('c3010001-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000001'),
  ('c3010001-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000002'),
  ('c3010001-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000003'),
  ('c3010001-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000004'),
  ('c3010001-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000005'),
  ('c3010001-24a8-4f00-8000-000000000001', 'c1010001-24a8-4f00-8000-000000000006'),
  ('c3010001-24a8-4f00-8000-000000000002', 'c1010001-24a8-4f00-8000-000000000004'),
  ('c3010001-24a8-4f00-8000-000000000002', 'c1010001-24a8-4f00-8000-000000000001'),
  ('c3010001-24a8-4f00-8000-000000000002', 'c1010001-24a8-4f00-8000-000000000002'),
  ('c3010001-24a8-4f00-8000-000000000002', 'c1010001-24a8-4f00-8000-000000000003'),
  ('c3010001-24a8-4f00-8000-000000000002', 'c1010001-24a8-4f00-8000-000000000005'),
  ('c3010001-24a8-4f00-8000-000000000002', 'c1010001-24a8-4f00-8000-000000000006'),
  ('c3010001-24a8-4f00-8000-000000000003', 'c1010001-24a8-4f00-8000-000000000005'),
  ('c3010001-24a8-4f00-8000-000000000003', 'c1010001-24a8-4f00-8000-000000000001'),
  ('c3010001-24a8-4f00-8000-000000000003', 'c1010001-24a8-4f00-8000-000000000002'),
  ('c3010001-24a8-4f00-8000-000000000003', 'c1010001-24a8-4f00-8000-000000000003'),
  ('c3010001-24a8-4f00-8000-000000000003', 'c1010001-24a8-4f00-8000-000000000004'),
  ('c3010001-24a8-4f00-8000-000000000003', 'c1010001-24a8-4f00-8000-000000000006'),
  ('c3010001-24a8-4f00-8000-000000000004', 'c1010001-24a8-4f00-8000-000000000002'),
  ('c3010001-24a8-4f00-8000-000000000004', 'c1010001-24a8-4f00-8000-000000000001'),
  ('c3010001-24a8-4f00-8000-000000000004', 'c1010001-24a8-4f00-8000-000000000003'),
  ('c3010001-24a8-4f00-8000-000000000004', 'c1010001-24a8-4f00-8000-000000000004'),
  ('c3010001-24a8-4f00-8000-000000000004', 'c1010001-24a8-4f00-8000-000000000005'),
  ('c3010001-24a8-4f00-8000-000000000004', 'c1010001-24a8-4f00-8000-000000000006'),
  ('c3010001-24a8-4f00-8000-000000000005', 'c1010001-24a8-4f00-8000-000000000003'),
  ('c3010001-24a8-4f00-8000-000000000005', 'c1010001-24a8-4f00-8000-000000000001'),
  ('c3010001-24a8-4f00-8000-000000000005', 'c1010001-24a8-4f00-8000-000000000002'),
  ('c3010001-24a8-4f00-8000-000000000005', 'c1010001-24a8-4f00-8000-000000000004'),
  ('c3010001-24a8-4f00-8000-000000000005', 'c1010001-24a8-4f00-8000-000000000005'),
  ('c3010001-24a8-4f00-8000-000000000005', 'c1010001-24a8-4f00-8000-000000000006'),
  ('c3010001-24a8-4f00-8000-000000000006', 'c1010001-24a8-4f00-8000-000000000006'),
  ('c3010001-24a8-4f00-8000-000000000006', 'c1010001-24a8-4f00-8000-000000000001'),
  ('c3010001-24a8-4f00-8000-000000000006', 'c1010001-24a8-4f00-8000-000000000002'),
  ('c3010001-24a8-4f00-8000-000000000006', 'c1010001-24a8-4f00-8000-000000000003'),
  ('c3010001-24a8-4f00-8000-000000000006', 'c1010001-24a8-4f00-8000-000000000004'),
  ('c3010001-24a8-4f00-8000-000000000006', 'c1010001-24a8-4f00-8000-000000000005')
ON CONFLICT (promotion_id, product_id) DO NOTHING;
-- Ensure Shop occupation path is active
UPDATE public.ranges SET active = true, deleted_at = NULL WHERE id = 'a4200001-24a8-4f00-8000-000000000001';
UPDATE public.categories SET active = true, deleted_at = NULL WHERE id = 'a4300001-24a8-4f00-8000-000000000001';
UPDATE public.departments SET active = true, deleted_at = NULL WHERE id = 'a3100001-24a8-4f00-8000-000000000002';
UPDATE public.brand SET active = true, deleted_at = NULL WHERE id = 'a3400001-24a8-4f00-8000-000000000001';
