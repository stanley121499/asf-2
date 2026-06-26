# ASF Mart Demo Data Seed — Project Context

**Date**: 2026-04-25
**Status**: Ready for execution

---

## 1. Goal

Populate the Supabase database with realistic Malaysian minimart demo data so both mobile apps
(staff + customer) and the Next.js web app look full and convincing during stakeholder demos.

---

## 2. Theme

**ASF Mart** — a Malaysian neighborhood convenience store in the style of KK Mart / 99 Speed Mart.

| Setting | Decision |
|---------|----------|
| Language | **Simplified Chinese** for all product names, descriptions, categories, posts, announcements |
| Demo user names | **English** (James Tan, Sarah Lim, David Wong) |
| Pricing currency | MYR (Malaysian Ringgit) |
| Store tone | Friendly, everyday essentials, affordable |

---

## 3. Output File

```
E:/Dev/GitHub/asf-2/docs/seed_minimarket.sql
```

This **completely replaces** the existing partial seed. The file is executed in Supabase SQL editor.

---

## 4. Schema Source of Truth

> **Always use `asf-customer-app/database.types.ts`** — this is the most recently generated file
> and reflects the actual live Supabase schema.
>
> The root-level `database.types.ts` is **outdated** — do NOT use it.
> The wiki planning docs also have some incorrect column names — cross-check against the types file.

---

## 5. Critical Schema Corrections

These are columns/tables that planning docs got wrong vs. the actual database:

| Table | ❌ Wrong (planning docs said) | ✅ Correct (actual schema) |
|-------|-------------------------------|---------------------------|
| `product_stock` | `quantity` | `count` |
| `membership_tiers` | `min_points`, `benefits` | `point_required` — **NO `benefits` column** |
| `orders` | `order_number`, `notes` | Neither exists — `id` (UUID) is the only identifier |
| `order_items` | `quantity`, `price` | `amount` (quantity), **no `price` column** |
| `order_status_logs` | `status`, `notes` | `new_status`, `old_status`, `changed_by` |
| `user_details` | `full_name`, `email`, `phone` | `first_name`, `last_name` — **no email/phone** |
| `post_medias` | no `media_type` column | **HAS `media_type: string`** ('image' \| 'video') |
| `promotion_products` | has `id` column | **NO `id` column** — only `(promotion_id, product_id)` |
| `announcements` | missing from root types | **EXISTS** in asf-customer-app/database.types.ts |
| `homepage_elements` | has `active` column | **NO `active` column** |

### `payments` table — correct required fields for seeding

The payments table is complex (Stripe-specific). Use these values for demo seed rows:

```sql
amount_total      = order total amount (in MYR, e.g. 25.50)
currency          = 'MYR'
provider          = 'stripe'
status            = 'succeeded'          -- enum: use this value, NOT 'completed'
livemode          = false
metadata          = '{}'::jsonb
refund_status     = 'not_refunded'       -- enum
refunded_amount   = 0
attempt_count     = 1
updated_at        = same as created_at
stripe_payment_intent_id = 'pi_demo_' || replace(order_id::text, '-', '')
payment_method_type = 'card'
email             = NULL                 -- no email in user_details
name              = demo user full name (e.g. 'James Tan')
user_id           = order's user_id
order_id          = order's id
```

All other payment columns can be NULL.

---

## 6. UUID Conventions (Fixed — ensures idempotency on re-run)

