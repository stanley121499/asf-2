import { Redirect, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useProductStockContext } from "@/context/product/ProductStockContext";
import { useProductPurchaseOrderContext } from "@/context/product/ProductPurchaseOrderContext";
import { useProductReportContext } from "@/context/product/ProductReportContext";
import { C, stockCountColor } from "./_lib/stockTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KpiItem {
  label: string;
  value: string;
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  color: string;
}

interface NavTileProps {
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
  label: string;
  description: string;
  href: string;
  router: ReturnType<typeof useRouter>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ item }: Readonly<{ item: KpiItem }>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: `${item.color}18`,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: C.muted }}>{item.label}</Text>
        <Text style={{ fontSize: 26, fontWeight: "700", color: C.text }}>{item.value}</Text>
      </View>
    </View>
  );
}

// ─── Navigation Tile ──────────────────────────────────────────────────────────
function NavTile({ icon, label, description, href, router }: Readonly<NavTileProps>): React.ReactElement {
  return (
    <Pressable onPress={() => router.push(href as never)}>
      <View
        style={{
          backgroundColor: C.panel,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
          backgroundColor: "#F5F5F3",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Ionicons name={icon} size={22} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>{label}</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.muted} />
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function StocksOverviewScreen(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { productStocks } = useProductStockContext();

  if (!isEnabled("stocks")) {
    return <Redirect href="/(app)/(tabs)/orders" />;
  }
  const { product_purchase_orders } = useProductPurchaseOrderContext();
  const { product_reports } = useProductReportContext();

  const kpis = useMemo<KpiItem[]>(() => {
    const totalUnits = productStocks.reduce((sum, s) => sum + s.count, 0);
    const lowStockCount = productStocks.filter((s) => s.count <= 5).length;
    const pendingPoCount = product_purchase_orders.filter(
      (po) => po.status === "pending"
    ).length;
    const reportCount = product_reports.length;

    return [
      {
        label: "库存总量",
        value: totalUnits.toLocaleString(),
        icon: "cube-outline",
        color: "#C9A96E",
      },
      {
        label: "库存不足SKU",
        value: String(lowStockCount),
        icon: "warning-outline",
        color: stockCountColor(lowStockCount === 0 ? 100 : 1),
      },
      {
        label: "待处理采购单",
        value: String(pendingPoCount),
        icon: "document-text-outline",
        color: "#C9A96E",
      },
      {
        label: "盘点报告",
        value: String(reportCount),
        icon: "bar-chart-outline",
        color: "#C9A96E",
      },
    ];
  }, [productStocks, product_purchase_orders, product_reports]);

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
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>库存</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* ── KPI column ── */}
        <View style={{ gap: 10, marginBottom: 24 }}>
          {kpis.map((item) => (
            <KpiCard key={item.label} item={item} />
          ))}
        </View>

        {/* ── Navigation section ── */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          管理
        </Text>

        <NavTile
          icon="layers-outline"
          label="全部库存"
          description="查看并监控所有SKU库存水平"
          href="/(app)/(tabs)/stocks/all"
          router={router}
        />
        <NavTile
          icon="document-text-outline"
          label="采购订单"
          description="创建并追踪供应商采购单"
          href="/(app)/(tabs)/stocks/purchase-orders"
          router={router}
        />
        <NavTile
          icon="bar-chart-outline"
          label="盘点报告"
          description="库存差异与审计报告"
          href="/(app)/(tabs)/stocks/reports"
          router={router}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
