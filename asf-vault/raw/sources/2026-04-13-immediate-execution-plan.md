# ASF-2 Immediate Execution Plan — 2026-04-13

**Date:** 2026-04-13  
**Goal:** Get everything working end-to-end with real data. No mock data, no broken flows, no missing routes. UX polish deferred. Analytics must use real data (boss requirement).  
**App:** `asf-2-next` (Next.js 14, path: `E:\Dev\GitHub\asf-2\asf-2-next`)  
**Companion docs:** `2026-04-13-production-roadmap.md`, `2026-04-13-user-flow-audit.md`

---

## Dependency Chain

```
Step 1: DB Migrations
    └── Step 2: Stripe + Delyva API Routes
            └── Step 3: Checkout Rewrite
                    └── Real orders in DB
                            └── Step 8: Analytics has real data
                            └── Step 9: Delivery UI can book real shipments

Independent (any order after Step 1):
  Step 4: Customer order history page
  Step 5: Real notifications
  Step 6: Password reset
  Step 7: Support form → real tickets
  Step 10: Promotions module
  Step 11: Rewards stamps → Supabase
  Step 12: Basic RBAC middleware
```

---

## Step 1 — Database Migrations
**~1 day | Do first, everything else depends on this**

Run in Supabase SQL editor:

### 1a. Soft delete
```sql
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE promotions ADD COLUMN deleted_at TIMESTAMPTZ;
```
Update all context queries: add `WHERE deleted_at IS NULL` to every SELECT that returns active records. Update RLS policies to exclude soft-deleted rows.

### 1b. Shipping fields on orders
```sql
ALTER TABLE orders ADD COLUMN courier_code TEXT;
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN shipping_rate NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN delyva_order_id TEXT;
```

### 1c. Notifications table
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
Enable RLS: users can SELECT/UPDATE their own rows only.

### 1d. Staff roles
```sql
CREATE TABLE staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','manager','staff','warehouse','support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```
Enable RLS: authenticated users can SELECT their own row; only owner role can INSERT/DELETE.

### 1e. Rewards stamps
```sql
CREATE TABLE user_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stamps BOOLEAN[] NOT NULL DEFAULT ARRAY[false,false,false,false,false,false,false,false,false],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
```
Enable RLS: users can SELECT/UPDATE their own row only.

### 1f. Verify promotions schema
Check that `promotions` table has: `discount_type`, `discount_value`, `start_date`, `end_date`, `active`, `max_uses`, `uses_count`. Add any missing columns.

### 1g. Structured shipping address on orders (Phase 0b — run after main migration)
`orders.shipping_address` is TEXT (human-readable display only). The Delyva `create-shipment` API route needs machine-readable fields. Run this before Phase 3:

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_address_structured JSONB;
```

File: `docs/sql/PHASE_0B_SHIPPING_ADDRESS_STRUCTURED.sql`

Shape stored in the column:
```json
{ "address1": "...", "address2": "...", "city": "...", "state": "...", "postcode": "...", "country": "MY" }
```

At checkout (Step 3), save both `shipping_address` (TEXT, for display) and `shipping_address_structured` (JSONB, for Delyva). The `create-shipment` API route reads from `shipping_address_structured`.

**Note on `push_tokens` table:** Deferred to Phase 5/6 (mobile apps). Add it when starting mobile development — it is not needed for Phases 1–4.

---

## Step 2 — Stripe + Delyva API Routes
**~2 days | Must complete before Step 3**

### Install packages
```bash
cd asf-2-next
npm install stripe @stripe/react-stripe-js
```

### Create `src/app/api/` structure
```
src/app/api/
  stripe/
    create-payment-intent/route.ts
    webhook/route.ts
  delivery/
    rates/route.ts
    create-shipment/route.ts
    tracking/[orderId]/route.ts
```

### `stripe/create-payment-intent/route.ts`
- Method: POST
- Body: `{ userId: string }`
- Logic: fetch user's `add_to_carts` from Supabase using `SUPABASE_SERVICE_ROLE_KEY` (server-side, bypasses RLS for trusted server access)
- Join with `products` to get prices
- Calculate total (never trust client-sent amounts)
- `stripe.paymentIntents.create({ amount: totalInCents, currency: 'myr', metadata: { userId } })`
- Return `{ clientSecret }`

### `stripe/webhook/route.ts`
- Method: POST
- Verify: `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
- Handle `payment_intent.succeeded`:
  1. Get `userId` from `metadata`
  2. Fetch cart items from DB (server-side)
  3. Create `orders` row with `status = 'processing'`
  4. Create `order_items` rows per cart item
  5. Create `payments` row with `payment_status = 'completed'`, `transaction_id = paymentIntent.id`
  6. Decrement `product_stock.quantity` per variant
  7. Delete `add_to_carts` rows for this user (clear cart)
  8. Insert `notifications` row: `{ user_id, type: 'order_confirmed', title: 'Order Confirmed', body: 'Your order #... has been confirmed' }`
