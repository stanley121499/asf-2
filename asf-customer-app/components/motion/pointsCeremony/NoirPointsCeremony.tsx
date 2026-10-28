import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/constants/theme";
import { useThemeTokens } from "@/context/ThemeContext";
import { hapticMedium } from "@/lib/haptics";
import { motionEasing } from "@/lib/motion";

import {
  resolveA11yLabel,
  resolveCeremonyLabels,
  resolveHoldMs,
} from "./resolveLabels";
import type { PointsCeremonyProps } from "./types";

/** Sharp horizontal travel for the night-retail blade (px). */
const BLADE_TRANSLATE_X = 56;

/** Fast knife-edge entrance. */
const ENTRANCE_MS = 160;

/** Brief flash peak before settle. */
const FLASH_MS = 90;

/** Short hold — sharp beat, then gone; never blocks gestures. */
const NOIR_HOLD_MS = 750;

/**
 * Noir points ceremony — night retail blade flash.
 *
 * Dark high-contrast plate slides from the right with a brief accent flash,
 * then holds. Decorative only (`pointerEvents="none"`) so scroll / gallery
 * pans work immediately.
 */
export function NoirPointsCeremony({
  visible,
  points,
  titleLabel,
  pointsLabel,
  onDismiss,
  holdMs,
  style,
  accessibilityLabel,
}: PointsCeremonyProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const reducedMotion = useReducedMotion();
  const skipAnimation = reducedMotion === true;

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(BLADE_TRANSLATE_X);
  const flashOpacity = useSharedValue(0);

  const holdDuration = resolveHoldMs(holdMs, NOIR_HOLD_MS);
  const { title, pointsLine } = resolveCeremonyLabels(
    points,
    titleLabel,
    pointsLabel
  );

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    if (!visible) {
      opacity.value = 0;
      translateX.value = BLADE_TRANSLATE_X;
      flashOpacity.value = 0;
      return;
    }

    void hapticMedium();

    const dismissAfterExit = (): void => {
      onDismiss();
    };

    if (skipAnimation) {
      opacity.value = 1;
      translateX.value = 0;
      flashOpacity.value = 0;
      holdTimer = setTimeout(() => {
        opacity.value = 0;
        dismissAfterExit();
      }, holdDuration);
      return () => {
        if (holdTimer !== undefined) {
          clearTimeout(holdTimer);
        }
      };
    }

    opacity.value = 0;
    translateX.value = BLADE_TRANSLATE_X;
    flashOpacity.value = 0;

    opacity.value = withTiming(1, {
      duration: ENTRANCE_MS,
      easing: motionEasing,
    });
    translateX.value = withTiming(0, {
      duration: ENTRANCE_MS,
      easing: motionEasing,
    });
    flashOpacity.value = withSequence(
      withTiming(0.85, { duration: FLASH_MS, easing: motionEasing }),
      withTiming(0, { duration: ENTRANCE_MS, easing: motionEasing })
    );

    holdTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: ENTRANCE_MS,
          easing: motionEasing,
        },
        (finished) => {
          if (finished) {
            runOnJS(dismissAfterExit)();
          }
        }
      );
      translateX.value = withTiming(BLADE_TRANSLATE_X, {
        duration: ENTRANCE_MS,
        easing: motionEasing,
      });
    }, ENTRANCE_MS + holdDuration);

    return () => {
      if (holdTimer !== undefined) {
        clearTimeout(holdTimer);
      }
    };
  }, [
    visible,
    skipAnimation,
    holdDuration,
    onDismiss,
    opacity,
    translateX,
    flashOpacity,
  ]);

  const bladeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  const a11yLabel = resolveA11yLabel(accessibilityLabel, title, pointsLine);

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: 80,
          elevation: 80,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: Math.max(insets.top, 12) + 6,
            right: 0,
            left: 0,
            height: 2,
            backgroundColor: tokens.accent,
          },
          flashStyle,
        ]}
      />

      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        accessibilityLabel={a11yLabel}
        style={[
          {
            position: "absolute",
            top: Math.max(insets.top, 12) + 16,
            right: 0,
            maxWidth: 300,
          },
          bladeStyle,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "stretch",
            backgroundColor: tokens.panel,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderWidth: 1,
            borderRightWidth: 0,
            borderColor: tokens.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: 4,
              backgroundColor: tokens.accent,
            }}
          />
          <View
            style={{
              paddingVertical: 14,
              paddingHorizontal: 16,
              paddingRight: 20,
              minWidth: 160,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 10,
                lineHeight: 13,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: tokens.accent,
                fontWeight: "700",
              }}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: 4,
                fontFamily: fonts.sans,
                fontSize: 20,
                lineHeight: 24,
                color: tokens.text,
                fontWeight: "700",
              }}
            >
              {pointsLine}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
