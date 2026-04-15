# Performance Fix Plan — Round 3 (2026)

**Status**: Ready for Implementation  
**Audit Date**: March 2026  
**Author**: Senior Dev Code Review  
**Related Docs**: `PERFORMANCE_FIX_PLAN_2026.md`, `PERFORMANCE_FIX_PLAN_2026_ROUND2.md`

---

## Executive Summary

Rounds 1 and 2 addressed the highest-impact architectural issues (route-scoped providers, code splitting, N+1 queries, admin API replacements, stale closures, sidebar anti-patterns). The application is now structurally sound. Round 3 focuses on the remaining **code quality and production pollution** issues that survived the previous rounds.

**Top 3 most impactful fixes this round:**
1. **`Math.random()` in production JSX** (`home.tsx`) — produces hydration mismatches and different prices on every render cycle.
2. **`via.placeholder.com` in `HomeHighlightsCard.tsx`** — the last hard-coded external HTTP fallback, visible on every card that lacks media.
3. **`console.log`/`error` throughout stocks, analytics, posts, and internal chat** — 25+ loud development logs firing in production on hot paths.

---

## ✅ Already Fixed (Do Not Redo)

### Round 1 Fixes
| Fix | File(s) |
|-----|---------|
| 36 global providers → route-scoped bundles | `App.tsx`, `RouteContextBundles.tsx` |
| Code splitting — all 40+ pages lazy loaded | `App.tsx` |
| `OrderContext` memoization + stale closure | `OrderContext.tsx` |
| `UserContext` N+1 → batch `.in()` query | `UserContext.tsx` |
| `ProductContext` realtime UPDATE wipe bug | `ProductContext.tsx` |
| `flatMap + Array(1).fill()` anti-pattern | `products/list.tsx` |
| `ConfirmDeleteModal` rendered per card | `products/list.tsx` |
| O(n²) `productMedias.find()` in render | `products/list.tsx` |
| Filter re-computed in JSX without `useMemo` | `products/list.tsx` |
| `ConversationContext` loads all messages at mount | `ConversationContext.tsx` |
| `AlertContext` not memoized | `AlertContext.tsx` |
| Smart image lazy loading (`SmartImage`) | `SmartImage.tsx` |
| React 18 Concurrent Mode (`ReactDOM.createRoot`) | `index.tsx` |
| `React.StrictMode` added | `index.tsx` |
| `URLSearchParams` not memoized | `ProductSection.tsx` |

### Round 2 Fixes
| Fix | File(s) |
|-----|---------|
| `orders/list.tsx`: `listUsers()` + N loop → batch queries | `orders/list.tsx` |
| `orders/detail.tsx`: `getUserById()` → `user_details` | `orders/detail.tsx` |
| `payments/detail.tsx`: `getUserById()` → payment own fields | `payments/detail.tsx` |
| `PaymentContext`: user name shows UUID → real name fix | `PaymentContext.tsx` |
| `ProductPurchaseOrderContext`: stale closure in realtime | `ProductPurchaseOrderContext.tsx` |
| `ProductPurchaseOrderContext`: debug `console.log` removed | `ProductPurchaseOrderContext.tsx` |
| `ProductContext`: bare `console.error` → dev-guarded | `ProductContext.tsx` |
| `Chat.tsx`: debug `console.log` → dev-guarded | `Chat.tsx` |
| `ProductSection.tsx`: `filteredProducts` + `productMediaMap` memoized | `ProductSection.tsx` |
| `home.tsx` + `Highlights.tsx`: `via.placeholder.com` → SVG data URIs | `home.tsx`, `Highlights.tsx` |
| `CartContext`, `AddToCartLogContext`, `ProductReportContext`: hook deps fixed | 3 context files |

---

## 🔧 Remaining Issues — Round 3

### Priority A — Code Correctness / User-Visible

