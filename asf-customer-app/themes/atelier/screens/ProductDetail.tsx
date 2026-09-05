import { Ionicons } from "@expo/vector-icons";
import { usePreventRemove } from "expo-router/react-navigation";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CeremonySection, PressableScale, AddedToBagTray } from "@/components/motion";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useThemeTokens } from "@/context/ThemeContext";
import {
  leaveBrowseProduct,
  openBrowseCatalog,
  resolveBrowseReturnTo,
} from "@/lib/browseNavigation";
import { formatRm } from "@/lib/formatCurrency";
import { hapticLight, hapticMedium, hapticSelection } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";
import {
  getProductStockQuantity,
  resolveProductStockRow,
} from "@/lib/productStock";
import { atelierMotion } from "@/themes/atelier/motion";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Immersive plate hero — ~82% of window height so first paint is media-only
 * (within the 75–90% lookbook plate band). Not a Shop-card 4:5 crop.
 */
const GALLERY_HEIGHT = Math.round(SCREEN_HEIGHT * 0.82);

/** Thin overlay thumbnail size on the hero edge. */
const OVERLAY_THUMB_W = 36;
const OVERLAY_THUMB_H = 48;

/** Slim sticky Add control height — intentional bar, not Classic 56px block. */
const STICKY_ADD_HEIGHT = 44;

/** Shared floating chrome chip on the plate media (back / wishlist). */
const MEDIA_CHIP_BG = "rgba(246,241,232,0.88)";

/** Paper sticky-bar ground — matches Atelier bg with slight translucency. */
const STICKY_BAR_BG = "rgba(246,241,232,0.97)";

/**
 * Slim sticky Add-to-bag bar — slides up last in the every-open PDP plate
 * ceremony (after hero + type slab). Respects {@link useReducedMotion}.
 */
function AtelierStickyCtaBar({
  play,
  productId,
  children,
  style,
}: Readonly<{
  play: boolean;
  productId: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = !play || reducedMotion === true;
  const slideY = atelierMotion.pdpCtaSlideY;
  const opacity = useSharedValue(skipAnimation ? 1 : 0);
  const translateY = useSharedValue(skipAnimation ? 0 : slideY);

  useEffect(() => {
    if (skipAnimation) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = slideY;

    // Last beat: after hero settle + title stagger (index 1).
    const delayMs =
      atelierMotion.duration.pdpHeroMs + atelierMotion.delay.pdpStaggerMs * 2;

    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: atelierMotion.duration.pdpCtaSlideMs,
        easing: motionEasing,
      })
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, {
        duration: atelierMotion.duration.pdpCtaSlideMs,
        easing: motionEasing,
      })
    );
  }, [skipAnimation, productId, opacity, translateY, slideY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (skipAnimation) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

/**
 * PDP wishlist heart — scale snap with Atelier token colors.
 * Lives on the floating media chip (first viewport), not the type slab.
 */
function AtelierWishlistHeart({
  isSaved,
  onPress,
  accessibilityLabel,
  textColor,
  dangerColor,
}: Readonly<{
  isSaved: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  textColor: string;
  dangerColor: string;
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isSaved ? "heart" : "heart-outline"}
          size={20}
          color={isSaved ? dangerColor : textColor}
        />
      </Animated.View>
    </PressableScale>
  );
}

/**
 * Normalizes Expo Router dynamic-segment params (string | string[]) to a single id.
 */
function resolveProductIdParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string") {
      const trimmed = first.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
}

/**
 * One-line editorial teaser from description for the type slab (second act).
 * Returns null when empty or equal to the "no description" placeholder.
 */
function resolveEditorialTeaser(
  description: string,
  emptyPlaceholder: string
): string | null {
  const trimmed = description.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed === emptyPlaceholder) {
    return null;
  }
  const firstBreak = trimmed.search(/[\n\r]/);
  const firstLine = firstBreak >= 0 ? trimmed.slice(0, firstBreak).trim() : trimmed;
  if (firstLine.length === 0) {
    return null;
  }
  return firstLine;
}

/**
 * Inline detail block — Atelier prefers open caption sections over stacked accordions.
 */
