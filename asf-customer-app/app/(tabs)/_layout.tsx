import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
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
import { logNavigateStart, markTapStart } from "@/lib/interactionLog";

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
 *
 * Haptic runs immediately; navigation stays on React Navigation's default path
 * (no sync heavy work here) so the tab chrome can respond without waiting on us.
 * Dev Metro `[tap]` / `[nav]` lines mark press → tab switch latency.
 *
 * @param tabName - Greppable tab id (`home`, `browse`, …)
 */
function tabSwitchListeners(
  tabName: string
): (args: { navigation: TabPressNavigation }) => {
  tabPress: () => void;
} {
  return ({ navigation }: { navigation: TabPressNavigation }) => ({
    tabPress: (): void => {
      markTapStart(`tab:${tabName}`);
      if (!navigation.isFocused()) {
        void hapticSelection();
        logNavigateStart(`tab:${tabName}`);
      }
    },
  });
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
 * Guests may browse tabs (sign-in CTA lives on Profile / gated screens).
 * Auth loading still blocks the first paint so a restored session does not
 * briefly flash guest chrome before signed-in UI.
 *
 * Tabs gated by feature flags:
 *   - highlights — hidden when `highlights` flag is off
 *   - locations  — hidden when `store_locations` flag is off
 */
export default function TabsLayout(): React.ReactElement {
  const { loading: authLoading } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { t, locale } = useTranslation();
  const { pack, tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tabBarRowHeight = pack.tabBar.minHeight ?? DEFAULT_TAB_BAR_ROW_HEIGHT;
  const highlightsVisible = isEnabled("highlights");
  const locationsVisible = isEnabled("store_locations");

  /**
   * Anchor ids to register against the whole tab bar (see
   * `TabBarAnchorOverlay`) — only for tabs actually rendered, so a tour
   * step can never spotlight a hidden tab.
   *
   * Must run unconditionally before any early return so TabsLayout never
   * changes hook order between auth-loading and ready renders.
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

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: tokens.bg }}>
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  }

  const homeTitle = t("nav.home");
  const shopTitle = t("nav.shop");
  const highlightsTitle = t("nav.highlights");
  const locationsTitle = t("nav.locations");
  const profileTitle = t("nav.profile");

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        key={locale}
        screenOptions={{
          headerShown: false,
          /**
           * Mount a tab's scene only on first visit (RN default is already
           * lazy, set explicitly so Shop/Profile cost is paid on first focus
           * instead of at cold start).
           */
          lazy: true,
          /**
           * Freeze inactive tab scenes so catalog page appends / Home
           * animations cannot steal the JS thread while another tab mounts
           * or focuses — the main driver of 2–4s navigate→focus deltas.
           */
          freezeOnBlur: true,
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
          listeners={tabSwitchListeners("home")}
        />

        {/*
          Shop — always visible. `popToTopOnBlur` clears leftover PDPs when
          leaving the tab so the next focus lands on catalog without a
          preventDefault + deferred navigate (which added 1–3s of lag via
          `startTransition` under JS load). Re-tapping Shop while focused
          still resets to catalog synchronously.
        */}
        <Tabs.Screen
          name="browse"
          options={{
            title: shopTitle,
            popToTopOnBlur: true,
            tabBarIcon: ({ color }) => <Ionicons name="bag-outline" size={20} color={color} />,
          }}
          listeners={({ navigation }: { navigation: TabPressNavigation }) => ({
            tabPress: (event: TabPressEvent): void => {
              markTapStart("tab:browse");
              void (navigation.isFocused() ? hapticLight() : hapticSelection());
              if (navigation.isFocused()) {
                // Already on Shop (e.g. PDP) — reset to catalog now.
                event.preventDefault();
                openBrowseCatalog(router);
                return;
              }
              // Unfocused: let React Navigation switch tabs immediately.
              // Stack was already popped to catalog via popToTopOnBlur.
              logNavigateStart("tab:browse");
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
          listeners={tabSwitchListeners("highlights")}
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
          listeners={tabSwitchListeners("locations")}
        />

        {/*
          Profile — always visible. `popToTopOnBlur` clears leftover Design Lab /
          notifications / nested hub screens when leaving the tab so the next
          Profile tap lands on the hub (same pattern as Shop).
        */}
        <Tabs.Screen
          name="profile"
          options={{
            title: profileTitle,
            popToTopOnBlur: true,
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} />,
          }}
          listeners={tabSwitchListeners("profile")}
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
