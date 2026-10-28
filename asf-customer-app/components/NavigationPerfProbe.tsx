import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import { logScreenFocused } from "@/lib/interactionLog";

/**
 * Dev-only navigation latency probe: when Expo Router pathname changes after
 * the first paint, logs `[nav …] screen focused <path>` with delta from the
 * latest {@link markTapStart}. Mount once near the root stack (e.g. next to
 * {@link NavigationSync}) — self-contained so Providers / layout churn is
 * avoided.
 *
 * Returns `null` (no UI).
 */
export function NavigationPerfProbe(): null {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    const current =
      typeof pathname === "string" && pathname.length > 0 ? pathname : "/";

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousPathRef.current = current;
      return;
    }

    if (previousPathRef.current === current) {
      return;
    }

    previousPathRef.current = current;
    logScreenFocused(current);
  }, [pathname]);

  return null;
}
