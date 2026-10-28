# Expo Customer — Storefront Curated Seed — Plan (2026-08-25)

**Project**: ASF-2 — `asf-customer-app` Storefront theme demo data  
**Repo root**: `/Users/stanley/Documents/GIthub/asf-2`  
**Date**: August 25, 2026  
**Stakeholder**: Stanley  
**Status**: Planned — **not started** (awaiting agent execution)  
**Companion prompts**: `raw/sources/2026-08-25-expo-customer-storefront-curated-seed-agent-prompts.md`

**Builds on (read first):**
- `raw/sources/2026-08-24-expo-customer-storefront-theme-session-accomplishment.md` — shipped Storefront IA + schema
- `raw/sources/2026-08-24-expo-customer-storefront-theme-plan.md` — IA rules, linked-product resolver, QC §11
- Existing migrations: `supabase/migrations/202608241*.sql` (schema + old demo seed)

**Out of scope:**
- Storefront UI code changes (unless seed exposes a real bug)
- Next.js admin UI
- Commit / push unless Stanley asks
- RLS hardening

---

## 1. Mission

Replace the **functional but messy** Storefront demo seed with a **cohesive premium footwear catalog** so Home (hero, swatches, posts, promos, load-more) and Shop (flat taxonomy sidebar, category grids) look **production-ready**.

Includes **AI-generated studio photography**, upload to Supabase Storage, and **per-product QC** so image matches SKU description (e.g. leather derby ≠ sport shoe).

---

## 2. Locked decisions (Stanley 2026-08-25)

| # | Decision |
|---|----------|
| 1 | **Soft-delete** legacy herbal taxonomy (`deleted_at` + `active=false`) — hides from Expo contexts (`active=true` filter) |
| 2 | **New UUID scheme + new catalog rows** — soft-delete old storefront demo (`a21*` tax, `bbbb*` products, `cccc*` posts, `3333*` promos) |
| 3 | **No 儿童 department** — 3 depts only |
| 4 | **8 SKUs per footwear category**, **4 SKUs per accessory category** → **80 products** |
| 5 | Canonical copy **zh-CN** on `name`; **en + ms** in translation tables |
| 6 | Brand `name` = **zh canonical** (e.g. 模力); Latin names in `brand_translations` |
| 7 | **10 posts**, each resolving to **≥6 linked products** (Home 2×3); explicit posts target **6–8** |
| 8 | **4–6 promos**, each with **6–8** `promotion_products`; `status = Published`, `active = true`, end **2026-12-31** |
| 9 | Images: **AI studio packshots** → public Supabase buckets; **no raw Unsplash URLs** in final seed |
| 10 | Image phasing strategy — **TBD by Stanley**; agent pack supports sequential gen + QC per category |
| 11 | Mirror migrations to `asf-2-next/supabase/migrations/` when applying |
| 12 | Final handoff doc: `raw/sources/2026-08-25-expo-customer-storefront-curated-seed-accomplishment.md` |

---

## 3. Catalog summary

| Entity | Count |
|--------|-------|
| Departments | 3 |
| Ranges | 6 (2 per dept) |
| Categories | 12 (2 per range) |
| Brands | 6 |
| Products | **80** (64 footwear + 16 accessories) |
| Posts | **10** |
| Promotions | **4–6** |
| Product colorways (est.) | ~208 footwear ×3 + ~24 accessory ≈ **220** |
| Product images (est.) | ~320 colorway + ~80 fallback ≈ **400** |
| Taxonomy tile images | **27** |
| Post editorials | **10** |
| Promo banners | **4–6** |
| **Total images (est.)** | **~440–450** |

---

## 4. Taxonomy tree

### 4.1 Departments

| UUID | zh `name` | en | ms |
|------|-----------|----|----|
| `a3100001-24a8-4f00-8000-000000000001` | 男鞋 | Men's footwear | Kasut lelaki |
| `a3100001-24a8-4f00-8000-000000000002` | 女鞋 | Women's footwear | Kasut wanita |
| `a3100001-24a8-4f00-8000-000000000003` | 配件护理 | Accessories & care | Aksesori & penjagaan |

