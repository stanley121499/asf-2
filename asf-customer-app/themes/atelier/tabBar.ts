import { atelierTokens } from "@/themes/atelier/tokens";
import type { TabBarTheme } from "@/themes/types";

/**
 * Atelier tab bar — airier row, paper ground, quieter active tint.
 * Visibly distinct from Classic light gold-on-white chrome.
 */
export const atelierTabBar: TabBarTheme = {
  backgroundColor: "rgba(246,241,232,0.96)",
  borderTopColor: atelierTokens.border,
  activeTintColor: atelierTokens.accent,
  inactiveTintColor: atelierTokens.muted,
  /** Slightly taller than Classic 60 for an airier feel. */
  minHeight: 68,
};
