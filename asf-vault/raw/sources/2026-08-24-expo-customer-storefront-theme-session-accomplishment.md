# Expo Customer App — Storefront Theme Session Accomplishment (2026-08-24)

**Date**: August 24–25, 2026  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo) + Supabase schema/seed  
**Stakeholder**: Stanley  
**Status**: Shipped on device (Storefront theme selectable in Appearance); formal QC Pass R1–R17; mock data is **functional but not final-curated** — see §10 follow-up  
**Git**: No commit/push performed in this session unless Stanley did so separately  

**Treat this file as the wiki source of truth** for the Storefront program and post-ship fixes from this chat.

**Related plan (IA/spec):** `raw/sources/2026-08-24-expo-customer-storefront-theme-plan.md`  
**Agent prompts:** deleted after execution (do not re-ingest).

---

## 1. What we set out to do

Add a **fourth theme pack** — **`storefront`** — as a **Classic clone** with new Home + Shop IA and notification chrome. Classic / Atelier / Noir remain unchanged.

| Program | Reference | Outcome |
|---------|-----------|---------|
| **Home** | Uniqlo-style newest products | Hero (newest) bleeds under nav; `最新商品` + 2×3 ranks 2–7 with swatches; post/promo blocks + load more |
| **Shop** | Taobao category browse | Flat sidebar (dept/range/cat/brand peers); right = next-level tiles + lazy 2-col products |
| **Notifications** | Bell beside cart | Home + Shop + Highlights → inbox with unread badge |
| **Platform** | Schema + seed + nav | Colorway medias, post↔product linking, PDP color preselect, linked-products route |

---

## 2. Decisions (locked)

| # | Decision |
|---|----------|
| 1 | **New pack** `storefront` — do **not** overwrite Classic |
| 2 | Default theme stays **`classic`**; Storefront selectable in **Appearance** (SUPERADMIN) |
| 3 | Home **hero** = **newest** product (`created_at` desc); tap → PDP |
| 4 | Home **grid** = products ranked **2nd–7th** only (2×3); hero not duplicated |
| 5 | Tile layout: **image → swatches → name → price**; swatch changes image; open PDP with **that color selected** |
| 6 | **Posts ≠ promotions** — posts = editorial/social; promos = offers |
| 7 | Post/promo block: **full-bleed image** + **2×3 linked products** (cap 6 on Home) |
| 8 | Tap post/promo **image** → **filtered product list** (all linked products, uncapped) |
| 9 | Post linking = **taxonomy auto-link ∪ explicit `post_products`**; one product may appear on many posts |
| 10 | **Load more** = mixed chronological older posts **and** promotions |
| 11 | Shop sidebar = **flat** `[...departments, ...ranges, ...categories, ...brands]` — **no hierarchy indentation** |
| 12 | Shop right = **next-level tiles** + **2-col product grid** with **lazy load** (Taobao layout) |
| 13 | Bell on **Home + Shop + Highlights**; unread badge → existing inbox |
| 14 | **No Next.js admin** this phase — migrations + SQL seed only |
| 15 | i18n: UI strings **en / zh-CN / ms**; content translations for seeded entities |
| 16 | Taxonomy spine: **department → range → category → brand** (fourth level is **brand**) |
| 17 | Shop drill-down when sidebar item selected: **next-level tiles + products below** (scroll together) |
| 18 | **Hero bleeds into top nav** (post-ship): hero image under status bar; search/bell/cart overlay with light scrim |
| 19 | **Notification back nav** (post-ship): bell passes `returnTo` so back returns to Home/Shop/Highlights, not Profile stack |
| 20 | **No admin UI** for post product picks — seed/SQL only for now |

### Shop next-level rules (data)

| Selected | Next-level tiles | Products |
|----------|------------------|----------|
| Department | Ranges with `department_id` | `products.department_id` |
| Range | Categories with `range_id` | `products.range_id` |
| Category | Distinct brands on products in category | `product_categories` ∪ `products.category_id` |
| Brand | (hide tile row) | `products.brand_id` |

Search **ANDs** with current selection (within selection, not global).

---

## 3. Schema shipped (migration)

**File:** `supabase/migrations/20260824100000_expo_customer_storefront_theme.sql` (+ `asf-2-next/supabase/migrations/` mirror)

