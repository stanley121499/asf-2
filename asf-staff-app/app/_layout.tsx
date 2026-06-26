import "react-native-gesture-handler";
import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AlertBanner } from "@/components/AlertBanner";
import { SplashIntro } from "@/components/SplashIntro";
import { AdminContextBundle } from "@/context/AdminContextBundle";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { preventNativeSplashAutoHide } from "@/lib/splashScreen";

preventNativeSplashAutoHide();

/**
 * Inner shell with access to feature flags — plays intro unless maintenance is on.
 */
function AppShell(): ReactElement {
  const { isEnabled } = useFeatureFlags();
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    if (isEnabled("maintenance")) {
      setIntroComplete(true);
      void SplashScreen.hideAsync();
    }
  }, [isEnabled]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AlertBanner />
      <Stack screenOptions={{ headerShown: false }} />
      {!introComplete ? (
        <SplashIntro onComplete={() => setIntroComplete(true)} />
      ) : null}
    </SafeAreaProvider>
  );
}

/**
 * Root layout: global providers, stack navigation, toast alerts.
 */
export default function RootLayout(): ReactElement {
  return (
    <AdminContextBundle>
      <AppShell />
    </AdminContextBundle>
  );
}