| # | Severity | Issue | File(s) | Agent |
|---|----------|-------|---------|-------|
| A1 | 🟠 High | `Math.random()` used as price fallback in JSX (`RM {product.price?.toFixed(2) \|\| (Math.random() * 100).toFixed(2)}`) — produces different prices on every render | `home.tsx` (line ~726) | Agent 1 |
| A2 | 🟡 Medium | `makePlaceholderImageUrl` defined inside `HomePage` component body — recreated on every render; pure function with no closure deps | `home.tsx` (lines 106–113) | Agent 1 |
| A3 | 🟡 Medium | `HomeHighlightsCard.tsx`: last-resort fallback in `resolveImageUrl` still uses `https://via.placeholder.com/300x200?text=Image` — external HTTP request fires when both `imageUrl` and `fallbackImageUrl` are unavailable | `components/home/HomeHighlightsCard.tsx` (line 53) | Agent 1 |

### Priority B — Production Log Pollution

| # | Severity | Issue | File(s) | Agent |
|---|----------|-------|---------|-------|
| B1 | 🟡 Medium | `Chat.tsx`: 3 bare `console.error` calls left unguarded (Round 2 only guarded `console.log`) | `pages/landing/Chat.tsx` (lines 246, 258, 278) | Agent 2 |
| B2 | 🟡 Medium | `WishlistContext.tsx`: bare `console.warn` and 2× `console.error` in `fetchWishlist`, `addToWishlist`, `removeFromWishlist` | `context/WishlistContext.tsx` (lines 133, 137, 182, 223) | Agent 2 |
| B3 | 🟡 Medium | `ProductStockLogContext.tsx`: ~9 bare `console.error` calls across `fetchProductStockLogs`, `handleRealtimeChanges`, `createProductStockLog`, `updateProductStockLog`, `deleteProductStockLog` | `context/product/ProductStockLogContext.tsx` | Agent 3 |
| B4 | 🟡 Medium | `stocks/report.tsx`: 2 bare `console.log` top-level in component body (fires on every render) | `pages/stocks/report.tsx` (lines 22–23) | Agent 3 |
| B5 | 🟡 Medium | `stocks/list.tsx`: bare `console.log(products)` on every render | `pages/stocks/list.tsx` (line 22) | Agent 3 |
| B6 | 🟡 Medium | `stocks/create-purchase-order.tsx`: bare `console.log(productId, productEventId)` fires on every render | `pages/stocks/create-purchase-order.tsx` (line 40) | Agent 3 |
| B7 | 🔵 Low | `analytics/products-inner.tsx`: bare `console.log(products)` on every render | `pages/analytics/products-inner.tsx` (line 17) | Agent 4 |
| B8 | 🔵 Low | `analytics/categories.tsx`: bare `console.log(products)` on every render | `pages/analytics/categories.tsx` (line 82) | Agent 4 |
| B9 | 🔵 Low | `posts/post-editor.tsx`: bare `console.log(\"Save post\")` + `console.log(postData)` on save handler | `pages/posts/post-editor.tsx` (lines 66–67) | Agent 4 |
| B10 | 🔵 Low | `products/add-stock-modal.tsx`: `console.log(stockLogs)` + commented-out `console.log(productStocks)` | `pages/products/add-stock-modal.tsx` (lines 25, 48) | Agent 4 |
| B11 | 🔵 Low | `products/add-return-modal.tsx`: `console.log(stockLogs)` | `pages/products/add-return-modal.tsx` (line 48) | Agent 4 |

### Priority C — Code Quality

| # | Severity | Issue | File(s) | Agent |
|---|----------|-------|---------|-------|
| C1 | 🟠 High | `category-page.tsx`: 4 bare `console.error` calls + `Math.random()` used to generate Supabase storage upload file IDs (produces collisions + non-deterministic behavior) | `pages/products/category-page.tsx` (lines 79, 176, 215, 254, 89, 181, 220, 259) | Agent 5 |
| C2 | 🔵 Low | `internal-chat/index.tsx`: 15+ bare `console.log` and `console.error` calls in hot paths (group create, invite, message send, direct message flows) | `pages/internal-chat/index.tsx` | Agent 5 |
| C3 | 🔵 Low | `components/stripe/CheckoutButton.tsx`: 2 bare `console.log` calls (debug mode check + env dump) | `components/stripe/CheckoutButton.tsx` (lines 79–80) | Agent 5 |

