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
                          <Route
                            path="/posts/create/:folderId?/:postId?"
                            element={<CreatePostPage />}
                          />
                          <Route
                            path="/posts/schedule/:postId?"
                            element={<SchedulePostListPage />}
                          />
                        </Route>
                        <Route element={<ProductContextBundle><Outlet /></ProductContextBundle>}>
                          <Route path="/products/list" element={<ProductListPage />} />
                          <Route path="/products/deleted" element={<DeletedProductsPage />} />
                          <Route
                            path="/products/create/:folderId?/:productId?"
                            element={<CreateProductPage />}
                          />
                          <Route
                            path="/products/schedule/:productId?"
                            element={<ScheduleProductListPage />}
                          />
                          <Route
                            path="/products/categories"
                            element={<CategoryListPage />}
                          />

                          <Route
                            path="/products/stock/:productId"
                            element={<ProductStockDetails />}
                          />

                          {/* Stock */}

                          <Route path="/stocks/good" element={<GoodStockPage />} />

                          <Route
                            path="/stocks/overview"
                            element={<StockOverviewPage />}
                          />
                          <Route path="/stocks/all" element={<StockAllProductPage />} />
                          <Route
                            path="/stocks/events"
                            element={<StockAllProductEventPage />}
                          />
                          <Route path="/stocks/reports" element={<StockReportPage />} />
                          <Route
                            path="/stocks/report/create/:productId?/:productEventId?"
                            element={<CreateReportPage />}
                          />
                          <Route
                            path="/stocks/report/:reportId"
                            element={<ViewReportPage />}
                          />
                          <Route
                            path="/stocks/purchase-orders/create/:productId?/:productEventId?"
                            element={<CreatePurchaseOrderPage />}
                          />
                          <Route
                            path="/stocks/purchase-orders/:purchaseOrderId"
                            element={<ViewPurchaseOrderPage />}
                          />
                        </Route>
                        {/* Home Page Builder */}
                        <Route
                          path="/home-page-builder"
                          element={<HomePageElementProvider><HomePageBuilder /></HomePageElementProvider>}
                        />

                        <Route element={<OrderContextBundle><Outlet /></OrderContextBundle>}>
                          {/* Orders */}
                          <Route path="/orders" element={<OrderListPage />} />
                          <Route path="/orders/:orderId" element={<OrderDetailPage />} />

                          {/* Payments */}
                          <Route path="/payments" element={<PaymentListPage />} />
                          <Route path="/payments/:paymentId" element={<PaymentDetailPage />} />
                        </Route>

                        <Route element={<CommunityContextBundle><Outlet /></CommunityContextBundle>}>
                          {/* Support */}
                          <Route path="/support" element={<SupportPage />} />
                        </Route>

                        <Route element={<AnalyticsContextBundle><Outlet /></AnalyticsContextBundle>}>
                          {/* Analytics */}
                          <Route
                            path="/analytics/users"
                            element={<UserAnalyticsPage />}
                          />
                          <Route
                            path="/analytics/products"
                            element={<ProductAnalyticsPage />}
                          />
                          <Route
                            path="/analytics/products-inner/:productId"
                            element={<ProductInnerAnalyticsPage />}
                          />
                          <Route
                            path="/analytics/categories"
                            element={<CategoriesAnalyticsPage />}
                          />
                          <Route
                            path="/analytics/categories-inner/:categoryId"
                            element={<CategoriesInnerAnalyticsPage />}
                          />
                          <Route
                            path="/analytics/support"
                            element={<SupportAnalyticsPage />}
                          />
                        </Route>
                      </Route>

                      {/*
                       * Customer-facing / landing routes.
                       * LandingContextBundle provides: ProductContextBundle + PostContextBundle + OrderContextBundle.
                       * This covers all data needs for the home page, product browsing, cart, wishlist, etc.
                       */}
                      <Route element={<LandingContextBundle><Outlet /></LandingContextBundle>}>
                        {/* Shopping flow */}
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/order-cancel" element={<OrderCancel />} />
                        <Route path="/order-details/:orderId" element={<CustomerOrderDetailPage />} />
                        <Route path="/wishlist" element={<WishlistPage />} />

                        {/* Product browsing */}
                        <Route
                          path="/product-section/:categoryId?"
                          element={<ProductSection />}
                        />
                        <Route
                          path="/product-details/:productId?"
                          element={<ProductDetails />}
                        />

                        {/* Post / highlights */}
                        <Route path="/highlights" element={<HighlightsPage />} />

                        {/* Home & notifications */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />

                        {/* Landing-layout pages that also use NavbarHome (need category/product contexts) */}
                        <Route path="/goal" element={<GoalPage />} />
                        <Route path="/settings" element={<ProfileSettingsPage />} />
                      </Route>

                      <Route element={<CommunityContextBundle><Outlet /></CommunityContextBundle>}>
                        <Route path="/support-chat" element={<ChatWindow />} />
                        <Route path="/internal-chat" element={<InternalChat />} />
                      </Route>

                      {/* Auth-only pages — no data contexts needed */}
                      <Route path="/pages/maintenance" element={<MaintenancePage />} />
                      <Route path="/authentication/sign-in" element={<SignInPage />} />

                      {/* Legal Pages */}
                      <Route path="/legal/privacy" element={<PrivacyPage />} />

                      {/* Error Handling Routes */}
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
