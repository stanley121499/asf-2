import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/constants/theme";
import { useThemeTokens } from "@/context/ThemeContext";
import { hapticLight } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

import {
  resolveA11yLabel,
  resolveCeremonyLabels,
  resolveHoldMs,
} from "./resolveLabels";
import type { PointsCeremonyProps } from "./types";

/** Horizontal travel for the compact commerce strip (px). */
const STRIP_TRANSLATE_X = 28;

/** Max width so the strip stays an edge chip. */
const STRIP_MAX_WIDTH = 240;

/**
 * Classic points ceremony — clean commerce edge strip.
 *
 * Compact top-right gold-accent chip: short slide + fade, light haptic.
 * Decorative only (`pointerEvents="none"`) so scroll / gallery swipes are
 * never blocked while the toast plays.
 */
export function ClassicPointsCeremony({
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
  const translateX = useSharedValue(STRIP_TRANSLATE_X);

  const holdDuration = resolveHoldMs(holdMs, motion.delay.achievementHold);
  const slideMs = motion.duration.achievementStrip;
  const { title, pointsLine } = resolveCeremonyLabels(
    points,
    titleLabel,
    pointsLabel
  );

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    if (!visible) {
      opacity.value = 0;
      translateX.value = STRIP_TRANSLATE_X;
      return;
    }

    void hapticLight();

    const dismissAfterExit = (): void => {
      onDismiss();
    };

    if (skipAnimation) {
      opacity.value = 1;
      translateX.value = 0;
      holdTimer = setTimeout(() => {
        opacity.value = 0;
        translateX.value = STRIP_TRANSLATE_X;
        dismissAfterExit();
      }, holdDuration);
      return () => {
        if (holdTimer !== undefined) {
          clearTimeout(holdTimer);
        }
      };
    }

    opacity.value = 0;
    translateX.value = STRIP_TRANSLATE_X;

    opacity.value = withTiming(1, {
      duration: slideMs,
      easing: motionEasing,
    });
    translateX.value = withTiming(0, {
      duration: slideMs,
      easing: motionEasing,
    });

    holdTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: slideMs,
          easing: motionEasing,
        },
        (finished) => {
          if (finished) {
            runOnJS(dismissAfterExit)();
          }
        }
      );
      translateX.value = withTiming(STRIP_TRANSLATE_X, {
        duration: slideMs,
        easing: motionEasing,
      });
    }, slideMs + holdDuration);

    return () => {
      if (holdTimer !== undefined) {
        clearTimeout(holdTimer);
      }
    };
  }, [
    visible,
    skipAnimation,
    holdDuration,
    slideMs,
    onDismiss,
    opacity,
    translateX,
  ]);

  const stripStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
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
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        accessibilityLabel={a11yLabel}
        style={[
          {
            position: "absolute",
            top: Math.max(insets.top, 12) + 8,
            right: 12,
            maxWidth: STRIP_MAX_WIDTH,
          },
          stripStyle,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: tokens.text,
            borderRadius: 4,
            borderLeftWidth: 3,
            borderLeftColor: tokens.accent,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 10,
                lineHeight: 13,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: tokens.accent,
                fontWeight: "600",
              }}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: 2,
                fontFamily: fonts.sans,
                fontSize: 16,
                lineHeight: 20,
                color: tokens.bg,
                fontWeight: "600",
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