---

## Agent Task Breakdown

### Agent 1 — Home Page: Placeholder + Random Price Fixes
**Impact:** 🟠 Medium-High — eliminates external HTTP calls on every card render; stops random price values flashing in product list  
**Files:**
- `src/pages/landing/home.tsx`
- `src/components/home/HomeHighlightsCard.tsx`

**Key changes:**
1. Move `makePlaceholderImageUrl` from inside `HomePage` component body to **module scope** (outside the component function). It has no closure dependencies.
2. Fix `Math.random()` price fallback in the Products section JSX (line ~726): replace `(Math.random() * 100).toFixed(2)` with `"—"` or `"N/A"` as a static fallback string.
3. In `HomeHighlightsCard.tsx`, replace the `"https://via.placeholder.com/300x200?text=Image"` fallback in `resolveImageUrl` with a module-scoped inline SVG data URI (same pattern used in `home.tsx` for `makePlaceholderImageUrl`).

**Estimated impact:** Eliminates external network requests for all category/brand/department cards that lack media. Prevents price re-renders on every re-mount.

---

### Agent 2 — Chat & Wishlist: console.error Cleanup
**Impact:** 🟡 Medium — stops error-level logs from appearing in production DevTools  
**Files:**
- `src/pages/landing/Chat.tsx`
- `src/context/WishlistContext.tsx`

**Key changes:**
1. `Chat.tsx` (lines 246, 258, 278): Wrap `console.error("Failed to create ticket")`, `console.error("Failed to create conversation")`, and `console.error("Error creating ticket and conversation:", error)` with `if (process.env.NODE_ENV === "development") { ... }`.
2. `WishlistContext.tsx` (lines 133, 137, 182, 223): Wrap `console.warn("Wishlist table does not exist yet…")`, `console.error("Failed to fetch wishlist:", error)`, `console.error("Failed to add to wishlist:", error)`, and `console.error("Failed to remove from wishlist:", error)` with dev guards.

**Estimated impact:** Eliminates ~4 production log calls per wishlist/chat interaction.

---

### Agent 3 — Stock Page & Context: console.log/error Cleanup
**Impact:** 🟡 Medium — removes component-level debug logs that fire on every render for the stock management routes  
**Files:**
- `src/context/product/ProductStockLogContext.tsx`
- `src/pages/stocks/report.tsx`
- `src/pages/stocks/list.tsx`
- `src/pages/stocks/create-purchase-order.tsx`

**Key changes:**
1. `ProductStockLogContext.tsx`: Wrap all ~9 `console.error(...)` calls with `if (process.env.NODE_ENV === "development") { ... }`.
2. `stocks/report.tsx` (lines 22–23): Remove (or guard with dev check) the two `console.log(...)` calls at the top of the component body — they fire on every render.
3. `stocks/list.tsx` (line 22): Remove or guard `console.log(products)`.
4. `stocks/create-purchase-order.tsx` (line 40): Remove or guard `console.log(productId, productEventId)`.

**Estimated impact:** Eliminates ~13 production log calls per stock management page render.

---

### Agent 4 — Analytics, Posts & Products: console Cleanup
**Impact:** 🔵 Low-Medium — removes leftover debug logs from analytics and content-management hot paths  
**Files:**
- `src/pages/analytics/products-inner.tsx`
- `src/pages/analytics/categories.tsx`
- `src/pages/posts/post-editor.tsx`
- `src/pages/products/add-stock-modal.tsx`
- `src/pages/products/add-return-modal.tsx`

