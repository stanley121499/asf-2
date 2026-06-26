import { Redirect } from "expo-router";
import React from "react";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";

/**
 * Analytics index — redirects to the products sub-tab when the feature is on,
 * or to the dashboard when the `analytics` feature flag is off.
 */
export default function AnalyticsIndex(): React.ReactElement {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled("analytics")) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(app)/(tabs)/analytics/products" />;
}
