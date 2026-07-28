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

import { CeremonySection, PressableScale, AddedToBagTray } from "@/components/motion";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
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
import { colors as theme } from "@/constants/theme";
import {
  getProductStockQuantity,
  resolveProductStockRow,
} from "@/lib/productStock";

const SCREEN_WIDTH = Dimensions.get("window").width;

/** Upward travel (px) for the sticky Add-to-bag bar entrance. */
const PDP_CTA_SLIDE_Y = 72;

/** Shared daily-bold timing for PDP content stagger. */
const PDP_ENTRANCE_BASE_DELAY_MS = 0;
const PDP_ENTRANCE_DURATION_MS = motion.duration.dailyEntrance;
const PDP_ENTRANCE_STAGGER_MS = motion.delay.dailyStagger;

/**
 * Sticky Add-to-bag bar — slides up last in the every-open PDP entrance.
 * Remounts / resets when `productId` changes so each product open replays.
 */
function PdpStickyCtaBar({
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

    // Land after hero + title + variants have started settling.
    const delayMs =
      PDP_ENTRANCE_DURATION_MS + PDP_ENTRANCE_STAGGER_MS * 2;

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
 * PDP wishlist heart — scale snap 1 → heartPeak → 1 with selection haptic.
 */
function PdpWishlistHeart({
  isSaved,
  onPress,
  accessibilityLabel,
}: Readonly<{
  isSaved: boolean;
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ paddingTop: 4 }}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isSaved ? "heart" : "heart-outline"}
          size={24}
          color={isSaved ? "#EF4444" : theme.text}
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

// ─── Accordion item ───────────────────────────────────────────────────────────

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}

function Accordion({ title, children, open, onToggle }: AccordionProps): React.ReactElement {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <TouchableOpacity
        onPress={onToggle}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 20,
        }}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 15, color: theme.text, fontFamily: "Inter_400Regular" }}>{title}</Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={theme.muted}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </TouchableOpacity>
      {open && (
        <View style={{ paddingBottom: 16 }}>
          {children}
        </View>
      )}
    </View>
  );
}

// ─── Product detail screen ────────────────────────────────────────────────────

/**
 * Classic product inner (PDP) — matches web ProductDetailsClient (Tier A):
 *   - 1:1 image with tap-to-navigate and X/Y pill
 *   - Floating back + wishlist heart
 *   - Name, price, stock status
 *   - Color pills (rounded-full) + size squares (no radius)
 *   - Accordion: details, materials, shipping
 *   - Fixed bottom add-to-bag CTA
 */