**Key changes:**
1. `analytics/products-inner.tsx` (line 17): Remove `console.log(products)`.
2. `analytics/categories.tsx` (line 82): Remove `console.log(products)`.
3. `posts/post-editor.tsx` (lines 66–67): Remove or guard `console.log("Save post")` and `console.log(postData)`.
4. `products/add-stock-modal.tsx` (line 25): Remove commented-out `// console.log(productStocks)`. Line 48: guard `console.log(stockLogs)` with dev check.
5. `products/add-return-modal.tsx` (line 48): Guard `console.log(stockLogs)` with dev check or remove.

**Estimated impact:** Eliminates ~6 production log calls across these pages.

---

### Agent 5 — Category Page & Internal Chat: Correctness + Cleanup
**Impact:** 🟠 High (for category page `Math.random`) / Low (for internal chat logs)  
**Files:**
- `src/pages/products/category-page.tsx`
- `src/pages/internal-chat/index.tsx`
- `src/components/stripe/CheckoutButton.tsx`

**Key changes:**
1. `category-page.tsx`: Replace all 4 instances of `Math.random().toString(36).substring(2)` used as Supabase storage upload file IDs with `crypto.randomUUID()` (available globally in modern browsers and Node 14+). Wrap all 4 `console.error(error)` upload-error calls with `if (process.env.NODE_ENV === "development") { ... }`.
2. `internal-chat/index.tsx`: Wrap all bare `console.log` and `console.error` calls with dev guards. Remove the debug `console.log("[DirectChat Debug]", ...)` dumps on lines 63 and 92 that expose internal state.
3. `CheckoutButton.tsx` (lines 79–80): Wrap `console.log(env, appUrl, portEnv, isDev)` and `console.log("Condition Check:", isDev)` with dev guards.

**Estimated impact:** Eliminates storage key collisions in category image uploads. Removes ~20 production log calls from internal chat.

---

## Estimated Impact Table

| Agent | Severity | Key Benefit | Log Calls Removed |
|-------|----------|-------------|-------------------|
| Agent 1 | 🟠 High | No more external HTTP on card fallbacks; no random prices | — |
| Agent 2 | 🟡 Medium | Cleaner devtools on chat/wishlist flows | ~4 per interaction |
| Agent 3 | 🟡 Medium | Eliminates render-phase logs on stock pages | ~13 per render |
| Agent 4 | 🔵 Low | Removes analytics/post debug residue | ~6 per render |
| Agent 5 | 🟠 High | Fixes storage key collisions; silences internal chat | ~20+ per session |

---

## File Reference Map

| File | Agent |
|------|-------|
| `src/pages/landing/home.tsx` | Agent 1 |
| `src/components/home/HomeHighlightsCard.tsx` | Agent 1 |
| `src/pages/landing/Chat.tsx` | Agent 2 |
| `src/context/WishlistContext.tsx` | Agent 2 |
| `src/context/product/ProductStockLogContext.tsx` | Agent 3 |
| `src/pages/stocks/report.tsx` | Agent 3 |
| `src/pages/stocks/list.tsx` | Agent 3 |
| `src/pages/stocks/create-purchase-order.tsx` | Agent 3 |
| `src/pages/analytics/products-inner.tsx` | Agent 4 |
| `src/pages/analytics/categories.tsx` | Agent 4 |
| `src/pages/posts/post-editor.tsx` | Agent 4 |
| `src/pages/products/add-stock-modal.tsx` | Agent 4 |
| `src/pages/products/add-return-modal.tsx` | Agent 4 |
| `src/pages/products/category-page.tsx` | Agent 5 |
| `src/pages/internal-chat/index.tsx` | Agent 5 |
| `src/components/stripe/CheckoutButton.tsx` | Agent 5 |

---

## Key Schema Notes (for agents)

The `user_details` table has:
- `id` (uuid) — matches auth user id
- `first_name` (string | null), `last_name` (string | null)
- **No `email` column**

For `makePlaceholderImageUrl` SVG data URI pattern (use exactly this):
```ts
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
```

For Supabase storage upload IDs: use `crypto.randomUUID()` (no import needed in browser/Node 14+) instead of `Math.random().toString(36).substring(2)`.
