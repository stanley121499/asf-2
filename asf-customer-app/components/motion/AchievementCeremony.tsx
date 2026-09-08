import React, { useEffect, useMemo } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/constants/theme";
import { hapticAchievement } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

/** Upward travel for the ceremony strip entrance (px). */
const STRIP_TRANSLATE_Y = 36;

/** Number of gold particles in the burst (skipped under reduced motion). */
const PARTICLE_COUNT = 28;

/** Fashion-retail gold + warm accents for the particle burst. */
const PARTICLE_COLORS = ["#C9A96E", "#E8D5A3", "#FFFFFF", "#B8924A"] as const;

export type AchievementCeremonyProps = {
  /** When true, plays confetti + strip and starts the hold → dismiss cycle. */
  visible: boolean;
  /** Points awarded (shown as +N). Must be > 0 for a meaningful ceremony. */
  points: number;
  /**
   * Uppercase eyebrow above the points line (e.g. i18n “Points earned”).
   * Defaults to English “Points earned” when omitted.
   */
  titleLabel?: string;
  /**
   * Primary strip body. Prefer i18n `+{n} points` / `+{n} 积分`.
   * When omitted, falls back to `+{points}`.
   */
  pointsLabel?: string;
  /** Called when the ceremony finishes exiting (auto-dismiss or manual). */
  onDismiss: () => void;
  /**
   * Milliseconds the strip stays fully visible before exit.
   * Defaults to `motion.delay.achievementHold`.
   */
  holdMs?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

type ParticleSpec = {
  id: number;
  color: string;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotateDeg: number;
  delayMs: number;
};

/**
 * Builds deterministic-enough particle specs from screen size for one burst.
 */
function buildParticleSpecs(width: number, height: number): ParticleSpec[] {
  const originX = width * 0.5;
  const originY = height * 0.42;
  const specs: ParticleSpec[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (i % 3) * 0.17;
    const distance = 90 + (i % 7) * 28;
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length] ?? colors.accent;
    specs.push({
      id: i,
      color,
      size: 5 + (i % 4) * 2,
      startX: originX,
      startY: originY,
      endX: originX + Math.cos(angle) * distance,
      endY: originY + Math.sin(angle) * distance * 0.85 + 40 + (i % 5) * 12,
      rotateDeg: (i % 2 === 0 ? 1 : -1) * (120 + (i % 6) * 40),
      delayMs: (i % 5) * 40,
    });
  }

  return specs;
}

type ParticleProps = {
  spec: ParticleSpec;
  play: boolean;
  burstMs: number;
};

/**
 * Single gold particle — bursts outward then fades.
 */
