import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";

import { ContentViewAwardHost } from "@/components/motion/ContentViewAwardHost";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTheme } from "@/context/ThemeContext";
import { useWishlistP2Focus } from "@/context/WishlistContext";
import { isContentViewAwardUuid } from "@/lib/contentViewAward";

/**
 * Normalizes Expo Router dynamic-segment params (string | string[]) to a single id.
 *
 * @param value - Raw `productId` route param
 */
function resolveProductIdParam(
  value: string | string[] | undefined
): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string") {
      const trimmed = first.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
}

/**
 * Retains wishlist sync for PDP hearts when the wishlist feature is on.
 */
function ProductWishlistP2Bridge(): null {
  useWishlistP2Focus("wishlist:pdp");
  return null;
}

/**
 * Thin product-inner route — mounts the active theme pack's ProductDetail skin
 * and fires the first-view discovery-points award for all themes.
 *
 * Route params (`productId`, `returnTo`) are also read inside the skin via
 * `useLocalSearchParams`.
 */
export default function ProductDetailRoute(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { pack } = useTheme();
  const Screen = pack.screens.ProductDetail;
  const params = useLocalSearchParams<{
    productId: string | string[];
  }>();
  const productId = resolveProductIdParam(params.productId);
  const awardId =
    productId !== null && isContentViewAwardUuid(productId)
      ? productId
      : null;

  return (
    <View style={{ flex: 1 }}>
      {isEnabled("wishlist") ? <ProductWishlistP2Bridge /> : null}
      <Screen />
      <ContentViewAwardHost contentType="product" contentId={awardId} />
    </View>
  );
}
