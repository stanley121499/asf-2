import React from "react";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTheme } from "@/context/ThemeContext";
import { useWishlistP2Focus } from "@/context/WishlistContext";
import type { ThemeId } from "@/themes/types";

/**
 * Themes whose Shop grid shows wishlist hearts (needs P2 retain on Shop focus).
 * Storefront tiles have no hearts — retaining here only burned Home↔Shop
 * handoff (blur home + focus shop) on the browse critical path.
 */
const SHOP_WISHLIST_HEART_THEMES: ReadonlySet<ThemeId> = new Set([
  "classic",
  "atelier",
  "noir",
]);

/**
 * Retains wishlist sync only when the wishlist feature flag is on
 * (provider is Gate-wrapped in RouteContextBundle).
 */
function ShopWishlistP2Bridge(): null {
  useWishlistP2Focus("wishlist:shop");
  return null;
}

/**
 * Thin Shop (browse catalog) route — mounts the active theme pack's Shop skin.
 * P2: wishlist hearts hydrate when Shop is focused for themes that show them
 * (lazy tab — not cold start). Storefront skips Shop retain.
 */
export default function ShopRoute(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { themeId, pack } = useTheme();
  const Screen = pack.screens.Shop;
  const retainShopWishlist =
    isEnabled("wishlist") && SHOP_WISHLIST_HEART_THEMES.has(themeId);

  return (
    <>
      {retainShopWishlist ? <ShopWishlistP2Bridge /> : null}
      <Screen />
    </>
  );
}
