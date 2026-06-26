# ASF Mart Demo Data — Agent Prompts

**Purpose**: Pass each prompt below to a separate Cursor agent (Gemini 3.1 Pro High).
Each prompt is fully self-contained — the agent has all the context it needs.

---

## Execution Order

```
Agent 1A (Image Sourcing: products 01–27) ──┐
                                             ├── Run BOTH in parallel
Agent 1B (Image Sourcing: products 28–54) ──┘
                    │
                    │  Both must finish before Agent 2 starts
                    ▼
         Agent 2 (SQL Part 1: Catalogue)
                    │
                    │  Must finish before Agent 3 starts
                    ▼
         Agent 3 (SQL Part 2: Commerce + Orders)
```

| Agents | Parallel? |
|--------|-----------|
| 1A + 1B | ✅ Yes — completely independent |
| Agent 2 | ❌ After both 1A + 1B complete |
| Agent 3 | ❌ After Agent 2 completes |

---

---

# AGENT 1A — Image Sourcing (Products eeeeee01–eeeeee27)

## Objective
Find the actual product image URL for each of the 27 Malaysian minimart products assigned to you.
Use Lazada Malaysia as the primary source. Each product must have its OWN specific image — no
sharing the same URL between different products. A client must be able to look at the image and
recognise "that's Milo UHT" or "that's Maggi Mee Goreng" — not just a generic photo.

## How to Search

1. Open https://www.lazada.com.my in the browser tool.
2. For each product, type the **English Search Term** into the Lazada search bar and press Enter.
3. Click on the most relevant product listing (the actual branded product, not a multi-pack reseller).
4. On the product page, take a screenshot or snapshot to see the main product image.
5. Get the image URL. The URL will be from Lazada's CDN, looking like:
   `https://img.lazcdn.com/g/ff/kf/Sxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.jpg_800x800q80.jpg`
   or similar. Right-click the image in the snapshot and copy the src attribute.
6. If you can only see a lower-resolution URL like `_400x400q75`, try replacing it with
   `_800x800q80` for better quality. If that breaks, use the original.

