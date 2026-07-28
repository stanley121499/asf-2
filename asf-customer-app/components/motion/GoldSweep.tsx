import React, { useEffect, useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/constants/theme";
import { motion, motionEasing } from "@/lib/motion";

export type GoldSweepProps = {
  /** When true, runs the gold wipe; when false, renders final full-width line. */
  play: boolean;
  /**
   * Delay before the sweep starts (ms).
   * Defaults to 0 — compose with home/shop ceremony delays at the call site.
   */
  delayMs?: number;
  /** Line thickness in px. Defaults to 1.5. */
  height?: number;
  /** Accent color. Defaults to fashion retail gold (`colors.accent`). */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Thin gold accent wipe — light sweeps left→right across a full-width track.
 * Reuse on home amplify and Shop first-land headers. Reduced motion shows the
 * settled full-width line immediately.
 */
export function GoldSweep({
  play,
  delayMs = 0,
  height = 1.5,
  color = colors.accent,
  style,
}: GoldSweepProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = !play || reducedMotion === true;

  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(skipAnimation ? 1 : 0);

  useEffect(() => {
    if (skipAnimation) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    const safeDelay =
      typeof delayMs === "number" && Number.isFinite(delayMs) && delayMs > 0
        ? delayMs
        : 0;

    progress.value = withDelay(
      safeDelay,
      withTiming(1, {
        duration: motion.duration.lightSweep,
        easing: motionEasing,
      })
    );
  }, [skipAnimation, delayMs, progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    width: trackWidth * progress.value,
  }));

  if (skipAnimation) {
    return (
      <View
        style={[
          {
            height,
            width: "100%",
            backgroundColor: color,
            borderRadius: 1,
            overflow: "hidden",
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && nextWidth !== trackWidth) {
          setTrackWidth(nextWidth);
        }
      }}
      style={[
        {
          height,
          width: "100%",
          backgroundColor: "transparent",
          borderRadius: 1,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: "100%",
            backgroundColor: color,
            borderRadius: 1,
          },
          sweepStyle,
        ]}
      />
    </View>
  );
}
