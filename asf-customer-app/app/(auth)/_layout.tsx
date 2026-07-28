import { Stack } from "expo-router";

/**
 * Auth screens (sign-in / sign-up / forgot) use a softer fade-and-rise at a
 * slightly longer duration so entering the account flow feels calmer than the
 * brisk `slide_from_right` used elsewhere.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        animationDuration: 320,
      }}
    />
  );
}
