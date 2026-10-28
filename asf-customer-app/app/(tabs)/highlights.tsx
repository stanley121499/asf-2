import React from "react";

import { useTheme } from "@/context/ThemeContext";
import { usePromotionP2Focus } from "@/context/PromotionContext";

/**
 * Thin Highlights tab route — mounts the active theme pack's Highlights skin.
 * P2: promotions hydrate when Highlights is focused (feed may show offers).
 */
export default function HighlightsTabRoute(): React.ReactElement {
  usePromotionP2Focus("promotions:highlights");
  const { pack } = useTheme();
  const Screen = pack.screens.Highlights;
  return <Screen />;
}
