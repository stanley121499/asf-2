import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { colors } from "@/constants/theme";

/** Render nothing — hides the tab bar button and collapses the slot. */
const hiddenButton = (): null => null;

/**
 * Applied to hidden tab items so they occupy zero space in the tab bar.
 * `tabBarButton: hiddenButton` hides the button but the container still
 * allocates flex space; `display: 'none'` collapses it entirely.
 */
const hiddenItemStyle = { display: "none" as const };

/**
 * Bottom tabs: Home, Shop, Highlights, Stores, Profile.
 * Labels come from `t("nav.*")` so they flip with locale.
 *
 * Tabs gated by feature flags:
 *   - highlights — hidden when `highlights` flag is off
 *   - locations  — hidden when `store_locations` flag is off
 */
export default function TabsLayout(): React.ReactElement {
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (user === null) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const homeTitle = t("nav.home");
  const shopTitle = t("nav.shop");
  const highlightsTitle = t("nav.highlights");
  const locationsTitle = t("nav.locations");
  const profileTitle = t("nav.profile");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_400Regular",
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.94)",
          borderTopColor: colors.border,
          borderTopWidth: 1,
          minHeight: 60 + insets.bottom,
          paddingBottom: Platform.OS === "android" ? Math.max(insets.bottom, 24) : insets.bottom,
          paddingTop: 8,
          elevation: 0,
        },
      }}
    >
      {/* Home — always visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: homeTitle,
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} />,
        }}
      />

      {/* Shop — always visible */}
      <Tabs.Screen
        name="browse"
        options={{
          title: shopTitle,
          tabBarIcon: ({ color }) => <Ionicons name="bag-outline" size={20} color={color} />,
        }}
      />

      {/* Highlights — gated by `highlights` feature flag */}
      <Tabs.Screen
        name="highlights"
        options={
          isEnabled("highlights")
            ? {
                title: highlightsTitle,
                tabBarIcon: ({ color }) => <Ionicons name="film-outline" size={20} color={color} />,
              }
            : { title: highlightsTitle, tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* Stores — gated by `store_locations` feature flag */}
      <Tabs.Screen
        name="locations"
        options={
          isEnabled("store_locations")
            ? {
                title: locationsTitle,
                tabBarIcon: ({ color }) => (
                  <Ionicons name="location-outline" size={20} color={color} />
                ),
              }
            : { title: locationsTitle, tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* Profile — always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: profileTitle,
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
