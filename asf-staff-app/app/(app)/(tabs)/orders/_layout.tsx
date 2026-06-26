import { Stack } from "expo-router";
import React from "react";

export default function OrdersStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
