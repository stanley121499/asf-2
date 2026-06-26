import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { supabase } from "@/lib/supabase";
import { getDateRange, fmtRM } from "@/utils/analyticsDateRange";
import {
  AnalyticsShell, C, SectionCard, StatCard, ListRows, TimeBarChart,
  type BarPoint, type ListEntry,
} from "@/components/analytics/shared";

interface ShippingAddr {
  state?: string;
  city?: string;
}

function parseAddr(raw: unknown): ShippingAddr {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) return raw as ShippingAddr;
  return {};
}

export default function AnalyticsProductsScreen(): React.ReactElement {
  const [timeRange, setTimeRange] = useState("本月");
  const [loading, setLoading] = useState(true);

  const [revenueTotal, setRevenueTotal] = useState(0);
  const [revenueBar, setRevenueBar] = useState<BarPoint[]>([]);
  const [bestProducts, setBestProducts] = useState<ListEntry[]>([]);
  const [unsellable, setUnsellable] = useState<ListEntry[]>([]);
  const [topStates, setTopStates] = useState<ListEntry[]>([]);
  const [topCities, setTopCities] = useState<ListEntry[]>([]);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    const { from, to } = getDateRange(timeRange);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    // ── Revenue over time ──────────────────────────────────────────────────
    const { data: ordersData } = await supabase
      .from("orders")
      .select("created_at, total_amount")
      .neq("status", "cancelled")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .is("deleted_at", null);

    const revByDate = new Map<string, number>();
    let totalRev = 0;
    for (const o of ordersData ?? []) {
      const key = o.created_at.slice(0, 10);
      const amt = o.total_amount ?? 0;
      revByDate.set(key, (revByDate.get(key) ?? 0) + amt);
      totalRev += amt;
    }
    setRevenueTotal(totalRev);
    setRevenueBar(
      Array.from(revByDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([x, y]) => ({ x, y }))
    );

    // ── Best + unsellable products ─────────────────────────────────────────
    const { data: itemsData } = await supabase
      .from("order_items")
      .select("amount, product_id, products(id, name), orders!inner(created_at, status, deleted_at)")
      .gte("orders.created_at", fromIso)
      .lte("orders.created_at", toIso)
      .neq("orders.status", "cancelled")
      .is("orders.deleted_at", null)
      .is("deleted_at", null);

    const salesMap = new Map<string, { name: string; units: number }>();
    for (const item of itemsData ?? []) {
      if (!item.product_id) continue;
      const name = Array.isArray(item.products)
        ? (item.products[0]?.name ?? item.product_id)
        : ((item.products as { name?: string } | null)?.name ?? item.product_id);
      const existing = salesMap.get(item.product_id);
      if (existing) { existing.units += item.amount ?? 0; }
      else { salesMap.set(item.product_id, { name, units: item.amount ?? 0 }); }
    }
    setBestProducts(
      Array.from(salesMap.values())
        .sort((a, b) => b.units - a.units)
        .slice(0, 10)
        .map((p) => ({ title: p.name, amount: p.units, unit: "件" }))
    );

    const soldIds = new Set<string>(
      (itemsData ?? []).map((i) => i.product_id).filter((id): id is string => id !== null)
    );
    const { data: stockData } = await supabase
      .from("product_stock")
      .select("product_id, count, products(id, name)")
      .gt("count", 0);

    const unsellMap = new Map<string, { name: string; count: number }>();
    for (const row of stockData ?? []) {
      if (!row.product_id || soldIds.has(row.product_id)) continue;
      const name = Array.isArray(row.products)
        ? (row.products[0]?.name ?? row.product_id)
        : ((row.products as { name?: string } | null)?.name ?? row.product_id);
      const ex = unsellMap.get(row.product_id);
      if (ex) { ex.count += row.count; } else { unsellMap.set(row.product_id, { name, count: row.count }); }
    }
    setUnsellable(
      Array.from(unsellMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((p) => ({ title: p.name, amount: p.count, unit: "件在库" }))
    );

    // ── Top states / cities ────────────────────────────────────────────────
    const { data: addrData } = await supabase
      .from("orders")
      .select("shipping_address_structured, total_amount")
      .neq("status", "cancelled")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .is("deleted_at", null);

    const stateMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    for (const o of addrData ?? []) {
      const addr = parseAddr(o.shipping_address_structured);
      const amt = o.total_amount ?? 0;
      if (addr.state) stateMap.set(addr.state, (stateMap.get(addr.state) ?? 0) + amt);
      if (addr.city) cityMap.set(addr.city, (cityMap.get(addr.city) ?? 0) + amt);
    }
    setTopStates(
      Array.from(stateMap.entries()).sort(([, a], [, b]) => b - a).slice(0, 5)
        .map(([t, a]) => ({ title: t, amount: a, unit: "RM" }))
    );
    setTopCities(
      Array.from(cityMap.entries()).sort(([, a], [, b]) => b - a).slice(0, 5)
        .map(([t, a]) => ({ title: t, amount: a, unit: "RM" }))
    );

    setLoading(false);
  }, [timeRange]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  return (
    <AnalyticsShell activeTab="商品" timeRange={timeRange} onTimeRangeChange={setTimeRange} loading={loading}>
      {/* Revenue KPI */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <StatCard label={`营业额 — ${timeRange}`} value={fmtRM(revenueTotal)} />
      </View>

      {/* Revenue over time */}
      <SectionCard title={`营业额趋势 — ${timeRange}`}>
        <TimeBarChart
          data={revenueBar}
          emptyText="暂无营业额数据"
          formatLabel={(x) => x.slice(5)}
        />
      </SectionCard>

      {/* Best performing */}
      <SectionCard title="销售最佳商品">
        <ListRows data={bestProducts} emptyText="本期无销售记录" />
      </SectionCard>

      {/* Unsellable */}
      <SectionCard title="滞销商品（有库存但无销售）">
        <ListRows data={unsellable} emptyText="本期所有有库存商品均有销售" />
      </SectionCard>

      {/* States / Cities */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <SectionCard title="热门省份">
            <ListRows
              data={topStates}
              emptyText="暂无数据"
              formatValue={(n) => fmtRM(n)}
            />
          </SectionCard>
        </View>
        <View style={{ flex: 1 }}>
          <SectionCard title="热门城市">
            <ListRows
              data={topCities}
              emptyText="暂无数据"
              formatValue={(n) => fmtRM(n)}
            />
          </SectionCard>
        </View>
      </View>
    </AnalyticsShell>
  );
}
