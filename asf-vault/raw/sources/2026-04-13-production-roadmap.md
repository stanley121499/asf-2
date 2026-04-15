# ASF-2 Production Roadmap — 2026

**Date:** 2026-04-13  
**Status:** Approved for execution  
**Scope:** Full production-ready build-out of ASF-2 platform across web (Next.js), staff mobile app, and customer mobile app

---

## Final Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHARED BACKEND                           │
│              Supabase (PostgreSQL + Auth + Storage              │
│                         + Realtime)                             │
└──────────┬─────────────────┬──────────────────────┬────────────┘
           │                 │                      │
┌──────────▼──────┐  ┌──────▼──────────┐  ┌───────▼───────────┐
│   asf-2-next    │  │ asf-customer-   │  │  asf-staff-app    │
│  (Next.js 14)   │  │  app (Expo RN)  │  │   (Expo RN)       │
│                 │  │                 │  │                   │
│ Web admin panel │  │ Customer mobile │  │ Staff/boss mobile │
│ Web storefront  │  │ app             │  │ app w/ RBAC       │
│ API routes      │  │                 │  │                   │
│ (Stripe, Delyva │  └─────────────────┘  └───────────────────┘
│  webhooks)      │
└─────────────────┘
         │
         │ Server-to-server (API keys never leave server)
         ▼
┌─────────────────┐   ┌──────────────────┐
│  Stripe API     │   │  Delyva API       │
│  (payments)     │   │  (Malaysian       │
│                 │   │   couriers)       │
└─────────────────┘   └──────────────────┘
```

### Key architectural decisions

1. **Next.js API Route Handlers (`app/api/`) are the backend.** No separate Express/Fastify server. Deployed on Vercel as serverless functions. Mobile apps call the same HTTPS endpoints the web app uses — one backend, three clients.
2. **Delyva** as the delivery aggregator. Single API gives access to: J&T Express, Pos Laju, GDex, DHL eCommerce, Ninja Van, Line Clear, Flash Express, Lalamove, GrabExpress, and more. Avoids per-courier integrations.
3. **Expo + React Native** for both mobile apps. Team uses TypeScript/React — same language, same Supabase package, can copy context files directly. No Flutter (would require Dart rewrite of all contexts).
4. **Supabase RBAC** via `staff_roles` table + RLS policies. Roles: `owner`, `manager`, `staff`, `warehouse`, `support`. Full role-based navigation in staff mobile app.
5. **Expo Push Notification Service** (not Firebase directly). Handles both APNs (iOS) and FCM (Android) through a single API. No Firebase configuration required.

---

## Phase 0 — Foundation & Database Migrations

**Pre-requisite for everything.**

### Database additions (Supabase SQL migrations)

**Soft delete** — Add `deleted_at TIMESTAMPTZ NULL` to: `products`, `orders`, `order_items`, `promotions`. Update all RLS policies and context queries to add `WHERE deleted_at IS NULL`. Unblocks product deletion without FK errors.

**Shipping fields on orders:**

```sql
ALTER TABLE orders ADD COLUMN courier_code TEXT;
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN shipping_rate NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN delyva_order_id TEXT;
```

**Staff roles:**

```sql
CREATE TABLE staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','manager','staff','warehouse','support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Notifications:**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON notifications(user_id, read_at);
```

**Rewards stamps (off localStorage):**

```sql
CREATE TABLE user_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stamps BOOLEAN[] NOT NULL DEFAULT ARRAY[false,false,false,false,false,false,false,false,false],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Verify promotions table** has: `discount_type`, `discount_value`, `start_date`, `end_date`, `active`, `max_uses`, `uses_count`.

**Structured shipping address (Phase 0b — run after main migration):**

`orders.shipping_address` is TEXT (display-only). Add a JSONB column before Phase 1 checkout work so the Delyva API route can read structured fields:

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_address_structured JSONB;
```

File: `docs/sql/PHASE_0B_SHIPPING_ADDRESS_STRUCTURED.sql`

At checkout, always write both: `shipping_address` (TEXT, for display) and `shipping_address_structured` (JSONB `{ address1, city, state, postcode, country }`).

### Critical code bug fixes (inherited from CRA)

- `forEach(async)` → `Promise.all(map(...))` in `ProductContext.tsx`
- `useEffect` loading state set outside async function in every context
- `useCallback` memoization on all context functions (35+ providers)

### External account setup

- Create Stripe account (test mode), note `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Register at `trydx.delyva.app` (sandbox) for testing; `my.delyva.app` for production
- Apple Developer Account ($99/year) and Google Play Developer account ($25 one-time) for mobile apps

