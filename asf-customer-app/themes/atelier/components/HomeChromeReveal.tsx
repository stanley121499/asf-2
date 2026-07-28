"use client";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANCHORS, TourAnchor } from "@/components/guide";
import { useThemeTokens } from "@/context/ThemeContext";
import { motionEasing } from "@/lib/motion";
import { tenantBrand } from "@/lib/tenantBrand";
import { atelierMotion } from "@/themes/atelier/motion";

type AtelierHomeChromeRevealProps = {
  /** When true, fade in brand + search (scroll past cover, or reduced-motion shortcut). */
  revealed: boolean;
  /** Opens Shop / browse search surface. */
  onSearchPress: () => void;
  /** Accessible label for the search control. */
  searchAccessibilityLabel: string;
};

/**
 * Minimal Atelier Home chrome — brand wordmark + search.
 *
 * **Chrome choice (Agent 2):** Scroll-reveal after leaving the cover (see
 * {@link atelierMotion.chromeRevealCoverFraction}). Reduced motion uses a
 * short timed reveal so search stays reachable without scrolling. First paint
 * stays chrome-free (opacity 0) — no persistent Classic-style top nav.
 *
 * **Guide:** `home.search` stays mounted while hidden so App Guide can
 * late-resolve / spotlight without hard-crashing. Cart remains the FAB.
 */
export function AtelierHomeChromeReveal({
  revealed,
  onSearchPress,
  searchAccessibilityLabel,
}: AtelierHomeChromeRevealProps): React.ReactElement {
  const tokens = useThemeTokens();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    const durationMs =
      reducedMotion === true ? 0 : atelierMotion.duration.chromeFadeMs;
    opacity.value = withTiming(revealed ? 1 : 0, {
      duration: durationMs,
      easing: motionEasing,
    });
  }, [revealed, reducedMotion, opacity]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: tokens.bg,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
        },
        barStyle,
      ]}
      accessibilityElementsHidden={!revealed}
      importantForAccessibility={revealed ? "yes" : "no-hide-descendants"}
    >
      <Text
        style={{
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 15,
          letterSpacing: 2.4,
          color: tokens.text,
          fontWeight: "600",
        }}
        numberOfLines={1}
      >
        {tenantBrand.displayName}
      </Text>
      {/*
        Always mounted — visible when `revealed`, still hit-testable while
        opacity is 0 so first-launch / topic tours can resolve home.search.
      */}
      <TourAnchor id={ANCHORS.home.search}>
        <Pressable
          onPress={onSearchPress}
          hitSlop={8}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={searchAccessibilityLabel}
        >
          <Ionicons name="search-outline" size={22} color={tokens.text} />
        </Pressable>
      </TourAnchor>
    </Animated.View>
  );
}
