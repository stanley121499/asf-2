import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubPageHeader } from "@/components/SubPageHeader";
import { OrderProgressDots } from "@/components/OrderProgressTracker";
import { useAuthContext } from "@/context/AuthContext";
import { useOrderContext } from "@/context/product/OrderContext";
import type { Database } from "@/database.types";
import { formatRm } from "@/lib/formatCurrency";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/theme";

/** Per-order preview built from its line items: thumbnails + a names summary. */
interface OrderPreview {
  /** Primary product image URLs (deduped, lowest arrangement first). */
  images: string[];
  /** Display names of products in the order. */
  names: string[];
  /** Total number of line items. */
  count: number;
}

/** Visual treatment for an order status chip. */
interface StatusMeta {
  label: string;
  bg: string;
  fg: string;
}

/**
 * Maps a raw order status to a Chinese label and on-brand chip colours.
 */
function statusMeta(status: string | null | undefined): StatusMeta {
  const s = (status ?? "").trim().toLowerCase();
  if (s.includes("cancel")) {
    return { label: "已取消", bg: "#FCEDEC", fg: colors.danger };
  }
  if (s.includes("deliver") || s.includes("complete")) {
    return { label: "已送达", bg: "rgba(34,197,94,0.12)", fg: colors.success };
  }
  if (s.includes("ship") || s.includes("transit")) {
    return { label: "运输中", bg: "rgba(201,169,110,0.16)", fg: "#9A7B3F" };
  }
  if (s.includes("process") || s.includes("paid")) {
    return { label: "处理中", bg: "rgba(201,169,110,0.16)", fg: "#9A7B3F" };
  }
  return { label: "待确认", bg: colors.panel, fg: colors.muted };
}

type OrderMediaRow = {
  order_id: string | null;
  products: {
    name: string | null;
    product_medias: { media_url: string | null; arrangement: number | null }[] | null;
  } | null;
};

/**
 * Order history list — editorial cards with product previews, status chips,
 * progress dots, and a Playfair total, matching the order detail page.
 */
export default function OrdersListScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuthContext();
  const { orders, loading, refreshOrders } = useOrderContext();

  const mine = useMemo(() => {
    if (user === null) return [];
    return [...orders.filter((o) => o.user_id === user.id)].sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );
  }, [orders, user]);

  const [previews, setPreviews] = useState<Record<string, OrderPreview>>({});

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

  // Fetch line-item previews (thumbnails + names) for the visible orders.
  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      const ids = mine.map((o) => o.id);
      if (ids.length === 0) {
        setPreviews({});
        return;
      }

      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, products(name, product_medias(media_url, arrangement))")
        .in("order_id", ids);

      if (cancelled || error !== null || data === null) {
        return;
      }

      const map: Record<string, OrderPreview> = {};
      for (const row of data as OrderMediaRow[]) {
        const orderId = row.order_id;
        if (typeof orderId !== "string") {
          continue;
        }
        const entry = map[orderId] ?? { images: [], names: [], count: 0 };
        entry.count += 1;

        const name = row.products?.name;
        if (typeof name === "string" && name.trim().length > 0) {
          entry.names.push(name.trim());
        }

        const medias = row.products?.product_medias ?? [];
        const sorted = [...medias].sort((a, b) => (a.arrangement ?? 0) - (b.arrangement ?? 0));
        for (const media of sorted) {
          if (typeof media.media_url === "string" && media.media_url.trim().length > 0) {
            entry.images.push(media.media_url.trim());
            break;
          }
        }

        map[orderId] = entry;
      }

      setPreviews(map);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [mine]);

  if (user === null) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title="我的订单" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>登录后可查看订单。</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.panel }}>
        <SubPageHeader title="我的订单" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.panel }}>
      <SubPageHeader title="我的订单" />

      {mine.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Ionicons name="bag-outline" size={48} color={colors.border} style={{ marginBottom: 16 }} />
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 8 }}>暂无订单</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24, textAlign: "center" }}>下单后可在此查看订单详情</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/browse")}
            style={{ height: 52, paddingHorizontal: 32, backgroundColor: "#000000", borderRadius: 99, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_400Regular" }}>去购物</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mine}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: o }) => (
            <OrderCard
              order={o}
              preview={previews[o.id]}
              onPress={() => router.push(`/(tabs)/profile/orders/${o.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

/**
 * A single editorial order card: ref + date, status chip, product thumbnails
 * with a names summary, progress dots, and a Playfair total.
 */
function OrderCard({
  order,
  preview,
  onPress,
}: Readonly<{
  order: OrderRow;
  preview: OrderPreview | undefined;
  onPress: () => void;
}>): React.ReactElement {
  const shortId = order.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const date = typeof order.created_at === "string" ? order.created_at.slice(0, 10) : "—";
  const total = typeof order.total_amount === "number" ? order.total_amount : null;
  const status = typeof order.status === "string" ? order.status : null;
  const meta = statusMeta(status);

  const images = preview?.images ?? [];
  const names = preview?.names ?? [];
  const count = preview?.count ?? 0;

  const summary =
    names.length === 0
      ? count > 0
        ? `${count} 件商品`
        : "待付款确认"
      : names.length === 1
        ? names[0]
        : `${names[0]} 等 ${count} 件商品`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        marginBottom: 14,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        shadowColor: "#000000",
        shadowOpacity: 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 5 },
        elevation: 2,
      }}
    >
      {/* Header: ref + date | status chip */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 14, height: 2, backgroundColor: colors.accent }} />
          <Text style={{ fontSize: 13, letterSpacing: 1, color: colors.text, fontWeight: "600", fontFamily: "Inter_400Regular" }}>
            #{shortId}
          </Text>
        </View>
        <View style={{ backgroundColor: meta.bg, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ fontSize: 12, color: meta.fg, fontWeight: "600", fontFamily: "Inter_400Regular" }}>{meta.label}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, marginLeft: 22, fontFamily: "Inter_400Regular" }}>{date}</Text>

      {/* Product preview: thumbnails + summary */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 }}>
        {images.length > 0 ? (
          <View style={{ flexDirection: "row" }}>
            {images.slice(0, 3).map((uri, idx) => (
              <View
                key={`${uri}-${idx}`}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: colors.panel,
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  marginLeft: idx === 0 ? 0 : -12,
                }}
              >
                <Image source={{ uri }} style={{ width: 52, height: 52 }} contentFit="cover" />
              </View>
            ))}
            {count > 3 ? (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: colors.panel,
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  marginLeft: -12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600", fontFamily: "Inter_400Regular" }}>+{count - 3}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: colors.panel, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="bag-handle-outline" size={22} color={colors.muted} />
          </View>
        )}

        <Text style={{ flex: 1, fontSize: 13, color: colors.text, fontFamily: "Inter_400Regular" }} numberOfLines={2}>
          {summary}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 16, marginBottom: 14 }} />

      {/* Footer: progress dots | total */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <OrderProgressDots status={status} />
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, letterSpacing: 1, color: colors.muted, fontFamily: "Inter_400Regular" }}>合计</Text>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginTop: 2 }}>
            {formatRm(total)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
