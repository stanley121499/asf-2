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