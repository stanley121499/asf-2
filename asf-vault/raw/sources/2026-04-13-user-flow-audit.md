# ASF-2 User Flow Audit — 2026-04-13

**Date:** 2026-04-13  
**Scope:** All customer and admin/staff user flows in `asf-2-next` (Next.js app)  
**Method:** Code inspection of all `app/**/page.tsx` files + context audit  
**Note:** This supersedes FEATURES.md and CUSTOMER_FACING.md which document the original CRA app. The Next.js app has fixed several CRA issues but introduced new ones.

---

## Routes Present in `asf-2-next` (complete list)

### Customer routes — `app/(customer)/`
- `/` — Home page (SSR, real data)
- `/product-section/[[...categoryId]]` — Browse products
- `/product-details/[productId]` — Product details
- `/cart` — Cart page
- `/wishlist` — Wishlist page
- `/checkout` — Checkout (mock data)
- `/highlights` — Highlights
- `/notifications` — Notifications (mock data)
- `/order-details` — Order details (no ID — redirect/fallback)
- `/order-details/[orderId]` — Specific order detail
- `/rewards` — Rewards/stamps page
- `/settings` — Profile/settings
- `/support-chat` — Support form

### Admin routes — `app/`
- `/dashboard` — 3 navigation buttons only (no KPIs)
- `/products/list`, `/products/create`, `/products/categories`, `/products/schedule`, `/products/deleted`, `/products/stock/[productId]`
- `/stocks/overview`, `/stocks/good`, `/stocks/all`, `/stocks/reports`, `/stocks/events`, `/stocks/purchase-orders/create`, `/stocks/purchase-orders/[id]`, `/stocks/report/create`, `/stocks/report/[id]`
- `/posts/list`, `/posts/create`, `/posts/schedule`
- `/orders`, `/orders/[orderId]`
- `/payments`, `/payments/[paymentId]`
- `/analytics/products`, `/analytics/categories`, `/analytics/categories-inner/[id]`, `/analytics/products-inner/[id]`, `/analytics/users`, `/analytics/support`
- `/users/list`, `/users/settings`
- `/support`
- `/internal-chat`
- `/home-page-builder`
- `/authentication/sign-in`, `/authentication/sign-up`
- `/order-success`, `/order-cancel`, `/maintenance`, `/legal/privacy`

---

## Customer Flow Audit

| Flow | Status | Detail |
|---|---|---|
| Sign up | ✅ | Supabase Auth, works |
| Sign in | ✅ | Supabase Auth, works |
| **Forgot password / reset** | ❌ | No page exists. No link on sign-in page |
| Browse home page | ✅ | SSR, real products, announcement modal |
| Browse highlights | ✅ | Real data |
| Browse product section (by category) | ✅ | Real data, search overlay |
| View product details (variants, gallery) | ✅ | Fixed in Next.js vs CRA |
| Add to wishlist (heart button) | ✅ | Real WishlistContext backend |
| View wishlist | ✅ | Real data |
| View & manage cart | ✅ | Real CartContext, stock-aware, points display |
| **Checkout + payment** | 🔴 | Entirely mock data. Cart items hardcoded, address hardcoded, payment section uses no Stripe |
| **My orders (order history LIST)** | ❌ | No page. Customer has no way to see all past orders. Only `/order-details/[orderId]` exists (direct link needed) |
| View specific order detail | ✅ | Basic — shows order info |
| **Order tracking (delivery status)** | ❌ | No Delyva tracking UI. No tracking_number shown |
| **Cancel order** | ❌ | Not on any page |
| **Notifications** | 🔴 | 100% hardcoded mock data in Chinese. No NotificationContext. No mark-as-read |
| **Support / tickets** | 🟡 | Form-only. Submitting sets `submitted=true` locally but never calls TicketContext. Customer gets no ticket number |
| Settings / profile | ✅ | Best-implemented page. Avatar, name, email, phone, address, password change |
| **Rewards / stamps** | 🟡 | Points balance reads real Supabase data. BUT stamps/scratch card use `localStorage` — data lost on device change or browser clear |
| **Promo code at checkout** | ❌ | No UI anywhere to enter or apply a promo code |

