---
title: "Mobile Apps Progress — ASF-2 (Apr 13–25, 2026)"
type: source
updated: 2026-04-25
tags: [mobile, expo, react-native, staff-app, customer-app, asf-2]
---

# Mobile Apps Progress — ASF-2 (Apr 13–25, 2026)

**Raw source**: [raw/sources/2026-04-25-mobile-apps-progress.md](../raw/sources/2026-04-25-mobile-apps-progress.md)

## Summary

Between 2026-04-13 and 2026-04-25, both Expo React Native mobile apps for ASF-2 were built and made functional via Expo Go testing.

## Key Claims

- **Customer app** (`asf-customer-app`): Feature-complete, APK built. All major screens (Home, Browse, Highlights, Cart, Checkout/Stripe, Product Detail, Wishlist, Profile/Settings) implemented. UI matches the Next.js web app. Stripe uses native `@stripe/stripe-react-native` PaymentSheet.
- **Staff app** (`asf-staff-app`): Feature-complete, tested on iPhone via Expo Go. Screens: Dashboard, Orders, Products (full CRUD + image upload), Posts, Stocks (with purchase orders), Analytics (custom bar charts), Chat (WhatsApp-style), Settings.
- **Role-based access** enforced in staff app tab bar: 5 roles (owner, manager, staff, warehouse, support) each see different tab combinations.
- **Chat system** (staff): WhatsApp-style flat list + inverted FlatList chat window. Support tickets accessible via Chat stack (not separate tab).
- **Analytics** (staff): Uses pure View-based charts — no external charting library. Uses `getDateRange` utility shared with web.
- **Product images** (staff): Upload/delete via `expo-image-picker` + Supabase Storage.

## Critical Schema Corrections

The `DATABASE.md` doc is outdated. True schema from `database.types.ts`:

| Table | Doc says | Actual |
|-------|----------|--------|
| `products` | `active: boolean` | `status: string` ('Published'/'Draft') |
| `product_stock` | `quantity: integer` | `count: number` |
| `product_stock_logs` | `quantity`, `action_type` | `amount`, `type` |
| `posts` | no `name`, no `active` | has `name`, `active` |
| `promotions` | no `code`/`max_uses` | has `code`, `max_uses`, `uses_count` |

**New tables not in DATABASE.md**:
- `announcements`: `id, title, message, image_url, cta_label, cta_url, type, active, starts_at, ends_at, created_at`
- `promotion_products`: junction table `(promotion_id, product_id)` — no `id` column

## Expo Router Lessons Learned

- Every tab directory under `(tabs)/` **must** have a `_layout.tsx` (Stack layout). Without it, expo-router builds a different route node structure causing `useSortedScreens` to fail matching, so the tab appears at the end with default options.
- Never use `href` + `tabBarButton` on the same `Tabs.Screen` — causes runtime error.
- Never use `href` in tab definitions at all if standard navigation suffices — the processor wraps it in a `<Link>` which can interfere with route-node matching.
- Realtime channel names must be unique project-wide (don't use table names as channel IDs).

## Known Pending Issues

- Dashboard tab still appears last in bottom nav with wrong icon — investigation ongoing; `dashboard/_layout.tsx` just added; may need Expo Go cache clear + full rewrite of `_layout.tsx` to avoid helper function returning elements.
- No EAS build for staff app (iOS) yet.

## Next Priorities

1. Fix staff app bottom nav (another agent)
2. Demo data: populate Supabase with realistic Malaysia minimart data
3. EAS iOS build for staff app
4. Production deployment

## Wikilinks

- [[wiki/entities/asf-2]]
- [[wiki/concepts/mobile-app-architecture-asf-2]]
- [[wiki/sources/2026-04-13-mobile-app-strategy]]
- [[wiki/sources/2026-04-13-immediate-execution-plan]]
