import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { startTransition, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  CATEGORY_PRODUCT_PEEK_CAP,
} from "@/components/designPreview/home/resolveCategoryMoodUri";
import { HERO_VARIANT_HORIZONTAL_PADDING } from "@/components/designPreview/home/heroVariantLayout";
import type { Product } from "@/context/product/ProductContext";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { HOME_SPACE } from "@/lib/homeLayout";
import { resolveProductPrimaryMediaUrl } from "@/lib/storefront/productColorMedia";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type CategoryProductPeekProps = {
  /** Products under the selected kind (already filtered). */
  products: readonly Product[];
  /** Section title (localized). */
  title: string;
};

const PEEK_TILE = 88;

/**
 * Compact horizontal product peek under the mood hero (variant D).
 * Caps at {@link CATEGORY_PRODUCT_PEEK_CAP} tiles for Home performance.
 */
export function CategoryProductPeek({
  products,
  title,
}: CategoryProductPeekProps): React.ReactElement | null {
  const router = useRouter();

  const peekItems = useMemo(
    () => products.slice(0, CATEGORY_PRODUCT_PEEK_CAP),
    [products]
  );

  if (peekItems.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        marginTop: HOME_SPACE.sm,
        paddingHorizontal: HERO_VARIANT_HORIZONTAL_PADDING,
        alignSelf: "stretch",
        width: "100%",
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontWeight: "600",
          fontSize: 13,
          color: tokens.muted,
          marginBottom: HOME_SPACE.xs,
          letterSpacing: 0.3,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: "row",
          gap: HOME_SPACE.xs,
        }}
      >
        {peekItems.map((product) => {
          const uri = resolveProductPrimaryMediaUrl(product);
          const imageUri = uri !== null ? uri.trim() : "";
          return (
            <Pressable
              key={product.id}
              onPress={() => {
                startTransition(() => {
                  openBrowseProduct(router, product.id, {
                    returnTo: "home",
                  });
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={product.name ?? product.id}
              style={{
                width: PEEK_TILE,
                height: PEEK_TILE,
                backgroundColor: tokens.panel,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: tokens.border,
              }}
            >
              {imageUri.length > 0 ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={`peek:${product.id}`}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: tokens.panel,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
