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
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import type { Product } from "@/context/product/ProductContext";
import { hapticSelection } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

/**
 * Thumbnail width for the Shop price-forward list row (~64–72px, 3:4).
 * Kept intentionally small vs Home {@link NoirFeaturedCard} full-bleed moments
 * so silhouettes diverge even with chrome hidden.
 *
 * Layout note: `PressableScale` applies `style` to the outer Pressable while
 * children live in an inner Animated.View (default column). Row layout must
 * sit on a wrapper View inside — never only on PressableScale's `style`.
 */
const THUMB_WIDTH = 68;

export interface NoirProductCardProps {
  product: Product;
  imageUri: string;
  priceLabel: string;
  onPress: () => void;
  wishlisted?: boolean;
  onWishlistPress?: () => void;
  /** Optional dense index ordinal (e.g. "01") for inventory scan. */
  indexLabel?: string;
}

/**
 * Wishlist heart with scale snap — accent only when saved.
 */
function NoirWishlistHeart({
  wishlisted,
  onPress,
  accessibilityLabel,
  accent,
  muted,
}: Readonly<{
  wishlisted: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accent: string;
  muted: string;
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
      style={{ padding: 4 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={wishlisted ? "heart" : "heart-outline"}
          size={17}
          color={wishlisted ? accent : muted}
        />
      </Animated.View>
    </PressableScale>
  );
}

/**
 * Noir Shop catalog row — dense price-forward LIST (inventory silhouette).
 * Small thumb left, price-first meta, optional ordinal, heart right.
 * Must not match {@link NoirFeaturedCard} Home drop moments.
 */
export function NoirProductCard({
  product,
  imageUri,
  priceLabel,
  onPress,
  wishlisted = false,
  onWishlistPress,
  indexLabel,
}: NoirProductCardProps): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const translatedName = translateProduct(product.id, "name", product.name ?? null);
  const name = translatedName.length > 0 ? translatedName : t("common.product");
  const outOfStock =
    product.stock_status === "out_of_stock" || product.stock_count <= 0;

  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      style={{
        width: "100%",
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {/*
        Inner row shell: PressableScale does not forward flexDirection to
        the animated child wrapper, so the inventory row lives here.
      */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          width: "100%",
        }}
      >
        {indexLabel !== undefined && indexLabel.length > 0 ? (
          <Text
            style={{
              width: 22,
              fontFamily: "Inter_400Regular",
              fontSize: 10,
              letterSpacing: 0.6,
              color: tokens.muted,
              fontWeight: "500",
            }}
          >
            {indexLabel}
          </Text>
        ) : null}

        <View
          style={{
            width: THUMB_WIDTH,
            aspectRatio: 3 / 4,
            backgroundColor: tokens.panel,
            overflow: "hidden",
            borderRadius: 1,
            borderWidth: 1,
            borderColor: tokens.border,
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
        </View>

        <View style={{ flex: 1, minWidth: 0, justifyContent: "center", gap: 3 }}>
          <Text
            style={{
              fontSize: 15,
              color: tokens.text,
              fontWeight: "700",
              fontFamily: "Inter_400Regular",
              letterSpacing: 0.3,
            }}
          >
            {priceLabel}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              lineHeight: 17,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>
          {outOfStock ? (
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: tokens.danger,
                fontFamily: "Inter_400Regular",
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              {t("product.outOfStock")}
            </Text>
          ) : null}
        </View>

        {onWishlistPress !== undefined ? (
          <NoirWishlistHeart
            wishlisted={wishlisted}
            onPress={onWishlistPress}
            accent={tokens.accent}
            muted={tokens.muted}
            accessibilityLabel={
              wishlisted
                ? t("product.removeFromWishlistAria")
                : t("product.addToWishlistAria")
            }
          />
        ) : null}
      </View>
    </PressableScale>
  );
}