function InlineDetailBlock({
  title,
  body,
  textColor,
  mutedColor,
  borderColor,
}: Readonly<{
  title: string;
  body: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}>): React.ReactElement {
  return (
    <View
      style={{
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: mutedColor,
          fontFamily: "Inter_400Regular",
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: textColor,
          lineHeight: 22,
          fontFamily: "Inter_400Regular",
        }}
      >
        {body}
      </Text>
    </View>
  );
}

/**
 * Text-index variant row — selected = underline / hairline, not Classic chips.
 */
function VariantIndexRow({
  label,
  selected,
  textColor,
  mutedColor,
  onPress,
}: Readonly<{
  label: string;
  selected: boolean;
  textColor: string;
  mutedColor: string;
  onPress: () => void;
}>): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{
        paddingVertical: 14,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontSize: 16,
          color: selected ? textColor : mutedColor,
          fontFamily: "Inter_400Regular",
          letterSpacing: selected ? 0.3 : 0,
        }}
      >
        {label}
      </Text>
      {/* Hairline underline marks selection — not Classic chip chrome */}
      <View
        style={{
          marginTop: 6,
          height: 1,
          backgroundColor: selected ? textColor : "transparent",
          opacity: selected ? 0.55 : 0,
        }}
      />
    </TouchableOpacity>
  );
}

/**
 * Atelier product inner (PDP) — magazine **plate** (Tier A).
 *
 * First viewport is immersive media (~82% window height) with floating back +
 * wishlist chips and demoted overlay thumbs. Type slab + variant ritual scroll
 * in as the second act. Designed slim sticky Add (ink fill when ready, muted
 * outline + quiet reason until variants chosen). FAB hidden on this route
 * ({@link AtelierCartChrome}). Every-open plate ceremony: hero → title → CTA.
 */
