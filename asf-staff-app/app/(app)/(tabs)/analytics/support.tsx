import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { supabase } from "@/lib/supabase";
import { getDateRange } from "@/utils/analyticsDateRange";
import {
  AnalyticsShell, C, SectionCard, StatCard, TimeBarChart, HBarChart,
  type BarPoint,
} from "@/components/analytics/shared";

export default function AnalyticsSupportScreen(): React.ReactElement {
  const [timeRange, setTimeRange] = useState("本月");
  const [loading, setLoading] = useState(true);

  const [openCount, setOpenCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [volumeBar, setVolumeBar] = useState<BarPoint[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ label: string; value: number }[]>([]);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    const { from, to } = getDateRange(timeRange);

    const [volumeRes, snapshotRes] = await Promise.all([
      supabase
        .from("tickets")
        .select("id, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString()),

      supabase.from("tickets").select("id, status"),
    ]);

    // Volume over time
    const volByDate = new Map<string, number>();
    for (const t of volumeRes.data ?? []) {
      const key = t.created_at.slice(0, 10);
      volByDate.set(key, (volByDate.get(key) ?? 0) + 1);
    }
    setVolumeBar(
      Array.from(volByDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([x, y]) => ({ x, y }))
    );

    // Status snapshot
    const statusCounts = new Map<string, number>();
    for (const t of snapshotRes.data ?? []) {
      const s = t.status ?? "unknown";
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    }
    setOpenCount(statusCounts.get("open") ?? 0);
    setClosedCount((statusCounts.get("resolved") ?? 0) + (statusCounts.get("closed") ?? 0));
    setStatusBreakdown(
      Array.from(statusCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => ({ label, value }))
    );

    setLoading(false);
  }, [timeRange]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  return (
    <AnalyticsShell activeTab="客服" timeRange={timeRange} onTimeRangeChange={setTimeRange} loading={loading}>
      {/* KPI row */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <StatCard label="待处理工单" value={openCount.toLocaleString()} color={C.red} />
        <StatCard label="已关闭/已解决" value={closedCount.toLocaleString()} color={C.green} />
      </View>

      {/* Volume over time */}
      <SectionCard title={`工单量 — ${timeRange}`}>
        <TimeBarChart
          data={volumeBar}
          emptyText="本期无新建工单"
        />
      </SectionCard>

      {/* Status breakdown */}
      <SectionCard title="当前状态分布">
        <HBarChart
          data={statusBreakdown}
          emptyText="暂无工单数据"
          formatValue={(n) => `${n.toLocaleString()} 张`}
        />
      </SectionCard>
    </AnalyticsShell>
  );
}
