import React, { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { getDateRange, fmtRM } from "@/utils/analyticsDateRange";
import {
  AnalyticsShell, SectionCard, HBarChart,
} from "@/components/analytics/shared";

interface CatStats { name: string; revenue: number; units: number }

export default function AnalyticsCategoriesScreen(): React.ReactElement {
  const [timeRange, setTimeRange] = useState("本月");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CatStats[]>([]);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    const { from, to } = getDateRange(timeRange);

    const { data: itemsData } = await supabase
      .from("order_items")
      .select(`
        amount,
        products!inner(
          price,
          product_categories(
            categories(name)
          )
        ),
        orders!inner(created_at, status, deleted_at)
      `)
      .gte("orders.created_at", from.toISOString())
      .lte("orders.created_at", to.toISOString())
      .neq("orders.status", "cancelled")
      .is("orders.deleted_at", null)
      .is("deleted_at", null);

    const map = new Map<string, CatStats>();
    for (const item of itemsData ?? []) {
      const units = item.amount ?? 0;
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      if (!product) continue;
      const price: number = (product as { price: number }).price ?? 0;
      const pcs = Array.isArray((product as { product_categories?: unknown }).product_categories)
        ? (product as { product_categories: { categories: { name: string } | null }[] }).product_categories
        : [];
      for (const pc of pcs) {
        const catObj = pc.categories;
        if (!catObj) continue;
        const catName: string = Array.isArray(catObj)
          ? (catObj[0]?.name ?? "Unknown")
          : ((catObj as { name: string }).name ?? "Unknown");
        const ex = map.get(catName);
        if (ex) { ex.units += units; ex.revenue += units * price; }
        else { map.set(catName, { name: catName, units, revenue: units * price }); }
      }
    }

    setStats(Array.from(map.values()).sort((a, b) => b.revenue - a.revenue));
    setLoading(false);
  }, [timeRange]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  return (
    <AnalyticsShell activeTab="分类" timeRange={timeRange} onTimeRangeChange={setTimeRange} loading={loading}>
      <SectionCard title={`分类营业额 — ${timeRange}`}>
        <HBarChart
          data={stats.map((s) => ({ label: s.name, value: Math.round(s.revenue) }))}
          emptyText="暂无分类营业额数据"
          formatValue={(n) => fmtRM(n)}
        />
      </SectionCard>

      <SectionCard title={`各分类销量 — ${timeRange}`}>
        <HBarChart
          data={stats.map((s) => ({ label: s.name, value: s.units }))}
          emptyText="暂无销量数据"
          formatValue={(n) => `${n.toLocaleString()} 件`}
        />
      </SectionCard>
    </AnalyticsShell>
  );
}