---

## Phase 1 — Stripe Payment Integration

**Enables real purchases. Highest business priority.**

### API routes to create in `asf-2-next/src/app/api/`

```
api/
  stripe/
    create-payment-intent/route.ts   ← POST: creates PaymentIntent, returns client_secret
    webhook/route.ts                 ← POST: handles all Stripe webhook events
```

`**create-payment-intent**` flow:

1. Receives `{ userId }` from client
2. Fetches user's cart from Supabase server-side (trust DB, not client amounts)
3. Creates Stripe PaymentIntent with `amount`, `currency: 'myr'`, `metadata: { userId }`
4. Returns `clientSecret`

`**webhook**` flow:

- `payment_intent.succeeded` → create `order` + `order_items` + `payment` records, decrement stock per variant, insert notification row for customer, clear cart
- `payment_intent.payment_failed` → insert failed notification
- `charge.refunded` → update refund fields
- Verify Stripe HMAC signature before processing any event

### Checkout page rewrite

- Replace all mock data with real CartContext data
- Shipping address pre-filled from `user_details`
- `@stripe/react-stripe-js` `<PaymentElement />` for card input
- Order created as `pending` before Stripe; webhook finalises to `processing`
- Redirect to `/order-success` after payment

Install: `npm install stripe @stripe/react-stripe-js`

---

## Phase 2 — Malaysian Delivery Integration (Delyva)

### Why Delyva

Single API for 20+ Malaysian couriers. Configure available couriers in the Delyva dashboard. No per-courier direct integrations needed.

### API routes to create

```
api/
  delivery/
    rates/route.ts                   ← POST: get shipping rates from Delyva instantQuote
    create-shipment/route.ts         ← POST: book shipment, get tracking number + label
    tracking/[orderId]/route.ts      ← GET: live tracking status
```

### Delyva API basics

- Base URL: `https://api.delyva.app/v1.0`
- Auth header: `X-Delyvax-Access-Token: <API_KEY>`
- Key endpoints: `POST /service/instantQuote`, `POST /order`, `POST /order/{id}/process`, `GET /order/{id}/label`, `GET /order/{id}`

### Shipping rate at checkout

- Request: `{ origin (seller address), destination (customer address), weight, itemType: 'PARCEL' }`
- Response: list of couriers with rates and ETAs
- Customer selects preferred courier
- Or: flat rate for MVP (RM10), add courier selection later when product weights are in DB

### Admin UI additions (on order detail page)

- "Ship This Order" button → modal: select courier, confirm weight/dimensions
- Calls `/api/delivery/create-shipment` → saves `tracking_number`, `shipping_label_url` to order
- "Print Label" button opens PDF in new tab
- Order status updates to `awaiting_pickup`

### Customer tracking

- Order detail page calls `/api/delivery/tracking/[orderId]`
- Timeline: Pending → Processing → Awaiting Pickup → In Transit → Delivered

### Sandbox testing

- Dev portal: `https://trydx.delyva.app/customer`
- Webhook simulator: enter fake `consignmentNo`, select event (Pickup Success, Out for Delivery, Delivered), fires real webhook POST to your local endpoint
- Use ngrok or Cloudflare Tunnel to expose localhost during development

---

## Phase 3 — Promotions Module

Database tables (`promotions`, `promotion_product`) already exist.

### Work required

1. **PromotionContext** — full CRUD, types: `percentage`, `fixed`, `bogo`, `free_shipping`
2. **Admin UI** — rewrite 3 broken pages in `/app/promotions/`; list with status badges, create/edit form with date range + product selector
3. **Apply at checkout** — cart coupon code input; server-side validation in `create-payment-intent` (re-validate code + recalculate total, never trust client discount)

---

## Phase 4 — Complete Missing Customer Features

- **Password reset**: `/authentication/forgot-password` + `/authentication/reset-password` using `supabase.auth.resetPasswordForEmail()` and `supabase.auth.updateUser()`
- **Customer order history**: `/my-orders` page listing all orders for current user
- **Real notifications**: `NotificationContext` reading from `notifications` table with Supabase Realtime; mark-as-read; bell icon badge in navbar
- **Support form → real tickets**: wire `support-chat` form to `TicketContext.createTicket()`, show ticket number to user

---

## Phase 5 — Staff Mobile App (`asf-staff-app`)

**Tech stack:** Expo + React Native, TypeScript, `expo-router` (file-based like Next.js), NativeWind (Tailwind class names), `@supabase/supabase-js` (same package as web)

