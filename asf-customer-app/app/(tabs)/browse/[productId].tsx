import React from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Thin product-inner route — mounts the active theme pack's ProductDetail skin.
 * Route params (`productId`, `returnTo`) are read inside the skin via
 * `useLocalSearchParams`. Atelier/Noir may reuse Classic until Agents 4 / 6.
 */
export default function ProductDetailRoute(): React.ReactElement {
  const { pack } = useTheme();
  const Screen = pack.screens.ProductDetail;
  return <Screen />;
}