### 4.2 Ranges

| UUID | zh | Dept UUID |
|------|-----|-----------|
| `a3200001-24a8-4f00-8000-000000000001` | 运动休闲 | 男鞋 |
| `a3200001-24a8-4f00-8000-000000000002` | 正装通勤 | 男鞋 |
| `a3200001-24a8-4f00-8000-000000000003` | 日常通勤 | 女鞋 |
| `a3200001-24a8-4f00-8000-000000000004` | 时尚靴履 | 女鞋 |
| `a3200001-24a8-4f00-8000-000000000005` | 穿戴配件 | 配件护理 |
| `a3200001-24a8-4f00-8000-000000000006` | 护理精选 | 配件护理 |

### 4.3 Categories

| UUID | zh | Range UUID | SKUs |
|------|-----|------------|------|
| `a3300001-24a8-4f00-8000-000000000001` | 跑鞋 | 运动休闲 | 8 |
| `a3300001-24a8-4f00-8000-000000000002` | 板鞋球场 | 运动休闲 | 8 |
| `a3300001-24a8-4f00-8000-000000000003` | 正装皮鞋 | 正装通勤 | 8 |
| `a3300001-24a8-4f00-8000-000000000004` | 男靴 | 正装通勤 | 8 |
| `a3300001-24a8-4f00-8000-000000000005` | 一脚蹬 | 日常通勤 | 8 |
| `a3300001-24a8-4f00-8000-000000000006` | 休闲运动鞋 | 日常通勤 | 8 |
| `a3300001-24a8-4f00-8000-000000000007` | 短靴 | 时尚靴履 | 8 |
| `a3300001-24a8-4f00-8000-000000000008` | 时尚高帮 | 时尚靴履 | 8 |
| `a3300001-24a8-4f00-8000-000000000009` | 包袋 | 穿戴配件 | 4 |
| `a3300001-24a8-4f00-8000-000000000010` | 帽袜 | 穿戴配件 | 4 |
| `a3300001-24a8-4f00-8000-000000000011` | 护理套装 | 护理精选 | 4 |
| `a3300001-24a8-4f00-8000-000000000012` | 腰带与小物 | 护理精选 | 4 |

### 4.4 Brands (zh canonical `name`)

| UUID | zh `name` | en | ms |
|------|-----------|----|----|
| `a3400001-24a8-4f00-8000-000000000001` | 模力 | MODEL MATCH | MODEL MATCH |
| `a3400001-24a8-4f00-8000-000000000002` | ASF 工作室 | ASF Studio | ASF Studio |
| `a3400001-24a8-4f00-8000-000000000003` | 球场线 | Courtline | Courtline |
| `a3400001-24a8-4f00-8000-000000000004` | 越野型 | Trailform | Trailform |
| `a3400001-24a8-4f00-8000-000000000005` | 柔步 | Softstep | Softstep |
| `a3400001-24a8-4f00-8000-000000000006` | 北径 | Nordpath | Nordpath |

---

## 5. UUID scheme (new catalog)

| Entity | Prefix pattern | Example |
|--------|----------------|---------|
| Department | `a3100001-24a8-4f00-8000-0000000000NN` | …000001 |
| Range | `a3200001-…` | …000001 |
| Category | `a3300001-…` | …000001 |
| Brand | `a3400001-…` | …000001 |
| Product | `ddddCCSS-24a8-4f00-8000-0000000000NN` | CC=category 01–12, SS=slot 01–08 |
| Product color | `a350PPPP-24a8-4f00-8000-0000000000NN` | PPPP encodes product |
| Product media | `a360PPPP-24a8-4f00-8000-0000000000NN` | |
| Post | `eeee0001-24a8-4f00-8000-0000000000NN` | …000001–010 |
| Post media | `a3700001-…` | |
| Promotion | `44440001-24a8-4f00-8000-0000000000NN` | …000001–006 |

