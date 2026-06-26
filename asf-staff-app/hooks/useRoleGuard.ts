import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import type { StaffRole } from "@/constants/roles";
import { ROLE_TAB_ORDER } from "@/constants/roles";
import { useStaffRole } from "@/context/StaffRoleContext";

/**
 * Redirects to `/settings` when the current staff role cannot access this route.
 */
export function useRoleGuard(allowedRoles: readonly StaffRole[]): void {
  const allowedKey = allowedRoles.join(",");
  const { role, loading } = useStaffRole();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (role === null) {
      return;
    }
    if (allowedRoles.includes(role)) {
      return;
    }

    const root = segments[0];
    if (root !== "(app)") {
      return;
    }

    router.replace("/(app)/settings");
  }, [allowedKey, loading, role, router, segments]);
}

/**
 * Returns whether the route key (e.g. `"analytics"`) is allowed for `role`.
 */
export function roleAllowsTab(role: StaffRole | null, tabKey: string): boolean {
  if (role === null) {
    return false;
  }
  const tabs = ROLE_TAB_ORDER[role];
  return tabs.includes(tabKey);
}
