# Performance Fix Agent Prompts — ASF-2 (March 2026)

**Usage**: Copy each "AGENT PROMPT" block in full and paste it to a fresh Gemini session.  
**Model**: Gemini 2.5 Pro  
**Related plan**: `docs/PERFORMANCE_FIX_PLAN_2026.md`

Each prompt is self-contained. Run them in order (1 → 6) since later prompts may depend on changes made by earlier ones.

---

---

# AGENT 1 PROMPT — Provider Scoping

---

```
You are a senior TypeScript/React developer working on a React 18 + TypeScript + Supabase app (Create React App).

## TASK OVERVIEW
You need to fix 3 provider scoping issues in App.tsx and RouteContextBundles.tsx.

### ISSUE 1 — UserProvider at App Root (CRITICAL)
`UserProvider` is currently mounted at the global app root. It calls `supabaseAdmin.auth.admin.listUsers()` on every page load including the customer landing page, sign-in page, cart, and checkout. `UserProvider` should only wrap the 2 admin user-management routes: `/users/list` and `/users/settings`.

### ISSUE 2 — DndProvider Wraps All Routes (HIGH)
`DndProvider backend={HTML5Backend}` (from react-dnd) currently wraps every single route including customer-facing pages. Drag-and-drop is only needed in the product/post editor pages. Move it to only wrap the `ProductContextBundle` route group.

### ISSUE 3 — PointsMembershipProvider at App Root (MEDIUM)
`PointsMembershipProvider` is mounted at the global root. It doesn't fetch data on mount but it shouldn't be global. Move it inside `OrderContextBundle` in `RouteContextBundles.tsx` so it only loads when order-related routes are active.

---

## CODING STANDARDS (mandatory)
1. Full complete files only — no placeholders, no `// ... rest of code`.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on exported components/functions.
5. All existing imports must be preserved if still needed; remove unused ones.

---

## FILE 1: src/App.tsx (current content)

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
  LandingContextBundle,
} from "./context/RouteContextBundles";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HomePageElementProvider } from "./context/HomePageElementContext";
import OrderSuccess from "./components/stripe/OrderSuccess";
import OrderCancel from "./components/stripe/OrderCancel";
import { PointsMembershipProvider } from "./context/PointsMembershipContext";
import "./index.css";
import LoadingPage from "./pages/pages/loading";

const DashboardPage = lazy(() => import("./pages"));
const SignInPage = lazy(() => import("./pages/authentication/sign-in"));
const HomePage = lazy(() => import("./pages/landing/home"));
const HighlightsPage = lazy(() => import("./pages/landing/Highlights"));
const PrivacyPage = lazy(() => import("./pages/legal/privacy"));
const NotFoundPage = lazy(() => import("./pages/pages/404"));
const ServerErrorPage = lazy(() => import("./pages/pages/500"));
const MaintenancePage = lazy(() => import("./pages/pages/maintenance"));
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
const UserListPage = lazy(() => import("./pages/users/list"));
const UserSettingsPage = lazy(() => import("./pages/users/settings"));
const ProductStockDetails = lazy(() => import("./pages/products/stock"));
const HomePageBuilder = lazy(() => import("./pages/home-page-builder"));

const CartPage = lazy(() => import("./pages/landing/Cart"));
const CustomerOrderDetailPage = lazy(() => import("./pages/landing/OrderDetail"));
const ProductSection = lazy(() => import("./pages/landing/ProductSection"));
const ProductDetails = lazy(() => import("./pages/landing/ProductDetails"));
const GoalPage = lazy(() => import("./pages/landing/Goal"));
const ProfileSettingsPage = lazy(() => import("./pages/landing/Settings"));
const ChatWindow = lazy(() => import("./pages/landing/Chat"));
const CheckoutPage = lazy(() => import("./pages/landing/Checkout"));
const UserAnalyticsPage = lazy(() => import("./pages/analytics/users"));
const ProductAnalyticsPage = lazy(() => import("./pages/analytics/products"));
const CategoriesAnalyticsPage = lazy(() => import("./pages/analytics/categories"));
const CategoriesInnerAnalyticsPage = lazy(() => import("./pages/analytics/categories-inner"));
const ProductInnerAnalyticsPage = lazy(() => import("./pages/analytics/products-inner"));

const SupportPage = lazy(() => import("./pages/support"));
const GoodStockPage = lazy(() => import("./pages/stocks/good-stocks"));
const InternalChat = lazy(() => import("./pages/internal-chat"));
const SupportAnalyticsPage = lazy(() => import("./pages/analytics/support"));
const NotificationsPage = lazy(() => import("./pages/landing/notifications"));

const OrderListPage = lazy(() => import("./pages/orders/list"));
const PaymentListPage = lazy(() => import("./pages/payments").then(m => ({ default: m.PaymentListPage })));
const PaymentDetailPage = lazy(() => import("./pages/payments").then(m => ({ default: m.PaymentDetailPage })));
const OrderDetailPage = lazy(() => import("./pages/orders/detail"));
const WishlistPage = lazy(() => import("./pages/landing/Wishlist"));

