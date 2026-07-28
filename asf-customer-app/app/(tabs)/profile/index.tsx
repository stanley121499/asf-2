import React from "react";

import { useTheme } from "@/context/ThemeContext";

/**
 * Thin Profile hub route — mounts the active theme pack's ProfileHub skin.
 * Theme Appearance is SUPERADMIN-only at `profile/appearance` (hidden from normal Profile).
 */
export default function ProfileHubRoute(): React.ReactElement {
  const { pack } = useTheme();
  const Screen = pack.screens.ProfileHub;
  return <Screen />;
}
