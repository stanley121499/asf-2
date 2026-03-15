# Admin / Customer Split — Agent Prompts 2026

**Companion Plan**: `ADMIN_CUSTOMER_SPLIT_PLAN_2026.md`  
**Model**: Gemini 2.5 Pro  
**Total Agents**: 3

---

## Overview for All Agents

> Read this section before starting your assigned agent task.

**The problem**: This is a React SPA. Every customer visiting the home page on mobile downloads and parses ALL JavaScript — including unused admin code (stock management, analytics, purchase orders). This bloats the customer bundle, slows mobile parse time, and causes scroll jank.

**The fix**: Split `App.tsx` into two lazily-imported sub-apps:
- `AppCustomer.tsx` — only customer routes + customer context imports
- `AppAdmin.tsx` — only admin routes + admin context imports

The key insight is that `React.lazy()` makes the browser only download the chunk it needs. So a customer never downloads the admin bundle, and vice versa.

**Key constraint**: Do NOT change any page components, context providers, or utility files. Only `App.tsx` is being restructured. All existing lazy imports are moved into the appropriate sub-app.

**TypeScript**: The project uses TypeScript strict mode. Run `npx tsc --noEmit` to verify. Double-quote strings. No `any` types unless pre-existing.

---

---

## Agent 1 — Create `AppCustomer.tsx`

### Your Task

Create a new file `src/AppCustomer.tsx` that contains ONLY the customer-facing routes from the current `src/App.tsx`.

### Context: What the current App.tsx looks like

The current `src/App.tsx` has these imports at the top (lazy imports for pages):

```ts
import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter, Outlet } from "react-router-dom";
import { AlertComponent } from "./components/AlertComponent";
import FlowbiteWrapper from "./components/FlowbiteWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import {
  CommunityContextBundle,
  SlimLandingContextBundle,
} from "./context/RouteContextBundles";
import OrderSuccess from "./components/stripe/OrderSuccess";
import OrderCancel from "./components/stripe/OrderCancel";
import "./index.css";
import LoadingPage from "./pages/pages/loading";
```

And it lazy-loads these customer pages (you need ALL of these in AppCustomer):
```ts
const CartPage = lazy(() => import("./pages/landing/Cart"));
const CustomerOrderDetailPage = lazy(() => import("./pages/landing/OrderDetail"));
const ProductSection = lazy(() => import("./pages/landing/ProductSection"));
const ProductDetails = lazy(() => import("./pages/landing/ProductDetails"));
const GoalPage = lazy(() => import("./pages/landing/Goal"));
const ProfileSettingsPage = lazy(() => import("./pages/landing/Settings"));
const ChatWindow = lazy(() => import("./pages/landing/Chat"));
const CheckoutPage = lazy(() => import("./pages/landing/Checkout"));
const NotificationsPage = lazy(() => import("./pages/landing/notifications"));
const WishlistPage = lazy(() => import("./pages/landing/Wishlist"));
const HighlightsPage = lazy(() => import("./pages/landing/Highlights"));
const HomePage = lazy(() => import("./pages/landing/home"));
const SignInPage = lazy(() => import("./pages/authentication/sign-in"));
const PrivacyPage = lazy(() => import("./pages/legal/privacy"));
const NotFoundPage = lazy(() => import("./pages/pages/404"));
const ServerErrorPage = lazy(() => import("./pages/pages/500"));
const MaintenancePage = lazy(() => import("./pages/pages/maintenance"));
const InternalChat = lazy(() => import("./pages/internal-chat"));
```

### What to create: `src/AppCustomer.tsx`

Create this file at `src/AppCustomer.tsx` with the following structure:

