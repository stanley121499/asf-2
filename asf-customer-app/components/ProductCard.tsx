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
import { colors } from "@/constants/theme";
import { hapticSelection } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";

export interface ProductCardProps {
  product: Product;
  imageUri: string;
  priceLabel: string;
  onPress: () => void;
  wishlisted?: boolean;
  onWishlistPress?: () => void;
}

/**
 * Wishlist heart with fashion-retail scale snap (1 → heartPeak → 1) + selection haptic.
 */
function WishlistHeartButton({
  wishlisted,
  onPress,
  accessibilityLabel,
}: Readonly<{
  wishlisted: boolean;
  onPress: () => void;
  accessibilityLabel: string;
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
          size={18}
          color={wishlisted ? colors.accent : colors.muted}
        />
      </Animated.View>
    </PressableScale>
  );
}

/**
 * Product card matching web app exactly:
 * - No border-radius on image (sharp edges)
 * - 3:4 aspect ratio image block
 * - panel (#F5F5F3) background
 * - Product name: 13px, Inter, truncated, color-text
 * - Price: 14px, accent gold (#C9A96E), font-medium
 * - Heart icon: accent when saved, muted when not
 */
export function ProductCard({
  product,
  imageUri,
  priceLabel,
  onPress,
  wishlisted = false,
  onWishlistPress,
}: ProductCardProps): React.ReactElement {
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const translatedName = translateProduct(product.id, "name", product.name ?? null);
  const name = translatedName.length > 0 ? translatedName : t("common.product");

  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      style={{ width: "48%" }}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {/* 3:4 image — NO border radius, panel background */}
      <View
        style={{
          aspectRatio: 3 / 4,
          backgroundColor: colors.panel,
          overflow: "hidden",
          marginBottom: 8,
          width: "100%",
        }}
      >
        {imageUri.length > 0 ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.panel }} />
        )}
      </View>

      {/* Product name */}
      <Text
        style={{
          fontSize: 13,
          color: colors.text,
          fontFamily: "Inter_400Regular",
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Price + heart */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 14,
            color: colors.accent,
            fontWeight: "500",
            fontFamily: "Inter_400Regular",
          }}
        >
          {priceLabel}
        </Text>
        {onWishlistPress !== undefined ? (
          <WishlistHeartButton
            wishlisted={wishlisted}
            onPress={onWishlistPress}
            accessibilityLabel={
              wishlisted ? t("product.removeFromWishlistAria") : t("product.addToWishlistAria")
            }
          />
        ) : null}
      </View>
    </PressableScale>
  );
}
