import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type HeroCoverMediaProps = {
  /** Image URI; empty → panel placeholder. */
  uri: string;
  /** Absolute height of the media box. */
  height: number;
  /** Press handler (hero → linked products). */
  onPress: () => void;
  /** Accessibility label for the hero pressable. */
  accessibilityLabel: string;
  /**
   * Optional recycling / remount key so crossfade parents can force a fresh
   * Image when the URI identity changes.
   */
  mediaKey?: string;
  /** expo-image recycling key. */
  recyclingKey?: string;
};

/**
 * Soft vertical gradient used when cover Image fails to load.
 * Does not fall back to alternate post/product media.
 */
function HeroCoverGradientFallback(): React.ReactElement {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#C4B8A8",
        }}
      />
      <View
        style={{
          flex: 1.2,
          backgroundColor: "#A89884",
        }}
      />
      <View
        style={{
          flex: 1.5,
          backgroundColor: "#6B5E4E",
        }}
      />
    </View>
  );
}

/**
 * Full-bleed cover media used by Design Lab hero variants A–D.
 * Cover-fit image; empty URI → panel placeholder; load error → gradient.
 */
export function HeroCoverMedia({
  uri,
  height,
  onPress,
  accessibilityLabel,
  mediaKey,
  recyclingKey,
}: HeroCoverMediaProps): React.ReactElement {
  const safeHeight = Number.isFinite(height) ? Math.max(0, height) : 0;
  const trimmedUri = uri.trim();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [trimmedUri, mediaKey]);

  const showImage = trimmedUri.length > 0 && !imageFailed;

  return (
    <Pressable
      onPress={onPress}
      style={{ width: "100%", height: safeHeight }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {showImage ? (
        <Image
          key={mediaKey ?? trimmedUri}
          source={{ uri: trimmedUri }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey={recyclingKey ?? `design-hero:${trimmedUri}`}
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : trimmedUri.length > 0 ? (
        <HeroCoverGradientFallback />
      ) : (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            backgroundColor: tokens.panel,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="image-outline" size={36} color={tokens.muted} />
        </View>
      )}
    </Pressable>
  );
}
