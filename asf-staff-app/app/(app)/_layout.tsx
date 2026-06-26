import { Stack } from "expo-router";
import React from "react";

/**
 * Staff area stack — `(tabs)` group holds bottom navigation; sibling routes are stack pushes.
 */
export default function AppStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
