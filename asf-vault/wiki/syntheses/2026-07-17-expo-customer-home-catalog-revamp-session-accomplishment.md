---
title: "Expo customer Home + MODEL MATCH catalog revamp — session accomplishment"
type: synthesis
updated: 2026-07-17
sources: 4
tags: [asf-2, expo, home, model-match, catalog, promotions, i18n, navigation]
---

# Expo customer Home + MODEL MATCH catalog revamp — session accomplishment

**Date:** 2026-07-16 to 2026-07-17  
**Primary app:** `asf-customer-app/` (Expo + React Native)  
**Live Supabase project:** `gswszoljvafugtdikimn`  
**Status:** Implemented and typechecked; device smoke-tested iteratively  
**Git:** No commit, push, or merge was performed

---

## 1. Session outcome

This program changed the Expo customer Home from a generic web-port storefront into a branded **MODEL MATCH** entry point, then replaced the mismatched minimart demo data with a coherent footwear and lifestyle catalog.

The completed flow now includes:

1. Tenant-configurable MODEL MATCH branding
2. A shorter, shop-focused editorial hero with improved contrast
3. Once-per-session arrival motion and haptic feedback (仪式感)
4. A compact horizontal New Arrivals row
5. A live active-promotions strip with cart code prefill
6. A 20-product footwear/lifestyle catalog with unique media
7. Six footwear editorial posts, including the Home hero
8. Chinese, English, and Bahasa Melayu content overlays
9. Correct product-detail return navigation based on entry point

---

## 2. Product decisions (locked)

| Decision | Final choice |
|----------|--------------|
| Pilot brand | **MODEL MATCH** |
| Tenant strategy | Read branding from a local `tenantBrand` module now; preserve a replaceable interface for remote tenant config later |
| Home commercial goal | Address both app desirability and product purchase intent |
| Hero | Shorten from approximately 55% to approximately 42% of viewport; prioritize Shop CTA |
| New Arrivals | One horizontally scrollable row instead of a 2-column, 6-item grid |
| Offers | Show **all currently active** promotions; hide section if none |
| Ceremony frequency | Once per JavaScript session; replay after cold restart, not on tab returns |
| Catalog direction | **A1 — MODEL MATCH footwear/lifestyle**, replacing minimart data |
| Catalog depth | Replace images, names, descriptions, category mapping, post captions, and translations |
| Image acceptance | Public HTTPS, reachable, visually appropriate, and unique per product/post |
| Locale model | `zh-CN` uses canonical base rows; `en` and `ms` use translation overlays |
| Promo localization | Chinese canonical DB names; English/Malay Home cards use promo codes plus localized discount text |
| Product-detail return | Home → Home; Catalog → Catalog; Wishlist → Wishlist |

---

## 3. Home experience delivered

### Brand and hero

- Added `lib/tenantBrand.ts` with `displayName: "MODEL MATCH"` and optional tagline.
- Removed the Home navbar’s hardcoded `SYSTEM APP FORMULA`.
- Reduced hero height to approximately `0.42 × viewport height`.
- Made the Shop CTA primary and Highlights secondary.
- Added layered dark scrims behind the transparent navbar and hero caption so white text/icons remain readable over light photography.
- Preserved the solid navbar state after scrolling.

### Arrival ceremony (仪式感)

- Added `lib/homeSessionCeremony.ts` as an in-memory session gate.
- Added `components/home/HomeArrivalCeremony.tsx`.
- Entrance uses a subtle delayed opacity/vertical motion sequence and one light haptic.
- Reduced-motion users receive immediate content without unnecessary animation.
- Returning to Home during the same session does not replay the ceremony.

### New Arrivals

- Replaced the 2-column wrapped grid with one horizontal row.
- Cards retain 3:4 media, localized product name, MYR price, and wishlist control.
- Added a localized “See all” route to the catalog.

### Promotions

- Added `components/home/HomeOffersStrip.tsx`.
- Added `lib/promotions/activePromotions.ts` for date/status filtering and localized discount values.
- Offers appear between Hero and New Arrivals when the feature flag is enabled and active rows exist.
- A coded offer routes to Cart with `promoCode`; Cart prefills and can validate it once cart lines exist.

---

## 4. Live MODEL MATCH catalog delivered

The existing demo UUIDs were preserved to avoid orphaning relationships and demo history.

### Catalog data

| Entity | Delivered |
|--------|-----------|
| Categories | 4 renamed: Sneakers, Formal & Boots, Accessories, Shoe Care |
| Products | 20 renamed/repriced with footwear/lifestyle descriptions |
| Product category links | Remapped to the four new categories |
| Product media | 20 unique footwear/lifestyle URLs |
| Editorial posts | 6 new MODEL MATCH captions and images |
| Hero | Court-classics editorial post promoted to newest Home hero |
| Translation overlays | Complete `en` + `ms` rows for 20 products, 4 categories, and 6 posts |

Durable SQL source:

- `docs/sql/MODEL_MATCH_CATALOG_REVAMP.sql`
- `docs/sql/CUSTOMER_I18N_SEED_EN.sql`
- `docs/sql/CUSTOMER_I18N_SEED_MS.sql`

### Active promotions

All four promotions are active through `2026-12-31`:

| Code | Discount |
|------|----------|
| `WELCOME15` | 15% |
| `MODEL10` | 10% |
| `MEMBER20` | RM20 fixed |
| `KICKS12` | 12% |

---

## 5. Follow-up defects found and resolved

### Offers missing on physical phones

**Cause:** `PromotionContext` depended on the Next.js `/api/promotions` URL. On an Expo phone, the URL could be missing, loopback-only, or unavailable. The failure was swallowed into an empty list.