## Fallback (if not on Lazada)
If a product is not found on Lazada Malaysia, try Shopee Malaysia (https://shopee.com.my)
with the same search term.

If not found on Shopee either, use the appropriate category-level Unsplash fallback:
- Beverages: `https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80`
- Instant Food: `https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80`
- Snacks: `https://images.unsplash.com/photo-1478144592103-25e218a04891?w=800&q=80`

## Products to Source (your 27 products)

### Category: 饮料 (Beverages)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee01-0000-0000-0000-000000000001 | 美禄 UHT 麦芽饮料 200ml | Milo UHT 200ml |
| eeeeee02-0000-0000-0000-000000000001 | 美禄罐装麦芽饮料 240ml | Milo can 240ml |
| eeeeee03-0000-0000-0000-000000000001 | 雀巢咖啡三合一原味 25条装 | Nescafe 3in1 original 25 sticks |
| eeeeee04-0000-0000-0000-000000000001 | 诗杜嘉天然矿泉水 1.5L | Spritzer mineral water 1.5L |
| eeeeee05-0000-0000-0000-000000000001 | 百加得等渗饮料罐 325ml | 100Plus isotonic 325ml |
| eeeeee06-0000-0000-0000-000000000001 | 清泉水蜜桃茶 250ml | Seasons peach tea 250ml |
| eeeeee07-0000-0000-0000-000000000001 | F&N 橙汁汽水 1.5L | F&N orange soda 1.5L |
| eeeeee08-0000-0000-0000-000000000001 | 宝加茉莉绿茶 500ml | Pokka jasmine green tea 500ml |
| eeeeee09-0000-0000-0000-000000000001 | 红牛能量饮料 250ml | Red Bull energy drink 250ml |
| eeeeee10-0000-0000-0000-000000000001 | 荷兰牛牌全脂牛奶 1L | Dutch Lady full cream milk 1L |
| eeeeee11-0000-0000-0000-000000000001 | 万花筒 UHT 朱古力牛奶 250ml | Marigold UHT chocolate milk 250ml |
| eeeeee12-0000-0000-0000-000000000001 | 杨协成菊花茶 300ml | Yeo's chrysanthemum tea 300ml |

### Category: 速食 (Instant Food)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee13-0000-0000-0000-000000000001 | 美极炒面 5包装 | Maggi Mee Goreng 5 pack |
| eeeeee14-0000-0000-0000-000000000001 | 美极亚参叻沙面 5包装 | Maggi Asam Laksa 5 pack |
| eeeeee15-0000-0000-0000-000000000001 | 妈咪厨师冬炎汤面 5包装 | Mamee Chef Tom Yam 5 pack |
| eeeeee16-0000-0000-0000-000000000001 | 新丁牌咖喱面 5包装 | Cintan curry noodle 5 pack |
| eeeeee17-0000-0000-0000-000000000001 | 槟城白咖喱面 | MyKuali Penang white curry noodle |
| eeeeee18-0000-0000-0000-000000000001 | 亚达比即溶米粥 | Adabi instant rice porridge |
| eeeeee19-0000-0000-0000-000000000001 | 鸡牌番茄沙丁鱼罐头 425g | Ayam Brand sardines tomato sauce 425g |
| eeeeee20-0000-0000-0000-000000000001 | 美极香浓鸡肉杯面 | Maggi rich chicken cup noodle |

### Category: 零食饼干 (Snacks — first 7)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee21-0000-0000-0000-000000000001 | 滋士芝士味薯条 65g | Twisties cheese 65g |
| eeeeee22-0000-0000-0000-000000000001 | 薯先生原味薯片 65g | Mister Potato original chips 65g |
| eeeeee23-0000-0000-0000-000000000001 | 杰仁吉虾片 60g | Jack n Jill prawn crackers 60g |
| eeeeee24-0000-0000-0000-000000000001 | 妈咪怪兽面零食 25g | Mamee Monster noodle snack 25g |
| eeeeee25-0000-0000-0000-000000000001 | 奇宝原味朱古力曲奇 | Chipsmore chocolate chip cookies |
| eeeeee26-0000-0000-0000-000000000001 | 明奇力士奶油夹心饼干 | Munchy's Lexus cream sandwich biscuit |
| eeeeee27-0000-0000-0000-000000000001 | 尼布斯什锦糖果 150g | Nips assorted candy 150g |

## Output

Write results to: `E:/Dev/GitHub/asf-2/docs/images_part1.md`

Use exactly this format (Agent 2 will parse this file):

```markdown
# Product Image URLs — Part 1 (eeeeee01–eeeeee27)

| Product UUID | Chinese Name | Image URL | Source |
|---|---|---|---|
| eeeeee01-0000-0000-0000-000000000001 | 美禄 UHT 麦芽饮料 200ml | https://img.lazcdn.com/... | lazada.com.my |
| eeeeee02-0000-0000-0000-000000000001 | 美禄罐装麦芽饮料 240ml | https://img.lazcdn.com/... | lazada.com.my |
...all 27 rows...
```

Every product must have an image URL. Do not leave any row blank.
Note in the Source column if you used Shopee or Unsplash fallback.

---

---

# AGENT 1B — Image Sourcing (Products eeeeee28–eeeeee54)

## Objective
Same goal as Agent 1A — find the actual product image URL for each of your 27 products
via Lazada Malaysia. Each product must have its OWN specific image.

## How to Search
Same instructions as Agent 1A:
1. Open https://www.lazada.com.my
2. Search using the English search term
3. Click the most relevant listing
4. Extract the CDN image URL from the product page
5. Try to get `_800x800q80` quality if possible

## Fallback (if not on Lazada)
Same as Agent 1A — try Shopee, then Unsplash category fallback:
- Snacks: `https://images.unsplash.com/photo-1478144592103-25e218a04891?w=800&q=80`
- Personal Care: `https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80`
- Household: `https://images.unsplash.com/photo-1585687433141-9b3d0b8d7d0b?w=800&q=80`
- Dairy: `https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80`
- Bread: `https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80`

## Products to Source (your 27 products)

### Category: 零食饼干 (Snacks — last 3)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee28-0000-0000-0000-000000000001 | 姐妹品牌蛋卷 100g | Julie's Love Letters egg roll 100g |
| eeeeee29-0000-0000-0000-000000000001 | 合成乒乓饼干 200g | Hup Seng Ping Pong crackers 200g |
| eeeeee30-0000-0000-0000-000000000001 | KitKat 威化朱古力 2指 4包装 | KitKat 2 finger 4 pack chocolate |

### Category: 个人护理 (Personal Care)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee31-0000-0000-0000-000000000001 | 高露洁全效牙膏 175g | Colgate Total toothpaste 175g |
| eeeeee32-0000-0000-0000-000000000001 | 黑人双重功效牙膏 140g | Darlie Double Action toothpaste 140g |
| eeeeee33-0000-0000-0000-000000000001 | 多芬深层滋养沐浴露 400ml | Dove body wash deeply nourishing 400ml |
| eeeeee34-0000-0000-0000-000000000001 | 利飞雅全效沐浴露 450ml | Lifebuoy Total 10 body wash 450ml |
| eeeeee35-0000-0000-0000-000000000001 | 潘婷防脱发洗发水 340ml | Pantene hair fall control shampoo 340ml |
| eeeeee36-0000-0000-0000-000000000001 | 杰士派除汗喷雾 150ml | Gatsby deodorant spray 150ml |
| eeeeee37-0000-0000-0000-000000000001 | 滴露抗菌香皂 110g | Dettol antibacterial bar soap 110g |
| eeeeee38-0000-0000-0000-000000000001 | 舒肤佳香皂 3块装 | Safeguard soap bar 3 pack |

### Category: 家居用品 (Household)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee39-0000-0000-0000-000000000001 | 达到净液体洗衣液 1.8kg | Dynamo liquid detergent 1.8kg |
| eeeeee40-0000-0000-0000-000000000001 | 飘柔超浓缩衣物柔顺剂 1.5L | Softlan fabric softener 1.5L |
| eeeeee41-0000-0000-0000-000000000001 | 妈妈柠檬洗洁精 900ml | Mama Lemon dishwash liquid 900ml |
| eeeeee42-0000-0000-0000-000000000001 | 滴露多用途清洁剂 500ml | Dettol all purpose cleaner 500ml |
| eeeeee43-0000-0000-0000-000000000001 | 舒洁超柔抽纸 3盒装 | Kleenex ultra soft tissue 3 pack |
| eeeeee44-0000-0000-0000-000000000001 | 佳能大号垃圾袋 20个装 | Glad garbage bags large 20 pack |
| eeeeee45-0000-0000-0000-000000000001 | 密保诺食品保鲜袋 15个装 | Ziploc storage bags 15 pack |

### Category: 乳品冷藏 (Dairy & Chilled)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee46-0000-0000-0000-000000000001 | 荷兰牛牌全脂牛奶 2L | Dutch Lady full cream milk 2L |
| eeeeee47-0000-0000-0000-000000000001 | 荷兰牛牌草莓口味牛奶 200ml | Dutch Lady strawberry milk 200ml |
| eeeeee48-0000-0000-0000-000000000001 | 万花筒希腊原味酸奶 135g | Marigold Greek yogurt plain 135g |
| eeeeee49-0000-0000-0000-000000000001 | 牛油果牌奶油 250g | Buttercup butter 250g |
| eeeeee50-0000-0000-0000-000000000001 | 农场新鲜鸡蛋 10个装 | Farm Fresh eggs 10 pack |

### Category: 面包糕点 (Bread & Bakery)

| Product UUID (full) | Chinese Name | English Search Term for Lazada |
|---|---|---|
| eeeeee51-0000-0000-0000-000000000001 | 嘉迪经典白面包 400g | Gardenia white bread 400g |
| eeeeee52-0000-0000-0000-000000000001 | 嘉迪椰酱牛油多士 | Gardenia Delicia kaya butter toast |
| eeeeee53-0000-0000-0000-000000000001 | 高五全麦面包 400g | High-5 wholemeal bread 400g |
| eeeeee54-0000-0000-0000-000000000001 | 马西莫软白面包 400g | Massimo soft white bread 400g |

## Output

Write results to: `E:/Dev/GitHub/asf-2/docs/images_part2.md`

Use exactly this format:

```markdown
# Product Image URLs — Part 2 (eeeeee28–eeeeee54)

| Product UUID | Chinese Name | Image URL | Source |
|---|---|---|---|
| eeeeee28-0000-0000-0000-000000000001 | 姐妹品牌蛋卷 100g | https://img.lazcdn.com/... | lazada.com.my |
...all 27 rows...
```

Every product must have an image URL. Do not leave any row blank.

---

---

# AGENT 2 — SQL Part 1: Catalogue

## Objective
Write the first half of the ASF Mart demo seed SQL file covering all product catalogue tables.

## Before You Start — Read These Files First
1. `E:/Dev/GitHub/asf-2/docs/SEED_MINIMART_CONTEXT.md` — full product list, UUID conventions,
   schema corrections, stock levels, size variants, and the SQL file structure.
2. `E:/Dev/GitHub/asf-2/asf-customer-app/database.types.ts` — authoritative schema reference.
3. `E:/Dev/GitHub/asf-2/docs/images_part1.md` — image URLs for products eeeeee01–eeeeee27 (from Agent 1A).
4. `E:/Dev/GitHub/asf-2/docs/images_part2.md` — image URLs for products eeeeee28–eeeeee54 (from Agent 1B).

The image files contain the `media_url` to use for each product's `product_medias` row.
Use the URL exactly as given. Do not substitute generic Unsplash URLs for products that have
a real Lazada/Shopee URL in the image files.

## Critical Schema Rules

```
✅ product_stock: column is 'count' — NOT 'quantity'
✅ products.status = 'Published' (string)
✅ product_sizes: (id, product_id, size, active, created_at, updated_at)
✅ product_stock: (id, product_id, size_id, color_id, count, created_at)
   — size_id and color_id can be NULL for products without variants
✅ product_medias: (id, product_id, arrangement, media_url, created_at, updated_at)
✅ product_categories: (id, product_id, category_id, created_at, updated_at)
✅ categories: (id, name, active, arrangement, media_url, created_at)
   — media_url is NOT NULL, use the Unsplash fallback URL for the category
✅ brand: (id, name, active, media_url, created_at) — media_url nullable
✅ products: (id, name, price, status, description, category_id, brand_id, created_at, updated_at)
```

## What to Write

Write to `E:/Dev/GitHub/asf-2/docs/seed_minimarket.sql` (overwrite).

### Section 0 — File header
```sql
-- ==============================================================
-- ASF Mart Demo Data Seed V2
-- 马来西亚便利超市主题 — Simplified Chinese
-- Generated: 2026-04-25
-- Schema source: asf-customer-app/database.types.ts
-- ==============================================================
```

### Section 1 — DELETE statements
```sql
DELETE FROM order_status_logs;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM promotion_products;
DELETE FROM promotions;
DELETE FROM announcements;
DELETE FROM membership_tiers;
DELETE FROM homepage_elements;
DELETE FROM post_medias;
DELETE FROM posts;
DELETE FROM product_medias;
DELETE FROM product_stock;
DELETE FROM product_sizes;
DELETE FROM product_colors;
DELETE FROM product_categories;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM brand;
-- NOTE: intentionally NOT deleting user_details
```

### Section 2 — Categories (7 rows)
Use fixed UUIDs `cccccc01-0000-0000-0000-000000000001` through `cccccc07-...`.
Use `ON CONFLICT (id) DO NOTHING`.
Use the category Unsplash fallback URLs from the context doc for `media_url`.

### Section 3 — Brands (10 rows)
Fixed UUIDs `dddddd01-0000-0000-0000-000000000001` through `dddddd10-...`.
`media_url = NULL` for all. `active = true`. `ON CONFLICT (id) DO NOTHING`.

### Section 4 — Products (54 rows)
Fixed UUIDs `eeeeee01-0000-0000-0000-000000000001` through `eeeeee54-...`.
All names in Simplified Chinese as listed in context doc.
Write a short, natural Simplified Chinese `description` for each product (1–2 sentences,
product benefit/usage — e.g. "香浓麦芽口味，随时随地补充能量，老少皆宜。").
`status = 'Published'`. `ON CONFLICT (id) DO NOTHING`.

### Section 5 — Product Sizes (14 rows)
Only 7 products have size variants (from context doc Section 8).
Use fixed UUIDs with pattern: `ss000000-0000-0000-PPPP-0000000000SS`
where PPPP = zero-padded product number, SS = 01 or 02.
`active = true`. `ON CONFLICT (id) DO NOTHING`.

### Section 6 — Product Categories junction (54 rows)
One row per product. Use `gen_random_uuid()` for id.

### Section 7 — Product Stock
- 7 variant products: 2 rows each (one per size), `size_id` = fixed size UUID, `color_id = NULL`
- 47 non-variant products: 1 row each, `size_id = NULL`, `color_id = NULL`
- Count values from context doc Section 9 stock levels
- Use `gen_random_uuid()` for id

### Section 8 — Product Medias (54 rows)
For each product, use the image URL from `images_part1.md` (eeeeee01–27) or
`images_part2.md` (eeeeee28–54). `arrangement = 1`. Use `gen_random_uuid()` for id.

### Section 9 — End-of-part-1 marker
End the file with this exact line so Agent 3 can append:
```sql
-- [[PART_2_START]]
```

## Output
Write to: `E:/Dev/GitHub/asf-2/docs/seed_minimarket.sql`
File must end with `-- [[PART_2_START]]` on the last line.

## Code Quality
- Valid PostgreSQL throughout
- `ON CONFLICT (id) DO NOTHING` for all fixed-UUID rows
- `gen_random_uuid()` for junction/stock/media rows
- Dates: use `now()` for `created_at`/`updated_at`
- Section header comments: `-- ── 1. CATEGORIES ────────────────────`
- No generic placeholders — every description must be meaningful Simplified Chinese

---

---

# AGENT 3 — SQL Part 2: Commerce + Orders

## Objective
Append the second half of the seed SQL file: posts, promotions, announcements, homepage elements,
membership tiers, demo users, 30 historical orders with items, payments, and status logs.

## Before You Start — Read These Files First
1. `E:/Dev/GitHub/asf-2/docs/SEED_MINIMART_CONTEXT.md` — posts content, promotions, announcements,
   orders distribution, UUID conventions, and payments schema.
2. `E:/Dev/GitHub/asf-2/asf-customer-app/database.types.ts` — authoritative schema reference.
3. `E:/Dev/GitHub/asf-2/docs/seed_minimarket.sql` — the file you will APPEND to via StrReplace.
   It ends with `-- [[PART_2_START]]` on the last line.

## How to Append
Use StrReplace to replace `-- [[PART_2_START]]` with all of Part 2's SQL content.
Do NOT regenerate or touch Part 1. Do NOT overwrite the file from scratch.

## Critical Schema Rules

```
✅ post_medias: (post_id, media_url, media_type, arrangement, created_at)
   — NO id in INSERT — it is a serial integer auto-assigned by the DB
   — media_type = 'image' (NOT NULL, required)

✅ promotions: (id, name, description, discount_type, discount_value, active, code,
                max_uses, uses_count, start_date, end_date, deleted_at, created_at)
   — discount_type: 'percentage' | 'fixed'
   — code: NULL allowed for auto-apply promos

✅ promotion_products: (promotion_id, product_id) — NO id column, no gen_random_uuid()

✅ announcements: (id, title, message, image_url, cta_label, cta_url, type, active,
                   starts_at, ends_at, created_at)

✅ homepage_elements: (id, type, contentType, targetId, amount, arrangement, created_at)
   — NO 'active' column

✅ membership_tiers: (id, name, point_required, active, created_at)
   — NO 'benefits' column — it does not exist in the database

✅ user_details: (id, first_name, last_name, role, city, state, birthdate,
                  lifetime_val, profile_image, race, created_at)
   — NO full_name, NO email, NO phone
   — Use ON CONFLICT (id) DO NOTHING

✅ orders: (id, user_id, status, total_amount, discounted_amount, discount_type,
            discount_amount, promo_code, shipping_address, points_earned, points_spent,
            courier_code, delyva_order_id, tracking_number, shipping_label_url,
            shipping_rate, shipping_address_structured, deleted_at, created_at)
   — NO order_number column

✅ order_items: (id, order_id, product_id, color_id, size_id, amount, created_at, deleted_at)
   — 'amount' = quantity — NOT 'quantity'
   — NO 'price' column

✅ order_status_logs: (id, order_id, new_status, old_status, changed_by, created_at)
   — NOT 'status' or 'notes'

✅ payments — required non-nullable fields:
   amount_total, currency='MYR', provider='stripe', status='succeeded',
   livemode=false, metadata='{}'::jsonb, refund_status='not_refunded',
   refunded_amount=0, attempt_count=1, updated_at
   — Optional but useful: stripe_payment_intent_id, payment_method_type='card',
     name=[user full name], user_id, order_id
```

## What to Write (replace `-- [[PART_2_START]]` with all of this)

Use all content from the context doc for the exact data values (posts captions, promotion names,
announcement messages, UUIDs, demo user names, etc.). Full data is in
`E:/Dev/GitHub/asf-2/docs/SEED_MINIMART_CONTEXT.md` sections 10–16.

### Section 10 — Posts (10 rows)
Fixed UUIDs `ffffff01-...` through `ffffff10-...`.
`status='Published'`, `active=true`, `caption_position='bottom'`, `photo_size='1:1'`.
`ON CONFLICT (id) DO NOTHING`.

### Section 11 — Post Medias (10 rows)
For posts, use Unsplash fallback URLs (posts are social media style, brand-specific packaging
not needed). Match URL to post topic:
- 节日优惠 (beverages): https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80
- 清晨咖啡 (coffee): https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80
- 深夜追剧 (snacks): https://images.unsplash.com/photo-1478144592103-25e218a04891?w=800&q=80
- 家居清洁 (household): https://images.unsplash.com/photo-1585687433141-9b3d0b8d7d0b?w=800&q=80
- 每日面包 (bread): https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80
- 全家牛奶 (milk): https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80
- 能量满满 (energy drink): https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80
- 护发美体 (personal care): https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80
- 方便面 (noodles): https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80
- 周末必备 (eggs): https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80

Do NOT include `id` in the INSERT — it is a serial integer auto-assigned.
```sql
INSERT INTO post_medias (post_id, media_url, media_type, arrangement, created_at) VALUES ...
```

### Section 12 — Promotions (4 rows)
Fixed UUIDs `pppppp01-...` through `pppppp04-...`.
Use interval arithmetic for dates. `uses_count = 0` except pppppp04 (WELCOME20) = 12.
`ON CONFLICT (id) DO NOTHING`.

### Section 13 — Promotion Products
No `id` column. Just `(promotion_id, product_id)` pairs.
Product links from context doc section 11.

### Section 14 — Announcements (3 rows)
Fixed UUIDs `aaaaaa01-...` through `aaaaaa03-...`.
`starts_at = now() - interval '1 day'`, `ends_at = now() + interval '30 days'`.
`ON CONFLICT (id) DO NOTHING`.

### Section 15 — Homepage Elements (3 rows)
Fixed UUIDs `hhhhhh01-...` through `hhhhhh03-...`. No `active` column.
`ON CONFLICT (id) DO NOTHING`.

### Section 16 — Membership Tiers (3 rows)
Fixed UUIDs `mmmmmm01-...` through `mmmmmm03-...`.
Use `point_required` NOT `min_points`. No `benefits` column.
`ON CONFLICT (id) DO NOTHING`.

### Section 17 — Demo Users — user_details (3 rows)
```
f1000000-0000-0000-0000-000000000001 → first_name='James', last_name='Tan'
f1000000-0000-0000-0000-000000000002 → first_name='Sarah', last_name='Lim'
f1000000-0000-0000-0000-000000000003 → first_name='David', last_name='Wong'
```
`role='customer'`, `lifetime_val=0`. `ON CONFLICT (id) DO NOTHING`.

### Section 18 — Orders (30 rows)
Fixed UUIDs `oooooo01-0000-0000-0000-000000000001` through `oooooo30-...`.

User rotation: 01/04/07... → James, 02/05/08... → Sarah, 03/06/09... → David

Date spread using intervals:
- oooooo01–05: `now() - interval 'N days'` where N = 1 to 5
- oooooo06–17: `now() - interval 'N days'` where N = 6 to 15
- oooooo18–30: `now() - interval 'N days'` where N = 16 to 30

Status: oooooo01='pending', oooooo02='processing', oooooo03='shipped',
oooooo04='processing', oooooo05='shipped', oooooo06='cancelled', oooooo08='cancelled',
all others = 'delivered'.

`total_amount` = sum of items you insert in Section 19. Calculate it and be consistent.
`points_earned` = `floor(total_amount)` for delivered, 0 otherwise.
Delyva/courier columns = NULL. `shipping_address_structured = NULL`.

Shipping addresses (rotate by user):
- James: `'No. 12, Jalan Bukit Indah 3, Taman Bukit Indah, 68000 Ampang, Selangor'`
- Sarah: `'Unit 5-2, Jalan SS 2/24, Petaling Jaya, 47300 Selangor'`
- David: `'Blok B-11-3, Subang Avenue, Subang Jaya, 47500 Selangor'`

### Section 19 — Order Items
Use `gen_random_uuid()` for id. `amount` = quantity (1–3). `color_id = NULL`, `size_id = NULL`.
Use products from eeeeee01–eeeeee54. Pick realistic combinations (e.g. an order might have
Milo + Maggi + Twisties; another might have Dutch Lady + bread + eggs).

### Section 20 — Payments (30 rows)
One payment per order. Use `gen_random_uuid()` for id.
```sql
INSERT INTO payments (id, order_id, user_id, name, amount_total, currency, provider,
  status, livemode, metadata, refund_status, refunded_amount, attempt_count,
  stripe_payment_intent_id, payment_method_type, created_at, updated_at) VALUES
(gen_random_uuid(), 'oooooo01-...', 'f1000000-...0001', 'James Tan',
  [total_amount], 'MYR', 'stripe', 'succeeded', false, '{}'::jsonb,
  'not_refunded', 0, 1, 'pi_demo_oooooo01', 'card', [order.created_at], [order.created_at]),
...
```

### Section 21 — Order Status Logs
Use `gen_random_uuid()` for id. `changed_by = NULL`.
Timestamp stagger: log1 = order.created_at, log2 = + interval '2 hours', log3 = + interval '6 hours'.

Status progressions:
- pending (oooooo01): 1 log → `old_status=NULL, new_status='pending'`
- processing (oooooo02, 04): 2 logs → NULL→pending, pending→processing
- shipped (oooooo03, 05): 3 logs → NULL→pending, pending→processing, processing→shipped
- cancelled (oooooo06, 08): 2 logs → NULL→pending, pending→cancelled
- delivered (all others): 3 logs → NULL→pending, pending→processing, processing→delivered

### Section 22 — Closing comment
```sql
-- ==============================================================
-- End of ASF Mart Demo Data Seed V2
-- Run in Supabase SQL Editor to populate the database
-- ==============================================================
```

## Output
StrReplace in `E:/Dev/GitHub/asf-2/docs/seed_minimarket.sql`:
- old_string: `-- [[PART_2_START]]`
- new_string: [all Part 2 SQL from Section 10 through closing comment]

---

---

## Post-Execution Checklist

After all 4 agents complete and the file is ready:

1. Verify `docs/seed_minimarket.sql` exists and ends with the closing comment (not `[[PART_2_START]]`)
2. Verify `docs/images_part1.md` and `docs/images_part2.md` exist with 27 rows each
3. Run the SQL in Supabase SQL Editor
4. Check for errors — common issues:
   - `NOT NULL violation` in payments → missing required column
   - `violates foreign key constraint` → wrong UUID reference
   - `invalid input value for enum` → wrong status string (use 'succeeded' not 'completed')
5. Open the app and browse — products should show real product images