**Product UUID rule:** `dddd` + 2-digit category index + 2-digit slot:

- Category 01 slot 3 → `dddd0103-24a8-4f00-8000-000000000003`
- Category 09 slot 2 → `dddd0902-24a8-4f00-8000-000000000002`

**Home hero ordering:** Stagger `products.created_at` DESC so ranks 1–7 are **footwear heroes** (not socks/care). Recommended newest:

1. `dddd0101` 云感缓震跑鞋 (hero)
2. `dddd0102` 轻量训练跑鞋
3. `dddd0201` 经典白网球鞋
4. `dddd0501` 针织一脚蹬
5. `dddd0601` 厚底老爹鞋
6. `dddd0701` 麂皮短靴
7. `dddd0801` 夜色街头高帮

Grid = ranks 2–7 per Storefront `newestProducts.ts`.

---

## 6. Full product catalog (80 SKUs)

**Columns:** slot · UUID · zh `name` · brand · RM price · colorways (hex labels) · images to generate

**Footwear:** 3 colorways + 1 fallback each (4 images/SKU)  
**Accessories:** 1–2 colorways + 1 fallback (2–3 images/SKU)

### Cat 01 — 跑鞋 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0101-…000001 | 云感缓震跑鞋 | 模力 | 279 | #F5F5F5 / #111111 / #4A6670 |
| 02 | dddd0102-…000002 | 轻量训练跑鞋 | ASF 工作室 | 259 | #111111 / #DC2626 / #FFFFFF |
| 03 | dddd0103-…000003 | 公路竞速跑鞋 | 北径 | 329 | #CAFF00 / #111111 / #FFFFFF |
| 04 | dddd0104-…000004 | 日常慢跑鞋 | 柔步 | 239 | #F5F0E8 / #9CA3AF / #1E3A5F |
| 05 | dddd0105-…000005 | 稳定支撑跑鞋 | 越野型 | 299 | #365314 / #111111 / #EA580C |
| 06 | dddd0106-…000006 | 透气网面跑鞋 | 模力 | 249 | #FFFFFF / #99F6E4 / #111111 |
| 07 | dddd0107-…000007 | 厚底缓震跑鞋 | ASF 工作室 | 289 | #6B7280 / #7C3AED / #FFFFFF |
| 08 | dddd0108-…000008 | 城市夜跑反光跑鞋 | 北径 | 269 | #111111 / #C0C0C0 / #0284C7 |

### Cat 02 — 板鞋球场 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0201-…000001 | 经典白网球鞋 | 球场线 | 199 | #FFFFFF / #111111 / #1E3A5F |
| 02 | dddd0202-…000002 | 复古低帮板鞋 | 模力 | 219 | #FFFFFF+#DC2626 / #111111 / #F5F0E8 |
| 03 | dddd0203-…000003 | 高帮街头板鞋 | ASF 工作室 | 249 | #111111 / #FFFFFF / #7F1D1D |
| 04 | dddd0204-…000004 | 麂皮球场鞋 | 球场线 | 269 | #92400E / #FFFFFF / #6B7280 |
| 05 | dddd0205-…000005 | 厚底老爹板鞋 | 模力 | 259 | #E5E7EB / #111111 / #F472B6 |
| 06 | dddd0206-…000006 | 帆布低帮经典 | 柔步 | 149 | #FFFFFF / #1E3A5F / #D6C6A8 |
| 07 | dddd0207-…000007 | 联名涂鸦板鞋 | ASF 工作室 | 279 | #FFFFFF / #111111 / #EA580C |
| 08 | dddd0208-…000008 | 轻量滑板鞋 | 北径 | 229 | #111111 / #FFFFFF / #15803D |

