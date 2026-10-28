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
