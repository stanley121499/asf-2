-- ==============================================================================
-- ASF Mart — Operational Demo Data Seed
-- File: docs/seed_operational.sql
--
-- Purpose: Populate transactional / operational data so the Staff App dashboards,
--          orders, analytics, stocks, and promotions screens are not empty.
--
-- Prerequisites: docs/seed_minimarket.sql must be executed first so that
--   products bbbbbbbb-1111-1111-1111-000000000001 … 000000000020 (P01–P20)
--   and categories aaaaaaaa-1111-1111-1111-000000000001 … 000000000004
--   already exist in the database.
--
-- Safe to re-run: All INSERTs use ON CONFLICT (id) DO NOTHING.
--                 DELETEs at the top clear previous operational data only.
--
-- NOTE: user_details has a real FK to auth.users — fake demo user rows are
--       intentionally skipped.  orders.user_id has no FK constraint so the
--       three demo UUIDs (22220000-*) are stored on orders/payments fine and
--       analytics will show 3 distinct customers.
--
-- UUID prefix conventions (for easy reading):
--   11110000-* = membership_tiers
--   33330000-* = promotions
--   44440000-* = announcements
--   55550000-* = homepage_elements
--   66660000-* = product_events
--   77770000-* = product_purchase_orders
--   88880000-* = product_reports
--   99990000-* = product_stock  (rows 01–20)
--   aaaa0000-* = orders         (rows 01–30)
-- ==============================================================================


-- ============================================================
-- CLEANUP — remove previous operational demo data.
--           Product catalogue (products, categories, posts) is preserved.
-- ============================================================

-- Clear nullable circular back-references on product_events first so that
-- product_purchase_orders and product_reports can be deleted safely below.
UPDATE product_events
SET    purchase_order_id = NULL,
       report_id         = NULL
WHERE  purchase_order_id IS NOT NULL
   OR  report_id         IS NOT NULL;

DELETE FROM order_status_logs;
DELETE FROM order_items;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM sales_logs;
DELETE FROM product_stock;
DELETE FROM product_purchase_order_entries;
DELETE FROM product_purchase_orders;
DELETE FROM product_reports;
DELETE FROM product_events;
DELETE FROM promotion_products;
DELETE FROM promotions;
DELETE FROM announcements;
DELETE FROM homepage_elements;
DELETE FROM membership_tiers;


-- ============================================================
-- 1. MEMBERSHIP TIERS
-- ============================================================
INSERT INTO membership_tiers (id, name, point_required, active, created_at) VALUES
('11110000-0000-0000-0000-000000000001', '铜牌会员',    0, true, now()),
('11110000-0000-0000-0000-000000000002', '银牌会员',  500, true, now()),
('11110000-0000-0000-0000-000000000003', '金牌会员', 2000, true, now())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. PRODUCT STOCK (one row per product; P01–P20)
--    P11 (每日坚果什锦) and P16 (精油丰盈洗发乳) are intentionally low-stock
--    to trigger the low-stock alert on the Staff dashboard.
-- ============================================================
INSERT INTO product_stock (id, product_id, count, created_at) VALUES
('99990000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000001', 120, now()),
('99990000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000002',  45, now()),
('99990000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000003',  78, now()),
('99990000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000004',  55, now()),
('99990000-0000-0000-0000-000000000005', 'bbbbbbbb-1111-1111-1111-000000000005',  90, now()),
('99990000-0000-0000-0000-000000000006', 'bbbbbbbb-1111-1111-1111-000000000006',  38, now()),
('99990000-0000-0000-0000-000000000007', 'bbbbbbbb-1111-1111-1111-000000000007',  65, now()),
('99990000-0000-0000-0000-000000000008', 'bbbbbbbb-1111-1111-1111-000000000008',  42, now()),
('99990000-0000-0000-0000-000000000009', 'bbbbbbbb-1111-1111-1111-000000000009',  58, now()),
('99990000-0000-0000-0000-000000000010', 'bbbbbbbb-1111-1111-1111-000000000010', 115, now()),
('99990000-0000-0000-0000-000000000011', 'bbbbbbbb-1111-1111-1111-000000000011',  18, now()),
('99990000-0000-0000-0000-000000000012', 'bbbbbbbb-1111-1111-1111-000000000012',  72, now()),
('99990000-0000-0000-0000-000000000013', 'bbbbbbbb-1111-1111-1111-000000000013',  85, now()),
('99990000-0000-0000-0000-000000000014', 'bbbbbbbb-1111-1111-1111-000000000014',  47, now()),
('99990000-0000-0000-0000-000000000015', 'bbbbbbbb-1111-1111-1111-000000000015',  93, now()),
('99990000-0000-0000-0000-000000000016', 'bbbbbbbb-1111-1111-1111-000000000016',  22, now()),
('99990000-0000-0000-0000-000000000017', 'bbbbbbbb-1111-1111-1111-000000000017',  68, now()),
('99990000-0000-0000-0000-000000000018', 'bbbbbbbb-1111-1111-1111-000000000018', 110, now()),
('99990000-0000-0000-0000-000000000019', 'bbbbbbbb-1111-1111-1111-000000000019',  95, now()),
('99990000-0000-0000-0000-000000000020', 'bbbbbbbb-1111-1111-1111-000000000020',  52, now())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. PROMOTIONS
--    start_date / end_date are timestamptz columns — no ::text cast needed.
--    discount_type must be 'percentage' or 'fixed' (validated by API).
-- ============================================================
INSERT INTO promotions
    (id, name, description, code, discount_type, discount_value,
     start_date, end_date, active, max_uses, uses_count, created_at)
VALUES
('33330000-0000-0000-0000-000000000001',
 '新用户专享优惠',
 '欢迎加入！新注册用户首单享九折优惠，适用于全场零食饮品。',
 'WELCOME10', 'percentage', 10,
 now() - interval '30 days', now() + interval '30 days',
 true, 500, 47,
 now() - interval '30 days'),

('33330000-0000-0000-0000-000000000002',
 '饮品减RM5优惠',
 '购买任意饮品即减RM5，每单限用一次，与其他优惠不可叠加。',
 'BEV2FOR1', 'fixed', 5.00,
 now() - interval '15 days', now() + interval '15 days',
 true, 200, 23,
 now() - interval '15 days'),

('33330000-0000-0000-0000-000000000003',
 '劳动节感恩特惠',
 '五一劳动节全场八五折，感谢每一位辛勤工作的您！限时7天，不容错过。',
 'LABOUR15', 'percentage', 15,
 now() - interval '10 days', now() + interval '5 days',
 true, 300, 89,
 now() - interval '10 days'),

