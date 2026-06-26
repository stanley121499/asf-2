import { Stack } from "expo-router";
import React from "react";

/**
 * Posts stack layout — screens manage their own headers via SafeAreaView + custom View rows.
 */
export default function PostsStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
