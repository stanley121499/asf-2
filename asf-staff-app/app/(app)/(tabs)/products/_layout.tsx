import { Stack } from "expo-router";
import React from "react";

export default function ProductsStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