const App: React.FC = () => {
  return (
    <AlertProvider>
      <AuthProvider>
        <PointsMembershipProvider>
          <UserProvider>
            <AlertComponent />
            <BrowserRouter>
              <DndProvider backend={HTML5Backend}>
                <Suspense fallback={<LoadingPage />}>
                  <Routes>
                    <Route element={<FlowbiteWrapper />}>
                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/users/list" element={<UserListPage />} />
                        <Route path="/users/settings" element={<UserSettingsPage />} />
                        <Route element={<PostContextBundle><Outlet /></PostContextBundle>}>
                          <Route path="/posts/list" element={<PostListPage />} />
                          <Route path="/posts/create/:folderId?/:postId?" element={<CreatePostPage />} />
                          <Route path="/posts/schedule/:postId?" element={<SchedulePostListPage />} />
                        </Route>
                        <Route element={<ProductContextBundle><Outlet /></ProductContextBundle>}>
                          <Route path="/products/list" element={<ProductListPage />} />
                          <Route path="/products/deleted" element={<DeletedProductsPage />} />
                          <Route path="/products/create/:folderId?/:productId?" element={<CreateProductPage />} />
                          <Route path="/products/schedule/:productId?" element={<ScheduleProductListPage />} />
                          <Route path="/products/categories" element={<CategoryListPage />} />
                          <Route path="/products/stock/:productId" element={<ProductStockDetails />} />
                          <Route path="/stocks/good" element={<GoodStockPage />} />
                          <Route path="/stocks/overview" element={<StockOverviewPage />} />
                          <Route path="/stocks/all" element={<StockAllProductPage />} />
                          <Route path="/stocks/events" element={<StockAllProductEventPage />} />
                          <Route path="/stocks/reports" element={<StockReportPage />} />
                          <Route path="/stocks/report/create/:productId?/:productEventId?" element={<CreateReportPage />} />
                          <Route path="/stocks/report/:reportId" element={<ViewReportPage />} />
                          <Route path="/stocks/purchase-orders/create/:productId?/:productEventId?" element={<CreatePurchaseOrderPage />} />
                          <Route path="/stocks/purchase-orders/:purchaseOrderId" element={<ViewPurchaseOrderPage />} />
                        </Route>
                        <Route path="/home-page-builder" element={<HomePageElementProvider><HomePageBuilder /></HomePageElementProvider>} />
                        <Route element={<OrderContextBundle><Outlet /></OrderContextBundle>}>
                          <Route path="/orders" element={<OrderListPage />} />
                          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
                          <Route path="/payments" element={<PaymentListPage />} />
                          <Route path="/payments/:paymentId" element={<PaymentDetailPage />} />
                        </Route>
                        <Route element={<CommunityContextBundle><Outlet /></CommunityContextBundle>}>
                          <Route path="/support" element={<SupportPage />} />
                        </Route>
                        <Route element={<AnalyticsContextBundle><Outlet /></AnalyticsContextBundle>}>
                          <Route path="/analytics/users" element={<UserAnalyticsPage />} />
                          <Route path="/analytics/products" element={<ProductAnalyticsPage />} />
                          <Route path="/analytics/products-inner/:productId" element={<ProductInnerAnalyticsPage />} />
                          <Route path="/analytics/categories" element={<CategoriesAnalyticsPage />} />
                          <Route path="/analytics/categories-inner/:categoryId" element={<CategoriesInnerAnalyticsPage />} />
                          <Route path="/analytics/support" element={<SupportAnalyticsPage />} />
                        </Route>
                      </Route>
                      <Route element={<LandingContextBundle><Outlet /></LandingContextBundle>}>
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/order-cancel" element={<OrderCancel />} />
                        <Route path="/order-details/:orderId" element={<CustomerOrderDetailPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route path="/product-section/:categoryId?" element={<ProductSection />} />
                        <Route path="/product-details/:productId?" element={<ProductDetails />} />
                        <Route path="/highlights" element={<HighlightsPage />} />
                        <Route path="/" element={<HomePage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/goal" element={<GoalPage />} />
                        <Route path="/settings" element={<ProfileSettingsPage />} />
                      </Route>
                      <Route element={<CommunityContextBundle><Outlet /></CommunityContextBundle>}>
                        <Route path="/support-chat" element={<ChatWindow />} />
                        <Route path="/internal-chat" element={<InternalChat />} />
                      </Route>
                      <Route path="/pages/maintenance" element={<MaintenancePage />} />
                      <Route path="/authentication/sign-in" element={<SignInPage />} />
                      <Route path="/legal/privacy" element={<PrivacyPage />} />
                      <Route path="/500" element={<ServerErrorPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </DndProvider>
            </BrowserRouter>
          </UserProvider>
        </PointsMembershipProvider>
      </AuthProvider>
    </AlertProvider>
  );
};

export default App;
```

---

## FILE 2: src/context/RouteContextBundles.tsx (current content)

```tsx
import React, { PropsWithChildren } from "react";
import { BrandProvider } from "./product/BrandContext";
import { DepartmentProvider } from "./product/DepartmentContext";
import { RangeProvider } from "./product/RangeContext";
import { CategoryProvider } from "./product/CategoryContext";
import { ProductCategoryProvider } from "./product/ProductCategoryContext";
import { ProductSizeProvider } from "./product/ProductSizeContext";
import { ProductColorProvider } from "./product/ProductColorContext";
import { ProductMediaProvider } from "./product/ProductMediaContext";
import { ProductFolderMediaProvider } from "./product/ProductFolderMediaContext";
import { ProductFolderProvider } from "./product/ProductFolderContext";
import { ProductEventProvider } from "./product/ProductEventContext";
import { ProductStockLogProvider } from "./product/ProductStockLogContext";
import { ProductStockProvider } from "./product/ProductStockContext";
import { ProductProvider } from "./product/ProductContext";
import { ProductPurchaseOrderProvider } from "./product/ProductPurchaseOrderContext";
import { ProductReportProvider } from "./product/ProductReportContext";

import { PostMediaProvider } from "./post/PostMediaContext";
import { PostFolderMediaProvider } from "./post/PostFolderMediaContext";
import { PostFolderProvider } from "./post/PostFolderContext";
import { PostProvider } from "./post/PostContext";

import { AddToCartLogProvider } from "./product/AddToCartLogContext";
import { AddToCartProvider } from "./product/CartContext";
import { OrderProvider } from "./product/OrderContext";
import { PaymentProvider } from "./PaymentContext";
import { WishlistProvider } from "./WishlistContext";

import { CommunityProvider } from "./CommunityContext";
import { GroupProvider } from "./GroupContext";
import { ConversationParticipantProvider } from "./ConversationParticipantContext";
import { TicketProvider } from "./TicketContext";
import { TicketStatusLogProvider } from "./TicketStatusLogContext";
import { ConversationProvider } from "./ConversationContext";

export const ProductContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <BrandProvider>
    <DepartmentProvider>
      <RangeProvider>
        <CategoryProvider>
          <ProductCategoryProvider>
            <ProductSizeProvider>
              <ProductColorProvider>
                <ProductMediaProvider>
                  <ProductFolderMediaProvider>
                    <ProductFolderProvider>
                      <ProductEventProvider>
                        <ProductStockLogProvider>
                          <ProductStockProvider>
                            <ProductProvider>
                              <ProductPurchaseOrderProvider>
                                <ProductReportProvider>
                                  {children}
                                </ProductReportProvider>
                              </ProductPurchaseOrderProvider>
                            </ProductProvider>
                          </ProductStockProvider>
                        </ProductStockLogProvider>
                      </ProductEventProvider>
                    </ProductFolderProvider>
                  </ProductFolderMediaProvider>
                </ProductMediaProvider>
              </ProductColorProvider>
            </ProductSizeProvider>
          </ProductCategoryProvider>
        </CategoryProvider>
      </RangeProvider>
    </DepartmentProvider>
  </BrandProvider>
);

export const PostContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <PostMediaProvider>
    <PostFolderMediaProvider>
      <PostFolderProvider>
        <PostProvider>{children}</PostProvider>
      </PostFolderProvider>
    </PostFolderMediaProvider>
  </PostMediaProvider>
);

export const OrderContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <AddToCartLogProvider>
    <AddToCartProvider>
      <OrderProvider>
        <PaymentProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </PaymentProvider>
      </OrderProvider>
    </AddToCartProvider>
  </AddToCartLogProvider>
);

export const CommunityContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <CommunityProvider>
    <GroupProvider>
      <ConversationParticipantProvider>
        <TicketProvider>
          <TicketStatusLogProvider>
            <ConversationProvider>{children}</ConversationProvider>
          </TicketStatusLogProvider>
        </TicketProvider>
      </ConversationParticipantProvider>
    </GroupProvider>
  </CommunityProvider>
);

export const AnalyticsContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <ProductContextBundle>
    <OrderContextBundle>{children}</OrderContextBundle>
  </ProductContextBundle>
);

