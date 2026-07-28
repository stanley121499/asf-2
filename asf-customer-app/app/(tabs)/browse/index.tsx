import React from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Thin Shop (browse catalog) route — mounts the active theme pack's Shop skin.
 * Atelier/Noir may temporarily reuse Classic until Agents 4 / 6.
 */
export default function ShopRoute(): React.ReactElement {
  const { pack } = useTheme();
  const Screen = pack.screens.Shop;
  return <Screen />;
}
