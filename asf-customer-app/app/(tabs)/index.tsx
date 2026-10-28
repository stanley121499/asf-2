import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { usePromotionP2Focus } from "@/context/PromotionContext";
import { useTheme } from "@/context/ThemeContext";
import { useWishlistP2Focus } from "@/context/WishlistContext";
import { getTapElapsedMsLabel } from "@/lib/interactionLog";
import { HomeIdleWarmNext } from "@/lib/useHomeIdleWarmNext";

/**
 * Dev-only Home focus breadcrumb (pairs with `[nav] screen focused`).
 * Uses the shared tap clock when present.
 */
function logHomeFocusBreadcrumb(phase: "focus" | "blur"): void {
  if (!__DEV__) {
    return;
  }
  console.log(`[nav] home route ${phase} ${getTapElapsedMsLabel()}`);
}

/**
 * Retains wishlist sync for Home heart state when the feature is on.
 */
function HomeWishlistP2Bridge(): null {
  useWishlistP2Focus("wishlist:home");
  return null;
}

/**
 * Thin Home route — mounts the active theme pack's Home skin.
 * P2: promotions (+ wishlist hearts when flagged) hydrate on Home focus,
 * not at cold-start provider mount. Promotions retain is deferred one
 * macrotask (not idle) so hydrate lands before Highlights; wishlist uses
 * {@link useP2FocusRetain}.
 * After Home is visible and P0 products are ready, {@link HomeIdleWarmNext}
 * preloads primary tab routes (Metro + first mount), prefetches a small set of
 * Home/Shop images, warms Shop catalog pages, and briefly retains notifications
 * in the background.
 */
export default function HomeRoute(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  usePromotionP2Focus("promotions");
  const { pack } = useTheme();
  const Screen = pack.screens.Home;

  useFocusEffect(
    useCallback(() => {
      logHomeFocusBreadcrumb("focus");
      return () => {
        logHomeFocusBreadcrumb("blur");
      };
    }, [])
  );

  return (
    <>
      {isEnabled("wishlist") ? <HomeWishlistP2Bridge /> : null}
      <HomeIdleWarmNext />
      <Screen />
    </>
  );
}
