import { Ionicons } from "@expo/vector-icons";
import { usePreventRemove } from "@react-navigation/native";
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

import { CartButton } from "@/components/cart/CartButton";
import { CeremonySection, PressableScale, AddedToBagTray } from "@/components/motion";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useProductContext } from "@/context/product/ProductContext";
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
import type { ThemeTokens } from "@/themes/types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Immersive night media plate — ~70% of window so first paint is media-first,
 * not a Classic 1:1 square with dark paint.
 */
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.7);

/** Filmstrip thumb size along the hero edge. */
const THUMB_SIZE = 40;

/** How far the buy panel pulls up over the media wash. */
const PANEL_OVERLAP = 28;

const PDP_CTA_SLIDE_Y = 72;
const PDP_ENTRANCE_BASE_DELAY_MS = 0;
const PDP_ENTRANCE_DURATION_MS = motion.duration.dailyEntrance;
const PDP_ENTRANCE_STAGGER_MS = motion.delay.dailyStagger;

/**
 * Quiet floating chrome chip — translucent night glass, not a header bar.
 */
const FLOATING_CHIP = {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: "rgba(10,10,10,0.55)",
  borderWidth: 1,
} as const;

/**
 * Sticky Add-to-bag bar — slides up last in the every-open PDP entrance.
 */
function NoirPdpStickyCtaBar({
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
  const opacity = useSharedValue(skipAnimation ? 1 : 0);
  const translateY = useSharedValue(skipAnimation ? 0 : PDP_CTA_SLIDE_Y);

  useEffect(() => {
    if (skipAnimation) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    opacity.value = 0;
    translateY.value = PDP_CTA_SLIDE_Y;

    const delayMs = PDP_ENTRANCE_DURATION_MS + PDP_ENTRANCE_STAGGER_MS * 2;

    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: motion.duration.ctaSlide,
        easing: motionEasing,
      })
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, {
        duration: motion.duration.ctaSlide,
        easing: motionEasing,
      })
    );
  }, [skipAnimation, productId, opacity, translateY]);

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
 * PDP wishlist heart — gold fill only when saved; otherwise quiet outline.
 */
function NoirPdpWishlistHeart({
  isSaved,
  onPress,
  accessibilityLabel,
  tokens,
}: Readonly<{
  isSaved: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  tokens: ThemeTokens;
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
      centerContent
      style={{
        ...FLOATING_CHIP,
        borderColor: "rgba(255,255,255,0.12)",
      }}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isSaved ? "heart" : "heart-outline"}
          size={18}
          color={isSaved ? tokens.accent : tokens.text}
        />
      </Animated.View>
    </PressableScale>
  );
}

/**
 * Compact night accordion — hairline row, no Classic card chrome.
 */
function NoirAccordion({
  title,
  children,
  open,
  onToggle,
  tokens,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  tokens: ThemeTokens;
}>): React.ReactElement {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: tokens.border }}>
      <TouchableOpacity
        onPress={onToggle}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 14,
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: tokens.text,
            fontFamily: "Inter_400Regular",
            fontWeight: "500",
          }}
        >
          {title}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={tokens.muted}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </TouchableOpacity>
      {open ? <View style={{ paddingBottom: 14 }}>{children}</View> : null}
    </View>
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
 * Noir PDP — immersive night buy plate.
 * Act one: full-bleed media + quiet floating chrome.
 * Act two: price / name / variants on a dark panel that overlaps the wash.
 * Sticky Add is the only loud gold CTA — header bag stays quiet glass.
 */
