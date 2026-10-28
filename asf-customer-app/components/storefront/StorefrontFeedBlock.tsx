import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useMemo } from "react";
import {
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { HomeProductGrid } from "@/components/home/HomeProductGrid";
import { StorefrontProductTile } from "@/components/storefront/StorefrontProductTile";
import { StorefrontSeeAllButton } from "@/components/storefront/StorefrontSeeAllButton";
import { useTranslation } from "@/context/LocaleContext";
import type { Product } from "@/context/product/ProductContext";
import {
  HOME_GRID_COLUMNS,
  HOME_SPACE,
  getHomeGridMetrics,
} from "@/lib/homeLayout";
import { deferAfterPressFeedback } from "@/lib/interactionBusy";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/** Horizontal padding for title + linked product grid (image stays full-bleed). */
const FEED_HORIZONTAL_PADDING = 16;

/**
 * Default full-bleed banner aspect (`width / height`).
 *
 * Curated Home promo media is landscape (~3:2). Prefer this when `photo_size`
 * is missing (promotions have no photo_size column).
 */
const FEED_IMAGE_ASPECT_DEFAULT = 3 / 2;

/**
 * Tallest allowed frame (width/height). Prevents near-zero aspect from becoming
 * a full-screen slab if bad metadata slips through.
 */
const FEED_IMAGE_ASPECT_MIN = 3 / 4;

/** Widest allowed frame (width/height). */
const FEED_IMAGE_ASPECT_MAX = 16 / 9;

/**
 * Parses `posts.photo_size` (`"1:1" | "4:5" | "3:2" | "16:9"`) into a positive
 * width/height ratio, clamped to a safe feed range. Unknown or empty values
 * fall back to the landscape default.
 */
export function parseFeedImageAspect(
  photoSize: string | null | undefined
): number {
  if (typeof photoSize !== "string") {
    return FEED_IMAGE_ASPECT_DEFAULT;
  }
  const trimmed = photoSize.trim();
  if (trimmed.length === 0) {
    return FEED_IMAGE_ASPECT_DEFAULT;
  }
  const parts = trimmed.split(":");
  if (parts.length !== 2) {
    return FEED_IMAGE_ASPECT_DEFAULT;
  }
  const widthPart = parts[0];
  const heightPart = parts[1];
  if (widthPart === undefined || heightPart === undefined) {
    return FEED_IMAGE_ASPECT_DEFAULT;
  }
  const width = Number(widthPart);
  const height = Number(heightPart);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return FEED_IMAGE_ASPECT_DEFAULT;
  }
  const ratio = width / height;
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return FEED_IMAGE_ASPECT_DEFAULT;
  }
  if (ratio < FEED_IMAGE_ASPECT_MIN) {
    return FEED_IMAGE_ASPECT_MIN;
  }
  if (ratio > FEED_IMAGE_ASPECT_MAX) {
    return FEED_IMAGE_ASPECT_MAX;
  }
  return ratio;
}

