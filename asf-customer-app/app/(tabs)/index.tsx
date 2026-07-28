import React from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Thin Home route — mounts the active theme pack's Home skin.
 * Atelier/Noir may still resolve to Classic until Agents 3 / 5.
 */
export default function HomeRoute(): React.ReactElement {
  const { pack } = useTheme();
  const Screen = pack.screens.Home;
  return <Screen />;
}
