import React from "react";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from "react-native-reanimated";

import { HeroCoverMedia } from "@/components/designPreview/home/HeroCoverMedia";
import {
  HERO_VARIANT_C_COLLAPSED_STRIP,
  HERO_VARIANT_CATEGORY_RAIL_HEIGHT,
} from "@/components/designPreview/home/heroVariantLayout";
import {
  StorefrontHomeCategoryRail,
  type StorefrontHomeCategoryRailProps,
} from "@/components/storefront/StorefrontHomeCategoryRail";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type CollapsingStickyHeroProps = {
  /** Tall hero height at scroll offset 0. */
  expandedHeight: number;
  /** Hero cover URI. */
  uri: string;
  /** Remount / recycling identity for the cover image. */
  mediaKey: string;
  /** Hero press → linked products. */
  onPress: () => void;
  /** Accessibility label for the hero. */
  accessibilityLabel: string;
  /** Shared scroll Y from the parent FlatList scroll handler. */
  scrollY: SharedValue<number>;
  /** Top offset under fixed nav chrome (absolute positioning). */
  topOffset: number;
  /**
   * Category rail props (sticky under the collapsing strip).
   * Omit when Home hides the category bar (`SHOW_HOME_CATEGORY_BAR`).
   */
  categoryRail?: StorefrontHomeCategoryRailProps;
};

/**
 * Variant C — grand hero that collapses toward a thin media strip with a
 * sticky category bar pinned under fixed nav chrome while the body scrolls.
 *
 * Parent FlatList must keep a **constant** `paddingTop` equal to
 * `topOffset + expandedHeight + rail` so content does not jump as the
 * absolute header shrinks.
 *
 * Media uses `pointerEvents="none"` so vertical pans reach the FlatList
 * underneath (an absolute grand hero would otherwise swallow scroll). Hero
 * press is owned by an in-list hit target in Home. Category chips stay
 * interactive via `pointerEvents="auto"` on the sticky rail.
 */
export function CollapsingStickyHero({
  expandedHeight,
  uri,
  mediaKey,
  onPress,
  accessibilityLabel,
  scrollY,
  topOffset,
  categoryRail,
}: CollapsingStickyHeroProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipMotion = reducedMotion === true;
  const railHeight =
    categoryRail !== undefined ? HERO_VARIANT_CATEGORY_RAIL_HEIGHT : 0;

  const safeExpanded = Math.max(
    HERO_VARIANT_C_COLLAPSED_STRIP,
    Number.isFinite(expandedHeight)
      ? expandedHeight
      : HERO_VARIANT_C_COLLAPSED_STRIP
  );
  const collapseDistance = Math.max(
    0,
    safeExpanded - HERO_VARIANT_C_COLLAPSED_STRIP
  );

  const heroAnimatedStyle = useAnimatedStyle(() => {
    if (skipMotion) {
      return { height: safeExpanded };
    }
    const height = interpolate(
      scrollY.value,
      [0, collapseDistance],
      [safeExpanded, HERO_VARIANT_C_COLLAPSED_STRIP],
      Extrapolation.CLAMP
    );
    return { height };
  }, [collapseDistance, safeExpanded, skipMotion]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    if (skipMotion) {
      return {
        height: safeExpanded + railHeight,
      };
    }
    const heroHeight = interpolate(
      scrollY.value,
      [0, collapseDistance],
      [safeExpanded, HERO_VARIANT_C_COLLAPSED_STRIP],
      Extrapolation.CLAMP
    );
    return {
      height: heroHeight + railHeight,
    };
  }, [collapseDistance, railHeight, safeExpanded, skipMotion]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          top: topOffset,
          left: 0,
          right: 0,
          zIndex: 30,
          backgroundColor: tokens.bg,
          overflow: "hidden",
        },
        containerAnimatedStyle,
      ]}
    >
      {/*
        Visual-only media: must not capture touches or the grand expanded
        frame blocks FlatList scrolling for the entire first viewport.
      */}
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={[{ width: "100%", overflow: "hidden" }, heroAnimatedStyle]}
      >
        <View style={{ height: safeExpanded, width: "100%" }}>
          <HeroCoverMedia
            uri={uri}
            height={safeExpanded}
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            mediaKey={mediaKey}
            recyclingKey={`variant-c:${mediaKey}`}
          />
        </View>
      </Animated.View>
      {categoryRail !== undefined ? (
        <View
          pointerEvents="auto"
          style={{
            height: HERO_VARIANT_CATEGORY_RAIL_HEIGHT,
            backgroundColor: tokens.bg,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border,
          }}
        >
          <StorefrontHomeCategoryRail
            {...categoryRail}
            style={{
              backgroundColor: "transparent",
              borderBottomWidth: 0,
              borderBottomColor: "transparent",
            }}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}
