# Performance Fix Plan – Round 2 (2026)

## Overview

Round 1 addressed the most critical architectural issues (route-scoped providers, code splitting, N+1 queries in contexts, realtime correctness, sidebar anti-patterns). Round 2 targets the remaining correctness bugs, partial fixes that were left incomplete, and a set of newly identified medium-priority issues found during the post-agent audit.

---

## ✅ What Was Fixed in Round 1 (Do Not Redo)

| # | Issue | File(s) | Status |
|---|-------|---------|--------|
| 1 | 36 global providers loaded at app root | `App.tsx`, `RouteContextBundles.tsx` | ✅ Fixed |
| 2 | No code splitting / lazy loading | `App.tsx` | ✅ Already done |
| 3 | `OrderContext` functions not memoized + stale closure | `OrderContext.tsx` | ✅ Fixed |
| 4 | `UserContext` N+1 query problem | `UserContext.tsx` | ✅ Fixed |
| 5 | `PaymentContext` calling `listUsers()` on every load | `PaymentContext.tsx` | ✅ Partially fixed (admin call removed, but user names are now UUIDs — see Agent 2) |
| 6 | `ProductContext` realtime UPDATE wiping computed fields | `ProductContext.tsx` | ✅ Fixed |
| 7 | `flatMap + Array(1).fill(null).map()` anti-pattern | `products/list.tsx`, `create-product-page.tsx` | ✅ Fixed |
| 8 | `ConfirmDeleteModal` rendered once per product card (bug + perf) | `products/list.tsx` | ✅ Fixed |
| 9 | `productMedias.find()` O(n²) in JSX | `products/list.tsx` | ✅ Fixed |
| 10 | Filter re-computed in JSX without `useMemo` | `products/list.tsx` | ✅ Fixed |
| 11 | `ConversationContext` loading all messages at mount | `ConversationContext.tsx` | ✅ Fixed |
| 12 | `ProductContext` double API call (RPC + base table) | `ProductContext.tsx` | ✅ Fixed |
| 13 | `React.StrictMode` missing | `index.tsx` | ✅ Fixed |
| 14 | `URLSearchParams` not memoized | `ProductSection.tsx` | ✅ Fixed |
| 15 | Sidebar inner-component anti-pattern | `sidebar.tsx` | ✅ Fixed |
| 16 | `OrderContext` broken `isMounted` guard / `showAlertRef` | `OrderContext.tsx` | ✅ Fixed |
| 17 | `PaymentContext` `showAlert` in `useCallback` deps | `PaymentContext.tsx` | ✅ Fixed |

---

## 🔧 What Still Needs Fixing – Round 2

### Priority A – Correctness / User-Visible Bugs

| # | Issue | File(s) | Agent |
|---|-------|---------|-------|
| A1 | `PaymentContext`: user names shown as truncated UUIDs (partial fix from Agent 4) | `PaymentContext.tsx` | Agent 2 |
| A2 | `ProductPurchaseOrderContext`: stale closure in realtime handler reads `product_purchase_orders` from stale closure instead of functional setState | `ProductPurchaseOrderContext.tsx` | Agent 3 |
| A3 | `OrderDetailPage`: calls `supabaseAdmin.auth.admin.getUserById()` per order load (admin roundtrip per page view) | `orders/detail.tsx` | Agent 1 |
| A4 | `PaymentDetailPage`: calls `supabaseAdmin.auth.admin.getUserById()` per payment load | `payments/detail.tsx` | Agent 1 |

### Priority B – Performance / N+1 Queries

| # | Issue | File(s) | Agent |
|---|-------|---------|-------|
| B1 | `OrderListPage`: calls `supabaseAdmin.auth.admin.listUsers()` (fetches ALL users) + queries `order_items` in a per-order loop | `orders/list.tsx` | Agent 1 |
| B2 | `filteredProducts` in `ProductSection.tsx` re-computed on every render without `useMemo` | `ProductSection.tsx` | Agent 4 |
| B3 | `productMedias.find()` called inline in JSX of `ProductSection.tsx` (O(n²)) | `ProductSection.tsx` | Agent 4 |

### Priority C – Code Quality / Production Pollution

| # | Issue | File(s) | Agent |
|---|-------|---------|-------|
| C1 | Bare `console.error` calls in `ProductContext.tsx` run in production | `ProductContext.tsx` | Agent 3 |
| C2 | Bare `console.log` calls in `ProductPurchaseOrderContext.tsx` run in production (debug-only data dumps) | `ProductPurchaseOrderContext.tsx` | Agent 3 |
| C3 | Bare `console.log` calls in `Chat.tsx` run in production (hot path) | `Chat.tsx` | Agent 3 |
| C4 | `makePlaceholderImageUrl` still defined inside `HomePage` component body (recreated every render) | `home.tsx` | Agent 4 |
| C5 | Remaining `https://via.placeholder.com` in `home.tsx` (post and product fallbacks — 2 instances) | `home.tsx` | Agent 4 |
| C6 | All `https://via.placeholder.com` calls in `Highlights.tsx` (7 instances — external HTTP on every render) | `Highlights.tsx` | Agent 4 |

