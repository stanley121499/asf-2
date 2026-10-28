# Expo Customer App — Storefront Occupation Taxonomy + Home Filter — Accomplishment (2026-09-03)

**Date**: September 3–5, 2026 (implementation + device polish); wiki write-up September 8, 2026  
**Project**: ASF-2  
**Primary delivery**: `asf-customer-app` (Expo Storefront theme) + Supabase schema/seed  
**Stakeholder**: Stanley (Simon request: separate catalog by occupation)  
**Status**: Shipped on device (Storefront Home + Shop); Expo SDK upgraded to **57** for physical iPhone Expo Go; mock occupations expanded beyond the original 3  
**Git**: No commit/push performed in this program unless Stanley did so separately  

**Treat this file as the wiki source of truth** for the occupation taxonomy + Home category-filter program and the post-ship UI/SDK fixes from this chat.

**Related plan (IA/spec):** `raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-plan.md`  
**Prior Storefront SoT (partially superseded for taxonomy + Home hero):** `raw/sources/2026-08-24-expo-customer-storefront-theme-session-accomplishment.md`  
**QC notes (static / SQL):** `raw/sources/2026-09-03-expo-customer-storefront-occupation-taxonomy-qc-notes.md`  
**Agent prompts:** deleted after execution (do not re-ingest).

---

## 1. What we set out to do

Refactor Storefront browse IA so the catalog is organized by **occupation**, not department/brand fashion hierarchy, and upgrade Home so a **category-type filter** drives the whole page.

| Program | Intent | Outcome |
|---------|--------|---------|
| **Taxonomy** | Range = occupation; category = product type under that occupation | Soft-retire dept/brand from Storefront UI; add `categories.kind_key` |
| **Shop** | Left = occupations only; right = category tiles + products | Coming soon for empty occupation×type combos |
| **Home filter** | Top rail: All + `kind_key` chips | Refilters hero + arrivals + feed |
| **Home hero** | Latest matching **post** (not product) | Tap → linked products list; no product-hero fallback |
| **See all** | After every 2×3 | Arrivals → product-list; feed blocks → linked-products |
| **Mock data** | Remap when sensible; leave rest unassigned | Extra occupations seeded as Coming soon |
| **Platform** | Physical iPhone on Expo Go SDK 57 | Customer app upgraded 54 → 57 |

---

## 2. Decisions (locked)

### 2.1 Taxonomy & browse (Stanley 2026-09-03)

| # | Decision |
|---|----------|
| 1 | **Theme scope** = Storefront only (`themes/storefront/**`, `components/storefront/**`, `lib/storefront/**` as needed). Classic / Atelier / Noir unchanged. |
| 2 | Browse taxonomy = **range + category only**. Range = **occupation**. Category = **product type** under that occupation. |
| 3 | Same type labels under every occupation (Nurse/Shoes and Electrician/Shoes are separate category rows sharing `kind_key`). |
| 4 | Mock occupations + categories first; remap existing products **when it makes sense**; leave others **unassigned**. |
| 5 | **Actively stop using** departments and brands in Storefront Shop / Home browse filters (do not show in sidebar/tiles; do not filter by them). Tables may remain for history/orders. |
| 6 | Shop: **left rail = occupations (ranges) only**; **right = category tiles + products**. |
| 7 | Empty occupation×category → **Coming soon** placeholder (not a blank pane). Category tiles for empty combos still appear. |
| 8 | Home hero = **latest matching post**; tap → that post’s **linked products list**. Never fall back to a product hero. |
| 9 | Keep **Latest arrivals** product 2×3; **See all** → product list scoped to filter (All = entire catalog; kind chip = that `kind_key` only). |
| 10 | After **every** Home 2×3 (arrivals + each post/promo block), show **See all**. |
| 11 | Post/promo **See all** → existing uncapped linked-products route for that entity. |
| 12 | Home top: horizontal **category-type filter** (`All` + each `kind_key`). Default = **All**. Changing chip refilters **hero + arrivals + feed**. |
| 13 | Unassigned products appear on Home **only when All** is selected. |
| 14 | Filter chips = **product category types** (`kind_key`), **not** occupations. |

### 2.2 Home chrome & CTA polish (device feedback, post-plan)

| # | Decision |
|---|----------|
| 15 | Category rail sits **fixed below** the overlay nav (search · bell · cart), not above it. |
| 16 | Rail layout: **equal-width slots for 4 visible chips**; if more than 4, snap-scroll by pages of 4. Quiet text + gold underline (not chunky pills). |
| 17 | Rail background **matches nav chrome** (same opaque `tokens.bg` or shared translucent hero scrim). |
| 18 | **See all** = full-width **outline** button spanning the content column; label centered (not a text link). |
| 19 | Seed **additional occupations** with no products so Shop shows Coming soon for those ranges. |
| 20 | Home feed blocks with **zero linked products** do **not** render (image + empty See all omitted). |
| 21 | Kind-filter matching for posts is **precise**: `post.category_id` → matching `kind_key`, **or** explicit `post_products` whose products match that kind. Do **not** use loose department/range/brand auto-link alone for kind chips (that incorrectly kept hero/feed sticky across kinds). |