**Resolution:**

- Improved Expo API host inference and loopback handling in `lib/api.ts`.
- Added a direct Supabase read fallback in `PromotionContext`.
- Normalized `discount_value` when DB/API transport returns numeric strings.
- Kept server validation as the authority when applying a promo in Cart/Checkout.

### Some language content appeared stuck in Chinese

**Cause:** Product/category/post translations were complete; the visible gap was Chinese-only `promotions.name`, because no `promotion_translations` table exists. Tab labels could also retain an old locale until remount.

**Resolution:**

- `zh-CN` continues showing canonical promo names.
- `en`/`ms` show stable promo codes (`WELCOME15`, etc.) with localized discount text.
- Tab layout remounts on locale change.
- Content translation maps are no longer erased if all translation fetches fail.
- Home continues using `translateProduct`, `translateCategory`, and `translatePost`.

### Product navigation restored the wrong shoe

**Cause:** Home product presses pushed product-detail screens into the Browse stack. The first product remained underneath, and the Shop tab restored the stale detail route.

**Resolution:**

- Added `lib/browseNavigation.ts`.
- Product opens use a normalized `returnTo` value: `home`, `catalog`, or `wishlist`.
- Product-detail back/hardware-back honors the origin.
- Browse stack has `initialRouteName: "index"`.
- Pressing the Shop tab explicitly focuses the catalog list.
- Product IDs update without accumulating stale product-detail screens.

Final navigation matrix:

| Entry | Product-detail Back |
|-------|---------------------|
| Home | Home |
| Shop catalog | Shop catalog |
| Wishlist | Wishlist |
| Shop tab press | Always opens catalog list |

---

## 6. Primary files delivered

### New Expo files

- `asf-customer-app/components/home/HomeArrivalCeremony.tsx`
- `asf-customer-app/components/home/HomeOffersStrip.tsx`
- `asf-customer-app/lib/homeSessionCeremony.ts`
- `asf-customer-app/lib/tenantBrand.ts`
- `asf-customer-app/lib/promotions/activePromotions.ts`
- `asf-customer-app/lib/browseNavigation.ts`

### Major Expo files updated

- `asf-customer-app/app/(tabs)/index.tsx`
- `asf-customer-app/app/(tabs)/_layout.tsx`
- `asf-customer-app/app/(tabs)/browse/_layout.tsx`
- `asf-customer-app/app/(tabs)/browse/index.tsx`
- `asf-customer-app/app/(tabs)/browse/[productId].tsx`
- `asf-customer-app/app/cart.tsx`
- `asf-customer-app/app/wishlist.tsx`
- `asf-customer-app/context/PromotionContext.tsx`
- `asf-customer-app/context/ContentTranslationContext.tsx`
- `asf-customer-app/lib/api.ts`
- `asf-customer-app/i18n/locales/zh-CN.json`
- `asf-customer-app/i18n/locales/en.json`
- `asf-customer-app/i18n/locales/ms.json`

### SQL files

- `docs/sql/MODEL_MATCH_CATALOG_REVAMP.sql` (new)
- `docs/sql/CUSTOMER_I18N_SEED_EN.sql` (updated)
- `docs/sql/CUSTOMER_I18N_SEED_MS.sql` (updated)

---

## 7. Verification completed

- `npm run typecheck` passed after the Home implementation and each defect fix.
- Locale parity check passed: **724 keys × 3 locales**.
- Live translation coverage confirmed:
  - 20/20 products for `en` and `ms`
  - 4/4 categories for `en` and `ms`
  - 6/6 posts for `en` and `ms`
- Product media: **20 distinct URLs**, no duplicates.
- Post media: **6 distinct URLs**, no overlap with product URLs.
- Media candidates were checked for reachability and visual relevance; a final sample HTTP sweep returned 200.
- Physical-phone screenshots confirmed the MODEL MATCH hero, horizontal New Arrivals, product detail, categories, and editorial posts.

---

## 8. Known gaps and future work

1. `tenantBrand` is a local configuration module; remote per-tenant config is deferred.
2. Pixel2Motion splash remains authored specifically for MODEL MATCH; dynamic tenant splash generation is deferred.
3. Promotion names/descriptions are Chinese canonical because `promotion_translations` does not exist.
4. Public third-party image URLs can suffer link rot; Supabase Storage migration is a future hardening option.
5. Promotion demo dates end on `2026-12-31`; refresh or make campaign scheduling intentional before that date.
6. Next.js customer Home parity was not part of this program.
7. Full automated navigation/UI tests remain future work; verification was typecheck + live DB checks + phone smoke testing.

---

## 9. Phone verification flow

```bash
cd asf-customer-app
npx expo start
# If LAN discovery fails:
npx expo start --tunnel
```

Recommended checks:

1. Cold start → one Home ceremony + haptic.
2. Return to Home in the same session → no ceremony replay.
3. Hero/navbar remains readable over light media.
4. Offers strip shows all four active codes.
5. New Arrivals scrolls horizontally.
6. Home → product → Back → Home.
7. Shop → product → Back → Shop catalog.
8. Shop tab always opens the catalog.
9. Switch zh-CN → en → ms and confirm Home, tabs, products, categories, posts, and offer discount copy update.
10. Tap a promo code and confirm Cart prefill/validation.

---

## 10. Source documents

- [[wiki/sources/2026-07-16-expo-customer-home-revamp-plan]]
- [[wiki/sources/2026-07-17-model-match-catalog-revamp-plan]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/concepts/customer-i18n-asf-2]]
- [[wiki/concepts/pixel2motion-splash-asf-2]]
- [[wiki/entities/asf-2]]