| Entity | Pattern | Example |
|--------|---------|---------|
| Categories (7) | `cccccc0N-0000-0000-0000-000000000001` | `cccccc01-0000-0000-0000-000000000001` |
| Brands (10) | `ddddddNN-0000-0000-0000-000000000001` | `dddddd01-0000-0000-0000-000000000001` |
| Products (54) | `eeeeeeNN-0000-0000-0000-000000000001` | `eeeeee01-0000-0000-0000-000000000001` |
| Posts (10) | `ffffff0N-0000-0000-0000-000000000001` | `ffffff01-0000-0000-0000-000000000001` |
| Promotions (4) | `pppppp0N-0000-0000-0000-000000000001` | `pppppp01-0000-0000-0000-000000000001` |
| Announcements (3) | `aaaaaa0N-0000-0000-0000-000000000001` | `aaaaaa01-0000-0000-0000-000000000001` |
| Membership Tiers (3) | `mmmmmm0N-0000-0000-0000-000000000001` | `mmmmmm01-0000-0000-0000-000000000001` |
| Homepage Elements (3) | `hhhhhh0N-0000-0000-0000-000000000001` | `hhhhhh01-0000-0000-0000-000000000001` |
| Demo Users (3) | `f1000000-0000-0000-0000-00000000000N` | `f1000000-0000-0000-0000-000000000001` |
| Orders (30) | `ooooooNN-0000-0000-0000-000000000001` | `oooooo01-0000-0000-0000-000000000001` |
| Size variants (per product) | `sseeeeeeNN-SSSSS` pattern or `gen_random_uuid()` | Use fixed UUIDs for sizes to allow stock FK references |

For sizes with FK references to `product_stock`, use fixed UUIDs:
- Pattern: `sseeeeeeNN-000N-0000-0000-000000000001` where NN=product number, N=size index

For junction tables (`product_categories`, `product_medias`, `order_items`, `post_medias`, `product_stock` for non-variant products) use `gen_random_uuid()`.

---

## 7. Products (54 total, all names in Simplified Chinese)

### Brands (10)

| UUID | Brand | Chinese Name |
|------|-------|-------------|
| dddddd01 | Milo | 美禄 |
| dddddd02 | Nescafe | 雀巢咖啡 |
| dddddd03 | Dutch Lady | 荷兰牛牌 |
| dddddd04 | 100Plus | 百加得 |
| dddddd05 | Maggi | 美极 |
| dddddd06 | Mamee | 妈咪 |
| dddddd07 | Twisties | 滋士 |
| dddddd08 | Colgate | 高露洁 |
| dddddd09 | Dettol | 滴露 |
| dddddd10 | Gardenia | 嘉迪 |

### Category 1 — 饮料 (cccccc01) — 12 products

> Image URLs come from Agent 1A output (`docs/images_part1.md`). Fallback Unsplash IDs listed for reference only.

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee01 | 美禄 UHT 麦芽饮料 200ml | Milo UHT 200ml | dddddd01 | 1.80 |
| eeeeee02 | 美禄罐装麦芽饮料 240ml | Milo can 240ml | dddddd01 | 2.50 |
| eeeeee03 | 雀巢咖啡三合一原味 25条装 | Nescafe 3in1 original 25 sticks | dddddd02 | 18.90 |
| eeeeee04 | 诗杜嘉天然矿泉水 1.5L | Spritzer mineral water 1.5L | NULL | 1.50 |
| eeeeee05 | 百加得等渗饮料罐 325ml | 100Plus isotonic 325ml can | dddddd04 | 2.00 |
| eeeeee06 | 清泉水蜜桃茶 250ml | Seasons peach tea 250ml | NULL | 2.20 |
| eeeeee07 | F&N 橙汁汽水 1.5L | F&N orange soda 1.5L | NULL | 4.50 |
| eeeeee08 | 宝加茉莉绿茶 500ml | Pokka jasmine green tea 500ml | NULL | 3.90 |
| eeeeee09 | 红牛能量饮料 250ml | Red Bull energy drink 250ml | NULL | 5.50 |
| eeeeee10 | 荷兰牛牌全脂牛奶 1L | Dutch Lady full cream milk 1L | dddddd03 | 8.90 |
| eeeeee11 | 万花筒 UHT 朱古力牛奶 250ml | Marigold UHT chocolate milk 250ml | NULL | 2.50 |
| eeeeee12 | 杨协成菊花茶 300ml | Yeo's chrysanthemum tea 300ml | NULL | 2.00 |