export const LandingContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <ProductContextBundle>
    <PostContextBundle>
      <OrderContextBundle>{children}</OrderContextBundle>
    </PostContextBundle>
  </ProductContextBundle>
);
```

---

## EXACT CHANGES REQUIRED

### In `RouteContextBundles.tsx`:
1. Add import for `PointsMembershipProvider` from `"./PointsMembershipContext"`.
2. Wrap `OrderContextBundle`'s top-level with `<PointsMembershipProvider>` — it should be the outermost wrapper inside `OrderContextBundle`.

### In `App.tsx`:
1. Remove `PointsMembershipProvider` import and its JSX wrapper from the root (lines 23 and 89–91).
2. Remove `UserProvider` import and its JSX wrapper from the root. Instead, create a new inline `<Route>` element that wraps ONLY `/users/list` and `/users/settings` with `<UserProvider><Outlet /></UserProvider>`. Place this inside the `<Route element={<ProtectedRoute />}>` block, alongside the other protected routes.
3. Remove the `DndProvider` and `HTML5Backend` imports and their JSX wrappers from the root. Instead, wrap ONLY the `<Route element={<ProductContextBundle><Outlet /></ProductContextBundle>}>` block (the one with all products/stocks routes) with `<DndProvider backend={HTML5Backend}>`.

### Important constraints:
- `DndProvider` must still be INSIDE `<BrowserRouter>` (react-dnd requires it to be within the router tree) — just not wrapping everything.
- Keep `AlertComponent` at the root level (it needs to be outside the router to avoid rendering issues).
- `UserProvider` no longer exists at root — the routes for `/users/list` and `/users/settings` must be the only ones wrapped by it.

Please output the complete, updated contents of BOTH files. Do not truncate or use placeholders.
```

---

---

# AGENT 2 PROMPT — Sidebar Component Anti-Pattern Fix

---

```
You are a senior TypeScript/React developer working on a React 18 + TypeScript + Supabase app (Create React App).

## TASK OVERVIEW
Fix a critical React performance anti-pattern in `src/components/sidebar.tsx`.

### THE PROBLEM
Three React components (`FloatingMenuButton`, `SidebarContent`, `MobileUserSection`) are currently defined as function components INSIDE the parent `ExampleSidebar` component body. This is a well-known React anti-pattern:

- React identifies component types by reference identity.
- When a component is defined inside another component, a new function reference is created on every parent render.
- React sees the new reference as a **different component type** and **unmounts the old tree and mounts a fresh one** instead of reconciling.
- The sidebar renders on every admin page and re-renders whenever `isSidebarOpenOnSmallScreens` or `isMobile` changes — so these three components currently undergo a full unmount/remount cycle on every such change.

### THE FIX
Move `FloatingMenuButton`, `SidebarContent`, and `MobileUserSection` to **module-level scope** (outside `ExampleSidebar`). They will need their dependencies passed as props instead of closing over variables from the parent scope.

---

## CODING STANDARDS (mandatory)
1. Full complete file only — no placeholders, no `// ... rest of code`.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on all exported and module-level components.
5. Keep all existing functionality intact — nothing should be removed from the UI.

---

## CURRENT FILE: src/components/sidebar.tsx

```tsx
/* eslint-disable jsx-a11y/anchor-is-valid */
import classNames from "classnames";
import { Sidebar, Avatar } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { FaBox, FaUsers } from "react-icons/fa";
import { useSidebarContext } from "../context/SidebarContext";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BsFillFilePostFill } from "react-icons/bs";
import { GoHomeFill } from "react-icons/go";
import { FaBoxes, FaClipboardList } from "react-icons/fa";
import { GrAnalytics } from "react-icons/gr";
import { MdOutlineSupportAgent } from "react-icons/md";
import { DarkThemeToggle } from "flowbite-react";
import { FiMessageCircle } from "react-icons/fi";
import { HiX, HiMenu } from "react-icons/hi";
import { MdPayment } from "react-icons/md";

const ExampleSidebar: React.FC = function () {
  const { isOpenOnSmallScreens: isSidebarOpenOnSmallScreens, setOpenOnSmallScreens } =
    useSidebarContext();
  const [currentPage, setCurrentPage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const newPage = window.location.pathname;
    setCurrentPage(newPage);
  }, [setCurrentPage]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleMobileItemClick = () => {
    if (isMobile) {
      setOpenOnSmallScreens(false);
    }
  };

  const FloatingMenuButton: React.FC = () => (
    <button
      type="button"
      onClick={() => setOpenOnSmallScreens(true)}
      className="fixed bottom-6 right-6 z-30 p-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-110 lg:hidden"
      aria-label="Open navigation menu"
    >
      <HiMenu className="w-6 h-6" />
    </button>
  );

  const SidebarContent: React.FC<{ onItemClick?: () => void }> = ({ onItemClick }) => (
    <>
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item href="/dashboard" icon={GoHomeFill} onClick={onItemClick} className={"/dashboard" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>Dashboard</Sidebar.Item>
          <Sidebar.Item href="/users/list" icon={FaUsers} onClick={onItemClick} className={"/users/list" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>Users</Sidebar.Item>
          <Sidebar.Item icon={BsFillFilePostFill} href="/posts/list" onClick={onItemClick} className={"/posts/list" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>All Posts</Sidebar.Item>
          <Sidebar.Item icon={FaBox} href="/products/list" onClick={onItemClick} className={"/products/list" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>Products</Sidebar.Item>
          <Sidebar.Item icon={FaBoxes} href="/stocks/overview" onClick={onItemClick} className={"/stocks/overview" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>Stocks</Sidebar.Item>
          <Sidebar.Item icon={FaClipboardList} href="/orders" onClick={onItemClick} className={"/orders" === currentPage || currentPage.startsWith("/orders/") ? "bg-gray-100 dark:bg-gray-700" : ""}>Orders</Sidebar.Item>
          <Sidebar.Item icon={MdPayment} href="/payments" onClick={onItemClick} className={"/payments" === currentPage || currentPage.startsWith("/payments/") ? "bg-gray-100 dark:bg-gray-700" : ""}>Payments</Sidebar.Item>
          <Sidebar.Item icon={MdOutlineSupportAgent} href="/support" onClick={onItemClick} className={"/support" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>Support</Sidebar.Item>
          <Sidebar.Item icon={FiMessageCircle} href="/internal-chat" onClick={onItemClick} className={"/internal-chat" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>Internal Chat</Sidebar.Item>
          <Sidebar.Item icon={GrAnalytics} href="/analytics/users" onClick={onItemClick} className={"/analytics/users" === currentPage ? "bg-gray-100 dark:bg-gray-700" : ""}>Analytics</Sidebar.Item>
          <DarkThemeToggle />
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </>
  );

  const MobileUserSection: React.FC = () => {
    const { signOut, user } = useAuthContext();
    const navigate = useNavigate();
    const email = user?.email ?? "";
    const username = email.includes("@") ? email.split("@")[0] : (email || "Account");

    const handleNavigation = (path: string) => {
      navigate(path);
      setOpenOnSmallScreens(false);
    };

    return (
      <div className="border-t dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar alt="" img="../images/users/neil-sims.png" rounded size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{username}</p>
            <p className="text-sm text-gray-500 truncate dark:text-gray-400">{email || "Not signed in"}</p>
          </div>
        </div>
        <div className="space-y-1">
          <button onClick={() => handleNavigation("/users/settings")} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-600">Settings</button>
          <button onClick={() => { void signOut(); setOpenOnSmallScreens(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-600">Sign out</button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        {!isSidebarOpenOnSmallScreens && <FloatingMenuButton />}
        {isSidebarOpenOnSmallScreens && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setOpenOnSmallScreens(false)} aria-hidden="true" />
        )}
        <div className={classNames("fixed top-0 left-0 z-50 h-full w-72 transform bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:hidden flex flex-col", { "translate-x-0": isSidebarOpenOnSmallScreens, "-translate-x-full": !isSidebarOpenOnSmallScreens })}>
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
            <button type="button" className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg dark:hover:bg-gray-700 dark:hover:text-white" onClick={() => setOpenOnSmallScreens(false)}>
              <HiX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar aria-label="Mobile sidebar" className="pt-0 border-none">
              <SidebarContent onItemClick={handleMobileItemClick} />
            </Sidebar>
          </div>
          <MobileUserSection />
        </div>
      </>
    );
  }

  return (
    <div className={classNames("lg:!block", { hidden: !isSidebarOpenOnSmallScreens })}>
      <Sidebar aria-label="Sidebar with multi-level dropdown example" collapsed={true} className="pt-0">
        <SidebarContent />
      </Sidebar>
    </div>
  );
};

export default ExampleSidebar;
```

