import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/motion";
import type { Product } from "@/context/product/ProductContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { hapticSelection } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

/** Portrait crop for 2-col archive tiles — shorter than Home chapter (~1.25× width). */
export const LOOKBOOK_GRID_ASPECT = 3 / 4;

/** Fixed inset for the wishlist chip — same on every archive tile (image frame only). */
const LOOKBOOK_HEART_INSET = 8;

/** Square chip size (image-corner overlay). */
const LOOKBOOK_HEART_CHIP = 28;

/** Ionicons glyph size inside the chip. */
const LOOKBOOK_HEART_ICON = 14;

export interface LookbookProductCardProps {
  product: Product;
  imageUri: string;
  priceLabel: string;
  onPress: () => void;
  wishlisted?: boolean;
  onWishlistPress?: () => void;
}

/**
 * Wishlist heart with scale snap — Atelier archive variant using theme tokens.
 *
 * Mirrors {@link CartButton}: PressableScale `centerContent` alone is not enough —
 * its inner Animated.View stretches width but shrink-wraps height, so a bare
 * glyph sits top-left of the chip. A fixed CHIP×CHIP slot with align/justify
 * center is the real centering surface.
 */
function LookbookWishlistHeart({
  wishlisted,
  onPress,
  accessibilityLabel,
  accentColor,
  mutedColor,
}: Readonly<{
  wishlisted: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accentColor: string;
  mutedColor: string;
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

  return (
    <PressableScale
      onPress={handlePress}
      haptic="none"
      hitSlop={8}
      centerContent
      style={{
        position: "absolute",
        top: LOOKBOOK_HEART_INSET,
        right: LOOKBOOK_HEART_INSET,
        width: LOOKBOOK_HEART_CHIP,
        height: LOOKBOOK_HEART_CHIP,
        zIndex: 1,
        backgroundColor: "rgba(246,241,232,0.82)",
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {/*
        Explicit slot matches the chip so the heart centers — not a
        shrink-wrapped glyph box (same pattern as CartButton).
      */}
      <Animated.View
        style={[
          {
            width: LOOKBOOK_HEART_CHIP,
            height: LOOKBOOK_HEART_CHIP,
            alignItems: "center",
            justifyContent: "center",
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name={wishlisted ? "heart" : "heart-outline"}
          size={LOOKBOOK_HEART_ICON}
          color={wishlisted ? accentColor : mutedColor}
        />
      </Animated.View>
    </PressableScale>
  );
}

/**
 * Atelier Shop archive index tile — 2-column grid cell (Option A).
 *
 * **Fail test:** With Shop chrome cropped, this still reads as catalog inventory,
 * not a Home magazine chapter: {@link LOOKBOOK_GRID_ASPECT} crop (not ~1.25× tall),
 * quiet Inter caption (not Playfair story titles), no “Chapter 01” ordinals,
 * heart sits on the image corner (not beside editorial type).
 */
export function LookbookProductCard({
  product,
  imageUri,
  priceLabel,
  onPress,
  wishlisted = false,
  onWishlistPress,
}: LookbookProductCardProps): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const translatedName = translateProduct(product.id, "name", product.name ?? null);
  const name = translatedName.length > 0 ? translatedName : t("common.product");

  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      style={{ width: "100%" }}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {/*
        Image frame is the sole containing block for the heart. Absolute chip
        uses fixed px insets (not %) so left/right grid columns share one row
        baseline — see Shop columnWrapper alignItems: "flex-start".
      */}
      <View
        collapsable={false}
        style={{
          position: "relative",
          aspectRatio: LOOKBOOK_GRID_ASPECT,
          backgroundColor: tokens.panel,
          overflow: "hidden",
          marginBottom: 6,
          width: "100%",
        }}
      >
        {imageUri.length > 0 ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: tokens.panel }} />
        )}
        {onWishlistPress !== undefined ? (
          <LookbookWishlistHeart
            wishlisted={wishlisted}
            onPress={onWishlistPress}
            accessibilityLabel={
              wishlisted
                ? t("product.removeFromWishlistAria")
                : t("product.addToWishlistAria")
            }
            accentColor={tokens.accent}
            mutedColor={tokens.muted}
          />
        ) : null}
      </View>

      {/* Minimal tool caption — Inter only; no story typography */}
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 12,
          lineHeight: 15,
          color: tokens.text,
          marginBottom: 2,
        }}
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text
        style={{
          fontSize: 11,
          lineHeight: 14,
          color: tokens.muted,
          fontFamily: "Inter_400Regular",
        }}
      >
        {priceLabel}
      </Text>
    </PressableScale>
  );
}