### Category 2 — 速食 (cccccc02) — 8 products

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee13 | 美极炒面 5包装 | Maggi Mee Goreng 5 pack | dddddd05 | 6.50 |
| eeeeee14 | 美极亚参叻沙面 5包装 | Maggi Asam Laksa 5 pack | dddddd05 | 7.20 |
| eeeeee15 | 妈咪厨师冬炎汤面 5包装 | Mamee Chef Tom Yam 5 pack | dddddd06 | 8.90 |
| eeeeee16 | 新丁牌咖喱面 5包装 | Cintan curry noodle 5 pack | NULL | 5.90 |
| eeeeee17 | 槟城白咖喱面 | MyKuali Penang white curry noodle | NULL | 5.50 |
| eeeeee18 | 亚达比即溶米粥 | Adabi instant rice porridge | NULL | 4.50 |
| eeeeee19 | 鸡牌番茄沙丁鱼罐头 425g | Ayam Brand sardines tomato sauce 425g | NULL | 8.90 |
| eeeeee20 | 美极香浓鸡肉杯面 | Maggi rich chicken cup noodle | dddddd05 | 3.50 |

### Category 3 — 零食饼干 (cccccc03) — 10 products

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee21 | 滋士芝士味薯条 65g | Twisties cheese 65g | dddddd07 | 3.50 |
| eeeeee22 | 薯先生原味薯片 65g | Mister Potato original chips 65g | NULL | 3.50 |
| eeeeee23 | 杰仁吉虾片 60g | Jack n Jill prawn crackers 60g | NULL | 3.20 |
| eeeeee24 | 妈咪怪兽面零食 25g | Mamee Monster noodle snack 25g | dddddd06 | 1.50 |
| eeeeee25 | 奇宝原味朱古力曲奇 | Chipsmore chocolate chip cookies | NULL | 8.90 |
| eeeeee26 | 明奇力士奶油夹心饼干 | Munchy's Lexus cream sandwich biscuit | NULL | 6.50 |
| eeeeee27 | 尼布斯什锦糖果 150g | Nips assorted candy 150g | NULL | 5.90 |

### Category 3 continued (Agent 1B range)

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee28 | 姐妹品牌蛋卷 100g | Julie's Love Letters egg roll 100g | NULL | 5.50 |
| eeeeee29 | 合成乒乓饼干 200g | Hup Seng Ping Pong crackers 200g | NULL | 4.90 |
| eeeeee30 | KitKat 威化朱古力 2指 4包装 | KitKat 2 finger 4 pack | NULL | 7.90 |

### Category 4 — 个人护理 (cccccc04) — 8 products

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee31 | 高露洁全效牙膏 175g | Colgate Total toothpaste 175g | dddddd08 | 9.90 |
| eeeeee32 | 黑人双重功效牙膏 140g | Darlie Double Action toothpaste 140g | NULL | 7.50 |
| eeeeee33 | 多芬深层滋养沐浴露 400ml | Dove body wash deeply nourishing 400ml | NULL | 14.90 |
| eeeeee34 | 利飞雅全效沐浴露 450ml | Lifebuoy Total 10 body wash 450ml | NULL | 11.90 |
| eeeeee35 | 潘婷防脱发洗发水 340ml | Pantene hair fall control shampoo 340ml | NULL | 16.90 |
| eeeeee36 | 杰士派除汗喷雾 150ml | Gatsby deodorant spray 150ml | NULL | 12.90 |
| eeeeee37 | 滴露抗菌香皂 110g | Dettol antibacterial bar soap 110g | dddddd09 | 4.50 |
| eeeeee38 | 舒肤佳香皂 3块装 | Safeguard soap bar 3 pack | NULL | 9.50 |

### Category 5 — 家居用品 (cccccc05) — 7 products

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee39 | 达到净液体洗衣液 1.8kg | Dynamo liquid detergent 1.8kg | NULL | 22.90 |
| eeeeee40 | 飘柔超浓缩衣物柔顺剂 1.5L | Softlan fabric softener 1.5L | NULL | 14.90 |
| eeeeee41 | 妈妈柠檬洗洁精 900ml | Mama Lemon dishwash liquid 900ml | NULL | 9.90 |
| eeeeee42 | 滴露多用途清洁剂 500ml | Dettol all purpose cleaner 500ml | dddddd09 | 12.90 |
| eeeeee43 | 舒洁超柔抽纸 3盒装 | Kleenex ultra soft tissue 3 pack | NULL | 14.90 |
| eeeeee44 | 佳能大号垃圾袋 20个装 | Glad garbage bags large 20 pack | NULL | 8.90 |
| eeeeee45 | 密保诺食品保鲜袋 15个装 | Ziploc storage bags 15 pack | NULL | 9.50 |

