# ASF-2 Demo Data Plan — Malaysia Minimart (KK Mart / 99 Speed Mart Style)

**Date**: 2026-04-25  
**Purpose**: Seed the Supabase database with realistic demo data so the app looks full during stakeholder demos. The theme is a Malaysian convenience minimart similar to KK Mart or 99 Speed Mart.

---

## Theme

A Malaysian neighborhood minimart called **"ASF Mart"** selling everyday essentials at typical Malaysian MYR prices. Products span 7 categories that mirror what you'd find on a minimart shelf.

---

## Categories (7)

1. **Minuman (Beverages)** — water, soft drinks, juices, coffee, energy drinks, milk
2. **Makanan Segera (Instant Food)** — instant noodles, canned food, rice packets
3. **Snek & Biskut (Snacks & Biscuits)** — chips, cookies, crackers, candy
4. **Penjagaan Diri (Personal Care)** — shampoo, body wash, toothpaste, soap, deodorant
5. **Barangan Rumah (Household)** — detergent, dishwash, tissue, cleaning spray, trash bags
6. **Tenusu & Sejuk (Dairy & Chilled)** — milk, yogurt, butter, cheese, eggs
7. **Roti & Bateri (Bread & Bakery)** — bread, pastries, buns

---

## Brands (10)

1. Milo (beverages/malt drink)
2. Nescafe (coffee)
3. Dutch Lady (dairy)
4. 100Plus (isotonic drink)
5. Maggi (instant food)
6. Mamee (instant noodles/snacks)
7. Twisties (snacks)
8. Colgate (personal care)
9. Dettol (household/personal care)
10. Gardenia (bread)

---

## Products (~50)

### Beverages (12 products)
- Milo UHT 200ml — RM1.80
- Milo Can 240ml — RM2.50
- Nescafe 3-in-1 Original (25-stick pack) — RM18.90
- Spritzer Mineral Water 1.5L — RM1.50
- 100Plus Can 325ml — RM2.00
- Seasons Peach Tea 250ml — RM2.20
- F&N Orange Soda 1.5L — RM4.50
- Pokka Jasmine Green Tea 500ml — RM3.90
- Red Bull Energy Drink 250ml — RM5.50
- Dutch Lady Full Cream Milk 1L — RM8.90
- Marigold UHT Chocolate Milk 250ml — RM2.50
- Yeo's Chrysanthemum Tea 300ml — RM2.00

### Instant Food (8 products)
- Maggi Mee Goreng 5-pack — RM6.50
- Maggi Asam Laksa 5-pack — RM7.20
- Mamee Chef Tom Yam 5-pack — RM8.90
- Cintan Curry 5-pack — RM5.90
- MyKuali Penang White Curry Noodle — RM5.50
- Adabi Instant Rice Porridge (Bubur Instant) — RM4.50
- Ayam Brand Sardines in Tomato Sauce 425g — RM8.90
- Maggi Rich Chicken Instant Cup Noodle — RM3.50

### Snacks & Biscuits (10 products)
- Twisties Cheese 65g — RM3.50
- Mister Potato Original 65g — RM3.50
- Jack 'n Jill Prawn Crackers 60g — RM3.20
- Mamee Monster Noodle Snack 25g — RM1.50
- Chipsmore Original Chocolate Chip Cookies — RM8.90
- Munchy's Lexus Cream Sandwich Biscuit — RM6.50
- Nips Assorted Candy 150g — RM5.90
- Julie's Love Letters (Egg Roll) 100g — RM5.50
- Hup Seng Ping Pong Crackers 200g — RM4.90
- KitKat 2-finger 4-pack — RM7.90

### Personal Care (8 products)
- Colgate Total Toothpaste 175g — RM9.90
- Darlie Double Action Toothpaste 140g — RM7.50
- Dove Body Wash Deeply Nourishing 400ml — RM14.90
- Lifebuoy Total 10 Body Wash 450ml — RM11.90
- Pantene Hair Fall Control Shampoo 340ml — RM16.90
- Gatsby Deodorant Spray 150ml — RM12.90
- Dettol Antibacterial Bar Soap 110g — RM4.50
- Safeguard Soap Bar 3-pack — RM9.50