- Handle `payment_intent.payment_failed`:
  - Insert notification: `{ type: 'payment_failed', title: 'Payment Failed', body: '...' }`
- Return `{ received: true }` with status 200

### `delivery/rates/route.ts`
- Method: POST
- Body: `{ destination: { address1, city, state, postcode, country }, weight: { unit: 'kg', value: number } }`
- Calls: `POST https://api.delyva.app/v1.0/service/instantQuote` with seller's origin address from env
- Returns: array of `{ serviceCode, name, price, currency, etaDays }`

### `delivery/create-shipment/route.ts`
- Method: POST
- Body: `{ orderId: string, serviceCode: string, weight: object, dimensions: object }`
- Fetches order from DB (receiver address from `orders.shipping_address`)
- Calls Delyva `POST /v1.0/order` with `process: false`, then `POST /v1.0/order/{id}/process`
- Fetches `GET /v1.0/order/{id}/label` URL
- Updates order row: `tracking_number`, `courier_code`, `delyva_order_id`, `shipping_label_url`, `status = 'awaiting_pickup'`
- Returns: `{ trackingNumber, labelUrl }`

### `delivery/tracking/[orderId]/route.ts`
- Method: GET
- Fetches `delyva_order_id` from order row
- Calls `GET https://api.delyva.app/v1.0/order/{delyvaOrderId}`
- Returns: `{ statusCode, status, trackingEvents: [...] }`

### Add to `.env.local`
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
DELYVA_API_KEY=...
DELYVA_COMPANY_ID=...
DELYVA_CUSTOMER_ID=...
DELYVA_ORIGIN_ADDRESS={"address1":"...","city":"...","state":"...","postcode":"...","country":"MY"}
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAIL=your@email.com
```

---

## Step 3 — Checkout Rewrite
**~2 days | Depends on Step 2**

File: `src/app/(customer)/checkout/page.tsx`

### Replace all mock data with:
1. **Cart items**: read from `CartContext` (`add_to_carts`) — already real in this app
2. **Product details**: join with `ProductContext` to get name, price, image, variant names
3. **Shipping address**: pre-fill from `useUserContext()` → `user_details.address` fields; allow inline edit
4. **Shipping rate**: call `/api/delivery/rates` on address entry; show courier options; or flat rate RM10 for MVP
5. **Payment**: `<Elements stripe={stripePromise}>` wrapper; `<PaymentElement />` component from `@stripe/react-stripe-js`

### Checkout flow:
```
1. Customer reviews cart + enters address
2. Clicks "Place Order"
3. Frontend calls POST /api/stripe/create-payment-intent
4. Receives clientSecret
5. stripe.confirmPayment({ elements, confirmParams: { return_url: '/order-success' } })
6. Stripe redirects to /order-success?payment_intent=pi_xxx
7. Webhook (async) creates order in DB + decrements stock + sends notification
8. /order-success page listens for order creation via Supabase Realtime, shows order number
```

### Order-success page
- On load: subscribe to `orders` table WHERE `user_id = current AND created_at > (now - 2min)`
- When order appears: show order number, summary, "View Order" button
- Timeout fallback after 10s: "Your payment was received. Check your notifications for confirmation."

---

## Step 4 — Customer Order History Page
**~0.5 day | Independent after Step 1**

Create `src/app/(customer)/my-orders/page.tsx`:
- Query: `SELECT * FROM orders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`
- Show: order number, date, total_amount, status badge (colour-coded), item count, first product thumbnail
- Each row links to `/order-details/[orderId]`
- Add "My Orders" link to the settings page navigation and/or bottom nav

---

## Step 5 — Real Notifications
**~1.5 days | Independent after Step 1**

### 5a. NotificationContext (`src/context/NotificationContext.tsx`)
- Query: `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`
- Supabase Realtime subscription on INSERT for new notifications
- `markAsRead(id)`: UPDATE `read_at = NOW()` WHERE id = $1
- `markAllAsRead()`: UPDATE `read_at = NOW()` WHERE user_id = $1 AND read_at IS NULL
- Derive: `unreadCount = notifications.filter(n => !n.read_at).length`

### 5b. Update notifications page
Replace mock data array with real data from `NotificationContext`. Add "Mark all as read" button.

### 5c. Navbar bell icon
Wire unread count badge to `unreadCount` from `NotificationContext`. Tap navigates to `/notifications`.

### 5d. Add `NotificationProvider` to `SlimLandingContextBundle` in `RouteContextBundles.tsx`

### 5e. Auto-create notifications
- Stripe webhook (Step 2) already handles order_confirmed and payment_failed
- In `OrderContext`: when admin updates order status → insert notification for that user
- In future: TicketContext status change → insert notification

---

## Step 6 — Password Reset
**~0.5 day | Independent**

### New pages
**`src/app/authentication/forgot-password/page.tsx`**
- Email input form
- On submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/authentication/reset-password' })`
- Show: "Check your email for a reset link."

