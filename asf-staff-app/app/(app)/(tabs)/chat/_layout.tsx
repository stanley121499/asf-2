import { Stack } from "expo-router";
import React from "react";

export default function ChatStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
