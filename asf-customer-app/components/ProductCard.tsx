import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, Text, View } from "react-native";

import type { Product } from "@/context/product/ProductContext";
import { colors } from "@/constants/theme";

export interface ProductCardProps {
  product: Product;
  imageUri: string;
  priceLabel: string;
  onPress: () => void;
  wishlisted?: boolean;
  onWishlistPress?: () => void;
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
  const name = typeof product.name === "string" ? product.name : "商品";

  return (
    <Pressable
      onPress={onPress}
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
          <Pressable
            onPress={(e) => {
              onWishlistPress();
            }}
            hitSlop={8}
            style={{ padding: 4 }}
            accessibilityRole="button"
            accessibilityLabel={wishlisted ? "从收藏中移除" : "加入收藏"}
          >
            <Ionicons
              name={wishlisted ? "heart" : "heart-outline"}
              size={18}
              color={wishlisted ? colors.accent : colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
