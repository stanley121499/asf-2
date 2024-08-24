import React from "react";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { AlertComponent } from "./components/AlertComponent";
import FlowbiteWrapper from "./components/FlowbiteWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { AlertProvider } from "./context/AlertContext";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { PostProvider } from "./context/post/PostContext";
import { PostFolderProvider } from "./context/post/PostFolderContext";
import { PostFolderMediaProvider } from "./context/post/PostFolderMediaContext";
import { PostMediaProvider } from "./context/post/PostMediaContext";
import { CategoryProvider } from "./context/product/CategoryContext";
import { ProductCategoryProvider } from "./context/product/ProductCategoryContext";
import { ProductColorProvider } from "./context/product/ProductColorContext";
import { ProductProvider } from "./context/product/ProductContext";
import { ProductEventProvider } from "./context/product/ProductEventContext";
import { ProductFolderProvider } from "./context/product/ProductFolderContext";
import { ProductFolderMediaProvider } from "./context/product/ProductFolderMediaContext";
import { ProductMediaProvider } from "./context/product/ProductMediaContext";
import { ProductPurchaseOrderProvider } from "./context/product/ProductPurchaseOrderContext";
import { ProductReportProvider } from "./context/product/ProductReportContext";
import { ProductSizeProvider } from "./context/product/ProductSizeContext";
import { ProductStockLogProvider } from "./context/product/ProductStockLogContext";
import { ProductStockProvider } from "./context/product/ProductStockContext";
import "./index.css";
import DashboardPage from "./pages";
import SignInPage from "./pages/authentication/sign-in";
import HomePage from "./pages/landing/home";
import PrivacyPage from "./pages/legal/privacy";
import NotFoundPage from "./pages/pages/404";
import ServerErrorPage from "./pages/pages/500";
import MaintenancePage from "./pages/pages/maintenance";
import CreatePostPage from "./pages/posts/create-post-page";
import PostListPage from "./pages/posts/list";
import SchedulePostListPage from "./pages/posts/schedule-post-page";
import CategoryListPage from "./pages/products/category-page";
import CreateProductPage from "./pages/products/create-product-page";
import ProductListPage from "./pages/products/list";
import ScheduleProductListPage from "./pages/products/schedule-product-page";
import CreatePurchaseOrderPage from "./pages/stocks/create-purchase-order";
import CreateReportPage from "./pages/stocks/create-report";
import StockAllProductEventPage from "./pages/stocks/event-list";
import StockAllProductPage from "./pages/stocks/list";
import StockOverviewPage from "./pages/stocks/overview";
import StockReportPage from "./pages/stocks/report";
import ViewPurchaseOrderPage from "./pages/stocks/view-purchase-order";
import ViewReportPage from "./pages/stocks/view-report";
import UserListPage from "./pages/users/list";
import UserSettingsPage from "./pages/users/settings";
import ProductStockDetails from "./pages/products/stock";
import HomePageBuilder from "./pages/home-page-builder";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HomePageElementProvider } from "./context/HomePageElementContext";

const App: React.FC = () => (
  <AlertProvider>
    <ProviderComposer
      providers={[
        ProductPurchaseOrderProvider,
        ProductReportProvider,
        AuthProvider,
        UserProvider,
        PostProvider,
        PostFolderProvider,
        PostFolderMediaProvider,
        PostMediaProvider,
        CategoryProvider,
        ProductProvider,
        ProductCategoryProvider,
        ProductSizeProvider,
        ProductColorProvider,
        ProductMediaProvider,
        ProductFolderProvider,
        ProductFolderMediaProvider,
        ProductEventProvider,
        ProductStockLogProvider,
        ProductStockProvider,
        HomePageElementProvider,
      ]}
    >
      <AlertComponent />
      <BrowserRouter>
        <DndProvider backend={HTML5Backend}>
          <Routes>
            <Route element={<FlowbiteWrapper />}>
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users/list" element={<UserListPage />} />
                <Route path="/users/settings" element={<UserSettingsPage />} />
                <Route path="/posts/list" element={<PostListPage />} />
                <Route
                  path="/posts/create/:folderId?/:postId?"
                  element={<CreatePostPage />}
                />
                <Route
                  path="/posts/schedule/:postId?"
                  element={<SchedulePostListPage />}
                />
                <Route path="/products/list" element={<ProductListPage />} />
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
                <Route path="/stocks/overview" element={<StockOverviewPage />} />
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
                {/* Home Page Builder */}
                <Route
                  path="/home-page-builder"
                  element={<HomePageBuilder />}
                />
              </Route>

              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/pages/maintenance" element={<MaintenancePage />} />
              <Route path="/authentication/sign-in" element={<SignInPage />} />

              {/* Legal Pages */}
              <Route path="/legal/privacy" element={<PrivacyPage />} />

              {/* Error Handling Routes */}
              <Route path="/500" element={<ServerErrorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </DndProvider>
      </BrowserRouter>
    </ProviderComposer>
  </AlertProvider>
);

export default App;

const ProviderComposer: React.FC<{
  providers: React.JSXElementConstructor<React.PropsWithChildren<{}>>[];
  children: React.ReactNode;
}> = ({ providers, children }) => {
  return providers.reduce((AccumulatedProviders, CurrentProvider) => {
    return <CurrentProvider>{AccumulatedProviders}</CurrentProvider>;
  }, <>{children}</>);
};