### 2.3 Expo SDK (Stanley 2026-09-05)

| # | Decision |
|---|----------|
| 22 | Upgrade **customer app only** (not admin/Next) from Expo SDK **54 → 57** (skip 56; Hermes V1 memory regression). |
| 23 | One big local upgrade; stop at **local green** + smoke; verify on **physical iPhone** Expo Go. |
| 24 | Migrate `expo-av` → `expo-video` where needed for SDK 57. |

---

## 3. What superseded the Aug 24 Storefront plan (Storefront-only)

| Old (2026-08-24) | New (this program) |
|------------------|--------------------|
| Home hero = newest **product** → PDP | Hero = newest matching **post** → linked list |
| Shop sidebar = flat dept ∪ range ∪ cat ∪ brand | Sidebar = **occupations (ranges) only** |
| Shop next-level includes brands under category | Next-level = **categories under occupation**; no brands |
| UI spine dept → range → cat → brand | UI spine **range → category** with `kind_key` |
| Arrivals = 2nd–7th after product hero | Arrivals = top 6 under filter; **no** product hero |

Unchanged unless noted: Storefront tokens, bell/cart chrome, feed load-more pattern, PDP color preselect, Classic/Atelier/Noir isolation.

---

## 4. Schema & seed shipped

### Schema

| Change | Purpose |
|--------|---------|
| `categories.kind_key` (`text`, nullable) | Stable English slug for product type across occupations (`shoes` / `bags` / `accessories`) |

**Migrations (dual-path: repo root `supabase/migrations/` + `asf-2-next/supabase/migrations/`):**

| File | Role |
|------|------|
| `20260903_expo_customer_storefront_occupation_taxonomy.sql` | `kind_key` column; soft-retire conflicting footwear ranges/cats; seed Nurse / Electrician / Chef × 3 kinds; remap products; retarget posts |
| `20260903160000_expo_customer_storefront_more_occupation_ranges.sql` | Extra occupations (医生 / 教师 / 保安 / 服务员 + categories) with **no** product links → Coming soon in Shop |

Types updated: `asf-customer-app/database.types.ts` (and Next mirrors as convention requires).

### Seed semantics (demo — not final merchandising)

| Kind | Examples |
|------|----------|
| Occupations (`ranges`) | 护士, 电工, 厨师 + extra Coming-soon ranges (医生, 教师, 保安, 服务员, …) |
| `kind_key` | `shoes`, `bags`, `accessories` |
| Coming-soon combos | At least Chef×bags, Electrician×accessories; plus all combos under extra ranges |
| Products | Remap when sensible; leave remainder unassigned (`range_id` / `category_id` null) |
| Posts | Enough per kind for hero testing via `category_id` and/or `post_products` |

---

## 5. App architecture shipped

### Libs

| Path | Role |
|------|------|
| `lib/storefront/shopTaxonomy.ts` | Occupation sidebar, category tiles, product filter, `isComingSoonCategory` |
| `lib/storefront/homeCategoryFilter.ts` | Kind chips, product/post/promo predicates, hero picker, arrivals slice |
| `lib/storefront/newestProducts.ts` | `takeNewestProducts` / arrivals helpers (no Storefront product-hero split) |
| `lib/browseNavigation.ts` | `openBrowseProductList` for arrivals See all |

### Components / screens

| Path | Role |
|------|------|
| `components/storefront/StorefrontHomeCategoryRail.tsx` | Fixed 4-up kind rail under nav |
| `components/storefront/StorefrontSeeAllButton.tsx` | Full-width outline See all CTA |
| `components/storefront/StorefrontFeedBlock.tsx` | Optional `onSeeAll` → outline button |
| `components/storefront/StorefrontTaxonomyTile.tsx` | Optional selected accent for Shop category tiles |
| `themes/storefront/screens/Home.tsx` | Fixed chrome (nav + rail), post hero, filtered arrivals/feed, See all |
| `themes/storefront/screens/Shop.tsx` | Occupation left rail + category tiles + products / Coming soon |
| `app/(tabs)/browse/product-list.tsx` | Uncapped All / kind product list |
| `app/(tabs)/browse/_layout.tsx` | Registers `product-list` |
| `i18n/locales/{en,zh-CN,ms}.json` | All / See all / Coming soon / kind / product-list titles |

### Home filter matching (source of truth)

