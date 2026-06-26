import { Stack } from "expo-router";
import React from "react";

export default function SupportStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
