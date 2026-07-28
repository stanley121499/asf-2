import React, { useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { motion, motionEasing } from "@/lib/motion";

/** Subtle upward travel for staggered ceremony reveals (px). */
const CEREMONY_TRANSLATE_Y = 14;

export type CeremonySectionProps = {
  /** Zero-based stagger index in the home (or other) ceremony sequence. */
  index: number;
  /** When true, run the staggered entrance; when false, render final state. */
  play: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Override for the base delay before this section's stagger.
   * Defaults to `motion.delay.postSplashBreathe`.
   */
  baseDelayMs?: number;
  /**
   * Gap between stagger indices. Defaults to `motion.delay.stagger`.
   * Use `motion.delay.dailyStagger` for day-to-day bold surfaces.
   */
  staggerMs?: number;
  /**
   * Entrance duration. Defaults to `motion.duration.ceremonyStep`.
   * Use `motion.duration.dailyEntrance` for bolder storefront / shop landings.
   */
  durationMs?: number;
  /**
   * When set, also animates scale from this value → 1 (e.g. hero `motion.scale.heroStartBold`).
   */
  scaleFrom?: number;
  /**
   * Starting translateY in px (animates to 0). Defaults to a soft rise.
   * Pass `0` for a fade-only entrance (e.g. Atelier chapter variation).
   */
  translateFrom?: number;
};

/**
 * Staggered opacity + translateY entrance for ceremony sections.
 * Optional `scaleFrom` adds a settle-from-scale (hero). Does not fire haptics —
 * the orchestrator (e.g. HomeArrivalCeremony) owns those.
 *
 * When `play` is false or reduced motion is on, children render at final opacity/position.
 */
export function CeremonySection({
  index,
  play,
  children,
  style,
  baseDelayMs,
  staggerMs,
  durationMs,
  scaleFrom,
  translateFrom,
}: CeremonySectionProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = !play || reducedMotion === true;
  const useScale = typeof scaleFrom === "number";
  const resolvedStagger =
    typeof staggerMs === "number" && Number.isFinite(staggerMs) && staggerMs >= 0
      ? staggerMs
      : motion.delay.stagger;
  const resolvedDuration =
    typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > 0
      ? durationMs
      : motion.duration.ceremonyStep;
  const resolvedTranslateFrom =
    typeof translateFrom === "number" && Number.isFinite(translateFrom)
      ? translateFrom
      : CEREMONY_TRANSLATE_Y;

  const opacity = useSharedValue(skipAnimation ? 1 : 0);
  const translateY = useSharedValue(
    skipAnimation ? 0 : resolvedTranslateFrom
  );
  const scale = useSharedValue(
    skipAnimation || !useScale ? 1 : scaleFrom
  );

  useEffect(() => {
    if (skipAnimation) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }

    const delayMs =
      (baseDelayMs ?? motion.delay.postSplashBreathe) + index * resolvedStagger;

    opacity.value = 0;
    translateY.value = resolvedTranslateFrom;

    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: resolvedDuration,
        easing: motionEasing,
      })
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, {
        duration: resolvedDuration,
        easing: motionEasing,
      })
    );
    if (useScale) {
      scale.value = scaleFrom;
      scale.value = withDelay(
        delayMs,
        withTiming(1, {
          duration: resolvedDuration,
          easing: motionEasing,
        })
      );
    }
  }, [
    skipAnimation,
    baseDelayMs,
    index,
    resolvedStagger,
    resolvedDuration,
    resolvedTranslateFrom,
    opacity,
    translateY,
    scale,
    useScale,
    scaleFrom,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const transforms: Array<{ translateY: number } | { scale: number }> = [
      { translateY: translateY.value },
    ];
    if (useScale) {
      transforms.push({ scale: scale.value });
    }
    return {
      opacity: opacity.value,
      transform: transforms,
    };
  });

  if (skipAnimation) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
