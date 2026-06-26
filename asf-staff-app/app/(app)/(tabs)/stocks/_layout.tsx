import { Stack } from "expo-router";
import React from "react";

/** Stocks root stack — screens manage their own headers via SafeAreaView. */
export default function StocksStackLayout(): React.ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
