# ASF-2 Mobile App Strategy — 2026-04-13

**Date:** 2026-04-13  
**Decision:** Use Expo + React Native for both mobile apps  
**Apps:** `asf-customer-app` (customer) + `asf-staff-app` (staff/boss)

---

## Technology Decision: Expo (React Native) vs Flutter

### Decision: Expo + React Native

**Rationale for solo developer coming from React/TypeScript background:**

| Factor | Expo (React Native) | Flutter |
|---|---|---|
| Language | TypeScript — same as entire web project | Dart — new language |
| Supabase package | `@supabase/supabase-js` — identical to web | `supabase-flutter` — different package |
| Share code with web | Copy context files directly | Full rewrite in Dart |
| State management | React Context (already mastered) | BLoC/Riverpod/Provider — complex |
| Styling | NativeWind (Tailwind class names) | Custom widget system, no CSS |
| Navigation | `expo-router` (file-based, same as Next.js) | go_router / Navigator 2.0 |
| OTA updates | EAS Update (push JS fixes without App Store review) | Not available |
| Payments | `@stripe/stripe-react-native` | `flutter_stripe` |
| Previous Flutter experience | — | Abandoned due to BLoC architecture complexity |

**Key code reuse:** All 35+ context providers are written in TypeScript. With Expo, they are copied directly into the mobile project and work identically. With Flutter, each context would require a complete Dart rewrite.

### Flutter is not recommended because:
1. Solo developer with limited Flutter experience (abandoned previous Flutter project due to BLoC)
2. All business logic already in TypeScript contexts
3. No CSS — Tailwind knowledge doesn't transfer
4. Longer time-to-first-screen for someone already proficient in React

---

## Push Notifications — No Firebase Required

### How Expo Push Notifications work

Expo provides a **unified push notification service** that handles both APNs (iOS) and FCM (Android) through a single API. You do not configure Firebase directly.

**Flow:**
```
1. App starts → expo-notifications.getExpoPushTokenAsync()
   Returns: "ExponentPushToken[xxxxxxxxxxxxxx]"

2. App saves token to Supabase:
   INSERT INTO push_tokens (user_id, token, platform) VALUES (...)

3. When event fires (order shipped, new order, etc.):
   Supabase Edge Function OR Next.js webhook handler
   → reads push_token for target user
   → POST https://exp.host/--/api/v2/push/send
     { to: "ExponentPushToken[xxx]", title: "...", body: "..." }

4. Expo Push Service routes to APNs (iOS) or FCM (Android)
5. OS displays notification on lock screen, notification centre
```

**Zero Firebase configuration required.** No `google-services.json`, no APNs certificates to manage manually, no Firebase project setup. Expo manages the relay.

### Lock screen behaviour
Notifications appear on the lock screen because the OS (not the app) displays them. The app does not need to be running. This works identically to any other app notification.

**Caveat — Chinese-brand Android phones (Xiaomi, OPPO, vivo, Huawei):**
These OEMs apply aggressive battery optimization that can kill background services and delay notifications. Common in Malaysia. Mitigation: prompt users to whitelist the app in battery settings. This is an Android OEM issue affecting all apps, not specific to Expo.

### When you would need Firebase directly
- Topic-based broadcast messaging at large scale (>1M users)
- Background data sync that must survive force-kill on Android

Neither applies at this stage. Expo Push Service is sufficient.

### DB table required
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

---

## Staff Mobile App (`asf-staff-app`)

### When to start
**Immediately after Step 1 (DB migrations) of the immediate execution plan.** The staff app's core features (orders, stock, posts management) read directly from Supabase — the same data the web admin panel uses. It does not need Stripe or Delyva API routes to be useful. A warehouse person or manager can use the staff app for order + stock management even before checkout is working on the web.

The only staff feature that depends on API routes is "Ship Order" — needs Delyva `create-shipment` (Step 2 of execution plan).

### Project structure
```
asf-staff-app/
  app/
    (auth)/
      sign-in.tsx
    (app)/
      _layout.tsx          ← checks staff_roles, renders role-appropriate bottom tabs
      dashboard/           ← owner + manager
      orders/
        index.tsx          ← order list with filters
        [orderId].tsx      ← order detail + ship button
      products/            ← manager + warehouse
      stock/               ← manager + warehouse
      posts/               ← manager + staff
      analytics/           ← owner only
      support/             ← support role
      settings/
  context/                 ← copy exact same .tsx files from asf-2-next/src/context/
  utils/
    supabaseClient.ts      ← same pattern as web
  hooks/
    useStaffRole.ts        ← reads staff_roles, returns current role
```

