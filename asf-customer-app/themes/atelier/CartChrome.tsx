import React, { useMemo } from "react";
import { Platform, View } from "react-native";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CartButton } from "@/components/cart/CartButton";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { useTranslation } from "@/context/LocaleContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";

/** Fallback tab row height when the pack omits `tabBar.minHeight`. */
const DEFAULT_TAB_BAR_ROW_HEIGHT = 60;

/** Gap between the FAB bottom edge and the top of the tab bar. */
const FAB_GAP_ABOVE_TAB_BAR = 12;

/** Floating bag button diameter — single clear size (no nested CartButton expansion). */
const FAB_SIZE = 52;

/**
 * True when the active route is a browse product detail screen.
 * Pathnames are group-stripped (`/browse/:id`), matching `usePathname()`.
 *
 * **PDP rule (Agent 2 → Agent 3):** Hide the Atelier FAB on ProductDetail so it
 * does not cover the sticky Add CTA. Agent 3 should keep this hide-on-PDP
 * behavior (do not also reserve FAB bottom padding on PDP unless this rule changes).
 */
function isBrowseProductDetailPath(pathname: string): boolean {
  const trimmed =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const segments = trimmed.split("/").filter((segment) => segment.length > 0);
  return segments.length === 2 && segments[0] === "browse";
}

/**
 * True when the active route is Highlights (tab or profile stack).
 * Pathnames are group-stripped (`/highlights`, `/profile/highlights`).
 *
 * Hide the FAB so it does not cover full-bleed journal chapter chrome.
 */
function isHighlightsPath(pathname: string): boolean {
  const trimmed =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const segments = trimmed.split("/").filter((segment) => segment.length > 0);
  return segments.includes("highlights");
}

/**
 * Bottom padding applied to the tab bar in `app/(tabs)/_layout.tsx`.
 * Android uses a floor of 24 so the FAB clears the bar when insets are 0.
 */
function tabBarBottomPadding(insetsBottom: number): number {
  if (Platform.OS === "android") {
    return Math.max(insetsBottom, 24);
  }
  return insetsBottom;
}

/**
 * Atelier cart chrome — floating bag FAB above the bottom tab bar.
 *
 * Mounted via {@link CartChromeHost} inside `(tabs)/_layout` so auth/checkout
 * (outside that shell) never show the FAB. Anchors `home.bag` so App Guide
 * coach-marks still resolve when Home has no header bag.
 *
 * Hidden on browse ProductDetail (see {@link isBrowseProductDetailPath}) so the
 * sticky Add control stays clear, and on Highlights (see {@link isHighlightsPath})
 * so the FAB does not cover full-bleed journal chapter chrome.
 */
export function AtelierCartChrome(): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { pack } = useTheme();
  const tokens = useThemeTokens();
  const { t } = useTranslation();

  const hideOnProductDetail = isBrowseProductDetailPath(pathname);
  const hideOnHighlights = isHighlightsPath(pathname);

  const bottomOffset = useMemo((): number => {
    const row = pack.tabBar.minHeight ?? DEFAULT_TAB_BAR_ROW_HEIGHT;
    const bottomPad = tabBarBottomPadding(insets.bottom);
    // Optical align: tab row + safe/android pad + calm gap (matches tabs shell).
    return row + bottomPad + FAB_GAP_ABOVE_TAB_BAR;
  }, [pack.tabBar.minHeight, insets.bottom]);

  if (hideOnProductDetail || hideOnHighlights) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      <TourAnchor
        id={ANCHORS.home.bag}
        style={{
          position: "absolute",
          right: 20,
          bottom: bottomOffset,
        }}
      >
        {/*
          Chrome lives on CartButton itself — one FAB_SIZE hit target.
          Do not wrap an already-sized CartButton in a second FAB_SIZE circle
          (that left-shifted the glyph). CartButton centers bag-outline via
          PressableScale `centerContent`; badge sits on the FAB top-right rim.
        */}
        <CartButton
          color="#FFFFFF"
          size={FAB_SIZE}
          iconSize={22}
          badgeOffset={{ top: 0, right: 0 }}
          accessibilityLabel={t("nav.openCart")}
          style={{
            borderRadius: FAB_SIZE / 2,
            backgroundColor: tokens.text,
            overflow: "visible",
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.16,
            shadowRadius: 8,
            elevation: 5,
          }}
        />
      </TourAnchor>
    </View>
  );
}
