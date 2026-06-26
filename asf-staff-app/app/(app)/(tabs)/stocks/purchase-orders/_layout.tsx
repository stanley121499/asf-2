import { Stack } from "expo-router";
import React from "react";

/** Purchase orders stack — screens manage their own headers. */
export default function PurchaseOrdersStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