```tsx
import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter, Outlet } from "react-router-dom";
import { AlertComponent } from "./components/AlertComponent";
import FlowbiteWrapper from "./components/FlowbiteWrapper";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import {
  CommunityContextBundle,
  SlimLandingContextBundle,
} from "./context/RouteContextBundles";
import OrderSuccess from "./components/stripe/OrderSuccess";
import OrderCancel from "./components/stripe/OrderCancel";
import "./index.css";
import LoadingPage from "./pages/pages/loading";

// ── Customer page lazy imports ──────────────────────────────────────────────
const HomePage = lazy(() => import("./pages/landing/home"));
const HighlightsPage = lazy(() => import("./pages/landing/Highlights"));
const CartPage = lazy(() => import("./pages/landing/Cart"));
const CustomerOrderDetailPage = lazy(() => import("./pages/landing/OrderDetail"));
const ProductSection = lazy(() => import("./pages/landing/ProductSection"));
const ProductDetails = lazy(() => import("./pages/landing/ProductDetails"));
const GoalPage = lazy(() => import("./pages/landing/Goal"));
const ProfileSettingsPage = lazy(() => import("./pages/landing/Settings"));
const ChatWindow = lazy(() => import("./pages/landing/Chat"));
const CheckoutPage = lazy(() => import("./pages/landing/Checkout"));
const NotificationsPage = lazy(() => import("./pages/landing/notifications"));
const WishlistPage = lazy(() => import("./pages/landing/Wishlist"));
const InternalChat = lazy(() => import("./pages/internal-chat"));
const SignInPage = lazy(() => import("./pages/authentication/sign-in"));
const PrivacyPage = lazy(() => import("./pages/legal/privacy"));
const NotFoundPage = lazy(() => import("./pages/pages/404"));
const ServerErrorPage = lazy(() => import("./pages/pages/500"));
const MaintenancePage = lazy(() => import("./pages/pages/maintenance"));

const AppCustomer: React.FC = () => {
  return (
    <AlertProvider>
      <AuthProvider>
        <AlertComponent />
        <BrowserRouter>
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              <Route element={<FlowbiteWrapper />}>

                {/* Customer / landing routes — wrapped in SlimLandingContextBundle */}
                <Route element={<SlimLandingContextBundle><Outlet /></SlimLandingContextBundle>}>
                  {/* Shopping flow */}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/order-cancel" element={<OrderCancel />} />
                  <Route path="/order-details/:orderId" element={<CustomerOrderDetailPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />

                  {/* Product browsing */}
                  <Route path="/product-section/:categoryId?" element={<ProductSection />} />
                  <Route path="/product-details/:productId?" element={<ProductDetails />} />

                  {/* Post / highlights */}
                  <Route path="/highlights" element={<HighlightsPage />} />

                  {/* Home & notifications */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />

                  {/* Profile & misc landing pages */}
                  <Route path="/goal" element={<GoalPage />} />
                  <Route path="/settings" element={<ProfileSettingsPage />} />
                </Route>

                {/* Community / chat — own context bundle */}
                <Route element={<CommunityContextBundle><Outlet /></CommunityContextBundle>}>
                  <Route path="/support-chat" element={<ChatWindow />} />
                  <Route path="/internal-chat" element={<InternalChat />} />
                </Route>

                {/* Auth and legal — no data contexts */}
                <Route path="/pages/maintenance" element={<MaintenancePage />} />
                <Route path="/authentication/sign-in" element={<SignInPage />} />
                <Route path="/legal/privacy" element={<PrivacyPage />} />

                {/* Error routes */}
                <Route path="/500" element={<ServerErrorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </AlertProvider>
  );
};

export default AppCustomer;
```

### Verification

1. Run `npx tsc --noEmit` — must pass with 0 errors.
2. The file must NOT import anything from: `react-dnd`, `ProductContextBundle`, `PostContextBundle`, `OrderContextBundle`, `AnalyticsContextBundle`, `UserProvider`, `HomePageElementProvider`, or any admin page under `./pages/products`, `./pages/posts`, `./pages/stocks`, `./pages/orders`, `./pages/payments`, `./pages/analytics`, `./pages/users`.
3. The file must export a default React component named `AppCustomer`.

---

---

## Agent 2 — Create `AppAdmin.tsx`

### Your Task

Create a new file `src/AppAdmin.tsx` that contains ONLY the admin (protected) routes from the current `src/App.tsx`.

### Context: What the current App.tsx contains for admin

The admin section in `App.tsx` uses these imports (you need ALL of them in AppAdmin):

```ts
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HomePageElementProvider } from "./context/HomePageElementContext";
import { UserProvider } from "./context/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import {
  ProductContextBundle,
  PostContextBundle,
  OrderContextBundle,
  CommunityContextBundle,
  AnalyticsContextBundle,
} from "./context/RouteContextBundles";
```

And these lazy page imports (include ALL of these — do NOT include any customer pages):

