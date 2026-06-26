import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { supabase } from "@/lib/supabase";
import { getDateRange } from "@/utils/analyticsDateRange";
import {
  AnalyticsShell, SectionCard, StatCard, TimeBarChart,
  type BarPoint,
} from "@/components/analytics/shared";

export default function AnalyticsUsersScreen(): React.ReactElement {
  const [timeRange, setTimeRange] = useState("本月");
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [newUsersBar, setNewUsersBar] = useState<BarPoint[]>([]);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    const { from, to } = getDateRange(timeRange);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    const [newUsersRes, totalRes, activeRes] = await Promise.all([
      supabase
        .from("user_details")
        .select("id, created_at")
        .gte("created_at", fromIso)
        .lte("created_at", toIso),

      supabase
        .from("user_details")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("orders")
        .select("user_id")
        .neq("status", "cancelled")
        .gte("created_at", fromIso)
        .lte("created_at", toIso)
        .is("deleted_at", null),
    ]);

    // New users per day
    const countByDate = new Map<string, number>();
    for (const row of newUsersRes.data ?? []) {
      const key = row.created_at.slice(0, 10);
      countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    }
    setNewUsersBar(
      Array.from(countByDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([x, y]) => ({ x, y }))
    );

    setTotalUsers(totalRes.error ? 0 : (totalRes.count ?? 0));

    const activeIds = new Set<string>(
      (activeRes.data ?? []).map((r) => r.user_id).filter((id): id is string => id !== null)
    );
    setActiveUsers(activeIds.size);

    setLoading(false);
  }, [timeRange]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  return (
    <AnalyticsShell activeTab="用户" timeRange={timeRange} onTimeRangeChange={setTimeRange} loading={loading}>
      {/* KPI row */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <StatCard label="用户总数（累计）" value={totalUsers.toLocaleString()} />
        <StatCard label={`活跃用户 — ${timeRange}`} value={activeUsers.toLocaleString()} color="#15803D" />
      </View>

      {/* New users over time */}
      <SectionCard title={`新注册用户 — ${timeRange}`}>
        <TimeBarChart data={newUsersBar} emptyText="本期无新注册用户" />
      </SectionCard>
    </AnalyticsShell>
  );
}
