import React from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Thin Highlights route inside the profile stack — same Highlights skin as the
 * tab. Classic detects profile pathname and shows a back chevron.
 */
export default function ProfileHighlightsRoute(): React.ReactElement {
  const { pack } = useTheme();
  const Screen = pack.screens.Highlights;
  return <Screen />;
}