('33330000-0000-0000-0000-000000000004',
 '会员专属折扣',
 '银牌及以上会员尊享九二折专属优惠，回馈忠实顾客，终年有效。',
 'MEMBER8', 'percentage', 8,
 now() - interval '60 days', now() + interval '60 days',
 true, 1000, 34,
 now() - interval '60 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. PROMOTION PRODUCTS
-- ============================================================
-- WELCOME10 → snacks & food (P07–P13)
INSERT INTO promotion_products (promotion_id, product_id) VALUES
('33330000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000007'),
('33330000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000008'),
('33330000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000009'),
('33330000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000010'),
('33330000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000011'),
('33330000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000012'),
('33330000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000013')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- BEV2FOR1 → beverages (P01–P06)
INSERT INTO promotion_products (promotion_id, product_id) VALUES
('33330000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000001'),
('33330000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000002'),
('33330000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000003'),
('33330000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000004'),
('33330000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000005'),
('33330000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000006')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- LABOUR15 → sitewide all 20 products
INSERT INTO promotion_products (promotion_id, product_id) VALUES
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000001'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000002'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000003'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000004'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000005'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000006'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000007'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000008'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000009'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000010'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000011'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000012'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000013'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000014'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000015'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000016'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000017'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000018'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000019'),
('33330000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000020')
ON CONFLICT (promotion_id, product_id) DO NOTHING;

-- MEMBER8 → personal care + household (P14–P20)
INSERT INTO promotion_products (promotion_id, product_id) VALUES
('33330000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000014'),
('33330000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000015'),
('33330000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000016'),
('33330000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000017'),
('33330000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000018'),
('33330000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000019'),
('33330000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000020')
ON CONFLICT (promotion_id, product_id) DO NOTHING;


-- ============================================================
-- 5. ANNOUNCEMENTS
--    starts_at / ends_at are timestamptz — no ::text cast needed.
-- ============================================================
INSERT INTO announcements
    (id, title, message, type, active, image_url, cta_label, cta_url,
     starts_at, ends_at, created_at)
VALUES
('44440000-0000-0000-0000-000000000001',
 '夏季新品上架啦！',
 '多款夏日限定饮品与零食现已上架，购物满RM50即享全国免运费！',
 'promotion', true,
 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800&q=80',
 '立即探索', '/browse',
 now(), now() + interval '14 days',
 now()),

('44440000-0000-0000-0000-000000000002',
 '积分兑换活动开启',
 '您的会员积分现可兑换精美礼品！银牌及以上会员均可参与，机会有限，先到先得。',
 'info', true, NULL,
 '查看积分', '/profile/rewards',
 now() - interval '5 days', now() + interval '10 days',
 now() - interval '5 days'),

('44440000-0000-0000-0000-000000000003',
 '满RM80包邮，限时7天！',
 '即日起至下周日，购物满RM80即可享受全国免运费优惠。别错过了！',
 'promotion', true, NULL,
 '马上购物', '/browse',
 now() - interval '1 day', now() + interval '7 days',
 now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. HOMEPAGE ELEMENTS
--    Note: column names are camelCase ("contentType", "targetId")
-- ============================================================
INSERT INTO homepage_elements
    (id, type, "contentType", "targetId", amount, arrangement, created_at)
VALUES
('55550000-0000-0000-0000-000000000001',
 'posts',    'latest',    NULL,                                   3, 1, now()),
('55550000-0000-0000-0000-000000000002',
 'products', 'category',  'aaaaaaaa-1111-1111-1111-000000000001', 6, 2, now()),
('55550000-0000-0000-0000-000000000003',
 'products', 'category',  'aaaaaaaa-1111-1111-1111-000000000002', 6, 3, now()),
('55550000-0000-0000-0000-000000000004',
 'products', 'promotion', '33330000-0000-0000-0000-000000000003', 4, 4, now())
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. PRODUCT EVENTS (must be inserted BEFORE purchase_orders / reports
--    because both tables have a NOT NULL FK to product_events.id.
--    Inserted with purchase_order_id = NULL / report_id = NULL first,
--    then UPDATEd after the referencing rows exist.)
-- ============================================================
INSERT INTO product_events
    (id, product_id, type, purchase_order_id, report_id, created_at)
VALUES
('66660000-0000-0000-0000-000000000001',
 'bbbbbbbb-1111-1111-1111-000000000001', 'purchase_order', NULL, NULL,
 now() - interval '40 days'),
('66660000-0000-0000-0000-000000000002',
 'bbbbbbbb-1111-1111-1111-000000000007', 'purchase_order', NULL, NULL,
 now() - interval '25 days'),
('66660000-0000-0000-0000-000000000003',
 'bbbbbbbb-1111-1111-1111-000000000010', 'purchase_order', NULL, NULL,
 now() - interval '10 days'),
('66660000-0000-0000-0000-000000000004',
 'bbbbbbbb-1111-1111-1111-000000000016', 'purchase_order', NULL, NULL,
 now() - interval '3 days'),
('66660000-0000-0000-0000-000000000005',
 'bbbbbbbb-1111-1111-1111-000000000011', 'purchase_order', NULL, NULL,
 now() - interval '55 days'),
('66660000-0000-0000-0000-000000000006',
 'bbbbbbbb-1111-1111-1111-000000000011', 'report', NULL, NULL,
 now() - interval '5 days'),
('66660000-0000-0000-0000-000000000007',
 'bbbbbbbb-1111-1111-1111-000000000008', 'report', NULL, NULL,
 now() - interval '12 days'),
('66660000-0000-0000-0000-000000000008',
 'bbbbbbbb-1111-1111-1111-000000000007', 'report', NULL, NULL,
 now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. PRODUCT PURCHASE ORDERS
--    order_date / delivery_date / shipping_date are timestamptz columns.
-- ============================================================
INSERT INTO product_purchase_orders
    (id, product_id, product_event,
     order_no, purchase_order_no, brand,
     order_date, delivery_date, shipping_date,
     delivery_address, salesman_no, terms, status, created_at)
VALUES
('77770000-0000-0000-0000-000000000001',
 'bbbbbbbb-1111-1111-1111-000000000001',
 '66660000-0000-0000-0000-000000000001',
 'ORD-2026-0028', 'PO-CC-2026-03', 'The Coca-Cola Company',
 now() - interval '40 days',
 now() - interval '35 days',
 now() - interval '37 days',
 'ASF Mart Warehouse, Jalan Klang Lama, 58000 Kuala Lumpur',
 'SAL-001', 30, 'delivered',
 now() - interval '40 days'),

('77770000-0000-0000-0000-000000000002',
 'bbbbbbbb-1111-1111-1111-000000000007',
 '66660000-0000-0000-0000-000000000002',
 'ORD-2026-0031', 'PO-NS-2026-04', 'Nongshim',
 now() - interval '25 days',
 now() - interval '20 days',
 now() - interval '22 days',
 'ASF Mart Warehouse, Jalan Klang Lama, 58000 Kuala Lumpur',
 'SAL-002', 30, 'delivered',
 now() - interval '25 days'),

('77770000-0000-0000-0000-000000000003',
 'bbbbbbbb-1111-1111-1111-000000000010',
 '66660000-0000-0000-0000-000000000003',
 'ORD-2026-0044', 'PO-LS-2026-04', 'Frito-Lay',
 now() - interval '10 days',
 now() + interval '5 days',
 now() - interval '7 days',
 'ASF Mart Warehouse, Jalan Klang Lama, 58000 Kuala Lumpur',
 'SAL-001', 30, 'processing',
 now() - interval '10 days'),

('77770000-0000-0000-0000-000000000004',
 'bbbbbbbb-1111-1111-1111-000000000016',
 '66660000-0000-0000-0000-000000000004',
 'ORD-2026-0047', 'PO-SK-2026-04', 'Schwarzkopf',
 now() - interval '3 days',
 now() + interval '10 days',
 NULL,
 'ASF Mart Warehouse, Jalan Klang Lama, 58000 Kuala Lumpur',
 'SAL-003', 45, 'pending',
 now() - interval '3 days'),

('77770000-0000-0000-0000-000000000005',
 'bbbbbbbb-1111-1111-1111-000000000011',
 '66660000-0000-0000-0000-000000000005',
 'ORD-2026-0019', 'PO-PL-2026-03', 'Planters',
 now() - interval '55 days',
 now() - interval '50 days',
 now() - interval '52 days',
 'ASF Mart Warehouse, Jalan Klang Lama, 58000 Kuala Lumpur',
 'SAL-002', 30, 'delivered',
 now() - interval '55 days')
ON CONFLICT (id) DO NOTHING;

-- Link product_events back to purchase orders (nullable FK)
UPDATE product_events SET purchase_order_id = '77770000-0000-0000-0000-000000000001' WHERE id = '66660000-0000-0000-0000-000000000001';
UPDATE product_events SET purchase_order_id = '77770000-0000-0000-0000-000000000002' WHERE id = '66660000-0000-0000-0000-000000000002';
UPDATE product_events SET purchase_order_id = '77770000-0000-0000-0000-000000000003' WHERE id = '66660000-0000-0000-0000-000000000003';
UPDATE product_events SET purchase_order_id = '77770000-0000-0000-0000-000000000004' WHERE id = '66660000-0000-0000-0000-000000000004';
UPDATE product_events SET purchase_order_id = '77770000-0000-0000-0000-000000000005' WHERE id = '66660000-0000-0000-0000-000000000005';


-- ============================================================
-- 9. PURCHASE ORDER ENTRIES
-- ============================================================
INSERT INTO product_purchase_order_entries
    (id, product_purchase_order_id,
     quantity, unit_price, article_no, supplier_article, remarks, set,
     created_at)
VALUES
(gen_random_uuid(), '77770000-0000-0000-0000-000000000001',
 200, 1.50, 'CC-CLASSIC-330', 'COKE-MY-001',
 '330ml cans, 24-pack cartons', 24, now() - interval '40 days'),
(gen_random_uuid(), '77770000-0000-0000-0000-000000000002',
 120, 13.00, 'NS-RAMEN-SP', 'NS-SP-PACK5',
 'Spicy flavour, 5-pack bundles', 5, now() - interval '25 days'),
(gen_random_uuid(), '77770000-0000-0000-0000-000000000003',
 150, 6.50, 'LS-CHIP-OG', 'FL-CHIP-165G',
 'Original flavour, 165g bags', 1, now() - interval '10 days'),
(gen_random_uuid(), '77770000-0000-0000-0000-000000000004',
 60, 22.00, 'SK-SHAMP-250', 'SK-ES-250ML',
 'Essential Oil series, 250ml bottles', 1, now() - interval '3 days'),
(gen_random_uuid(), '77770000-0000-0000-0000-000000000005',
 80, 35.00, 'PL-MIXNUT-200', 'PL-MX-200G',
 'Mixed nuts assortment, 200g resealable bags', 1, now() - interval '55 days');


-- ============================================================
-- 10. PRODUCT REPORTS
-- ============================================================
INSERT INTO product_reports
    (id, product_id, product_event,
     company, department, person_in_charge,
     oc_name, oc_department, reason, status, created_at)
VALUES
('88880000-0000-0000-0000-000000000001',
 'bbbbbbbb-1111-1111-1111-000000000011',
 '66660000-0000-0000-0000-000000000006',
 'ASF Mart Sdn. Bhd.', '库存部', 'Ahmad Farid bin Hassan',
 'Lim Chee Keong', '运营部',
 '每日坚果什锦库存告急，现有18件，低于安全库存阈值（20件）。建议立即提交补货采购单。',
 'submitted', now() - interval '5 days'),

('88880000-0000-0000-0000-000000000002',
 'bbbbbbbb-1111-1111-1111-000000000008',
 '66660000-0000-0000-0000-000000000007',
 'ASF Mart Sdn. Bhd.', '仓储部', 'Rajesh Kumar',
 'Tan Mei Ying', '品控部',
 '最近到货的巧克力大礼包中发现3件包装破损，已进行报废处理，不影响在架库存，建议供应商加强包装标准。',
 'resolved', now() - interval '12 days'),

('88880000-0000-0000-0000-000000000003',
 'bbbbbbbb-1111-1111-1111-000000000007',
 '66660000-0000-0000-0000-000000000008',
 'ASF Mart Sdn. Bhd.', '库存部', 'Ahmad Farid bin Hassan',
 'Lim Chee Keong', '运营部',
 '韩式鲜香辣拉面系统库存显示65件，但实物盘点仅58件，差异7件，疑似记录错误或盗损，请稽查核实。',
 'pending', now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- Link product_events back to reports (nullable FK)
UPDATE product_events SET report_id = '88880000-0000-0000-0000-000000000001' WHERE id = '66660000-0000-0000-0000-000000000006';
UPDATE product_events SET report_id = '88880000-0000-0000-0000-000000000002' WHERE id = '66660000-0000-0000-0000-000000000007';
UPDATE product_events SET report_id = '88880000-0000-0000-0000-000000000003' WHERE id = '66660000-0000-0000-0000-000000000008';


-- ============================================================
-- 11. ORDERS (30 historical orders spread over 30 days)
--
--   User rotation:
--     U01 = 22220000-0000-0000-0000-000000000001  (KL)
--     U02 = 22220000-0000-0000-0000-000000000002  (PJ)
--     U03 = 22220000-0000-0000-0000-000000000003  (Subang)
--
--   Shipping flat rate: RM10.00
--   total_amount in MYR = product subtotal + shipping - discount
--
--   Status:   Pending O-01..03 | Processing O-04..08
--             Shipped O-09..16 | Delivered  O-17..28
--             Cancelled O-29..30
-- ============================================================
INSERT INTO orders
    (id, user_id, status,
     total_amount, shipping_rate,
     discount_amount, promo_code,
     points_earned,
     shipping_address, shipping_address_structured,
     created_at)
VALUES

-- ── Pending ────────────────────────────────────────────────

-- O-01  James  P01×4=10.00 + P10×1=9.90 → 29.90
('aaaa0000-0000-0000-0000-000000000001',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'pending',
 29.90, 10.00, NULL, NULL, 3,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '1 day'),

-- O-02  Sarah  P07×2=37.00 + P13×1=12.00 → 59.00
('aaaa0000-0000-0000-0000-000000000002',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'pending',
 59.00, 10.00, NULL, NULL, 6,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '1 day'),

-- O-03  David  P15×2=25.80 + P18×1=8.50 → 44.30
('aaaa0000-0000-0000-0000-000000000003',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'pending',
 44.30, 10.00, NULL, NULL, 4,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '2 days'),

-- ── Processing ─────────────────────────────────────────────

-- O-04  James  P02×1=45.00 + P03×1=15.90 → 70.90
('aaaa0000-0000-0000-0000-000000000004',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'processing',
 70.90, 10.00, NULL, NULL, 7,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '3 days'),

-- O-05  Sarah  P08×1=39.90 + P09×1=22.90 → 72.80
('aaaa0000-0000-0000-0000-000000000005',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'processing',
 72.80, 10.00, NULL, NULL, 7,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '4 days'),

-- O-06  David  P16×1=32.00 + P14×1=28.50 → 70.50
('aaaa0000-0000-0000-0000-000000000006',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'processing',
 70.50, 10.00, NULL, NULL, 7,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '5 days'),

-- O-07  James  P01×10=25.00 + P05×2=17.00 → sub=42.00, WELCOME10 disc=4.20, total=47.80
('aaaa0000-0000-0000-0000-000000000007',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'processing',
 47.80, 10.00, 4.20, 'WELCOME10', 5,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '6 days'),

-- O-08  Sarah  P11×1=49.00 + P12×2=31.00 → 90.00
('aaaa0000-0000-0000-0000-000000000008',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'processing',
 90.00, 10.00, NULL, NULL, 9,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '8 days'),

-- ── Shipped ────────────────────────────────────────────────

-- O-09  David  P19×2=37.80 + P20×1=14.50 → 62.30
('aaaa0000-0000-0000-0000-000000000009',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 62.30, 10.00, NULL, NULL, 6,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '9 days'),

-- O-10  James  P04×1=12.90 + P06×1=14.00 → 36.90
('aaaa0000-0000-0000-0000-000000000010',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 36.90, 10.00, NULL, NULL, 4,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '10 days'),

-- O-11  Sarah  P07×3=55.50 + P01×5=12.50 → 78.00
('aaaa0000-0000-0000-0000-000000000011',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 78.00, 10.00, NULL, NULL, 8,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '11 days'),

-- O-12  David  P17×1=25.90 + P15×1=12.90 → 48.80
('aaaa0000-0000-0000-0000-000000000012',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 48.80, 10.00, NULL, NULL, 5,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '12 days'),

-- O-13  James  P08×1=39.90 + P10×2=19.80 → 69.70
('aaaa0000-0000-0000-0000-000000000013',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 69.70, 10.00, NULL, NULL, 7,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '13 days'),

-- O-14  Sarah  P02×1=45.00 + P04×2=25.80 → sub=70.80, MEMBER8 disc=5.66, total=75.14
('aaaa0000-0000-0000-0000-000000000014',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 75.14, 10.00, 5.66, 'MEMBER8', 8,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '14 days'),

-- O-15  David  P09×2=45.80 + P13×1=12.00 → 67.80
('aaaa0000-0000-0000-0000-000000000015',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 67.80, 10.00, NULL, NULL, 7,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '15 days'),

-- O-16  James  P16×1=32.00 + P18×3=25.50 → 67.50
('aaaa0000-0000-0000-0000-000000000016',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'shipped',
 67.50, 10.00, NULL, NULL, 7,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '16 days'),

-- ── Delivered ──────────────────────────────────────────────

-- O-17  Sarah  P05×4=34.00 + P12×1=15.50 → 59.50
('aaaa0000-0000-0000-0000-000000000017',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 59.50, 10.00, NULL, NULL, 6,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '17 days'),

-- O-18  David  P03×2=31.80 + P06×1=14.00 → 55.80
('aaaa0000-0000-0000-0000-000000000018',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 55.80, 10.00, NULL, NULL, 6,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '18 days'),

-- O-19  James  P11×1=49.00 + P01×6=15.00 → 74.00
('aaaa0000-0000-0000-0000-000000000019',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 74.00, 10.00, NULL, NULL, 7,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '19 days'),

-- O-20  Sarah  P07×2=37.00 + P10×3=29.70 → 76.70
('aaaa0000-0000-0000-0000-000000000020',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 76.70, 10.00, NULL, NULL, 8,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '20 days'),

-- O-21  David  P08×1=39.90 + P15×1=12.90 → 62.80
('aaaa0000-0000-0000-0000-000000000021',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 62.80, 10.00, NULL, NULL, 6,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '21 days'),

-- O-22  James  P14×1=28.50 + P19×1=18.90 → 57.40
('aaaa0000-0000-0000-0000-000000000022',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 57.40, 10.00, NULL, NULL, 6,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '22 days'),

-- O-23  Sarah  P02×1=45.00 + P06×1=14.00 + P05×1=8.50 → 77.50
('aaaa0000-0000-0000-0000-000000000023',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 77.50, 10.00, NULL, NULL, 8,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '23 days'),

-- O-24  David  P01×3=7.50 + P04×2=25.80 + P05×2=17.00 → sub=50.30, BEV2FOR1 disc=5.00, total=55.30
('aaaa0000-0000-0000-0000-000000000024',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 55.30, 10.00, 5.00, 'BEV2FOR1', 6,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '24 days'),

-- O-25  James  P17×1=25.90 + P20×2=29.00 → 64.90
('aaaa0000-0000-0000-0000-000000000025',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 64.90, 10.00, NULL, NULL, 6,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '25 days'),

-- O-26  Sarah  P09×1=22.90 + P12×2=31.00 + P13×1=12.00 → 75.90
('aaaa0000-0000-0000-0000-000000000026',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 75.90, 10.00, NULL, NULL, 8,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '26 days'),

-- O-27  David  P07×1=18.50 + P08×1=39.90 → 68.40
('aaaa0000-0000-0000-0000-000000000027',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 68.40, 10.00, NULL, NULL, 7,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '27 days'),

-- O-28  James  P03×1=15.90 + P16×1=32.00 + P18×1=8.50 → 66.40
('aaaa0000-0000-0000-0000-000000000028',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'delivered',
 66.40, 10.00, NULL, NULL, 7,
 '12, Jalan Ampang, 50450 Kuala Lumpur, Wilayah Persekutuan',
 '{"address1":"12, Jalan Ampang","address2":"","city":"Kuala Lumpur","state":"Wilayah Persekutuan","postcode":"50450","country":"MY","recipientName":"James Tan","recipientPhone":"+60123456789"}'::jsonb,
 now() - interval '28 days'),

-- ── Cancelled ──────────────────────────────────────────────

-- O-29  Sarah  P11×1=49.00 + P02×1=45.00 → 104.00
('aaaa0000-0000-0000-0000-000000000029',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'cancelled',
 104.00, 10.00, NULL, NULL, 0,
 '28, Jalan SS2/64, 47300 Petaling Jaya, Selangor',
 '{"address1":"28, Jalan SS2/64","address2":"","city":"Petaling Jaya","state":"Selangor","postcode":"47300","country":"MY","recipientName":"Sarah Lim","recipientPhone":"+60187654321"}'::jsonb,
 now() - interval '5 days'),

-- O-30  David  P08×2=79.80 + P07×1=18.50 → 108.30
('aaaa0000-0000-0000-0000-000000000030',
 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e', 'cancelled',
 108.30, 10.00, NULL, NULL, 0,
 '5, Jalan USJ 11/4, 47620 Subang Jaya, Selangor',
 '{"address1":"5, Jalan USJ 11/4","address2":"","city":"Subang Jaya","state":"Selangor","postcode":"47620","country":"MY","recipientName":"David Wong","recipientPhone":"+60111234567"}'::jsonb,
 now() - interval '20 days')

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 12. ORDER ITEMS
-- ============================================================
INSERT INTO order_items (id, order_id, product_id, amount, created_at) VALUES
-- O-01
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000001', 4, now() - interval '1 day'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000001', 'bbbbbbbb-1111-1111-1111-000000000010', 1, now() - interval '1 day'),
-- O-02
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000007', 2, now() - interval '1 day'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000002', 'bbbbbbbb-1111-1111-1111-000000000013', 1, now() - interval '1 day'),
-- O-03
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000015', 2, now() - interval '2 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000003', 'bbbbbbbb-1111-1111-1111-000000000018', 1, now() - interval '2 days'),
-- O-04
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000002', 1, now() - interval '3 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000004', 'bbbbbbbb-1111-1111-1111-000000000003', 1, now() - interval '3 days'),
-- O-05
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000005', 'bbbbbbbb-1111-1111-1111-000000000008', 1, now() - interval '4 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000005', 'bbbbbbbb-1111-1111-1111-000000000009', 1, now() - interval '4 days'),
-- O-06
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000006', 'bbbbbbbb-1111-1111-1111-000000000016', 1, now() - interval '5 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000006', 'bbbbbbbb-1111-1111-1111-000000000014', 1, now() - interval '5 days'),
-- O-07
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000007', 'bbbbbbbb-1111-1111-1111-000000000001', 10, now() - interval '6 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000007', 'bbbbbbbb-1111-1111-1111-000000000005',  2, now() - interval '6 days'),
-- O-08
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000008', 'bbbbbbbb-1111-1111-1111-000000000011', 1, now() - interval '8 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000008', 'bbbbbbbb-1111-1111-1111-000000000012', 2, now() - interval '8 days'),
-- O-09
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000009', 'bbbbbbbb-1111-1111-1111-000000000019', 2, now() - interval '9 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000009', 'bbbbbbbb-1111-1111-1111-000000000020', 1, now() - interval '9 days'),
-- O-10
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000010', 'bbbbbbbb-1111-1111-1111-000000000004', 1, now() - interval '10 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000010', 'bbbbbbbb-1111-1111-1111-000000000006', 1, now() - interval '10 days'),
-- O-11
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000011', 'bbbbbbbb-1111-1111-1111-000000000007', 3, now() - interval '11 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000011', 'bbbbbbbb-1111-1111-1111-000000000001', 5, now() - interval '11 days'),
-- O-12
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000012', 'bbbbbbbb-1111-1111-1111-000000000017', 1, now() - interval '12 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000012', 'bbbbbbbb-1111-1111-1111-000000000015', 1, now() - interval '12 days'),
-- O-13
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000013', 'bbbbbbbb-1111-1111-1111-000000000008', 1, now() - interval '13 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000013', 'bbbbbbbb-1111-1111-1111-000000000010', 2, now() - interval '13 days'),
-- O-14
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000014', 'bbbbbbbb-1111-1111-1111-000000000002', 1, now() - interval '14 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000014', 'bbbbbbbb-1111-1111-1111-000000000004', 2, now() - interval '14 days'),
-- O-15
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000015', 'bbbbbbbb-1111-1111-1111-000000000009', 2, now() - interval '15 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000015', 'bbbbbbbb-1111-1111-1111-000000000013', 1, now() - interval '15 days'),
-- O-16
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000016', 'bbbbbbbb-1111-1111-1111-000000000016', 1, now() - interval '16 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000016', 'bbbbbbbb-1111-1111-1111-000000000018', 3, now() - interval '16 days'),
-- O-17
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000017', 'bbbbbbbb-1111-1111-1111-000000000005', 4, now() - interval '17 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000017', 'bbbbbbbb-1111-1111-1111-000000000012', 1, now() - interval '17 days'),
-- O-18
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000018', 'bbbbbbbb-1111-1111-1111-000000000003', 2, now() - interval '18 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000018', 'bbbbbbbb-1111-1111-1111-000000000006', 1, now() - interval '18 days'),
-- O-19
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000019', 'bbbbbbbb-1111-1111-1111-000000000011', 1, now() - interval '19 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000019', 'bbbbbbbb-1111-1111-1111-000000000001', 6, now() - interval '19 days'),
-- O-20
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000020', 'bbbbbbbb-1111-1111-1111-000000000007', 2, now() - interval '20 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000020', 'bbbbbbbb-1111-1111-1111-000000000010', 3, now() - interval '20 days'),
-- O-21
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000021', 'bbbbbbbb-1111-1111-1111-000000000008', 1, now() - interval '21 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000021', 'bbbbbbbb-1111-1111-1111-000000000015', 1, now() - interval '21 days'),
-- O-22
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000022', 'bbbbbbbb-1111-1111-1111-000000000014', 1, now() - interval '22 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000022', 'bbbbbbbb-1111-1111-1111-000000000019', 1, now() - interval '22 days'),
-- O-23
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000023', 'bbbbbbbb-1111-1111-1111-000000000002', 1, now() - interval '23 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000023', 'bbbbbbbb-1111-1111-1111-000000000006', 1, now() - interval '23 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000023', 'bbbbbbbb-1111-1111-1111-000000000005', 1, now() - interval '23 days'),
-- O-24
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000024', 'bbbbbbbb-1111-1111-1111-000000000001', 3, now() - interval '24 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000024', 'bbbbbbbb-1111-1111-1111-000000000004', 2, now() - interval '24 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000024', 'bbbbbbbb-1111-1111-1111-000000000005', 2, now() - interval '24 days'),
-- O-25
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000025', 'bbbbbbbb-1111-1111-1111-000000000017', 1, now() - interval '25 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000025', 'bbbbbbbb-1111-1111-1111-000000000020', 2, now() - interval '25 days'),
-- O-26
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000026', 'bbbbbbbb-1111-1111-1111-000000000009', 1, now() - interval '26 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000026', 'bbbbbbbb-1111-1111-1111-000000000012', 2, now() - interval '26 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000026', 'bbbbbbbb-1111-1111-1111-000000000013', 1, now() - interval '26 days'),
-- O-27
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000027', 'bbbbbbbb-1111-1111-1111-000000000007', 1, now() - interval '27 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000027', 'bbbbbbbb-1111-1111-1111-000000000008', 1, now() - interval '27 days'),
-- O-28
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000028', 'bbbbbbbb-1111-1111-1111-000000000003', 1, now() - interval '28 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000028', 'bbbbbbbb-1111-1111-1111-000000000016', 1, now() - interval '28 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000028', 'bbbbbbbb-1111-1111-1111-000000000018', 1, now() - interval '28 days'),
-- O-29 (cancelled)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000029', 'bbbbbbbb-1111-1111-1111-000000000011', 1, now() - interval '5 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000029', 'bbbbbbbb-1111-1111-1111-000000000002', 1, now() - interval '5 days'),
-- O-30 (cancelled)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000030', 'bbbbbbbb-1111-1111-1111-000000000008', 2, now() - interval '20 days'),
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000030', 'bbbbbbbb-1111-1111-1111-000000000007', 1, now() - interval '20 days');


-- ============================================================
-- 13. PAYMENTS
--   amount_total / amount_subtotal / amount_shipping / amount_discount
--     all in SEN (MYR × 100) — Stripe convention.
--   status: 'processing' for pending orders, 'succeeded' for the rest,
--           'canceled' for cancelled (Stripe uses single-L spelling).
-- ============================================================
INSERT INTO payments
    (id, order_id, user_id,
     amount_total, amount_subtotal, amount_shipping, amount_discount,
     currency, provider, livemode,
     status, refund_status, refunded_amount, attempt_count,
     payment_method_type,
     email, name, phone,
     stripe_payment_intent_id,
     metadata,
     created_at, updated_at)
VALUES
-- O-01 (pending → processing payment)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000001', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 2990, 1990, 1000, 0, 'myr', 'stripe', false,
 'processing', 'not_refunded', 0, 1,
 NULL, 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000001', '{}'::jsonb, now() - interval '1 day', now() - interval '1 day'),
-- O-02
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000002', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 5900, 4900, 1000, 0, 'myr', 'stripe', false,
 'processing', 'not_refunded', 0, 1,
 NULL, 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000002', '{}'::jsonb, now() - interval '1 day', now() - interval '1 day'),
-- O-03
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000003', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 4430, 3430, 1000, 0, 'myr', 'stripe', false,
 'processing', 'not_refunded', 0, 1,
 NULL, 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000003', '{}'::jsonb, now() - interval '2 days', now() - interval '2 days'),
-- O-04
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000004', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7090, 6090, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000004', '{}'::jsonb, now() - interval '3 days', now() - interval '3 days'),
-- O-05
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000005', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7280, 6280, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000005', '{}'::jsonb, now() - interval '4 days', now() - interval '4 days'),
-- O-06
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000006', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7050, 6050, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000006', '{}'::jsonb, now() - interval '5 days', now() - interval '5 days'),
-- O-07 (WELCOME10: sub=4200, disc=420)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000007', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 4780, 4200, 1000, 420, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000007', '{}'::jsonb, now() - interval '6 days', now() - interval '6 days'),
-- O-08
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000008', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 9000, 8000, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000008', '{}'::jsonb, now() - interval '8 days', now() - interval '8 days'),
-- O-09
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000009', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6230, 5230, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000009', '{}'::jsonb, now() - interval '9 days', now() - interval '9 days'),
-- O-10
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000010', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 3690, 2690, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000010', '{}'::jsonb, now() - interval '10 days', now() - interval '10 days'),
-- O-11
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000011', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7800, 6800, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000011', '{}'::jsonb, now() - interval '11 days', now() - interval '11 days'),
-- O-12
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000012', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 4880, 3880, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000012', '{}'::jsonb, now() - interval '12 days', now() - interval '12 days'),
-- O-13
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000013', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6970, 5970, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000013', '{}'::jsonb, now() - interval '13 days', now() - interval '13 days'),
-- O-14 (MEMBER8: sub=7080, disc=566)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000014', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7514, 7080, 1000, 566, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000014', '{}'::jsonb, now() - interval '14 days', now() - interval '14 days'),
-- O-15
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000015', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6780, 5780, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000015', '{}'::jsonb, now() - interval '15 days', now() - interval '15 days'),
-- O-16
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000016', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6750, 5750, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000016', '{}'::jsonb, now() - interval '16 days', now() - interval '16 days'),
-- O-17
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000017', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 5950, 4950, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000017', '{}'::jsonb, now() - interval '17 days', now() - interval '17 days'),
-- O-18
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000018', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 5580, 4580, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000018', '{}'::jsonb, now() - interval '18 days', now() - interval '18 days'),
-- O-19
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000019', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7400, 6400, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000019', '{}'::jsonb, now() - interval '19 days', now() - interval '19 days'),
-- O-20
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000020', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7670, 6670, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000020', '{}'::jsonb, now() - interval '20 days', now() - interval '20 days'),
-- O-21
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000021', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6280, 5280, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000021', '{}'::jsonb, now() - interval '21 days', now() - interval '21 days'),
-- O-22
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000022', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 5740, 4740, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000022', '{}'::jsonb, now() - interval '22 days', now() - interval '22 days'),
-- O-23
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000023', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7750, 6750, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000023', '{}'::jsonb, now() - interval '23 days', now() - interval '23 days'),
-- O-24 (BEV2FOR1: sub=5030, disc=500)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000024', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 5530, 5030, 1000, 500, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000024', '{}'::jsonb, now() - interval '24 days', now() - interval '24 days'),
-- O-25
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000025', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6490, 5490, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000025', '{}'::jsonb, now() - interval '25 days', now() - interval '25 days'),
-- O-26
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000026', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 7590, 6590, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000026', '{}'::jsonb, now() - interval '26 days', now() - interval '26 days'),
-- O-27
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000027', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6840, 5840, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000027', '{}'::jsonb, now() - interval '27 days', now() - interval '27 days'),
-- O-28
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000028', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 6640, 5640, 1000, 0, 'myr', 'stripe', false,
 'succeeded', 'not_refunded', 0, 1,
 'card', 'james.tan@example.com', 'James Tan', '+60123456789',
 'pi_demo_0000000000000028', '{}'::jsonb, now() - interval '28 days', now() - interval '28 days'),
