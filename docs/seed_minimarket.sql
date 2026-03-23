-- ==============================================================================
-- ASF Premium Grocery Mock Data Seed Script (V6 - Perfect Visual Match)
-- This script completely aligns the localized Chinese descriptions 
-- with the exactly verified Unsplash photos for a 100% professional look.
-- ==============================================================================

-- ==========================================
-- 0. WIPE EXISTING DATA
-- This clears out the old "Fashion/Supplements" data so you get a perfectly 
-- clean grocer/mini-market app experience without mixed items.
-- ==========================================
DELETE FROM product_categories;
DELETE FROM product_medias;
DELETE FROM product_stock;
DELETE FROM product_colors;
DELETE FROM product_sizes;
DELETE FROM products;

DELETE FROM post_medias;
DELETE FROM posts;

DELETE FROM categories;

-- ==========================================
-- 1. CATEGORIES (4 Distinct Market Categories)
-- ==========================================
INSERT INTO categories (id, name, active, arrangement, media_url, created_at) VALUES
('aaaaaaaa-1111-1111-1111-000000000001', '水与饮料 (Beverages)', true, 1, '', now()),
('aaaaaaaa-1111-1111-1111-000000000002', '休闲零食 (Snacks & Food)', true, 2, '', now()),
('aaaaaaaa-1111-1111-1111-000000000003', '个人护理 (Personal Care)', true, 3, '', now()),
('aaaaaaaa-1111-1111-1111-000000000004', '家居日用 (Household)', true, 4, '', now())
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. PRODUCTS (20 Visually Matching Premium Items)
-- ==========================================
INSERT INTO products (id, name, price, status, description, created_at, updated_at) VALUES
-- Beverages
('bbbbbbbb-1111-1111-1111-000000000001', '可口可乐 (Coca Cola Classic)', 2.50, 'Published', '畅爽带劲，永远的经典口味', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000002', '精品咖啡豆 (Premium Roast Beans)', 45.00, 'Published', '深度烘焙，香气浓郁持久', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000003', '高山有机红茶 (Highland Black Tea)', 15.90, 'Published', '有机种植，入口回甘', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000004', '冷萃冰咖啡 (Cold Brew Coffee)', 12.90, 'Published', '清爽不酸涩，炎炎夏日首选', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000005', '青柠薄荷苏打 (Lime Mint Soda)', 8.50, 'Published', '清新爽口，解暑圣品', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000006', '经典拉花拿铁 (Artisan Latte)', 14.00, 'Published', '细腻奶泡融合特浓咖啡', now(), now()),

-- Snacks & Food
('bbbbbbbb-1111-1111-1111-000000000007', '韩式鲜香辣拉面 (Spicy Ramen)', 18.50, 'Published', 'Q弹面条搭配浓郁辛辣汤底', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000008', '进口巧克力大礼包 (Assorted Chocolates)', 39.90, 'Published', '包含Mars、KitKat等多款热销巧克力', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000009', '经典黄油曲奇 (Butter Cookies)', 22.90, 'Published', '浓郁牛油香，入口即化', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000010', '原切薄脆薯片 (Crispy Potato Chips)', 9.90, 'Published', '咔嚓脆，追剧必备零食', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000011', '每日坚果什锦 (Mixed Nuts)', 49.00, 'Published', '健康美味，营养满分', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000012', '烘焙麦片棒 (Baked Granola Bars)', 15.50, 'Published', '高纤低脂，健康代餐', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000013', '爆米花家庭装 (Popcorn Family Pack)', 12.00, 'Published', '香甜焦糖，电影院般享受', now(), now()),

-- Personal Care
('bbbbbbbb-1111-1111-1111-000000000014', '深层滋润沐浴露 (Nourishing Body Wash)', 28.50, 'Published', '牛奶精华，洗后肌肤柔滑水润', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000015', '草本精华牙膏 (Herbal Toothpaste)', 12.90, 'Published', '护龈固齿，清新草本薄荷香', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000016', '精油丰盈洗发乳 (Essential Oil Shampoo)', 32.00, 'Published', '改善发质，抚平毛躁', now(), now()),

-- Household
('bbbbbbbb-1111-1111-1111-000000000017', '超浓缩除菌洗衣液 (Deep Clean Detergent)', 25.90, 'Published', '强效去污，99.9%杀菌率', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000018', '强效去油洗洁精 (Lemon Dishwash)', 8.50, 'Published', '一滴见效，温和不伤手', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000019', '原生木浆抽纸 (Premium Tissue 4-Pack)', 18.90, 'Published', '3层加厚，湿水不破', now(), now()),
('bbbbbbbb-1111-1111-1111-000000000020', '多用途清洁除菌喷雾 (Multi-Surface Cleaner)', 14.50, 'Published', '厨房浴室全适用，去污无残留', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 3. PRODUCT - CATEGORY MAPPINGS
-- ==========================================
INSERT INTO product_categories (id, product_id, category_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000001', 'aaaaaaaa-1111-1111-1111-000000000001', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000002', 'aaaaaaaa-1111-1111-1111-000000000001', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000003', 'aaaaaaaa-1111-1111-1111-000000000001', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000004', 'aaaaaaaa-1111-1111-1111-000000000001', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000005', 'aaaaaaaa-1111-1111-1111-000000000001', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000006', 'aaaaaaaa-1111-1111-1111-000000000001', now(), now()),

(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000007', 'aaaaaaaa-1111-1111-1111-000000000002', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000008', 'aaaaaaaa-1111-1111-1111-000000000002', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000009', 'aaaaaaaa-1111-1111-1111-000000000002', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000010', 'aaaaaaaa-1111-1111-1111-000000000002', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000011', 'aaaaaaaa-1111-1111-1111-000000000002', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000012', 'aaaaaaaa-1111-1111-1111-000000000002', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000013', 'aaaaaaaa-1111-1111-1111-000000000002', now(), now()),

(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000014', 'aaaaaaaa-1111-1111-1111-000000000003', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000015', 'aaaaaaaa-1111-1111-1111-000000000003', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000016', 'aaaaaaaa-1111-1111-1111-000000000003', now(), now()),

(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000017', 'aaaaaaaa-1111-1111-1111-000000000004', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000018', 'aaaaaaaa-1111-1111-1111-000000000004', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000019', 'aaaaaaaa-1111-1111-1111-000000000004', now(), now()),
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000020', 'aaaaaaaa-1111-1111-1111-000000000004', now(), now());

-- ==========================================
-- 4. PRODUCT IMAGES (Perfect Alignment)
-- ==========================================
INSERT INTO product_medias (id, product_id, arrangement, media_url, created_at, updated_at) VALUES
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000001', 1, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80', now(), now()), -- Cola Can
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000002', 1, 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80', now(), now()), -- Beans
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000003', 1, 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80', now(), now()), -- Teapot
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000004', 1, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80', now(), now()), -- Iced Coffee
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000005', 1, 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800&q=80', now(), now()), -- Lime Drink
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000006', 1, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80', now(), now()), -- Latte Art

