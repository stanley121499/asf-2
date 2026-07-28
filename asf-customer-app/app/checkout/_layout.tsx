import { Stack } from "expo-router";

import { motion } from "@/lib/motion";

/**
 * Checkout reads as a sheet layer: the flow rises from the bottom (root Stack
 * opens it via `slide_from_bottom`) and each step continues that upward motion
 * so the whole journey feels like one modal surface rather than deep pushes.
 */
export default function CheckoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
        animationDuration: motion.duration.base,
      }}
    />
  );
}
