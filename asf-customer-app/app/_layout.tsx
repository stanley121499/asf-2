import "react-native-gesture-handler";
import "../global.css";

import { Inter_400Regular } from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_400Regular,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AlertBanner } from "@/components/AlertBanner";
import { NavigationSync } from "@/components/NavigationSync";
import { AppProviders } from "@/components/Providers";
import { SplashIntro } from "@/components/SplashIntro";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { colors } from "@/constants/theme";
import { preventNativeSplashAutoHide } from "@/lib/splashScreen";
import * as SplashScreen from "expo-splash-screen";

preventNativeSplashAutoHide();

/**
 * Inner shell rendered inside AppProviders so it has access to all context hooks.
 * Checks the `maintenance` feature flag and shows a maintenance screen when on.
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

  if (isEnabled("maintenance")) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.bg,
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontFamily: "PlayfairDisplay_400Regular",
              color: colors.text,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            系统维护中
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: colors.muted,
              textAlign: "center",
            }}
          >
            我们正在进行维护，请稍后再试。
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationSync />
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
 * Root layout: fonts, global providers, safe area, navigation stack.
 * AppShell (inside AppProviders) handles the maintenance mode gate.
 */
export default function RootLayout(): ReactElement {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    Inter_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <AppProviders>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.bg,
          }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
