import React, { useEffect, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { hapticLight } from "@/lib/haptics";
import {
  hasPlayedHomeCeremony,
  markHomeCeremonyPlayed,
} from "@/lib/homeSessionCeremony";

/** Delay before entrance starts so cold-start splash can finish first. */
const ENTRANCE_DELAY_MS = 300;
/** Fade / slide duration (total motion ~400–700ms including delay). */
const ENTRANCE_DURATION_MS = 450;
const ENTRANCE_TRANSLATE_Y = 12;

type HomeArrivalCeremonyProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Once-per-session entrance: opacity + slight translateY, then one light haptic.
 * Subsequent mounts in the same JS session render children immediately.
 */
export function HomeArrivalCeremony({
  children,
  style,
}: HomeArrivalCeremonyProps): React.ReactElement {
  const alreadyPlayed = hasPlayedHomeCeremony();
  const reducedMotion = useReducedMotion();
  const completedRef = useRef(alreadyPlayed);

  const opacity = useSharedValue(alreadyPlayed || reducedMotion === true ? 1 : 0);
  const translateY = useSharedValue(
    alreadyPlayed || reducedMotion === true ? 0 : ENTRANCE_TRANSLATE_Y
  );

  useEffect(() => {
    if (alreadyPlayed || reducedMotion === true) {
      if (!hasPlayedHomeCeremony()) {
        markHomeCeremonyPlayed();
      }
      return;
    }

    const finish = (): void => {
      if (completedRef.current) {
        return;
      }
      completedRef.current = true;
      markHomeCeremonyPlayed();
      void hapticLight();
    };

    opacity.value = withDelay(
      ENTRANCE_DELAY_MS,
      withTiming(
        1,
        { duration: ENTRANCE_DURATION_MS, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished === true) {
            runOnJS(finish)();
          }
        }
      )
    );
    translateY.value = withDelay(
      ENTRANCE_DELAY_MS,
      withTiming(0, {
        duration: ENTRANCE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [alreadyPlayed, reducedMotion, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (alreadyPlayed || reducedMotion === true) {
    return <View style={style}>{children}</View>;
  }

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