### Critical missing route
`/my-orders` or `/orders` (customer-facing). Customer who completes a purchase has no navigation path back to their order history unless they saved the direct `/order-details/[orderId]` URL.

---

## Admin / Staff Flow Audit

| Flow | Status | Detail |
|---|---|---|
| **Dashboard** | 🔴 | 3 navigation buttons (Posts, Products, Stocks). Zero KPIs, zero revenue figures |
| Product list | ✅ | Works |
| Create / edit product | 🟡 | Works but `forEach(async)` race condition in ProductContext |
| Delete product | 🟡 | Works only if product has no orders (FK error otherwise — soft delete not implemented) |
| Product categories | ✅ | Works |
| Product scheduling | 🟡 | `Array(10)` render bug; `updateProductTimePost` commented out |
| Stock overview / all / good | ✅ | Multiple sub-pages, all functional |
| Add / return stock (variant-level) | ✅ | Works. Pain point: many clicks to add stock for a specific color+size combination |
| Stock purchase orders | ✅ | Create + view |
| Stock reports | ✅ | Create + view |
| Posts CRUD | ✅ | Well implemented |
| Posts scheduling | ✅ | Works |
| Orders list | ✅ | Works |
| Order detail | ✅ | Shows items, status, variants |
| Update order status | ✅ | Works |
| **Ship order (Delyva)** | ❌ | No UI. No "Ship" button, no courier selection, no label printing |
| **Print shipping label** | ❌ | Same — not built |
| Payments list + detail | ✅ | UI exists |
| **Analytics — all tabs** | 🔴 | UI exists with charts but ALL data is hardcoded static numbers. Bar charts use `{ x: "Jan", y: 50 }` literals. "Best Performing Products" uses `Array(10).fill(null)` to repeat each product 10 times. Time range selector does nothing |
| Users list | ✅ | Exists |
| **Promotions** | ❌ | Not present in Next.js app at all (not migrated). Promotions module was non-functional in CRA app |
| Support tickets (admin) | 🟡 | `/support` page exists; unclear if wired to TicketContext |
| Internal chat | ✅ | Exists |
| Home page builder | ✅ | Exists |
| **Access control / RBAC** | ❌ | No middleware protection. Any URL accessible by any authenticated user. Admin routes not protected from customer accounts |

---

## Analytics — What Real Queries Should Use

The analytics pages need to query these tables for real data:

| Metric | Source table(s) |
|---|---|
| Revenue over time | `payments` WHERE `payment_status = 'completed'`, GROUP BY date(`paid_at`) |
| Order count | `orders` GROUP BY date(`created_at`) |
| Top products by sales | `order_items` JOIN `orders`, GROUP BY `product_id`, SUM(`quantity`) |
| Top categories | `order_items → products → product_categories → categories` |
| User growth | `user_details` GROUP BY date(`created_at`) |
| Support volume | `tickets` GROUP BY date(`created_at`), status |
| Average order value | AVG(`orders.total_amount`) |

The time range selector (Today / This Week / This Month / etc.) currently changes state but does not filter any data. All queries need a `dateFrom`/`dateTo` parameter derived from the selected range.

---

## Stock UX Pain Point

The stock backend is fully functional. The UX pain comes from the workflow to update variant-level stock:

```
Current: 6+ steps to add stock for one color+size combination:
1. Navigate to /stocks/overview or /stocks/all
2. Find product card (scroll through all products)
3. Click product → routes to /products/stock/[productId]
4. Find correct color+size row (may scroll 20+ variants)
5. Click "Add Stock" modal
6. Enter quantity
7. Confirm

For a warehouse person receiving 10 shipments daily = 60+ clicks minimum
```

**Future improvement (not immediate priority):** Quick Stock Entry mode — search product, all variants inline with `+/-` fields, save all in one action. CSV bulk import for large deliveries.

---

## Missing New DB Tables (required for functional flows)

| Table | Needed for |
|---|---|
| `notifications` | Real notification system |
| `staff_roles` | Admin RBAC + staff mobile app |
| `user_stamps` | Rewards stamp card (off localStorage) |
| `push_tokens` | Mobile push notifications |
| Shipping columns on `orders` | Delyva tracking_number, courier_code, etc. |
| `deleted_at` columns | Soft delete on products, orders |
