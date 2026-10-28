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

/** Soft upward travel for the editorial plate (px). */
const PLATE_TRANSLATE_Y = 18;

/** Entrance duration — slower, magazine settle. */
const ENTRANCE_MS = 400;

/** Brief hold — plate is decorative and must not feel sticky. */
const ATELIER_HOLD_MS = 900;

/**
 * Atelier points ceremony — editorial type-forward plate.
 *
 * Centered soft plate with display-face +N, slower fade/rise entrance.
 * Warm paper tokens; no sharp edge flash. Non-blocking overlay
 * (`pointerEvents="none"`) so PDP gestures stay free.
 */
export function AtelierPointsCeremony({
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
  const translateY = useSharedValue(PLATE_TRANSLATE_Y);
  const scale = useSharedValue(0.96);

  const holdDuration = resolveHoldMs(holdMs, ATELIER_HOLD_MS);
  const { title, pointsLine } = resolveCeremonyLabels(
    points,
    titleLabel,
    pointsLabel
  );

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    if (!visible) {
      opacity.value = 0;
      translateY.value = PLATE_TRANSLATE_Y;
      scale.value = 0.96;
      return;
    }

    void hapticLight();

    const dismissAfterExit = (): void => {
      onDismiss();
    };

    if (skipAnimation) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
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
    translateY.value = PLATE_TRANSLATE_Y;
    scale.value = 0.96;

    opacity.value = withTiming(1, {
      duration: ENTRANCE_MS,
      easing: motionEasing,
    });
    translateY.value = withTiming(0, {
      duration: ENTRANCE_MS,
      easing: motionEasing,
    });
    scale.value = withTiming(1, {
      duration: ENTRANCE_MS,
      easing: motionEasing,
    });

    holdTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: motion.duration.base,
          easing: motionEasing,
        },
        (finished) => {
          if (finished) {
            runOnJS(dismissAfterExit)();
          }
        }
      );
      translateY.value = withTiming(-10, {
        duration: motion.duration.base,
        easing: motionEasing,
      });
      scale.value = withTiming(0.98, {
        duration: motion.duration.base,
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
    translateY,
    scale,
  ]);

  const plateStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
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
          alignItems: "center",
          paddingTop: Math.max(insets.top, 12) + 48,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        accessibilityLabel={a11yLabel}
        style={[{ width: "78%", maxWidth: 320 }, plateStyle]}
      >
        <View
          style={{
            paddingVertical: 22,
            paddingHorizontal: 24,
            backgroundColor: tokens.panel,
            borderWidth: 1,
            borderColor: tokens.border,
            borderRadius: 2,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              color: tokens.muted,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          <View
            style={{
              marginTop: 14,
              marginBottom: 4,
              height: 1,
              backgroundColor: tokens.accent,
              opacity: 0.55,
              alignSelf: "center",
              width: 40,
            }}
          />
          <Text
            numberOfLines={1}
            style={{
              marginTop: 10,
              fontFamily: fonts.display,
              fontSize: 32,
              lineHeight: 38,
              color: tokens.text,
              textAlign: "center",
            }}
          >
            {pointsLine}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
