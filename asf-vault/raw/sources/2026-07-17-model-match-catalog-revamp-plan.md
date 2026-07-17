# MODEL MATCH Catalog Content Revamp — Plan (2026)

**Project**: ASF-2 live Supabase catalog + seed SQL mirrors  
**Date**: July 17, 2026  
**Status**: Approved for implementation  
**Companion prompts**: `2026-07-17-model-match-catalog-revamp-agent-prompts.md`  
**DB**: `gswszoljvafugtdikimn`  
**Builds on**: Home revamp (`2026-07-16-expo-customer-home-revamp-plan.md`), minimart demo seed (`2026-04-25-demo-data-plan.md`), i18n seeds (`docs/sql/CUSTOMER_I18N_SEED_*.sql`)

---

## 1. What we are doing

Retheme the **live demo catalog** from Malaysia **minimart** (snacks / drinks / household) to **MODEL MATCH footwear & lifestyle**, so the Expo home (hero, offers, new arrivals, highlights) no longer looks cheap or brand-incoherent.

Locked scope from stakeholder session:

| Decision | Choice |
|----------|--------|
| Direction | **A1 — MODEL MATCH footwear / lifestyle** |
| Promotions | **Retheme** (names, codes, dates) — not date-extend only |
| Depth | **Images + names/captions** (and short descriptions) |
| Image quality bar | Every URL must be **reachable (HTTP 200)** and **visually appropriate** (verified via browser / fetch before apply) |

**In scope**
- `products` (20 rows — keep IDs `bbbbbbbb-1111-1111-1111-000000000001` … `020`)
- `product_medias` (update `media_url`; keep one primary image per product for v1)
- `categories` (4 rows — keep IDs `aaaaaaaa-1111-…001` … `004`)
- `posts` + `post_medias` (6 posts — keep IDs `cccccccc-1111-…001` … `006`)
- `promotions` (4 rows — retheme + make active **now**)
- Translation overlays: `product_translations`, `category_translations`, `post_translations` for **`en`** and **`ms`**
- Durable SQL seed files under `docs/sql/` (and optional `supabase/migrations/` only if team prefers versioned apply — prefer docs/sql + MCP `execute_sql` for data UPDATEs)

**Out of scope**
- Expo / Next.js UI redesign (home revamp already shipped)
- New product UUIDs / deleting catalog rows
- Brand / department / range table overhaul (optional light rename only if blocking; default leave)
- Uploading binaries to Supabase Storage (use curated public image URLs)
- Pixel2Motion splash asset changes
- Creating fake promotions in app code

---

## 2. Why (current state)

| Layer | Problem |
|-------|---------|
| Brand | App shows **MODEL MATCH**; catalog is Coke / ramen / detergent |
| Images | Generic Unsplash food shots; **URL reuse** across products |
| Hero / posts | Same cheap pool as product thumbs |
| Promotions | All `end_date` in Apr–Jun 2026 → home offers strip empty (filter correct) |
| i18n | `en` / `ms` translation rows still describe minimart |

Feature flag `promotions` is **enabled**. Offers UI already works once active dated promos exist.

---

## 3. Target catalog (keep UUIDs)

### 3.1 Categories (rename in place)

| ID suffix | zh-CN name | en | ms |
|-----------|------------|----|----|
| `…001` | 运动鞋 | Sneakers | Kasut sukan |
| `…002` | 皮鞋与靴 | Formal & Boots | Kasut rasmi & but |
| `…003` | 配件 | Accessories | Aksesori |
| `…004` | 鞋类护理 | Shoe Care | Penjagaan kasut |

Product↔category links (`product_categories`) should be remapped so each product sits in a sensible category (see §3.2). If remapping is awkward, still rename categories and assign products in batches in Agent 2.

### 3.2 Products (suggested lineup — agent may refine names but keep footwear theme)

Keep IDs `bbbbbbbb-1111-1111-1111-00000000000N`. Update `name`, `description`, `price` (MYR, footwear-realistic).

| # | Theme (EN guide) | Suggested MYR | Category |
|---|------------------|---------------|----------|
| 01 | Classic white court sneaker | 189–219 | Sneakers |
| 02 | Urban runner | 249–279 | Sneakers |
| 03 | Night street high-top | 289–319 | Sneakers |
| 04 | Minimal leather derby | 329–369 | Formal & Boots |
| 05 | Black chelsea boot | 379–419 | Formal & Boots |
| 06 | Trail hiker mid | 309–349 | Formal & Boots |
| 07 | Soft knit slip-on | 169–199 | Sneakers |
| 08 | Retro court low | 209–239 | Sneakers |
| 09 | Platform sandal | 149–179 | Sneakers |
| 10 | Penny loafer | 259–299 | Formal & Boots |
| 11 | Chunky dad sneaker | 239–269 | Sneakers |
| 12 | Performance trainer | 279–309 | Sneakers |
| 13 | Suede ankle boot | 349–389 | Formal & Boots |
| 14 | Canvas low classic | 139–169 | Sneakers |
| 15 | Sock runner | 189–219 | Sneakers |
| 16 | Leather belt | 79–99 | Accessories |
| 17 | Crew socks 3-pack | 35–49 | Accessories |
| 18 | Shoe care kit | 49–69 | Shoe Care |
| 19 | Mini crossbody | 119–149 | Accessories |
| 20 | Logo cap | 69–89 | Accessories |

**zh-CN `name` format**: prefer `中文名` or `中文名 (English)` matching existing bilingual style — keep consistent across all 20.

