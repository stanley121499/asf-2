import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { OrderProgressTracker } from "@/components/OrderProgressTracker";
import { useAuthContext } from "@/context/AuthContext";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { useOrderContext } from "@/context/product/OrderContext";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";
import type { Database } from "@/database.types";
import { formatDate } from "@/i18n/format";
import { isOrderDelivered } from "@/lib/claims/claimEligibility";
import type { ShippingAddressStructured } from "@/lib/checkoutApi";
import { formatRm } from "@/lib/formatCurrency";
import { supabase } from "@/lib/supabase";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type ProductMediaMini = Pick<Database["public"]["Tables"]["product_medias"]["Row"], "media_url" | "arrangement">;
type ProductMini = Pick<Database["public"]["Tables"]["products"]["Row"], "name" | "price"> & {
  product_medias: ProductMediaMini[] | null;
};
type ItemWithProduct = OrderItemRow & { products: ProductMini | null };

const SHIPPING_STRUCTURED_FIELDS = [
  "address1",
  "address2",
  "city",
  "state",
  "postcode",
  "country",
  "recipientName",
  "recipientPhone",
] as const;

/**
 * Narrows persisted JSON to a structured shipping address.
 */
function isShippingAddressStructured(value: unknown): value is ShippingAddressStructured {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return SHIPPING_STRUCTURED_FIELDS.every((field) => typeof record[field] === "string");
}

/**
 * Builds a multi-line shipping display using the current locale for the phone label.
 */
function formatShippingAddressDisplay(
  structured: ShippingAddressStructured,
  phoneLine: string,
): string {
  return [
    structured.recipientName,
    structured.address1,
    structured.address2,
    `${structured.city}, ${structured.state} ${structured.postcode}`,
    structured.country,
    phoneLine,
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * Returns the primary product image URL (lowest `arrangement` first).
 */
function getProductImageUrl(product: ProductMini | null): string {
  if (product === null || product.product_medias === null) {
    return "";
  }
  const sorted = [...product.product_medias].sort(
    (a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0)
  );
  for (const media of sorted) {
    if (typeof media.media_url === "string" && media.media_url.trim().length > 0) {
      return media.media_url.trim();
    }
  }
  return "";
}

/**
 * Editorial "eyebrow" label sitting above a section: a short gold rule followed
 * by a small letter-spaced title. Establishes the page's visual rhythm.
 */
function SectionLabel({ title }: Readonly<{ title: string }>): React.ReactElement {
  const tokens = useThemeTokens();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginLeft: 4 }}>
      <View style={{ width: 16, height: 2, backgroundColor: tokens.accent }} />
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 2,
          color: tokens.muted,
          fontFamily: "Inter_400Regular",
        }}
      >
        {title}
      </Text>
    </View>
  );
}

/**
 * Section body surface. Classic: floating rounded card. Atelier: flat paper
 * panel with hairline. Noir: flat night panel with hairline (no shadow).
 */
