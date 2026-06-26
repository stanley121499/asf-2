import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { OrderProgressTracker } from "@/components/OrderProgressTracker";
import { useAuthContext } from "@/context/AuthContext";
import { useOrderContext } from "@/context/product/OrderContext";
import type { Database } from "@/database.types";
import { formatRm } from "@/lib/formatCurrency";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type ProductMediaMini = Pick<Database["public"]["Tables"]["product_medias"]["Row"], "media_url" | "arrangement">;
type ProductMini = Pick<Database["public"]["Tables"]["products"]["Row"], "name" | "price"> & {
  product_medias: ProductMediaMini[] | null;
};
type ItemWithProduct = OrderItemRow & { products: ProductMini | null };

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
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginLeft: 4 }}>
      <View style={{ width: 16, height: 2, backgroundColor: colors.accent }} />
      <Text
        style={{
          fontSize: 11,
          letterSpacing: 2,
          color: colors.muted,
          fontFamily: "Inter_400Regular",
        }}
      >
        {title}
      </Text>
    </View>
  );
}

/**
 * Plain white floating surface used for every section body on the warm canvas.
 */
function Surface({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        shadowColor: "#000000",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
      }}
    >
      {children}
    </View>
  );
}

/**
 * Order detail — sticky header, fulfilment tracker, line items, totals.
 */
export default function OrderDetailScreen(): React.ReactElement {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const { orders, loading: ordersLoading } = useOrderContext();

  const [items, setItems] = useState<ItemWithProduct[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

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
      <View style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title="订单详情" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (order === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title="订单详情" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>未找到该订单。</Text>
        </View>
      </View>
    );
  }

  const tracking = typeof order.tracking_number === "string" && order.tracking_number.trim().length > 0 ? order.tracking_number.trim() : null;
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const createdDate = typeof order.created_at === "string" ? order.created_at.slice(0, 10) : "";
  const status = typeof order.status === "string" ? order.status : null;
  const isPending = (status ?? "").toLowerCase().includes("pending");
  const totalAmount = typeof order.total_amount === "number" ? order.total_amount : null;
  const discount =
    typeof order.discounted_amount === "number" && order.discounted_amount > 0
      ? order.discounted_amount
      : null;
  const pointsEarned =
    typeof order.points_earned === "number" && order.points_earned > 0 ? order.points_earned : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.panel }}>
      <SubPageHeader title="订单详情" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 56 }} showsVerticalScrollIndicator={false}>

        {/* Hero: order ref + date + fulfilment tracker, all in one statement */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 22,
            marginBottom: 28,
            shadowColor: "#000000",
            shadowOpacity: 0.05,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 11, letterSpacing: 2, color: colors.muted, fontFamily: "Inter_400Regular" }}>订单</Text>
              <Text style={{ fontSize: 13, letterSpacing: 1, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
                #{shortId}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>{createdDate}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20 }} />

          <OrderProgressTracker status={status} embedded />
        </View>

        {/* Tracking number */}
        {tracking !== null && (
          <View style={{ marginBottom: 20 }}>
            <SectionLabel title="物流" />
            <Surface>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>运单号</Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{tracking}</Text>
              </View>
            </Surface>
          </View>
        )}

        {/* Shipping address */}
        <View style={{ marginBottom: 20 }}>
          <SectionLabel title="收货地址" />
          <Surface>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 23, fontFamily: "Inter_400Regular" }}>
              {typeof order.shipping_address === "string" && order.shipping_address.length > 0 ? order.shipping_address : "—"}
            </Text>
          </Surface>
        </View>

        {/* Line items */}
        <View style={{ marginBottom: 20 }}>
          <SectionLabel title="商品" />
          <Surface>
            {itemsLoading ? (
              <ActivityIndicator color={colors.accent} />
            ) : itemsError !== null ? (
              <Text style={{ fontSize: 13, color: colors.danger, fontFamily: "Inter_400Regular" }}>{itemsError}</Text>
            ) : items.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <Ionicons name="cube-outline" size={26} color={colors.border} style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                  {isPending ? "商品将在付款确认后显示" : "暂无商品"}
                </Text>
              </View>
            ) : (
              items.map((line, idx) => {
                const name = line.products?.name ?? "商品";
                const unit = typeof line.products?.price === "number" ? line.products.price : 0;
                const qty = typeof line.amount === "number" ? line.amount : 0;
                const imageUrl = getProductImageUrl(line.products);
                return (
                  <View
                    key={line.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      borderBottomWidth: idx < items.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", backgroundColor: colors.panel }}>
                      {imageUrl.length > 0 ? (
                        <Image source={{ uri: imageUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
                      ) : (
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="image-outline" size={22} color={colors.muted} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: colors.text, fontFamily: "Inter_400Regular" }} numberOfLines={1}>{name}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3, fontFamily: "Inter_400Regular" }}>
                        {formatRm(unit)} × {qty}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: "500", fontFamily: "Inter_400Regular" }}>
                      {formatRm(unit * qty)}
                    </Text>
                  </View>
                );
              })
            )}
          </Surface>
        </View>

        {/* Receipt-style payment summary */}
        <View style={{ marginBottom: 4 }}>
          <SectionLabel title="费用明细" />
          <Surface>
            {discount !== null && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: colors.muted, fontFamily: "Inter_400Regular" }}>优惠</Text>
                <Text style={{ fontSize: 13, color: colors.success, fontFamily: "Inter_400Regular" }}>- {formatRm(discount)}</Text>
              </View>
            )}

            {/* Dashed rule evokes a printed receipt */}
            <View
              style={{
                borderBottomWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.border,
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 13, letterSpacing: 1, color: colors.muted, fontFamily: "Inter_400Regular" }}>合计</Text>
              <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 28, color: colors.text }}>
                {formatRm(totalAmount)}
              </Text>
            </View>

            {pointsEarned !== null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}>
                <Ionicons name="star" size={14} color={colors.accent} />
                <Text style={{ fontSize: 12, color: colors.muted, fontFamily: "Inter_400Regular" }}>
                  本次获得 {pointsEarned} 积分
                </Text>
              </View>
            )}
          </Surface>
        </View>
      </ScrollView>
    </View>
  );
}
