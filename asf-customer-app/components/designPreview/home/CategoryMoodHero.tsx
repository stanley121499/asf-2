import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { HeroCoverMedia } from "@/components/designPreview/home/HeroCoverMedia";
import { motion, motionEasing } from "@/lib/motion";

export type CategoryMoodHeroProps = {
  /** Active mood image URI (category media, product media, or cover fallback). */
  uri: string;
  /** Hero media height. */
  height: number;
  /** Stable remount key (kind filter + uri). */
  mediaKey: string;
  /** Hero press → linked products (or no-op when no post). */
  onPress: () => void;
  /** Accessibility label. */
  accessibilityLabel: string;
};

/**
 * Variant D mood hero — crossfades when the selected category mood URI changes.
 * Respects reduced-motion (instant swap).
 */
export function CategoryMoodHero({
  uri,
  height,
  mediaKey,
  onPress,
  accessibilityLabel,
}: CategoryMoodHeroProps): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipMotion = reducedMotion === true;

  const [baseUri, setBaseUri] = useState(uri);
  const [baseKey, setBaseKey] = useState(mediaKey);
  const [overlayUri, setOverlayUri] = useState<string | null>(null);
  const [overlayKey, setOverlayKey] = useState<string | null>(null);

  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (uri === baseUri && mediaKey === baseKey) {
      return;
    }

    if (skipMotion) {
      setBaseUri(uri);
      setBaseKey(mediaKey);
      setOverlayUri(null);
      setOverlayKey(null);
      overlayOpacity.value = 0;
      return;
    }

    setOverlayUri(uri);
    setOverlayKey(mediaKey);
    overlayOpacity.value = 0;
    overlayOpacity.value = withTiming(1, {
      duration: motion.duration.base,
      easing: motionEasing,
    });

    const settle = setTimeout(() => {
      setBaseUri(uri);
      setBaseKey(mediaKey);
      setOverlayUri(null);
      setOverlayKey(null);
      overlayOpacity.value = 0;
    }, motion.duration.base + 16);

    return () => {
      clearTimeout(settle);
    };
  }, [uri, mediaKey, baseUri, baseKey, skipMotion, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;

  return (
    <View style={{ width: "100%", height: safeHeight }}>
      <HeroCoverMedia
        uri={baseUri}
        height={safeHeight}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        mediaKey={baseKey}
        recyclingKey={`mood-base:${baseKey}`}
      />
      {overlayUri !== null && overlayKey !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            overlayStyle,
          ]}
        >
          <HeroCoverMedia
            uri={overlayUri}
            height={safeHeight}
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            mediaKey={overlayKey}
            recyclingKey={`mood-overlay:${overlayKey}`}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