### Priority D – Hook Dependency Correctness

| # | Issue | File(s) | Agent |
|---|-------|---------|-------|
| D1 | `eslint-disable-line react-hooks/exhaustive-deps` hiding stale dependency in `ProductPurchaseOrderContext.tsx` `useEffect` | `ProductPurchaseOrderContext.tsx` | Agent 3 |
| D2 | `eslint-disable-line react-hooks/exhaustive-deps` hiding missing `useCallback` functions in `CartContext.tsx` `useMemo` | `CartContext.tsx` | Agent 5 |
| D3 | `eslint-disable-line react-hooks/exhaustive-deps` hiding missing `useCallback` functions in `AddToCartLogContext.tsx` `useMemo` | `AddToCartLogContext.tsx` | Agent 5 |
| D4 | `eslint-disable-line react-hooks/exhaustive-deps` hiding missing `useCallback` in `ProductReportContext.tsx` `useEffect` | `ProductReportContext.tsx` | Agent 5 |

---

## Agent Task Breakdown

### Agent 1 – Remove Admin API Calls From Admin Pages
**Impact:** High — removes 1–3 server-side admin roundtrips per page load, and eliminates loading ALL auth users into memory just to enrich a list.  
**Files:**
- `src/pages/orders/list.tsx`
- `src/pages/orders/detail.tsx`
- `src/pages/payments/detail.tsx`

**Key changes:**
- `OrderListPage`: Replace `supabaseAdmin.auth.admin.listUsers()` with a single `user_details` query using `.in("id", userIds)` for display names. Replace per-order `order_items` loop with one batch query using `.in("order_id", orderIds)`.
- `OrderDetailPage`: Replace `supabaseAdmin.auth.admin.getUserById()` with `user_details.select("first_name, last_name").eq("id", userId).single()`. Build display name from `first_name + last_name`.
- `PaymentDetailPage`: Remove `supabaseAdmin.auth.admin.getUserById()`. The payment record already has its own `email` and `name` fields — use those directly. Fall back to `user_details` only for user name when `user_id` is set but `email` is not on the payment row.

### Agent 2 – Fix PaymentContext User Enrichment
**Impact:** Medium — payments list currently shows "User abc12345" instead of real names.  
**Files:**
- `src/context/PaymentContext.tsx`

**Key changes:**
- After collecting `userIds`, query `user_details` with `.select("id, first_name, last_name").in("id", userIds)`.
- Build display name: `${firstName} ${lastName}`.trim() or `User ${id.substring(0, 8)}` as fallback.
- The `user_details` table has **no `email` column** — use empty string for `user_email` or check if the payment row itself carries an `email` field (it does: `PaymentRow.email`).

### Agent 3 – Console Log Cleanup + ProductPurchaseOrderContext Correctness
**Impact:** Medium — removes debug output from production hot paths; fixes a correctness bug in realtime state updates.  
**Files:**
- `src/context/product/ProductContext.tsx`
- `src/context/product/ProductPurchaseOrderContext.tsx`
- `src/pages/landing/Chat.tsx`

**Key changes:**
- `ProductContext.tsx`: Wrap all bare `console.error(...)` with `if (process.env.NODE_ENV === "development") { ... }`.
- `ProductPurchaseOrderContext.tsx`:
  1. Remove debug `console.log(product_purchase_order_entries)` and `console.log(product_purchase_order)` in `createProductPurchaseOrder`.
  2. Guard `console.error` calls with dev check.
  3. **Fix stale closure bug**: The `handleChanges` function inside `useEffect` reads `product_purchase_orders` from the stale closure. Replace all direct state reads with functional setState: `setProductPurchaseOrders(prev => [...prev, payload.new])` etc.
  4. Use `showAlertRef` pattern (add `useRef`) to decouple `showAlert` from `useEffect` deps.
  5. Update `useEffect` deps to `[]`, remove `// eslint-disable-line react-hooks/exhaustive-deps`.
- `Chat.tsx`: Remove or guard `console.log(...)` calls with `if (process.env.NODE_ENV === "development")`.

### Agent 4 – Memoization + Placeholder Image Cleanup
**Impact:** Medium — prevents unnecessary re-renders on product section and eliminates external HTTP requests for placeholder images.  
**Files:**
- `src/pages/landing/ProductSection.tsx`
- `src/pages/landing/Highlights.tsx`
- `src/pages/landing/home.tsx`

