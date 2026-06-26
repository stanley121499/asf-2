# ASF Staff App — Build Prompt
**Target path:** `E:\Dev\GitHub\asf-2\asf-staff-app\`  
**Reference web app:** `E:\Dev\GitHub\asf-2\asf-2-next\` (Next.js 14 admin panel)  
**Goal:** Full mobile admin panel — 100% feature parity with the Next.js admin pages. Every CRUD operation available in the web app must be achievable in the mobile app. Role-based navigation via `staff_roles` table. Same design system as the customer app (black + off-white).

Read `asf-vault/wiki/` and `asf-vault/raw/sources/2026-04-13-production-roadmap.md` before starting.

---

## 1. Bootstrap

```bash
cd E:\Dev\GitHub\asf-2
npx create-expo-app asf-staff-app --template blank-typescript
cd asf-staff-app

npx expo install expo-router expo-constants expo-linking expo-status-bar \
  expo-font expo-image expo-document-picker expo-image-picker \
  react-native-safe-area-context react-native-screens \
  react-native-gesture-handler react-native-reanimated

npm install @supabase/supabase-js @react-native-async-storage/async-storage
npm install nativewind tailwindcss
npm install react-native-url-polyfill
npm install @expo/vector-icons
npm install react-native-chart-kit react-native-svg
```

---

## 2. Design system

Same as customer app. Copy `constants/theme.ts`:

```typescript
export const colors = {
  accent: "#000000",
  bg: "#FAF9F6",
  panel: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
  danger: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
};
```

---

## 3. Supabase client — `lib/supabase.ts`

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

---

## 4. Contexts to copy from `asf-2-next/src/context/`

Copy into `asf-staff-app/context/` with the same mechanical adaptations as the customer app (remove `"use client"`, fix imports, replace `localStorage` with `AsyncStorage`).

**Contexts to copy:**
- `AuthContext.tsx`
- `AlertContext.tsx`
- `UserContext.tsx`
- `product/ProductContext.tsx`
- `product/ProductMediaContext.tsx`
- `product/CategoryContext.tsx`
- `product/ProductColorContext.tsx`
- `product/ProductSizeContext.tsx`
- `product/ProductCategoryContext.tsx`
- `product/ProductStockContext.tsx`
- `product/ProductStockLogContext.tsx`
- `product/ProductPurchaseOrderContext.tsx`
- `product/OrderContext.tsx`
- `product/BrandContext.tsx`
- `product/DepartmentContext.tsx`
- `product/RangeContext.tsx`
- `post/PostContext.tsx`
- `post/PostMediaContext.tsx`
- `post/PostFolderContext.tsx`
- `PromotionContext.tsx`
- `NotificationContext.tsx`
- `TicketContext.tsx`
- `ConversationContext.tsx`
- `PaymentContext.tsx`
- `AnnouncementContext.tsx`

Create `context/AdminContextBundle.tsx` wrapping all providers (match `FullAdminContextBundle` from web).

---

## 5. Role-based navigation

After sign-in, fetch `staff_roles` for the logged-in user. Store the `role` in a `useStaffRole` hook (backed by AsyncStorage for persistence).

| Role | Bottom tabs shown |
|---|---|
| `owner` | Dashboard, Orders, Products, Analytics, Settings |
| `manager` | Orders, Products, Posts, Analytics, Settings |
| `staff` | Orders, Stocks, Settings |
| `warehouse` | Products, Stocks, Settings |
| `support` | Orders, Support, Settings |

If no `staff_roles` row exists → sign out and show "Access denied. Contact your administrator."

The `(app)/_layout.tsx` reads the role and renders only the allowed tabs.

---

## 6. Project structure

```
asf-staff-app/
  app/
    _layout.tsx                              ← Root: fonts, AdminContextBundle, auth listener
    (auth)/
      sign-in.tsx                            ← Staff login
    (app)/
      _layout.tsx                            ← Role-based bottom tabs
      dashboard/
        index.tsx                            ← KPI cards
      orders/
        index.tsx                            ← Order list
        [orderId].tsx                        ← Order detail + status update + shipment
      products/
        index.tsx                            ← Product list
        create.tsx                           ← Create product
        [productId]/
          index.tsx                          ← Edit product
          stock.tsx                          ← Stock management
          colors.tsx                         ← Manage colours
          sizes.tsx                          ← Manage sizes
        categories/
          index.tsx                          ← Category list + create/edit/delete
        deleted/
          index.tsx                          ← Soft-deleted products, restore
      posts/
        index.tsx                            ← Post list
        create.tsx                           ← Create post
        [postId].tsx                         ← Edit post
      stocks/
        overview.tsx                         ← Stock overview
        all.tsx                              ← All variants stock levels
        purchase-orders/
          index.tsx                          ← Purchase order list
          create.tsx                         ← Create purchase order
          [purchaseOrderId].tsx              ← PO detail
        reports/
          index.tsx                          ← Stock reports list
          create.tsx                         ← Create report
          [reportId].tsx                     ← Report detail
      analytics/
        index.tsx                            ← Tab bar: Products | Categories | Users | Support
        products.tsx
        categories.tsx
        users.tsx
        support.tsx
      promotions/
        index.tsx                            ← Promotion list
        create.tsx                           ← Create promotion
        [id].tsx                             ← Edit promotion
      payments/
        index.tsx                            ← Payment list
        [paymentId].tsx                      ← Payment detail
      users/
        index.tsx                            ← User list
        [userId].tsx                         ← User detail / edit
      support/
        index.tsx                            ← Ticket list
        [ticketId].tsx                       ← Ticket detail + chat
      settings/
        index.tsx                            ← Profile, role, sign out
  context/
  lib/
    supabase.ts
    api.ts
  constants/
    theme.ts
    roles.ts
  components/
    KpiCard.tsx
    StatusBadge.tsx
    DataTable.tsx
    FormField.tsx
    ConfirmModal.tsx
    ChatWindow.tsx
  .env
  .env.example
