import type { PropsWithChildren } from "react";
import React from "react";

import { AlertProvider } from "@/context/AlertContext";
import { AnnouncementProvider } from "@/context/AnnouncementContext";
import { AuthProvider } from "@/context/AuthContext";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import {
  CommunityContextBundle,
  PostContextBundle,
  ProductContextBundle,
} from "@/context/RouteContextBundles";
import { NotificationProvider } from "@/context/NotificationContext";
import { PromotionProvider } from "@/context/PromotionContext";
import { StoreLocationProvider } from "@/context/StoreLocationContext";
import { PaymentProvider } from "@/context/PaymentContext";
import { OrderProvider } from "@/context/product/OrderContext";
import { StaffRoleProvider } from "@/context/StaffRoleContext";

/**
 * Full provider stack for the staff Expo app — catalog, posts, commerce, CRM, alerts, auth.
 */
export function AdminContextBundle({
  children,
}: PropsWithChildren): React.ReactElement {
  return (
    <AlertProvider>
      <AuthProvider>
        <FeatureFlagsProvider>
        <StaffRoleProvider>
        <AnnouncementProvider>
          <ProductContextBundle>
            <PostContextBundle>
              <OrderProvider>
                <PaymentProvider>
                  <PromotionProvider>
                    <StoreLocationProvider>
                    <NotificationProvider>
                      <CommunityContextBundle>{children}</CommunityContextBundle>
                    </NotificationProvider>
                    </StoreLocationProvider>
                  </PromotionProvider>
                </PaymentProvider>
              </OrderProvider>
            </PostContextBundle>
          </ProductContextBundle>
        </AnnouncementProvider>
        </StaffRoleProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </AlertProvider>
  );
}