**Key changes:**
- `ProductSection.tsx`:
  1. Convert `filteredProducts` (currently computed as a plain variable after the loading guard) to a `useMemo` and move it **before** the `if (productsLoading)` early return. Dependencies: `[products, selectedCategory, departmentId, rangeId, brandId, selectedSort]`.
  2. Add a `productMediaMap` `useMemo`: `new Map(productMedias.map(m => [m.product_id, m.media_url ?? ""]))` and replace the inline `.find()` call with `productMediaMap.get(product.id) ?? "/default-image.jpg"`.
- `Highlights.tsx`: Add a module-level (outside the component) `makePlaceholderImageUrl` function (copy the same SVG logic). Replace all 7 `https://via.placeholder.com/...` fallback strings with calls to this function.
- `home.tsx`:
  1. Move `makePlaceholderImageUrl` from inside the `HomePage` component body to **module scope** (outside the component function).
  2. Replace the 2 remaining `https://via.placeholder.com/...` instances (post media fallback and product media fallback inside JSX) with `makePlaceholderImageUrl(...)` calls.

### Agent 5 – Fix Hook Dependency Issues (CartContext, AddToCartLogContext, ProductReportContext)
**Impact:** Low-Medium — fixes hidden stale closure risks and removes technical debt from suppressed lint warnings.  
**Files:**
- `src/context/product/CartContext.tsx`
- `src/context/product/AddToCartLogContext.tsx`
- `src/context/product/ProductReportContext.tsx`

**Key changes:**
- All three contexts have CRUD functions defined as plain `async function` inside the provider. These need to be wrapped in `useCallback`.
- `CartContext.tsx`: Wrap `createAddToCart`, `updateAddToCart`, `deleteAddToCart`, `fetchByUser`, `clearCartByUser` in `useCallback`. Add `showAlertRef` for `showAlert`. Update the `useMemo` dependency array to include all the wrapped functions. Remove `// eslint-disable-line react-hooks/exhaustive-deps`.
- `AddToCartLogContext.tsx`: Same pattern — wrap `createAddToCartLog`, `updateAddToCartLog`, `deleteAddToCartLog`, `fetchByProductId` in `useCallback`. Update `useMemo` deps.
- `ProductReportContext.tsx`: Wrap `fetchProductReports` in `useCallback` with `[]` deps. Add `fetchProductReports` to the `useEffect` dependency array. Remove `// eslint-disable-line`.

---

## Estimated Impact Summary

| Agent | Estimated Render Reduction | API Calls Saved | Production Log Noise |
|-------|--------------------------|-----------------|----------------------|
| Agent 1 | Low (page-level) | ⬇ 1–3 admin roundtrips per page | — |
| Agent 2 | None | ⬇ 1 admin roundtrip per payments fetch | — |
| Agent 3 | Low-Medium | — | ⬇ ~10 log calls per interaction |
| Agent 4 | Medium (ProductSection re-renders) | ⬇ 7+ external image requests | — |
| Agent 5 | Medium (context re-renders) | — | — |

---

## File Reference Map

| File | Agent |
|------|-------|
| `src/pages/orders/list.tsx` | Agent 1 |
| `src/pages/orders/detail.tsx` | Agent 1 |
| `src/pages/payments/detail.tsx` | Agent 1 |
| `src/context/PaymentContext.tsx` | Agent 2 |
| `src/context/product/ProductContext.tsx` | Agent 3 |
| `src/context/product/ProductPurchaseOrderContext.tsx` | Agent 3 |
| `src/pages/landing/Chat.tsx` | Agent 3 |
| `src/pages/landing/ProductSection.tsx` | Agent 4 |
| `src/pages/landing/Highlights.tsx` | Agent 4 |
| `src/pages/landing/home.tsx` | Agent 4 |
| `src/context/product/CartContext.tsx` | Agent 5 |
| `src/context/product/AddToCartLogContext.tsx` | Agent 5 |
| `src/context/product/ProductReportContext.tsx` | Agent 5 |

---

## Key Database Schema Notes (for agents)

The `user_details` table (from `database.types.ts`) has:
- `id` (uuid) — matches auth user id
- `first_name` (string | null)
- `last_name` (string | null)
- `role`, `lifetime_val`, `profile_image`, `birthdate`, `city`, `state`, `race`
- **NO `email` column**

For display names, use `${first_name ?? ""} ${last_name ?? ""}`.trim() with fallback to `User ${id.substring(0, 8)}`.

The `payments` table has its own `email` (string | null) and `name` (string | null) columns that should be used directly instead of calling the admin auth API.
