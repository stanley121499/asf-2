import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ANCHORS, TourAnchor } from "@/components/guide";
import { PressableScale } from "@/components/motion";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import type { Product } from "@/context/product/ProductContext";
import { hapticSelection } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

export interface NoirGridCardProps {
  product: Product;
  imageUri: string;
  priceLabel: string;
  onPress: () => void;
  wishlisted?: boolean;
  onWishlistPress?: () => void;
  /**
   * When true, wraps the heart in `TourAnchor` for `home.saveHeart`.
   * Only the first grid cell should set this.
   */
  guideHeart?: boolean;
  /** Column gap-aware width of this cell (parent supplies). */
  width: number;
}

/**
 * Corner wishlist heart with a snappy scale pulse. Accent only when saved.
 */
function GridHeart({
  wishlisted,
  onPress,
  accessibilityLabel,
  accent,
  muted,
  guideHeart,
}: Readonly<{
  wishlisted: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accent: string;
  muted: string;
  guideHeart: boolean;
}>): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = (): void => {
    void hapticSelection();
    scale.value = withSequence(
      withTiming(motion.scale.heartPeak, {
        duration: motion.duration.press,
        easing: motionEasing,
      }),
      withTiming(1, {
        duration: motion.duration.fast,
        easing: motionEasing,
      })
    );
    onPress();
  };

  const heart = (
    <PressableScale
      onPress={handlePress}
      haptic="none"
      hitSlop={10}
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(10,10,10,0.55)",
        borderRadius: 16,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={wishlisted ? "heart" : "heart-outline"}
          size={16}
          color={wishlisted ? accent : muted}
        />
      </Animated.View>
    </PressableScale>
  );

  if (!guideHeart) {
    return heart;
  }

  return <TourAnchor id={ANCHORS.home.saveHeart}>{heart}</TourAnchor>;
}

/**
 * Legacy Noir 2-col grid cell (Round 1). Home now uses {@link NoirFeaturedCard};
 * kept for reference / possible archive layouts. Distinct from Shop list rows.
 */
export function NoirGridCard({
  product,
  imageUri,
  priceLabel,
  onPress,
  wishlisted = false,
  onWishlistPress,
  guideHeart = false,
  width,
}: NoirGridCardProps): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const translatedName = translateProduct(product.id, "name", product.name ?? null);
  const name = translatedName.length > 0 ? translatedName : t("common.product");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={{ width }}
    >
      <View
        style={{
          width: "100%",
          aspectRatio: 3 / 4,
          backgroundColor: tokens.panel,
          overflow: "hidden",
          borderRadius: 2,
        }}
      >
        {imageUri.length > 0 ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            accessibilityLabel={t("home.productAlt")}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: tokens.panel }} />
        )}
        {onWishlistPress !== undefined ? (
          <View style={{ position: "absolute", top: 8, right: 8 }}>
            <GridHeart
              wishlisted={wishlisted}
              onPress={onWishlistPress}
              accent={tokens.accent}
              muted={tokens.muted}
              guideHeart={guideHeart}
              accessibilityLabel={
                wishlisted
                  ? t("home.cardUnsaveAria")
                  : t("home.cardSaveAria")
              }
            />
          </View>
        ) : null}
      </View>

      <Text
        style={{
          marginTop: 8,
          fontSize: 13,
          fontWeight: "600",
          color: tokens.text,
          fontFamily: "Inter_400Regular",
        }}
        numberOfLines={1}
      >
        {priceLabel}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontSize: 12,
          color: tokens.muted,
          fontFamily: "Inter_400Regular",
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
    </Pressable>
  );
}
