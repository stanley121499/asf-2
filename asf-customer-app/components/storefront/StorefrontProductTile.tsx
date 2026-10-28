import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import type { Product } from "@/context/product/ProductContext";
import { formatRm } from "@/lib/formatCurrency";
import { hapticSelection } from "@/lib/haptics";
import { deferAfterPressFeedback } from "@/lib/interactionBusy";
import {
  logTapPressFired,
  markTapStart,
} from "@/lib/interactionLog";
import {
  isCssHexColor,
  resolveProductPrimaryMediaUrl,
} from "@/lib/storefront/productColorMedia";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/** Active product color row used for Uniqlo-style swatches. */
export type StorefrontTileColor = {
  id: string;
  color: string;
  active: boolean;
};

export type StorefrontProductTileProps = {
  /** Catalog product from ProductContext (includes medias + colors). */
  product: Product;
  /**
   * Controlled selected color id. When omitted, the tile manages selection
   * internally (defaults to first active color, else none).
   */
  colorId?: string | null;
  /** Fires when the user taps a swatch (controlled or uncontrolled). */
  onColorChange?: (colorId: string) => void;
  /**
   * Opens PDP. Receives the tile's current color id (or `null` when no colors)
   * so callers can pass it to `openBrowseProduct(..., { colorId })`.
   */
  onPress: (colorId: string | null) => void;
  /** Optional outer style (e.g. grid cell width). */
  style?: StyleProp<ViewStyle>;
  /** Image aspect ratio; default square Uniqlo-style tile. */
  imageAspectRatio?: number;
  /**
   * When true, hints expo-image to load sooner (above-fold arrivals).
   * Default false so Home feed does not decode dozens of images at once.
   */
  imagePriority?: boolean;
};

/**
 * Resolves the active swatch list for a product (soft-deleted already filtered
 * in ProductContext; here we keep `active === true` only).
 */
function activeColorsForProduct(product: Product): StorefrontTileColor[] {
  return (product.product_colors ?? [])
    .filter((c) => c.active === true)
    .map((c) => ({
      id: c.id,
      color: c.color,
      active: c.active,
    }));
}

/**
 * Compares tile props for `React.memo` — skips re-render when catalog hydrate
 * replaces product objects with equivalent rows (same id + timestamps + price).
 *
 * Handler identity (`onPress` / `onColorChange`) is intentionally ignored:
 * Home/Shop create inline lambdas every render; comparing them would defeat
 * memo. Handlers close over stable `router` + `product.id` which we already
 * gate via the product row comparison.
 */
function storefrontProductTilePropsAreEqual(
  prev: Readonly<StorefrontProductTileProps>,
  next: Readonly<StorefrontProductTileProps>
): boolean {
  if (prev.colorId !== next.colorId) {
    return false;
  }
  if (prev.imageAspectRatio !== next.imageAspectRatio) {
    return false;
  }
  if (prev.imagePriority !== next.imagePriority) {
    return false;
  }
  if (prev.style !== next.style) {
    return false;
  }
  const a = prev.product;
  const b = next.product;
  if (a === b) {
    return true;
  }
  return (
    a.id === b.id &&
    a.updated_at === b.updated_at &&
    a.price === b.price &&
    a.name === b.name &&
    (a.medias?.length ?? 0) === (b.medias?.length ?? 0) &&
    (a.product_colors?.length ?? 0) === (b.product_colors?.length ?? 0)
  );
}

/**
 * Storefront Uniqlo-style product tile: image → swatches → name → price.
 *
 * Usable by Home newest grid, feed blocks, and Shop (Agents 6–8).
 * Swatch tap updates the tile image via {@link resolveProductPrimaryMediaUrl};
 * product tap calls `onPress` (does not auto-navigate).
 *
 * Press feedback uses Pressable opacity (cheap) and defers `onPress` one frame
 * so navigation does not race the pressed state on a busy JS thread.
 */