### Cat 03 — 正装皮鞋 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0301-…000001 | 极简德比皮鞋 | 球场线 | 349 | #78350F / #111111 / #A8A29E |
| 02 | dddd0302-…000002 | 牛津正装鞋 | 模力 | 379 | #111111 / #451A03 / #7F1D1D |
| 03 | dddd0303-…000003 | 孟克搭扣皮鞋 | ASF 工作室 | 359 | #92400E / #111111 / #D6C6A8 |
| 04 | dddd0304-…000004 | 便士乐福鞋 | 球场线 | 279 | #111111 / #78350F / #14532D |
| 05 | dddd0305-…000005 | 布洛克雕花皮鞋 | 模力 | 399 | #78350F / #111111 / #CA8A04 |
| 06 | dddd0306-…000006 | 漆皮晚宴鞋 | ASF 工作室 | 429 | #111111 / #7F1D1D / #FFFFFF |
| 07 | dddd0307-…000007 | 软底通勤皮鞋 | 柔步 | 319 | #111111 / #6B7280 / #78350F |
| 08 | dddd0308-…000008 | 双扣孟克鞋 | 北径 | 369 | #92400E / #111111 / #4D7C0F |

### Cat 04 — 男靴 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0401-…000001 | 切尔西靴 | 越野型 | 399 | #111111 / #78350F / #D6C6A8 |
| 02 | dddd0402-…000002 | 工装马丁靴 | 北径 | 379 | #111111 / #78350F / #D4A574 |
| 03 | dddd0403-…000003 | 沙漠靴 | 模力 | 329 | #D6C6A8 / #92400E / #6B7280 |
| 04 | dddd0404-…000004 | 登山中帮靴 | 越野型 | 359 | #365314 / #6B7280 / #92400E |
| 05 | dddd0405-…000005 | 侧拉链靴 | ASF 工作室 | 389 | #111111 / #CA8A04 / #6B7280 |
| 06 | dddd0406-…000006 | 防水通勤靴 | 北径 | 369 | #111111 / #14532D / #78350F |
| 07 | dddd0407-…000007 | 绒面 chukka 靴 | 球场线 | 339 | #92400E / #6B7280 / #1E3A5F |
| 08 | dddd0408-…000008 | 厚底机能靴 | 模力 | 349 | #111111 / #FFFFFF / #4D7C0F |

### Cat 05 — 一脚蹬 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0501-…000001 | 针织一脚蹬 | 柔步 | 179 | #FBCFE8 / #9CA3AF / #111111 |
| 02 | dddd0502-…000002 | 皮革懒人鞋 | 模力 | 219 | #111111 / #78350F / #FFFFFF |
| 03 | dddd0503-…000003 | 蝴蝶结平底一脚蹬 | ASF 工作室 | 199 | #F5F0E8 / #111111 / #FECDD3 |
| 04 | dddd0504-…000004 | 乐福式一脚蹬 | 球场线 | 249 | #111111 / #78350F / #7F1D1D |
| 05 | dddd0505-…000005 | 编织透气一脚蹬 | 柔步 | 169 | #FFFFFF / #93C5FD / #9CA3AF |
| 06 | dddd0506-…000006 | 厚底一脚蹬 | 模力 | 229 | #FFFFFF / #111111 / #D6C6A8 |
| 07 | dddd0507-…000007 | 麂皮一脚蹬 | ASF 工作室 | 239 | #6B7280 / #92400E / #14532D |
| 08 | dddd0508-…000008 | 极简套脚便鞋 | 北径 | 189 | #111111 / #FFFFFF / #D6C6A8 |

### Cat 06 — 休闲运动鞋 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0601-…000001 | 厚底老爹鞋 | 模力 | 249 | #FFFFFF / #9CA3AF / #F472B6 |
| 02 | dddd0602-…000002 | 袜套跑鞋 | ASF 工作室 | 199 | #111111 / #FFFFFF / #7C3AED |
| 03 | dddd0603-…000003 | 复古跑鞋 | 柔步 | 219 | #F5F0E8 / #DC2626 / #2563EB |
| 04 | dddd0604-…000004 | 轻量网面休闲鞋 | 北径 | 209 | #FFFFFF / #15803D / #9CA3AF |
| 05 | dddd0605-…000005 | 平台休闲鞋 | 模力 | 239 | #FFFFFF / #111111 / #D6C6A8 |
| 06 | dddd0606-…000006 | 拼色休闲鞋 | ASF 工作室 | 229 | #FFFFFF+#EA580C / #111111 / #2563EB+#FFFFFF |
| 07 | dddd0607-…000007 | 缓震步行鞋 | 柔步 | 199 | #9CA3AF / #F472B6 / #1E3A5F |
| 08 | dddd0608-…000008 | 城市通勤运动鞋 | 球场线 | 259 | #FFFFFF / #111111 / #78350F |

