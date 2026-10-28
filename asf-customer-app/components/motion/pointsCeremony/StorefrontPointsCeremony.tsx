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
import { hapticSuccess } from "@/lib/haptics";
import { motionEasing } from "@/lib/motion";

import {
  resolveA11yLabel,
  resolveCeremonyLabels,
  resolveHoldMs,
} from "./resolveLabels";
import type { PointsCeremonyProps } from "./types";

/** Pride-pulse entrance duration (scale settle). */
const PULSE_IN_MS = 320;

/** Soft fade on exit. */
const EXIT_MS = 260;

/** Brief hold — pride pulse without trapping gestures. */
const STOREFRONT_HOLD_MS = 900;

/**
 * Storefront points ceremony — lookbook / flagship pride pulse.
 *
 * Centered larger medal plate with a scale pulse (0.86 → 1.06 → 1),
 * gold ring, success haptic. Absolute overlay with `pointerEvents="none"`
 * so PDP scroll and image swipes are never blocked.
 */
export function StorefrontPointsCeremony({
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
  const scale = useSharedValue(0.86);
  const ringOpacity = useSharedValue(0);

  const holdDuration = resolveHoldMs(holdMs, STOREFRONT_HOLD_MS);
  const { title, pointsLine } = resolveCeremonyLabels(
    points,
    titleLabel,
    pointsLabel
  );

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    if (!visible) {
      opacity.value = 0;
      scale.value = 0.86;
      ringOpacity.value = 0;
      return;
    }

    void hapticSuccess();

    const dismissAfterExit = (): void => {
      onDismiss();
    };

    if (skipAnimation) {
      opacity.value = 1;
      scale.value = 1;
      ringOpacity.value = 0.5;
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
    scale.value = 0.86;
    ringOpacity.value = 0;

    opacity.value = withTiming(1, {
      duration: PULSE_IN_MS,
      easing: motionEasing,
    });
    scale.value = withSequence(
      withTiming(1.06, {
        duration: Math.round(PULSE_IN_MS * 0.65),
        easing: motionEasing,
      }),
      withTiming(1, {
        duration: Math.round(PULSE_IN_MS * 0.45),
        easing: motionEasing,
      })
    );
    ringOpacity.value = withSequence(
      withTiming(0.7, {
        duration: Math.round(PULSE_IN_MS * 0.5),
        easing: motionEasing,
      }),
      withTiming(0.35, {
        duration: Math.round(PULSE_IN_MS * 0.7),
        easing: motionEasing,
      })
    );

    holdTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: EXIT_MS,
          easing: motionEasing,
        },
        (finished) => {
          if (finished) {
            runOnJS(dismissAfterExit)();
          }
        }
      );
      scale.value = withTiming(0.94, {
        duration: EXIT_MS,
        easing: motionEasing,
      });
      ringOpacity.value = withTiming(0, {
        duration: EXIT_MS,
        easing: motionEasing,
      });
    }, PULSE_IN_MS + holdDuration);

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
    scale,
    ringOpacity,
  ]);

  const medalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
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
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        accessibilityLabel={a11yLabel}
        style={[{ alignItems: "center" }, medalStyle]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              width: 168,
              height: 168,
              borderRadius: 84,
              borderWidth: 2,
              borderColor: tokens.accent,
            },
            ringStyle,
          ]}
        />
        <View
          style={{
            width: 148,
            minHeight: 148,
            borderRadius: 74,
            backgroundColor: tokens.text,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 20,
            paddingHorizontal: 16,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: tokens.accent,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              marginTop: 8,
              fontFamily: fonts.display,
              fontSize: 28,
              lineHeight: 34,
              color: tokens.bg,
              textAlign: "center",
            }}
          >
            {pointsLine}
          </Text>
          <View
            style={{
              marginTop: 10,
              width: 28,
              height: 2,
              backgroundColor: tokens.accent,
              borderRadius: 1,
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}
