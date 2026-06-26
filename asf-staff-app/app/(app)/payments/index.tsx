import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import {
  usePaymentContext,
  type PaymentWithDetails,
} from "@/context/PaymentContext";
import { type Database } from "@/database.types";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
} as const;

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type RefundStatus = Database["public"]["Enums"]["refund_status"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Maps a payment_status value to a display-friendly badge config. */
function paymentBadge(status: PaymentStatus): { label: string; bg: string; color: string } {
  switch (status) {
    case "succeeded":
      return { label: "已成功", bg: "#D1FAE5", color: "#059669" };
    case "processing":
      return { label: "处理中", bg: "#E0F2FE", color: "#2563EB" };
    case "canceled":
      return { label: "已取消", bg: "#FEE2E2", color: "#DC2626" };
    case "failed":
      return { label: "已失败", bg: "#FEE2E2", color: "#DC2626" };
    case "expired":
      return { label: "已过期", bg: "#FEE2E2", color: "#DC2626" };
    case "requires_payment_method":
      return { label: "需支付方式", bg: "#FEF3C7", color: "#D97706" };
    case "requires_action":
      return { label: "需操作", bg: "#FEF3C7", color: "#D97706" };
    default:
      return { label: "已创建", bg: "#F3F4F6", color: "#4B5563" };
  }
}

/** Returns a badge config for a refund_status, or null for "not_refunded". */
function refundBadge(status: RefundStatus): { label: string; bg: string; color: string } | null {
  switch (status) {
    case "partially_refunded":
      return { label: "部分退款", bg: "#FEF3C7", color: "#D97706" };
    case "refunded":
      return { label: "已退款", bg: "#FEE2E2", color: "#DC2626" };
    default:
      return null;
  }
}

/** Formats a currency amount as "RM X.XX" or "CUR X.XX". */
function fmtAmount(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const sym = code === "MYR" || code === "RM" ? "RM" : code;
  return `${sym} ${amount.toFixed(2)}`;
}

/** Returns a short human-relative date string. */
function relDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString("zh-CN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Payment Card ─────────────────────────────────────────────────────────────
function PaymentCard({
  item,
  onPress,
}: Readonly<{ item: PaymentWithDetails; onPress: () => void }>): React.ReactElement {
  const status = paymentBadge(item.status);
  const refund = refundBadge(item.refund_status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          backgroundColor: C.panel,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 6,
        }}
      >
        {/* Amount + status badge */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: C.text }}>
            {fmtAmount(item.amount_total, item.currency)}
          </Text>
          <View
            style={{
              backgroundColor: status.bg,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Customer name + date */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, color: C.text, flex: 1 }} numberOfLines={1}>
            {item.user_name ?? "未知"}
          </Text>
          <Text style={{ fontSize: 12, color: C.muted }}>
            {relDate(item.created_at)}
          </Text>
        </View>

        {/* Email + refund badge */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: C.muted, flex: 1 }} numberOfLines={1}>
            {item.user_email ?? item.email ?? "—"}
          </Text>
          {refund !== null && (
            <View
              style={{
                backgroundColor: refund.bg,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: refund.color }}>
                {refund.label}
              </Text>
            </View>
          )}
        </View>

        {/* Method + order ID chips */}
        {(item.payment_method_type !== null || item.order_id !== null) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 2 }}>
            {item.payment_method_type !== null && (
              <View
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>
                  {item.payment_method_type}
                </Text>
              </View>
            )}
            {item.order_id !== null && (
              <Text style={{ fontSize: 11, color: C.muted }}>
                {`订单 ${item.order_id.substring(0, 8)}…`}
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Filter pills config ───────────────────────────────────────────────────────
const STATUS_FILTERS: Array<{ key: PaymentStatus | "all"; label: string }> = [
  { key: "all", label: "全部" },
  { key: "succeeded", label: "已成功" },
  { key: "processing", label: "处理中" },
  { key: "requires_action", label: "需操作" },
  { key: "failed", label: "已失败" },
  { key: "canceled", label: "已取消" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PaymentsListScreen(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { payments, loading, refreshPayments } = usePaymentContext();

  if (!isEnabled("payments")) {
    return <Redirect href="/(app)/(tabs)/orders" />;
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await refreshPayments();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let result = payments;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.user_name?.toLowerCase().includes(q) === true ||
          p.user_email?.toLowerCase().includes(q) === true ||
          p.email?.toLowerCase().includes(q) === true ||
          p.order_id?.toLowerCase().includes(q) === true
      );
    }
    return result;
  }, [payments, statusFilter, search]);

  /** Total revenue from succeeded payments only. */
  const totalRevenue = useMemo(
    () => payments.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + p.amount_total, 0),
    [payments]
  );
  const succeededCount = useMemo(
    () => payments.filter((p) => p.status === "succeeded").length,
    [payments]
  );

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
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, flex: 1 }}>
          支付记录
        </Text>
        <Pressable onPress={() => void handleRefresh()} hitSlop={8} disabled={loading}>
          <Ionicons name="refresh-outline" size={22} color={loading ? C.muted : C.text} />
        </Pressable>
      </View>

      {/* ── Summary bar ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: "row",
        }}
      >
        {/* Left — Revenue hero */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingVertical: 16,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            营业额
          </Text>
          <Text
            style={{ fontSize: 26, fontWeight: "700", color: C.text, marginTop: 4 }}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {`RM ${totalRevenue.toFixed(2)}`}
          </Text>
        </View>

        {/* Vertical divider */}
        <View style={{ width: 1, backgroundColor: C.border }} />

        {/* Right — two stacked cells */}
        <View style={{ flex: 1 }}>
          {/* Succeeded */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              已成功
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
              {succeededCount}
            </Text>
          </View>

          {/* Horizontal divider */}
          <View style={{ height: 1, backgroundColor: C.border }} />

          {/* Total */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              合计
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
              {payments.length}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View
          style={{
            backgroundColor: C.panel,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
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
            placeholder="按姓名、邮箱或订单搜索…"
            placeholderTextColor={C.muted}
            style={{ flex: 1, fontSize: 15, color: C.text, paddingVertical: 10 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Filter pills ── */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        renderItem={({ item: f }) => {
          const isActive = statusFilter === f.key;
          return (
            <Pressable onPress={() => setStatusFilter(f.key)}>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: isActive ? C.accent : C.border,
                  backgroundColor: isActive ? C.accent : C.panel,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isActive ? "#FFFFFF" : C.muted,
                  }}
                >
                  {f.label}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      {/* ── Payment list ── */}
      {loading && payments.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
          }
          renderItem={({ item }) => (
            <PaymentCard
              item={item}
              onPress={() => router.push(`/(app)/payments/${item.id}` as never)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 }}>
              <Ionicons name="card-outline" size={36} color="#9CA3AF" />
              <Text style={{ fontSize: 16, fontWeight: "600", color: C.muted }}>
                {search.length > 0 || statusFilter !== "all" ? "暂无匹配的支付记录" : "暂无支付记录"}
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
                {search.length > 0 || statusFilter !== "all"
                  ? "请清除筛选条件后重试"
                  : "来自 Stripe 的支付记录将显示在此处"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