```ts
const DashboardPage = lazy(() => import("./pages"));
const SignInPage = lazy(() => import("./pages/authentication/sign-in"));
const CreatePostPage = lazy(() => import("./pages/posts/create-post-page"));
const PostListPage = lazy(() => import("./pages/posts/list"));
const SchedulePostListPage = lazy(() => import("./pages/posts/schedule-post-page"));
const CategoryListPage = lazy(() => import("./pages/products/category-page"));
const CreateProductPage = lazy(() => import("./pages/products/create-product-page"));
const DeletedProductsPage = lazy(() => import("./pages/products/deleted-products"));
const ProductListPage = lazy(() => import("./pages/products/list"));
const ScheduleProductListPage = lazy(() => import("./pages/products/schedule-product-page"));
const CreatePurchaseOrderPage = lazy(() => import("./pages/stocks/create-purchase-order"));
const CreateReportPage = lazy(() => import("./pages/stocks/create-report"));
const StockAllProductEventPage = lazy(() => import("./pages/stocks/event-list"));
const StockAllProductPage = lazy(() => import("./pages/stocks/list"));
const StockOverviewPage = lazy(() => import("./pages/stocks/overview"));
const StockReportPage = lazy(() => import("./pages/stocks/report"));
const ViewPurchaseOrderPage = lazy(() => import("./pages/stocks/view-purchase-order"));
const ViewReportPage = lazy(() => import("./pages/stocks/view-report"));
const GoodStockPage = lazy(() => import("./pages/stocks/good-stocks"));
const UserListPage = lazy(() => import("./pages/users/list"));
const UserSettingsPage = lazy(() => import("./pages/users/settings"));
const ProductStockDetails = lazy(() => import("./pages/products/stock"));
const HomePageBuilder = lazy(() => import("./pages/home-page-builder"));
const OrderListPage = lazy(() => import("./pages/orders/list"));
const PaymentListPage = lazy(() => import("./pages/payments").then(m => ({ default: m.PaymentListPage })));
const PaymentDetailPage = lazy(() => import("./pages/payments").then(m => ({ default: m.PaymentDetailPage })));
const OrderDetailPage = lazy(() => import("./pages/orders/detail"));
const SupportPage = lazy(() => import("./pages/support"));
const InternalChat = lazy(() => import("./pages/internal-chat"));
const SupportAnalyticsPage = lazy(() => import("./pages/analytics/support"));
const UserAnalyticsPage = lazy(() => import("./pages/analytics/users"));
const ProductAnalyticsPage = lazy(() => import("./pages/analytics/products"));
const CategoriesAnalyticsPage = lazy(() => import("./pages/analytics/categories"));
const CategoriesInnerAnalyticsPage = lazy(() => import("./pages/analytics/categories-inner"));
const ProductInnerAnalyticsPage = lazy(() => import("./pages/analytics/products-inner"));
const NotFoundPage = lazy(() => import("./pages/pages/404"));
const ServerErrorPage = lazy(() => import("./pages/pages/500"));
const MaintenancePage = lazy(() => import("./pages/pages/maintenance"));
```

### What to create: `src/AppAdmin.tsx`

Create the file with the following structure. Copy the **entire admin `<Route>` block** from `App.tsx` exactly as-is — do not change any route paths or context wrappers:

```tsx
import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter, Outlet } from "react-router-dom";
import { AlertComponent } from "./components/AlertComponent";
import FlowbiteWrapper from "./components/FlowbiteWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import {
  ProductContextBundle,
  PostContextBundle,
  OrderContextBundle,
  CommunityContextBundle,
  AnalyticsContextBundle,
} from "./context/RouteContextBundles";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HomePageElementProvider } from "./context/HomePageElementContext";
import "./index.css";
import LoadingPage from "./pages/pages/loading";

// ── Admin page lazy imports ─────────────────────────────────────────────────
const DashboardPage = lazy(() => import("./pages"));
const SignInPage = lazy(() => import("./pages/authentication/sign-in"));
// ... (all the admin lazy imports listed above)
const NotFoundPage = lazy(() => import("./pages/pages/404"));
const ServerErrorPage = lazy(() => import("./pages/pages/500"));
const MaintenancePage = lazy(() => import("./pages/pages/maintenance"));

const AppAdmin: React.FC = () => {
  return (
    <AlertProvider>
      <AuthProvider>
        <AlertComponent />
        <BrowserRouter>
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              <Route element={<FlowbiteWrapper />}>
                {/* Protected Routes — copy exactly from App.tsx */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  {/* ... copy the rest of the protected routes exactly from App.tsx ... */}
                </Route>

                {/* Auth and error pages — shared with customer */}
                <Route path="/pages/maintenance" element={<MaintenancePage />} />
                <Route path="/authentication/sign-in" element={<SignInPage />} />
                <Route path="/500" element={<ServerErrorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </AlertProvider>
  );
};

export default AppAdmin;
```