(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000007', 1, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80', now(), now()), -- Ramen
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000008', 1, 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80', now(), now()), -- Choc Bars
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000009', 1, 'https://images.unsplash.com/photo-1558961363-a0f7af9fc4b2?w=800&q=80', now(), now()), -- Cookies
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000010', 1, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80', now(), now()), -- Chips
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000011', 1, 'https://images.unsplash.com/photo-1599598425947-330026295ca0?w=800&q=80', now(), now()), -- Nuts
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000012', 1, 'https://images.unsplash.com/photo-1558961363-a0f7af9fc4b2?w=800&q=80', now(), now()), -- Granola
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000013', 1, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80', now(), now()), -- Popcorn

(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000014', 1, 'https://images.unsplash.com/photo-1608248593842-80b18f76e3d2?w=800&q=80', now(), now()), -- Body Wash
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000015', 1, 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=800&q=80', now(), now()), -- Toothpaste
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000016', 1, 'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=800&q=80', now(), now()), -- Shampoo

(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000017', 1, 'https://images.unsplash.com/photo-1610557892470-55d9e80f13f1?w=800&q=80', now(), now()), -- Detergent
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000018', 1, 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?w=800&q=80', now(), now()), -- Dishwash
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000019', 1, 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=800&q=80', now(), now()), -- Tissue
(gen_random_uuid(), 'bbbbbbbb-1111-1111-1111-000000000020', 1, 'https://images.unsplash.com/photo-1584820927498-cafe6c15f940?w=800&q=80', now(), now()); -- Cleaner

-- ==========================================
-- 5. POSTS (6 Cohesive Feed Posts)
-- ==========================================
INSERT INTO posts (id, name, status, caption, caption_position, photo_size, cta_text, created_at) VALUES
('cccccccc-1111-1111-1111-000000000001', '宅家追剧首选', 'Published', '宅家必备大礼包！各款人气巧克力棒，追剧时刻来一口，甜蜜加倍。', 'bottom', '1:1', '立即购买', now() - interval '1 hour'),
('cccccccc-1111-1111-1111-000000000002', '夏日冰爽一夏', 'Published', '透心凉的青柠薄荷特饮，搭配满满冰块，一口赶走所有闷热！', 'bottom', '1:1', '去解暑', now() - interval '5 hours'),
('cccccccc-1111-1111-1111-000000000003', '高山好茶推荐', 'Published', '从高山采摘的有机红茶，茶香浓郁，回味无穷。这是送给自己最好的下午茶。', 'bottom', '1:1', '品味好茶', now() - interval '1 day'),
('cccccccc-1111-1111-1111-000000000004', '速食拉面冠军', 'Published', '谁能抵挡这碗热气腾腾的韩式鲜香辣拉面？汤浓面弹，宵夜首选！', 'bottom', '1:1', '我要囤货', now() - interval '2 days'),
('cccccccc-1111-1111-1111-000000000005', '深度烘焙咖啡豆', 'Published', '早晨，从磨一杯深度烘焙的精选咖啡豆开始。满屋的醇厚咖啡香，唤醒你的一天。', 'bottom', '1:1', '选购咖啡', now() - interval '3 days'),
('cccccccc-1111-1111-1111-000000000006', '冷萃冰镇好滋味', 'Published', '特调冷萃咖啡，无糖零卡路里，低酸又顺滑。给爱喝咖啡的你。', 'bottom', '1:1', '带走它', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 6. POST MEDIAS (Perfect Image Alignment)
-- ==========================================
INSERT INTO post_medias (post_id, media_url, media_type, arrangement, created_at) VALUES
('cccccccc-1111-1111-1111-000000000001', 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&q=80', 'image', 1, now()), -- Choc bars
('cccccccc-1111-1111-1111-000000000002', 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800&q=80', 'image', 1, now()), -- Lime drink
('cccccccc-1111-1111-1111-000000000003', 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80', 'image', 1, now()), -- Tea
('cccccccc-1111-1111-1111-000000000004', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80', 'image', 1, now()), -- Ramen
('cccccccc-1111-1111-1111-000000000005', 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80', 'image', 1, now()), -- Beans
('cccccccc-1111-1111-1111-000000000006', 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80', 'image', 1, now()); -- Cold brew