function Surface({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isAtelier = themeId === "atelier";
  const isNoir = themeId === "noir";
  return (
    <View
      style={
        isAtelier
          ? {
              backgroundColor: tokens.panel,
              borderRadius: 2,
              padding: 18,
              borderWidth: 1,
              borderColor: tokens.border,
            }
          : isNoir
            ? {
                backgroundColor: tokens.panel,
                borderRadius: 2,
                padding: 16,
                borderWidth: 1,
                borderColor: tokens.border,
              }
            : {
                backgroundColor: tokens.bg,
                borderRadius: 18,
                padding: 18,
                shadowColor: "#000000",
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 1,
              }
      }
    >
      {children}
    </View>
  );
}

/**
 * Order detail — sticky header, fulfilment tracker, line items, totals.
 */
export default function OrderDetailScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isAtelier = themeId === "atelier";
  const isNoir = themeId === "noir";
  /** Paper/bg under Atelier+Noir; warm panel under Classic. */
  const pageBg = isAtelier || isNoir ? tokens.bg : tokens.panel;
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const { locale } = useLocale();
  const { user } = useAuthContext();
  const { isEnabled } = useFeatureFlags();
  const { orders, loading: ordersLoading } = useOrderContext();

  const [items, setItems] = useState<ItemWithProduct[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Orders just created during checkout are not yet in the (startup-cached)
  // OrderContext list, so fetch the row directly by id as a fallback.
  const [directOrder, setDirectOrder] = useState<OrderRow | null>(null);
  const [directOrderLoading, setDirectOrderLoading] = useState(true);

  const contextOrder = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  const order = contextOrder ?? directOrder ?? undefined;

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      if (typeof orderId !== "string" || orderId.length === 0 || user === null) {
        setDirectOrderLoading(false);
        return;
      }
      setDirectOrderLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error === null && data !== null) {
        setDirectOrder(data);
      }
      setDirectOrderLoading(false);
    };
    void run();
    return () => { cancelled = true; };
  }, [orderId, user]);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      if (typeof orderId !== "string" || orderId.length === 0) { setItemsLoading(false); return; }
      setItemsLoading(true);
      setItemsError(null);
      const { data, error } = await supabase
        .from("order_items")
        .select("*, products(name, price, product_medias(media_url, arrangement))")
        .eq("order_id", orderId);
      if (cancelled) return;
      if (error !== null) { setItemsError(error.message); setItems([]); }
      else { setItems((data ?? []) as ItemWithProduct[]); }
      setItemsLoading(false);
    };
    void run();
    return () => { cancelled = true; };
  }, [orderId]);

  if (user === null || (order === undefined && (ordersLoading || directOrderLoading))) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        <SubPageHeader title={t("orders.detailTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  if (order === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: pageBg }}>
        <SubPageHeader title={t("orders.detailTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("orders.notFound")}
          </Text>
        </View>
      </View>
    );
  }

  const tracking = typeof order.tracking_number === "string" && order.tracking_number.trim().length > 0 ? order.tracking_number.trim() : null;
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const createdDate =
    typeof order.created_at === "string" && order.created_at.length > 0
      ? formatDate(locale, order.created_at)
      : "";
  const status = typeof order.status === "string" ? order.status : null;
  const isPending = (status ?? "").toLowerCase().includes("pending");
  const canReportIssue = isEnabled("claims") && isOrderDelivered(status);
  const totalAmount = typeof order.total_amount === "number" ? order.total_amount : null;
  const discount =
    typeof order.discounted_amount === "number" && order.discounted_amount > 0
      ? order.discounted_amount
      : null;
  const pointsEarned =
    typeof order.points_earned === "number" && order.points_earned > 0 ? order.points_earned : null;

  const structuredRaw = order.shipping_address_structured;
  const shippingDisplay =
    structuredRaw !== null && isShippingAddressStructured(structuredRaw)
      ? formatShippingAddressDisplay(
          structuredRaw,
          structuredRaw.recipientPhone.length > 0
            ? t("checkout.phonePrefix", { phone: structuredRaw.recipientPhone })
            : "",
        )
      : typeof order.shipping_address === "string" && order.shipping_address.length > 0
        ? order.shipping_address
        : "—";

  const toggleItemSelection = (itemId: string): void => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const onReportIssue = (): void => {
    if (selectedItemIds.length === 0 || typeof orderId !== "string") {
      return;
    }
    router.push({
      pathname: "/(tabs)/profile/claims/new",
      params: {
        orderId,
        orderItemIds: selectedItemIds.join(","),
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <SubPageHeader title={t("orders.detailTitle")} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: isAtelier ? 24 : 16,
          paddingTop: isAtelier ? 24 : 16,
          paddingBottom: 56,
        }}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero: order ref + date + fulfilment tracker, all in one statement */}
        <View
          style={
            isAtelier
              ? {
                  backgroundColor: tokens.panel,
                  borderRadius: 2,
                  padding: 22,
                  marginBottom: 28,
                  borderWidth: 1,
                  borderColor: tokens.border,
                }
              : isNoir
                ? {
                    backgroundColor: tokens.panel,
                    borderRadius: 2,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: tokens.border,
                  }
                : {
                    backgroundColor: tokens.bg,
                    borderRadius: 24,
                    padding: 22,
                    marginBottom: 28,
                    shadowColor: "#000000",
                    shadowOpacity: 0.05,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 2,
                  }
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 11, letterSpacing: 2, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
                {t("orders.orderLabel")}
              </Text>
              <Text style={{ fontSize: 13, letterSpacing: 1, color: tokens.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                #{shortId}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: tokens.muted, fontFamily: "Inter_400Regular" }}>{createdDate}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: tokens.border, marginBottom: 20 }} />

          <OrderProgressTracker status={status} embedded />
        </View>

        {/* Tracking number */}
        {tracking !== null && (
          <View style={{ marginBottom: 20 }}>
            <SectionLabel title={t("orders.tracking")} />
            <Surface>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
                  {t("orders.trackingNumber")}
                </Text>
                <Text style={{ fontSize: 14, color: tokens.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{tracking}</Text>
              </View>
            </Surface>
          </View>
        )}

        {/* Shipping address */}
        <View style={{ marginBottom: 20 }}>
          <SectionLabel title={t("orders.shippingAddressTitle")} />
          <Surface>
            <Text style={{ fontSize: 14, color: tokens.text, lineHeight: 23, fontFamily: "Inter_400Regular" }}>
              {shippingDisplay}
            </Text>
          </Surface>
        </View>

        {/* Line items */}
        <View style={{ marginBottom: 20 }}>
          <SectionLabel title={t("orders.items")} />
          {canReportIssue ? (
            <Text style={{ fontSize: 12, color: tokens.muted, marginBottom: 8, marginLeft: 4, fontFamily: "Inter_400Regular" }}>
              {t("orders.selectItemsToClaim")}
            </Text>
          ) : null}
          <Surface>
            {itemsLoading ? (
              <ActivityIndicator color={tokens.accent} />
            ) : itemsError !== null ? (
              <Text style={{ fontSize: 13, color: tokens.danger, fontFamily: "Inter_400Regular" }}>{itemsError}</Text>
            ) : items.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <Ionicons name="cube-outline" size={26} color={tokens.border} style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 13, color: tokens.muted, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                  {isPending ? t("orders.itemsPending") : t("orders.itemsEmpty")}
                </Text>
              </View>
            ) : (
              items.map((line, idx) => {
                const productId =
                  typeof line.product_id === "string" && line.product_id.length > 0
                    ? line.product_id
                    : null;
                const translatedName =
                  productId !== null
                    ? translateProduct(productId, "name", line.products?.name ?? null)
                    : "";
                const name =
                  translatedName.length > 0
                    ? translatedName
                    : line.products?.name ?? t("orders.productFallback");
                const unit = typeof line.products?.price === "number" ? line.products.price : 0;
                const qty = typeof line.amount === "number" ? line.amount : 0;
                const imageUrl = getProductImageUrl(line.products);
                const isSelected = selectedItemIds.includes(line.id);
                return (
                  <TouchableOpacity
                    key={line.id}
                    onPress={() => {
                      if (canReportIssue) {
                        toggleItemSelection(line.id);
                      }
                    }}
                    activeOpacity={canReportIssue ? 0.7 : 1}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      borderBottomWidth: idx < items.length - 1 ? 1 : 0,
                      borderBottomColor: tokens.border,
                      backgroundColor: isSelected ? "rgba(201,169,110,0.08)" : "transparent",
                      borderRadius: isSelected ? 8 : 0,
                    }}
                  >
                    {canReportIssue ? (
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={22}
                        color={isSelected ? tokens.accent : tokens.muted}
                      />
                    ) : null}
                    <View style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", backgroundColor: tokens.panel }}>
                      {imageUrl.length > 0 ? (
                        <Image source={{ uri: imageUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
                      ) : (
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="image-outline" size={22} color={tokens.muted} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: tokens.text, fontFamily: "Inter_400Regular" }} numberOfLines={1}>{name}</Text>
                      <Text style={{ fontSize: 12, color: tokens.muted, marginTop: 3, fontFamily: "Inter_400Regular" }}>
                        {formatRm(unit)} × {qty}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: tokens.text, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
                      {formatRm(unit * qty)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </Surface>
          {canReportIssue && selectedItemIds.length > 0 ? (
            <TouchableOpacity
              onPress={onReportIssue}
              style={
                isAtelier
                  ? {
                      marginTop: 12,
                      height: 48,
                      borderWidth: 1,
                      borderColor: tokens.text,
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }
                  : isNoir
                    ? {
                        marginTop: 12,
                        height: 44,
                        backgroundColor: tokens.accent,
                        borderRadius: 2,
                        alignItems: "center",
                        justifyContent: "center",
                      }
                    : {
                        marginTop: 12,
                        height: 48,
                        backgroundColor: tokens.text,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }
              }
            >
              <Text
                style={
                  isAtelier
                    ? {
                        color: tokens.text,
                        fontSize: 13,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        fontFamily: "Inter_400Regular",
                      }
                    : {
                        color: tokens.bg,
                        fontSize: 14,
                        fontWeight: "600",
                        fontFamily: "Inter_400Regular",
                      }
                }
              >
                {t("orders.claimSelected", { count: selectedItemIds.length })}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Receipt-style payment summary */}
        <View style={{ marginBottom: 4 }}>
          <SectionLabel title={t("orders.amountDetails")} />
          <Surface>
            {discount !== null && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
                  {t("orders.discount")}
                </Text>
                <Text style={{ fontSize: 13, color: tokens.success, fontFamily: "Inter_400Regular" }}>- {formatRm(discount)}</Text>
              </View>
            )}

            {/* Dashed rule evokes a printed receipt */}
            <View
              style={{
                borderBottomWidth: 1,
                borderStyle: "dashed",
                borderColor: tokens.border,
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 13, letterSpacing: 1, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
                {t("orders.total")}
              </Text>
              <Text
                style={{
                  fontFamily: isNoir ? "Inter_400Regular" : "PlayfairDisplay_400Regular",
                  fontSize: isNoir ? 22 : 28,
                  fontWeight: isNoir ? "600" : "400",
                  color: tokens.text,
                }}
              >
                {formatRm(totalAmount)}
              </Text>
            </View>

            {pointsEarned !== null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}>
                <Ionicons name="star" size={14} color={tokens.accent} />
                <Text style={{ fontSize: 12, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
                  {t("orders.pointsEarnedThis", { count: pointsEarned })}
                </Text>
              </View>
            )}
          </Surface>
        </View>
      </ScrollView>
    </View>
  );
}