export function ClassicProductDetailScreen(): React.ReactElement {
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

  /** Every PDP open gets a short entrance (not once/session). */
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
  const [openAccordion, setOpenAccordion] = useState<string>("description");
  const [adding, setAdding] = useState(false);
  const [addErrorKey, setAddErrorKey] = useState<string | null>(null);
  const [addErrorRaw, setAddErrorRaw] = useState<string | null>(null);
  /** Controls the short-lived add-to-bag confirmation tray (no navigation). */
  const [showAddedTray, setShowAddedTray] = useState(false);

  const hasProduct = product !== undefined;

  /** Reset local UI state when navigating to a different product on the reused screen. */
  useEffect(() => {
    setSelectedImageIdx(0);
    setSelectedColorId(null);
    setSelectedSizeId(null);
    setOpenAccordion("description");
    setAddErrorKey(null);
    setAddErrorRaw(null);
    setShowAddedTray(false);
  }, [productId]);

  /**
   * Light entrance pulse once per product open — not medium/success.
   * Skipped when reduced motion is on or the product is missing.
   */
  useEffect(() => {
    if (productId === null || !hasProduct) {
      return;
    }
    if (reducedMotion === true) {
      return;
    }
    void hapticLight();
  }, [productId, hasProduct, reducedMotion]);

  /** Auto-select when only one option */
  useEffect(() => {
    if (requiresColor && activeColors.length === 1 && selectedColorId === null) {
      setSelectedColorId(activeColors[0].id);
    }
    if (requiresSize && activeSizes.length === 1 && selectedSizeId === null) {
      setSelectedSizeId(activeSizes[0].id);
    }
  }, [activeColors, activeSizes, requiresColor, requiresSize, selectedColorId, selectedSizeId]);

  const isSaved = product !== null && product !== undefined ? isInWishlist(product.id) : false;

  const hasAllSelections = (!requiresColor || selectedColorId !== null) && (!requiresSize || selectedSizeId !== null);

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

  const navigateImage = (dir: "prev" | "next") => {
    if (sortedMedias.length <= 1) return;
    setSelectedImageIdx((prev) => {
      if (dir === "next") return prev < sortedMedias.length - 1 ? prev + 1 : 0;
      return prev > 0 ? prev - 1 : sortedMedias.length - 1;
    });
  };

  const handleToggleWishlist = useCallback(async (): Promise<void> => {
    if (product === undefined) return;
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

  /**
   * Restore the entry screen via `returnTo` (Home / Wishlist / catalog).
   * Catalog opens still prefer an in-stack pop so list scroll is preserved;
   * leftover sibling PDPs are skipped by jumping straight to the catalog.
   */
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

  /**
   * `withAnchor` leaves the catalog under this PDP, so a raw gesture / hardware
   * back would otherwise pop to the Shop catalog. When the entry point was Home
   * or Wishlist, intercept the back and restore the correct entry screen.
   *
   * This uses `usePreventRemove` rather than a bare `beforeRemove` +
   * `preventDefault` listener on purpose: native-stack only keeps the native and
   * JS navigation state in sync for screens registered through this hook (it sets
   * `preventNativeDismiss` on iOS and disables the JS-handled system back on
   * Android). A raw `beforeRemove` listener lets the native side dismiss the
   * screen while JS keeps it, producing the "screen was removed natively but
   * didn't get removed from JS state" warning.
   */
  const shouldInterceptBack = returnTo === "home" || returnTo === "wishlist";

  usePreventRemove(shouldInterceptBack, ({ data }) => {
    const actionType = data.action.type;
    if (actionType === "GO_BACK" || actionType === "POP") {
      leaveBrowseProduct(router, returnTo);
      return;
    }
    // Non-back removals (e.g. Shop tab → catalog reset) must still proceed.
    // Re-dispatching the original action carries React Navigation's internal
    // "already visited" marker, so this screen is not prevented a second time
    // and the removal completes normally.
    navigation.dispatch(data.action);
  });

  const onAddToCart = useCallback(async (): Promise<void> => {
    setAddErrorKey(null);
    setAddErrorRaw(null);
    if (product === undefined) return;
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
  }, [add_to_carts, createAddToCart, currentStockRow, product, requiresColor, requiresSize, selectedColorId, selectedSizeId, stockCount, updateAddToCart, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (product === undefined) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: theme.text, marginBottom: 16 }}>
          {t("product.notFound")}
        </Text>
        <TouchableOpacity
          onPress={() => openBrowseCatalog(router)}
          style={{ height: 52, paddingHorizontal: 32, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_400Regular" }}>
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
    product.description,
  );
  const addErrorMessage =
    addErrorKey !== null ? t(addErrorKey) : addErrorRaw;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* ── Hero image — 1:1 ratio, tap zones to navigate ── */}
        <View
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH,
            backgroundColor: "#F5F5F3",
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
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
          >
            {currentMedia !== null && currentMedia.media_url !== null && currentMedia.media_url.length > 0 ? (
              <Image
                source={{ uri: currentMedia.media_url }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                contentFit="cover"
                accessibilityLabel={displayName}
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="image-outline" size={48} color={theme.muted} />
              </View>
            )}
          </CeremonySection>

          {/* Tap zones: left = prev, right = next */}
          {sortedMedias.length > 1 && (
            <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
              <Pressable style={{ flex: 1 }} onPress={() => navigateImage("prev")} />
              <Pressable style={{ flex: 1 }} onPress={() => navigateImage("next")} />
            </View>
          )}

          {/* Image counter pill */}
          {sortedMedias.length > 1 && (
            <View
              style={{
                position: "absolute",
                bottom: 16,
                alignSelf: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
                borderRadius: 99,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
              pointerEvents="none"
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 1 }}>
                {selectedImageIdx + 1} / {sortedMedias.length}
              </Text>
            </View>
          )}

          {/* Floating back button — outside hero fade so it stays usable */}
          <TouchableOpacity
            onPress={handleBack}
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.7)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* ── Product info ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          {/* Name + wishlist + price — stagger after hero */}
          <CeremonySection
            key={`${product.id}-title`}
            index={1}
            play={playEntrance}
            baseDelayMs={PDP_ENTRANCE_BASE_DELAY_MS}
            durationMs={PDP_ENTRANCE_DURATION_MS}
            staggerMs={PDP_ENTRANCE_STAGGER_MS}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 22,
                  color: theme.text,
                  lineHeight: 30,
                }}
              >
                {displayName}
              </Text>
              <PdpWishlistHeart
                isSaved={isSaved}
                onPress={() => void handleToggleWishlist()}
                accessibilityLabel={
                  isSaved ? t("product.removeFromWishlistAria") : t("product.addToWishlistAria")
                }
              />
            </View>

            <Text style={{ fontSize: 17, color: theme.accent, fontWeight: "500", fontFamily: "Inter_400Regular", marginTop: 8 }}>
              {formatRm(typeof product.price === "number" ? product.price : 0)}
            </Text>
          </CeremonySection>

          {/* Stock, variants, accordions, reviews — fade after title */}
          <CeremonySection
            key={`${product.id}-secondary`}
            index={2}
            play={playEntrance}
            baseDelayMs={PDP_ENTRANCE_BASE_DELAY_MS}
            durationMs={PDP_ENTRANCE_DURATION_MS}
            staggerMs={PDP_ENTRANCE_STAGGER_MS}
          >
            {/* Stock status */}
            <View style={{ marginTop: 12 }}>
              {!hasAllSelections && (requiresColor || requiresSize) ? (
                <Text style={{ fontSize: 13, color: theme.muted, fontFamily: "Inter_400Regular" }}>
                  {selectionPrompt}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: isInStock ? "#16A34A" : "#EF4444",
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {isInStock
                    ? t("product.inStock", { count: String(stockCount) })
                    : t("product.outOfStock")}
                </Text>
              )}
            </View>

            {/* ── Color picker ── */}
            {requiresColor && (
              <View style={{ marginTop: 28 }}>
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: "500", fontFamily: "Inter_400Regular", marginBottom: 12 }}>
                  {t("product.color")}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {activeColors.map((c) => {
                    const selected = selectedColorId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setSelectedColorId(c.id)}
                        style={{
                          height: 40,
                          paddingHorizontal: 16,
                          borderRadius: 99,
                          borderWidth: 2,
                          borderColor: selected ? "#000000" : theme.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: selected ? "#000000" : theme.muted,
                            fontWeight: selected ? "500" : "400",
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
            )}

            {/* ── Size picker ── */}
            {requiresSize && (
              <TourAnchor id={ANCHORS.pdp.size}>
                <View style={{ marginTop: 28 }}>
                  <Text style={{ fontSize: 13, color: theme.text, fontWeight: "500", fontFamily: "Inter_400Regular", marginBottom: 12 }}>
                    {t("product.size")}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {activeSizes.map((s) => {
                      const selected = selectedSizeId === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => setSelectedSizeId(s.id)}
                          style={{
                            height: 48,
                            paddingHorizontal: 24,
                            borderWidth: 1,
                            borderColor: selected ? "#000000" : theme.border,
                            backgroundColor: selected ? "#000000" : "#FFFFFF",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: selected ? "#FFFFFF" : theme.text,
                              fontWeight: selected ? "500" : "400",
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
            )}

            {/* ── Accordions ── */}
            <View style={{ marginTop: 32, borderTopWidth: 1, borderTopColor: theme.border }}>
              <Accordion
                title={t("product.details")}
                open={openAccordion === "description"}
                onToggle={() => setOpenAccordion(openAccordion === "description" ? "" : "description")}
              >
                <Text style={{ fontSize: 13, color: theme.muted, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
                  {translatedDescription.length > 0
                    ? translatedDescription
                    : t("product.noDescription")}
                </Text>
              </Accordion>

              <Accordion
                title={t("product.materialCare")}
                open={openAccordion === "material"}
                onToggle={() => setOpenAccordion(openAccordion === "material" ? "" : "material")}
              >
                <Text style={{ fontSize: 13, color: theme.muted, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
                  {t("product.materialCareBody")}
                </Text>
              </Accordion>

              <Accordion
                title={t("product.shippingReturns")}
                open={openAccordion === "shipping"}
                onToggle={() => setOpenAccordion(openAccordion === "shipping" ? "" : "shipping")}
              >
                <Text style={{ fontSize: 13, color: theme.muted, lineHeight: 22, fontFamily: "Inter_400Regular" }}>
                  {t("product.shippingReturnsBody")}
                </Text>
              </Accordion>
            </View>

            {/* ── Reviews stub ── */}
            <View style={{ marginTop: 40 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: theme.text, fontFamily: "Inter_400Regular" }}>
                  {[t("product.reviewsTitle"), t("product.reviewsRating")].join(" ")}
                </Text>
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: "#000000",
                    borderRadius: 99,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "500", color: "#000000", fontFamily: "Inter_400Regular" }}>
                    {t("product.writeReview")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: theme.muted, fontFamily: "Inter_400Regular" }}>
                {t("product.reviewsEmpty")}
              </Text>
            </View>
          </CeremonySection>
        </View>
      </ScrollView>

      {/* ── Fixed bottom CTA — slides up last ── */}
      <PdpStickyCtaBar
        play={playEntrance}
        productId={product.id}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(255,255,255,0.9)",
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        {addErrorMessage !== null && (
          <Text style={{ fontSize: 13, color: theme.danger, marginBottom: 8, textAlign: "center", fontFamily: "Inter_400Regular" }}>
            {addErrorMessage}
          </Text>
        )}
        <TourAnchor id={ANCHORS.pdp.addToBag}>
          <PressableScale
            haptic="none"
            onPress={() => void onAddToCart()}
            disabled={adding || (hasAllSelections && !isInStock)}
            accessibilityRole="button"
            accessibilityLabel={t("product.addToBag")}
            centerContent
            style={{
              height: 56,
              backgroundColor: "#000000",
              borderRadius: 99,
              alignItems: "center",
              justifyContent: "center",
              opacity: adding || (hasAllSelections && !isInStock) ? 0.4 : 1,
            }}
          >
            {adding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                {t("product.addToBag")}
              </Text>
            )}
          </PressableScale>
        </TourAnchor>
      </PdpStickyCtaBar>

      {/* Short-lived add confirmation — does not navigate or block shopping */}
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
