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

/**
 * Tall portrait ratio for Home drop moments — SNKRS/GOAT scale,
 * deliberately larger than Shop list thumbs or the retired 2-col grid cells.
 */
const FEATURED_ASPECT = 3 / 4;

export interface NoirFeaturedCardProps {
  product: Product;
  imageUri: string;
  priceLabel: string;
  onPress: () => void;
  wishlisted?: boolean;
  onWishlistPress?: () => void;
  /**
   * When true, wraps the heart in `TourAnchor` for `home.saveHeart`.
   * Only the first stream card should set this.
   */
  guideHeart?: boolean;
  /** Optional ordinal label shown above the price (e.g. "01"). */
  indexLabel?: string;
}

/**
 * Corner wishlist heart with a snappy scale pulse. Accent only when saved.
 */
function FeaturedHeart({
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
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(10,10,10,0.55)",
        borderRadius: 18,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={wishlisted ? "heart" : "heart-outline"}
          size={18}
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
 * Noir Home large product moment — full-bleed tall media with commerce meta.
 * Single-column SNKRS/GOAT energy; must not match Shop dense list cells.
 */
export function NoirFeaturedCard({
  product,
  imageUri,
  priceLabel,
  onPress,
  wishlisted = false,
  onWishlistPress,
  guideHeart = false,
  indexLabel,
}: NoirFeaturedCardProps): React.ReactElement {
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
      style={{
        width: "100%",
        backgroundColor: tokens.panel,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: "100%",
          aspectRatio: FEATURED_ASPECT,
          backgroundColor: tokens.panel,
          overflow: "hidden",
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
          <View style={{ position: "absolute", top: 12, right: 12 }}>
            <FeaturedHeart
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

        {/* Commerce meta plate — price forward, Inter only */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 36,
            paddingBottom: 16,
            backgroundColor: "rgba(10,10,10,0.68)",
          }}
        >
          {indexLabel !== undefined && indexLabel.length > 0 ? (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 10,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: tokens.muted,
                marginBottom: 6,
              }}
            >
              {indexLabel}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 20,
              fontWeight: "700",
              color: tokens.text,
              marginBottom: 4,
            }}
          >
            {priceLabel}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: tokens.muted,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