### Role-based tab navigation

On login, fetch `staff_roles` row for the authenticated user. If no row exists, deny access. Store role in `StaffRoleContext`. `_layout.tsx` renders different `<Tabs>` based on role:

| Role | Tabs shown |
|---|---|
| `owner` | Dashboard, Orders, Products, Analytics, Settings |
| `manager` | Orders, Products, Stock, Posts, Settings |
| `staff` | Orders, Stock, Settings |
| `warehouse` | Stock, Settings |
| `support` | Orders, Support, Settings |

Supabase RLS policies enforce this server-side — a `warehouse` user cannot query analytics or payments tables regardless of what the client requests.

### Key screens

**Orders screen (all roles, filtered by permission):**
- FlatList with pull-to-refresh
- Status filter tabs: All / Pending / Processing / Awaiting Pickup / Shipped / Delivered
- Tap → order detail: items with variant names + images, customer address, payment status
- Manager+: "Update Status" dropdown, "Ship Order" button (calls Delyva API)

**Stock screen (warehouse + manager):**
- Product list with current stock count per product
- Tap product → variant grid showing color+size combinations and quantities
- "Add Stock" / "Return Stock" inline buttons per variant row
- Low stock products highlighted at top

**Analytics screen (owner only):**
- Revenue card (today / this week / this month)
- Order count chart
- Top products by units sold
- All real data from DB (not mock)

**Dashboard screen (owner + manager):**
- KPI cards: today's revenue, pending orders, low stock count, new customers
- Recent activity feed

### Push notification triggers for staff
- New customer order placed → notify `owner` and `manager` role holders
- Low stock threshold crossed → notify `warehouse` and `manager`
- New support ticket → notify `support` role holders
- Order status update (from customer cancel etc.) → notify relevant staff

---

## Customer Mobile App (`asf-customer-app`)

### When to start
Start building screens in parallel with Steps 1–3 of the execution plan. The checkout screen must wait for Stripe (Step 2-3 complete) but all browsing, wishlist, and cart screens can be built earlier.

### Project structure
```
asf-customer-app/
  app/
    (auth)/
      sign-in.tsx
      sign-up.tsx
      forgot-password.tsx
    (tabs)/
      _layout.tsx          ← bottom tabs: Home, Browse, Cart, Wishlist, Profile
      index.tsx            ← home page
      browse/
        index.tsx          ← product section
        [productId].tsx    ← product details
      cart.tsx
      wishlist.tsx
      profile/
        index.tsx          ← settings / account
        orders.tsx         ← order history
        rewards.tsx        ← points + stamps
        notifications.tsx
  context/                 ← copy same context files
  components/              ← shared UI (ProductCard, VariantSelector, etc.)
```

### Stripe in React Native
```
npm install @stripe/stripe-react-native
```
- Wrap app in `<StripeProvider publishableKey={...}>`
- Checkout screen calls `POST https://yourapp.vercel.app/api/stripe/create-payment-intent`
- Uses `usePaymentSheet()` or `useConfirmPayment()` from the SDK
- **Same API endpoint as the web checkout** — no additional backend work

### Screens to build

**Product details:** Swipeable image gallery (react-native-reanimated), variant selector (color swatches + size buttons), stock indicator, add-to-cart + wishlist buttons.

**Cart:** Mirrors the web cart — already well-implemented with real data. Direct port.

**Checkout:** Shipping address form → Delyva rate selection → Stripe `PaymentSheet` native UI.

**Order history + detail:** FlatList of past orders, tap for detail + Delyva tracking timeline.

**Rewards:** Points balance (real data) + stamp card (real Supabase data after Step 11 of execution plan).

### Push notifications for customer
- Order confirmed (after payment webhook fires)
- Order status changed (shipped, delivered, etc.)
- Promotional announcements
- Wishlist item back in stock (future feature)

---

## Shared Infrastructure

Both mobile apps share:
- Supabase backend (same project)
- Same Next.js API routes for Stripe and Delyva
- Same TypeScript types from `database.types.ts`
- Same context files (copied, not reimplemented)
- Same Expo Push Notification flow
- Same `push_tokens` Supabase table (different rows per user type)

Neither app needs its own backend. The web app (`asf-2-next`) provides all server-side functionality.

---

## Build & Deployment

- **Expo EAS Build**: cloud build service, no need for local Xcode/Android Studio for most builds
- **EAS Update**: push JavaScript-only fixes without App Store review (critical for bug fixes)
- **Platforms**: iOS + Android from a single codebase
- **Requirements**: Apple Developer Account ($99/yr) + Google Play Developer ($25 one-time)
