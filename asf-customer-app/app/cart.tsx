import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthContext } from "@/context/AuthContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { usePromotionContext } from "@/context/PromotionContext";
import { useAddToCartContext } from "@/context/product/CartContext";
import { useProductContext } from "@/context/product/ProductContext";
import { getPromoErrorTranslationKey } from "@/i18n/errorMap";
import { formatRm } from "@/lib/formatCurrency";
import { colors } from "@/constants/theme";

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
  const router = useRouter();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const { user } = useAuthContext();
  const { products } = useProductContext();
  const { add_to_carts, loading, updateAddToCart, deleteAddToCart } = useAddToCartContext();
  const { validatePromoCode } = usePromotionContext();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    promotionId: string;
    discountAmountMyr: number;
  } | null>(null);

  const rows = useMemo(() => {
    if (user === null) return [];
    return add_to_carts.filter((r) => r.user_id === user.id);
  }, [add_to_carts, user]);

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

  const discount = appliedPromo?.discountAmountMyr ?? 0;
  const total = Math.max(0, subtotal + SHIPPING_ESTIMATE_MYR - discount);

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
    router.push({ pathname: "/checkout", params });
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );
  }

  if (user === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("cart.title")}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 8 }}>
            {t("cart.signInTitle")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 }}>
            {t("cart.signInBody")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in")}
            style={{ width: "100%", height: 56, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center", marginBottom: 12 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{t("cart.signInCta")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/")}
            style={{ width: "100%", height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 99, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontFamily: "Inter_400Regular" }}>{t("cart.backToHome")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Sticky header — matches web sticky top bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
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
            <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 8 }}>
              {t("cart.emptyTitle")}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24 }}>{t("cart.emptyBody")}</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/browse")}
              style={{ height: 52, paddingHorizontal: 32, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_400Regular" }}>{t("cart.goShopping")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Line items */}
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
                return (
                  <View
                    key={row.id}
                    style={{
                      flexDirection: "row",
                      gap: 16,
                      paddingBottom: 24,
                      marginBottom: isLast ? 0 : 24,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    {/* Thumbnail — 100×100, rounded-lg */}
                    <View style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: colors.panel }}>
                      {thumb.length > 0 ? (
                        <Image source={{ uri: thumb }} style={{ width: 100, height: 100 }} contentFit="cover" />
                      ) : (
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="image-outline" size={28} color={colors.muted} />
                        </View>
                      )}
                    </View>

                    {/* Details */}
                    <View style={{ flex: 1, justifyContent: "space-between" }}>
                      <View>
                        <Text
                          style={{ fontSize: 14, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}
                          numberOfLines={1}
                        >
                          {lineName}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, fontFamily: "Inter_400Regular" }}>
                          {/* Variant placeholder */}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>
                          {formatRm(price)}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                          {/* Trash */}
                          <TouchableOpacity onPress={() => void deleteAddToCart(row.id)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={18} color={colors.muted} />
                          </TouchableOpacity>
                          {/* Qty stepper — pill style matching web */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 12,
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderRadius: 99,
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                            }}
                          >
                            <TouchableOpacity
                              onPress={() => void updateAddToCart({ id: row.id, amount: Math.max(1, row.amount - 1) })}
                              disabled={row.amount <= 1}
                              hitSlop={4}
                            >
                              <Ionicons name="remove" size={14} color={row.amount <= 1 ? colors.border : colors.text} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, minWidth: 20, textAlign: "center", fontFamily: "Inter_400Regular" }}>
                              {row.amount}
                            </Text>
                            <TouchableOpacity
                              onPress={() => void updateAddToCart({ id: row.id, amount: row.amount + 1 })}
                              hitSlop={4}
                            >
                              <Ionicons name="add" size={14} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Promo code */}
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8, fontFamily: "Inter_400Regular" }}>{t("cart.promoLabel")}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    height: 44,
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    fontSize: 14,
                    color: colors.text,
                    fontFamily: "Inter_400Regular",
                  }}
                  value={promoInput}
                  onChangeText={(v) => { setPromoInput(v); setPromoError(null); }}
                  autoCapitalize="characters"
                  placeholder={t("cart.promoPlaceholder")}
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity
                  onPress={() => void applyPromo()}
                  disabled={promoLoading || promoInput.trim().length === 0}
                  style={{
                    height: 44,
                    paddingHorizontal: 16,
                    backgroundColor: "#000000",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: promoLoading || promoInput.trim().length === 0 ? 0.4 : 1,
                  }}
                >
                  {promoLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500", fontFamily: "Inter_400Regular" }}>{t("cart.apply")}</Text>
                  )}
                </TouchableOpacity>
              </View>
              {promoError !== null && (
                <Text style={{ fontSize: 12, color: colors.danger, marginTop: 6, fontFamily: "Inter_400Regular" }}>{promoError}</Text>
              )}
              {appliedPromo !== null && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                  <Text style={{ fontSize: 13, color: "#15803D", fontFamily: "Inter_400Regular" }}>
                    {t("cart.appliedPrefix", { code: appliedPromo.code })}
                  </Text>
                  <TouchableOpacity onPress={() => setAppliedPromo(null)}>
                    <Text style={{ fontSize: 12, color: colors.muted, textDecorationLine: "underline", fontFamily: "Inter_400Regular" }}>{t("cart.remove")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Order summary */}
            <View style={{ marginTop: 32, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 24 }}>
              <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 18, color: colors.text, marginBottom: 16 }}>
                {t("cart.orderSummary")}
              </Text>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("cart.subtotal")}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>{formatRm(subtotal)}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("cart.shippingEstimate")}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, fontFamily: "Inter_400Regular" }}>{formatRm(SHIPPING_ESTIMATE_MYR)}</Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular", marginTop: -4 }}>
                  {t("cart.shippingEstimateNote")}
                </Text>
                {discount > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("cart.discount")}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: "#15803D", fontFamily: "Inter_400Regular" }}>-{formatRm(discount)}</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, fontFamily: "Inter_400Regular" }}>{t("cart.total")}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, fontFamily: "Inter_400Regular" }}>{formatRm(total)}</Text>
                </View>
              </View>
            </View>

            {/* Checkout CTA */}
            <View style={{ marginTop: 32, gap: 12 }}>
              <TouchableOpacity
                onPress={onCheckout}
                style={{
                  height: 56,
                  backgroundColor: "#000000",
                  borderRadius: 99,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                  {t("cart.goToCheckout")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/browse")} style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>{t("cart.continueShoppingLink")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  header: {
    height: 56,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "#FFFFFF",
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
    color: colors.text,
  },
};
