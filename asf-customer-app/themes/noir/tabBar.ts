import { noirTokens } from "@/themes/noir/tokens";
import type { TabBarTheme } from "@/themes/types";

/**
 * Noir dark tab bar — near-black ground, muted-gold active, light inactive icons.
 */
export const noirTabBar: TabBarTheme = {
  backgroundColor: "rgba(10,10,10,0.96)",
  borderTopColor: noirTokens.border,
  activeTintColor: noirTokens.accent,
  inactiveTintColor: noirTokens.muted,
  minHeight: 60,
};
