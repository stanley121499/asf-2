# Expo Customer — Storefront Occupation Taxonomy + Home Filter — Plan (2026-09-03)

**Project**: ASF-2 — primarily `asf-customer-app/` (Expo Storefront theme); taxonomy/seed via Supabase migrations (+ MCP apply)  
**Date**: September 3, 2026  
**Status**: Implemented (see accomplishment)  
**Stakeholder**: Stanley (Simon request: separate catalog by occupation)  
**Source of truth (shipped):** `raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-accomplishment.md`  
**Companion prompts**: deleted after execution (do not re-ingest)

**Builds on:**
- Storefront theme pack (4th theme) — [[wiki/sources/2026-08-24-expo-customer-storefront-theme-session-accomplishment]] / `raw/sources/2026-08-24-expo-customer-storefront-theme-session-accomplishment.md`
- Storefront IA plan — `raw/sources/2026-08-24-expo-customer-storefront-theme-plan.md` (**partially superseded** by this doc for taxonomy + Home hero/filter)
- Curated footwear seed — `raw/sources/2026-08-25-expo-customer-storefront-curated-seed-plan.md` (products remain; taxonomy spine changes)

**Out of scope:**
- Classic / Atelier / Noir screen IA
- Next.js admin taxonomy CRUD
- Full image regeneration / curated seed redo
- Hard-deleting departments/brands tables or historical rows needed by orders
- Commit/push unless Stanley asks

---

## 1. Why this program

Simon wants the catalog browsed by **occupation**, not by department/brand fashion hierarchy.

Each occupation (e.g. Nurse, Electrician) has the **same product-type categories** under it (Shoes, Bag, …). Combinations without stock show **Coming soon**.

Storefront Home also gains a top **category-type filter rail** that refilters the entire page (hero + arrivals + feed), and several Home interaction changes (post hero, See all).

---

## 2. Locked decisions (Stanley 2026-09-03)

| # | Decision |
|---|----------|
| 1 | **Theme scope** = Storefront only (`themes/storefront/**` + shared `components/storefront/**` + `lib/storefront/**` as needed) |
| 2 | Browse taxonomy = **range + category only**. Range = **occupation**. Category = **product type** under that occupation |
| 3 | Same type labels under every occupation (Nurse/Shoes and Electrician/Shoes are separate category rows, same `kind_key`) |
| 4 | Mock occupations + categories first; remap existing products **when it makes sense**; leave others **unassigned** (`range_id` / `category_id` null, no `product_categories` for occupation cats) |
| 5 | **Actively stop using** departments and brands in Storefront Shop / Home browse filters (do not show in sidebar/tiles; do not filter by them) |
| 6 | Shop: **left rail = occupations (ranges) only**; **right = category tiles + products** |
| 7 | Empty occupation×category (no products) → **Coming soon** placeholder tile on the right (not a blank pane) |
| 8 | Home hero = **latest matching post** (not latest product); tap hero → that post’s **linked products list** |
| 9 | Keep **Latest arrivals** product 2×3 under hero; **See all** → product list scoped to filter (All = entire catalog; category chip = that `kind_key` only) |
| 10 | After **every** Home 2×3 (arrivals + each post/promo block), show **See all** |
| 11 | Post/promo **See all** → existing uncapped linked-products route for that entity |
| 12 | Home top: horizontal **category-type filter** (`All` + each `kind_key`). Default = **All** (mixed). Changing chip refilters **hero + arrivals + feed** |
| 13 | Unassigned products appear on Home **only when All** is selected |
| 14 | Filter chips = **product category types** (`kind_key`), **not** occupations |

---

## 3. Target IA

### 3.1 Data model (occupation spine)

**Keep tables** `ranges`, `categories`, `products`, `product_categories`, posts taxonomy FKs, `post_products`, etc.

**Semantic remap for Storefront:**

| Entity | Old meaning (footwear seed) | New meaning |
|--------|----------------------------|-------------|
| `ranges` | Style groups under department (运动休闲, …) | **Occupations** (护士, 电工, …) |
| `categories` | Shoe subtypes under a range (跑鞋, …) | **Product types under an occupation** (鞋履, 包袋, …) |
| `departments` | Men’s/Women’s/Accessories | **Unused by Storefront UI** (soft-retire from browse; rows may remain) |
| `brand` | Brand tiles in Shop | **Unused by Storefront UI** |

