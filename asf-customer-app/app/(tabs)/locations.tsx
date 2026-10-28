import React from "react";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTheme } from "@/context/ThemeContext";
import { ClassicLocationsScreen } from "@/themes/classic/screens/Locations";
import { useStoreLocationP2Focus } from "@/context/StoreLocationContext";

/**
 * Retains store-location sync when the provider is mounted
 * (`store_locations` and/or `warranty_registration` gates).
 */
function LocationsP2Bridge(): null {
  useStoreLocationP2Focus("store_locations");
  return null;
}

/**
 * Thin Stores route — mounts pack `Locations` when present (Atelier Places,
 * Noir dark locator), else the Classic token-shell list.
 * P2: fetch/subscribe only while this tab is focused.
 */
export default function LocationsRoute(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { pack } = useTheme();
  const PackLocations = pack.screens.Locations;
  const storeProviderMounted =
    isEnabled("store_locations") || isEnabled("warranty_registration");

  return (
    <>
      {storeProviderMounted ? <LocationsP2Bridge /> : null}
      {PackLocations !== undefined ? <PackLocations /> : <ClassicLocationsScreen />}
    </>
  );
}
