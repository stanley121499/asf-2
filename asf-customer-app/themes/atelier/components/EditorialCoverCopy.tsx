"use client";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useThemeTokens } from "@/context/ThemeContext";
import { motionEasing } from "@/lib/motion";
import { atelierMotion } from "@/themes/atelier/motion";

type CoverCopyTone = "onImage" | "onPaper";

type AtelierEditorialCoverCopyProps = {
  /** When true (once-per-session ceremony), stagger eyebrow → title → body. */
  play: boolean;
  /** Delay before the first line (cover section base). */
  baseDelayMs: number;
  eyebrow: string;
  title: string;
  body: string;
  /** Light type over hero image vs ink on paper. */
  tone: CoverCopyTone;
  /** Max width for the body line. */
  bodyMaxWidth?: number;
};

/**
 * Staggered editorial cover copy for Atelier Home.
 * Runs inside the cover CeremonySection so type leads the chapter cascade.
 * Skips to final state when `play` is false or reduced motion is on.
 */
export function AtelierEditorialCoverCopy({
  play,
  baseDelayMs,
  eyebrow,
  title,
  body,
  tone,
  bodyMaxWidth = 300,
}: AtelierEditorialCoverCopyProps): React.ReactElement {
  const tokens = useThemeTokens();
  const reducedMotion = useReducedMotion();
  const skip = !play || reducedMotion === true;

  const eyebrowOpacity = useSharedValue(skip ? 1 : 0);
  const titleOpacity = useSharedValue(skip ? 1 : 0);
  const bodyOpacity = useSharedValue(skip ? 1 : 0);
  const titleY = useSharedValue(skip ? 0 : 10);
  const bodyY = useSharedValue(skip ? 0 : 8);

  useEffect(() => {
    if (skip) {
      eyebrowOpacity.value = 1;
      titleOpacity.value = 1;
      bodyOpacity.value = 1;
      titleY.value = 0;
      bodyY.value = 0;
      return;
    }

    const lineMs = atelierMotion.duration.coverLineMs;
    const gap = atelierMotion.delay.coverLineStaggerMs;

    eyebrowOpacity.value = withDelay(
      baseDelayMs,
      withTiming(1, { duration: lineMs, easing: motionEasing })
    );
    titleOpacity.value = withDelay(
      baseDelayMs + gap,
      withTiming(1, { duration: lineMs, easing: motionEasing })
    );
    titleY.value = withDelay(
      baseDelayMs + gap,
      withTiming(0, { duration: lineMs, easing: motionEasing })
    );
    bodyOpacity.value = withDelay(
      baseDelayMs + gap * 2,
      withTiming(1, { duration: lineMs, easing: motionEasing })
    );
    bodyY.value = withDelay(
      baseDelayMs + gap * 2,
      withTiming(0, { duration: lineMs, easing: motionEasing })
    );
  }, [
    skip,
    baseDelayMs,
    eyebrowOpacity,
    titleOpacity,
    bodyOpacity,
    titleY,
    bodyY,
  ]);

  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: eyebrowOpacity.value,
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [{ translateY: bodyY.value }],
  }));

  const onImage = tone === "onImage";
  const eyebrowColor = onImage ? "#F6F1E8" : tokens.muted;
  const titleColor = onImage ? "#F6F1E8" : tokens.text;
  const bodyColor = onImage ? "rgba(246,241,232,0.88)" : tokens.muted;

  return (
    <View>
      <Animated.View style={eyebrowStyle}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            letterSpacing: 2.4,
            textTransform: "uppercase",
            color: eyebrowColor,
            marginBottom: onImage ? 10 : 12,
          }}
        >
          {eyebrow}
        </Text>
      </Animated.View>
      <Animated.View style={titleStyle}>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 40,
            lineHeight: 48,
            color: titleColor,
            marginBottom: onImage ? 10 : 12,
          }}
        >
          {title}
        </Text>
      </Animated.View>
      <Animated.View style={bodyStyle}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: onImage ? 14 : 15,
            lineHeight: onImage ? 21 : 22,
            color: bodyColor,
            maxWidth: bodyMaxWidth,
          }}
        >
          {body}
        </Text>
      </Animated.View>
    </View>
  );
}