-- O-29 (cancelled)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000029', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 10400, 9400, 1000, 0, 'myr', 'stripe', false,
 'canceled', 'not_refunded', 0, 1,
 NULL, 'sarah.lim@example.com', 'Sarah Lim', '+60187654321',
 'pi_demo_0000000000000029', '{}'::jsonb, now() - interval '5 days', now() - interval '5 days'),
-- O-30 (cancelled)
(gen_random_uuid(), 'aaaa0000-0000-0000-0000-000000000030', 'dedae3a3-0db7-4c9f-808e-bd1966e6a93e',
 10830, 9830, 1000, 0, 'myr', 'stripe', false,
 'canceled', 'not_refunded', 0, 1,
 NULL, 'david.wong@example.com', 'David Wong', '+60111234567',
 'pi_demo_0000000000000030', '{}'::jsonb, now() - interval '20 days', now() - interval '20 days');


-- ============================================================
-- 14. ORDER STATUS LOGS
--   Timing offsets from order created_at:
--     → pending    : +0 h
--     → processing : +4 h
--     → shipped    : +2 d
--     → delivered  : +5 d
--     → cancelled  : +1 h
-- ============================================================
INSERT INTO order_status_logs
    (id, order_id, old_status, new_status, changed_by, created_at)
VALUES
-- O-01..03 Pending
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000001',NULL,'pending',NULL,now()-interval'1 day'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000002',NULL,'pending',NULL,now()-interval'1 day'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000003',NULL,'pending',NULL,now()-interval'2 days'),
-- O-04..08 Processing
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000004',NULL,'pending',NULL,now()-interval'3 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000004','pending','processing',NULL,now()-interval'3 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000005',NULL,'pending',NULL,now()-interval'4 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000005','pending','processing',NULL,now()-interval'4 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000006',NULL,'pending',NULL,now()-interval'5 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000006','pending','processing',NULL,now()-interval'5 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000007',NULL,'pending',NULL,now()-interval'6 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000007','pending','processing',NULL,now()-interval'6 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000008',NULL,'pending',NULL,now()-interval'8 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000008','pending','processing',NULL,now()-interval'8 days'+interval'4 hours'),
-- O-09..16 Shipped
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000009',NULL,'pending',NULL,now()-interval'9 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000009','pending','processing',NULL,now()-interval'9 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000009','processing','shipped',NULL,now()-interval'7 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000010',NULL,'pending',NULL,now()-interval'10 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000010','pending','processing',NULL,now()-interval'10 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000010','processing','shipped',NULL,now()-interval'8 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000011',NULL,'pending',NULL,now()-interval'11 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000011','pending','processing',NULL,now()-interval'11 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000011','processing','shipped',NULL,now()-interval'9 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000012',NULL,'pending',NULL,now()-interval'12 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000012','pending','processing',NULL,now()-interval'12 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000012','processing','shipped',NULL,now()-interval'10 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000013',NULL,'pending',NULL,now()-interval'13 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000013','pending','processing',NULL,now()-interval'13 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000013','processing','shipped',NULL,now()-interval'11 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000014',NULL,'pending',NULL,now()-interval'14 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000014','pending','processing',NULL,now()-interval'14 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000014','processing','shipped',NULL,now()-interval'12 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000015',NULL,'pending',NULL,now()-interval'15 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000015','pending','processing',NULL,now()-interval'15 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000015','processing','shipped',NULL,now()-interval'13 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000016',NULL,'pending',NULL,now()-interval'16 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000016','pending','processing',NULL,now()-interval'16 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000016','processing','shipped',NULL,now()-interval'14 days'),
-- O-17..28 Delivered
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000017',NULL,'pending',NULL,now()-interval'17 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000017','pending','processing',NULL,now()-interval'17 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000017','processing','shipped',NULL,now()-interval'15 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000017','shipped','delivered',NULL,now()-interval'12 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000018',NULL,'pending',NULL,now()-interval'18 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000018','pending','processing',NULL,now()-interval'18 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000018','processing','shipped',NULL,now()-interval'16 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000018','shipped','delivered',NULL,now()-interval'13 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000019',NULL,'pending',NULL,now()-interval'19 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000019','pending','processing',NULL,now()-interval'19 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000019','processing','shipped',NULL,now()-interval'17 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000019','shipped','delivered',NULL,now()-interval'14 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000020',NULL,'pending',NULL,now()-interval'20 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000020','pending','processing',NULL,now()-interval'20 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000020','processing','shipped',NULL,now()-interval'18 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000020','shipped','delivered',NULL,now()-interval'15 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000021',NULL,'pending',NULL,now()-interval'21 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000021','pending','processing',NULL,now()-interval'21 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000021','processing','shipped',NULL,now()-interval'19 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000021','shipped','delivered',NULL,now()-interval'16 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000022',NULL,'pending',NULL,now()-interval'22 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000022','pending','processing',NULL,now()-interval'22 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000022','processing','shipped',NULL,now()-interval'20 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000022','shipped','delivered',NULL,now()-interval'17 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000023',NULL,'pending',NULL,now()-interval'23 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000023','pending','processing',NULL,now()-interval'23 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000023','processing','shipped',NULL,now()-interval'21 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000023','shipped','delivered',NULL,now()-interval'18 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000024',NULL,'pending',NULL,now()-interval'24 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000024','pending','processing',NULL,now()-interval'24 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000024','processing','shipped',NULL,now()-interval'22 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000024','shipped','delivered',NULL,now()-interval'19 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000025',NULL,'pending',NULL,now()-interval'25 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000025','pending','processing',NULL,now()-interval'25 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000025','processing','shipped',NULL,now()-interval'23 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000025','shipped','delivered',NULL,now()-interval'20 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000026',NULL,'pending',NULL,now()-interval'26 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000026','pending','processing',NULL,now()-interval'26 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000026','processing','shipped',NULL,now()-interval'24 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000026','shipped','delivered',NULL,now()-interval'21 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000027',NULL,'pending',NULL,now()-interval'27 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000027','pending','processing',NULL,now()-interval'27 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000027','processing','shipped',NULL,now()-interval'25 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000027','shipped','delivered',NULL,now()-interval'22 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000028',NULL,'pending',NULL,now()-interval'28 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000028','pending','processing',NULL,now()-interval'28 days'+interval'4 hours'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000028','processing','shipped',NULL,now()-interval'26 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000028','shipped','delivered',NULL,now()-interval'23 days'),
-- O-29..30 Cancelled
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000029',NULL,'pending',NULL,now()-interval'5 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000029','pending','cancelled',NULL,now()-interval'5 days'+interval'1 hour'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000030',NULL,'pending',NULL,now()-interval'20 days'),
(gen_random_uuid(),'aaaa0000-0000-0000-0000-000000000030','pending','cancelled',NULL,now()-interval'20 days'+interval'1 hour');