export function NoirProductDetailScreen(): React.ReactElement {
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
    () =>
      [...(product?.medias ?? [])].sort(
        (a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)
      ),
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
  const [openAccordion, setOpenAccordion] = useState<string>("description");
  const [adding, setAdding] = useState(false);
  const [addErrorKey, setAddErrorKey] = useState<string | null>(null);
  const [addErrorRaw, setAddErrorRaw] = useState<string | null>(null);
  const [showAddedTray, setShowAddedTray] = useState(false);

  const hasProduct = product !== undefined;

  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedColorId(null);
    setSelectedSizeId(null);
    setOpenAccordion("description");
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

  const selectionPrompt = useMemo((): string => {
    const needColor = requiresColor && selectedColorId === null;
    const needSize = requiresSize && selectedSizeId === null;
    if (needColor && needSize) {
      return t("product.selectColorAndSize");
    }
    if (needColor) {
      return t("product.selectColor");
    }
    if (needSize) {
      return t("product.selectSize");
    }
    return "";
  }, [requiresColor, requiresSize, selectedColorId, selectedSizeId, t]);

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
        previous !== undefined && typeof previous.name === "string"
          ? previous.name
          : "";
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
        <ActivityIndicator size="large" color={tokens.accent} />
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
            fontFamily: "Inter_400Regular",
            fontSize: 18,
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
            backgroundColor: tokens.accent,
            borderRadius: 4,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: tokens.bg,
              fontSize: 13,
              fontWeight: "700",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontFamily: "Inter_400Regular",
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
  const ctaDisabled = adding || (hasAllSelections && !isInStock);
  const priceLabel = formatRm(typeof product.price === "number" ? product.price : 0);
  const stickyBarHeight = 72 + Math.max(insets.bottom, 10);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: stickyBarHeight + 16 }}
      >
        {/* ── Act one: full-bleed night media ─────────────────────────── */}
        <View
          style={{
            width: SCREEN_WIDTH,
            height: HERO_HEIGHT,
            backgroundColor: tokens.panel,
            overflow: "hidden",
          }}
        >
          <CeremonySection
            key={`${product.id}-hero`}
            index={0}
            play={playEntrance}
            baseDelayMs={PDP_ENTRANCE_BASE_DELAY_MS}
            durationMs={PDP_ENTRANCE_DURATION_MS}
            staggerMs={PDP_ENTRANCE_STAGGER_MS}
            scaleFrom={motion.scale.pdpHeroStart}
            style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
          >
            {currentMedia !== null &&
            currentMedia.media_url !== null &&
            currentMedia.media_url.length > 0 ? (
              <Image
                source={{ uri: currentMedia.media_url }}
                style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
                contentFit="cover"
                accessibilityLabel={displayName}
              />
            ) : (
              <View
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="image-outline" size={48} color={tokens.muted} />
              </View>
            )}
          </CeremonySection>

          {/* Tap halves to advance media — under chrome, above wash */}
          {sortedMedias.length > 1 ? (
            <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => navigateImage("prev")}
                accessibilityRole="button"
                accessibilityLabel={t("product.alt")}
              />
              <Pressable
                style={{ flex: 1 }}
                onPress={() => navigateImage("next")}
                accessibilityRole="button"
                accessibilityLabel={t("product.alt")}
              />
            </View>
          ) : null}

          {/* Soft wash into the buy panel */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 120,
              backgroundColor: "rgba(10,10,10,0.55)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 56,
              backgroundColor: "rgba(10,10,10,0.72)",
            }}
          />

          {/* Filmstrip thumbs — media system, not Classic counter badge */}
          {sortedMedias.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{
                position: "absolute",
                bottom: PANEL_OVERLAP + 8,
                left: 0,
                right: 0,
              }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                gap: 8,
                alignItems: "center",
              }}
            >
              {sortedMedias.map((media, idx) => {
                const uri =
                  typeof media.media_url === "string" && media.media_url.length > 0
                    ? media.media_url
                    : null;
                const selected = idx === selectedImageIdx;
                return (
                  <Pressable
                    key={media.id ?? `media-${idx}`}
                    onPress={() => setSelectedImageIdx(idx)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      width: THUMB_SIZE,
                      height: THUMB_SIZE,
                      borderRadius: 2,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: selected ? tokens.accent : "rgba(255,255,255,0.2)",
                      opacity: selected ? 1 : 0.55,
                    }}
                  >
                    {uri !== null ? (
                      <Image
                        source={{ uri }}
                        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: tokens.panel,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="image-outline" size={14} color={tokens.muted} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Quiet floating chrome — single plane, no double wrappers */}
          <PressableScale
            onPress={handleBack}
            haptic="light"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("orders.back")}
            centerContent
            style={{
              position: "absolute",
              top: insets.top + 10,
              left: 14,
              ...FLOATING_CHIP,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <Ionicons name="arrow-back" size={18} color={tokens.text} />
          </PressableScale>

          <View
            style={{
              position: "absolute",
              top: insets.top + 10,
              right: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CartButton
              color={tokens.text}
              size={38}
              iconSize={18}
              badgeOffset={{ top: -2, right: -2 }}
              style={{
                ...FLOATING_CHIP,
                borderColor: "rgba(255,255,255,0.12)",
              }}
              accessibilityLabel={t("nav.openCart")}
            />
            <NoirPdpWishlistHeart
              isSaved={isSaved}
              onPress={() => void handleToggleWishlist()}
              tokens={tokens}
              accessibilityLabel={
                isSaved
                  ? t("product.removeFromWishlistAria")
                  : t("product.addToWishlistAria")
              }
            />
          </View>
        </View>

        {/* ── Act two: dark buy panel overlapping the wash ────────────── */}
        <View
          style={{
            marginTop: -PANEL_OVERLAP,
            backgroundColor: tokens.bg,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 8,
          }}
        >
          <CeremonySection
            key={`${product.id}-title`}
            index={1}
            play={playEntrance}
            baseDelayMs={PDP_ENTRANCE_BASE_DELAY_MS}
            durationMs={PDP_ENTRANCE_DURATION_MS}
            staggerMs={PDP_ENTRANCE_STAGGER_MS}
          >
            {/* Price first — commerce hierarchy, not Classic name-lead */}
            <Text
              style={{
                fontSize: 28,
                color: tokens.text,
                fontWeight: "700",
                fontFamily: "Inter_400Regular",
                letterSpacing: 0.2,
                marginBottom: 6,
              }}
            >
              {priceLabel}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 15,
                color: tokens.muted,
                lineHeight: 22,
                fontWeight: "400",
                letterSpacing: 0.1,
              }}
            >
              {displayName}
            </Text>
          </CeremonySection>

          <CeremonySection
            key={`${product.id}-secondary`}
            index={2}
            play={playEntrance}
            baseDelayMs={PDP_ENTRANCE_BASE_DELAY_MS}
            durationMs={PDP_ENTRANCE_DURATION_MS}
            staggerMs={PDP_ENTRANCE_STAGGER_MS}
          >
            <View style={{ marginTop: 12 }}>
              {!hasAllSelections && (requiresColor || requiresSize) ? (
                <Text
                  style={{
                    fontSize: 11,
                    letterSpacing: 0.6,
                    color: tokens.muted,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {selectionPrompt}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: isInStock ? tokens.success : tokens.danger,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {isInStock
                    ? t("product.inStock", { count: String(stockCount) })
                    : t("product.outOfStock")}
                </Text>
              )}
            </View>

            {requiresColor ? (
              <View style={{ marginTop: 22 }}>
                <Text
                  style={{
                    fontSize: 10,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: tokens.muted,
                    fontWeight: "500",
                    fontFamily: "Inter_400Regular",
                    marginBottom: 10,
                  }}
                >
                  {t("product.color")}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {activeColors.map((c) => {
                    const selected = selectedColorId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setSelectedColorId(c.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={{
                          height: 36,
                          paddingHorizontal: 14,
                          borderRadius: 2,
                          borderWidth: 1,
                          borderColor: selected ? tokens.accent : tokens.border,
                          backgroundColor: selected
                            ? "rgba(184,154,106,0.12)"
                            : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: selected ? tokens.accent : tokens.muted,
                            fontWeight: selected ? "600" : "400",
                            fontFamily: "Inter_400Regular",
                          }}
                        >
                          {c.color ?? c.id}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {requiresSize ? (
              <TourAnchor id={ANCHORS.pdp.size}>
                <View style={{ marginTop: 22 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      letterSpacing: 1.6,
                      textTransform: "uppercase",
                      color: tokens.muted,
                      fontWeight: "500",
                      fontFamily: "Inter_400Regular",
                      marginBottom: 10,
                    }}
                  >
                    {t("product.size")}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {activeSizes.map((s) => {
                      const selected = selectedSizeId === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => setSelectedSizeId(s.id)}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={{
                            minWidth: 48,
                            height: 44,
                            paddingHorizontal: 14,
                            borderWidth: 1,
                            borderRadius: 2,
                            borderColor: selected ? tokens.accent : tokens.border,
                            backgroundColor: selected
                              ? "rgba(184,154,106,0.12)"
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: selected ? tokens.accent : tokens.text,
                              fontWeight: selected ? "600" : "400",
                              fontFamily: "Inter_400Regular",
                            }}
                          >
                            {s.size ?? s.id}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </TourAnchor>
            ) : null}

            {/* Specs rail — quieter than Classic accordion stack */}
            <View
              style={{
                marginTop: 28,
                borderTopWidth: 1,
                borderTopColor: tokens.border,
              }}
            >
              <NoirAccordion
                title={t("product.details")}
                open={openAccordion === "description"}
                onToggle={() =>
                  setOpenAccordion(
                    openAccordion === "description" ? "" : "description"
                  )
                }
                tokens={tokens}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: tokens.muted,
                    lineHeight: 21,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {translatedDescription.length > 0
                    ? translatedDescription
                    : t("product.noDescription")}
                </Text>
              </NoirAccordion>

              <NoirAccordion
                title={t("product.materialCare")}
                open={openAccordion === "material"}
                onToggle={() =>
                  setOpenAccordion(openAccordion === "material" ? "" : "material")
                }
                tokens={tokens}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: tokens.muted,
                    lineHeight: 21,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {t("product.materialCareBody")}
                </Text>
              </NoirAccordion>

              <NoirAccordion
                title={t("product.shippingReturns")}
                open={openAccordion === "shipping"}
                onToggle={() =>
                  setOpenAccordion(openAccordion === "shipping" ? "" : "shipping")
                }
                tokens={tokens}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: tokens.muted,
                    lineHeight: 21,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {t("product.shippingReturnsBody")}
                </Text>
              </NoirAccordion>
            </View>

            {/* Quiet reviews footnote — no Classic write-review theater */}
            <Text
              style={{
                marginTop: 24,
                marginBottom: 8,
                fontSize: 11,
                letterSpacing: 0.4,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
              }}
            >
              {[t("product.reviewsTitle"), t("product.reviewsEmpty")].join(" — ")}
            </Text>
          </CeremonySection>
        </View>
      </ScrollView>

      {/* Sticky Add — sole loud gold on the buy plate */}
      <NoirPdpStickyCtaBar
        play={playEntrance}
        productId={product.id}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(10,10,10,0.96)",
          borderTopWidth: 1,
          borderTopColor: tokens.border,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 10),
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View style={{ flexShrink: 0, minWidth: 76 }}>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 16,
                fontWeight: "700",
                color: tokens.text,
                letterSpacing: 0.2,
              }}
            >
              {priceLabel}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <TourAnchor id={ANCHORS.pdp.addToBag}>
              <PressableScale
                haptic="none"
                onPress={() => void onAddToCart()}
                disabled={ctaDisabled}
                accessibilityRole="button"
                accessibilityLabel={t("product.addToBag")}
                centerContent
                style={{
                  height: 52,
                  width: "100%",
                  backgroundColor: tokens.accent,
                  borderRadius: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: ctaDisabled ? 0.4 : 1,
                }}
              >
                {adding ? (
                  <ActivityIndicator color={tokens.bg} />
                ) : (
                  <Text
                    style={{
                      color: tokens.bg,
                      fontSize: 13,
                      fontWeight: "700",
                      letterSpacing: 1.6,
                      textTransform: "uppercase",
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {t("product.addToBag")}
                  </Text>
                )}
              </PressableScale>
            </TourAnchor>
          </View>
        </View>
      </NoirPdpStickyCtaBar>

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