| Change | Purpose |
|--------|---------|
| `product_medias.color_id` → FK `product_colors` | Swatch-driven product images on Home |
| `post_products (post_id, product_id)` PK | Explicit post↔product M2M |
| `posts.{department_id, range_id, category_id, brand_id}` | Taxonomy auto-link for posts |
| `ranges.department_id` | Shop hierarchy |
| `categories.range_id` | Shop hierarchy |
| `promotions.image_url` | Full-bleed promo blocks on Home |

Types regenerated/synced: `asf-customer-app/database.types.ts`, `asf-2-next/database.types.ts`, `asf-2-next/src/database.types.ts`.

---

## 4. Seed shipped (functional demo — not final curated)

| Migration | Role |
|-----------|------|
| `20260824110000_expo_customer_storefront_taxonomy_seed.sql` | Storefront tree `a21*` depts, `a22*` ranges, `a23*` cats, `a24*` brands; 20 footwear products remapped |
| `20260824120000_expo_customer_storefront_colorways_posts_seed.sql` | 27 colors + color medias; 8 posts; 4 promo images; post_products + taxonomy links |

**Known seed hygiene issues (P2 — redo in next program):**

- Legacy **herbal** depts/ranges still active alongside storefront tree → Shop flat sidebar shows extra peers
- Promos may be `status=DRAFT` while `active=true` — **code fixed** in `feedTimeline.ts` to not drop them; optional SQL to set `Published`
- Images are placeholder/stock URLs — not a cohesive brand shoot
- Mixed UUID schemes (`bbbbbbbb-*` products vs `a21*` taxonomy)
- Content translations exist but copy is not merchandising-polished

**Storefront UUID prefix map (demo):**

- Depts: `a2100001-24a8-4f00-8000-000000000001` … `000003` (男鞋 / 女鞋 / 配件护理)
- Ranges: `a2200001-…0001` … `000006`
- Categories: `a2300001-…0001` … `0012`
- Brands: `a2400001-…0001` … `0004`
- Products: `bbbbbbbb-1111-1111-1111-000000000001` … `000020`

---

## 5. App architecture shipped

### Theme pack

```
asf-customer-app/themes/storefront/
  index.ts, tokens.ts, tabBar.ts, CartChrome.tsx
  screens/{Home, Shop, ProductDetail, Highlights, ProfileHub, Locations}.tsx
```

Registered in `themes/types.ts` (`ThemeId` includes `"storefront"`), `themes/registry.ts`, Appearance i18n (`settings.themeStorefront` — 精品橱窗).

### Shared components

```
asf-customer-app/components/storefront/
  StorefrontProductTile.tsx      — image, swatches, name, price
  StorefrontTaxonomyTile.tsx     — Shop next-level tiles
  StorefrontFeedBlock.tsx        — post/promo image + product grid
  StorefrontHeaderActions.tsx    — search + bell + cart
  NotificationBellButton.tsx     — badge → inbox
```

### Lib helpers

```
asf-customer-app/lib/storefront/
  newestProducts.ts       — hero = [0], grid = slice(1,7)
  productColorMedia.ts    — resolve media URL for colorway
  linkedProducts.ts       — post taxonomy ∪ M2M; promo product_ids
  feedTimeline.ts         — merge/sort/paginate posts∪promos (page size 3)
  shopTaxonomy.ts           — flat sidebar, next-level, filters, paging
```

### Navigation

| Flow | Path / API |
|------|------------|
| PDP with color | `openBrowseProduct(router, id, { colorId?, returnTo? })` in `lib/browseNavigation.ts` |
| Linked products list | `/(tabs)/browse/linked-products?kind=post\|promotion&id=<uuid>` via `openLinkedProducts` |
| Notification inbox | `openNotificationInbox(router, { returnTo: "home"\|"shop"\|"highlights" })` in `lib/notificationNavigation.ts` |

### Context updates

- `ProductContext` — `product_colors`, `product_medias.color_id`
- `PostContext` — taxonomy FKs + `post_products`
- `PromotionContext` — `image_url` + `product_ids`
- `RangeContext` / categories — parent FKs on rows

---

## 6. Home IA (Storefront)

**Section A — Newest**

1. Hero (~½ viewport, **bleeds under overlay nav**) → newest product → PDP  
2. Title: `home.latestProducts` (最新商品 / Latest arrivals / Ketibaan terkini)  
3. 2×3 grid: ranks 2–7; `StorefrontProductTile` with swatches  

**Section B — Feed**

- Mixed post + promo blocks (newest first); full image + ≤6 linked product tiles  
- **Load more** appends older blocks; `home.feedEnd` when exhausted  
- Image tap → linked-products list (full set)  

