import { Stack } from "expo-router";

import { motion } from "@/lib/motion";

/**
 * Anchor the browse stack at `index` so cross-tab opens of `browse/[productId]`
 * keep a catalog screen available under the PDP (Shop tab can reset to it).
 * PDP back does not rely on that stack alone — callers pass `returnTo` so Home /
 * Wishlist opens restore the correct entry screen instead of always popping to catalog.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function BrowseStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: motion.duration.base,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[productId]" />
    </Stack>
  );
}