---

## EXACT CHANGES REQUIRED

1. Move `FloatingMenuButton` to module scope. It needs `onOpen: () => void` as a prop (replacing the closure over `setOpenOnSmallScreens`).

2. Move `SidebarContent` to module scope. It needs:
   - `onItemClick?: () => void` (already a prop — keep it)
   - `currentPage: string` (replacing the closure over `currentPage` from parent state)

3. Move `MobileUserSection` to module scope. It needs:
   - `onClose: () => void` (replacing the closure over `setOpenOnSmallScreens`)
   It still uses `useAuthContext` and `useNavigate` internally (hooks work fine in module-level components).

4. `ExampleSidebar` now passes props down to the three module-level components instead of relying on closures.

5. Keep the `handleMobileItemClick` logic in `ExampleSidebar` (it references `isMobile` and `setOpenOnSmallScreens` from parent state) — pass it as `onItemClick` to `SidebarContent`.

Please output the complete, updated contents of `src/components/sidebar.tsx`. Do not truncate or use placeholders.
```

---

---

# AGENT 3 PROMPT — ConversationContext Stability Fix + StrictMode

---

```
You are a senior TypeScript/React developer working on a React 18 + TypeScript + Supabase app (Create React App).

## TASK OVERVIEW
Fix 2 issues:

### ISSUE 1 — `listMessagesByConversationId` Recreates on Every Chat Message (HIGH)

In `ConversationContext.tsx`, `listMessagesByConversationId` is a `useCallback` that includes `conversations` in its dependency array. Every time a chat message arrives via Supabase realtime, `conversations` state updates, which:
1. Creates a new `listMessagesByConversationId` function reference
2. Invalidates the `useMemo` context value
3. Causes ALL components consuming `ConversationContext` to re-render

**Fix**: Apply the `ref` pattern (already used elsewhere in this codebase as `showAlertRef`). Store `conversations` in a `conversationsRef` and access it inside the callback instead of listing it as a dependency. This makes `listMessagesByConversationId` stable (created once) without losing access to the latest state.

### ISSUE 2 — No React.StrictMode (MEDIUM)

`src/index.tsx` renders `<App />` without wrapping in `<React.StrictMode>`. StrictMode's double-invocation of effects in development is the primary tool for catching stale closures, missing cleanup, and accidental side effects.

---

## CODING STANDARDS (mandatory)
1. Full complete files only — no placeholders, no `// ... rest of code`.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on all exported components/hooks/functions.
5. All async functions must have `try/catch` with proper error handling.

---

## FILE 1: src/index.tsx (current content)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <App />
);

reportWebVitals();
```

---

## FILE 2: src/context/ConversationContext.tsx (key sections — full file follows)

The file is ~586 lines. The key area to change is the `listMessagesByConversationId` `useCallback` (around lines 445–478) and the `useMemo` value (lines 540–570).

The pattern to apply for `conversationsRef` is already used in this codebase for `showAlertRef`:
```tsx
// Existing pattern (showAlertRef) — apply the same for conversations:
const showAlertRef = useRef<typeof showAlert | null>(null);
useEffect(() => {
  showAlertRef.current = showAlert;
}, [showAlert]);
```

Apply the same pattern: create a `conversationsRef`, sync it in a `useEffect`, and use `conversationsRef.current` inside `listMessagesByConversationId` instead of `conversations`.

Here is the full current content of `src/context/ConversationContext.tsx`:

```tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type ConversationRow = Tables<"conversations">;
export type ConversationInsert = TablesInsert<"conversations">;
export type ConversationUpdate = TablesUpdate<"conversations">;

export type ChatMessageRow = Tables<"chat_messages">;
export type ChatMessageInsert = TablesInsert<"chat_messages">;
export type ChatMessageUpdate = TablesUpdate<"chat_messages">;

export type ConversationParticipantRow = Tables<"conversation_participants">;
export type ConversationParticipantInsert = TablesInsert<"conversation_participants">;
export type ConversationParticipantUpdate = TablesUpdate<"conversation_participants">;

export type Conversation = ConversationRow & {
  messages: ChatMessageRow[];
  participants: ConversationParticipantRow[];
};

