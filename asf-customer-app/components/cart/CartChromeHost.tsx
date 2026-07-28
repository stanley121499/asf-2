import React from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Renders the active theme pack's `CartChrome` overlay (e.g. Atelier FAB).
 * Classic header bags live inside screen headers via {@link CartButton};
 * Classic's pack chrome returns null here.
 *
 * Mount near the tabs shell so FAB-style chrome sits above the tab bar.
 * Auth / checkout stacks should not mount this host (skip those surfaces).
 */
export function CartChromeHost(): React.ReactElement | null {
  const { pack } = useTheme();
  const Chrome = pack.CartChrome;
  return <Chrome />;
}