### Household (7 products)
- Dynamo Liquid Detergent 1.8kg — RM22.90
- Softlan Ultra Fabric Softener 1.5L — RM14.90
- Mama Lemon Dishwashing Liquid 900ml — RM9.90
- Dettol All-Purpose Cleaner 500ml — RM12.90
- Kleenex Ultra Soft Tissue 3-pack — RM14.90
- Glad Garbage Bags 20-pack L — RM8.90
- Zip-Loc Storage Bags 15-pack — RM9.50

### Dairy & Chilled (5 products)
- Dutch Lady Full Cream Milk 2L — RM15.90
- Dutch Lady Strawberry Flavoured Milk 200ml — RM2.50
- Marigold Greek Yogurt Plain 135g — RM5.90
- Buttercup Butter 250g — RM8.90
- Farm Fresh Eggs 10-pack — RM7.50

### Bread & Bakery (4 products)
- Gardenia Original Classic White Bread 400g — RM4.20
- Gardenia Delicia Kaya Butter Toast — RM5.90
- High-5 Wholemeal Bread 400g — RM5.50
- Massimo Soft White Bread 400g — RM4.50

---

## Sizes per product (examples)

For beverages: Small (250ml / 330ml), Regular (500ml), Large (1.5L / 2L)  
For snacks/personal care: Regular Pack, Value Pack / Family Pack  
For household: Regular (500ml/900ml), Large (1.8L/1.5L)  
For single-pack items (bread, eggs, butter): no size variants, just `count` stock row with null size_id

---

## Stock levels
Each product should have realistic stock: 20–200 units depending on type.  
Staples (water, milk, bread): higher stock (100–200).  
Premium/specialty: lower stock (20–50).

---

## Posts (10 promotional posts)

Style: Malaysian bilingual (Malay/English or Mandarin/English). Match the posts schema (name, caption, caption_position, photo_size, status, cta_text, active).

Examples:
1. "Jimat Raya!" — Raya promotion on beverages
2. "Morning Coffee Routine" — Nescafe/Milo highlight
3. "Malam Snek Sempurna" — Snacks night promo
4. "Bersih Rumah Deal" — Household cleaning bundle
5. "Roti Segar Setiap Hari" — Fresh bread daily
6. "Kurang Gula, Lebih Sihat" — Healthy beverages
7. "Back to School" — Kids snacks/drinks
8. "Weekend BBQ Essentials" — Grilling supplies
9. "Hair Care Upgrade" — Shampoo/conditioner promo
10. "Dairy Fresh Daily" — Milk and eggs

---

## Promotions (4)

1. **Weekday Morning Deal** — 10% off all beverages, Mon–Fri 7am–12pm, active
2. **Buy 2 Free 1 Snacks** — Fixed discount RM5 off on 3 snack items, always active
3. **Household Bundle** — 15% off household category, weekends, active
4. **New Member Promo** — 20% first purchase, code "WELCOME20", max 100 uses

---

## Announcements (3)

1. **"Grand Opening Sale!"** — type: "banner", active, 20% off storewide, image of store/products
2. **"Raya Special Deals"** — type: "promo", festive season bundles
3. **"Free Delivery Above RM50"** — type: "info", delivery promotion

---

## Homepage Elements (3)

1. Banner (arrangement 1): Grand opening / hero image
2. Featured Products (arrangement 2): Top 6 bestsellers
3. Promo tile (arrangement 3): Raya deal

---

## Historical Orders (for analytics, past 30 days)

Create ~30 orders spread across the past 30 days:
- 3–5 orders per week, varying amounts RM10–RM150
- Mix of statuses: delivered (most), shipped, processing (recent ones)
- Each order has 1–4 order_items from the seeded products
- Each order has a corresponding payment record (status: completed)
- Order status logs showing progression

Use placeholder user IDs — the agent should create 3 demo customer user_details rows (or use UUIDs that the human can later assign to real auth users).

---

