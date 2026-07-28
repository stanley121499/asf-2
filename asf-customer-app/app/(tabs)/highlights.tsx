import React from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Thin Highlights tab route — mounts the active theme pack's Highlights skin.
 * Atelier/Noir may still resolve to Classic until Agents 3 / 5.
 */
export default function HighlightsTabRoute(): React.ReactElement {
  const { pack } = useTheme();
  const Screen = pack.screens.Highlights;
  return <Screen />;
}