function CeremonyParticle({
  spec,
  play,
  burstMs,
}: ParticleProps): React.ReactElement {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!play) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      spec.delayMs,
      withTiming(1, {
        duration: burstMs,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [play, burstMs, progress, spec.delayMs]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const x = spec.startX + (spec.endX - spec.startX) * t;
    const y =
      spec.startY +
      (spec.endY - spec.startY) * t +
      18 * t * t;
    const opacity = t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.15) / 0.85);
    const scale = 0.6 + 0.6 * (1 - t);
    return {
      opacity,
      transform: [
        { translateX: x - spec.size / 2 },
        { translateY: y - spec.size / 2 },
        { rotate: `${spec.rotateDeg * t}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size > 8 ? 2 : 1,
          backgroundColor: spec.color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Discovery-points achievement ceremony — stronger 仪式感 than {@link AddedToBagTray}.
 *
 * Plays a gold particle burst (~1.5–2.5s), a heavy success haptic, and a
 * non-blocking strip with “+N points”. Reduced motion: strip + haptic only.
 * Auto-dismisses; never use for nearby-stock notifications.
 */
export function AchievementCeremony({
  visible,
  points,
  titleLabel,
  pointsLabel,
  onDismiss,
  holdMs,
  style,
  accessibilityLabel,
}: AchievementCeremonyProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const skipParticles = reducedMotion === true;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(STRIP_TRANSLATE_Y);

  const holdDuration =
    typeof holdMs === "number" && Number.isFinite(holdMs) && holdMs >= 0
      ? holdMs
      : motion.delay.achievementHold;

  const windowSize = Dimensions.get("window");
  const particles = useMemo(
    () => buildParticleSpecs(windowSize.width, windowSize.height),
    [windowSize.width, windowSize.height]
  );

  const resolvedTitle =
    typeof titleLabel === "string" && titleLabel.trim().length > 0
      ? titleLabel.trim()
      : "Points earned";

  const resolvedPointsLabel =
    typeof pointsLabel === "string" && pointsLabel.trim().length > 0
      ? pointsLabel.trim()
      : `+${points}`;

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    if (!visible) {
      opacity.value = 0;
      translateY.value = STRIP_TRANSLATE_Y;
      return;
    }

    void hapticAchievement();

    const dismissAfterExit = (): void => {
      onDismiss();
    };

    if (skipParticles) {
      opacity.value = 1;
      translateY.value = 0;
      holdTimer = setTimeout(() => {
        opacity.value = 0;
        translateY.value = STRIP_TRANSLATE_Y;
        dismissAfterExit();
      }, holdDuration);
      return () => {
        if (holdTimer !== undefined) {
          clearTimeout(holdTimer);
        }
      };
    }

    opacity.value = 0;
    translateY.value = STRIP_TRANSLATE_Y;

    opacity.value = withTiming(1, {
      duration: motion.duration.achievementStrip,
      easing: motionEasing,
    });
    translateY.value = withTiming(0, {
      duration: motion.duration.achievementStrip,
      easing: motionEasing,
    });

    holdTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: motion.duration.achievementStrip,
          easing: motionEasing,
        },
        (finished) => {
          if (finished) {
            runOnJS(dismissAfterExit)();
          }
        }
      );
      translateY.value = withTiming(STRIP_TRANSLATE_Y, {
        duration: motion.duration.achievementStrip,
        easing: motionEasing,
      });
    }, motion.duration.achievementStrip + holdDuration);

    return () => {
      if (holdTimer !== undefined) {
        clearTimeout(holdTimer);
      }
    };
  }, [
    visible,
    skipParticles,
    holdDuration,
    onDismiss,
    opacity,
    translateY,
  ]);

  const stripStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  const a11yLabel =
    typeof accessibilityLabel === "string" && accessibilityLabel.trim().length > 0
      ? accessibilityLabel.trim()
      : [resolvedTitle, resolvedPointsLabel].join(". ");

  /**
   * Modal keeps confetti + strip above theme PDP chrome (sticky CTA, headers)
   * on real iOS devices where absolute siblings can sit under opaque stacks.
   */
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View
        pointerEvents="box-none"
        style={[
          {
            flex: 1,
            zIndex: 80,
          },
          style,
        ]}
      >
        {!skipParticles ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            {particles.map((spec) => (
              <CeremonyParticle
                key={spec.id}
                spec={spec}
                play={visible}
                burstMs={motion.duration.achievementBurst}
              />
            ))}
          </View>
        ) : null}

        <Animated.View
          pointerEvents="box-none"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          accessibilityLabel={a11yLabel}
          style={[
            {
              position: "absolute",
              left: 16,
              right: 16,
              bottom: Math.max(insets.bottom, 12) + 72,
            },
            stripStyle,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={a11yLabel}
            onPress={onDismiss}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 16,
              paddingHorizontal: 16,
              backgroundColor: colors.text,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.accent,
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 18,
                  color: colors.text,
                }}
              >
                +
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 11,
                  lineHeight: 14,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: colors.accent,
                  fontWeight: "600",
                }}
              >
                {resolvedTitle}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 4,
                  fontFamily: fonts.display,
                  fontSize: 22,
                  lineHeight: 28,
                  color: colors.bg,
                }}
              >
                {resolvedPointsLabel}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