### Category 6 — 乳品冷藏 (cccccc06) — 5 products

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee46 | 荷兰牛牌全脂牛奶 2L | Dutch Lady full cream milk 2L | dddddd03 | 15.90 |
| eeeeee47 | 荷兰牛牌草莓口味牛奶 200ml | Dutch Lady strawberry milk 200ml | dddddd03 | 2.50 |
| eeeeee48 | 万花筒希腊原味酸奶 135g | Marigold Greek yogurt plain 135g | NULL | 5.90 |
| eeeeee49 | 牛油果牌奶油 250g | Buttercup butter 250g | NULL | 8.90 |
| eeeeee50 | 农场新鲜鸡蛋 10个装 | Farm Fresh eggs 10 pack | NULL | 7.50 |

### Category 7 — 面包糕点 (cccccc07) — 4 products

| UUID | Chinese Name | English Search Term (for Lazada) | Brand UUID | Price MYR |
|------|-------------|----------------------------------|-----------|-----------|
| eeeeee51 | 嘉迪经典白面包 400g | Gardenia white bread 400g | dddddd10 | 4.20 |
| eeeeee52 | 嘉迪椰酱牛油多士 | Gardenia Delicia kaya butter toast | dddddd10 | 5.90 |
| eeeeee53 | 高五全麦面包 400g | High-5 wholemeal bread 400g | NULL | 5.50 |
| eeeeee54 | 马西莫软白面包 400g | Massimo soft white bread 400g | NULL | 4.50 |

---

## 8. Product Sizes (7 products with size variants)

These products get `product_sizes` rows AND `product_stock` rows per size.
All other products get a single `product_stock` row with `size_id = NULL, color_id = NULL`.

| Product UUID | Size 1 | Size 2 | Size UUID (1) | Size UUID (2) |
|---|---|---|---|---|
| eeeeee07 (F&N Soda) | 1.5L | 2.25L | ss-eeeeee07-0001 | ss-eeeeee07-0002 |
| eeeeee33 (Dove Body Wash) | 400ml | 700ml | ss-eeeeee33-0001 | ss-eeeeee33-0002 |
| eeeeee35 (Pantene Shampoo) | 340ml | 650ml | ss-eeeeee35-0001 | ss-eeeeee35-0002 |
| eeeeee39 (Dynamo Detergent) | 1.8kg | 3.6kg | ss-eeeeee39-0001 | ss-eeeeee39-0002 |
| eeeeee41 (Mama Lemon) | 900ml | 1.5L | ss-eeeeee41-0001 | ss-eeeeee41-0002 |
| eeeeee21 (Twisties) | 普通装 65g | 家庭装 160g | ss-eeeeee21-0001 | ss-eeeeee21-0002 |
| eeeeee22 (Mister Potato) | 普通装 65g | 家庭装 160g | ss-eeeeee22-0001 | ss-eeeeee22-0002 |

Size UUIDs use this pattern: `'ss000000-0000-0000-PPPP-0000000000SS'`
where PPPP = product number (e.g. 0007 for eeeeee07), SS = size index (01 or 02).

Example: `'ss000000-0000-0000-0007-000000000001'` = F&N Soda 1.5L size

---

## 9. Stock Levels

| Product type | Count range |
|---|---|
| Staples (water eeeeee04, milk eeeeee10/46, bread eeeeee51-54, eggs eeeeee50) | 120–200 |
| Common beverages (eeeeee01-09, 11, 12) | 60–100 |
| Instant food (eeeeee13-20) | 40–80 |
| Snacks (eeeeee21-30) | 30–70 |
| Personal care (eeeeee31-38) | 25–60 |
| Household (eeeeee39-45) | 20–50 |
| Dairy & chilled (eeeeee47-49) | 30–60 |

For products with size variants, split the total between the two sizes (e.g. 60% regular, 40% large).

---