**Can start at Phase 0 completion** — core features read directly from Supabase contexts.

### Pre-requisite DB migration (run before starting Phase 5)

The `push_tokens` table was intentionally deferred from Phase 0 (not needed for web). Add it now:

```sql
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_tokens_manage_own"
  ON push_tokens FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Project structure

```
asf-staff-app/
  app/
    (auth)/sign-in.tsx
    (app)/
      _layout.tsx          ← reads staff_roles, renders role-appropriate tabs
      dashboard/           ← owner + manager only
      orders/index.tsx + [orderId].tsx
      products/            ← manager + warehouse
      stock/               ← manager + warehouse
      posts/               ← manager + staff
      analytics/           ← owner only
      support/             ← support role
      settings/
  context/                 ← copy exact same context files from asf-2-next
```

### Role-based navigation

Fetch `staff_roles` row on login. Bottom tab sets per role:


| Role        | Tabs                                             |
| ----------- | ------------------------------------------------ |
| `owner`     | Dashboard, Orders, Products, Analytics, Settings |
| `manager`   | Orders, Products, Stock, Posts, Settings         |
| `staff`     | Orders, Stock, Settings                          |
| `warehouse` | Stock, Settings                                  |
| `support`   | Orders, Support Tickets, Settings                |


RLS policies enforce this server-side too.

### Push notifications (staff)

- Expo `expo-notifications` to get push token
- Save to `staff_push_tokens` table in Supabase
- Triggered by: new order placed (webhook), low stock alert, support ticket created
- Supabase Edge Function reads token → POST to Expo Push API

---

## Phase 6 — Customer Mobile App (`asf-customer-app`)

**Can start building screens in parallel with Phases 1–3; checkout screen needs Phase 1 complete.**

### Tech stack

Same as staff app. Add `@stripe/stripe-react-native` for payments.

### Project structure

```
asf-customer-app/
  app/
    (auth)/sign-in.tsx + sign-up.tsx
    (tabs)/
      _layout.tsx          ← bottom tabs: Home, Browse, Cart, Wishlist, Profile
      index.tsx            ← home page
      browse/index.tsx + [productId].tsx
      cart.tsx
      wishlist.tsx
      profile/index.tsx + orders.tsx + rewards.tsx
```

### Stripe in React Native

- Uses `@stripe/stripe-react-native`
- Calls the same `/api/stripe/create-payment-intent` endpoint as web checkout
- `usePaymentSheet()` for native payment UI

### Push notifications (customer)

- Order status updates, promo announcements
- Same Expo Push service as staff app, separate `push_tokens` table

---

## Phase 7 — Community, Messaging & Ticketing UI

Backend contexts already exist (`ConversationContext`, `CommunityContext`, `GroupContext`, `TicketContext`). Pure UI work:

- `/support-chat` web: real ConversationContext + ChatMessages realtime
- Communities & Groups pages
- Ticketing: customer creates → staff app push notification → support role responds

---

## Phase 8 — Production Hardening

- Audit all Supabase RLS policies (every table must prevent cross-user access)
- Stripe webhook signature verification
- Rate limiting on API routes (especially `create-payment-intent`)
- Input validation with `zod` on all API routes
- Sentry integration in all three apps
- Database indexes: `orders.user_id`, `add_to_carts.user_id`, `notifications.user_id`
- Critical path E2E test: add to cart → checkout → payment → stock decrement → notification

---

## Timeline (solo developer)


| Phase                    | Duration  |
| ------------------------ | --------- |
| 0 — Foundation           | 1 week    |
| 1 — Stripe               | 1.5 weeks |
| 2 — Delivery             | 1 week    |
| 3 — Promotions           | 1 week    |
| 4 — Customer features    | 1.5 weeks |
| 5 — Staff mobile app     | 5 weeks   |
| 6 — Customer mobile app  | 4 weeks   |
| 7 — Community/messaging  | 2 weeks   |
| 8 — Production hardening | 1.5 weeks |


**Phases 5 and 6 can run in parallel** with two developers. Staff app starts at Phase 0 completion; customer app starts after Phase 1.

---

## Environment Variables Required

```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Delyva
DELYVA_API_KEY=...
DELYVA_COMPANY_ID=...
DELYVA_CUSTOMER_ID=...
DELYVA_ORIGIN_ADDRESS=...

# Supabase (already exists)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # for webhook handlers (server-only)

# Admin bootstrap
ADMIN_EMAIL=your@email.com      # escape hatch for RBAC middleware
```

