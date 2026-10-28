# Expo Customer — Storefront Theme (Classic Clone) — Plan (2026-08-24)

**Project**: ASF-2 — primarily `asf-customer-app/` (Expo); schema/seed via Supabase migrations (+ optional MCP apply)  
**Date**: August 24, 2026  
**Status**: Shipped (2026-08-24 session); see session SOT below  
**Stakeholder**: Stanley  
**Session SOT**: `2026-08-24-expo-customer-storefront-theme-session-accomplishment.md`  
**Agent prompts**: deleted after execution

**Builds on:**
- Theme skins: Classic / Atelier / Noir (`themes/`, `ThemeContext`, Appearance SUPERADMIN)
- Classic Home R4 / Shop / PDP / Highlights — **clone as starting point; Storefront replaces IA for this pack only**
- Notifications inbox + prefs + `NotificationContext` unread count (bell is chrome only)
- Catalog taxonomy spine: **department → range → category → brand**
- Promotions ↔ products: `promotion_products`
- Posts: editorial media today; **no product link** (gap)
- i18n: `en` / `zh-CN` / `ms` + content translation tables for catalog entities
- Home helpers: `lib/homeLayout.ts`, `components/home/*` (reuse metrics where useful; Storefront IA is new)

**Out of scope (this program):**
- Next.js admin UI for attaching products to posts, promo images, or taxonomy CRUD
- Changing Classic / Atelier / Noir **screen IA** (Appearance may list the new theme only)
- Staff-app push / new notification producers
- Full RLS hardening of all public catalog tables (note as follow-up; do not block Expo)
- Atelier FAB cart behavior on Storefront (Storefront uses header bag like Classic)

---

## 1. What we are building (full surface)

A **new theme pack** `storefront` that clones Classic (tokens, ceremony hooks, cart chrome patterns), then ships three major UX programs plus supporting platform work:

| # | Program | User-visible outcome |
|---|---------|----------------------|
| A | **Home** | Uniqlo-style newest products (hero + 2×3 with color swatches) → post/promo story blocks (full image + linked 2×3) → load-more mixed feed |
| B | **Shop** | Taobao-style browse: flat left rail of all taxonomy nodes; right = next-level tiles + lazy 2-col products |
| C | **Notifications chrome** | Bell beside cart on Home, Shop, Highlights; unread badge → existing inbox |
| D | **Platform** | Schema, seed, types, contexts, browse nav (color preselect + linked list route), i18n, Appearance |

Theme display name (i18n): e.g. EN “Storefront”, zh-CN “精品橱窗”, ms “Storefront” (**lock in Agent 4** Appearance + locale files).

This is **not** a skin-only tweak. Expect: DB migration + rich seed, new theme directory, new Home/Shop compositions, PDP param wiring, new route(s), context/query updates, and translation coverage for new taxonomy depth.

### 1.1 Requirements coverage matrix (must all ship)

Every row maps a Stanley request → plan section → owning agent(s). **QC Agent 10** re-verifies this table.