## 10. Posts (10 — Simplified Chinese captions)

| UUID | Name | Caption | CTA |
|------|------|---------|-----|
| ffffff01 | 节日优惠！ | 本周特惠，所有饮料最高折扣20%！美禄、雀巢咖啡、百加得一应俱全，快来抢购！ | 立即购买 |
| ffffff02 | 清晨咖啡时光 | 用雀巢咖啡三合一开启美好的一天，香浓醇厚，一分钟轻松搞定。 | 立即抢购 |
| ffffff03 | 深夜追剧零食 | 追剧必备！滋士薯条、妈咪怪兽、薯先生，边追剧边零食，快乐加倍！ | 立刻订购 |
| ffffff04 | 家居清洁特卖 | 家洁心安！达到净洗衣液＋妈妈柠檬洗洁精，厨房卫浴全搞定，超值组合。 | 查看详情 |
| ffffff05 | 每日新鲜面包 | 嘉迪面包，每日新鲜出炉，完美早餐首选。ASF Mart 每天都有货！ | 立刻订购 |
| ffffff06 | 全家牛奶优选 | 荷兰牛牌＋万花筒，为全家补充钙质，老少皆宜，健康美味！ | 立即购买 |
| ffffff07 | 能量满满一天 | 百加得等渗饮料＋红牛能量饮料，运动后或下班途中，补充能量最佳选择💪 | 再看看 |
| ffffff08 | 护发美体周 | 潘婷洗发水、多芬沐浴露，洗出柔顺秀发，护出嫩滑肌肤，感受不同！ | 查看产品 |
| ffffff09 | 方便面爱好者 | 美极冬炎、妈咪厨师、槟城白咖喱——选你所爱，现在就煮！🍜 | 立即购买 |
| ffffff10 | 周末家庭必备 | 新鲜鸡蛋、面包、牛奶、零食，周末全家备货就来 ASF Mart，一站购齐🛒 | 立刻购物 |

All posts: `status='Published'`, `active=true`, `caption_position='bottom'`, `photo_size='1:1'`

Post photo ID mapping:
| Post UUID | Photo ID |
|---|---|
| ffffff01 | photo-1622483767028-3f66f32aef97 (canned beverages) |
| ffffff02 | photo-1541167760496-1628856ab772 (coffee) |
| ffffff03 | photo-1478144592103-25e218a04891 (chips/snacks) |
| ffffff04 | photo-1585687433141-9b3d0b8d7d0b (detergent/cleaning) |
| ffffff05 | photo-1509440159596-0249088772ff (bread) |
| ffffff06 | photo-1563636619-e9143da7973b (milk carton) |
| ffffff07 | photo-1556881286-fc6915169721 (energy drink) |
| ffffff08 | photo-1571781926291-c477ebfd024b (shampoo/haircare) |
| ffffff09 | photo-1612929633738-8fe44f7ec841 (instant noodles) |
| ffffff10 | photo-1582722872445-44dc5f7e3c8f (eggs) |

---

## 11. Promotions (4)

| UUID | Name | discount_type | discount_value | code | active | start | end | max_uses | auto_apply |
|------|------|--------------|---------------|------|--------|-------|-----|---------|-----------|
| pppppp01 | 工作日早晨优惠 | percentage | 10 | NULL | true | now-30d | now+60d | NULL | true |
| pppppp02 | 零食组合优惠 | fixed | 5.00 | NULL | true | now-7d | now+30d | NULL | true |
| pppppp03 | 家居周末特卖 | percentage | 15 | NULL | true | now-14d | now+14d | NULL | true |
| pppppp04 | 新会员首购优惠 | percentage | 20 | WELCOME20 | true | now-90d | now+90d | 100 | false |

Promotion ↔ Product links (`promotion_products`):
- pppppp01 (morning deal): eeeeee01, eeeeee03, eeeeee04, eeeeee09, eeeeee10
- pppppp02 (snack bundle): eeeeee21, eeeeee22, eeeeee24, eeeeee25, eeeeee30
- pppppp03 (household weekend): eeeeee39, eeeeee40, eeeeee41, eeeeee42, eeeeee43
- pppppp04 (welcome): eeeeee01, eeeeee13, eeeeee31, eeeeee51