### Cat 07 — 短靴 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0701-…000001 | 麂皮短靴 | 越野型 | 369 | #92400E / #111111 / #6B7280 |
| 02 | dddd0702-…000002 | 切尔西女靴 | 模力 | 349 | #111111 / #78350F / #D6C6A8 |
| 03 | dddd0703-…000003 | 粗跟短靴 | ASF 工作室 | 329 | #111111 / #7F1D1D / #D6C6A8 |
| 04 | dddd0704-…000004 | 马丁风短靴 | 北径 | 359 | #111111 / #78350F / #FFFFFF |
| 05 | dddd0705-…000005 | 方头短靴 | 模力 | 339 | #111111 / #FFFFFF / #78350F |
| 06 | dddd0706-…000006 | 拉链侧开短靴 | 球场线 | 319 | #111111 / #6B7280 / #14532D |
| 07 | dddd0707-…000007 | 防水短靴 | 越野型 | 379 | #111111 / #14532D / #78350F |
| 08 | dddd0708-…000008 | 绒里保暖短靴 | 柔步 | 299 | #92400E / #111111 / #D6C6A8 |

### Cat 08 — 时尚高帮 (8)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0801-…000001 | 夜色街头高帮 | 模力 | 299 | #111111 / #7C3AED / #FFFFFF |
| 02 | dddd0802-…000002 | 帆布高帮 | ASF 工作室 | 189 | #FFFFFF / #111111 / #DC2626 |
| 03 | dddd0803-…000003 | 厚底高帮 | 模力 | 269 | #FFFFFF / #F472B6 / #111111 |
| 04 | dddd0804-…000004 | 皮革高帮 | 球场线 | 289 | #111111 / #78350F / #FFFFFF |
| 05 | dddd0805-…000005 | 绑带高帮 | 北径 | 249 | #6B7280 / #111111 / #15803D |
| 06 | dddd0806-…000006 | 平台高帮 | ASF 工作室 | 279 | #FFFFFF / #111111 / #C0C0C0 |
| 07 | dddd0807-…000007 | 复古篮球高帮 | 模力 | 259 | #FFFFFF+#DC2626 / #111111 / #2563EB |
| 08 | dddd0808-…000008 | 轻量高帮休闲 | 柔步 | 219 | #F5F0E8 / #9CA3AF / #1E3A5F |

### Cat 09 — 包袋 (4)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd0901-…000001 | 迷你斜挎包 | 柔步 | 129 | #111111 / #78350F |
| 02 | dddd0902-…000002 | 托特购物袋 | 模力 | 99 | #F5F0E8 / #111111 |
| 03 | dddd0903-…000003 | 双肩通勤包 | ASF 工作室 | 189 | #111111 / #1E3A5F |
| 04 | dddd0904-…000004 | 皮质手拿包 | 模力 | 149 | #78350F / #111111 |

### Cat 10 — 帽袜 (4)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd1001-…000001 | 品牌棒球帽 | 模力 | 79 | #111111 / #F5F0E8 / #1E3A5F |
| 02 | dddd1002-…000002 | 船员袜三双装 | 柔步 | 39 | #FFFFFF / #9CA3AF / #111111 |
| 03 | dddd1003-…000003 | 运动短袜三双装 | ASF 工作室 | 45 | #FFFFFF / #111111 / #2563EB |
| 04 | dddd1004-…000004 | 针织冷帽 | ASF 工作室 | 69 | #111111 / #6B7280 / #7F1D1D |

