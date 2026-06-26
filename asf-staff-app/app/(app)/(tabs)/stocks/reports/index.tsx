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

import { useProductReportContext } from "@/context/product/ProductReportContext";
import { useProductContext } from "@/context/product/ProductContext";
import { C, reportBadge, REPORT_STATUSES } from "../_lib/stockTokens";

// ─── Filter helpers ───────────────────────────────────────────────────────────
type FilterKey = "all" | (typeof REPORT_STATUSES)[number];

const FILTER_LABELS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: "all",      label: "全部"      },
  { key: "pending",  label: "待审核"  },
  { key: "approved", label: "已批准" },
  { key: "rejected", label: "已拒绝" },
];

// ─── Report Card ──────────────────────────────────────────────────────────────
interface ReportCardProps {
  productName: string;
  status: string;
  company: string | null;
  reason: string | null;
  createdAt: string;
  onPress: () => void;
}

function ReportCard({
  productName,
  status,
  company,
  reason,
  createdAt,
  onPress,
}: Readonly<ReportCardProps>): React.ReactElement {
  const badge = reportBadge(status);
  const dateLabel = new Date(createdAt).toLocaleDateString("zh-CN", {
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
          <Ionicons name="bar-chart-outline" size={20} color={C.muted} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 3 }}
            numberOfLines={1}
          >
            {productName}
          </Text>
          {company !== null && company.length > 0 && (
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 4 }} numberOfLines={1}>
              {company}
            </Text>
          )}
          {reason !== null && reason.length > 0 && (
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 6 }} numberOfLines={1}>
              {reason}
            </Text>
          )}
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
export default function StockReportsListScreen(): React.ReactElement {
  const router = useRouter();
  const { product_reports, loading } = useProductReportContext();
  const { products } = useProductContext();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const productNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) m.set(p.id, p.name);
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...product_reports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (productNameMap.get(r.product_id) ?? "").toLowerCase().includes(q) ||
          (r.company ?? "").toLowerCase().includes(q) ||
          (r.reason ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [product_reports, filter, search, productNameMap]);

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
          盘点报告
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/stocks/reports/create" as never)}
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
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>新建</Text>
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
            placeholder="搜索商品、公司、原因…"
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

      {/* ── Filter pills ── */}
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
            <ReportCard
              productName={productNameMap.get(item.product_id) ?? item.product_id}
              status={item.status}
              company={item.company}
              reason={item.reason}
              createdAt={item.created_at}
              onPress={() =>
                router.push(`/(app)/(tabs)/stocks/reports/${item.id}` as never)
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
                <Ionicons name="bar-chart-outline" size={30} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>
                暂无盘点报告
              </Text>
              <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                点击"新建"创建报告
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
