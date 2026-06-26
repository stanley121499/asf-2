import type { PropsWithChildren } from "react";
import React from "react";

import { AnnouncementProvider } from "@/context/AnnouncementContext";
import { BrandProvider } from "@/context/product/BrandContext";
import { DepartmentProvider } from "@/context/product/DepartmentContext";
import { RangeProvider } from "@/context/product/RangeContext";
import { CategoryProvider } from "@/context/product/CategoryContext";
import { ProductCategoryProvider } from "@/context/product/ProductCategoryContext";
import { ProductSizeProvider } from "@/context/product/ProductSizeContext";
import { ProductColorProvider } from "@/context/product/ProductColorContext";
import { ProductMediaProvider } from "@/context/product/ProductMediaContext";
import { ProductProvider } from "@/context/product/ProductContext";
import { PostMediaProvider } from "@/context/post/PostMediaContext";
import { PostProvider } from "@/context/post/PostContext";
import { PointsMembershipProvider } from "@/context/PointsMembershipContext";
import { AddToCartLogProvider } from "@/context/product/AddToCartLogContext";
import { AddToCartProvider } from "@/context/product/CartContext";
import { OrderProvider } from "@/context/product/OrderContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { PromotionProvider } from "@/context/PromotionContext";
import { StoreLocationProvider } from "@/context/StoreLocationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";

/**
 * Mirrors `SlimLandingContextBundle` from `asf-2-next/src/context/RouteContextBundles.tsx`.
 * Customer-facing data + realtime channels only (no admin product/post folder contexts).
 *
 * Feature-flagged providers are conditionally mounted so that their Supabase Realtime
 * subscriptions are not opened when the corresponding module is disabled.
 * This reduces channel count and database load for clients on restricted packages.
 *
 * Gated providers:
 *   - PostMediaProvider + PostProvider  → `highlights`
 *   - PointsMembershipProvider          → `rewards`
 *   - WishlistProvider                  → `wishlist`
 *   - StoreLocationProvider             → `store_locations`
 *   - PromotionProvider                 → `promotions`
 */
export function RouteContextBundle({ children }: PropsWithChildren): React.ReactElement {
  const { isEnabled } = useFeatureFlags();

  /**
   * Conditionally wraps children in a provider. When the feature is off the
   * provider is skipped entirely (no subscription opened, no render overhead).
   */
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
                        {/* PostMedia + Post providers: only open realtime channels when highlights is on */}
                        <Gate flag="highlights" Provider={PostMediaProvider}>
                          <Gate flag="highlights" Provider={PostProvider}>
                            {/* Rewards / points: only subscribe when rewards is on */}
                            <Gate flag="rewards" Provider={PointsMembershipProvider}>
                              <AddToCartLogProvider>
                                <AddToCartProvider>
                                  <OrderProvider>
                                    {/* Wishlist: only subscribe when wishlist is on */}
                                    <Gate flag="wishlist" Provider={WishlistProvider}>
                                      <Gate
                                        flag="store_locations"
                                        Provider={StoreLocationProvider}
                                        kids={
                                          <Gate flag="promotions" Provider={PromotionProvider}>
                                            <NotificationProvider>{children}</NotificationProvider>
                                          </Gate>
                                        }
                                      />
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
}
