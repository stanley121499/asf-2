import React, { useEffect, useRef } from "react";
import { Text, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/constants/theme";
import { motion, motionEasing } from "@/lib/motion";

/** Stronger overshoot for day-to-day add-to-bag catch (vs ambient settle). */
const BADGE_CATCH_PEAK = 1.28;

export type AnimatedBadgeProps = {
  /**
   * Displayed count (or string label). Badge is hidden when the numeric
   * value is 0, or when an empty string is passed.
   */
  count: number | string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

/**
 * Parses the badge value to a non-negative integer for compare / hide logic.
 * Non-numeric strings yield `null` (always shown if non-empty).
 */
function parseBadgeCount(count: number | string): number | null {
  if (typeof count === "number") {
    if (!Number.isFinite(count) || count < 0) {
      return 0;
    }
    return Math.floor(count);
  }
  const trimmed = count.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(0, Math.floor(parsed));
}

/**
 * Small cart-style badge. When the displayed numeric count **increases**,
 * runs a scale pop: `0 → motion.scale.badgePeak → 1`. Hidden at count 0.
 */
export function AnimatedBadge({
  count,
  style,
  textStyle,
  accessibilityLabel,
}: AnimatedBadgeProps): React.ReactElement | null {
  const reducedMotion = useReducedMotion();
  const numeric = parseBadgeCount(count);
  const label = typeof count === "number" ? String(Math.floor(count)) : count.trim();
  const previousNumericRef = useRef<number | null>(numeric);

  const scale = useSharedValue(1);

  useEffect(() => {
    const previous = previousNumericRef.current;
    previousNumericRef.current = numeric;

    if (numeric === null) {
      return;
    }
    if (numeric === 0) {
      return;
    }
    const increased =
      previous === null || previous === 0 || (previous !== null && numeric > previous);
    if (!increased) {
      return;
    }

    /** Reduced motion: snap to final scale — no catch pop. */
    if (reducedMotion === true) {
      scale.value = 1;
      return;
    }

    /**
     * Clear overshoot catch when the bag count rises (e.g. add-to-bag while
     * home stays mounted under tabs). Peak is stronger than ambient badgePeak.
     */
    const peak =
      BADGE_CATCH_PEAK > motion.scale.badgePeak
        ? BADGE_CATCH_PEAK
        : motion.scale.badgePeak;

    scale.value = 0;
    scale.value = withSequence(
      withTiming(peak, {
        duration: motion.duration.fast,
        easing: motionEasing,
      }),
      withTiming(1, {
        duration: motion.duration.press,
        easing: motionEasing,
      })
    );
  }, [numeric, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (numeric === 0 || label.length === 0) {
    return null;
  }

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          minWidth: 18,
          height: 18,
          paddingHorizontal: 5,
          borderRadius: 9,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
        animatedStyle,
      ]}
    >
      <Text
        style={[
          {
            fontSize: 11,
            lineHeight: 14,
            fontFamily: "Inter_400Regular",
            color: colors.bg,
            fontWeight: "600",
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
