# Admin / Customer Code Split Plan — 2026

**Status**: Ready for Implementation  
**Date**: March 14, 2026  
**Goal**: Reduce JavaScript bundle parsed by customer phones by removing all admin code from the customer-facing entry point  
**Companion**: `ADMIN_CUSTOMER_SPLIT_AGENT_PROMPTS_2026.md`

---

## Background

The app currently ships as a single React SPA. Every customer visiting the home page on their phone has to download and parse the full JavaScript bundle — including all admin pages (stocks, analytics, purchase orders, post editor, product management, etc.).

On mobile Chrome, parsing JavaScript is the single most CPU-intensive task and directly blocks scroll rasterization. Removing admin code from the customer bundle reduces parse time, freeing more CPU for smooth scrolling.

The app already uses `React.lazy` + `Suspense` for every page — so each page is a separate chunk. However, the problem is at the **shared imports** level: context bundles, utility functions, and third-party libraries (like `react-dnd`) that are imported by admin pages are being included in the initial chunk even though customers never use them.

---

## What We Are Doing

### Strategy: Two Separate Entry-Point React Apps

We are splitting `App.tsx` into two separate routers:

| App | Routes | Bundle content |
|-----|--------|----------------|
| **Customer app** (`AppCustomer.tsx`) | `/`, `/highlights`, `/product-section`, `/product-details`, `/cart`, `/checkout`, `/wishlist`, `/settings`, `/goal`, `/notifications`, `/support-chat`, `/order-details` | Only customer contexts, no admin imports |
| **Admin app** (`AppAdmin.tsx`) | `/dashboard`, `/products/*`, `/posts/*`, `/stocks/*`, `/orders/*`, `/payments/*`, `/analytics/*`, `/users/*`, `/support`, `/internal-chat`, `/home-page-builder` | All admin contexts, `react-dnd`, admin-only libraries |

Both apps share the same `AuthProvider`, `AlertProvider`, sign-in page, and error pages. A thin `index.tsx` entry point detects the route prefix and lazily imports the correct app.

---

## Key Files Changed

### New Files

| File | Purpose |
|------|---------|
| `src/AppCustomer.tsx` | Router for all customer-facing routes only |
| `src/AppAdmin.tsx` | Router for all admin routes only |

### Modified Files

| File | Change |
|------|--------|
| `src/index.tsx` | Import and render the right sub-app based on route prefix |
| `src/App.tsx` | Thin shell that lazy-imports `AppCustomer` or `AppAdmin` |

---

## Customer Routes (AppCustomer.tsx)

All wrapped in `SlimLandingContextBundle`:
- `/` — HomePage
- `/highlights` — HighlightsPage
- `/product-section/:categoryId?` — ProductSection
- `/product-details/:productId?` — ProductDetails
- `/cart` — CartPage
- `/checkout` — CheckoutPage
- `/order-success`, `/order-cancel` — Stripe callbacks
- `/order-details/:orderId` — CustomerOrderDetailPage
- `/wishlist` — WishlistPage
- `/goal` — GoalPage
- `/settings` — ProfileSettingsPage
- `/notifications` — NotificationsPage

Community routes (own context):
- `/support-chat` — ChatWindow
- `/internal-chat` — InternalChat (note: this is customer-visible)

Shared / no-context routes:
- `/authentication/sign-in`
- `/legal/privacy`
- `/pages/maintenance`
- `*` → 404

---

## Admin Routes (AppAdmin.tsx)

All behind `ProtectedRoute`. Context bundles applied per route group exactly as today in `App.tsx`.

- `/dashboard`
- `/users/list`, `/users/settings` — UserProvider
- `/posts/*` — PostContextBundle
- `/products/*`, `/stocks/*` — ProductContextBundle + DndProvider
- `/orders/*`, `/payments/*` — OrderContextBundle
- `/support` — CommunityContextBundle
- `/analytics/*` — AnalyticsContextBundle
- `/home-page-builder` — HomePageElementProvider

---

## How the Split Is Detected

In `App.tsx`, the path is checked at render time. If the path starts with any admin prefix (`/dashboard`, `/products`, `/posts`, `/stocks`, `/orders`, `/payments`, `/analytics`, `/users`, `/support`, `/home-page-builder`, `/internal-chat`), the `AppAdmin` component is lazily imported. Otherwise, `AppCustomer` is imported.

Because both sub-apps are `React.lazy()` — only ONE is ever downloaded by any given user. A customer never downloads the admin bundle. An admin who navigates to an admin URL downloads both (lazy), which is fine.

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Customer initial JS parse | Full bundle (~all admin code) | Customer bundle only (est. ~40-50% smaller) |
| Admin libraries on customer devices | Yes (react-dnd, chart libs, etc.) | No |
| Scroll whiteness on mobile | Still present (main thread busy) | Significantly improved (less JS to parse) |
| Admin functionality | Unchanged | Unchanged |
| Authentication | Unchanged | Unchanged |

---

## Verification After Implementation

1. `npx tsc --noEmit` — must pass with 0 errors
2. `npm run build` — both bundles must build without error
3. Open the home page in Chrome DevTools → Network → JS. Confirm no admin-named chunks load for customer routes
4. Navigate to `/dashboard`. Confirm admin chunk loads correctly
5. Test full customer flow: home → product → cart → checkout
6. Test full admin flow: login → dashboard → products