**`src/app/authentication/reset-password/page.tsx`**
- Supabase SSR reads the token hash from URL automatically
- New password + confirm fields with validation (min 8 chars)
- On submit: `supabase.auth.updateUser({ password: newPassword })`
- On success: redirect to `/authentication/sign-in`

### Update sign-in page
Add "Forgot password?" link below the password field pointing to `/authentication/forgot-password`.

---

## Step 7 — Support Form → Real Tickets
**~0.5 day | Independent after Step 1**

File: `src/app/(customer)/support-chat/page.tsx`

### Current broken behaviour
Form submission sets `setSubmitted(true)` and shows a success screen, but never calls any context or API. Ticket is never created.

### Fix
1. Import `useTicketContext` (already exists in `src/context/TicketContext.tsx`)
2. On form submit: call `createTicket({ user_id, type: formData.type, subject: formData.subject, description: formData.description, status: 'open' })`
3. After creation: show the returned ticket `id` (or a formatted `TK-xxxx` number) in the success screen
4. Insert notification: `{ type: 'ticket_created', title: 'Support Ticket Created', body: 'Your ticket #TK-xxx has been received.' }`

### Admin support page
Verify `/app/support/page.tsx` is reading from `TicketContext`. If not, wire it up to show open tickets, with ability to update status.

---

## Step 8 — Real Analytics
**~2 days | Best after Step 3 so real order data exists, but queries can be written anytime**

All 4 analytics tabs + dashboard need real Supabase queries. The time range selector must filter every query.

### Time range utility
Create `src/utils/analyticsDateRange.ts`:
```typescript
export function getDateRange(label: string): { from: Date; to: Date } {
  // Returns dateFrom + dateTo for each label option
  // "Today", "This Week", "This Month", "Last Month", "This Quarter", "This Year", etc.
}
```

### Dashboard (`/dashboard/page.tsx`)
Replace 3-button screen with KPI cards + keep navigation below:
- **Today's Revenue**: `SELECT SUM(amount) FROM payments WHERE payment_status='completed' AND paid_at >= today`
- **Pending Orders**: `SELECT COUNT(*) FROM orders WHERE status='pending'`
- **Low Stock Products**: `SELECT COUNT(*) FROM product_stock WHERE quantity < 10`
- **New Customers This Week**: `SELECT COUNT(*) FROM user_details WHERE created_at >= week_start`

### Products analytics (`/analytics/products/page.tsx`)
- Revenue chart: query `payments` grouped by date within range
- Best performing products: query `order_items` GROUP BY `product_id` ORDER BY SUM(quantity) DESC LIMIT 10
- Remove ALL `Array(10).fill(null)` patterns
- Fix redirect URLs (not hardcoded `/analytics/products-inner/123`)

### Categories analytics
- Join `order_items → products → product_categories → categories`
- Group by category name, sum quantities

### Users analytics
- New users: `user_details` GROUP BY date(created_at) within range
- Total users: COUNT(*)
- Active users (placed ≥1 order in period): subquery

### Support analytics
- Ticket volume by date from `tickets.created_at`
- Status breakdown: open / in_progress / resolved
- Average resolution time from `ticket_status_change_logs`

---

## Step 9 — Delivery Management UI in Admin
**~1 day | Depends on Step 2**

### On `/orders/[orderId]` page
Add a "Shipment" section at the bottom:

**If `tracking_number` is null AND `status` is `processing`:**
- "Ship This Order" button → opens modal
- Modal: weight input (kg), select courier from Delyva rates (call `/api/delivery/rates` on open), confirm button
- On confirm: call `POST /api/delivery/create-shipment`
- On success: tracking number appears, order status updates to `awaiting_pickup`

