import React, { useCallback, useMemo, useRef } from "react";
import {
  type AccessibilityRole,
  type AccessibilityState,
  type Insets,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { hapticLight, hapticMedium, hapticSelection } from "@/lib/haptics";
import { markInteractionBusy } from "@/lib/interactionBusy";
import { logTapPressFired, markTapStart } from "@/lib/interactionLog";
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
  /**
   * Optional Metro `[tap]` label (dev only). Defaults to `accessibilityLabel`
   * or `"pressable"` when omitted.
   */
  interactionLogLabel?: string;
};

/** Pressed opacity — UI-thread visual feedback alongside scale. */
const PRESS_OPACITY = 0.82;

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
 * Converts hitSlop into Gesture Handler `touchSlop`-adjacent number padding.
 * Gesture.Tap uses `maxDistance`; hit area expansion is applied via style margin
 * is not ideal — we map number hitSlop to `HitSlop` on the detector wrapper.
 */
function normalizeHitSlop(hitSlop: number | Insets | undefined): Insets | undefined {
  if (hitSlop === undefined) {
    return undefined;
  }
  if (typeof hitSlop === "number") {
    return {
      top: hitSlop,
      bottom: hitSlop,
      left: hitSlop,
      right: hitSlop,
    };
  }
  return hitSlop;
}

/**
 * Pressable with a subtle scale-down (~`motion.scale.press`) while pressed.
 *
 * Scale + opacity animate on the **UI thread** via Reanimated worklets
 * (`Gesture.Tap` begin/finalize), so feedback still appears when the JS thread
 * is busy with catalog hydrate / re-renders. `onPress` runs on JS after the
 * gesture succeeds (and marks interaction busy so background hydrate pauses).
 *
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
  interactionLogLabel,
}: PressableScaleProps): React.ReactElement {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  /** Stable refs so the gesture worklet always calls the latest handlers. */
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const hapticRef = useRef(haptic);
  hapticRef.current = haptic;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const logLabelRef = useRef<string>("pressable");
  logLabelRef.current =
    typeof interactionLogLabel === "string" && interactionLogLabel.trim().length > 0
      ? interactionLogLabel.trim()
      : typeof accessibilityLabel === "string" && accessibilityLabel.trim().length > 0
        ? accessibilityLabel.trim()
        : "pressable";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  /**
   * JS-side press-in: start the tap clock (dev Metro) without blocking the
   * UI-thread scale/opacity worklets.
   */
  const handlePressInJs = useCallback((): void => {
    if (disabledRef.current) {
      return;
    }
    markTapStart(logLabelRef.current);
  }, []);

  /**
   * JS-side press handler: mark busy (pauses catalog hydrate) then invoke caller.
   */
  const handlePressJs = useCallback((): void => {
    if (disabledRef.current) {
      return;
    }
    markInteractionBusy(900);
    logTapPressFired(logLabelRef.current);
    onPressRef.current?.();
  }, []);

  /**
   * JS-side haptic — kept off the UI worklet path except via `runOnJS`.
   */
  const handleHapticJs = useCallback((): void => {
    fireHaptic(hapticRef.current);
  }, []);

  /**
   * Accessibility activate (TalkBack / VoiceOver) when there is no gesture.
   */
  const handleAccessibilityActivate = useCallback((): void => {
    handlePressInJs();
    handlePressJs();
  }, [handlePressInJs, handlePressJs]);

  const gesture = useMemo(() => {
    return Gesture.Tap()
      .enabled(!disabled)
      .maxDuration(15_000)
      .onBegin(() => {
        "worklet";
        scale.value = withTiming(motion.scale.press, {
          duration: motion.duration.press,
          easing: motionEasing,
        });
        opacity.value = withTiming(PRESS_OPACITY, {
          duration: motion.duration.press,
          easing: motionEasing,
        });
        runOnJS(handleHapticJs)();
        runOnJS(markInteractionBusy)(900);
        runOnJS(handlePressInJs)();
      })
      .onFinalize(() => {
        "worklet";
        scale.value = withTiming(1, {
          duration: motion.duration.press,
          easing: motionEasing,
        });
        opacity.value = withTiming(1, {
          duration: motion.duration.press,
          easing: motionEasing,
        });
      })
      .onEnd((_event, success) => {
        "worklet";
        if (success) {
          runOnJS(handlePressJs)();
        }
      });
  }, [disabled, handleHapticJs, handlePressInJs, handlePressJs, opacity, scale]);

  /**
   * Expand the touch target without relying on Pressable `hitSlop` (Animated.View
   * does not support it). Negative margin + matching padding grows the hit box
   * while keeping the visual layout aligned with callers.
   */
  const hitSlopStyle = useMemo((): ViewStyle | null => {
    const insets = normalizeHitSlop(hitSlop);
    if (insets === undefined) {
      return null;
    }
    const top = insets.top ?? 0;
    const bottom = insets.bottom ?? 0;
    const left = insets.left ?? 0;
    const right = insets.right ?? 0;
    if (top === 0 && bottom === 0 && left === 0 && right === 0) {
      return null;
    }
    return {
      marginTop: -top,
      marginBottom: -bottom,
      marginLeft: -left,
      marginRight: -right,
      paddingTop: top,
      paddingBottom: bottom,
      paddingLeft: left,
      paddingRight: right,
    };
  }, [hitSlop]);

  /**
   * Apply `style` on the outer Animated.View so percentage widths / flex layout
   * resolve against the real parent (e.g. ProductCard `width: "48%"`).
   * Scale stays on the same view; default column stretch fills the press target.
   */
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible={true}
        accessibilityRole={accessibilityRole ?? "button"}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled, ...accessibilityState }}
        accessibilityActions={[{ name: "activate" }]}
        onAccessibilityAction={(event): void => {
          if (event.nativeEvent.actionName === "activate") {
            handleAccessibilityActivate();
          }
        }}
        style={[
          style,
          hitSlopStyle,
          animatedStyle,
          { alignSelf: "stretch" },
          centerContent ? { alignItems: "center", justifyContent: "center" } : null,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
