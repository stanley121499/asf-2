import { classicTokens } from "@/themes/classic/tokens";
import type { TabBarTheme } from "@/themes/types";

/**
 * Classic light tab bar — mirrors current `(tabs)/_layout.tsx` colors.
 */
export const classicTabBar: TabBarTheme = {
  backgroundColor: "rgba(255,255,255,0.94)",
  borderTopColor: classicTokens.border,
  activeTintColor: classicTokens.accent,
  inactiveTintColor: classicTokens.muted,
  minHeight: 60,
};