**New column (required):**

```sql
-- categories.kind_key text NULL
-- Stable English slug shared across occupations for the same product type.
-- Examples: 'shoes' | 'bags' | 'accessories'
```

- Each occupation range gets one category row per mock `kind_key`, with `categories.range_id = that range`.
- Home filter chips = distinct active `kind_key` values (+ synthetic **All**).
- Product matches a Home chip when its `category_id` (or any `product_categories.category_id`) resolves to a category whose `kind_key` equals the chip.

**Optional but recommended:** null out `ranges.department_id` for new occupation ranges (or leave legacy footwear ranges soft-deleted). Prefer **soft-delete / deactivate** old footwear ranges & categories that conflict with the new spine, then insert mock occupation taxonomy with fixed UUIDs.

### 3.2 Mock seed (minimum viable)

Agents may adjust names; **counts are floors**:

| Kind | Count | Examples (zh canonical / en) |
|------|-------|------------------------------|
| Occupations (`ranges`) | ≥ 3 | 护士 / Nurse · 电工 / Electrician · 厨师 / Chef |
| Category types (`kind_key`) | ≥ 3 | `shoes` 鞋履 · `bags` 包袋 · `accessories` 配件 |
| Category rows | occupations × kinds | 9 rows if 3×3 |
| Coming-soon combos | ≥ 2 | e.g. Chef × bags, Electrician × accessories with **zero** products |
| Remapped products | as many as sensible | Footwear-like → `shoes`; bag-like → `bags`; else leave unassigned |
| Posts | ≥ 1 per `kind_key` + ≥ 1 mixed/All-friendly | Taxonomy `category_id` and/or `post_products` so hero filtering works |
| Translations | en + ms for new ranges/categories | zh on `name` |

**Do not** require full image regen. Reuse existing `media_url` where possible; Coming soon tiles can use null media + label.

**Products left unassigned:** `range_id IS NULL` and `category_id IS NULL` (and not linked via `product_categories` to occupation categories). They still show under Home **All** (Latest arrivals / See all all-catalog).

### 3.3 Shop — Storefront

| Region | Behavior |
|--------|----------|
| Header | Search + bell + cart (unchanged chrome) |
| Left (~22–28%) | **Only active occupation ranges** (sorted stable). No departments, no brands, no flat dump of all categories |
| Right top | Category tiles for `categories.range_id = selectedOccupation` (3-col preferred) |
| Right below | 2-col products where product is in that occupation **and** (if a category tile is selected) that category; lazy load |
| Empty category | Tile still shown; selecting it shows **Coming soon** placeholder (not empty product grid only) |

**Default selection:** first occupation by sort order.

**Search:** within current occupation (+ category if selected). Document in JSDoc.

**Tile tap:** select that category under the current occupation (highlight tile; filter products). If zero products → Coming soon state in the product area (and/or on-tile badge — pick one; prefer product-area placeholder with calm copy).

### 3.4 Home — Storefront

**Chrome:** keep search · bell · cart overlay pattern.

**A. Category filter rail (new)**

- Position: top of Home content / under safe chrome — horizontally scrollable.
- Chips: **All** + one chip per distinct `kind_key` (localized label).
- Aesthetic: fit Storefront (white / gold `#C9A96E`). Prefer **quiet text rail + gold underline / weight on active** over chunky rounded-full pills.
- Default: **All**.
- On change: recompute hero, arrivals grid, and feed from filtered datasets (see §3.5).

**B. Hero**

- Image = primary media of the **latest eligible post** under the active filter (sort: `coalesce(time_post, created_at)` desc).
- Tap → `openBrowseLinkedProducts(router, { kind: "post", id })` (existing linked-products route).
- If no matching post: calm empty / omit hero (do not fall back to product hero).

**C. Latest arrivals**

- Title: existing `home.latestProducts` (or keep copy; do not invent a second brand title).
- Grid: up to **6** newest eligible products for the filter (2×3). When filter = All, include unassigned; when `kind_key` set, **exclude** unassigned.
- Ranking: `created_at` desc (same spirit as today’s newest split, but **no product hero** — grid is simply top 6 under filter).
- **See all** under grid → product list route (§3.6) with `scope=all` or `scope=kind&kindKey=…`.

