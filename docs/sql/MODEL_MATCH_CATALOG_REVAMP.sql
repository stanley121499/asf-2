-- =============================================================================
-- MODEL MATCH Catalog Content Revamp (2026-07-17)
-- Project: gswszoljvafugtdikimn
-- Idempotent-ish UPDATEs — re-run safe for demo catalog UUIDs.
-- Translations: see CUSTOMER_I18N_SEED_EN.sql / CUSTOMER_I18N_SEED_MS.sql (Section F)
-- =============================================================================

-- =============================================================================
-- SECTION A — Promotions retheme (Agent 1)
-- Codes: WELCOME15, MODEL10, MEMBER20, KICKS12 (percentage 12 — not KICKS50)
-- NOTE: `promotions.name` / `description` stay Chinese-canonical (no promotion_translations
-- table). Expo HomeOffersStrip shows code-centric titles for en/ms; discount lines use i18n.
-- =============================================================================

UPDATE promotions SET
  name = '新会员首单 15%',
  description = '欢迎加入 MODEL MATCH！新会员首单享全场 15% 优惠，开启你的鞋履旅程。',
  code = 'WELCOME15',
  discount_type = 'percentage',
  discount_value = 15,
  start_date = NOW() - interval '1 day',
  end_date = '2026-12-31 23:59:59+00',
  active = true,
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000001';

UPDATE promotions SET
  name = 'MODEL MATCH 全场 10%',
  description = '全场鞋履与配件立减 10%，展现你的风格态度。',
  code = 'MODEL10',
  discount_type = 'percentage',
  discount_value = 10,
  start_date = NOW() - interval '1 day',
  end_date = '2026-12-31 23:59:59+00',
  active = true,
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000002';

UPDATE promotions SET
  name = '会员专属减 RM20',
  description = 'MODEL MATCH 会员专属立减 RM20，感谢你的支持。',
  code = 'MEMBER20',
  discount_type = 'fixed',
  discount_value = 20,
  start_date = NOW() - interval '1 day',
  end_date = '2026-12-31 23:59:59+00',
  active = true,
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000003';

-- KICKS12: percentage 12 (chosen over KICKS50 fixed 50)
UPDATE promotions SET
  name = '球鞋季特惠 12%',
  description = '球鞋与街头系列限时 12% off，把新季灵感穿在脚上。',
  code = 'KICKS12',
  discount_type = 'percentage',
  discount_value = 12,
  start_date = NOW() - interval '1 day',
  end_date = '2026-12-31 23:59:59+00',
  active = true,
  deleted_at = NULL
WHERE id = '33330000-0000-0000-0000-000000000004';

-- =============================================================================
-- SECTION B — Categories + products + product_categories (Agent 2)
-- =============================================================================

UPDATE categories SET name = '运动鞋 (Sneakers)' WHERE id = 'aaaaaaaa-1111-1111-1111-000000000001';
UPDATE categories SET name = '皮鞋与靴 (Formal & Boots)' WHERE id = 'aaaaaaaa-1111-1111-1111-000000000002';
UPDATE categories SET name = '配件 (Accessories)' WHERE id = 'aaaaaaaa-1111-1111-1111-000000000003';
UPDATE categories SET name = '鞋类护理 (Shoe Care)' WHERE id = 'aaaaaaaa-1111-1111-1111-000000000004';

