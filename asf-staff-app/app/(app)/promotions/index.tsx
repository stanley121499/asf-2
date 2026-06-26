import { Redirect, useRouter } from "expo-router";
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

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import {
  usePromotionContext,
  type Promotion,
} from "@/context/PromotionContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
type PromoStatus = "生效中" | "已排期" | "已过期" | "未激活";

function promoStatusLabel(p: Promotion): PromoStatus {
  if (!p.active) return "未激活";
  const now = Date.now();
  if (p.start_date !== null && p.start_date.length > 0) {
    const start = new Date(p.start_date).getTime();
    if (Number.isFinite(start) && now < start) return "已排期";
  }
  if (p.end_date !== null && p.end_date.length > 0) {
    const end = new Date(p.end_date).getTime();
    if (Number.isFinite(end) && now > end) return "已过期";
  }
  return "生效中";
}

function statusBadge(label: PromoStatus): { bg: string; color: string } {
  switch (label) {
    case "生效中":
      return { bg: "#D1FAE5", color: "#059669" };
    case "已排期":
      return { bg: "#FEF3C7", color: "#D97706" };
    case "已过期":
      return { bg: "#FEE2E2", color: "#DC2626" };
    default:
      return { bg: "#F3F4F6", color: "#4B5563" };
  }
}

function formatDiscount(p: Promotion): string {
  if (p.discount_type === "percentage") return `${p.discount_value}% 折扣`;
  return `RM ${Number(p.discount_value).toFixed(2)} 优惠`;
}

function formatDateRange(p: Promotion): string {
  const fmt = (d: string | null): string => {
    if (d === null || d.length === 0) return "—";
    return new Date(d).toLocaleDateString("zh-CN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  const s = fmt(p.start_date);
  const e = fmt(p.end_date);
  if (s === "—" && e === "—") return "无日期限制";
  return `${s} → ${e}`;
}

// ─── Promotion Card ───────────────────────────────────────────────────────────
function PromotionCard({
  item,
  onPress,
}: Readonly<{ item: Promotion; onPress: () => void }>): React.ReactElement {
  const label = promoStatusLabel(item);
  const badge = statusBadge(label);

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
          padding: 16,
          gap: 10,
        }}
      >
        {/* Top row: name + badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: C.text, flex: 1 }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View
            style={{
              backgroundColor: badge.bg,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: badge.color }}>
              {label}
            </Text>
          </View>
        </View>

        {/* Code + discount pill */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {item.code !== null && item.code.length > 0 && (
            <View
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{ fontSize: 12, fontFamily: "monospace", color: C.text, fontWeight: "600" }}
              >
                {item.code}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 13, color: C.accent, fontWeight: "600" }}>
            {formatDiscount(item)}
          </Text>
        </View>

        {/* Date range + uses */}
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={{ fontSize: 12, color: C.muted }}>{formatDateRange(item)}</Text>
          <Text style={{ fontSize: 12, color: C.muted }}>
            {item.max_uses === null
              ? `使用 ${item.uses_count} 次`
              : `${item.uses_count} / ${item.max_uses} 次`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PromotionsListScreen(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { promotions, loading } = usePromotionContext();

  if (!isEnabled("promotions")) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () =>
      [...promotions].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [promotions]
  );

  const filtered = useMemo(() => {
    if (search.trim().length === 0) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) === true
    );
  }, [sorted, search]);

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
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
            促销活动
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(app)/promotions/create")}
          style={{
            backgroundColor: C.accent,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>
            新建
          </Text>
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 10,
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
            placeholder="搜索名称或代码…"
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

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <PromotionCard
              item={item}
              onPress={() => router.push(`/(app)/promotions/${item.id}` as never)}
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
                <Ionicons name="pricetag-outline" size={30} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>
                {search.length > 0 ? "暂无匹配的促销活动" : "暂无促销"}
              </Text>
              <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                {search.length > 0
                  ? "请换个关键词搜索"
                  : "点击 + 新建创建首个促销活动"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