export function AtelierProductDetailScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const params = useLocalSearchParams<{
    productId: string | string[];
    returnTo?: string | string[];
  }>();
  const productId = resolveProductIdParam(params.productId);
  const returnTo = resolveBrowseReturnTo(params.returnTo);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const { products, loading } = useProductContext();
  const { user } = useAuthContext();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const { createAddToCart, add_to_carts, updateAddToCart } = useAddToCartContext();

  const playEntrance = reducedMotion !== true;

  const product = useMemo(
    () => (productId === null ? undefined : products.find((p) => p.id === productId)),
    [products, productId]
  );

  const sortedMedias = useMemo(
    () => [...(product?.medias ?? [])].sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)),
    [product]
  );

  const activeColors = useMemo(
    () => (product?.product_colors ?? []).filter((c) => c.active),
    [product]
  );
  const activeSizes = useMemo(
    () => (product?.product_sizes ?? []).filter((s) => s.active),
    [product]
  );

  const requiresColor = activeColors.length > 0;
  const requiresSize = activeSizes.length > 0;

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addErrorKey, setAddErrorKey] = useState<string | null>(null);
  const [addErrorRaw, setAddErrorRaw] = useState<string | null>(null);
  const [showAddedTray, setShowAddedTray] = useState(false);

  const hasProduct = product !== undefined;

  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedColorId(null);
    setSelectedSizeId(null);
    setAddErrorKey(null);
    setAddErrorRaw(null);
    setShowAddedTray(false);
  }, [productId]);

  useEffect(() => {
    if (productId === null || !hasProduct) {
      return;
    }
    if (reducedMotion === true) {
      return;
    }
    void hapticLight();
  }, [productId, hasProduct, reducedMotion]);

  useEffect(() => {
    if (requiresColor && activeColors.length === 1 && selectedColorId === null) {
      setSelectedColorId(activeColors[0].id);
    }
    if (requiresSize && activeSizes.length === 1 && selectedSizeId === null) {
      setSelectedSizeId(activeSizes[0].id);
    }
  }, [activeColors, activeSizes, requiresColor, requiresSize, selectedColorId, selectedSizeId]);

  const isSaved = product !== null && product !== undefined ? isInWishlist(product.id) : false;

  const hasAllSelections =
    (!requiresColor || selectedColorId !== null) &&
    (!requiresSize || selectedSizeId !== null);

  const currentStockRow = useMemo(() => {
    if (product === undefined) {
      return null;
    }
    return resolveProductStockRow({
      productId: product.id,
      productStocks: product.product_stocks,
      requiresColor,
      requiresSize,
      selectedColorId,
      selectedSizeId,
    });
  }, [product, requiresColor, requiresSize, selectedColorId, selectedSizeId]);

  const stockCount = getProductStockQuantity(currentStockRow);
  const isInStock = hasAllSelections && currentStockRow !== null && stockCount > 0;

  /**
   * Quiet CTA / slab hint — editorial phrasing (no "Please..."), shown when
   * color/size are still required before Add is enabled.
   */
  const selectionPrompt = useMemo((): string => {
    const needColor = requiresColor && selectedColorId === null;
    const needSize = requiresSize && selectedSizeId === null;
    if (needColor && needSize) {
      return t("product.atelierCtaHintBoth");
    }
    if (needColor) {
      return t("product.atelierCtaHintColor");
    }
    if (needSize) {
      return t("product.atelierCtaHintSize");
    }
    return "";
  }, [requiresColor, requiresSize, selectedColorId, selectedSizeId, t]);

  /** Sticky Add is muted until required variants are chosen and stock exists. */
  const canAddToBag = hasAllSelections && isInStock;
  const ctaDisabled = adding || !canAddToBag;

  const navigateImage = (dir: "prev" | "next"): void => {
    if (sortedMedias.length <= 1) {
      return;
    }
    setSelectedImageIdx((prev) => {
      if (dir === "next") {
        return prev < sortedMedias.length - 1 ? prev + 1 : 0;
      }
      return prev > 0 ? prev - 1 : sortedMedias.length - 1;
    });
  };

  const handleToggleWishlist = useCallback(async (): Promise<void> => {
    if (product === undefined) {
      return;
    }
    if (user === null) {
      router.push("/(auth)/sign-in");
      return;
    }
    if (isSaved) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  }, [addToWishlist, isSaved, product, removeFromWishlist, router, user]);

  const handleBack = useCallback((): void => {
    if (returnTo === "home" || returnTo === "wishlist") {
      leaveBrowseProduct(router, returnTo);
      return;
    }

    const state = navigation.getState();
    const localIndex = typeof state?.index === "number" ? state.index : 0;
    const routes = state?.routes;
    if (localIndex > 0 && Array.isArray(routes)) {
      const previous = routes[localIndex - 1];
      const previousName =
        previous !== undefined && typeof previous.name === "string" ? previous.name : "";
      if (previousName === "[productId]") {
        openBrowseCatalog(router);
        return;
      }
      router.back();
      return;
    }
    openBrowseCatalog(router);
  }, [navigation, returnTo, router]);

  const shouldInterceptBack = returnTo === "home" || returnTo === "wishlist";

  usePreventRemove(shouldInterceptBack, ({ data }) => {
    const actionType = data.action.type;
    if (actionType === "GO_BACK" || actionType === "POP") {
      leaveBrowseProduct(router, returnTo);
      return;
    }
    navigation.dispatch(data.action);
  });

  const onAddToCart = useCallback(async (): Promise<void> => {
    setAddErrorKey(null);
    setAddErrorRaw(null);
    if (product === undefined) {
      return;
    }
    if (user === null) {
      router.push("/(auth)/sign-in");
      return;
    }
    if (requiresColor && selectedColorId === null) {
      setAddErrorKey("product.selectColorError");
      return;
    }
    if (requiresSize && selectedSizeId === null) {
      setAddErrorKey("product.selectSizeError");
      return;
    }
    if (currentStockRow === null) {
      setAddErrorKey("product.noStockForVariant");
      return;
    }
    if (stockCount < 1) {
      setAddErrorKey("product.insufficientStock");
      return;
    }
    setAdding(true);
    try {
      const existing = add_to_carts.find(
        (row) =>
          row.user_id === user.id &&
          row.product_id === product.id &&
          row.color_id === selectedColorId &&
          row.size_id === selectedSizeId
      );
      if (existing !== undefined) {
        await updateAddToCart({ id: existing.id, amount: existing.amount + 1 });
      } else {
        await createAddToCart({
          user_id: user.id,
          product_id: product.id,
          color_id: selectedColorId,
          size_id: selectedSizeId,
          amount: 1,
        });
      }
      void hapticMedium();
      setShowAddedTray(true);
    } catch (e) {
      if (e instanceof Error) {
        setAddErrorRaw(e.message);
      } else {
        setAddErrorKey("product.addToBagFailed");
      }
    } finally {
      setAdding(false);
    }
  }, [
    add_to_carts,
    createAddToCart,
    currentStockRow,
    product,
    requiresColor,
    requiresSize,
    selectedColorId,
    selectedSizeId,
    stockCount,
    updateAddToCart,
    user,
    router,
  ]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.bg,
        }}
      >
        <ActivityIndicator size="large" color={tokens.text} />
      </View>
    );
  }

  if (product === undefined) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 20,
            color: tokens.text,
            marginBottom: 16,
          }}
        >
          {t("product.notFound")}
        </Text>
        <TouchableOpacity
          onPress={() => openBrowseCatalog(router)}
          style={{
            height: 48,
            paddingHorizontal: 28,
            backgroundColor: tokens.text,
            borderRadius: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: tokens.bg,
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              letterSpacing: 0.5,
            }}
          >
            {t("product.continueShopping")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentMedia = sortedMedias[selectedImageIdx] ?? null;
  const translatedName = translateProduct(product.id, "name", product.name ?? null);
  const displayName = translatedName.length > 0 ? translatedName : t("common.product");
  const translatedDescription = translateProduct(
    product.id,
    "description",
    product.description
  );
  const addErrorMessage = addErrorKey !== null ? t(addErrorKey) : addErrorRaw;
  const emptyPlaceholder = t("product.noDescription");
  const descriptionBody =
    translatedDescription.length > 0 ? translatedDescription : emptyPlaceholder;
  const editorialTeaser = resolveEditorialTeaser(
    translatedDescription,
    emptyPlaceholder
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 112 + insets.bottom }}
      >
        {/* Plate hero — edge-to-edge media; first paint is immersive */}
        <View
          style={{
            width: SCREEN_WIDTH,
            height: GALLERY_HEIGHT,
            backgroundColor: tokens.panel,
            overflow: "hidden",
          }}
        >
          <CeremonySection
            key={`${product.id}-hero`}
            index={0}
            play={playEntrance}
            baseDelayMs={0}
            durationMs={atelierMotion.duration.pdpHeroMs}
            staggerMs={atelierMotion.delay.pdpStaggerMs}
            scaleFrom={motion.scale.pdpHeroStart}
            style={{ width: SCREEN_WIDTH, height: GALLERY_HEIGHT }}
          >
            {currentMedia !== null &&
            currentMedia.media_url !== null &&
            currentMedia.media_url.length > 0 ? (
              <Image
                source={{ uri: currentMedia.media_url }}
                style={{ width: SCREEN_WIDTH, height: GALLERY_HEIGHT }}
                contentFit="cover"
                accessibilityLabel={displayName}
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="image-outline" size={48} color={tokens.muted} />
              </View>
            )}
          </CeremonySection>

          {/* Tap L/R for next/prev — under chrome, over image */}
          {sortedMedias.length > 1 ? (
            <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
              <Pressable style={{ flex: 1 }} onPress={() => navigateImage("prev")} />
              <Pressable style={{ flex: 1 }} onPress={() => navigateImage("next")} />
            </View>
          ) : null}

          {/* Quiet 1 / N on media */}
          {sortedMedias.length > 1 ? (
            <View
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                backgroundColor: "rgba(44,36,22,0.4)",
                borderRadius: 2,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
              pointerEvents="none"
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontFamily: "Inter_400Regular",
                  letterSpacing: 1.5,
                }}
              >
                {[String(selectedImageIdx + 1), String(sortedMedias.length)].join(" / ")}
              </Text>
            </View>
          ) : null}

          {/* Demoted filmstrip — thin overlay thumbs on the image edge */}
          {sortedMedias.length > 1 ? (
            <View
              style={{
                position: "absolute",
                right: 12,
                bottom: 56,
                gap: 6,
                alignItems: "center",
              }}
              pointerEvents="box-none"
            >
              {sortedMedias.map((media, idx) => {
                const uri =
                  typeof media.media_url === "string" ? media.media_url : "";
                const selected = idx === selectedImageIdx;
                return (
                  <Pressable
                    key={media.id}
                    onPress={() => setSelectedImageIdx(idx)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={[
                      t("product.alt"),
                      String(idx + 1),
                    ].join(" ")}
                    style={{
                      width: OVERLAY_THUMB_W,
                      height: OVERLAY_THUMB_H,
                      backgroundColor: tokens.panel,
                      overflow: "hidden",
                      opacity: selected ? 1 : 0.42,
                      borderWidth: selected ? 1 : 0,
                      borderColor: "rgba(246,241,232,0.9)",
                    }}
                  >
                    {uri.length > 0 ? (
                      <Image
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Floating back + wishlist chips on media only */}
          <TouchableOpacity
            onPress={handleBack}
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: MEDIA_CHIP_BG,
              borderWidth: 1,
              borderColor: tokens.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.text} />
          </TouchableOpacity>

          <View
            style={{
              position: "absolute",
              top: insets.top + 8,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: MEDIA_CHIP_BG,
              borderWidth: 1,
              borderColor: tokens.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AtelierWishlistHeart
              isSaved={isSaved}
              onPress={() => void handleToggleWishlist()}
              accessibilityLabel={
                isSaved
                  ? t("product.removeFromWishlistAria")
                  : t("product.addToWishlistAria")
              }
              textColor={tokens.text}
              dangerColor={tokens.accent}
            />
          </View>
        </View>

        {/* Type slab — second act: eyebrow → Playfair name → price → teaser */}
        <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 8 }}>
          <CeremonySection
            key={`${product.id}-title`}
            index={1}
            play={playEntrance}
            baseDelayMs={0}
            durationMs={atelierMotion.duration.pdpSlabMs}
            staggerMs={atelierMotion.delay.pdpStaggerMs}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                color: tokens.muted,
                marginBottom: 14,
              }}
            >
              {t("product.atelierEyebrow")}
            </Text>
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 34,
                color: tokens.text,
                lineHeight: 42,
              }}
            >
              {displayName}
            </Text>

            <Text
              style={{
                fontSize: 15,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
                marginTop: 14,
              }}
            >
              {formatRm(typeof product.price === "number" ? product.price : 0)}
            </Text>

            {editorialTeaser !== null ? (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  color: tokens.muted,
                  fontFamily: "Inter_400Regular",
                  lineHeight: 22,
                  marginTop: 16,
                  opacity: 0.9,
                }}
              >
                {editorialTeaser}
              </Text>
            ) : null}
          </CeremonySection>

          <CeremonySection
            key={`${product.id}-secondary`}
            index={2}
            play={playEntrance}
            baseDelayMs={0}
            durationMs={atelierMotion.duration.pdpSlabMs}
            staggerMs={atelierMotion.delay.pdpStaggerMs}
          >
            <View style={{ marginTop: 20 }}>
              {!hasAllSelections && (requiresColor || requiresSize) ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: tokens.muted,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {selectionPrompt}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: isInStock ? tokens.muted : tokens.danger,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {isInStock
                    ? t("product.inStock", { count: String(stockCount) })
                    : t("product.outOfStock")}
                </Text>
              )}
            </View>

            {/* Variant ritual — text-index; Select color / Select size step labels */}
            {requiresColor ? (
              <View style={{ marginTop: 40 }}>
                <Text
                  style={{
                    fontSize: 11,
                    letterSpacing: 2.2,
                    textTransform: "uppercase",
                    color: tokens.muted,
                    fontFamily: "Inter_400Regular",
                    marginBottom: 4,
                  }}
                >
                  {t("product.atelierSelectColor")}
                </Text>
                <View style={{ gap: 0 }}>
                  {activeColors.map((c) => {
                    const selected = selectedColorId === c.id;
                    const label = c.color ?? c.id;
                    return (
                      <VariantIndexRow
                        key={c.id}
                        label={label}
                        selected={selected}
                        textColor={tokens.text}
                        mutedColor={tokens.muted}
                        onPress={() => setSelectedColorId(c.id)}
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}

            {requiresSize ? (
              <TourAnchor id={ANCHORS.pdp.size}>
                <View style={{ marginTop: 36 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      letterSpacing: 2.2,
                      textTransform: "uppercase",
                      color: tokens.muted,
                      fontFamily: "Inter_400Regular",
                      marginBottom: 4,
                    }}
                  >
                    {t("product.atelierSelectSize")}
                  </Text>
                  <View style={{ gap: 0 }}>
                    {activeSizes.map((s) => {
                      const selected = selectedSizeId === s.id;
                      const label = s.size ?? s.id;
                      return (
                        <VariantIndexRow
                          key={s.id}
                          label={label}
                          selected={selected}
                          textColor={tokens.text}
                          mutedColor={tokens.muted}
                          onPress={() => setSelectedSizeId(s.id)}
                        />
                      );
                    })}
                  </View>
                </View>
              </TourAnchor>
            ) : null}

            {/* Inline details — always open, quieter than Classic accordions */}
            <View style={{ marginTop: 48, borderTopWidth: 1, borderTopColor: tokens.border }}>
              <InlineDetailBlock
                title={t("product.details")}
                body={descriptionBody}
                textColor={tokens.text}
                mutedColor={tokens.muted}
                borderColor={tokens.border}
              />
              <InlineDetailBlock
                title={t("product.materialCare")}
                body={t("product.materialCareBody")}
                textColor={tokens.text}
                mutedColor={tokens.muted}
                borderColor={tokens.border}
              />
              <InlineDetailBlock
                title={t("product.shippingReturns")}
                body={t("product.shippingReturnsBody")}
                textColor={tokens.text}
                mutedColor={tokens.muted}
                borderColor={tokens.border}
              />
            </View>

            <View style={{ marginTop: 40, marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: tokens.muted,
                  fontFamily: "Inter_400Regular",
                  marginBottom: 10,
                }}
              >
                {t("product.reviewsTitle")}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: tokens.muted,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("product.reviewsEmpty")}
              </Text>
            </View>
          </CeremonySection>
        </View>
      </ScrollView>

      {/*
        Designed sticky Add — slim paper bar; ink fill when ready, outline when
        muted. FAB is hidden on this route (see AtelierCartChrome).
      */}
      <AtelierStickyCtaBar
        play={playEntrance}
        productId={product.id}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: STICKY_BAR_BG,
          borderTopWidth: 1,
          borderTopColor: tokens.border,
          paddingHorizontal: 24,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        {addErrorMessage !== null ? (
          <Text
            style={{
              fontSize: 12,
              color: tokens.danger,
              marginBottom: 8,
              textAlign: "center",
              fontFamily: "Inter_400Regular",
            }}
          >
            {addErrorMessage}
          </Text>
        ) : null}

        {/* Quiet reason above the control — selection or stock, never shouty */}
        {addErrorMessage === null && !hasAllSelections && selectionPrompt.length > 0 ? (
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: tokens.muted,
              marginBottom: 8,
              textAlign: "center",
              fontFamily: "Inter_400Regular",
            }}
          >
            {selectionPrompt}
          </Text>
        ) : null}
        {addErrorMessage === null && hasAllSelections && !isInStock ? (
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: tokens.danger,
              marginBottom: 8,
              textAlign: "center",
              fontFamily: "Inter_400Regular",
              opacity: 0.85,
            }}
          >
            {t("product.outOfStock")}
          </Text>
        ) : null}

        <TourAnchor id={ANCHORS.pdp.addToBag}>
          <PressableScale
            haptic="none"
            onPress={() => void onAddToCart()}
            disabled={ctaDisabled}
            accessibilityRole="button"
            accessibilityLabel={t("product.addToBag")}
            accessibilityState={{ disabled: ctaDisabled }}
            centerContent
            style={{
              height: STICKY_ADD_HEIGHT,
              backgroundColor: canAddToBag ? tokens.text : "transparent",
              borderWidth: 1,
              borderColor: canAddToBag ? tokens.text : tokens.border,
              borderRadius: 2,
              alignItems: "center",
              justifyContent: "center",
              opacity: ctaDisabled && !adding ? 0.55 : 1,
            }}
          >
            {adding ? (
              <ActivityIndicator color={canAddToBag ? tokens.bg : tokens.text} />
            ) : (
              <Text
                style={{
                  color: canAddToBag ? tokens.bg : tokens.muted,
                  fontSize: 12,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                  fontFamily: "Inter_400Regular",
                }}
              >
                {t("product.addToBag")}
              </Text>
            )}
          </PressableScale>
        </TourAnchor>
      </AtelierStickyCtaBar>

      <AddedToBagTray
        visible={showAddedTray}
        titleLabel={t("product.addedLabel")}
        productName={displayName}
        thumbnailUri={
          currentMedia !== null &&
          typeof currentMedia.media_url === "string" &&
          currentMedia.media_url.length > 0
            ? currentMedia.media_url
            : null
        }
        accessibilityLabel={t("product.addedToBag")}
        onDismiss={() => {
          setShowAddedTray(false);
        }}
      />
    </View>
  );
}
