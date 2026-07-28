import React, { useEffect } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/constants/theme";
import { motion, motionEasing } from "@/lib/motion";

/** Upward travel distance for the tray entrance (px). */
const TRAY_TRANSLATE_Y = 28;

export type AddedToBagTrayProps = {
  /** When true, shows the tray and starts the hold → dismiss cycle. */
  visible: boolean;
  /**
   * Uppercase eyebrow above the product name (e.g. i18n "Added").
   * Defaults to English "Added" when omitted.
   */
  titleLabel?: string;
  /**
   * Primary line under the title — typically the product name.
   * Falls back to a short default when omitted.
   */
  productName?: string;
  /**
   * Override for the full message body. When set, replaces the default
   * productName composition.
   */
  message?: string;
  /** Optional product thumbnail on the leading edge. */
  thumbnailUri?: string | null;
  /** Optional local / remote image source when URI is not used. */
  thumbnailSource?: ImageSourcePropType;
  /** Called when the tray finishes exiting (auto-dismiss or manual). */
  onDismiss: () => void;
  /**
   * Milliseconds the tray stays fully visible before exit.
   * Defaults to `motion.delay.addTrayHold` (~1000ms).
   */
  holdMs?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Short-lived add-to-bag confirmation strip near the bottom of the screen.
 * Slides up with a gold accent, holds briefly, then exits. Reduced motion
 * shows/hides instantly without blocking further taps.
 */
export function AddedToBagTray({
  visible,
  titleLabel,
  productName,
  message,
  thumbnailUri,
  thumbnailSource,
  onDismiss,
  holdMs,
  style,
  accessibilityLabel,
}: AddedToBagTrayProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const skipAnimation = reducedMotion === true;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(TRAY_TRANSLATE_Y);

  const holdDuration =
    typeof holdMs === "number" && Number.isFinite(holdMs) && holdMs >= 0
      ? holdMs
      : motion.delay.addTrayHold;

  const resolvedTitle =
    typeof titleLabel === "string" && titleLabel.trim().length > 0
      ? titleLabel.trim()
      : "Added";

  const bodyText =
    typeof message === "string" && message.trim().length > 0
      ? message.trim()
      : typeof productName === "string" && productName.trim().length > 0
        ? productName.trim()
        : "Added to bag";

  const resolvedThumbnail: ImageSourcePropType | null =
    thumbnailSource !== undefined
      ? thumbnailSource
      : typeof thumbnailUri === "string" && thumbnailUri.trim().length > 0
        ? { uri: thumbnailUri.trim() }
        : null;

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    if (!visible) {
      opacity.value = 0;
      translateY.value = TRAY_TRANSLATE_Y;
      return;
    }

    const dismissAfterExit = (): void => {
      onDismiss();
    };

    if (skipAnimation) {
      opacity.value = 1;
      translateY.value = 0;
      holdTimer = setTimeout(() => {
        opacity.value = 0;
        translateY.value = TRAY_TRANSLATE_Y;
        dismissAfterExit();
      }, holdDuration);
      return () => {
        if (holdTimer !== undefined) {
          clearTimeout(holdTimer);
        }
      };
    }

    opacity.value = 0;
    translateY.value = TRAY_TRANSLATE_Y;
    opacity.value = withTiming(1, {
      duration: motion.duration.addTray,
      easing: motionEasing,
    });
    translateY.value = withTiming(0, {
      duration: motion.duration.addTray,
      easing: motionEasing,
    });

    holdTimer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: motion.duration.addTray,
          easing: motionEasing,
        },
        (finished) => {
          if (finished) {
            runOnJS(dismissAfterExit)();
          }
        }
      );
      translateY.value = withTiming(TRAY_TRANSLATE_Y, {
        duration: motion.duration.addTray,
        easing: motionEasing,
      });
    }, motion.duration.addTray + holdDuration);

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
    translateY,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  const a11yLabel =
    typeof accessibilityLabel === "string" && accessibilityLabel.trim().length > 0
      ? accessibilityLabel.trim()
      : [resolvedTitle, bodyText].join(". ");

  return (
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
          bottom: Math.max(insets.bottom, 12) + 64,
          zIndex: 50,
        },
        style,
        animatedStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        onPress={onDismiss}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          backgroundColor: colors.text,
          borderRadius: 4,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        {resolvedThumbnail !== null ? (
          <Image
            source={resolvedThumbnail}
            accessibilityIgnoresInvertColors
            style={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: colors.panel,
            }}
          />
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 1.2,
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
              marginTop: 2,
              fontFamily: fonts.sans,
              fontSize: 14,
              lineHeight: 18,
              color: colors.bg,
            }}
          >
            {bodyText}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