type ConversationJoinedRow = ConversationRow & {
  chat_messages?: ChatMessageRow[] | null;
  conversation_participants: ConversationParticipantRow[] | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

interface ConversationContextProps {
  conversations: Conversation[];
  loading: boolean;
  createConversation: (payload: ConversationInsert) => Promise<Conversation | undefined>;
  updateConversation: (payload: ConversationUpdate) => Promise<Conversation | undefined>;
  deleteConversation: (conversationId: string) => Promise<void>;
  createMessage: (payload: ChatMessageInsert) => Promise<ChatMessageRow | undefined>;
  updateMessage: (id: string, payload: ChatMessageUpdate) => Promise<ChatMessageRow | undefined>;
  deleteMessage: (messageId: string) => Promise<void>;
  listMessagesByConversationId: (conversationId: string) => Promise<ChatMessageRow[]>;
  addParticipant: (payload: ConversationParticipantInsert) => Promise<ConversationParticipantRow | undefined>;
  updateParticipant: (id: string, payload: ConversationParticipantUpdate) => Promise<ConversationParticipantRow | undefined>;
  removeParticipant: (participantId: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextProps | null>(null);

export function ConversationProvider({ children }: PropsWithChildren) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  const showAlertRef = useRef<typeof showAlert | null>(null);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const fetchConversations = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, conversation_participants(*)");
      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }
      const rows = (data as ConversationJoinedRow[] | null) ?? [];
      const mapped: Conversation[] = rows.map((row) => ({
        id: row.id,
        created_at: row.created_at,
        active: row.active ?? null,
        group_id: row.group_id ?? null,
        ticket_id: row.ticket_id ?? null,
        type: row.type ?? null,
        messages: [],
        participants: Array.isArray(row.conversation_participants)
          ? row.conversation_participants
          : [],
      }));
      setConversations(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConversationChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ConversationRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        setConversations((prev) => [...prev, { ...inserted, messages: [], participants: [] }]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        setConversations((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setConversations((prev) => prev.filter((c) => c.id !== removed.id));
      }
    },
    []
  );

  const handleMessageChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== inserted.conversation_id) return c;
            const alreadyExists = c.messages.some((m) => m.id === inserted.id);
            if (alreadyExists) return c;
            return { ...c, messages: [...c.messages, inserted] };
          })
        );
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === updated.conversation_id
              ? { ...c, messages: c.messages.map((m) => (m.id === updated.id ? updated : m)) }
              : c
          )
        );
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === removed.conversation_id
              ? { ...c, messages: c.messages.filter((m) => m.id !== removed.id) }
              : c
          )
        );
      }
    },
    []
  );

  const handleParticipantChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<ConversationParticipantRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === inserted.conversation_id
              ? { ...c, participants: [...c.participants, inserted] }
              : c
          )
        );
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === updated.conversation_id
              ? { ...c, participants: c.participants.map((p) => (p.id === updated.id ? updated : p)) }
              : c
          )
        );
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === removed.conversation_id
              ? { ...c, participants: c.participants.filter((p) => p.id !== removed.id) }
              : c
          )
        );
      }
    },
    []
  );

  useEffect(() => {
    void fetchConversations();

    const conversationSubscription = supabase
      .channel("conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" },
        (payload: RealtimePostgresChangesPayload<ConversationRow>) => { handleConversationChanges(payload); })
      .subscribe();

    const messageSubscription = supabase
      .channel("chat_messages-room")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => { handleMessageChanges(payload); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => { handleMessageChanges(payload); })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => { handleMessageChanges(payload); })
      .subscribe();

    const participantSubscription = supabase
      .channel("conversation_participants")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_participants" },
        (payload: RealtimePostgresChangesPayload<ConversationParticipantRow>) => { handleParticipantChanges(payload); })
      .subscribe();

    return () => {
      conversationSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      participantSubscription.unsubscribe();
    };
  }, [fetchConversations, handleConversationChanges, handleMessageChanges, handleParticipantChanges]);

  const createConversation = useCallback(async (payload: ConversationInsert): Promise<Conversation | undefined> => {
    const { data, error } = await supabase.from("conversations").insert(payload).select("*").single();
    if (error) { showAlertRef.current?.(error.message, "error"); return undefined; }
    const row = data as ConversationRow;
    return { ...row, messages: [], participants: [] };
  }, []);

  const updateConversation = useCallback(async (payload: ConversationUpdate): Promise<Conversation | undefined> => {
    if (!isNonEmptyString(payload.id)) { showAlertRef.current?.("Missing conversation id for update.", "error"); return undefined; }
    const { data, error } = await supabase.from("conversations").update(payload).eq("id", payload.id).select("*").single();
    if (error) { showAlertRef.current?.(error.message, "error"); return undefined; }
    const row = data as ConversationRow;
    return { ...row, messages: [], participants: [] };
  }, []);

  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    if (!isNonEmptyString(conversationId)) { showAlertRef.current?.("Invalid conversation id.", "error"); return; }
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error) { showAlertRef.current?.(error.message, "error"); }
  }, []);

  const createMessage = useCallback(async (payload: ChatMessageInsert): Promise<ChatMessageRow | undefined> => {
    const { data, error } = await supabase.from("chat_messages").insert(payload).select("*").single();
    if (error) { showAlertRef.current?.(error.message, "error"); return undefined; }
    const created = data as ChatMessageRow;
    if (created.conversation_id) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== created.conversation_id) return c;
          const exists = c.messages.some((m) => m.id === created.id);
          if (exists) return c;
          return { ...c, messages: [...c.messages, created] };
        })
      );
    }
    return created;
  }, []);

  const updateMessage = useCallback(async (id: string, payload: ChatMessageUpdate): Promise<ChatMessageRow | undefined> => {
    if (!isNonEmptyString(id)) { showAlertRef.current?.("Invalid message id.", "error"); return undefined; }
    const { data, error } = await supabase.from("chat_messages").update(payload).eq("id", id).select("*").single();
    if (error) { showAlertRef.current?.(error.message, "error"); return undefined; }
    return data as ChatMessageRow;
  }, []);

  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    if (!isNonEmptyString(messageId)) { showAlertRef.current?.("Invalid message id.", "error"); return; }
    const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
    if (error) { showAlertRef.current?.(error.message, "error"); }
  }, []);

  // ← THIS IS THE PROBLEM FUNCTION — conversations in deps
  const listMessagesByConversationId = useCallback(async (
    conversationId: string
  ): Promise<ChatMessageRow[]> => {
    if (!isNonEmptyString(conversationId)) { return []; }
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv && conv.messages.length > 0) { return conv.messages; }
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) { showAlertRef.current?.(error.message, "error"); return []; }
    const fetchedMessages = (data ?? []) as ChatMessageRow[];
    setConversations((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, messages: fetchedMessages } : c)
    );
    return fetchedMessages;
  }, [conversations]); // ← BAD: recreated on every message

  const addParticipant = useCallback(async (payload: ConversationParticipantInsert): Promise<ConversationParticipantRow | undefined> => {
    const { data, error } = await supabase.from("conversation_participants").insert(payload).select("*").single();
    if (error) { showAlertRef.current?.(error.message, "error"); return undefined; }
    return data as ConversationParticipantRow;
  }, []);

  const updateParticipant = useCallback(async (id: string, payload: ConversationParticipantUpdate): Promise<ConversationParticipantRow | undefined> => {
    if (!isNonEmptyString(id)) { showAlertRef.current?.("Invalid participant id.", "error"); return undefined; }
    const { data, error } = await supabase.from("conversation_participants").update(payload).eq("id", id).select("*").single();
    if (error) { showAlertRef.current?.(error.message, "error"); return undefined; }
    return data as ConversationParticipantRow;
  }, []);

  const removeParticipant = useCallback(async (participantId: string): Promise<void> => {
    if (!isNonEmptyString(participantId)) { showAlertRef.current?.("Invalid participant id.", "error"); return; }
    const { error } = await supabase.from("conversation_participants").delete().eq("id", participantId);
    if (error) { showAlertRef.current?.(error.message, "error"); }
  }, []);

  const value = useMemo<ConversationContextProps>(
    () => ({
      conversations, loading, createConversation, updateConversation, deleteConversation,
      createMessage, updateMessage, deleteMessage, listMessagesByConversationId,
      addParticipant, updateParticipant, removeParticipant,
    }),
    [conversations, loading, createConversation, updateConversation, deleteConversation,
      createMessage, updateMessage, deleteMessage, listMessagesByConversationId,
      addParticipant, updateParticipant, removeParticipant]
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export function useConversationContext(): ConversationContextProps {
  const context = useContext(ConversationContext);
  if (context === null) {
    throw new Error("useConversationContext must be used within a ConversationProvider");
  }
  return context;
}
```

---

## EXACT CHANGES REQUIRED

### In `src/index.tsx`:
Wrap `<App />` with `<React.StrictMode>`.

### In `src/context/ConversationContext.tsx`:
1. Add a `conversationsRef` using `useRef<Conversation[]>([])`.
2. Add a `useEffect` that keeps `conversationsRef.current` in sync with the `conversations` state (same pattern as `showAlertRef`).
3. In `listMessagesByConversationId`, replace `conversations.find(...)` and `conversations` references with `conversationsRef.current.find(...)` and `conversationsRef.current`.
4. Remove `conversations` from the `useCallback` dependency array of `listMessagesByConversationId` (it should now be `[]` or have no state deps).
5. Since `listMessagesByConversationId` is now stable (no changing deps), it no longer needs to be in the `useMemo` dependency array — but keep it there for correctness since it IS part of the context value. The key win is that its reference no longer changes on every message.

Please output the complete, updated contents of BOTH files.
```

---

---

# AGENT 4 PROMPT — PaymentContext User Enrichment Fix

---

```
You are a senior TypeScript/React developer working on a React 18 + TypeScript + Supabase app (Create React App).

## TASK OVERVIEW
Fix the N admin API calls in `PaymentContext.tsx`.

### THE PROBLEM
`fetchPayments` currently calls `supabaseAdmin.auth.admin.getUserById(id)` for each unique user ID found in the payments data:

```tsx
const details = await Promise.all(
  userIds.map(async (id) => {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    // ...
  })
);
```

With 10 unique user IDs this fires 10 separate admin API calls. These are:
1. Admin API calls (expensive, rate-limited)
2. Called every time payments are fetched (on mount + on every realtime INSERT)

### THE FIX
Replace all admin auth API calls for user enrichment with a single Supabase DB query against the `user_details` table. The `user_details` table has `id` (matches the user's auth id), `email`, and potentially a display name field. Use `.in("id", userIds)` to fetch all needed records in one query.

### Important note on user_details schema
The `user_details` table has these relevant columns (based on database.types.ts patterns in this project):
- `id` (uuid, primary key — same as auth user id)
- `email` (text, nullable) — if this column exists in user_details, use it
- If `email` is NOT in `user_details`, fall back to deriving the name from the order's user_id only (show a truncated UUID or "User" as the display name), and remove the admin API dependency entirely.

In either case: **remove `supabaseAdmin` usage from `fetchPayments` completely**. The `supabaseAdmin` import can remain for other potential uses but `fetchPayments` must not use it.

---

## CODING STANDARDS (mandatory)
1. Full complete file only — no placeholders, no `// ... rest of code`.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on all exported functions.
5. All async operations must have proper `try/catch` error handling.

---

## CURRENT FILE: src/context/PaymentContext.tsx

```tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase, supabaseAdmin } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
export type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];
export type PaymentEventRow = Database["public"]["Tables"]["payment_events"]["Row"];

export interface PaymentWithDetails extends PaymentRow {
  user_name?: string;
  user_email?: string;
  order_items_count?: number;
  payment_events?: PaymentEventRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getOrderUserId(payment: unknown): string | null {
  if (!isRecord(payment)) return null;
  const orderValue = payment["order"];
  if (!isRecord(orderValue)) return null;
  const userId = orderValue["user_id"];
  return typeof userId === "string" ? userId : null;
}

function getOrderItemsAmountSum(payment: unknown): number {
  if (!isRecord(payment)) return 0;
  const orderValue = payment["order"];
  if (!isRecord(orderValue)) return 0;
  const itemsValue = orderValue["order_items"];
  if (!Array.isArray(itemsValue)) return 0;
  return itemsValue.reduce((sum: number, item: unknown) => {
    if (!isRecord(item)) return sum;
    const amount = item["amount"];
    return typeof amount === "number" && Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

function getPaymentEvents(payment: unknown): PaymentEventRow[] {
  if (!isRecord(payment)) return [];
  const eventsValue = payment["payment_events"];
  if (!Array.isArray(eventsValue)) return [];
  return eventsValue as PaymentEventRow[];
}

interface PaymentContextProps {
  payments: PaymentWithDetails[];
  loading: boolean;
  refreshPayments: () => Promise<void>;
  updatePaymentStatus: (paymentId: string, newStatus: Database["public"]["Enums"]["payment_status"]) => Promise<boolean>;
  updateRefundStatus: (paymentId: string, newRefundStatus: Database["public"]["Enums"]["refund_status"], refundedAmount: number) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextProps | undefined>(undefined);

export const PaymentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlertContext();

  const showAlertRef = useRef<typeof showAlert | null>(null);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const fetchPayments = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          *,
          payment_events(*),
          order:orders(
            id,
            user_id,
            order_items(
              id,
              amount
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (paymentsError) { throw paymentsError; }

      const rawPayments: unknown[] = Array.isArray(paymentsData) ? (paymentsData as unknown[]) : [];

      const userIds = Array.from(
        new Set(rawPayments.map(getOrderUserId).filter((v): v is string => typeof v === "string"))
      );

      // ← THIS IS THE PROBLEM: N separate admin API calls
      let usersData: { id: string; email?: string }[] = [];
      if (userIds.length > 0) {
        const details = await Promise.all(
          userIds.map(async (id) => {
            const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
            if (error) {
              console.error(`Error fetching user details for ID ${id}:`, error);
              return null;
            }
            return data.user;
          })
        );
        usersData = details
          .filter((d): d is NonNullable<typeof d> => d !== null)
          .map((d) => ({
            id: d.id,
            email: typeof d.email === "string" ? d.email : undefined,
          }));
      }

      const enrichedPayments: PaymentWithDetails[] = rawPayments
        .map((payment): PaymentWithDetails | null => {
          if (!isRecord(payment) || typeof payment["id"] !== "string") { return null; }
          const userId = getOrderUserId(payment);
          const orderItemsCount = getOrderItemsAmountSum(payment);
          const user = typeof userId === "string" ? usersData.find((u) => u.id === userId) : undefined;
          const email = typeof user?.email === "string" ? user.email : "";
          const userName = email.includes("@") ? email.split("@")[0] : "Unknown User";
          return {
            ...(payment as PaymentRow),
            user_name: userName,
            user_email: email,
            order_items_count: orderItemsCount,
            payment_events: getPaymentEvents(payment),
          };
        })
        .filter((p): p is PaymentWithDetails => p !== null);

      setPayments(enrichedPayments);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showAlertRef.current?.(message, "error");
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPayments = useCallback(async (): Promise<void> => {
    await fetchPayments();
  }, [fetchPayments]);

  const updatePaymentStatus = useCallback(async (
    paymentId: string,
    newStatus: Database["public"]["Enums"]["payment_status"]
  ): Promise<boolean> => {
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase.from("payments").update({ status: newStatus, updated_at: updatedAt }).eq("id", paymentId);
      if (error) { throw error; }
      setPayments((prev) => prev.map((payment) =>
        payment.id === paymentId ? { ...payment, status: newStatus, updated_at: updatedAt } : payment
      ));
      showAlertRef.current?.("Payment status updated successfully", "success");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update payment status";
      showAlertRef.current?.(message, "error");
      return false;
    }
  }, []);

  const updateRefundStatus = useCallback(async (
    paymentId: string,
    newRefundStatus: Database["public"]["Enums"]["refund_status"],
    refundedAmount: number
  ): Promise<boolean> => {
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase.from("payments").update({ refund_status: newRefundStatus, refunded_amount: refundedAmount, updated_at: updatedAt }).eq("id", paymentId);
      if (error) { throw error; }
      setPayments((prev) => prev.map((payment) =>
        payment.id === paymentId
          ? { ...payment, refund_status: newRefundStatus, refunded_amount: refundedAmount, updated_at: updatedAt }
          : payment
      ));
      showAlertRef.current?.("Refund status updated successfully", "success");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update refund status";
      showAlertRef.current?.(message, "error");
      return false;
    }
  }, []);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  const handlePaymentChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<PaymentRow>): void => {
      if (payload.eventType === "INSERT") {
        void refreshPayments();
      } else if (payload.eventType === "UPDATE") {
        const updatedPayment = payload.new as PaymentRow;
        setPayments((prev) => prev.map((payment) =>
          payment.id === updatedPayment.id ? { ...payment, ...updatedPayment } : payment
        ));
      } else if (payload.eventType === "DELETE") {
        const deletedPayment = payload.old as PaymentRow;
        setPayments((prev) => prev.filter((payment) => payment.id !== deletedPayment.id));
      }
    },
    [refreshPayments]
  );

  useEffect(() => {
    const subscription = supabase
      .channel("payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, handlePaymentChanges)
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [handlePaymentChanges]);

  const value = useMemo<PaymentContextProps>(
    () => ({ payments, loading, refreshPayments, updatePaymentStatus, updateRefundStatus }),
    [payments, loading, refreshPayments, updatePaymentStatus, updateRefundStatus]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export const usePaymentContext = (): PaymentContextProps => {
  const ctx = useContext(PaymentContext);
  if (!ctx) { throw new Error("usePaymentContext must be used within a PaymentProvider"); }
  return ctx;
};
```

---

## EXACT CHANGES REQUIRED

In `fetchPayments`, replace the admin API block with a single `user_details` table query:

```tsx
// REPLACE THIS (N admin API calls):
const details = await Promise.all(
  userIds.map(async (id) => {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    ...
  })
);

// WITH THIS (1 DB query):
type UserDetailRow = { id: string; email: string | null };
const { data: userDetailRows, error: userDetailError } = await supabase
  .from("user_details")
  .select("id, email")
  .in("id", userIds);

if (userDetailError) {
  // Non-fatal: log the error but continue with enrichment showing "Unknown User"
  if (process.env.NODE_ENV === "development") {
    console.error("Error fetching user details for payments:", userDetailError);
  }
}

usersData = (userDetailRows ?? []).map((d: UserDetailRow) => ({
  id: d.id,
  email: typeof d.email === "string" ? d.email : undefined,
}));
```

Also:
- Remove the `supabaseAdmin` import if it is no longer used anywhere in the file after this change.
- Replace `console.error` calls with the dev-only guard: `if (process.env.NODE_ENV === "development") { console.error(...); }`
- Keep all other functionality (realtime, updatePaymentStatus, updateRefundStatus) exactly as-is.

Please output the complete, updated contents of `src/context/PaymentContext.tsx`.
```

---

---

# AGENT 5 PROMPT — Code Quality & Small Fixes

---

```
You are a senior TypeScript/React developer working on a React 18 + TypeScript + Supabase app (Create React App).

## TASK OVERVIEW
Fix 4 small but impactful issues across 3 files.

### ISSUE 1 — `new URLSearchParams()` on Every Render in ProductSection (MEDIUM)
In `src/pages/landing/ProductSection.tsx`, `new URLSearchParams(location.search)` is called inline (not in a `useMemo`) so it creates a new object on every render.

**Fix**: Wrap with `useMemo(() => new URLSearchParams(location.search), [location.search])`.

### ISSUE 2 — `via.placeholder.com` External Requests on Home Page (MEDIUM)
In `src/pages/landing/home.tsx`, missing product/category images fall back to:
```tsx
`https://via.placeholder.com/300x200?text=${encodeURIComponent(text)}`
```
This fires an external HTTP request to a third-party service for every item without a local image. Replace with a locally-rendered SVG data URI that shows the text — no external requests.

### ISSUE 3 — `console.log` in Production Hot Paths (MEDIUM)
Remove ALL `console.log` calls from `src/pages/landing/home.tsx` and `src/pages/landing/ProductSection.tsx` (if any exist). For `console.error` calls, wrap them in a dev-only guard.

### ISSUE 4 — `SidebarContext` Reads `window.location.pathname` Instead of React Router (MEDIUM)
In `src/context/SidebarContext.tsx`, the location is read from `window.location.pathname` at module scope as a plain variable. This won't update on React Router navigation (SPA pushState).

However, `SidebarContext` is a standalone context that doesn't have access to the router. The correct fix is in `src/components/sidebar.tsx`: the `currentPage` state is initialised via a `useEffect(() => { setCurrentPage(window.location.pathname); }, [])` which also only runs once (missing navigation updates).

**Fix in sidebar.tsx**: Replace the `useEffect` that sets `currentPage` from `window.location.pathname` with `useLocation()` from `react-router-dom`. The `currentPage` state variable becomes unnecessary — use the `location.pathname` value directly.

---

## CODING STANDARDS (mandatory)
1. Full complete files only — no placeholders, no `// ... rest of code`.
2. TypeScript strict — no `any`, no `!` non-null assertion, no `as unknown as T`.
3. Double quotes `"` for all strings. Template literals for concatenation.
4. JSDoc comments on exported components/functions.

---

## FILE 1: src/pages/landing/ProductSection.tsx

Read the current content of this file from the codebase and apply the following changes:
- Wrap `new URLSearchParams(location.search)` in `useMemo`.
- Add `useMemo` to the imports from `"react"` if not already there.
- Remove any `console.log` calls; guard `console.error` with `process.env.NODE_ENV === "development"`.

---

## FILE 2: src/pages/landing/home.tsx

Read the current content of this file from the codebase and apply the following changes:

Replace the `makePlaceholderImageUrl` function:

```tsx
// REMOVE THIS:
const makePlaceholderImageUrl = (text: string): string => {
  return `https://via.placeholder.com/300x200?text=${encodeURIComponent(text)}`;
};