**If `tracking_number` exists:**
- Show: courier name, tracking number
- "Print Label" button → `window.open(order.shipping_label_url)`
- Show latest tracking status from `/api/delivery/tracking/[orderId]`

### On `/order-details/[orderId]` (customer page)
If order has `tracking_number`, show a status timeline component:
- Steps: Order Placed → Processing → Awaiting Pickup → In Transit → Delivered
- Highlight current step based on Delyva `statusCode` mapping

---

## Step 10 — Promotions Module
**~2 days | Independent after Step 1**

### 10a. PromotionContext (`src/context/PromotionContext.tsx`)
- CRUD for `promotions` table: `getPromotions`, `createPromotion`, `updatePromotion`, `deletePromotion`
- Linked products via `promotion_product` join table
- `validatePromoCode(code, cartTotal)` — checks active, not expired, under usage limit, returns discount amount
- Add to `FullAdminContextBundle` and relevant customer bundle

### 10b. Admin promotions UI
Rewrite (or create fresh) 3 pages:
- `/promotions` list — real data, status badges (Active / Expired / Scheduled / Inactive)
- `/promotions/create` — name, description, discount type + value, date range, max uses, product selector
- `/promotions/[id]` — edit form (same fields)

### 10c. Cart page coupon input
Add coupon code field to `src/app/(customer)/cart/page.tsx`:
- Input + "Apply" button
- On apply: call `validatePromoCode` from PromotionContext
- On success: show discount line item in cart total
- Pass `promoCode` to checkout page; re-validate in `create-payment-intent` API route

---

## Step 11 — Rewards Stamps → Supabase
**~0.5 day | Independent after Step 1**

File: `src/app/(customer)/rewards/_components/RewardsClient.tsx`

### Current bug
```typescript
// Lines 26-38: reads/writes stamps from localStorage
const saved = localStorage.getItem("scratchCardProgress");
```
This loses data on device change, browser clear, and different devices.

### Fix
1. On mount: `SELECT stamps FROM user_stamps WHERE user_id = $1`. If no row, INSERT default.
2. `handleStampClick`: `UPDATE user_stamps SET stamps = $1, updated_at = NOW() WHERE user_id = $2`
3. Remove all `localStorage.getItem/setItem` calls for stamps

---

## Step 12 — Basic RBAC Middleware
**~1 day | Independent, do last to avoid locking yourself out**

File: `src/middleware.ts` (already exists)

### Logic
```typescript
// Protect admin routes: require authenticated user with staff_roles entry
// Allow customer routes: require authenticated user only
// Public routes: /authentication/*, /legal/*, /maintenance
```

1. Parse Supabase session from cookie (using `@supabase/ssr` server client)
2. For admin paths (`/dashboard`, `/products`, `/stocks`, `/orders`, `/analytics`, `/payments`, `/users`, `/support`, `/posts`, `/internal-chat`, `/home-page-builder`):
   - No session → redirect to `/authentication/sign-in?next=<path>`
   - Has session → check `staff_roles` table for this user's ID OR check email matches `ADMIN_EMAIL` env var (bootstrap escape hatch)
   - Not staff → redirect to `/` (customer home)
3. For customer paths:
   - No session on protected pages (`/cart`, `/checkout`, `/my-orders`, `/settings`, `/rewards`, `/notifications`, `/order-details`) → redirect to `/authentication/sign-in`
   - Home, browse, highlights, product-details → allow unauthenticated

---

## Timeline Summary (solo developer)

| Step | Days | Can parallel with |
|---|---|---|
| 1 — DB Migrations | 1 | — first |
| 2 — Stripe + Delyva API | 2 | Steps 4-7, 11, 12 |
| 3 — Checkout rewrite | 2 | Steps 4-7, 11, 12 |
| 4 — Order history page | 0.5 | Steps 2-3 |
| 5 — Real notifications | 1.5 | Steps 2-3 |
| 6 — Password reset | 0.5 | Steps 2-3 |
| 7 — Support → tickets | 0.5 | Steps 2-3 |
| 8 — Real analytics | 2 | After Step 3 ideally |
| 9 — Delivery admin UI | 1 | After Step 2 |
| 10 — Promotions | 2 | After Step 1 |
| 11 — Rewards stamps | 0.5 | Steps 2-3 |
| 12 — RBAC middleware | 1 | After all above |

**Total: ~15 development days (~3 weeks solo)**

Steps 2 and 3 together are the critical path. Once real orders exist in the DB, analytics and delivery both become meaningful.
