import React from "react";
import {
  Pressable,
  type AccessibilityRole,
  type AccessibilityState,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { hapticLight, hapticMedium, hapticSelection } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

/** Optional haptic fired on press-in (finger down). Default `"none"`. */
export type PressableScaleHaptic = "none" | "light" | "medium" | "selection";

export type PressableScaleProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Expands the touch target beyond the visual bounds (e.g. back / icon controls). */
  hitSlop?: number | Insets;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  /** Merged with `{ disabled }` for screen readers. */
  accessibilityState?: AccessibilityState;
  /**
   * Haptic on press-in. Defaults to `"none"` so callers opt in intentionally
   * (Agent 4 wires light/medium/selection on high-traffic surfaces).
   */
  haptic?: PressableScaleHaptic;
  /**
   * Centers `children` (both axes) inside the inner Animated.View instead of
   * the default column stretch. Opt-in and off by default so existing
   * row-layout / %-width callers (`ProductCard`, `MenuRow`, etc.) that rely on
   * the stretch behavior are unaffected.
   *
   * Without this, a bare `Text` (or `ActivityIndicator`) child renders
   * flush-left: the inner Animated.View always stretches to the outer
   * Pressable's width (so `style="width: 100%"` etc. keep working), but its
   * own default `alignItems` is `"stretch"`, which then stretches a bare
   * Text grandchild full-width — and RN Text defaults to `textAlign: "left"`.
   * Setting `alignItems`/`justifyContent: "center"` on the Animated.View
   * itself (not the outer Pressable, which has no effect here) fixes this
   * for single-child CTA labels without needing a caller-side wrapper View.
   */
  centerContent?: boolean;
};

/**
 * Runs the matching haptic helper. Called on press-in for tactile feedback
 * as soon as the finger lands (not on release).
 */
function fireHaptic(kind: PressableScaleHaptic): void {
  switch (kind) {
    case "light":
      void hapticLight();
      break;
    case "medium":
      void hapticMedium();
      break;
    case "selection":
      void hapticSelection();
      break;
    case "none":
      break;
  }
}

/**
 * Pressable with a subtle scale-down (~`motion.scale.press`) while pressed.
 * Disabled: no scale animation and no haptic.
 */
export function PressableScale({
  children,
  onPress,
  style,
  disabled = false,
  hitSlop,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  haptic = "none",
  centerContent = false,
}: PressableScaleProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (): void => {
    if (disabled) {
      return;
    }
    scale.value = withTiming(motion.scale.press, {
      duration: motion.duration.press,
      easing: motionEasing,
    });
    fireHaptic(haptic);
  };

  const handlePressOut = (): void => {
    if (disabled) {
      return;
    }
    scale.value = withTiming(1, {
      duration: motion.duration.press,
      easing: motionEasing,
    });
  };

  /**
   * Apply `style` on Pressable (not the inner view) so percentage widths /
   * flex layout resolve against the real parent (e.g. ProductCard `width: "48%"`).
   * Scale stays on Animated.View; default column stretch fills the press target.
   */
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={style}
    >
      <Animated.View
        style={[
          animatedStyle,
          { alignSelf: "stretch" },
          centerContent ? { alignItems: "center", justifyContent: "center" } : null,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
