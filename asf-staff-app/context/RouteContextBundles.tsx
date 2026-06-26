import React, { PropsWithChildren } from "react";
import { useFeatureFlags } from "./FeatureFlagsContext";
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

import { AnnouncementProvider } from "./AnnouncementContext";

import { PostMediaProvider } from "./post/PostMediaContext";
import { PostFolderMediaProvider } from "./post/PostFolderMediaContext";
import { PostFolderProvider } from "./post/PostFolderContext";
import { PostProvider } from "./post/PostContext";

import { AddToCartLogProvider } from "./product/AddToCartLogContext";
import { AddToCartProvider } from "./product/CartContext";
import { OrderProvider } from "./product/OrderContext";
import { PaymentProvider } from "./PaymentContext";
import { WishlistProvider } from "./WishlistContext";
import { NotificationProvider } from "./NotificationContext";
import { PointsMembershipProvider } from "./PointsMembershipContext";
import { PromotionProvider } from "./PromotionContext";

import { CommunityProvider } from "./CommunityContext";
import { GroupProvider } from "./GroupContext";
import { ConversationParticipantProvider } from "./ConversationParticipantContext";
import { TicketProvider } from "./TicketContext";
import { TicketStatusLogProvider } from "./TicketStatusLogContext";
import { ConversationProvider } from "./ConversationContext";
import { UserProvider } from "./UserContext";

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
  <ProductContextBundle>
    <PointsMembershipProvider>
      <AddToCartLogProvider>
        <AddToCartProvider>
          <OrderProvider>
            <PaymentProvider>
              <WishlistProvider>{children}</WishlistProvider>
            </PaymentProvider>
          </OrderProvider>
        </AddToCartProvider>
      </AddToCartLogProvider>
    </PointsMembershipProvider>
  </ProductContextBundle>
);

/**
 * CommunityContextBundle — gated by `support_chat` flag.
 * When support chat is disabled the entire community/conversation/ticket stack
 * is skipped so no realtime channels are opened for it.
 */
export const CommunityContextBundle: React.FC<PropsWithChildren> = ({ children }) => {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled("support_chat")) {
    return <UserProvider>{children}</UserProvider>;
  }

  return (
    <UserProvider>
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
    </UserProvider>
  );
};

export const AnalyticsContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <OrderContextBundle>{children}</OrderContextBundle>
);

/**
 * SlimLandingContextBundle
 *
 * A minimal context wrapper for customer-facing / landing pages.
 * Opens only the Supabase realtime subscriptions that customers actually need:
 *
 * Products (browsing):
 *   CategoryContext, ProductCategoryContext, ProductSizeContext,
 *   ProductColorContext, ProductMediaContext, ProductContext
 *
 * Posts (home page, highlights):
 *   PostMediaContext, PostContext
 *
 * Shopping (cart, orders, wishlist, points):
 *   PointsMembershipContext, AddToCartProvider, OrderProvider, WishlistProvider
 *
 * NOT included (admin-only, not needed by any customer page):
 *   ProductFolderContext, ProductFolderMediaContext,
 *   ProductStockContext, ProductStockLogContext,
 *   ProductEventContext, ProductPurchaseOrderContext, ProductReportContext,
 *   PostFolderContext, PostFolderMediaContext,
 *   PaymentContext
 *
 * Total channels: ~13 (down from 24 in LandingContextBundle)
 */
/**
 * SlimLandingContextBundle with feature-flag-gated providers.
 * Heavy realtime providers are only mounted when their corresponding feature is on.
 */
export const SlimLandingContextBundle: React.FC<PropsWithChildren> = ({ children }) => {
  const { isEnabled } = useFeatureFlags();

  function Gate({
    flag,
    Provider,
    kids,
    children: gateChildren,
  }: {
    flag: Parameters<typeof isEnabled>[0];
    Provider: React.FC<PropsWithChildren>;
    kids?: React.ReactNode;
    children?: React.ReactNode;
  }): React.ReactElement {
    const content = kids ?? gateChildren;
    if (!isEnabled(flag)) return <>{content}</>;
    return <Provider>{content}</Provider>;
  }

  return (
    <AnnouncementProvider>
      <BrandProvider>
        <DepartmentProvider>
        <RangeProvider>
          <CategoryProvider>
            <ProductCategoryProvider>
              <ProductSizeProvider>
                <ProductColorProvider>
                  <ProductMediaProvider>
                    <ProductProvider>
                      <Gate flag="highlights" Provider={PostMediaProvider}>
                        <Gate flag="highlights" Provider={PostProvider}>
                          <Gate flag="rewards" Provider={PointsMembershipProvider}>
                            <AddToCartLogProvider>
                              <AddToCartProvider>
                                <OrderProvider>
                                  <Gate flag="wishlist" Provider={WishlistProvider}>
                                    <Gate flag="promotions" Provider={PromotionProvider}>
                                      <NotificationProvider>{children}</NotificationProvider>
                                    </Gate>
                                  </Gate>
                                </OrderProvider>
                              </AddToCartProvider>
                            </AddToCartLogProvider>
                          </Gate>
                        </Gate>
                      </Gate>
                    </ProductProvider>
                  </ProductMediaProvider>
                </ProductColorProvider>
              </ProductSizeProvider>
            </ProductCategoryProvider>
          </CategoryProvider>
        </RangeProvider>
        </DepartmentProvider>
      </BrandProvider>
    </AnnouncementProvider>
  );
};

/**
 * Admin routes that need catalog + promotion management (e.g. /promotions).
 */
export const FullAdminContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <ProductContextBundle>
    <PromotionProvider>{children}</PromotionProvider>
  </ProductContextBundle>
);

/**
 * LandingContextBundle
 *
 * Provides all contexts required by the customer-facing / public-facing pages:
 *  - ProductContextBundle: categories, brands, departments, ranges, products, media, stock
 *  - PostContextBundle: posts and post media (used by HomePage highlights, Highlights page)
 *  - OrderContextBundle: cart, wishlist, orders, payments (used by ProductDetails, Cart, Wishlist, etc.)
 *
 * Apply this to every customer-facing route that is NOT the sign-in / legal / error pages.
 */
export const LandingContextBundle: React.FC<PropsWithChildren> = ({ children }) => (
  <ProductContextBundle>
    <PostContextBundle>
      <OrderContextBundle>{children}</OrderContextBundle>
    </PostContextBundle>
  </ProductContextBundle>
);
