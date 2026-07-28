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
import { GuideOverlay, GuideProvider } from "@/components/guide";
import { NavigationSync } from "@/components/NavigationSync";
import { AppProviders } from "@/components/Providers";
import { SplashIntro } from "@/components/SplashIntro";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { colors } from "@/constants/theme";
import { motion } from "@/lib/motion";
import { preventNativeSplashAutoHide } from "@/lib/splashScreen";
import * as SplashScreen from "expo-splash-screen";

preventNativeSplashAutoHide();

/**
 * Inner shell rendered inside AppProviders so it has access to all context hooks.
 * Checks the `maintenance` feature flag and shows a maintenance screen when on.
 */
function AppShell(): ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();
  const tokens = useThemeTokens();
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
        <StatusBar style={tokens.statusBarStyle} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tokens.bg,
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontFamily: "PlayfairDisplay_400Regular",
              color: tokens.text,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {t("common.maintenanceTitle")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: tokens.muted,
              textAlign: "center",
            }}
          >
            {t("common.maintenanceBody")}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GuideProvider>
        <NavigationSync />
        <StatusBar style={tokens.statusBarStyle} />
        <AlertBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: motion.duration.base,
          }}
        >
          {/* Auth flow — softer fade + gentle rise, slightly longer. */}
          <Stack.Screen
            name="(auth)"
            options={{ animation: "fade_from_bottom", animationDuration: 320 }}
          />
          {/* Sheet-like layers rise from the bottom to read as modal surfaces. */}
          <Stack.Screen name="cart" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="wishlist" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="checkout" options={{ animation: "slide_from_bottom" }} />
        </Stack>
        <GuideOverlay />
        {!introComplete ? (
          <SplashIntro onComplete={() => setIntroComplete(true)} />
        ) : null}
      </GuideProvider>
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
