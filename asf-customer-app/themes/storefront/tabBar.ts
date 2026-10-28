import { storefrontTokens } from "@/themes/storefront/tokens";
import type { TabBarTheme } from "@/themes/types";

/**
 * Storefront light tab bar — mirrors Classic chrome for the cloned pack.
 */
export const storefrontTabBar: TabBarTheme = {
  backgroundColor: "rgba(255,255,255,0.94)",
  borderTopColor: storefrontTokens.border,
  activeTintColor: storefrontTokens.accent,
  inactiveTintColor: storefrontTokens.muted,
  minHeight: 60,
};