export type StorefrontFeedBlockProps = {
  /**
   * Full-bleed hero image URL for the post primary media or `promotions.image_url`.
   * When null/empty, a quiet placeholder panel is shown.
   */
  imageUrl: string | null;
  /**
   * Optional quiet caption / title under the image (post name or promo title).
   * Omit or pass empty to hide the line entirely.
   */
  title?: string | null;
  /**
   * Linked products already capped for the Home feed (max 6 for 2×3).
   * When empty, the product grid is omitted (image still shows).
   */
  products: readonly Product[];
  /** Opens the uncapped linked-products list for this entity. */
  onImagePress: () => void;
  /**
   * Opens PDP for a linked product. Receives the tile's current `colorId`
   * (or `null` when the product has no active colors).
   */
  onProductPress: (productId: string, colorId: string | null) => void;
  /**
   * Opens the uncapped linked-products list (plan §3.4 D **See all**).
   * When provided, always shown under the block (even if the 2×3 is empty).
   */
  onSeeAll?: () => void;
  /**
   * Label for the **See all** control. Defaults to `home.seeAll` /
   * `home.seeAllArrivals` via translation when omitted.
   */
  seeAllLabel?: string;
  /** Accessibility label for the image press target. */
  imageAccessibilityLabel?: string;
  /**
   * Optional `posts.photo_size` (e.g. `"3:2"`, `"1:1"`). When omitted, uses
   * {@link FEED_IMAGE_ASPECT_DEFAULT} so landscape banners stay proportional.
   */
  photoSize?: string | null;
  /** Outer wrapper style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Storefront Home Section B story block (plan §3.1 B / R8–R10 / §3.4 D).
 *
 * Layout: full-bleed image → optional quiet title → 2×3
 * {@link StorefrontProductTile} grid → **See all** (when `onSeeAll` is set).
 * Image / See all → linked list; product press → PDP with `colorId`.
 *
 * Hero sizing mirrors {@link StorefrontProductTile}: Pressable wraps an
 * `aspectRatio` View, and expo-image fills with `width`/`height` `"100%"`.
 * Absolute-fill Image inside absolute-fill Pressable painted a blank
 * `tokens.panel` slot (frame height OK, bitmap never laid out). A prior
 * Pressable whose only children were absolute also collapsed to 0 height
 * in the Home FlatList — the aspectRatio child prevents that.
 */
function StorefrontFeedBlockInner({
  imageUrl,
  title,
  products,
  onImagePress,
  onProductPress,
  onSeeAll,
  seeAllLabel,
  imageAccessibilityLabel,
  photoSize,
  style,
}: Readonly<StorefrontFeedBlockProps>): React.ReactElement {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();

  const gridMetrics = useMemo(
    () =>
      getHomeGridMetrics({
        windowWidth,
        horizontalPadding: FEED_HORIZONTAL_PADDING,
        gap: HOME_SPACE.sm,
        columns: HOME_GRID_COLUMNS,
      }),
    [windowWidth]
  );

  const imageAspect = useMemo(
    () => parseFeedImageAspect(photoSize),
    [photoSize]
  );

  const trimmedTitle =
    typeof title === "string" && title.trim().length > 0
      ? title.trim()
      : null;
  const hasImage =
    typeof imageUrl === "string" && imageUrl.trim().length > 0;
  const imageUri = hasImage ? imageUrl.trim() : "";
  const a11yLabel =
    typeof imageAccessibilityLabel === "string" &&
    imageAccessibilityLabel.trim().length > 0
      ? imageAccessibilityLabel.trim()
      : trimmedTitle !== null
        ? trimmedTitle
        : t("home.postAlt");

  const resolvedSeeAllLabel =
    typeof seeAllLabel === "string" && seeAllLabel.trim().length > 0
      ? seeAllLabel.trim()
      : t("home.seeAll");

  /**
   * Plan §3.4 D: **See all** → linked-products when provided.
   * Home omits zero-link entities before render; remaining blocks still show See all.
   */
  const showSeeAll = typeof onSeeAll === "function";

  const handleImagePress = useCallback((): void => {
    deferAfterPressFeedback(() => {
      onImagePress();
    });
  }, [onImagePress]);

  const handleSeeAllPress = useCallback((): void => {
    if (typeof onSeeAll !== "function") {
      return;
    }
    deferAfterPressFeedback(() => {
      onSeeAll();
    });
  }, [onSeeAll]);

  const handleProductPress = useCallback(
    (productId: string, colorId: string | null): void => {
      onProductPress(productId, colorId);
    },
    [onProductPress]
  );

  /** Stable product list copy for the grid when the parent passes a new array. */
  const gridProducts = useMemo(() => [...products], [products]);

  return (
    <View
      style={[
        { marginTop: HOME_SPACE.lg, alignSelf: "stretch", width: "100%" },
        style,
      ]}
    >
      {/*
        Pressable → aspectRatio View → Image at 100%×100% (same as product
        tiles). Do not absolute-fill the Image: expo-image then draws nothing
        while the panel background remains visible.
      */}
      <Pressable
        onPress={handleImagePress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={({ pressed }) => [
          {
            alignSelf: "stretch",
            width: "100%",
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View
          collapsable={false}
          style={{
            alignSelf: "stretch",
            width: "100%",
            aspectRatio: imageAspect,
            backgroundColor: tokens.panel,
            overflow: "hidden",
          }}
        >
          {hasImage ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={`feed-block:${imageUri}`}
              priority="low"
              accessibilityLabel={a11yLabel}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="image-outline" size={36} color={tokens.muted} />
            </View>
          )}
        </View>
      </Pressable>

      {trimmedTitle !== null ? (
        <Text
          numberOfLines={2}
          style={{
            marginTop: HOME_SPACE.sm,
            paddingHorizontal: FEED_HORIZONTAL_PADDING,
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            lineHeight: 18,
            color: tokens.muted,
          }}
        >
          {trimmedTitle}
        </Text>
      ) : null}

      {gridProducts.length > 0 ? (
        <View
          style={{
            marginTop: HOME_SPACE.md,
            paddingHorizontal: FEED_HORIZONTAL_PADDING,
          }}
        >
          <HomeProductGrid
            items={gridProducts}
            metrics={gridMetrics}
            keyExtractor={(product) => product.id}
            renderItem={(product, _index, cardWidth) => (
              <StorefrontProductTile
                product={product}
                style={{ width: cardWidth }}
                imagePriority={false}
                onPress={(colorId) => {
                  handleProductPress(product.id, colorId);
                }}
              />
            )}
          />
        </View>
      ) : null}

      {showSeeAll ? (
        <View
          style={{
            marginTop: HOME_SPACE.sm,
            paddingHorizontal: FEED_HORIZONTAL_PADDING,
            alignSelf: "stretch",
            width: "100%",
          }}
        >
          <StorefrontSeeAllButton
            label={resolvedSeeAllLabel}
            onPress={handleSeeAllPress}
            accessibilityLabel={resolvedSeeAllLabel}
          />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Memoized feed block — FlatList rows skip reconcile when props are shallow-equal.
 */
export const StorefrontFeedBlock = React.memo(StorefrontFeedBlockInner);