- **Products (arrivals / All product-list):** All = all eligible (including unassigned). Kind = match via `products.category_id` ∪ `product_categories` → category with that `kind_key`.
- **Posts (hero / feed):** Kind = `post.category_id` kind match **or** any **explicit** `post_products` product matching that kind. Loose dept/range/brand-only linkage is **not** enough for kind chips.
- **Promotions:** Kind = at least one linked promo product matches that kind.
- **Hero pick:** newest eligible post by `coalesce(time_post, created_at)`.
- **Feed visibility:** drop timeline items with zero resolved linked products.

---

## 6. Device polish & bugs fixed after first QC

| Issue | Root cause / fix |
|-------|------------------|
| Hero + feed did not change on kind chip | Post filter was too loose (taxonomy auto-link). Tightened to `category_id` / explicit `post_products` only for kind chips. |
| See all looked like a text link | Replaced with full-width outline control (`StorefrontSeeAllButton`). |
| Outline border missing on device | Fabric quirk: `Pressable` **function-form** `style={(s) => …}` dropped border paint. Border moved to static outer `View`. |
| See all label stuck to top of button | Same Fabric quirk also dropped **layout** props (`flex`, `minHeight`, `padding`) from the style callback. Runtime `onLayout` proved Pressable height collapsed to ~15px inside a 46px box. Fix: **static** Pressable style object; pressed tint via children render-prop. |
| Rail / chrome layout fragility | Fixed chrome height; rail single-row with explicit height; measured chrome `onLayout` drives no-hero `paddingTop`. |
| Expo Go SDK mismatch | Customer app upgraded **54 → 57**; `expo-av` → `expo-video`. |
| Empty post/promo blocks | Filter feed to items with ≥1 linked product. |

---

## 7. Expo SDK 57 (customer app)

- Target: physical iPhone Expo Go (SDK 57).
- Scope: `asf-customer-app` only for this upgrade.
- Outcome: app loads on device after upgrade; Storefront occupation Home/Shop exercised on device during polish.

---

## 8. Success criteria (as of device polish)

| Area | Status |
|------|--------|
| `kind_key` + mock occupations (≥3) + kinds (≥3) + empty combos | Done (plus extra Coming-soon ranges) |
| Shop occupations-only + Coming soon | Done |
| Home rail refilters hero / arrivals / feed | Done (with tightened post matching) |
| Post hero; no product fallback | Done |
| See all (arrivals → product-list; feed → linked-products) | Done |
| Outline See all vertically centered | Done (device-confirmed) |
| Unassigned only under All | Done |
| Feed hides zero-linked items | Done |
| Classic / Atelier / Noir IA | Not intentionally changed; spot-check on device still recommended |
| Final curated merchandising / image regen | **Out of scope** — mock remains demo-quality |

---

## 9. Explicit non-goals (still true)

- Do not change Classic / Atelier / Noir Home or Shop IA for this program.
- Do not show departments or brands in Storefront Shop sidebar or next-level tiles.
- Do not fall back Home hero to a product.
- Do not hide Coming soon categories from an occupation’s tile row.
- Do not hard-delete order-referenced products or department/brand tables.
- Do not treat deleted agent-prompt files as wiki sources.

---

## 10. Open / follow-up

1. Optional device theme-switch spot-check (Classic / Atelier / Noir) after Storefront work.
2. Curated occupation media / copy polish (beyond mock).
3. Admin UI for occupation taxonomy + `kind_key` (Next.js) — not started.
4. Whether to commit the SDK 57 + occupation pack as one or two commits — Stanley’s call.
5. Confirm whether any remaining chrome-overlap flashes before hero media loads still bother on device (separate from See all alignment, which is fixed).

---

## 11. Key file index

```
asf-vault/raw/sources/
  2026-09-03-expo-customer-storefront-occupation-taxonomy-plan.md
  2026-09-03-expo-customer-storefront-occupation-taxonomy-accomplishment.md  ← this file
  2026-09-03-expo-customer-storefront-occupation-taxonomy-qc-notes.md

supabase/migrations/
  20260903_expo_customer_storefront_occupation_taxonomy.sql
  20260903160000_expo_customer_storefront_more_occupation_ranges.sql

asf-customer-app/
  lib/storefront/{shopTaxonomy,homeCategoryFilter,newestProducts}.ts
  lib/browseNavigation.ts
  components/storefront/{StorefrontHomeCategoryRail,StorefrontSeeAllButton,StorefrontFeedBlock,StorefrontTaxonomyTile}.tsx
  themes/storefront/screens/{Home,Shop}.tsx
  app/(tabs)/browse/{product-list.tsx,_layout.tsx}
  i18n/locales/{en,zh-CN,ms}.json
  package.json  # expo ^57
```