function StorefrontProductTileInner({
  product,
  colorId,
  onColorChange,
  onPress,
  style,
  imageAspectRatio = 1,
  imagePriority = false,
}: Readonly<StorefrontProductTileProps>): React.ReactElement {
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();

  const colors = useMemo(() => activeColorsForProduct(product), [product]);
  const isControlled = colorId !== undefined;

  const [internalColorId, setInternalColorId] = useState<string | null>(() => {
    const first = colors[0];
    return first !== undefined ? first.id : null;
  });

  // Keep internal default in sync when product / colors load asynchronously.
  useEffect(() => {
    if (isControlled) {
      return;
    }
    setInternalColorId((prev) => {
      if (prev !== null && colors.some((c) => c.id === prev)) {
        return prev;
      }
      const first = colors[0];
      return first !== undefined ? first.id : null;
    });
  }, [colors, isControlled, product.id]);

  const selectedColorId = isControlled
    ? colorId ?? null
    : internalColorId;

  const imageUri = useMemo(
    () => resolveProductPrimaryMediaUrl(product, selectedColorId),
    [product, selectedColorId]
  );

  const translatedName = translateProduct(
    product.id,
    "name",
    product.name ?? null
  );
  const displayName =
    translatedName.length > 0 ? translatedName : t("common.product");
  const priceLabel = formatRm(
    typeof product.price === "number" ? product.price : 0
  );

  const handleSwatchPress = useCallback(
    (nextColorId: string): void => {
      void hapticSelection();
      if (!isControlled) {
        setInternalColorId(nextColorId);
      }
      onColorChange?.(nextColorId);
    },
    [isControlled, onColorChange]
  );

  /**
   * Defer navigation one frame so opacity feedback paints first, and mark the
   * interaction busy window so catalog hydrate waits. Dev Metro `[tap]` lines
   * mark press-in → onPress so Simon can see JS-thread delay before navigate.
   */
  const handleProductPressIn = useCallback((): void => {
    markTapStart(`product-tile:${product.id}`);
  }, [product.id]);

  const handleProductPress = useCallback((): void => {
    logTapPressFired(`product-tile:${product.id}`);
    deferAfterPressFeedback(() => {
      onPress(selectedColorId);
    });
  }, [onPress, product.id, selectedColorId]);

  return (
    <Pressable
      onPressIn={handleProductPressIn}
      onPress={handleProductPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, ${priceLabel}`}
      style={({ pressed }) => [
        { flex: 1, opacity: pressed ? 0.72 : 1 },
        style,
      ]}
    >
      <View
        style={{
          width: "100%",
          aspectRatio: imageAspectRatio,
          backgroundColor: tokens.panel,
          overflow: "hidden",
        }}
      >
        {imageUri !== null ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`${product.id}:${selectedColorId ?? "default"}`}
            priority={imagePriority ? "high" : "low"}
            accessibilityLabel={displayName}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="image-outline" size={28} color={tokens.muted} />
          </View>
        )}
      </View>

      {colors.length >= 1 ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
          }}
        >
          {colors.map((c) => {
            const selected = selectedColorId === c.id;
            const fill = isCssHexColor(c.color) ? c.color.trim() : tokens.border;
            return (
              <Pressable
                key={c.id}
                onPress={() => handleSwatchPress(c.id)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t("product.colorSwatchAria", {
                  color: c.color,
                })}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: fill,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? tokens.text : tokens.border,
                }}
              />
            );
          })}
        </View>
      ) : null}

      <Text
        numberOfLines={2}
        style={{
          marginTop: 8,
          fontSize: 13,
          lineHeight: 18,
          color: tokens.text,
          fontFamily: "Inter_400Regular",
        }}
      >
        {displayName}
      </Text>

      <Text
        style={{
          marginTop: 4,
          fontSize: 13,
          color: tokens.muted,
          fontFamily: "Inter_400Regular",
        }}
      >
        {priceLabel}
      </Text>
    </Pressable>
  );
}

/**
 * Memoized Storefront product tile — skips reconcile when hydrate replaces
 * equivalent product rows (see {@link storefrontProductTilePropsAreEqual}).
 */
export const StorefrontProductTile = React.memo(
  StorefrontProductTileInner,
  storefrontProductTilePropsAreEqual
);