### Cat 11 — 护理套装 (4)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd1101-…000001 | 鞋类护理四件套 | 球场线 | 59 | standard |
| 02 | dddd1102-…000002 | 麂皮护理套装 | 越野型 | 69 | standard |
| 03 | dddd1103-…000003 | 皮革清洁套装 | 模力 | 49 | standard |
| 04 | dddd1104-…000004 | 小白鞋清洁套装 | ASF 工作室 | 55 | standard |

### Cat 12 — 腰带与小物 (4)

| Slot | UUID | zh name | Brand | RM | Colorways |
|------|------|---------|-------|-----|-----------|
| 01 | dddd1201-…000001 | 真皮腰带 | 柔步 | 89 | #111111 / #78350F |
| 02 | dddd1202-…000002 | 编织休闲腰带 | 模力 | 79 | #1E3A5F / #78350F |
| 03 | dddd1203-…000003 | 鞋拔金属款 | 球场线 | 35 | #C0C0C0 / #111111 |
| 04 | dddd1204-…000004 | 鞋带三双装 | 柔步 | 29 | #FFFFFF / #111111 / #9CA3AF |

Each product also needs `product_translations` (en, ms), `product_categories` row, `product_stock` (qty ≥ 10), `status = Published`, full taxonomy FKs.

---

## 7. Posts (10)

| UUID | zh name | Link type | FK / explicit | Min linked |
|------|---------|-----------|---------------|------------|
| eeee0001-…000001 | 男鞋新季精选 | department | 男鞋 | 6 (auto 32) |
| eeee0001-…000002 | 运动休闲系列 | range | 男·运动休闲 | 6 (auto 16) |
| eeee0001-…000003 | 球场经典分类 | category | 板鞋球场 | 6 (auto 8) |
| eeee0001-…000004 | 球场线品牌故事 | brand | 球场线 | 6 |
| eeee0001-…000005 | 造型师精选 A | post_products | 8 explicit SKUs | 8 |
| eeee0001-…000006 | 造型师精选 B | post_products | 8 explicit SKUs | 8 |
| eeee0001-…000007 | 女鞋日常灵感 | department | 女鞋 | 6 (auto 32) |
| eeee0001-…000008 | 短靴衣橱必备 | category | 短靴 | 6 (auto 8) |
| eeee0001-…000009 | 穿戴配件点睛 | category + post_products | 包袋 4 + 帽袜 2 explicit | 6 |
| eeee0001-…000010 | 越野型户外特辑 | brand | 越野型 | 6 |

**M2M proof:** `dddd0201` 经典白网球鞋 on post #3 and post #5.

**Stylist A explicit SKUs (example):** dddd0101, dddd0201, dddd0203, dddd0301, dddd0401, dddd0601, dddd0701, dddd0801

**Stylist B explicit SKUs:** dddd0501, dddd0602, dddd0702, dddd0801, dddd0803, dddd0503, dddd0605, dddd0704

Each post: `post_medias` (1 full-bleed), `post_translations` en/ms, `status = Published`, `active = true`.

---

## 8. Promotions (4–6)

| UUID | zh name | promotion_products count |
|------|---------|---------------------------|
| 44440001-…000001 | 新会员首单 15% | 8 |
| 44440001-…000002 | 模力全场 10% | 8 |
| 44440001-…000003 | 会员专属减 RM20 | 8 |
| 44440001-…000004 | 球鞋季特惠 12% | 8 |
| 44440001-…000005 | 配件加购礼 (opt) | 6 |
| 44440001-…000006 | 正装通勤季 (opt) | 6 |

All: `image_url` set, `status = Published`, `active = true`, `start_date` ≤ now, `end_date = 2026-12-31`.

---

## 9. Cleanup strategy (Agent 01)

**Soft-delete herbal taxonomy** (active=false; set deleted_at if column exists):

- Departments: 健康与预防, 草本医学, 治疗性草本 (+ any other non-storefront active herbal)
- Their ranges (免疫增强, 消化健康, etc.)
- Herbal brands (传统草本公司, 古方本草, etc.)

