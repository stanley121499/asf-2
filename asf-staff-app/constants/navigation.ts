import type { StaffRole } from "@/constants/roles";
import { ROLE_TAB_ORDER } from "@/constants/roles";

/**
 * Maps a bottom-tab key from `ROLE_TAB_ORDER` to an Expo Router `href`.
 */
export function hrefForTabKey(key: string): string {
  switch (key) {
    case "dashboard":
      return "/(app)/(tabs)/dashboard";
    case "orders":
      return "/(app)/(tabs)/orders";
    case "products":
      return "/(app)/(tabs)/products";
    case "posts":
      return "/(app)/(tabs)/posts";
    case "stocks":
      return "/(app)/(tabs)/stocks";
    case "analytics":
      return "/(app)/(tabs)/analytics";
    case "chat":
      return "/(app)/(tabs)/chat";
    case "settings":
      return "/(app)/(tabs)/settings";
    case "support":
      return "/(app)/(tabs)/support";
    default:
      return "/(app)/(tabs)/settings";
  }
}

/**
 * First tab href for a role (used by `(app)/index` redirect).
 */
export function initialHrefForRole(role: StaffRole): string {
  const first = ROLE_TAB_ORDER[role][0];
  return hrefForTabKey(first);
}
