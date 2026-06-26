import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useProductPurchaseOrderContext } from "@/context/product/ProductPurchaseOrderContext";
import { useProductContext } from "@/context/product/ProductContext";
import { C, poBadge, PO_STATUSES } from "../_lib/stockTokens";

// ─── Filter helpers ───────────────────────────────────────────────────────────
type FilterKey = "all" | (typeof PO_STATUSES)[number];

const FILTER_LABELS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: "all",       label: "全部"       },
  { key: "pending",   label: "待处理"   },
  { key: "confirmed", label: "已确认" },
  { key: "shipped",   label: "已发货"   },
  { key: "cancelled", label: "已取消" },
];

// ─── PO Card ──────────────────────────────────────────────────────────────────
interface PoCardProps {
  poNo: string | null;
  productName: string;
  status: string;
  orderDate: string | null;
  createdAt: string;
  onPress: () => void;
}

function PoCard({
  poNo,
  productName,
  status,
  orderDate,
  createdAt,
  onPress,
}: Readonly<PoCardProps>): React.ReactElement {
  const badge = poBadge(status);
  const displayDate = orderDate ?? createdAt;
  const dateLabel = new Date(displayDate).toLocaleDateString("zh-CN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          backgroundColor: C.panel,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          marginHorizontal: 16,
          marginBottom: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: "#F5F5F3",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Ionicons name="document-text-outline" size={20} color={C.muted} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 3 }}
            numberOfLines={1}
          >
            {poNo !== null && poNo.length > 0 ? poNo : "无采购单号"}
          </Text>
          <Text style={{ fontSize: 13, color: C.muted, marginBottom: 6 }} numberOfLines={1}>
            {productName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: badge.bg,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: badge.color }}>
                {badge.label}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: C.muted }}>{dateLabel}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={14} color={C.muted} />
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PurchaseOrdersListScreen(): React.ReactElement {
  const router = useRouter();
  const { product_purchase_orders, loading } = useProductPurchaseOrderContext();
  const { products } = useProductContext();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  /** Build a product id → name lookup */
  const productNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) map.set(p.id, p.name);
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...product_purchase_orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (filter !== "all") {
      list = list.filter((po) => po.status === filter);
    }
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(
        (po) =>
          (po.purchase_order_no ?? "").toLowerCase().includes(q) ||
          (po.order_no ?? "").toLowerCase().includes(q) ||
          (productNameMap.get(po.product_id) ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [product_purchase_orders, filter, search, productNameMap]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text, flex: 1 }}>
          采购订单
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/stocks/purchase-orders/create" as never)}
        >
          <View
            style={{
              backgroundColor: C.accent,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>新建采购单</Text>
          </View>
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View
        style={{
          backgroundColor: C.panel,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <View
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="搜索采购单号或商品…"
            placeholderTextColor={C.muted}
            style={{ flex: 1, fontSize: 15, color: C.text, paddingVertical: 8 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Status filter pills ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          gap: 8,
        }}
      >
        {FILTER_LABELS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: active ? C.accent : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: active ? "#FFFFFF" : C.muted,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <PoCard
              poNo={item.purchase_order_no}
              productName={productNameMap.get(item.product_id) ?? item.product_id}
              status={item.status}
              orderDate={item.order_date}
              createdAt={item.created_at}
              onPress={() =>
                router.push(
                  `/(app)/(tabs)/stocks/purchase-orders/${item.id}` as never
                )
              }
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 56 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="document-text-outline" size={30} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>
                暂无采购单
              </Text>
              <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                点击"新建采购单"创建
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