## Image Source Strategy

Use Unsplash free images (no key needed for direct URL format):
`https://images.unsplash.com/photo-{PHOTO_ID}?w=800&q=80`

Good search queries on unsplash.com for each category:
- Beverages: search "beverage can malaysia", "milk carton", "coffee cup"
- Instant food: "instant noodles", "canned food"
- Snacks: "potato chips bag", "cookies biscuit"
- Personal care: "shampoo bottle", "toothpaste", "soap"
- Household: "detergent bottle", "cleaning spray", "tissue box"
- Dairy: "milk bottle", "yogurt cup", "eggs"
- Bread: "bread loaf", "bakery"

The agent should use known-good Unsplash photo IDs (from the existing seed file or freshly searched) — verify each URL returns 200 before using.

---

## SQL Structure Requirements

- Use `ON CONFLICT (id) DO NOTHING` for idempotency
- Fixed UUIDs for categories, brands, products (so script is re-runnable)
- Use `gen_random_uuid()` for junction table rows (product_categories, post_medias, etc.)
- DELETE + re-insert pattern at top (like existing seed_minimarket.sql)
- Group inserts logically: categories → brands → products → product_sizes → product_stock → product_categories → product_medias → posts → post_medias → promotions → promotion_products → announcements → homepage_elements → demo_orders

---

## Key Schema Facts (from database.types.ts — use these, NOT DATABASE.md which is outdated)

### products
```sql
(id, name, price, status, description, category_id, brand_id, created_at, updated_at)
-- status: 'Published' | 'Draft'
-- category_id: direct FK (also insert into product_categories junction)
```

### product_sizes
```sql
(id, product_id, size, active, created_at)
```

### product_colors
```sql
(id, product_id, color, active, created_at)
```

### product_stock
```sql
(id, product_id, color_id, size_id, count, created_at)
-- field is 'count' NOT 'quantity'
-- color_id and size_id can be NULL for no-variant products
```

### product_medias
```sql
(id, product_id, arrangement, media_url, created_at, updated_at)
```

### product_categories
```sql
(id, product_id, category_id, created_at, updated_at)
```

### categories
```sql
(id, name, active, arrangement, media_url, created_at)
```

### brand
```sql
(id, name, media_url, active, created_at)
```

### posts
```sql
(id, name, caption, caption_position, photo_size, status, cta_text, active, created_at)
-- status: 'Published' | 'Draft'
-- caption_position: 'bottom' | 'top' | 'center'
-- photo_size: '1:1' | '4:5' | '16:9'
-- active: boolean
```

### post_medias
```sql
(post_id, media_url, media_type, arrangement, created_at)
-- media_type: 'image' | 'video'
```

### promotions
```sql
(id, name, description, discount_type, discount_value, start_date, end_date, active, code, max_uses, uses_count, created_at)
-- discount_type: 'percentage' | 'fixed' | 'bogo'
```

### promotion_products
```sql
(promotion_id, product_id)
-- NO id column
```

### announcements
```sql
(id, title, message, image_url, cta_label, cta_url, type, active, starts_at, ends_at, created_at)
-- type: 'banner' | 'promo' | 'info'
```

### homepage_elements
```sql
(id, arrangement, contentType, amount, active, created_at)
-- contentType: 'banner' | 'featured_products' | 'promotions'
-- amount: number of items to show (for featured_products)
```

### membership_tiers
```sql
(id, name, min_points, benefits, created_at)
```

### orders
```sql
(id, user_id, order_number, status, total_amount, shipping_address, notes, created_at, updated_at)
-- status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
```

### order_items
```sql
(id, order_id, product_id, color_id, size_id, quantity, price, created_at)
```

### payments
```sql
(id, order_id, amount, payment_method, payment_status, transaction_id, payment_gateway, paid_at, created_at)
-- payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
```

### order_status_logs
```sql
(id, order_id, status, notes, created_at)
```

### user_details
```sql
(id, full_name, email, phone, address, avatar_url, role, created_at, updated_at)
-- role: 'customer' | 'admin' | 'staff'
```