**Overlay header:** `StorefrontHomeOverlayHeader` — absolute over scroll; light scrim for icon readability.

---

## 7. Shop IA (Storefront)

- Left: flat list of all departments, ranges, categories, brands (peers, no indent)  
- Right: next-level tile grid (3-col) + 2-col product grid, `SHOP_PRODUCT_PAGE_SIZE = 20`, `onEndReached` lazy load  
- Default selection: first department  

---

## 8. Post-ship fixes (same session)

| Issue | Fix |
|-------|-----|
| Promo blocks missing on Home | `feedTimeline.ts` — don't reject `active` promos solely for `status=DRAFT` |
| Push ERROR spam in Expo Go | `pushNotifications.ts` + `PushTokenRegistrar.tsx` — skip/soft-fail in Expo Go |
| WarrantyCredit embed WARN | `WarrantyCreditContext.tsx` — `claim_items!warranty_credits_claim_item_id_fkey(...)` |
| Notification back → Appearance | `notificationNavigation.ts` + `returnTo` on bell; custom back on notifications screen |
| Splash flash / black box | `SplashIntro.tsx`, `splashScreen.ts`, `build_splash_intro.py`, `app.json` — hide native splash on `p2m:ready`, white WebView/bg, preload HTML (**native rebuild required**) |

---

## 9. QC outcome (Agent 10)

- **R1–R17:** Pass (code + SQL evidence)  
- **Ship-ready:** YES  
- **UNVERIFIED-UI:** full device matrix not run in QC pass  
- **Open P2:** badge accent not Storefront tokens; seed hygiene; optional promo `status` SQL  

Formal checklist lives in plan §11 (`2026-08-24-expo-customer-storefront-theme-plan.md`).

---

## 10. Explicit follow-up (next program)

Stanley intends a **full mock-data redo** — highly curated catalog, posts, promos, taxonomy, **and generated/uploaded images** (colorways, tiles, hero, post/promo banners). Current seed proves features but is messy.

Recommended next chat scope:

1. **Reset or replace** storefront + legacy herbal overlap in taxonomy  
2. **Fixed UUID scheme** and documented entity map  
3. **Cohesive brand** (footwear retailer) — zh canonical + en/ms translations  
4. **Per-color product medias** for all showcased SKUs  
5. **Posts** — one per taxonomy link style + M2M + multi-post product proof  
6. **Promotions** — `image_url`, `Published` status, product links  
7. **Image pipeline** — generate/upload to Supabase storage or stable CDN; unique URLs per colorway  
8. Optional: filter Shop sidebar to storefront-only tree for demos  

See handoff prompt Stanley will paste into the next chat (provided separately in coordinator response).

---

## 11. Files index (high-signal)

### Migrations
- `supabase/migrations/20260824100000_expo_customer_storefront_theme.sql`
- `supabase/migrations/20260824110000_expo_customer_storefront_taxonomy_seed.sql`
- `supabase/migrations/20260824120000_expo_customer_storefront_colorways_posts_seed.sql`

### Theme + UI
- `asf-customer-app/themes/storefront/**`
- `asf-customer-app/components/storefront/**`
- `asf-customer-app/lib/storefront/**`
- `asf-customer-app/lib/notificationNavigation.ts`
- `asf-customer-app/app/(tabs)/browse/linked-products.tsx`

### Splash / push / warranty
- `asf-customer-app/components/SplashIntro.tsx`
- `asf-customer-app/lib/splashScreen.ts`
- `asf-customer-app/lib/pushNotifications.ts`
- `asf-customer-app/context/WarrantyCreditContext.tsx`

---

## 12. Related wiki

- [[wiki/concepts/expo-customer-theme-skins-asf-2]] — theme pack system (Classic/Atelier/Noir); Storefront is fourth pack  
- [[wiki/sources/2026-07-28-expo-customer-notifications-plan]] — inbox/push (bell reuses)  
- [[wiki/concepts/pixel2motion-splash-asf-2]] — splash pipeline (updated behavior)  
- [[wiki/sources/2026-08-24-expo-customer-storefront-theme-plan]] — detailed IA + QC checklist  

---

## 13. Verification quick path

1. Appearance → **Storefront** / **精品橱窗**  
2. **Home:** hero bleed + grid swatches + post/promo feed + load more  
3. **Shop:** flat sidebar + tiles + lazy products  
4. **Bell:** Home/Shop/Highlights → inbox → **back returns to origin tab**  
5. **Linked list:** tap post/promo image → full product list  
6. **Cold start:** white splash → animation (after native rebuild)  