**Soft-delete old storefront demo:**

- Taxonomy `a2100001*`, `a2200001*`, `a2300001*`, `a2400001*`
- Products `bbbbbbbb-1111-1111-1111-*`
- Posts `cccccccc-1111-1111-1111-*`
- Promos `33330000-0000-0000-0000-*`
- Related colors/medias/translations where safe

**Do not** hard-delete rows referenced by live orders if soft-delete suffices.

---

## 10. Image generation standards

### 10.1 Style lock (all product packshots)

- Pure white or very light warm gray background (#F7F7F5)
- Single shoe / item, **3/4 front angle**, soft studio shadow
- **No model**, no busy props
- Premium e-commerce (MODEL MATCH / ASF Studio tone)
- **Each colorway = distinct photo** (not recolor filter)

### 10.2 Category → silhouette rules (QC critical)

| Category | Must show | Must NOT show |
|----------|-----------|---------------|
| 跑鞋 | Running shoe, mesh, cushioned sole | Dress shoe, boot, sandal |
| 板鞋球场 | Low/court sneaker, flat sole | Running shoe with heavy tread |
| 正装皮鞋 | Leather dress shoe, oxford/derby/loafer | Sneaker, boot |
| 男靴 | Ankle/mid boot | Low sneaker, sandal |
| 一脚蹬 | Slip-on, no laces | High-top, boot |
| 休闲运动鞋 | Casual sneaker | Formal leather |
| 短靴 | Ankle boot, women's | Sneaker, knee-high |
| 时尚高帮 | High-top shoe | Low court, boot |
| 包袋 | Bag product shot | Footwear |
| 帽袜 | Cap or sock pack | Shoes |
| 护理套装 | Bottles/brushes kit flat lay | Footwear |
| 腰带与小物 | Belt/shoehorn/laces | Full shoes |

### 10.3 QC rubric (per image — mandatory before URL commit)

| Check | Pass |
|-------|------|
| Category silhouette | Matches §10.2 |
| Colorway | Dominant color matches hex label |
| Background | Clean studio white |
| Duplicate | Not same file as another colorway |
| Accessory vs shoe | Correct product type |
| zh name sanity | 漆皮晚宴鞋 looks formal, not canvas sneaker |

Failed QC → **regenerate** (max 3 attempts); log failure in manifest.

### 10.4 Storage

- Buckets (public): `product_medias`, `post_medias`, `medias` (taxonomy tiles → `medias` or consistent path)
- Path convention: `storefront-curated/2026-08/{entity}/{uuid}/{filename}.webp`
- Final URLs: `https://gswszoljvafugtdikimn.supabase.co/storage/v1/object/public/{bucket}/{path}`

### 10.5 Manifest file (shared across agents)

`asf-2-next/scripts/storefront-curated-seed/manifest.json` (create if missing):

```json
{
  "version": "2026-08-25",
  "products": { "dddd0101-...": { "colorways": [{ "colorId": "...", "url": "...", "qc": "pass" }] } },
  "taxonomy": {},
  "posts": {},
  "promotions": {}
}
```

Image agents append; QC agents set `"qc": "pass"|"fail"`.

---

## 11. Agent pack overview (38 agents)

Designed for **~200k context** models: each agent owns one coherent slice; image work is **one category per agent** with **inline QC** before moving to next SKU.

```
PHASE A — SQL platform (Agents 01–14)
  01 Cleanup
  02 Taxonomy + translations
  03–14 Product seed (1 category per agent, 12 agents)

PHASE B — Taxonomy images (Agent 15)

PHASE C — Product images (Agents 16–27, 1 category each, gen+QC)

PHASE D — Editorial (Agents 28–29 posts seed, 30–31 promos seed)

PHASE E — Post/promo images (Agents 32–36)

PHASE F — Finish (Agents 37–38 apply/verify + accomplishment doc)
```

| Agent | Slice | Est. output size |
|-------|--------|------------------|
| 01 | Cleanup migration | 1 SQL file |
| 02 | Taxonomy + 4 translation tables | 1 SQL file |
| 03–14 | 4–8 products + colors + translations + stock each | 12 SQL files |
| 15 | 27 taxonomy tile images + URL updates | manifest + SQL |
| 16–27 | 4–32 product images + medias SQL each | manifest + SQL |
| 28 | Posts 1–5 seed | 1 SQL file |
| 29 | Posts 6–10 seed | 1 SQL file |
| 30 | Promos 1–3 seed | 1 SQL file |
| 31 | Promos 4–6 seed | 1 SQL file |
| 32–35 | Post editorial images (2–3 posts each) | images + SQL |
| 36 | Promo banner images (4–6) | images + SQL |
| 37 | Merge migrations, apply Supabase MCP, run §11.2 SQL | applied + counts |
| 38 | Accomplishment vault doc + P2 list | 1 markdown file |

**Parallelism:** Agents 03–14 can run **in parallel** after 01–02. Agents 16–27 can run **in parallel** after product seed + Agent 15 (taxonomy tiles optional before products). Post/promo image agents after seed agents 28–31.

**Sequential fallback:** If image parallel causes QC drift, run 16→17→…→27 strictly in order.

---

## 12. Verification SQL (Agent 37)

```sql
-- Taxonomy
SELECT COUNT(*) AS depts FROM departments WHERE active = true;
SELECT COUNT(*) AS ranges_linked FROM ranges WHERE department_id IS NOT NULL AND active = true;
SELECT COUNT(*) AS cats_linked FROM categories WHERE range_id IS NOT NULL AND active = true;
SELECT COUNT(*) AS brands FROM brand WHERE active = true;

-- Products
SELECT COUNT(*) AS products FROM products WHERE status = 'Published' AND deleted_at IS NULL;
SELECT category_id, COUNT(*) FROM products WHERE deleted_at IS NULL GROUP BY 1 ORDER BY 1;

-- Swatches
SELECT COUNT(*) AS colors FROM product_colors WHERE active = true;
SELECT COUNT(*) AS color_medias FROM product_medias WHERE color_id IS NOT NULL;

-- Posts / promos
SELECT COUNT(*) AS posts FROM posts WHERE active = true;
SELECT COUNT(*) AS post_products FROM post_products;
SELECT product_id, COUNT(*) AS post_count FROM post_products GROUP BY 1 HAVING COUNT(*) >= 2;
SELECT COUNT(*) AS promos FROM promotions WHERE image_url IS NOT NULL AND active = true AND status = 'Published';
SELECT promotion_id, COUNT(*) FROM promotion_products GROUP BY 1;
```

**Pass bar:** 3 depts, 6 ranges linked, 12 cats linked, 6 brands, **80** products, ≥200 colors, ≥200 color medias, 10 posts, ≥2 post_products rows with multi-post product, 4+ promos with images, each promo ≥6 links.

---

## 13. App verification (Storefront theme)

Per session accomplishment §13:

1. Appearance → Storefront
2. Home: hero = newest footwear; grid 2–7; swatches swap; feed posts+promos; load more
3. Shop: flat sidebar **only footwear tree** (no herbal); category select shows **8 or 4** products
4. Linked list: post/promo image → full product list (≥6)
5. Bell back nav unchanged

---

## 14. Deliverables

1. Idempotent migrations under `supabase/migrations/20260825*` (+ mirror)
2. `manifest.json` with all image URLs + QC status
3. `raw/sources/2026-08-25-expo-customer-storefront-curated-seed-accomplishment.md`
4. SQL verification output pasted in accomplishment doc

---

## 15. P2 (document, do not block)

- Order history may reference soft-deleted product UUIDs → missing name in admin
- Shop sidebar still shows all active brands globally (herbal brands hidden after cleanup)
- Native splash rebuild (unrelated)
- Promo `status` filtering inconsistency across themes (Storefront feed already tolerates DRAFT)