**Descriptions**: 1 short sentence each (zh base table); en/ms in translations.

### 3.3 Posts (editorial lookbook)

Keep IDs `cccccccc-1111-…001` … `006`. Update `caption` (zh) + translation `name` / `caption` / `cta_text`.

Themes (examples — agents write final copy):

1. New season drop / court classics  
2. Night city high-tops  
3. Chelsea boot editorial  
4. Trail weekend  
5. Accessories finish the look  
6. Care ritual / polish moment  

Hero uses **newest post by `created_at`**. After caption/media updates, optionally bump `created_at` on the strongest campaign post so home hero shows the best image (document choice in SQL comments).

### 3.4 Promotions (retheme + valid window)

Retheme all 4 existing promotion rows (keep IDs if stable; otherwise UPDATE in place). Requirements:

- `active = true`, `deleted_at IS NULL`
- `start_date` ≤ now
- `end_date` ≥ **2026-12-31** (or null) so demos stay green for months
- Footwear-appropriate names + codes

Suggested set:

| Code | Name (zh + en sense) | Type | Value |
|------|----------------------|------|-------|
| `WELCOME15` | 新会员首单 15% / New member 15% off | percentage | 15 |
| `MODEL10` | MODEL MATCH 全场 10% / Sitewide 10% | percentage | 10 |
| `MEMBER20` | 会员专属 RM20 / Member RM20 off | fixed | 20 |
| `KICKS50` | 满额减 RM50 / RM50 off (or 8–12% — pick one and document) | fixed or percentage | 50 or 12 |

Clear old minimart codes (`LABOUR15`, `BEV2FOR1`, etc.).

---

## 4. Image rules (non-negotiable)

1. **Unique URL per product** and per post — no reuse across entities.  
2. Prefer **portrait / product-forward** footwear or lifestyle shots that read well at 3:4 crop.  
3. Public HTTPS URLs only (Unsplash / Pexels / similar). Prefer stable `images.unsplash.com` or `images.pexels.com` forms with explicit width (e.g. `w=1200`).  
4. **Reachability**: every final URL must return **HTTP 200** (HEAD or GET) before SQL apply.  
5. **Appropriateness**: open in browser (or fetch + screenshot); reject if:
   - broken / placeholder / logo-only garbage  
   - wrong category (food, unrelated object)  
   - NSFW, gore, text-spam memes  
   - extreme watermark clutter  
6. Record verified URLs in the seed SQL file with a short comment (`-- verified YYYY-MM-DD`).  
7. Do **not** use AI-generated image APIs unless human explicitly asks later.

### Verification workflow (for implementers)

For each candidate URL:

1. HTTP check (`curl -sI` or browser navigate) → must be 200  
2. Visual check (browser open / screenshot) → footwear/lifestyle appropriate  
3. Only then include in `UPDATE product_medias` / `post_medias`

---

## 5. Implementation phases → agents

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| 1 | Agent 1 | Retheme promotions (live SQL + `docs/sql/` seed) |
| 2 | Agent 2 | Rename categories + all 20 products (zh names/descriptions/prices) + category links |
| 3 | Agent 3 | Product images **001–010** — browser-verified URLs |
| 4 | Agent 4 | Product images **011–020** — browser-verified URLs |
| 5 | Agent 5 | Posts captions + post images (6) — browser-verified |
| 6 | Agent 6 | `en` + `ms` translations for categories, products, posts; refresh seed SQL files |

Agents run **sequentially**. After each: confirm SQL applied (MCP or documented run) and spot-check counts.

---

## 6. Files to produce / update

| Path | Role |
|------|------|
| `docs/sql/MODEL_MATCH_CATALOG_REVAMP.sql` | Single idempotent-ish UPDATE script (sections per agent append) |
| `docs/sql/CUSTOMER_I18N_SEED_EN.sql` | Replace minimart product/post/category en rows with MODEL MATCH |
| `docs/sql/CUSTOMER_I18N_SEED_MS.sql` | Same for ms |
| Optional: `asf-vault/raw/sources/2026-07-17-model-match-catalog-revamp-session-accomplishment.md` | After ship |

**Do not** invent new Expo screens for this program.

---

## 7. Success criteria

- [ ] Home offers strip shows **rethemed** active promos  
- [ ] Home hero / featured posts show **footwear editorial** (not snacks)  
- [ ] New arrivals show **unique** shoe/lifestyle images; no duplicate URLs  
- [ ] Product names read as MODEL MATCH footwear catalog in zh + en + ms  
- [ ] Every media URL used returns HTTP 200 and passed visual appropriateness  
- [ ] Existing UUIDs preserved (cart/wishlist/history demos don’t orphan if any)  
- [ ] Seed SQL checked into repo for re-apply  
- [ ] No commit/push/merge unless human asks  

---

## 8. Smoke-test (operator phone)

1. Force-reload Expo app  
2. Home: MODEL MATCH navbar + offers strip visible  
3. Hero image is footwear/lifestyle, not food  
4. New arrivals: distinct shoe images + footwear names  
5. Highlights / posts strip matches new captions  
6. Switch locale en / ms — names/captions translate  
7. Tap offer with code → cart prefill still works  

---

## 9. Related

- Home UI: `2026-07-16-expo-customer-home-revamp-plan.md`  
- Wiki: [[wiki/concepts/pixel2motion-splash-asf-2]], [[wiki/entities/asf-2]]  
- Prior demo theme (superseded for this DB): `2026-04-25-demo-data-plan.md`