// REPLACE WITH THIS:
/**
 * Generates a local SVG data-URI placeholder image with centred text.
 * No external HTTP requests are made — the SVG is embedded directly as a data URI.
 *
 * @param text - Label text to display on the placeholder.
 * @returns A data: URI string safe for use in an <img src> attribute.
 */
const makePlaceholderImageUrl = (text: string): string => {
  const safeText = text.replace(/[<>&"]/g, (ch) => {
    const escapes: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" };
    return escapes[ch] ?? ch;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#e5e7eb"/><text x="150" y="105" font-family="sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
```

Also remove any `console.log` calls; guard `console.error` with `process.env.NODE_ENV === "development"`.

---

## FILE 3: src/components/sidebar.tsx

**Note**: If Agent 2 has already been run and moved `SidebarContent`/`FloatingMenuButton`/`MobileUserSection` to module scope, apply Issue 4 fix to the updated file. If Agent 2 has NOT been run yet, apply both Agent 2's changes AND Issue 4's fix together.

For Issue 4:
- Import `useLocation` from `"react-router-dom"` (add to existing react-router-dom import or add new import).
- In `ExampleSidebar`, replace:
  ```tsx
  const [currentPage, setCurrentPage] = useState("");
  useEffect(() => {
    const newPage = window.location.pathname;
    setCurrentPage(newPage);
  }, [setCurrentPage]);
  ```
  With:
  ```tsx
  const location = useLocation();
  const currentPage = location.pathname;
  ```
- Remove the `useState` for `currentPage` and its associated `useEffect`.
- `setCurrentPage` was only used in that `useEffect`, so no other changes needed.
- If `SidebarContent` was moved to module scope (Agent 2), it already receives `currentPage` as a prop — just ensure `ExampleSidebar` now passes `location.pathname` instead of the state variable.

Please output the complete, updated contents of ALL THREE FILES.
```

---

---

# AGENT 6 PROMPT — ProductContext Single Fetch (DB + Code)

---

```
You are a senior TypeScript/React developer and SQL developer working on a React 18 + TypeScript + Supabase (PostgreSQL) app (Create React App).

## TASK OVERVIEW
Eliminate the double fetch in `ProductContext.tsx` by updating the Supabase RPC function to return all needed columns, then removing the second sequential query from the TypeScript code.

### THE PROBLEM
Every call to `fetchProducts` makes TWO sequential Supabase queries:

1. `supabase.rpc("fetch_products_with_computed_attributes")` — returns products with computed fields (stock_status, stock_count, medias, etc.) but is MISSING several base columns
2. `supabase.from("products").select("*").in("id", ids)` — fetches the same products AGAIN just to get the missing base columns: `brand_id`, `category_id`, `department_id`, `range_id`, `warranty_description`, `warranty_period`, `deleted_at`

This means every product page load pays 2× the network latency.

### THE FIX
Two parts:

**Part A (SQL)**: Update the `fetch_products_with_computed_attributes` PostgreSQL function to add the 7 missing columns to its SELECT/RETURN. Return as a Supabase SQL migration file.

**Part B (TypeScript)**: Update `ProductContext.tsx` to:
- Remove the entire second query block (the `.from("products").select("*").in("id", ids)` part)
- Build the mapped products directly from the RPC result without needing `rowsById`
- Simplify the soft-delete filter (use `deleted_at` returned directly from the RPC instead of filtering on the base rows)

---

## CODING STANDARDS (mandatory)
1. Full complete files — no placeholders.
2. TypeScript strict — no `any`, no `!`, no `as unknown as T`.
3. Double quotes for strings; template literals for concatenation.
4. JSDoc comments on all exported functions.
5. The SQL function must use `SECURITY DEFINER` (to match Supabase RPC conventions for public functions that read from multiple tables).

---

## CONTEXT: What the RPC Currently Returns

The existing RPC `fetch_products_with_computed_attributes` returns product rows with these extra computed columns:
- `stock_status` (text)
- `stock_count` (integer)
- It also returns the standard `products` table columns BUT is MISSING: `brand_id`, `category_id`, `department_id`, `range_id`, `warranty_description`, `warranty_period`, `deleted_at`

## CONTEXT: The `products` table columns (from database.types.ts)

The full `products` table Row type is:
```ts
{
  id: string
  name: string
  price: number
  description: string | null
  article_number: string | null
  festival: string | null
  season: string | null
  status: string
  stock_code: string | null
  stock_place: string | null
  created_at: string
  updated_at: string
  time_post: string | null
  product_folder_id: string | null
  deleted_at: string | null         // ← MISSING from RPC
  brand_id: string | null           // ← MISSING from RPC
  category_id: string | null        // ← MISSING from RPC
  department_id: string | null      // ← MISSING from RPC
  range_id: string | null           // ← MISSING from RPC
  warranty_description: string | null  // ← MISSING from RPC
  warranty_period: string | null    // ← MISSING from RPC
}
```

---

## CURRENT FILE: src/context/product/ProductContext.tsx (key sections)

The full file is ~720 lines. Here are the key sections to change:

```tsx
// Type used to describe what the RPC currently returns:
type RpcReturnedProduct =
  Database["public"]["Functions"]["fetch_products_with_computed_attributes"]["Returns"][number];

// fetchProducts — the function with the double query (lines 125–214):
const fetchProducts = useCallback(async (): Promise<void> => {
  setLoading(true);
  try {
    const { data, error } = await supabase.rpc("fetch_products_with_computed_attributes");
    if (error) {
      showAlertRef.current?.(error.message, "error");
      console.error(error);
      return;
    }

    // ← THIS ENTIRE BLOCK IS THE SECOND QUERY TO REMOVE:
    const ids: string[] = (data ?? []).map((p: RpcReturnedProduct) => p.id);
    let rowsById: Record<string, ProductRow> = {};
    let allowedIds = new Set<string>();

    if (ids.length > 0) {
      const { data: baseRows, error: baseError } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);
      if (baseError) {
        showAlertRef.current?.(baseError.message, "error");
        console.error(baseError);
      }
      if (baseRows) {
        const filteredBaseRows = baseRows.filter((r) => !isSoftDeletedRow(r));
        rowsById = Object.fromEntries(filteredBaseRows.map((r) => [r.id, r]));
        allowedIds = new Set(filteredBaseRows.map((r) => r.id));
      }
    }

    const mapped: Product[] = (data ?? [])
      .filter((p: RpcReturnedProduct) => (ids.length > 0 ? allowedIds.has(p.id) : true))
      .map((p: RpcReturnedProduct) => {
        const base = rowsById[p.id];
        const row: ProductRow = base ?? ({
          id: p.id,
          name: p.name,
          price: p.price,
          // ... lots of nullable fallbacks for the missing fields
          brand_id: null,      // ← was null because RPC didn't return it
          category_id: null,   // ← was null
          department_id: null, // ← was null
          range_id: null,      // ← was null
          warranty_description: null,
          warranty_period: null,
          deleted_at: null,
        } satisfies ProductRow);

        return {
          ...row,
          medias: [],
          product_categories: [],
          product_colors: [],
          product_sizes: [],
          stock_status: p.stock_status ?? "",
          stock_count: typeof p.stock_count === "number" ? p.stock_count : 0,
        };
      });

    setProducts(mapped);
  } catch (error: unknown) {
    console.error("[ProductContext] Failed to fetch products:", error);
    showAlertRef.current?.("Failed to fetch products", "error");
  } finally {
    setLoading(false);
  }
}, []);
```

---

## EXACT CHANGES REQUIRED

### Part A — SQL Migration

Create a Supabase migration SQL file. The file name should be descriptive, e.g., `add_missing_columns_to_fetch_products_rpc.sql`. The content should be an `ALTER FUNCTION` or `CREATE OR REPLACE FUNCTION` that updates `fetch_products_with_computed_attributes` to include all 7 missing columns in its SELECT and RETURNS TABLE definition.

The updated RETURNS TABLE should add:
```sql
brand_id uuid,
category_id uuid,
department_id uuid,
range_id uuid,
warranty_description text,
warranty_period text,
deleted_at timestamptz
```

And the SELECT inside the function should add `p.brand_id, p.category_id, p.department_id, p.range_id, p.warranty_description, p.warranty_period, p.deleted_at` to the product columns it already selects.

Since you don't have the full existing function body, write the migration as a `CREATE OR REPLACE FUNCTION` that preserves the existing logic. Add a comment noting that the developer needs to verify the existing function body and merge these new column additions. Provide a clear template showing WHERE to add the columns.

Output this as a `.sql` file at path: `docs/sql/add_missing_columns_to_fetch_products_rpc.sql`

### Part B — TypeScript (ProductContext.tsx)

1. Update the `RpcReturnedProduct` type mapping to include the 7 new fields (they will now come from the RPC): `brand_id`, `category_id`, `department_id`, `range_id`, `warranty_description`, `warranty_period`, `deleted_at`. Since this type is auto-generated from `database.types.ts`, you may need to cast or extend it — use an intersection type rather than `any`.

2. In `fetchProducts`, remove the entire second query block (the `if (ids.length > 0) { const { data: baseRows... }` block).

3. Update the `.map()` that builds `Product[]` to build `ProductRow` directly from the RPC result `p`, using the newly available fields:
   - `brand_id: p.brand_id ?? null`
   - `category_id: p.category_id ?? null`
   - etc.

4. Update the soft-delete filter to use `deleted_at` from the RPC result directly:
   ```tsx
   // Instead of filtering on base rows from a second query:
   .filter((p: ExtendedRpcProduct) => p.deleted_at === null || p.deleted_at === undefined)
   ```

5. Replace `console.error` calls with: `if (process.env.NODE_ENV === "development") { console.error(...); }`

Please output:
1. The complete SQL migration file at `docs/sql/add_missing_columns_to_fetch_products_rpc.sql`
2. The complete updated `src/context/product/ProductContext.tsx`
```

---

*End of agent prompts.*
