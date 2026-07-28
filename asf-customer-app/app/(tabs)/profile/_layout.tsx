import { Stack } from "expo-router";

import { motion } from "@/lib/motion";

/**
 * Anchor the profile stack at `index` so direct navigation to a nested screen
 * (e.g. order detail / notifications from checkout) always keeps the profile
 * home beneath it. Without this, deep-linking in via `router.replace` leaves the
 * stack with a single screen: back escapes to home and the profile tab gets
 * stuck on that screen.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: motion.duration.base,
      }}
    >
      {/*
        Declare `index` first (same pattern as browse/_layout). Listing only
        `appearance` made it the stack's first child — alphabetically before
        `index` — so Profile tab opened Theme (staff) instead of the hub.
      */}
      <Stack.Screen name="index" />
      <Stack.Screen name="appearance" />
    </Stack>
  );
}
