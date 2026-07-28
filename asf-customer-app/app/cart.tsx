import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CeremonySection, PressableScale } from "@/components/motion";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { useAuthContext } from "@/context/AuthContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePromotionContext } from "@/context/PromotionContext";
import { useWarrantyCreditContext } from "@/context/WarrantyCreditContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { getPromoErrorTranslationKey } from "@/i18n/errorMap";
import { formatDate } from "@/i18n/format";
import { formatRm } from "@/lib/formatCurrency";
import { hapticLight } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";
import type { ThemeTokens } from "@/themes/types";

/** Max line items that stagger on cart open; the rest render settled. */
const CART_LINE_STAGGER_CAP = 6;

/** Slight scale settle for order summary + checkout emphasis. */
const CART_SUMMARY_SCALE_FROM = 1.03;
/**
 * One-shot gold opacity pulse on an already-applied savings line.
 * Skips animation when reduced motion is on.
 */
function PromoSavingsPulse({
  play,
  children,
}: Readonly<{
  play: boolean;
  children: React.ReactNode;
}>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = !play || reducedMotion === true;
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (skipAnimation) {
      opacity.value = 1;
      return;
    }
    opacity.value = withDelay(
      motion.duration.dailyEntrance,
      withSequence(
        withTiming(0.45, {
          duration: motion.duration.fast,
          easing: motionEasing,
        }),
        withTiming(1, {
          duration: motion.duration.base,
          easing: motionEasing,
        })
      )
    );
  }, [skipAnimation, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (skipAnimation) {
    return <View>{children}</View>;
  }

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

/**
 * Reads a single string search param (expo-router may return string | string[]).
 */
function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string" && first.trim().length > 0) {
      return first.trim();
    }
  }
  return null;
}

/**
 * Estimated shipping shown in the cart summary only. The actual rate is
 * quoted live (distance + weight) once the customer enters their address at
 * checkout, so this is a placeholder estimate — not the charged amount.
 */
const SHIPPING_ESTIMATE_MYR = 10;

/**
 * Cart screen — push route accessible from the top navbar bag icon.
 * Matches web /cart design: sticky header, item rows, promo input, order summary, checkout CTA.
 */