**D. Feed (posts ∪ promotions)**

- Same block layout: full image + up to 6 linked products.
- Only blocks that remain relevant under the active filter (§3.5).
- Each block: **See all** → linked-products for that post/promo.
- Load more / end state: keep existing Storefront feed pagination behavior, applied to the **filtered** stream.

### 3.5 Home filter matching rules

Let `K` = selected `kind_key` or `null` for All.

**Product eligible for arrivals / See all catalog:**

- Base: published, not deleted (match existing ProductContext filters).
- If `K` is null (**All**): all eligible products (**including unassigned**).
- If `K` is set: product must match at least one category with `kind_key = K` via `products.category_id` **or** `product_categories`. Unassigned → **excluded**.

**Post eligible for hero / feed:**

- If `K` is null: all active posts (existing filters).
- If `K` is set: post is included if:
  - `post.category_id` points to a category with `kind_key = K`, **OR**
  - any product in `resolvePostLinkedProductIds(post)` matches `K`, **OR**
  - (optional) `post` taxonomy range-only without category — **exclude** unless linked products match `K` (prefer precision over showing irrelevant heroes).

**Promotion eligible for feed:**

- If `K` is null: existing promo eligibility.
- If `K` is set: include only if at least one linked promotion product matches `K`.

**Hero pick:** among eligible posts, newest by `coalesce(time_post, created_at)`.

### 3.6 See all — product list route

Extend browse stack (do not overload post/promo linked-products):

**Suggested path:** `app/(tabs)/browse/product-list.tsx`

Query params:

| Param | Values | Meaning |
|-------|--------|---------|
| `scope` | `all` \| `kind` | Required |
| `kindKey` | e.g. `shoes` | Required when `scope=kind` |

- Header title: “All products” / localized, or the kind label when scoped.
- Body: 2-col `StorefrontProductTile` grid, uncapped (lazy OK).
- Tap → PDP.
- Wire from Home arrivals **See all** via helper in `lib/browseNavigation.ts`.

Post/promo **See all** continues to use existing `linked-products`.

### 3.7 i18n (en / zh-CN / ms)

Add keys such as:

- `home.categoryFilterAll` — All / 全部 / …
- `home.seeAll` — See all → (reuse/adapt `home.seeAllArrivals` if present)
- `home.comingSoon` / `shop.comingSoon`
- `browse.allProducts` / `browse.kindProducts`
- Kind labels: either from `category_translations` (any category with that `kind_key`) or UI map `home.kind.shoes` etc. Prefer **translations on category rows** + pick first label for kind; fallback UI keys for All / Coming soon.

---

## 4. Supersedes (Storefront-only)

Relative to `2026-08-24-expo-customer-storefront-theme-plan.md`:

| Old | New |
|-----|-----|
| Home hero = newest **product** → PDP | Hero = newest matching **post** → linked list |
| Shop sidebar = flat dept∪range∪cat∪brand | Sidebar = **occupations (ranges) only** |
| Shop next-level includes brands under category | Next-level = **categories under occupation**; no brands |
| Taxonomy spine dept→range→cat→brand for UI | UI spine **range→category** with `kind_key` |
| Arrivals = 2nd–7th after product hero | Arrivals = top 6 under filter; no product hero |

Unchanged unless noted: Storefront tokens, bell/cart chrome, feed load-more pattern, PDP color preselect, Classic/Atelier/Noir isolation.

---

## 5. App touchpoints (expected files)

**Seed / schema**

- `supabase/migrations/20260903_expo_customer_storefront_occupation_*.sql` (mirror under `asf-2-next/supabase/migrations/` if that is still the dual-path convention)
- Apply via Supabase MCP; regenerate / update `database.types.ts` where the repo expects it

**Libs**

- `lib/storefront/shopTaxonomy.ts` — rewrite for occupation sidebar + category tiles + coming-soon detection
- `lib/storefront/homeCategoryFilter.ts` — **new**: kind chips, product/post/promo predicates, hero picker
- `lib/storefront/newestProducts.ts` — adjust or replace usage (no product hero split required)
- `lib/storefront/linkedProducts.ts` — keep; may add kind helpers
- `lib/browseNavigation.ts` — open product-list + keep linked-products

