import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
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
 * Bottom tabs: 首页, 购物, 精选, 门店, 我的
 * Matches web bottom-nav.tsx:
 *   - bg-white/80 backdrop-blur, border-t, height 64px
 *   - Active: gold #C9A96E  |  Inactive: muted #6B7280
 *   - Labels in Chinese, icons at 20px
 *
 * Tabs gated by feature flags:
 *   - 精选 (highlights) — hidden when `highlights` flag is off
 *   - 门店 (locations)   — hidden when `store_locations` flag is off
 */
export default function TabsLayout(): React.ReactElement {
  const { user, loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
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
      {/* 首页 — always visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: "首页",
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} />,
        }}
      />

      {/* 购物 — always visible */}
      <Tabs.Screen
        name="browse"
        options={{
          title: "购物",
          tabBarIcon: ({ color }) => <Ionicons name="bag-outline" size={20} color={color} />,
        }}
      />

      {/* 精选 — gated by `highlights` feature flag */}
      <Tabs.Screen
        name="highlights"
        options={
          isEnabled("highlights")
            ? {
                title: "精选",
                tabBarIcon: ({ color }) => <Ionicons name="film-outline" size={20} color={color} />,
              }
            : { title: "精选", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 门店 — gated by `store_locations` feature flag */}
      <Tabs.Screen
        name="locations"
        options={
          isEnabled("store_locations")
            ? {
                title: "门店",
                tabBarIcon: ({ color }) => (
                  <Ionicons name="location-outline" size={20} color={color} />
                ),
              }
            : { title: "门店", tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
        }
      />

      {/* 我的 — always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "我的",
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
