import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuthContext } from "@/context/AuthContext";

/**
 * Keeps navigation aligned with Supabase auth:
 * - Guests may stay on `(tabs)` (browse-as-guest / Profile guest hub).
 * - Checkout still requires a session.
 * - Signed-in users are moved out of the `(auth)` group.
 */
export function NavigationSync(): null {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    const root = segments[0];
    if (root === undefined) {
      return;
    }

    if (user === null) {
      if (root === "checkout") {
        router.replace("/(auth)/sign-in");
      }
      return;
    }

    if (root === "(auth)") {
      router.replace("/(tabs)");
    }
  }, [loading, router, segments, user]);

  return null;
}
