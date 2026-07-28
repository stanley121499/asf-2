import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANCHORS, TabBarAnchorOverlay, type AnchorId } from "@/components/guide";
import { CartChromeHost } from "@/components/cart/CartChromeHost";
import { useAuthContext } from "@/context/AuthContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";
import { openBrowseCatalog } from "@/lib/browseNavigation";
import { hapticLight, hapticSelection } from "@/lib/haptics";

/** Fallback row height when the active pack omits `tabBar.minHeight`. */
const DEFAULT_TAB_BAR_ROW_HEIGHT = 60;

/** Render nothing — hides the tab bar button and collapses the slot. */
const hiddenButton = (): null => null;

/** Minimal shape of the navigation object passed to tab `listeners`. */
interface TabPressNavigation {
  isFocused: () => boolean;
}

/** Minimal shape of the `tabPress` event we rely on. */
interface TabPressEvent {
  preventDefault: () => void;
}

/**
 * Builds tab `listeners` that fire a selection haptic only when the press moves
 * focus to a different tab. Re-pressing the already-focused tab stays silent so
 * users are not buzzed on every tap of their current tab.
 */
function tabSwitchListeners({ navigation }: { navigation: TabPressNavigation }) {
  return {
    tabPress: (): void => {
      if (!navigation.isFocused()) {
        void hapticSelection();
      }
    },
  };
}

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
  const { t, locale } = useTranslation();
  const { pack, tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tabBarRowHeight = pack.tabBar.minHeight ?? DEFAULT_TAB_BAR_ROW_HEIGHT;

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: tokens.bg }}>
        <ActivityIndicator size="large" color={tokens.accent} />
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

  const highlightsVisible = isEnabled("highlights");
  const locationsVisible = isEnabled("store_locations");

  /**
   * Anchor ids to register against the whole tab bar (see
   * `TabBarAnchorOverlay`) — only for tabs actually rendered, so a tour
   * step can never spotlight a hidden tab.
   */
  const visibleTabAnchorIds = useMemo((): AnchorId[] => {
    const ids: AnchorId[] = [ANCHORS.tabbar.home, ANCHORS.tabbar.shop, ANCHORS.tabbar.profile];
    if (highlightsVisible) {
      ids.push(ANCHORS.tabbar.highlights);
    }
    if (locationsVisible) {
      ids.push(ANCHORS.tabbar.locations);
    }
    return ids;
  }, [highlightsVisible, locationsVisible]);

  const tabBarHeight = tabBarRowHeight + insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        key={locale}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: pack.tabBar.activeTintColor,
          tabBarInactiveTintColor: pack.tabBar.inactiveTintColor,
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: "Inter_400Regular",
            marginBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: pack.tabBar.backgroundColor,
            borderTopColor: pack.tabBar.borderTopColor,
            borderTopWidth: 1,
            minHeight: tabBarHeight,
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
          listeners={tabSwitchListeners}
        />

        {/* Shop — always visible; tab press always lands on catalog, not a leftover PDP */}
        <Tabs.Screen
          name="browse"
          options={{
            title: shopTitle,
            tabBarIcon: ({ color }) => <Ionicons name="bag-outline" size={20} color={color} />,
          }}
          listeners={({ navigation }: { navigation: TabPressNavigation }) => ({
            tabPress: (event: TabPressEvent): void => {
              event.preventDefault();
              // Switching into Shop is a tab change (selection tick); re-tapping the
              // already-focused Shop tab is an intentional catalog reset (light tap).
              void (navigation.isFocused() ? hapticLight() : hapticSelection());
              openBrowseCatalog(router);
            },
          })}
        />

        {/* Highlights — gated by `highlights` feature flag */}
        <Tabs.Screen
          name="highlights"
          options={
            highlightsVisible
              ? {
                  title: highlightsTitle,
                  tabBarIcon: ({ color }) => <Ionicons name="film-outline" size={20} color={color} />,
                }
              : { title: highlightsTitle, tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
          }
          listeners={tabSwitchListeners}
        />

        {/* Stores — gated by `store_locations` feature flag */}
        <Tabs.Screen
          name="locations"
          options={
            locationsVisible
              ? {
                  title: locationsTitle,
                  tabBarIcon: ({ color }) => (
                    <Ionicons name="location-outline" size={20} color={color} />
                  ),
                }
              : { title: locationsTitle, tabBarButton: hiddenButton, tabBarItemStyle: hiddenItemStyle }
          }
          listeners={tabSwitchListeners}
        />

        {/* Profile — always visible */}
        <Tabs.Screen
          name="profile"
          options={{
            title: profileTitle,
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} />,
          }}
          listeners={tabSwitchListeners}
        />
      </Tabs>

      {/*
        Fallback tab-bar instrumentation (plan §7) — see `TabBarAnchorOverlay`
        for why individual tab buttons aren't wrapped directly. Non-interactive
        and invisible; sized to match `tabBarStyle` above.
      */}
      <TabBarAnchorOverlay anchorIds={visibleTabAnchorIds} height={tabBarHeight} />
      {/*
        Theme cart chrome overlay (Atelier FAB later). Classic returns null —
        header bags are mounted inside Home/Shop/Highlights/ProfileHub.
        Not mounted on auth/checkout stacks (those live outside this layout).
      */}
      <CartChromeHost />
    </View>
  );
}