-- ============================================================
-- 15. SALES LOGS (powers Analytics revenue charts)
--   One row per order-item line for all non-cancelled orders.
-- ============================================================
INSERT INTO sales_logs (id, product_id, price, city, state, created_at) VALUES
-- O-01 KL
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000001', 2.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'1 day'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000010', 9.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'1 day'),
-- O-02 PJ
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000007',18.50,'Petaling Jaya','Selangor',now()-interval'1 day'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000013',12.00,'Petaling Jaya','Selangor',now()-interval'1 day'),
-- O-03 Subang
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000015',12.90,'Subang Jaya','Selangor',now()-interval'2 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000018', 8.50,'Subang Jaya','Selangor',now()-interval'2 days'),
-- O-04
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000002',45.00,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'3 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000003',15.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'3 days'),
-- O-05
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000008',39.90,'Petaling Jaya','Selangor',now()-interval'4 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000009',22.90,'Petaling Jaya','Selangor',now()-interval'4 days'),
-- O-06
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000016',32.00,'Subang Jaya','Selangor',now()-interval'5 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000014',28.50,'Subang Jaya','Selangor',now()-interval'5 days'),
-- O-07
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000001', 2.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'6 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000005', 8.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'6 days'),
-- O-08
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000011',49.00,'Petaling Jaya','Selangor',now()-interval'8 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000012',15.50,'Petaling Jaya','Selangor',now()-interval'8 days'),
-- O-09
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000019',18.90,'Subang Jaya','Selangor',now()-interval'9 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000020',14.50,'Subang Jaya','Selangor',now()-interval'9 days'),
-- O-10
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000004',12.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'10 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000006',14.00,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'10 days'),
-- O-11
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000007',18.50,'Petaling Jaya','Selangor',now()-interval'11 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000001', 2.50,'Petaling Jaya','Selangor',now()-interval'11 days'),
-- O-12
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000017',25.90,'Subang Jaya','Selangor',now()-interval'12 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000015',12.90,'Subang Jaya','Selangor',now()-interval'12 days'),
-- O-13
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000008',39.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'13 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000010', 9.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'13 days'),
-- O-14
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000002',45.00,'Petaling Jaya','Selangor',now()-interval'14 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000004',12.90,'Petaling Jaya','Selangor',now()-interval'14 days'),
-- O-15
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000009',22.90,'Subang Jaya','Selangor',now()-interval'15 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000013',12.00,'Subang Jaya','Selangor',now()-interval'15 days'),
-- O-16
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000016',32.00,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'16 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000018', 8.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'16 days'),
-- O-17
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000005', 8.50,'Petaling Jaya','Selangor',now()-interval'17 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000012',15.50,'Petaling Jaya','Selangor',now()-interval'17 days'),
-- O-18
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000003',15.90,'Subang Jaya','Selangor',now()-interval'18 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000006',14.00,'Subang Jaya','Selangor',now()-interval'18 days'),
-- O-19
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000011',49.00,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'19 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000001', 2.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'19 days'),
-- O-20
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000007',18.50,'Petaling Jaya','Selangor',now()-interval'20 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000010', 9.90,'Petaling Jaya','Selangor',now()-interval'20 days'),
-- O-21
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000008',39.90,'Subang Jaya','Selangor',now()-interval'21 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000015',12.90,'Subang Jaya','Selangor',now()-interval'21 days'),
-- O-22
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000014',28.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'22 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000019',18.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'22 days'),
-- O-23
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000002',45.00,'Petaling Jaya','Selangor',now()-interval'23 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000006',14.00,'Petaling Jaya','Selangor',now()-interval'23 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000005', 8.50,'Petaling Jaya','Selangor',now()-interval'23 days'),
-- O-24
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000001', 2.50,'Subang Jaya','Selangor',now()-interval'24 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000004',12.90,'Subang Jaya','Selangor',now()-interval'24 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000005', 8.50,'Subang Jaya','Selangor',now()-interval'24 days'),
-- O-25
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000017',25.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'25 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000020',14.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'25 days'),
-- O-26
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000009',22.90,'Petaling Jaya','Selangor',now()-interval'26 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000012',15.50,'Petaling Jaya','Selangor',now()-interval'26 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000013',12.00,'Petaling Jaya','Selangor',now()-interval'26 days'),
-- O-27
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000007',18.50,'Subang Jaya','Selangor',now()-interval'27 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000008',39.90,'Subang Jaya','Selangor',now()-interval'27 days'),
-- O-28
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000003',15.90,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'28 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000016',32.00,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'28 days'),
(gen_random_uuid(),'bbbbbbbb-1111-1111-1111-000000000018', 8.50,'Kuala Lumpur','Wilayah Persekutuan',now()-interval'28 days');
-- O-29 and O-30 are cancelled — no sales_log rows.

-- ==============================================================================
-- END OF OPERATIONAL SEED
-- ==============================================================================