```

---

## 7. Screen specifications

---

### `(auth)/sign-in.tsx`
**Web reference:** `src/app/authentication/sign-in/page.tsx`

- Email + password with show/hide toggle
- `supabase.auth.signInWithPassword`
- After sign-in: fetch `staff_roles` → if no row, show "Access denied" and sign out
- If role found: redirect to `(app)`

---

### `dashboard/index.tsx`
**Web reference:** `src/app/dashboard/page.tsx`

4 KPI cards with real Supabase queries (same as web):
- **Today's Revenue** — `SUM(amount) FROM payments WHERE payment_status='completed' AND paid_at >= today`
- **Pending Orders** — `COUNT(*) FROM orders WHERE status='pending' AND deleted_at IS NULL`
- **Low Stock Variants** — `COUNT(*) FROM product_stock WHERE quantity < 10`
- **New Customers This Week** — `COUNT(*) FROM user_details WHERE created_at >= week_start`

Each card: label, large number, subtle icon. Tap → navigate to the relevant list screen.

Quick nav buttons below KPIs (same as web dashboard): Orders, Products, Stocks, Analytics.

---

### `orders/index.tsx`
**Web reference:** `src/app/orders/page.tsx`

- List of all orders, newest first
- Status filter tabs: All | Pending | Processing | Awaiting Pickup | In Transit | Delivered | Cancelled
- Search by order ID or customer name
- Each row: order ID (short), customer name/email, date, status badge, total
- Tap → `orders/[orderId]`

---

### `orders/[orderId].tsx`
**Web reference:** `src/app/orders/[orderId]/page.tsx`

- Order header: ID, date, customer info
- Items list: thumbnail, name, variant, qty, unit price
- Summary: subtotal, shipping, discount, total
- **Status update** — dropdown/picker (pending → processing → awaiting_pickup → in_transit → delivered → cancelled). Calls `OrderContext.updateOrderStatus`. Inserts into `order_status_logs`.
- **Shipment section** (if `status = 'processing'` and no `tracking_number`):
  - "Ship This Order" button → opens modal
  - Modal: weight input (kg), call `GET EXPO_PUBLIC_API_URL/api/delivery/rates` to list courier options
  - Select courier → "Confirm Shipment" → `POST EXPO_PUBLIC_API_URL/api/delivery/create-shipment`
  - On success: tracking number + label URL appear
- **If `tracking_number` exists:** show courier, tracking number, "Print Label" link, live tracking events from `GET EXPO_PUBLIC_API_URL/api/delivery/tracking/[orderId]`
- Status history timeline from `order_status_logs`

---

### `products/index.tsx`
**Web reference:** `src/app/products/list/page.tsx`

- Product list with search and category filter
- Each row: thumbnail, name, price, stock status badge, active status
- FAB "+" → `products/create`
- Swipe actions or long-press: Edit, Delete (soft), View Stock
- Tap → `products/[productId]`

---

### `products/create.tsx` + `products/[productId]/index.tsx`
**Web reference:** `src/app/products/create/[[...slugs]]/product-editor.tsx`

Full product editor form:
- Name, description, price, article number
- Brand picker (from `BrandContext`)
- Department picker
- Range picker
- Category multi-select (from `CategoryContext`)
- Active toggle
- Image upload (use `expo-image-picker`, upload to Supabase Storage)
- Save → `ProductContext.createProduct` or `updateProduct`
- Delete → `ProductContext.softDeleteProduct`

---

### `products/[productId]/stock.tsx`
**Web reference:** `src/app/products/stock/[productId]/page.tsx`

- List of variants (colour + size combinations) with current stock quantity
- "Add Stock" button → modal: qty, note → `ProductStockContext.addStock`
- "Add Return" button → modal: return quantity → `ProductStockContext.addReturn`
- Stock log history list

---

### `products/[productId]/colors.tsx`
- List of product colours (name, hex, image)
- Add / edit / delete colours via `ProductColorContext`

### `products/[productId]/sizes.tsx`
- List of product sizes
- Add / edit / delete via `ProductSizeContext`

---

### `products/categories/index.tsx`
**Web reference:** `src/app/products/categories/page.tsx`

- Category list with parent/child hierarchy
- Create category: name, parent category (optional), image upload
- Edit / soft-delete via `CategoryContext`

---

### `products/deleted/index.tsx`
**Web reference:** `src/app/products/deleted/page.tsx`

- List of soft-deleted products (`deleted_at IS NOT NULL`)
- "Restore" button per row → `ProductContext.restoreProduct`
- "Permanently Delete" (if needed)

---

### `posts/index.tsx`
**Web reference:** `src/app/posts/list/page.tsx`

- Post list: thumbnail, title, status, date
- FAB "+" → `posts/create`
- Tap → `posts/[postId]`

---

### `posts/create.tsx` + `posts/[postId].tsx`
**Web reference:** `src/app/posts/create/[[...slugs]]/post-editor.tsx`

Post editor:
- Title, body (rich text or plain textarea)
- Image/video upload via `expo-image-picker`
- Active toggle, schedule date/time (optional)
- Tags (product links)
- Save → `PostContext.createPost` or `updatePost`
- Delete → `PostContext.softDeletePost`

---

### `stocks/overview.tsx`
**Web reference:** `src/app/stocks/overview/page.tsx`

- Summary cards: total products, total units in stock, low stock count, out of stock count
- Quick links to All Stock, Good Stock, Purchase Orders, Reports

---

### `stocks/all.tsx`
**Web reference:** `src/app/stocks/all/page.tsx`

- All product variants with current stock quantities
- Filter: all / low stock / out of stock
- Search by product name
- Each row: product name, variant, quantity, last updated

---

### `stocks/purchase-orders/index.tsx` + `create.tsx` + `[purchaseOrderId].tsx`
**Web reference:** `src/app/stocks/purchase-orders/`

- List of purchase orders
- Create: supplier, products, quantities, expected date
- Detail: view line items, mark as received → increments stock

---

### `stocks/reports/` screens
**Web reference:** `src/app/stocks/reports/` + `src/app/stocks/report/`

- Stock report list
- Create report: select products/variants, snapshot current quantities
- View report detail

---

### `analytics/index.tsx` (tab bar for sub-pages)
**Web reference:** `src/app/analytics/`

Top tab bar: Products | Categories | Users | Support. Each tab renders its own query results.

**products.tsx** — Revenue bar chart (by date in range), top products list, unsellable products list.  
**categories.tsx** — Revenue by category (bar), units sold by category (pie).  
**users.tsx** — New users line chart, total users count, active users count.  
**support.tsx** — Ticket volume chart, status breakdown pie, open/closed counts.

Use `react-native-chart-kit` + `react-native-svg` for charts.  
Time range picker: Today / This Week / This Month / This Year.

---

### `promotions/index.tsx`
**Web reference:** `src/app/promotions/page.tsx`

- Promotion list: name, code, type, value, status badge (Active/Expired/Scheduled/Inactive)
- FAB "+" → `promotions/create`
- Swipe to delete (soft)
- Tap → `promotions/[id]`

---

### `promotions/create.tsx` + `promotions/[id].tsx`
**Web reference:** `src/app/promotions/create/page.tsx` + `src/app/promotions/[id]/page.tsx`

Promotion editor:
- Name, description
- Code (optional)
- Discount type: Fixed (RM) or Percentage (%)
- Discount value
- Start date / end date pickers
- Max uses (optional)
- Active toggle
- Product scope: multi-select products (optional; empty = applies to all)
- Save → `PromotionContext.createPromotion` or `updatePromotion`

---

### `payments/index.tsx`
**Web reference:** `src/app/payments/page.tsx`

- Payment list: order ID, customer, amount, status, date
- Filter by status
- Tap → `payments/[paymentId]`

### `payments/[paymentId].tsx`
- Payment detail: linked order, Stripe PI ID, amount, status, created date

---

### `users/index.tsx`
**Web reference:** `src/app/users/list/page.tsx`

- User list: name/email, join date, order count
- Search
- Tap → `users/[userId]`

### `users/[userId].tsx`
- User detail: name, email, address, order history summary
- Staff role management: assign/remove `staff_roles` row (owner only)

---

### `support/index.tsx`
**Web reference:** `src/app/support/page.tsx`

- Ticket list: open / closed tabs
- Each row: customer name, subject, type, last message preview, date
- Filter by assigned agent, search
- Tap → `support/[ticketId]`

### `support/[ticketId].tsx`
**Web reference:** `src/app/support/page.tsx` (detail panel) + `chat-window.tsx`

- Ticket info: customer, type, subject, description, status
- "Close" / "Reopen" button → `TicketContext.updateTicket`
- Assign to me button
- Conversation chat window (from `ConversationContext`): if no conversation exists → "Start Conversation" button creates one, adds both customer and staff as participants
- Text input to send replies
- Realtime messages via `ConversationContext`

---

### `settings/index.tsx`

- Staff user info: email, name, role badge
- Edit name
- Sign out → `AuthContext.signOut`

---

## 8. Role guard utility

```typescript
// hooks/useRoleGuard.ts
// If current role is not in allowedRoles, redirect to settings
export function useRoleGuard(allowedRoles: StaffRole[]): void { ... }
```

Apply at the top of each restricted screen (e.g. analytics → owner only, stock management → warehouse + owner + manager).

---

## 9. API calls

```typescript
// lib/api.ts
export function apiUrl(path: string): string {
  return `${process.env.EXPO_PUBLIC_API_URL ?? ""}${path}`;
}
```

All Delyva and Stripe API calls go through the Next.js API routes — never call third-party APIs directly from the mobile app.

---

## 10. Environment variables — `.env`

```
EXPO_PUBLIC_SUPABASE_URL=https://gswszoljvafugtdikimn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

---

## 11. Requirements

- **Strict TypeScript** — no `any`, no `!`, no `as unknown as T`
- **Every screen** shows `ActivityIndicator` while loading, readable error on failure
- **Confirm dialogs** before any destructive action (delete, cancel order)
- **NativeWind** for all styling
- Full CRUD must work end-to-end (not just UI — must actually write to Supabase)
- **`npx tsc --noEmit` must exit 0** before finishing
- Create `.env.example` with all variables documented
