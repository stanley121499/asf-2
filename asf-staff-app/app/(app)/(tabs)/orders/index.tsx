import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useOrderContext, type OrderRow } from "@/context/product/OrderContext";
import { supabase } from "@/lib/supabase";

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  danger: "#E8453C",
  success: "#22C55E",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusFilter =
  | "all"
  | "pending"
  | "processing"
  | "awaiting_pickup"
  | "in_transit"
  | "delivered"
  | "cancelled";

type TimeFilter =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month";

interface EnrichedOrder extends OrderRow {
  customerName: string;
  itemCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "pending",
  "processing",
  "awaiting_pickup",
  "in_transit",
  "delivered",
  "cancelled",
];

const TIME_OPTIONS: { label: string; value: TimeFilter }[] = [
  { label: "全部时间", value: "all" },
  { label: "今天", value: "today" },
  { label: "昨天", value: "yesterday" },
  { label: "本周", value: "this_week" },
  { label: "本月", value: "this_month" },
  { label: "上月", value: "last_month" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatOrderNumber(id: string): string {
  return `#${id.substring(0, 8).toUpperCase()}`;
}

function inTimeRange(createdAt: string, filter: TimeFilter): boolean {
  const t = new Date(createdAt);
  const now = new Date();
  if (filter === "today") {
    return t.toDateString() === now.toDateString();
  }
  if (filter === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return t.toDateString() === y.toDateString();
  }
  if (filter === "this_week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return t >= start;
  }
  if (filter === "this_month") {
    return (
      t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth()
    );
  }
  if (filter === "last_month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
    return t >= lm && t <= end;
  }
  return true;
}

function statusBadgeStyle(status: string | null): {
  bg: string;
  color: string;
  label: string;
} {
  switch (status?.toLowerCase()) {
    case "completed":
    case "delivered":
      return { bg: "#D1FAE5", color: "#059669", label: status ?? "" };
    case "processing":
      return { bg: "#FEF3C7", color: "#D97706", label: "处理中" };
    case "pending":
      return { bg: "#FDFBF7", color: "#C9A96E", label: "待处理" };
    case "awaiting_pickup":
      return { bg: "#E0F2FE", color: "#2563EB", label: "等待取货" };
    case "in_transit":
      return { bg: "#F3E8FF", color: "#7C3AED", label: "运输中" };
    case "cancelled":
      return { bg: "#FEE2E2", color: "#DC2626", label: "已取消" };
    default:
      return { bg: "#F3F4F6", color: "#4B5563", label: status ?? "—" };
  }
}

function labelForStatus(s: StatusFilter): string {
  const map: Record<StatusFilter, string> = {
    all: "全部",
    pending: "待处理",
    processing: "处理中",
    awaiting_pickup: "等待取货",
    in_transit: "运输中",
    delivered: "已送达",
    cancelled: "已取消",
  };
  return map[s];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
}): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.panel,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: iconColor }}>
          {value}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: C.muted, flex: 1, lineHeight: 15 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrdersListScreen(): React.ReactElement {
  const router = useRouter();
  const { orders, loading, refreshOrders } = useOrderContext();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [enrichedOrders, setEnrichedOrders] = useState<EnrichedOrder[]>([]);
  const [enrichLoading, setEnrichLoading] = useState(false);

  /** Enrich orders with customer name + item count via Supabase. */
  const enrichOrders = useCallback(async (): Promise<void> => {
    if (orders.length === 0) {
      setEnrichedOrders([]);
      return;
    }
    setEnrichLoading(true);
    try {
      const userIds = [
        ...new Set(orders.map((o) => o.user_id).filter(Boolean)),
      ] as string[];

      const { data: users } = await supabase
        .from("user_details")
        .select("id, first_name, last_name")
        .in("id", userIds);

      const nameMap = new Map<string, string>();
      (users ?? []).forEach((u) => {
        const full = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
        nameMap.set(u.id, full.length > 0 ? full : `User ${u.id.slice(0, 8)}`);
      });

      const orderIds = orders.map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, amount")
        .in("order_id", orderIds)
        .is("deleted_at", null);

      const countMap = new Map<string, number>();
      (items ?? []).forEach((i) => {
        if (i.order_id === null) return;
        countMap.set(i.order_id, (countMap.get(i.order_id) ?? 0) + (i.amount ?? 0));
      });

      setEnrichedOrders(
        orders.map((o) => ({
          ...o,
          customerName: o.user_id !== null ? (nameMap.get(o.user_id) ?? "未知") : "访客",
          itemCount: countMap.get(o.id) ?? 0,
        }))
      );
    } finally {
      setEnrichLoading(false);
    }
  }, [orders]);

  useEffect(() => {
    void enrichOrders();
  }, [enrichOrders]);

  /** Stats computed from time-filtered enriched orders. */
  const stats = useMemo(() => {
    const inRange = enrichedOrders.filter((o) =>
      inTimeRange(o.created_at, timeFilter)
    );
    return {
      total: inRange.length,
      completed: inRange.filter(
        (o) => o.status === "completed" || o.status === "delivered"
      ).length,
      processing: inRange.filter((o) => o.status === "processing").length,
      cancelled: inRange.filter((o) => o.status === "cancelled").length,
    };
  }, [enrichedOrders, timeFilter]);

  /** Filtered + searched list. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrichedOrders.filter((o) => {
      if (!inTimeRange(o.created_at, timeFilter)) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q.length === 0) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (typeof o.shipping_address === "string" &&
          o.shipping_address.toLowerCase().includes(q))
      );
    });
  }, [enrichedOrders, statusFilter, timeFilter, query]);

  const timeLabel =
    TIME_OPTIONS.find((t) => t.value === timeFilter)?.label ?? "全部时间";

  const busy = loading || enrichLoading;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
          订单
        </Text>
        <Pressable
          onPress={() => setTimePickerOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: C.bg,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 12, color: C.text }}>{timeLabel}</Text>
          <Ionicons name="chevron-down" size={12} color={C.muted} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={busy}
        onRefresh={() => void refreshOrders()}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            {/* ── Stat Cards ───────────────────────────────────────────── */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <StatCard
                label="已完成"
                value={stats.completed}
                iconBg="#DCFCE7"
                iconColor="#15803D"
              />
              <StatCard
                label="处理中"
                value={stats.processing}
                iconBg="#FEF9C3"
                iconColor="#A16207"
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <StatCard
                label="已取消"
                value={stats.cancelled}
                iconBg="#FEE2E2"
                iconColor="#B91C1C"
              />
              <StatCard
                label="订单总数"
                value={stats.total}
                iconBg="#DBEAFE"
                iconColor="#1D4ED8"
              />
            </View>

            {/* ── Search ───────────────────────────────────────────────── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.panel,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 12,
                marginBottom: 12,
              }}
            >
              <Ionicons name="search-outline" size={16} color={C.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="搜索订单号、客户、地址…"
                placeholderTextColor={C.muted}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingLeft: 8,
                  fontSize: 14,
                  color: C.text,
                }}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={16} color={C.muted} />
                </Pressable>
              )}
            </View>

            {/* ── Status Filter Pills ──────────────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {STATUS_FILTERS.map((s) => {
                const active = s === statusFilter;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatusFilter(s)}
                    style={{
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: active ? C.accent : C.border,
                      backgroundColor: active ? C.accent : C.panel,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: active ? C.panel : C.text,
                      }}
                    >
                      {labelForStatus(s)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            {busy ? (
              <ActivityIndicator color={C.accent} />
            ) : (
              <>
                <Ionicons name="receipt-outline" size={40} color={C.border} />
                <Text
                  style={{ color: C.muted, marginTop: 12, fontSize: 14 }}
                >
                  暂无订单
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const badge = statusBadgeStyle(item.status);
          const date = new Date(item.created_at).toLocaleDateString("zh-CN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <Pressable
              onPress={() => router.push(`/(app)/(tabs)/orders/${item.id}`)}
              style={({ pressed }) => ({
                marginHorizontal: 16,
                marginBottom: 10,
                backgroundColor: C.panel,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                padding: 14,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {/* Row 1: order number + status badge */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: "monospace",
                    fontSize: 13,
                    fontWeight: "600",
                    color: C.text,
                  }}
                >
                  {formatOrderNumber(item.id)}
                </Text>
                <View
                  style={{
                    backgroundColor: badge.bg,
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: badge.color,
                      textTransform: "capitalize",
                    }}
                  >
                    {badge.label}
                  </Text>
                </View>
              </View>

              {/* Row 2: customer name */}
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: C.text, marginBottom: 4 }}
              >
                {item.customerName}
              </Text>

              {/* Row 3: date + items + total */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: C.muted }}>
                  {date}
                  {item.itemCount > 0 ? ` · ${item.itemCount} 件` : ""}
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: C.text }}
                >
                  RM{" "}
                  {typeof item.total_amount === "number"
                    ? item.total_amount.toFixed(2)
                    : "0.00"}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      {/* ── Time Filter Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={timePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setTimePickerOpen(false)}
        >
          <Pressable style={{ backgroundColor: C.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>
                时间范围
              </Text>
              <Pressable onPress={() => setTimePickerOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </Pressable>
            </View>
            {TIME_OPTIONS.map((opt) => {
              const active = opt.value === timeFilter;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setTimeFilter(opt.value);
                    setTimePickerOpen(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: active ? C.accent : C.text,
                      fontWeight: active ? "600" : "400",
                    }}
                  >
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={C.accent} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
