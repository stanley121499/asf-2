import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuthContext } from "@/context/AuthContext";

/**
 * Keeps navigation aligned with Supabase auth: signed-out users cannot stay on protected routes;
 * signed-in users are moved out of the `(auth)` group.
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
      if (root === "(tabs)" || root === "checkout") {
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