**Components / screens**

- `components/storefront/StorefrontHomeCategoryRail.tsx` — **new**
- `components/storefront/StorefrontFeedBlock.tsx` — See all affordance if not present
- `themes/storefront/screens/Home.tsx` — rail + post hero + filtered sections + See all
- `themes/storefront/screens/Shop.tsx` — occupation left rail
- `app/(tabs)/browse/product-list.tsx` — **new**
- `app/(tabs)/browse/_layout.tsx` — register screen
- `i18n/locales/{en,zh-CN,ms}.json`

**Contexts:** ensure Category queries expose `kind_key` + `range_id`; Range list usable without department. Prefer extending existing contexts over one-off fetches.

---

## 6. Non-goals / do not

- Do not change Classic / Atelier / Noir Home or Shop IA
- Do not show departments or brands in Storefront Shop sidebar or next-level tiles
- Do not fall back Home hero to a product
- Do not hide Coming soon categories from the occupation’s tile row
- Do not commit/push unless Stanley asks
- Do not run long `expo start` / EAS builds unless asked
- Do not hard-delete order-referenced products

---

## 7. Success criteria

### Data
- [ ] `categories.kind_key` exists; mock occupations ≥ 3; kinds ≥ 3; ≥ 2 empty combos
- [ ] Some products remapped; some remain unassigned
- [ ] ≥ 1 post resolvable per `kind_key` for hero testing

### Shop
- [ ] Left = occupations only
- [ ] Right = categories for selected occupation + products
- [ ] Empty category → Coming soon
- [ ] No department/brand rows in sidebar

### Home
- [ ] Category rail: All + kinds; aesthetic fits Storefront
- [ ] Filter refilters hero, arrivals, feed
- [ ] Hero = latest matching post; tap → linked products
- [ ] Arrivals 2×3 + See all (all vs kind scope)
- [ ] Each feed block has See all → linked list
- [ ] Unassigned products only under All

### Regression
- [ ] Other themes unchanged when selected
- [ ] Bell/cart/search still present on Storefront Home/Shop

### i18n
- [ ] Spot-check en / zh-CN / ms for All, See all, Coming soon, product-list titles

---

## 8. Agent pack sizing (8 agents, ~200k-friendly)

| # | Slice | Approx. focus |
|---|--------|----------------|
| 1 | Schema + occupation mock seed + product remap + post kind coverage | SQL / MCP / types |
| 2 | Lib: shop taxonomy rewrite + home filter helpers + browse nav | TS libs only |
| 3 | Shop screen UI | `Shop.tsx` + coming soon |
| 4 | Home category rail + filter wiring | rail component + Home state |
| 5 | Home post hero + arrivals See all + feed See all | Home composition |
| 6 | Product-list route + i18n | browse route + locales |
| 7 | Implementer smoke + small fixes | manual checklist |
| 8 | **QC** — full §7 pass; file defects only | read-heavy |

See companion prompts for per-agent file lists, verify SQL, and handoff template.

**Parallelism:** 1 → 2 → (3 ∥ 4) → 5 → 6 → 7 → 8. Prefer sequential if one machine; **3 and 4 may parallel** after 2. **5 depends on 4**. **6 can start after 2** (route) but should land i18n keys before 5 finishes wiring labels.

---

## 9. Risks / open choices (document in handoff)

| Topic | Guidance |
|-------|----------|
| Reuse vs soft-delete old footwear ranges | Prefer soft-delete conflicting active footwear taxonomy; insert new occupation UUIDs |
| `kind_key` vs overloading `categories.parent` | **Add `kind_key`**; do not overload `parent` |
| Promo without products matching kind | Drop from filtered feed |
| Arrivals when kind has &lt; 6 products | Show fewer tiles; still show See all if ≥ 1 |
| No posts for a kind | Omit hero; show rail + empty arrivals/feed calm states |

---

## 10. Handoff template (every agent)

```markdown
## Agent N handoff
- Done:
- Files touched:
- Migrations applied: yes/no (names)
- Verify SQL / checklist:
- Blockers:
- Notes for next agent:
```
