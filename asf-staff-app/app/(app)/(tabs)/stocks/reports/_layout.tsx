import { Stack } from "expo-router";
import React from "react";

/** Stock reports stack — screens manage their own headers. */
export default function StockReportsStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
