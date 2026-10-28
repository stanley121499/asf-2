-- Agents 30-31: curated storefront promotions (6) + promotion_products
-- image_url left empty for Agents 32-36 banner generation

INSERT INTO public.promotions (
  id, name, description, code, type, discount_type, discount_value,
  minimum_purchase_amount, auto_apply, status, active,
  start_date, end_date, max_uses, uses_count, image_url, created_at
) VALUES
  (
    '44440001-24a8-4f00-8000-000000000001',
    '新会员首单 15%',
    '新会员首单享 15% 折扣 — 精选鞋履与配件。',
    'WELCOME15',
    'discount', 'percentage', 15,
    0, false, 'Published', true,
    TIMESTAMPTZ '2026-08-01 00:00:00+00', TIMESTAMPTZ '2026-12-31 23:59:59+00',
    NULL, 0, '', NOW()
  ),
  (
    '44440001-24a8-4f00-8000-000000000002',
    '模力全场 10%',
    '模力品牌精选商品 10% 优惠。',
    'MODELMATCH10',
    'discount', 'percentage', 10,
    0, false, 'Published', true,
    TIMESTAMPTZ '2026-08-01 00:00:00+00', TIMESTAMPTZ '2026-12-31 23:59:59+00',
    NULL, 0, '', NOW()
  ),
  (
    '44440001-24a8-4f00-8000-000000000003',
    '会员专属减 RM20',
    '会员专属满额立减 RM20。',
    'MEMBER20',
    'discount', 'fixed', 20,
    199, false, 'Published', true,
    TIMESTAMPTZ '2026-08-01 00:00:00+00', TIMESTAMPTZ '2026-12-31 23:59:59+00',
    NULL, 0, '', NOW()
  ),
  (
    '44440001-24a8-4f00-8000-000000000004',
    '球鞋季特惠 12%',
    '跑鞋与球场系列季末特惠 12%。',
    'SNEAKER12',
    'discount', 'percentage', 12,
    0, false, 'Published', true,
    TIMESTAMPTZ '2026-08-01 00:00:00+00', TIMESTAMPTZ '2026-12-31 23:59:59+00',
    NULL, 0, '', NOW()
  ),
  (
    '44440001-24a8-4f00-8000-000000000005',
    '配件加购礼',
    '指定配件加购优惠。',
    'ACCESSORY6',
    'discount', 'percentage', 8,
    0, false, 'Published', true,
    TIMESTAMPTZ '2026-08-01 00:00:00+00', TIMESTAMPTZ '2026-12-31 23:59:59+00',
    NULL, 0, '', NOW()
  ),
  (
    '44440001-24a8-4f00-8000-000000000006',
    '正装通勤季',
    '正装皮鞋与通勤靴履特惠。',
    'FORMAL6',
    'discount', 'percentage', 10,
    0, false, 'Published', true,
    TIMESTAMPTZ '2026-08-01 00:00:00+00', TIMESTAMPTZ '2026-12-31 23:59:59+00',
    NULL, 0, '', NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  code = EXCLUDED.code,
  type = EXCLUDED.type,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  minimum_purchase_amount = EXCLUDED.minimum_purchase_amount,
  auto_apply = EXCLUDED.auto_apply,
  status = EXCLUDED.status,
  active = EXCLUDED.active,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  deleted_at = NULL;

-- Promo 001: mixed bestsellers (8)
INSERT INTO public.promotion_products (promotion_id, product_id) VALUES
  ('44440001-24a8-4f00-8000-000000000001', 'dddd0101-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000001', 'dddd0201-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000001', 'dddd0501-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000001', 'dddd0601-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000001', 'dddd0701-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000001', 'dddd0801-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000001', 'dddd0901-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000001', 'dddd1001-24a8-4f00-8000-000000000001')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- Promo 002: MODEL MATCH / 模力 products (brand a340…001)
INSERT INTO public.promotion_products (promotion_id, product_id) VALUES
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0102-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0202-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0502-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0601-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0702-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0801-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0803-24a8-4f00-8000-000000000003'),
  ('44440001-24a8-4f00-8000-000000000002', 'dddd0902-24a8-4f00-8000-000000000002')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- Promo 003: member fixed discount mix (8)
INSERT INTO public.promotion_products (promotion_id, product_id) VALUES
  ('44440001-24a8-4f00-8000-000000000003', 'dddd0301-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000003', 'dddd0401-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000003', 'dddd0503-24a8-4f00-8000-000000000003'),
  ('44440001-24a8-4f00-8000-000000000003', 'dddd0605-24a8-4f00-8000-000000000005'),
  ('44440001-24a8-4f00-8000-000000000003', 'dddd0704-24a8-4f00-8000-000000000004'),
  ('44440001-24a8-4f00-8000-000000000003', 'dddd0804-24a8-4f00-8000-000000000004'),
  ('44440001-24a8-4f00-8000-000000000003', 'dddd0903-24a8-4f00-8000-000000000003'),
  ('44440001-24a8-4f00-8000-000000000003', 'dddd1201-24a8-4f00-8000-000000000001')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- Promo 004: sneakers season — run + court (8)
INSERT INTO public.promotion_products (promotion_id, product_id) VALUES
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0101-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0103-24a8-4f00-8000-000000000003'),
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0105-24a8-4f00-8000-000000000005'),
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0201-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0203-24a8-4f00-8000-000000000003'),
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0205-24a8-4f00-8000-000000000005'),
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0602-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000004', 'dddd0603-24a8-4f00-8000-000000000003')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- Promo 005: accessories (6)
INSERT INTO public.promotion_products (promotion_id, product_id) VALUES
  ('44440001-24a8-4f00-8000-000000000005', 'dddd0901-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000005', 'dddd0902-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000005', 'dddd1001-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000005', 'dddd1004-24a8-4f00-8000-000000000004'),
  ('44440001-24a8-4f00-8000-000000000005', 'dddd1101-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000005', 'dddd1201-24a8-4f00-8000-000000000001')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- Promo 006: formal commute (6)
INSERT INTO public.promotion_products (promotion_id, product_id) VALUES
  ('44440001-24a8-4f00-8000-000000000006', 'dddd0301-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000006', 'dddd0302-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000006', 'dddd0303-24a8-4f00-8000-000000000003'),
  ('44440001-24a8-4f00-8000-000000000006', 'dddd0401-24a8-4f00-8000-000000000001'),
  ('44440001-24a8-4f00-8000-000000000006', 'dddd0402-24a8-4f00-8000-000000000002'),
  ('44440001-24a8-4f00-8000-000000000006', 'dddd0405-24a8-4f00-8000-000000000005')
ON CONFLICT (promotion_id, product_id) DO NOTHING;