---

## 12. Announcements (3)

| UUID | title | message | type | active | cta_label |
|------|-------|---------|------|--------|-----------|
| aaaaaa01 | 盛大开业优惠🎉 | 本周全场商品8折！机会难得，欢迎光临 ASF Mart！ | banner | true | 立即购物 |
| aaaaaa02 | 开斋节特别优惠 | 开斋节期间，饮料、零食、个人护理全线特价！ | promo | true | 查看优惠 |
| aaaaaa03 | 满RM50免运费 | 单次购物满RM50即享免运费，全马适用！ | info | true | 了解更多 |

Image URLs:
- aaaaaa01: `https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80`
- aaaaaa02: `https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80`
- aaaaaa03: `https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800&q=80`

---

## 13. Homepage Elements (3)

| UUID | type | contentType | targetId | amount | arrangement |
|------|------|-------------|----------|--------|-------------|
| hhhhhh01 | banner | announcement | aaaaaa01 | NULL | 1 |
| hhhhhh02 | product_grid | featured_products | NULL | 6 | 2 |
| hhhhhh03 | promotion | promotions | pppppp01 | NULL | 3 |

---

## 14. Membership Tiers (3)

| UUID | name | point_required | active |
|------|------|---------------|--------|
| mmmmmm01 | 铜牌会员 | 0 | true |
| mmmmmm02 | 银牌会员 | 500 | true |
| mmmmmm03 | 金牌会员 | 2000 | true |

---

## 15. Demo Users (3)

| UUID | first_name | last_name | role | city | state |
|------|-----------|-----------|------|------|-------|
| f1000000-0000-0000-0000-000000000001 | James | Tan | customer | Kuala Lumpur | Selangor |
| f1000000-0000-0000-0000-000000000002 | Sarah | Lim | customer | Petaling Jaya | Selangor |
| f1000000-0000-0000-0000-000000000003 | David | Wong | customer | Subang Jaya | Selangor |

Use `ON CONFLICT (id) DO NOTHING` — do NOT delete existing user rows.

---

## 16. Historical Orders (30 orders over 30 days)

### Distribution
| Days ago | Count | Status |
|----------|-------|--------|
| 1–5 | 5 orders | pending / processing / shipped |
| 6–15 | 12 orders | delivered (mostly), 2 cancelled |
| 16–30 | 13 orders | delivered |

### Order rules
- Rotate users: oooooo01=James, oooooo02=Sarah, oooooo03=David, oooooo04=James... (rotate)
- Each order: 1–4 `order_items` rows (pick realistic products per order)
- `total_amount` = sum of (product.price × amount) for each item
- `shipping_address` = `'Taman Bukit Indah, Ampang, Selangor'` (vary slightly per user)
- `status` values: `'pending'` | `'processing'` | `'shipped'` | `'delivered'` | `'cancelled'`
- `points_earned` = floor(total_amount) for delivered orders, 0 for others

### Order status log progression
For each delivered order, insert 3 logs:
1. `old_status=NULL → new_status='pending'`
2. `old_status='pending' → new_status='processing'`
3. `old_status='processing' → new_status='delivered'`

For shipped orders: 2 logs (pending → processing → shipped)
For cancelled orders: 2 logs (pending → cancelled)

`changed_by = NULL` for all demo logs.

### Payment for each order
1 payment row per order using the fields from Section 5 payments notes above.

---

## 17. Image Sourcing Strategy

**Every product must have its own specific product photo** — not a generic category shot.
The goal is for a client to see "美极炒面 5包装" and recognise the actual Maggi Mee Goreng packet.

### Primary source: Lazada Malaysia (https://www.lazada.com.my)
Lazada has real product photos for all 54 products. The CDN URLs are stable enough for demos.
Lazada image URLs look like: `https://img.lazcdn.com/g/ff/kf/Sxxxxxxxx.jpg_800x800q80.jpg`