UPDATE products SET name = '经典白网球鞋 (Classic Court Sneaker)', description = '干净线条与透气鞋面，日常百搭的球场经典。', price = 199 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000001';
UPDATE products SET name = '城市跑鞋 (Urban Runner)', description = '轻量缓震，适合都市通勤与轻松节奏。', price = 259 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000002';
UPDATE products SET name = '夜色街头高帮 (Night Street High-Top)', description = '暗色调高帮轮廓，夜间街头更有存在感。', price = 299 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000003';
UPDATE products SET name = '极简皮革德比鞋 (Minimal Leather Derby)', description = '利落德比剪裁，办公与晚宴皆可驾驭。', price = 349 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000004';
UPDATE products SET name = '黑色切尔西靴 (Black Chelsea Boot)', description = '弹力侧带切尔西靴，一脚蹬出利落气场。', price = 399 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000005';
UPDATE products SET name = '徒步登山中帮 (Trail Hiker Mid)', description = '抓地中帮设计，周末步道与轻徒步首选。', price = 329 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000006';
UPDATE products SET name = '柔软针织一脚蹬 (Soft Knit Slip-On)', description = '袜套般贴合感，轻松出行不费力。', price = 179 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000007';
UPDATE products SET name = '复古球场低帮 (Retro Court Low)', description = '复古配色低帮，致敬经典球场美学。', price = 219 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000008';
UPDATE products SET name = '厚底凉鞋 (Platform Sandal)', description = '轻盈厚底凉鞋，夏日造型更显比例。', price = 159 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000009';
UPDATE products SET name = '便士乐福鞋 (Penny Loafer)', description = '经典便士乐福，休闲正装自由切换。', price = 279 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000010';
UPDATE products SET name = '厚底老爹鞋 (Chunky Dad Sneaker)', description = '夸张鞋底与复古廓形，街头层叠穿搭利器。', price = 249 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000011';
UPDATE products SET name = '性能训练鞋 (Performance Trainer)', description = '多向支撑训练鞋，健身房与日常皆适用。', price = 289 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000012';
UPDATE products SET name = '麂皮短靴 (Suede Ankle Boot)', description = '柔软麂皮质感，秋季造型层次感满分。', price = 369 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000013';
UPDATE products SET name = '经典帆布低帮 (Canvas Low Classic)', description = '轻便帆布低帮，永远不过时的日常款。', price = 149 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000014';
UPDATE products SET name = '袜套跑鞋 (Sock Runner)', description = '一体袜套鞋领，贴合脚步更轻盈。', price = 199 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000015';
UPDATE products SET name = '真皮腰带 (Leather Belt)', description = '简约真皮腰带，收束整体穿搭细节。', price = 89 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000016';
UPDATE products SET name = '船员袜三双装 (Crew Socks 3-Pack)', description = '舒适中筒袜三双装，日常轮换更安心。', price = 39 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000017';
UPDATE products SET name = '鞋类护理套装 (Shoe Care Kit)', description = '清洁、护理、抛光一站式，延长鞋履寿命。', price = 59 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000018';
UPDATE products SET name = '迷你斜挎包 (Mini Crossbody)', description = '轻巧斜挎，解放双手也能完成造型。', price = 129 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000019';
UPDATE products SET name = '品牌棒球帽 (Logo Cap)', description = '经典棒球帽廓形，轻松点亮 MODEL MATCH 态度。', price = 79 WHERE id = 'bbbbbbbb-1111-1111-1111-000000000020';

-- Remap product_categories (sneakers / formal-boots / accessories / shoe-care)
DELETE FROM product_categories
WHERE product_id IN (
  SELECT id FROM products WHERE id::text LIKE 'bbbbbbbb-1111-1111-1111-0000000000%'
);

