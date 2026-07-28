import React from "react";

import { useTheme } from "@/context/ThemeContext";
import { ClassicLocationsScreen } from "@/themes/classic/screens/Locations";

/**
 * Thin Stores route — mounts pack `Locations` when present (Atelier Places,
 * Noir dark locator), else the Classic token-shell list.
 */
export default function LocationsRoute(): React.ReactElement {
  const { pack } = useTheme();
  const PackLocations = pack.screens.Locations;
  if (PackLocations !== undefined) {
    return <PackLocations />;
  }
  return <ClassicLocationsScreen />;
}