### Split for image sourcing agents
- **Agent 1A** sources image URLs for products **eeeeee01–eeeeee27** (beverages + instant food + snacks eeeeee21–27)
- **Agent 1B** sources image URLs for products **eeeeee28–eeeeee54** (snacks eeeeee28–30, personal care, household, dairy, bread)

### Output files
- Agent 1A → `docs/images_part1.md`
- Agent 1B → `docs/images_part2.md`

### Output table format (both agents must use this exact format)
```markdown
| Product UUID | Chinese Name | Image URL | Source | Notes |
|---|---|---|---|---|
| eeeeee01-0000-0000-0000-000000000001 | 美禄 UHT 麦芽饮料 200ml | https://img.lazcdn.com/... | lazada.com.my | |
```

### Fallback: if product not found on Lazada
1. Try Shopee Malaysia (https://shopee.com.my) with the same English search term
2. If still not found, use these category-level Unsplash URLs as last resort:

| Category | Fallback Unsplash URL |
|---|---|
| 饮料 (Beverages) | https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80 |
| 速食 (Instant Food) | https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80 |
| 零食饼干 (Snacks) | https://images.unsplash.com/photo-1478144592103-25e218a04891?w=800&q=80 |
| 个人护理 (Personal Care) | https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80 |
| 家居用品 (Household) | https://images.unsplash.com/photo-1585687433141-9b3d0b8d7d0b?w=800&q=80 |
| 乳品冷藏 (Dairy) | https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80 |
| 面包糕点 (Bread) | https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80 |

### Post + category images (Agent 3 handles these separately)
Posts and category thumbnails can use the Unsplash fallback URLs above — generic category shots
are acceptable for social media posts and category icons (not product cards).

---

## 18. Agent Execution Plan

```
┌────────────────────────────────┐    ┌────────────────────────────────┐
│  Agent 1A: Image Sourcing      │    │  Agent 1B: Image Sourcing      │
│  Products eeeeee01–eeeeee27    │    │  Products eeeeee28–eeeeee54    │
│  Source: Lazada (browser tool) │    │  Source: Lazada (browser tool) │
│  Output: docs/images_part1.md  │    │  Output: docs/images_part2.md  │
└───────────────┬────────────────┘    └───────────────┬────────────────┘
                │                                      │
                └──────────────┬───────────────────────┘
                               │  Both must complete first
               ┌───────────────▼──────────────────────────┐
               │  Agent 2: SQL Part 1 — Catalogue          │
               │  Reads: images_part1.md + images_part2.md │
               │  Writes: docs/seed_minimarket.sql          │
               └───────────────┬──────────────────────────┘
                               │  Must complete first
               ┌───────────────▼──────────────────────────┐
               │  Agent 3: SQL Part 2 — Commerce + Orders  │
               │  Appends to: docs/seed_minimarket.sql      │
               └───────────────────────────────────────────┘
```

### Parallelism summary
| Agents | Can run in parallel? | Reason |
|--------|---------------------|--------|
| Agent 1A + Agent 1B | ✅ Yes | Completely independent product sets |
| Agent 2 | ❌ Wait for both 1A + 1B | Needs the image URL tables |
| Agent 3 | ❌ Wait for Agent 2 | Appends to the file Agent 2 creates |

---

## 19. SQL File Structure

```sql
-- ==============================================================
-- ASF Mart Demo Data Seed V2
-- Malaysia minimart themed — Simplified Chinese
-- Generated: 2026-04-25
-- ==============================================================

-- ── CLEAR EXISTING DATA ──────────────────────────────────────
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
-- NOTE: do NOT delete user_details

-- ── PART 1 (Agent 2) ─────────────────────────────────────────
-- 1. Categories
-- 2. Brands
-- 3. Products
-- 4. Product Sizes
-- 5. Product Categories
-- 6. Product Stock
-- 7. Product Medias

-- ── PART 2 (Agent 3) ─────────────────────────────────────────
-- 8. Posts
-- 9. Post Medias
-- 10. Promotions
-- 11. Promotion Products
-- 12. Announcements
-- 13. Homepage Elements
-- 14. Membership Tiers
-- 15. Demo Users (user_details)
-- 16. Orders
-- 17. Order Items
-- 18. Payments
-- 19. Order Status Logs
```