INSERT INTO product_categories (product_id, category_id) VALUES
  ('bbbbbbbb-1111-1111-1111-000000000001', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000002', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000003', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000004', 'aaaaaaaa-1111-1111-1111-000000000002'),
  ('bbbbbbbb-1111-1111-1111-000000000005', 'aaaaaaaa-1111-1111-1111-000000000002'),
  ('bbbbbbbb-1111-1111-1111-000000000006', 'aaaaaaaa-1111-1111-1111-000000000002'),
  ('bbbbbbbb-1111-1111-1111-000000000007', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000008', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000009', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000010', 'aaaaaaaa-1111-1111-1111-000000000002'),
  ('bbbbbbbb-1111-1111-1111-000000000011', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000012', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000013', 'aaaaaaaa-1111-1111-1111-000000000002'),
  ('bbbbbbbb-1111-1111-1111-000000000014', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000015', 'aaaaaaaa-1111-1111-1111-000000000001'),
  ('bbbbbbbb-1111-1111-1111-000000000016', 'aaaaaaaa-1111-1111-1111-000000000003'),
  ('bbbbbbbb-1111-1111-1111-000000000017', 'aaaaaaaa-1111-1111-1111-000000000003'),
  ('bbbbbbbb-1111-1111-1111-000000000018', 'aaaaaaaa-1111-1111-1111-000000000004'),
  ('bbbbbbbb-1111-1111-1111-000000000019', 'aaaaaaaa-1111-1111-1111-000000000003'),
  ('bbbbbbbb-1111-1111-1111-000000000020', 'aaaaaaaa-1111-1111-1111-000000000003');

-- =============================================================================
-- SECTION C — Product images 001–010 (Agent 3)
-- Each URL: HTTP 200 + visual footwear/lifestyle check before apply
-- =============================================================================

-- verified 2026-07-17 http=200 ok — classic court / AF1 lifestyle
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000001';

-- verified 2026-07-17 http=200 ok — urban runner / Nike Free
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000002';

-- verified 2026-07-17 http=200 ok — night street high-top / AJ1
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000003';

-- verified 2026-07-17 http=200 ok — minimal leather derby
UPDATE product_medias SET media_url = 'https://images.pexels.com/photos/292999/pexels-photo-292999.jpeg?auto=compress&cs=tinysrgb&w=1200', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000004';

-- verified 2026-07-17 http=200 ok — black chelsea / service boot
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000005';

-- verified 2026-07-17 http=200 ok — trail hiker mid / outdoor boots
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000006';

-- verified 2026-07-17 http=200 ok — soft knit / athletic slip-on vibe
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000007';

-- verified 2026-07-17 http=200 ok — retro court low / pastel AF1
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000008';

-- verified 2026-07-17 http=200 ok — platform sandal / Arizona-style
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000009';

-- verified 2026-07-17 http=200 ok — penny loafer / bit loafers
UPDATE product_medias SET media_url = 'https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=1200', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000010';

-- =============================================================================
-- SECTION D — Product images 011–020 (Agent 4)
-- Must not reuse any URL from Section C
-- =============================================================================

-- verified 2026-07-17 http=200 ok — chunky dad sneaker
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000011';

-- verified 2026-07-17 http=200 ok — performance trainer
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000012';

-- verified 2026-07-17 http=200 ok — suede ankle / chukka boot
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000013';

-- verified 2026-07-17 http=200 ok — canvas low classic
UPDATE product_medias SET media_url = 'https://images.pexels.com/photos/1240892/pexels-photo-1240892.jpeg?auto=compress&cs=tinysrgb&w=1200', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000014';

-- verified 2026-07-17 http=200 ok — sock runner
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000015';

-- verified 2026-07-17 http=200 ok — leather belt
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1664286074176-5206ee5dc878?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000016';

-- verified 2026-07-17 http=200 ok — crew socks display
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1727498830440-339a797d8423?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000017';

-- verified 2026-07-17 http=200 ok — shoe care kit / polish + brush
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1636262899511-dc5865c774dc?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000018';

-- verified 2026-07-17 http=200 ok — mini crossbody / messenger
UPDATE product_medias SET media_url = 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1200', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000019';

-- verified 2026-07-17 http=200 ok — logo / dad cap
UPDATE product_medias SET media_url = 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80', updated_at = NOW()
WHERE product_id = 'bbbbbbbb-1111-1111-1111-000000000020';

-- =============================================================================
-- SECTION E — Posts captions + post images (Agent 5)
-- Hero: post …001 (新季球场经典) bumped to NOW() so home hero uses it
-- Post media URLs are unique and not reused from product_medias
-- =============================================================================

UPDATE posts SET
  name = '新季球场经典',
  caption = '新季球场系列已上线。干净白鞋与利落线条，把日常走成主场。',
  cta_text = '立即选购'
WHERE id = 'cccccccc-1111-1111-1111-000000000001';

UPDATE posts SET
  name = '夜色高帮',
  caption = '城市入夜，高帮轮廓更醒目。跟 MODEL MATCH 一起走在光影之间。',
  cta_text = '探索系列'
WHERE id = 'cccccccc-1111-1111-1111-000000000002';

UPDATE posts SET
  name = '切尔西靴特辑',
  caption = '弹力侧带、利落鞋型——一双切尔西靴，完成从会议到周末的切换。',
  cta_text = '查看靴子'
WHERE id = 'cccccccc-1111-1111-1111-000000000003';

UPDATE posts SET
  name = '步道周末',
  caption = '抓地中帮与透气层次，把周末步道走成轻徒步仪式感。',
  cta_text = '准备出发'
WHERE id = 'cccccccc-1111-1111-1111-000000000004';

UPDATE posts SET
  name = '配件点睛',
  caption = '腰带、斜挎与帽子——小配件收束整体造型，态度更完整。',
  cta_text = '选购配件'
WHERE id = 'cccccccc-1111-1111-1111-000000000005';

UPDATE posts SET
  name = '护理仪式',
  caption = '刷子、护理乳、鞋撑——把心爱球鞋保养成下一季的主角。',
  cta_text = '了解护理'
WHERE id = 'cccccccc-1111-1111-1111-000000000006';

-- verified 2026-07-17 http=200 ok — court / rooftop lifestyle (HERO)
UPDATE post_medias SET media_url = 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80'
WHERE post_id = 'cccccccc-1111-1111-1111-000000000001';

-- verified 2026-07-17 http=200 ok — night city / glowing blue sneaker
UPDATE post_medias SET media_url = 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=1200&q=80'
WHERE post_id = 'cccccccc-1111-1111-1111-000000000002';

-- verified 2026-07-17 http=200 ok — chelsea / hanging boots editorial
UPDATE post_medias SET media_url = 'https://images.unsplash.com/photo-1605812860427-4024433a70fd?auto=format&fit=crop&w=1200&q=80'
WHERE post_id = 'cccccccc-1111-1111-1111-000000000003';

-- verified 2026-07-17 http=200 ok — trail weekend outdoor sneakers
UPDATE post_medias SET media_url = 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80'
WHERE post_id = 'cccccccc-1111-1111-1111-000000000004';

-- verified 2026-07-17 http=200 ok — accessories / structured bag
UPDATE post_medias SET media_url = 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80'
WHERE post_id = 'cccccccc-1111-1111-1111-000000000005';

-- verified 2026-07-17 http=200 ok — care ritual / clean whites
UPDATE post_medias SET media_url = 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=1200&q=80'
WHERE post_id = 'cccccccc-1111-1111-1111-000000000006';

-- Hero tip: newest created_at wins on home
UPDATE posts SET created_at = NOW() WHERE id = 'cccccccc-1111-1111-1111-000000000001';

-- =============================================================================
-- SECTION F — Translations source of truth
-- Apply / re-apply via:
--   docs/sql/CUSTOMER_I18N_SEED_EN.sql
--   docs/sql/CUSTOMER_I18N_SEED_MS.sql
-- (category / product / post rows updated for MODEL MATCH)
-- =============================================================================
