import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { GoldSweep } from "@/components/motion/GoldSweep";
import { colors } from "@/constants/theme";
import { hapticLight, hapticMedium, hapticSelection } from "@/lib/haptics";
import {
  hasPlayedHomeCeremony,
  markHomeCeremonyPlayed,
} from "@/lib/homeSessionCeremony";
import { motion, motionEasing } from "@/lib/motion";
import { tenantBrand } from "@/lib/tenantBrand";

/**
 * Stronger brand compress for day-to-day bold storefront open
 * (clearer than ambient `motion.scale.brandStart`).
 */
const BRAND_START_BOLD = 0.88;

type HomeCeremonyContextValue = {
  /** When true, brand beat + staggered sections animate this mount. */
  play: boolean;
  /**
   * Base delay for content CeremonySections — after breathe + brand→hero gap.
   */
  contentBaseDelayMs: number;
};

const defaultCeremonyContext: HomeCeremonyContextValue = {
  play: false,
  contentBaseDelayMs:
    motion.delay.postSplashBreathe + motion.delay.brandToHero,
};

const HomeCeremonyContext =
  createContext<HomeCeremonyContextValue>(defaultCeremonyContext);

/**
 * Reads home arrival ceremony play flag and content stagger base delay.
 * Must be used under {@link HomeArrivalCeremony}.
 */
export function useHomeCeremony(): HomeCeremonyContextValue {
  return useContext(HomeCeremonyContext);
}

type HomeArrivalCeremonyProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Highest content `CeremonySection` index (hero = 0).
   * Schedules the finish `hapticMedium` when that step’s timing completes.
   */
  lastContentIndex: number;
  /**
   * Called once the arrival sequence has settled — immediately when the
   * ceremony is skipped (already played this session, or reduced motion),
   * or alongside the finish haptic once the last section's animation
   * completes. Home uses this to trigger the first-launch App Guide only
   * after arrival motion is fully out of the way, so the guide overlay
   * never fights the ceremony for the user's attention.
   */
  onFinish?: () => void;
};

/**
 * Once-per-session home arrival orchestrator.
 * Provides ceremony context; brand beat + section wrappers handle visuals.
 * Subsequent mounts in the same JS session skip motion and haptics.
 */
export function HomeArrivalCeremony({
  children,
  style,
  lastContentIndex,
  onFinish,
}: HomeArrivalCeremonyProps): React.ReactElement {
  const alreadyPlayed = hasPlayedHomeCeremony();
  const reducedMotion = useReducedMotion();
  const play = !alreadyPlayed && reducedMotion !== true;
  const finishFiredRef = useRef(false);

  // Latest `onFinish` in a ref so the timing effect below (keyed on ceremony
  // inputs, not the callback's identity) always calls the current callback
  // without needing to re-run — and thus without resetting its timers.
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const contentBaseDelayMs =
    motion.delay.postSplashBreathe + motion.delay.brandToHero;

  const contextValue = useMemo(
    (): HomeCeremonyContextValue => ({
      play,
      contentBaseDelayMs,
    }),
    [play, contentBaseDelayMs]
  );

  useEffect(() => {
    if (alreadyPlayed) {
      onFinishRef.current?.();
      return;
    }

    if (reducedMotion === true) {
      markHomeCeremonyPlayed();
      void hapticLight();
      onFinishRef.current?.();
      return;
    }

    // Gate remounts immediately; this mount still animates via `play` snapshot.
    markHomeCeremonyPlayed();

    const brandHapticId = setTimeout(() => {
      void hapticSelection();
    }, motion.delay.postSplashBreathe);

    const safeLastIndex = Math.max(0, lastContentIndex);
    // Hero (index 0) uses a longer dailyEntrance settle; later sections use ceremonyStep.
    // Finish haptic waits for the last section's timing to complete.
    const lastStepDuration =
      safeLastIndex === 0
        ? motion.duration.dailyEntrance
        : motion.duration.ceremonyStep;
    const finishMs =
      contentBaseDelayMs +
      safeLastIndex * motion.delay.stagger +
      lastStepDuration;

    const finishHapticId = setTimeout(() => {
      if (finishFiredRef.current) {
        return;
      }
      finishFiredRef.current = true;
      void hapticMedium();
      onFinishRef.current?.();
    }, finishMs);

    return () => {
      clearTimeout(brandHapticId);
      clearTimeout(finishHapticId);
    };
  }, [alreadyPlayed, reducedMotion, lastContentIndex, contentBaseDelayMs]);

  return (
    <HomeCeremonyContext.Provider value={contextValue}>
      <View style={style}>{children}</View>
    </HomeCeremonyContext.Provider>
  );
}

type HomeBrandBeatProps = {
  /** Navbar text color (white over hero / ink when solid). */
  color: string;
};

/**
 * Navbar brand mark: bold scale + fade + gold underline wipe + soft GoldSweep.
 * Day-to-day amplify — clearer than ambient-only beat; still once per session.
 * Renders final state immediately when ceremony does not play.
 */
export function HomeBrandBeat({ color }: HomeBrandBeatProps): React.ReactElement {
  const { play } = useHomeCeremony();
  const reducedMotion = useReducedMotion();
  const skipAnimation = !play || reducedMotion === true;

  const [measuredWidth, setMeasuredWidth] = useState(0);

  const opacity = useSharedValue(skipAnimation ? 1 : 0);
  const scale = useSharedValue(skipAnimation ? 1 : BRAND_START_BOLD);
  const underlineProgress = useSharedValue(skipAnimation ? 1 : 0);

  useEffect(() => {
    if (skipAnimation) {
      opacity.value = 1;
      scale.value = 1;
      underlineProgress.value = 1;
      return;
    }

    const delayMs = motion.delay.postSplashBreathe;

    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: motion.duration.dailyEntrance,
        easing: motionEasing,
      })
    );
    scale.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: motion.duration.dailyEntrance,
        easing: motionEasing,
      })
    );
    // Underline wipe slightly after brand scale so it reads as a second accent beat.
    underlineProgress.value = withDelay(
      delayMs + 110,
      withTiming(1, {
        duration: motion.duration.lightSweep,
        easing: motionEasing,
      })
    );
  }, [skipAnimation, opacity, scale, underlineProgress]);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const underlineStyle = useAnimatedStyle(() => ({
    width: measuredWidth * underlineProgress.value,
  }));

  return (
    <Animated.View style={[{ alignSelf: "flex-start" }, brandStyle]}>
      <Text
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== measuredWidth) {
            setMeasuredWidth(nextWidth);
          }
        }}
        style={{
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 16,
          color,
          letterSpacing: 3,
          fontWeight: "600",
        }}
      >
        {tenantBrand.displayName}
      </Text>
      <Animated.View
        style={[
          {
            height: 2,
            marginTop: 5,
            backgroundColor: colors.accent,
            borderRadius: 1,
          },
          underlineStyle,
        ]}
      />
      {/* Soft full-track gold sweep under the brand — ceremony-only accent layer. */}
      {play ? (
        <View style={{ marginTop: 3, width: "100%", minWidth: measuredWidth > 0 ? measuredWidth : 48 }}>
          <GoldSweep
            play={play}
            delayMs={motion.delay.postSplashBreathe + 160}
            height={1}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}