| ID | Request | Plan | Agents |
|----|---------|------|--------|
| R1 | New Classic-clone theme pack (do not overwrite Classic) | §1, §5.1 | 4 |
| R2 | Home hero ≈ half screen = **newest** product → PDP | §3.1 A | 6 |
| R3 | Title `最新商品` (+ en/ms) | §3.1 A, §5.4 | 6 |
| R4 | Grid = **2nd–7th** newest, 2×3 | §3.1 A | 6 |
| R5 | Tile = image → swatches → name → price (Uniqlo) | §3.1 A, §5.1 tile | 5, 6 |
| R6 | Swatch changes photo; open PDP with that color selected | §3.1, §3.4 | 1, 3, 5, 6 |
| R7 | DB supports colorway medias (update + seed; generate images OK) | §4.2, §4.4 | 1, 3 |
| R8 | Posts = editorial/social (not only promos); full image + linked 2×3 | §3.1 B | 3, 7 |
| R9 | Post↔products via **taxonomy** (dept/range/category/**brand**) **∪** explicit M2M; product may appear on many posts | §4.3, §4.4 | 1, 3, 7 |
| R10 | Promotions same block layout as posts (image + linked 2×3) | §3.1 B | 3, 7 |
| R11 | Load more = mixed chronological older posts **and** promotions | §3.1 pagination | 7 |
| R12 | Tap post/promo **image** → filtered product **list** of all linked items | §3.3 | 7 |
| R13 | Shop: flat sidebar `[...dept, ...range, ...cat, ...brand]` | §3.2 | 2, 8 |
| R14 | Shop right: next-level tiles + 2-col products, scroll + **lazy load** (Taobao) | §3.2 | 8 |
| R15 | Bell beside cart on Home + Shop + Highlights; unread badge → inbox | §3.5–3.6 | 9 |
| R16 | No Next admin this phase | §6 | all |
| R17 | i18n en / zh-CN / ms for new UI + seeded content translations | §5.4, §4.4 | 2–9 |

---

## 2. Locked decisions (Stanley 2026-08-24)

| # | Decision |
|---|----------|
| 1 | **New theme pack** — do not overwrite Classic |
| 2 | Home **hero** = **newest** product by `created_at` desc; tap → that product’s PDP |
| 3 | Home **grid** = **2nd–7th** newest (exactly six cards in 2×3); hero not duplicated in grid |
| 4 | Grid cell: **image → swatches → name → price** (Uniqlo-style) |
| 5 | Selecting a swatch updates the tile image; opening the product opens PDP with **that color selected** |
| 6 | Posts ≠ promotions (editorial/social vs offers) |
| 7 | Post/promo block: **full-bleed image** + **2×3 linked products** under it |
| 8 | Tap post/promo **image** → **product list filtered to linked products** (not a single PDP) |
| 9 | Post linking = **taxonomy auto-link ∪ explicit `post_products`**; one product may link to many posts |
| 10 | **Load more** = one mixed chronological stream of older posts **and** promotions |
| 11 | Shop sidebar = **flat** `[...departments, ...ranges, ...categories, ...brands]` — **no hierarchy UI on the left** |
| 12 | Shop right = **next-level tiles** for current selection **+** 2-col product grid (scroll, **lazy load**) — match Taobao screenshot |
| 13 | Bell on **Home + Shop + Highlights**; **unread badge** when unread &gt; 0 |
| 14 | **No Next admin** this phase — migrations + mock seed (+ generate/upload images if needed) |
| 15 | i18n: UI strings in en / zh-CN / ms; content translations for seeded taxonomy/products/posts where tables exist |

---

## 3. Target IA (detailed)

### 3.1 Home — Storefront

**Chrome (in-flow, top):** search · notification bell · cart (no MODEL MATCH wordmark).

**Section A — Newest products**

1. **Hero** (~½ usable viewport below chrome): newest product’s display image (default colorway or first media). Tap → PDP.  
2. **Title:** `最新商品` / “Latest arrivals” / MS equivalent.  
3. **2×3 grid:** products ranked 2…7. Each `StorefrontProductTile`:  
   - Media from selected color’s medias, else product-level media  
   - Swatch row (only if `product_colors` active length ≥ 1)  
   - Localized name + `formatRm(price)`  
   - Optional: wishlist heart on first tile if Classic had `saveHeart` guide anchor — preserve guide anchors if Storefront Home is default for tours later; at minimum do not break `ANCHORS` used elsewhere  

**Section B — Feed (posts ∪ promotions)**

For each block (newest first):

1. Full-width image (post primary media **or** `promotions.image_url`)  
2. Optional caption/title line (post name/caption or promo name) — keep quiet; image is hero of the block  
3. 2×3 linked products (cap 6; if 0 products, still show image; empty product row omitted or short empty hint)  
4. Linked product tiles **reuse `StorefrontProductTile`** (swatches required when colors exist — same as newest grid, not optional)

**Interactions:**

| Gesture | Result |
|---------|--------|
| Tap hero / product tile | PDP (`colorId` if swatch selected on that tile) |
| Tap post/promo image | Linked-products list route for that entity |
| Tap Load more | Append next page of older blocks; keep scroll position reasonably stable |

**Pagination:** Initial N blocks (recommend **3**). Page size **3**. Sort key (lock in code + JSDoc):  

```
feedSortAt(item) =
  post: coalesce(time_post, created_at)
  promo: coalesce(start_date, created_at)
```

Descending. Only **active** / non-deleted / published-status rows (match existing Post/Promotion filters).

**Load more end state:** hide button or show “You’re all caught up” when no older items.

### 3.2 Shop — Storefront (Taobao)

| Region | Behavior |
|--------|----------|
| Header | Search + bell + cart |
| Left (~22–28% width) | Flat vertical list of **all** departments, then ranges, then categories, then brands (document exact sort). Active row: accent text + left indicator bar |
| Right top | Next-level **tiles** (image + label), 3-column grid preferred (Taobao-like), wrap |
| Right below | **2-col product grid**, vertical scroll with `onEndReached` / equivalent lazy load |

**Next-level + products (data rules):**

| Selected `kind` | Next-level tiles | Product filter |
|-----------------|------------------|----------------|
| `department` | Ranges where `department_id = id` | `products.department_id = id` |
| `range` | Categories where `range_id = id` | `products.range_id = id` |
| `category` | Distinct brands on products in that category | Products via `product_categories` **or** `products.category_id` (implement both; prefer union) |
| `brand` | **No tile row** (collapse section) | `products.brand_id = id` |

**Tile tap:** set selection to that child node (same as tapping it in the sidebar if present). Sidebar should scroll/highlight the new selection when possible.

**Search:** filters the **product grid** within the current selection (and/or globally — prefer **within selection** first; if query non-empty and selection is brand/category/etc., still AND with selection). Document choice in JSDoc.

**Empty states:** no tiles; no products; loading spinner on first load; footer spinner on page fetch.

**Default selection:** first department if any; else first sidebar item.

### 3.3 Linked-products list route

- Path suggestion: `app/browse/linked-products.tsx` with query `kind=post|promotion&id=<uuid>`  
- Header title: entity name (translated post name / promo name)  
- Body: 2-col product grid of **full** linked set (not capped at 6)  
- Tap product → PDP  
- Invalid id / empty → calm empty state  

### 3.4 PDP (Storefront clone)

Must accept initial `colorId` from Home/Shop tiles:

- On mount, if `colorId` is an active color for the product, select it and show that color’s primary media in the gallery  
- If invalid/missing, existing Classic auto-select behavior  

### 3.5 Highlights (Storefront)

- Keep Classic Highlights content/behavior for v1 **unless** clone already diverges  
- **Required change:** header actions include bell + cart (parity with Home/Shop)  

### 3.6 Notifications

- Reuse `/(tabs)/profile/notifications` and `NotificationContext`  
- Bell: Ionicons (or existing icon set) + badge pill when `unreadCount > 0` (cap display e.g. `99+`)  
- Logged-out: still navigate to inbox (screen already shows login required) **or** push login — match existing inbox behavior  

---

## 4. Data model

### 4.1 Gaps today (verified against live project)

| Gap | Today |
|-----|--------|
| Swatch photos | `product_colors` **0 rows**; `product_medias` has **no color_id** |
| Post ↔ product | No junction table |
| Taxonomy parents | `departments` / `ranges` / `categories` / `brand` are **unrelated tables** (no `ranges.department_id`, no `categories.range_id`) |
| Promo full-bleed image | No reliable `image_url` on promotions for Home blocks |
| Shop depth | ~4 flat categories; weak dept/range usage for UI |

### 4.2 Migration requirements

Single (or tightly sequenced) migration(s), mirrored to `supabase/migrations/` **and** `asf-2-next/supabase/migrations/` if dual-path is repo convention:

1. **`product_medias.color_id`** `uuid NULL` → `product_colors(id)` ON DELETE SET NULL + index  
2. **`post_products`**: `post_id`, `product_id`, unique `(post_id, product_id)`, FKs, `created_at`  
3. **`posts`**: nullable `department_id`, `range_id`, `category_id`, `brand_id` + FKs  
4. **`ranges.department_id`** → `departments(id)`  
5. **`categories.range_id`** → `ranges(id)`  
6. **`promotions.image_url`** `text NULL`  
7. Indexes for Shop filters (`products.department_id`, `range_id`, `brand_id`, etc.) if missing  
8. RLS: do not break Expo anon/authenticated **read** of catalog; mirror peer tables’ posture  

### 4.3 Linked product resolution

**Posts:**

```
linkedProducts(post) =
  distinct( products from post_products
            ∪ products where department_id = post.department_id (if set)
            ∪ products where range_id = post.range_id (if set)
            ∪ products where brand_id = post.brand_id (if set)
            ∪ products in category (category_id FK and/or product_categories) if post.category_id set )
```

If multiple taxonomy FKs set, treat as **OR** across set dimensions (union), not AND — unless seed only sets one dimension per post (prefer **one primary taxonomy FK per post** in seed to keep demos predictable; resolver still supports union).

**Promotions:** rows in `promotion_products` only (this phase).

### 4.4 Seed requirements (mock-friendly but demo-complete)

Minimum bar for Agents 3–5 to look real:

| Entity | Target |
|--------|--------|
| Departments | ≥ 3 with `media_url` |
| Ranges | ≥ 2 per department, `department_id` set, `media_url` |
| Categories | ≥ 2 per range, `range_id` set, `media_url` + translations |
| Brands | ≥ 4 with `media_url` + translations |
| Products | ≥ 12 active; each with dept/range/category/brand set; `product_categories` consistent |
| Colors | ≥ 2 per product for ≥ 8 products; hex or named `color` text; **≥1 media per color** |
| Posts | ≥ 8 with medias; translations |
| Post link styles | **At least one post** primarily linked via each of: department, range, category, brand; **and** ≥2 posts using explicit `post_products` |
| Multi-post product | **≥1 product** appears on **≥2 different posts** (proves many-to-many) |
| Promotions | ≥ 4 active with `image_url` + product links |
| Feed depth | Combined posts+promos ≥ 8 so Load more is exercisable |

Images: public HTTPS; colorways must be visually distinguishable. Generate/upload allowed (Supabase storage or stable CDN).

Also seed/update **`department_translations` / `range_translations` / `category_translations` / `brand_translations` / `product_translations` / `post_translations`** for en + ms (zh canonical OK).

---

## 5. App architecture

### 5.1 Theme pack layout

```
themes/storefront/
  index.ts
  tokens.ts          # start as Classic copy; may nudge later
  tabBar.ts
  CartChrome.tsx
  screens/
    Home.tsx
    Shop.tsx
    ProductDetail.tsx
    Highlights.tsx
    ProfileHub.tsx
    Locations.tsx
```

Shared Storefront UI (preferred):

```
components/storefront/
  StorefrontProductTile.tsx
  StorefrontTaxonomyTile.tsx
  StorefrontFeedBlock.tsx
  StorefrontHeaderActions.tsx   # bell + cart
  NotificationBellButton.tsx    # or under components/
```

Libs:

```
lib/storefront/
  newestProducts.ts             # hero + grid split
  productColorMedia.ts          # resolve media for color
  linkedProducts.ts             # post/promo resolvers
  feedTimeline.ts               # merge/sort/paginate posts∪promos
  shopTaxonomy.ts               # flat sidebar + next-level + product filter
```

### 5.2 Context / data loading

Customer app already has `DepartmentContext`, `RangeContext`, `BrandContext`, `CategoryContext`, `ProductContext`, `PostContext`, `PromotionContext` (see `RouteContextBundle`).

Agents **must**:

- `ProductContext`: select includes `product_colors(*)`, `product_medias(*)` (with `color_id`)  
- `RangeContext` / category queries: include new parent FKs (`department_id`, `range_id`) after migration  
- Posts: taxonomy FKs + `post_products` available to resolvers  
- Promotions: `image_url` + linked product ids  
- Shop: build sidebar from **all four** contexts (not categories alone)  
- Content translations: wire sidebar + tiles through `ContentTranslationContext` helpers  

### 5.3 Navigation

- Extend `openBrowseProduct(productId, options?: { colorId?: string })`  
- Register linked-products route in Expo Router stack (customer app)  
- Notification bell → existing notifications path  
- Home search: keep existing Storefront/Classic search navigation behavior (do not drop search)  

### 5.4 i18n (UI) — non-exhaustive list

Add to en / zh-CN / ms:

- Theme name Storefront  
- `home.latestProducts` (最新商品)  
- `home.loadMore` / `home.feedEnd`  
- `shop.emptyProducts` / `shop.emptyTiles` / search a11y  
- `browse.linkedProductsTitle` fallback  
- `notifications.openInbox` / bell a11y  
- Any new empty/error strings  

---

## 6. Non-goals / do not

- Do not regress Classic R4 / Noir R5 / Atelier when Storefront is selected incorrectly — theme registry must isolate packs  
- Do not put parent/child indentation in the **sidebar**  
- Do not require admin UI to demo  
- Do not commit/push unless Stanley asks  
- Do not run long `expo start` / EAS production builds in agents unless asked  

---

## 7. Success criteria (release checklist)

Use together with **§11 QC**. Agent 9 does an implementation smoke; **Agent 10 owns formal QC**.

### Theme
- [ ] Appearance lists Storefront; default remains Classic  
- [ ] Switching packs remounts correct screens  
- [ ] Classic / Atelier / Noir Home+Shop IA unchanged when those themes selected  

### Home
- [ ] Hero ≈ half viewport = newest; tap → PDP  
- [ ] Grid = 2nd–7th only (no hero duplicate)  
- [ ] Swatches change images when color medias exist (newest grid **and** feed tiles)  
- [ ] PDP opens with selected color  
- [ ] Post and promo blocks render with image + up to 6 products  
- [ ] Image → full linked list; Load more works; end state OK  
- [ ] Bell + badge present  

### Shop
- [ ] Sidebar contains all four entity types as peers (flat)  
- [ ] Selecting each type updates tiles + products per §3.2  
- [ ] Tile tap narrows selection  
- [ ] Product grid lazy-loads  
- [ ] Search + bell + cart present  

### Highlights
- [ ] Bell + badge + cart present  

### Data
- [ ] Migration applied; types updated; seed meets §4.4 counts (including multi-post product + one post per taxonomy kind)  

### i18n
- [ ] Spot-check zh-CN / en / ms on Home title, Load more, Shop empty, theme name  

---

## 8. Agent pack sizing

**Ten** sequential agents (~200k-friendly). Schema/seed/platform/UI split; **Agent 10 = dedicated QC** (read-only defect pass + fix-forward only for clear Storefront bugs).

| # | Slice |
|---|--------|
| 1 | Schema migration + types only |
| 2 | Taxonomy + catalog seed (depts/ranges/categories/brands/products/translations) |
| 3 | Colorways + medias + post/promo link seed (+ promo images) |
| 4 | Theme pack scaffold + registry + Appearance + lib stubs |
| 5 | Context/nav/PDP color preselect + shared product tile |
| 6 | Home newest (hero + 2×3 swatches) |
| 7 | Home feed + load more + linked-products route |
| 8 | Shop Taobao layout |
| 9 | Notification bells + Highlights parity + implementer smoke |
| 10 | **QC** — full §1.1 / §11 pass; regression; SQL; locales; file defects |

See companion prompts for file-level instructions, QC script, and handoff template.

---

## 9. Risks / open implementation choices (agents may pick; document in handoff)

| Topic | Guidance |
|-------|----------|
| Multiple taxonomy FKs on one post | Prefer seed with **one** primary FK; resolver still unions |
| Shop search scope | Prefer filter **within** current selection |
| Promo image source | `promotions.image_url` (not folder medias) this phase |
| Wishlist on Home tiles | Optional; do not block |
| Ceremony motion | Keep Classic-level entrance if cheap; do not invent new motion system |
| Shop product tiles | Price + image required; swatches optional on Shop (Taobao reference has no swatches) — Home/feed swatches **required** |

---

## 10. Related

- Theme skins concept / prior Home R4 / notifications plan in vault wiki  
- Taxonomy reminder: department, range, category, **brand**  
- Taobao reference screenshot from planning chat (asset may live under Cursor project assets)

---

## 11. QC program (mandatory before calling done)

**Owner:** Agent 10 (after Agents 1–9). Stanley may also run this manually.

### 11.1 Principles

1. **Defect-first** — list failures with severity (P0 blocks demo / P1 wrong UX / P2 polish) before celebrating.  
2. **Trace §1.1** — every R1–R17 must be Pass, Fail, or N/A (with reason).  
3. **No scope creep** — fix only Storefront/schema/seed defects that block R*; do not redesign Classic.  
4. **Evidence** — for each Fail, cite file path or SQL count or locale key.  

### 11.2 SQL / data QC

Run and record counts (adjust filters to match soft-delete/active conventions):

```sql
-- Hierarchy
SELECT COUNT(*) AS depts FROM departments WHERE deleted_at IS NULL;
SELECT COUNT(*) AS ranges_linked FROM ranges WHERE department_id IS NOT NULL AND deleted_at IS NULL;
SELECT COUNT(*) AS cats_linked FROM categories WHERE range_id IS NOT NULL AND deleted_at IS NULL;

-- Swatches
SELECT COUNT(*) AS colors FROM product_colors WHERE deleted_at IS NULL;
SELECT COUNT(*) AS color_medias FROM product_medias WHERE color_id IS NOT NULL;

-- Linking
SELECT COUNT(*) AS post_products FROM post_products;
SELECT COUNT(*) AS posts_tax FROM posts WHERE department_id IS NOT NULL OR range_id IS NOT NULL OR category_id IS NOT NULL OR brand_id IS NOT NULL;
SELECT product_id, COUNT(*) AS post_count FROM post_products GROUP BY product_id HAVING COUNT(*) >= 2;

-- Promos
SELECT COUNT(*) AS promos_img FROM promotions WHERE image_url IS NOT NULL AND deleted_at IS NULL;
SELECT COUNT(*) AS promo_links FROM promotion_products;
```

**Pass bar:** matches §4.4 minimums; ≥1 product on ≥2 posts; color_medias &gt; 0; promos_img ≥ 4.

### 11.3 UI QC — Home (Storefront theme selected)

| # | Check | Pass if |
|---|--------|---------|
| H1 | Hero height | ≈ half usable screen; newest product image |
| H2 | Hero tap | Opens that product PDP |
| H3 | Title | Shows 最新商品 / locale equivalent |
| H4 | Grid membership | Exactly products ranked 2–7; hero id not in grid |
| H5 | Swatch image | Changing swatch changes tile image |
| H6 | Swatch → PDP | PDP has that color selected + matching gallery image when possible |
| H7 | Feed types | At least one **post** block and one **promo** block appear (given seed) |
| H8 | Feed layout | Full image above; ≤6 product tiles below |
| H9 | Feed swatches | Tiles with colors show swatches that change image |
| H10 | Image tap | Opens linked-products list with **all** linked products (not capped at 6) |
| H11 | Product tap in feed | Opens PDP |
| H12 | Load more | Appends older mixed blocks; eventually end state |
| H13 | Bell | Visible beside cart; badge if unread &gt; 0; opens inbox |

### 11.4 UI QC — Shop

| # | Check | Pass if |
|---|--------|---------|
| S1 | Sidebar flat | Depts, ranges, categories, brands all appear as peers (no indent tree) |
| S2 | Dept select | Right shows range tiles + products in that dept |
| S3 | Range select | Right shows category tiles + products in that range |
| S4 | Category select | Right shows brand tiles + products in that category |
| S5 | Brand select | Tile row hidden/empty; products for brand |
| S6 | Tile tap | Selection moves to child; sidebar highlight updates |
| S7 | Lazy load | Scrolling products loads more pages (or documents single-page if catalog &lt; page size — still must implement `onEndReached` path) |
| S8 | Search | Filters products within selection |
| S9 | Chrome | Search + bell + cart |

### 11.5 UI QC — Highlights + PDP + theme isolation

| # | Check | Pass if |
|---|--------|---------|
| X1 | Highlights bell | Beside cart; badge; inbox |
| X2 | Classic theme | Home/Shop still Classic IA (not Storefront layout) |
| X3 | Appearance | Storefront listed; default Classic after clear storage |
| X4 | Linked list empty | Calm empty state for bad id / zero links |
| X5 | PDP no colorId | Still usable; auto-select rules intact |

### 11.6 Locale QC

Switch zh-CN → en → ms and confirm:

- Theme name in Appearance  
- Home `最新商品` / Latest / MS  
- Load more / feed end  
- Shop empty strings  
- Bell a11y label  

### 11.7 QC exit

- **Ship-ready:** all R1–R17 Pass; no open P0; P1 list empty or explicitly accepted by Stanley  
- **Not ready:** Agent 10 returns Fail inventory + suggested fix agent number (e.g. “re-run Agent 7 for H10”)  