> **Important**: The `{/* ... copy the rest ... */}` placeholder above is NOT final code. You MUST copy the actual admin route tree verbatim from `src/App.tsx` lines 94–211. Read the file and copy precisely.

### Verification

1. Run `npx tsc --noEmit` — must pass with 0 errors.
2. The file must NOT import `SlimLandingContextBundle` or any customer page from `./pages/landing/*`.
3. The file must export a default React component named `AppAdmin`.

---

---

## Agent 3 — Update `App.tsx` to Route Between Sub-Apps

### Your Task

Rewrite `src/App.tsx` to be a thin dispatcher that lazily loads either `AppCustomer` or `AppAdmin` depending on the current URL path. This is the final step that wires everything together.

### Context

After Agents 1 and 2 run:
- `src/AppCustomer.tsx` exists and exports `AppCustomer` as default
- `src/AppAdmin.tsx` exists and exports `AppAdmin` as default
- The original `App.tsx` still has the old full routing code

Your job is to replace the full `App.tsx` with a thin shell.

### Admin route prefixes

A request is "admin" if the path starts with ANY of:
```
/dashboard, /products, /posts, /stocks, /orders, /payments, /analytics, /users, /support, /home-page-builder, /internal-chat
```

### How to detect the path at render time in React

Use `window.location.pathname` to detect the current route **before** React Router is mounted. This is safe here because we're deciding which app to mount, not navigating within an app.

### The new `src/App.tsx`

Replace the entire contents of `src/App.tsx` with exactly this:

```tsx
import React, { lazy, Suspense } from "react";
import LoadingPage from "./pages/pages/loading";

/**
 * Admin route path prefixes.
 * If the current URL starts with any of these, we load the admin bundle.
 * All other paths load the customer bundle.
 *
 * This ensures customers never download admin code, and admins only download
 * the admin bundle when they actually navigate to an admin URL.
 */
const ADMIN_PREFIXES = [
  "/dashboard",
  "/products",
  "/posts",
  "/stocks",
  "/orders",
  "/payments",
  "/analytics",
  "/users",
  "/support",
  "/home-page-builder",
  "/internal-chat",
];

/**
 * Returns true if the current pathname belongs to the admin section.
 * Uses window.location.pathname because React Router is not yet mounted
 * at the point we need to make this decision.
 */
function isAdminRoute(): boolean {
  const path = window.location.pathname;
  return ADMIN_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Lazy-load the correct sub-app based on route.
 * Only ONE of these will ever be downloaded by any given user.
 */
const AppAdmin = lazy(() => import("./AppAdmin"));
const AppCustomer = lazy(() => import("./AppCustomer"));

const App: React.FC = () => {
  if (isAdminRoute()) {
    return (
      <Suspense fallback={<LoadingPage />}>
        <AppAdmin />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingPage />}>
      <AppCustomer />
    </Suspense>
  );
};

export default App;
```

### Verification

1. Run `npx tsc --noEmit` — must pass with 0 errors.
2. `App.tsx` must not import any page components, context providers (other than via lazy sub-apps), or `react-router` directly.
3. Run `npm run build`. Verify the build succeeds.
4. Open the built output in `build/static/js/`. You should see separate chunks for admin and customer pages.
5. Open the home page (`/`) in Chrome DevTools → Network → JS tab. Confirm no chunk with "Admin" or "dashboard" in the name loads.
6. Navigate to `/dashboard`. Confirm it loads and the admin chunk now appears in the Network tab.
7. Navigate back to `/`. Confirm customer routes still work.

### Important caveats

- **`/support-chat`** is a customer-facing support chat (not admin), so it is NOT in `ADMIN_PREFIXES`. It is already handled in `AppCustomer.tsx` via Agent 1.
- **`/internal-chat`** IS in admin prefixes — this is the admin internal team chat, not the customer support chat. If this classification is wrong for your app, move it accordingly.
- **Sign-in (`/authentication/sign-in`)** is handled in both sub-apps already, so customers and admins both get it regardless of which sub-app loads. No special handling needed.
- **SPA navigation**: Once inside a sub-app, React Router handles all in-app navigation. The `isAdminRoute()` check only fires on page load/refresh. If an admin user navigates directly to a customer URL by typing it, they'll get the customer app (fine — they're still authed via AuthProvider in AppCustomer).