export default function CartScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const styles = createCartHeaderStyles(tokens);
  const router = useRouter();
  const params = useLocalSearchParams<{ promoCode?: string | string[] }>();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const { user } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { products } = useProductContext();
  const { add_to_carts, loading, updateAddToCart, deleteAddToCart } = useAddToCartContext();
  const { validatePromoCode } = usePromotionContext();

  const prefillPromoCode = firstSearchParam(params.promoCode);
  const [promoInput, setPromoInput] = useState(prefillPromoCode ?? "");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    promotionId: string;
    discountAmountMyr: number;
  } | null>(null);
  const [appliedWarrantyCredit, setAppliedWarrantyCredit] = useState<{
    creditId: string;
    discountAmountMyr: number;
    label: string;
  } | null>(null);
  /** Guards one-shot auto-validate from deep-link / offer tap. */
  const autoValidateAttemptedRef = useRef(false);

  const rows = useMemo(() => {
    if (user === null) return [];
    return add_to_carts.filter((r) => r.user_id === user.id);
  }, [add_to_carts, user]);

  /**
   * Prefill promo input from navigation params (e.g. home offer tap).
   * Auto-validates once when the cart already has lines.
   */
  useEffect(() => {
    if (prefillPromoCode === null) {
      return;
    }
    setPromoInput(prefillPromoCode);
    if (autoValidateAttemptedRef.current) {
      return;
    }
    if (loading || user === null || rows.length === 0) {
      return;
    }
    autoValidateAttemptedRef.current = true;
    const cartLines = rows.map((r) => ({ product_id: r.product_id, amount: r.amount }));
    setPromoLoading(true);
    setPromoError(null);
    void (async () => {
      try {
        const result = await validatePromoCode(prefillPromoCode, cartLines);
        if (result.valid === false) {
          setAppliedPromo(null);
          setPromoError(t(getPromoErrorTranslationKey(result.reason)));
          return;
        }
        setAppliedPromo({
          code: prefillPromoCode,
          promotionId: result.promotionId,
          discountAmountMyr: result.discountAmountMyr,
        });
      } finally {
        setPromoLoading(false);
      }
    })();
  }, [prefillPromoCode, loading, user, rows, validatePromoCode, t]);

  const linesWithProduct = useMemo(() => {
    return rows
      .map((row) => {
        const product = products.find((p) => p.id === row.product_id);
        return { row, product };
      })
      .filter((x) => x.product !== undefined) as {
      row: (typeof rows)[number];
      product: NonNullable<(typeof products)[number]>;
    }[];
  }, [rows, products]);

  const subtotal = useMemo(() => {
    let sum = 0;
    for (const { row, product } of linesWithProduct) {
      const price = typeof product.price === "number" ? product.price : 0;
      sum += price * row.amount;
    }
    return sum;
  }, [linesWithProduct]);

  const promoDiscount = appliedPromo?.discountAmountMyr ?? 0;
  const warrantyDiscount = appliedWarrantyCredit?.discountAmountMyr ?? 0;
  const discount = promoDiscount + warrantyDiscount;
  const total = Math.max(0, subtotal + SHIPPING_ESTIMATE_MYR - discount);

  const reducedMotion = useReducedMotion();
  /** Cart counter ceremony plays once per mount when there are lines. */
  const playCartCeremony =
    reducedMotion !== true && linesWithProduct.length > 0;
  const summaryStaggerIndex = Math.min(
    linesWithProduct.length,
    CART_LINE_STAGGER_CAP
  );

  /**
   * Light open pulse when cart content is shown — not a success haptic.
   * Fires once per mount with lines (skipped for empty / sign-in states).
   */
  useEffect(() => {
    if (!playCartCeremony) {
      return;
    }
    void hapticLight();
  }, [playCartCeremony]);

  const applyPromo = async (): Promise<void> => {
    setPromoError(null);
    const code = promoInput.trim();
    if (code.length === 0) {
      setPromoError(t("cart.promoErrors.required"));
      return;
    }
    const cartLines = rows.map((r) => ({ product_id: r.product_id, amount: r.amount }));
    if (cartLines.length === 0) {
      setPromoError(t("cart.promoErrors.cartEmpty"));
      return;
    }
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(code, cartLines);
      if (result.valid === false) {
        setAppliedPromo(null);
        setPromoError(t(getPromoErrorTranslationKey(result.reason)));
        return;
      }
      setAppliedPromo({
        code,
        promotionId: result.promotionId,
        discountAmountMyr: result.discountAmountMyr,
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const onCheckout = (): void => {
    if (user === null) return;
    if (rows.length === 0) return;
    const params: Record<string, string> = { userId: user.id };
    if (appliedPromo !== null) {
      params.promoCode = appliedPromo.code;
      params.promotionId = appliedPromo.promotionId;
    }
    if (appliedWarrantyCredit !== null) {
      params.warrantyCreditId = appliedWarrantyCredit.creditId;
    }
    router.push({ pathname: "/checkout", params });
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={tokens.text} />
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBack}>
            <PressableScale
              onPress={() => router.back()}
              haptic="light"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("cart.title")}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={22} color={tokens.text} />
            </PressableScale>
          </View>
          <Text style={styles.headerTitle}>{t("cart.title")}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: tokens.text, marginBottom: 8 }}>
            {t("cart.signInTitle")}
          </Text>
          <Text style={{ fontSize: 14, color: tokens.muted, textAlign: "center", marginBottom: 24 }}>
            {t("cart.signInBody")}
          </Text>
          <PressableScale
            haptic="medium"
            onPress={() => router.push("/(auth)/sign-in")}
            accessibilityRole="button"
            centerContent
            style={{ width: "100%", height: 56, backgroundColor: tokens.text, borderRadius: 99, alignItems: "center", justifyContent: "center", marginBottom: 12 }}
          >
            <Text style={{ color: tokens.bg, fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{t("cart.signInCta")}</Text>
          </PressableScale>
          <PressableScale
            haptic="light"
            onPress={() => router.push("/(tabs)/")}
            accessibilityRole="button"
            centerContent
            style={{ width: "100%", height: 52, borderWidth: 1, borderColor: tokens.border, borderRadius: 99, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: tokens.text, fontSize: 14, fontFamily: "Inter_400Regular" }}>{t("cart.backToHome")}</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Sticky header — matches web sticky top bar */}
      <View style={styles.header}>
        <View style={styles.headerBack}>
          <PressableScale
            onPress={() => router.back()}
            haptic="light"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("cart.title")}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color={tokens.text} />
          </PressableScale>
        </View>
        <Text style={styles.headerTitle}>{t("cart.title")}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {linesWithProduct.length === 0 ? (
          /* Empty cart */
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
            <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: tokens.text, marginBottom: 8 }}>
              {t("cart.emptyTitle")}
            </Text>
            <Text style={{ fontSize: 14, color: tokens.muted, marginBottom: 24 }}>{t("cart.emptyBody")}</Text>
            <PressableScale
              haptic="medium"
              onPress={() => router.push("/(tabs)/browse")}
              accessibilityRole="button"
              style={{ height: 52, paddingHorizontal: 32, backgroundColor: tokens.text, borderRadius: 99, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: tokens.bg, fontSize: 15, fontFamily: "Inter_400Regular" }}>{t("cart.goShopping")}</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            {/* Line items — stagger first N; remainder settle immediately */}
            <View>
              {linesWithProduct.map(({ row, product }, index) => {
                const thumb = product.medias[0]?.media_url ?? "";
                const price = typeof product.price === "number" ? product.price : 0;
                const isLast = index === linesWithProduct.length - 1;
                const translatedName = translateProduct(
                  product.id,
                  "name",
                  product.name ?? null,
                );
                const lineName =
                  translatedName.length > 0
                    ? translatedName
                    : t("cart.productFallback");
                const animateLine = playCartCeremony && index < CART_LINE_STAGGER_CAP;
                return (
                  <CeremonySection
                    key={row.id}
                    index={index}
                    play={animateLine}
                    baseDelayMs={0}
                    durationMs={motion.duration.dailyEntrance}
                    staggerMs={motion.delay.dailyStagger}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 16,
                        paddingBottom: 24,
                        marginBottom: isLast ? 0 : 24,
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: tokens.border,
                      }}
                    >
                      {/* Thumbnail — 100×100, rounded-lg */}
                      <View style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: tokens.panel }}>
                        {thumb.length > 0 ? (
                          <Image source={{ uri: thumb }} style={{ width: 100, height: 100 }} contentFit="cover" />
                        ) : (
                          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="image-outline" size={28} color={tokens.muted} />
                          </View>
                        )}
                      </View>

                      {/* Details */}
                      <View style={{ flex: 1, justifyContent: "space-between" }}>
                        <View>
                          <Text
                            style={{ fontSize: 14, fontWeight: "500", color: tokens.text, fontFamily: "Inter_400Regular" }}
                            numberOfLines={1}
                          >
                            {lineName}
                          </Text>
                          <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 4, fontFamily: "Inter_400Regular" }}>
                            {/* Variant placeholder */}
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
                          <Text style={{ fontSize: 15, fontWeight: "500", color: tokens.text, fontFamily: "Inter_400Regular" }}>
                            {formatRm(price)}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                            {/* Trash */}
                            <PressableScale
                              haptic="light"
                              onPress={() => void deleteAddToCart(row.id)}
                              hitSlop={8}
                              accessibilityRole="button"
                            >
                              <Ionicons name="trash-outline" size={18} color={tokens.muted} />
                            </PressableScale>
                            {/* Qty stepper — pill style matching web */}
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                                borderWidth: 1,
                                borderColor: tokens.border,
                                borderRadius: 99,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                              }}
                            >
                              <PressableScale
                                haptic="light"
                                onPress={() => void updateAddToCart({ id: row.id, amount: Math.max(1, row.amount - 1) })}
                                disabled={row.amount <= 1}
                                hitSlop={4}
                                accessibilityRole="button"
                              >
                                <Ionicons name="remove" size={14} color={row.amount <= 1 ? tokens.border : tokens.text} />
                              </PressableScale>
                              <Text style={{ fontSize: 14, fontWeight: "500", color: tokens.text, minWidth: 20, textAlign: "center", fontFamily: "Inter_400Regular" }}>
                                {row.amount}
                              </Text>
                              <PressableScale
                                haptic="light"
                                onPress={() => void updateAddToCart({ id: row.id, amount: row.amount + 1 })}
                                hitSlop={4}
                                accessibilityRole="button"
                              >
                                <Ionicons name="add" size={14} color={tokens.text} />
                              </PressableScale>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </CeremonySection>
                );
              })}
            </View>

            {/* Promo code */}
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 12, color: tokens.muted, marginBottom: 8, fontFamily: "Inter_400Regular" }}>{t("cart.promoLabel")}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    height: 44,
                    backgroundColor: tokens.bg,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    fontSize: 14,
                    color: tokens.text,
                    fontFamily: "Inter_400Regular",
                  }}
                  value={promoInput}
                  onChangeText={(v) => { setPromoInput(v); setPromoError(null); }}
                  autoCapitalize="characters"
                  placeholder={t("cart.promoPlaceholder")}
                  placeholderTextColor={tokens.muted}
                />
                <TouchableOpacity
                  onPress={() => void applyPromo()}
                  disabled={promoLoading || promoInput.trim().length === 0}
                  style={{
                    height: 44,
                    paddingHorizontal: 16,
                    backgroundColor: tokens.text,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: promoLoading || promoInput.trim().length === 0 ? 0.4 : 1,
                  }}
                >
                  {promoLoading ? (
                    <ActivityIndicator color={tokens.bg} size="small" />
                  ) : (
                    <Text style={{ color: tokens.bg, fontSize: 14, fontWeight: "500", fontFamily: "Inter_400Regular" }}>{t("cart.apply")}</Text>
                  )}
                </TouchableOpacity>
              </View>
              {promoError !== null && (
                <Text style={{ fontSize: 12, color: tokens.danger, marginTop: 6, fontFamily: "Inter_400Regular" }}>{promoError}</Text>
              )}
              {appliedPromo !== null && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                  <Text style={{ fontSize: 13, color: "#15803D", fontFamily: "Inter_400Regular" }}>
                    {t("cart.appliedPrefix", { code: appliedPromo.code })}
                  </Text>
                  <TouchableOpacity onPress={() => setAppliedPromo(null)}>
                    <Text style={{ fontSize: 12, color: tokens.muted, textDecorationLine: "underline", fontFamily: "Inter_400Regular" }}>{t("cart.remove")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {isEnabled("claims") ? (
              <WarrantyCreditCartSection
                subtotal={subtotal}
                applied={appliedWarrantyCredit}
                onApplied={setAppliedWarrantyCredit}
              />
            ) : null}

            {/* Order summary + checkout — land last with slight emphasis */}
            <TourAnchor id={ANCHORS.cart.review}>
              <CeremonySection
                index={summaryStaggerIndex}
                play={playCartCeremony}
                baseDelayMs={0}
                durationMs={motion.duration.dailyEntrance}
                staggerMs={motion.delay.dailyStagger}
                scaleFrom={CART_SUMMARY_SCALE_FROM}
              >
                <View style={{ marginTop: 32, borderTopWidth: 1, borderTopColor: tokens.border, paddingTop: 24 }}>
                  <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: tokens.text, marginBottom: 16 }}>
                    {t("cart.orderSummary")}
                  </Text>
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>{t("cart.subtotal")}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: tokens.text, fontFamily: "Inter_400Regular" }}>{formatRm(subtotal)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>{t("cart.shippingEstimate")}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: tokens.text, fontFamily: "Inter_400Regular" }}>{formatRm(SHIPPING_ESTIMATE_MYR)}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: tokens.muted, fontFamily: "Inter_400Regular", marginTop: -4 }}>
                      {t("cart.shippingEstimateNote")}
                    </Text>
                    {promoDiscount > 0 && (
                      <PromoSavingsPulse play={playCartCeremony && appliedPromo !== null}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 14, color: tokens.accent, fontFamily: "Inter_400Regular" }}>{t("cart.discount")}</Text>
                          <Text style={{ fontSize: 14, fontWeight: "500", color: tokens.accent, fontFamily: "Inter_400Regular" }}>-{formatRm(promoDiscount)}</Text>
                        </View>
                      </PromoSavingsPulse>
                    )}
                    {warrantyDiscount > 0 && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>{t("cart.warrantyCreditsLabel")}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "500", color: "#15803D", fontFamily: "Inter_400Regular" }}>-{formatRm(warrantyDiscount)}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.border }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: tokens.text, fontFamily: "Inter_400Regular" }}>{t("cart.total")}</Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: tokens.text, fontFamily: "Inter_400Regular" }}>{formatRm(total)}</Text>
                    </View>
                  </View>
                </View>

                {/* Checkout CTA */}
                <View style={{ marginTop: 32, gap: 12 }}>
                  <PressableScale
                    haptic="medium"
                    onPress={onCheckout}
                    accessibilityRole="button"
                    accessibilityLabel={t("cart.goToCheckout")}
                    centerContent
                    style={{
                      height: 56,
                      backgroundColor: tokens.text,
                      borderRadius: 99,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: tokens.bg, fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                      {t("cart.goToCheckout")}
                    </Text>
                  </PressableScale>
                  <PressableScale
                    haptic="light"
                    onPress={() => router.push("/(tabs)/browse")}
                    accessibilityRole="button"
                    centerContent
                    style={{ alignItems: "center", paddingVertical: 8 }}
                  >
                    <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>{t("cart.continueShoppingLink")}</Text>
                  </PressableScale>
                </View>
              </CeremonySection>
            </TourAnchor>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface WarrantyCreditCartSectionProps {
  subtotal: number;
  applied: {
    creditId: string;
    discountAmountMyr: number;
    label: string;
  } | null;
  onApplied: (value: {
    creditId: string;
    discountAmountMyr: number;
    label: string;
  } | null) => void;
}

/**
 * Warranty credit apply UI — only mounted when `claims` feature flag is on
 * (and WarrantyCreditProvider is in the tree).
 */
function WarrantyCreditCartSection({
  subtotal,
  applied,
  onApplied,
}: Readonly<WarrantyCreditCartSectionProps>): React.ReactElement | null {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { credits, applyCreditToCart } = useWarrantyCreditContext();
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const now = Date.now();
  const activeCredits = credits.filter((c) => {
    if (c.status !== "active") {
      return false;
    }
    const expires = new Date(c.expiresAt).getTime();
    return Number.isFinite(expires) && expires >= now;
  });

  if (activeCredits.length === 0) {
    return null;
  }

  const mapError = (reason: string): string => {
    if (reason.includes("expired")) {
      return t("cart.warrantyCreditErrors.expired");
    }
    if (reason.includes("active")) {
      return t("cart.warrantyCreditErrors.inactive");
    }
    if (reason.includes("empty")) {
      return t("cart.warrantyCreditErrors.cartEmpty");
    }
    if (reason.includes("not found")) {
      return t("cart.warrantyCreditErrors.notFound");
    }
    return t("cart.warrantyCreditErrors.cannotApply");
  };

  const handleApply = async (creditId: string): Promise<void> => {
    setError(null);
    setApplying(true);
    try {
      const result = await applyCreditToCart(creditId, subtotal);
      if (result.valid === false) {
        onApplied(null);
        setError(mapError(result.reason));
        return;
      }
      const credit = credits.find((c) => c.id === creditId);
      onApplied({
        creditId,
        discountAmountMyr: result.discountAmountMyr,
        label: credit?.productName ?? t("cart.warrantyCreditsLabel"),
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ fontSize: 12, color: tokens.muted, marginBottom: 8, fontFamily: "Inter_400Regular" }}>
        {t("cart.warrantyCreditsLabel")}
      </Text>
      {activeCredits.map((credit) => (
        <View
          key={credit.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: tokens.border,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            backgroundColor: tokens.bg,
          }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: tokens.text, fontFamily: "Inter_400Regular" }}>
              {formatRm(credit.amountMyr)}
            </Text>
            <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 2, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
              {credit.productName}
            </Text>
            <Text style={{ fontSize: 11, color: tokens.muted, marginTop: 2, fontFamily: "Inter_400Regular" }}>
              {t("cart.warrantyCreditExpires", { date: formatDate(locale, credit.expiresAt) })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => void handleApply(credit.id)}
            disabled={applying}
            style={{
              borderWidth: 1,
              borderColor: tokens.text,
              borderRadius: 99,
              paddingHorizontal: 14,
              paddingVertical: 6,
              opacity: applying ? 0.5 : 1,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: tokens.text, fontFamily: "Inter_400Regular" }}>
              {t("cart.warrantyCreditApply")}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      {error !== null ? (
        <Text style={{ fontSize: 12, color: tokens.danger, fontFamily: "Inter_400Regular" }}>{error}</Text>
      ) : null}
      {applied !== null ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontSize: 13, color: "#15803D", fontFamily: "Inter_400Regular" }}>
            {t("cart.warrantyCreditApplied", { amount: formatRm(applied.discountAmountMyr) })}
          </Text>
          <TouchableOpacity onPress={() => onApplied(null)}>
            <Text style={{ fontSize: 12, color: tokens.muted, textDecorationLine: "underline", fontFamily: "Inter_400Regular" }}>
              {t("cart.remove")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Builds cart sticky-header styles from the active theme tokens.
 */
function createCartHeaderStyles(tokens: ThemeTokens) {
  return {
    header: {
      height: 56,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderBottomWidth: 1,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.bg,
      position: "relative" as const,
    },
    headerBack: {
      position: "absolute" as const,
      left: 16,
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    headerTitle: {
      fontFamily: "PlayfairDisplay_400Regular",
      fontSize: 18,
      color: tokens.text,
    },
  };
}
