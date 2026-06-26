/**
 * Shared UI primitives for all analytics screens.
 * Keeps each screen file lean — import what you need.
 */
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  blue: "#2563EB",
  green: "#22C55E",
  red: "#E8453C",
  amber: "#D97706",
};

export const TIME_RANGES = [
  "今天", "昨天", "本周", "上周",
  "本月", "上月", "本季度", "上季度",
  "今年", "去年",
] as const;

export type TimeRange = typeof TIME_RANGES[number];

// ─── Tab definition ───────────────────────────────────────────────────────────
export const TABS: { label: string; route: string }[] = [
  { label: "商品",   route: "/(app)/(tabs)/analytics/products" },
  { label: "用户",      route: "/(app)/(tabs)/analytics/users" },
  { label: "分类", route: "/(app)/(tabs)/analytics/categories" },
  { label: "客服",    route: "/(app)/(tabs)/analytics/support" },
];

// ─── Analytics page wrapper ───────────────────────────────────────────────────
export function AnalyticsShell({
  activeTab,
  timeRange,
  onTimeRangeChange,
  loading,
  children,
}: {
  activeTab: string;
  timeRange: string;
  onTimeRangeChange: (v: string) => void;
  loading: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>数据分析</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.bg }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>{timeRange}</Text>
            <Ionicons name="chevron-down" size={12} color={C.muted} />
          </Pressable>
        </View>
        {/* Tab pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.label;
            return (
              <Pressable
                key={tab.label}
                onPress={() => { if (!active) router.replace(tab.route as Parameters<typeof router.replace>[0]); }}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? C.accent : C.bg, borderWidth: 1, borderColor: active ? C.accent : C.border }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#FFFFFF" : C.muted }}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={{ marginTop: 12, fontSize: 13, color: C.muted }}>加载中…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
          {children}
        </ScrollView>
      )}

      {/* ── Time range picker modal ─────────────────────────────────────────── */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setPickerOpen(false)}>
          <Pressable style={{ backgroundColor: C.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>时间范围</Text>
              <Pressable onPress={() => setPickerOpen(false)}><Ionicons name="close" size={20} color={C.muted} /></Pressable>
            </View>
            {TIME_RANGES.map((tr) => (
              <Pressable key={tr} onPress={() => { onTimeRangeChange(tr); setPickerOpen(false); }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 }}>
                <Text style={{ fontSize: 15, color: tr === timeRange ? C.accent : C.text, fontWeight: tr === timeRange ? "700" : "400" }}>{tr}</Text>
                {tr === timeRange && <Ionicons name="checkmark" size={16} color={C.accent} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── KPI stat card ────────────────────────────────────────────────────────────
export function StatCard({ label, value, color }: { label: string; value: string; color?: string }): React.ReactElement {
  return (
    <View style={{ flex: 1, backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14 }}>
      <Text style={{ fontSize: 11, color: C.muted, fontWeight: "500", marginBottom: 6 }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: "800", color: color ?? C.text }}>{value}</Text>
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
export function SectionCard({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <View style={{ backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: "hidden" }}>
      <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: C.text }}>{title}</Text>
      </View>
      <View style={{ padding: 14 }}>{children}</View>
    </View>
  );
}

// ─── Ranked list row ──────────────────────────────────────────────────────────
export interface ListEntry { title: string; amount: number; unit: string }

export function ListRows({ data, emptyText, formatValue }: {
  data: ListEntry[]; emptyText: string; formatValue?: (n: number, unit: string) => string;
}): React.ReactElement {
  if (data.length === 0) {
    return <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", paddingVertical: 12 }}>{emptyText}</Text>;
  }
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <View style={{ gap: 10 }}>
      {data.map((item, i) => (
        <View key={`${item.title}-${i}`}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: C.muted, width: 20 }}>{i + 1}</Text>
            <Text style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: "500" }} numberOfLines={1}>{item.title}</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.accent, marginLeft: 8 }}>
              {formatValue !== undefined ? formatValue(item.amount, item.unit) : `${item.amount.toLocaleString()} ${item.unit}`}
            </Text>
          </View>
          <View style={{ height: 4, backgroundColor: "#F3F4F6", borderRadius: 2 }}>
            <View style={{ height: 4, width: `${(item.amount / max) * 100}%`, backgroundColor: C.accent, borderRadius: 2 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Vertical bar chart (time series) ────────────────────────────────────────
export interface BarPoint { x: string; y: number }

export function TimeBarChart({ data, emptyText, formatLabel }: {
  data: BarPoint[]; emptyText: string; formatLabel?: (x: string) => string;
}): React.ReactElement {
  const BAR_W = 28;
  const CHART_H = 100;

  if (data.length === 0) {
    return (
      <View style={{ height: CHART_H + 32, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 13, color: C.muted }}>{emptyText}</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.y), 1);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingVertical: 4, alignItems: "flex-end" }}>
      {data.map((pt) => {
        const barH = Math.max(4, Math.round((pt.y / max) * CHART_H));
        const label = formatLabel !== undefined ? formatLabel(pt.x) : pt.x.slice(5);
        return (
          <View key={pt.x} style={{ width: BAR_W, alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 9, color: C.muted, fontWeight: "600" }}>{pt.y > 0 ? pt.y.toLocaleString() : ""}</Text>
            <View style={{ width: BAR_W - 6, height: barH, backgroundColor: C.accent, borderRadius: 3 }} />
            <Text style={{ fontSize: 9, color: C.muted, width: BAR_W, textAlign: "center" }}>{label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Horizontal bar chart (category comparisons) ─────────────────────────────
export function HBarChart({ data, emptyText, formatValue }: {
  data: { label: string; value: number }[]; emptyText: string; formatValue?: (n: number) => string;
}): React.ReactElement {
  if (data.length === 0) {
    return <Text style={{ fontSize: 13, color: C.muted, textAlign: "center", paddingVertical: 12 }}>{emptyText}</Text>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ gap: 10 }}>
      {data.map((item, i) => (
        <View key={`${item.label}-${i}`}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: C.text, fontWeight: "500", flex: 1 }} numberOfLines={1}>{item.label}</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.accent, marginLeft: 8 }}>
              {formatValue !== undefined ? formatValue(item.value) : item.value.toLocaleString()}
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3 }}>
            <View style={{ height: 6, width: `${(item.value / max) * 100}%`, backgroundColor: C.accent, borderRadius: 3 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
