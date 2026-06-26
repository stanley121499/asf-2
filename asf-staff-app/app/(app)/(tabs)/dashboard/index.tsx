import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuthContext } from "@/context/AuthContext";
import { useStaffRole } from "@/context/StaffRoleContext";
import { getDateRange } from "@/utils/analyticsDateRange";
import { supabase } from "@/lib/supabase";

// ─── Design tokens — High-End Fashion / Concierge Palette ─────────────────────
// Aligned with the Customer App's luxury aesthetic.

const C = {
  pageBg: "#F5F5F3", // Soft, warm off-white (Customer App panel)
  card: "#FFFFFF",
  separator: "#E5E5E3", // Crisp, subtle border
  label: "#0A0A0A", // Deep charcoal black
  labelSecondary: "#6B7280", // Muted grey
  
  // Brand Signature
  gold: "#C9A96E", // The customer app's primary accent
  goldTint: "#FDFBF7", // Very light gold wash for backgrounds
  
  // Semantic
  danger: "#E8453C",
  dangerTint: "#FEF2F2",
  success: "#22C55E",
  
  onDark: "#FFFFFF",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type DashboardKpis = {
  todayRevenue: number | null;
  yesterdayRevenue: number | null;
  pendingOrders: number | null;
  lowStockVariants: number | null;
  newCustomersThisWeek: number | null;
  weekOrders: number | null;
};

type QuickActionDef = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: Href;
};

/** A single row inside a MetricGroupCard. */
type MetricRowDef = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  urgent?: boolean;
  isFirst: boolean;
  onPress?: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRm(value: number): string {
  return `RM ${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateHeader(): string {
  return new Date().toLocaleDateString("zh-CN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sumAmounts(data: Array<{ total_amount: number | null }>): number {
  return data.reduce<number>((sum, r) => sum + (r.total_amount ?? 0), 0);
}

// ─── KPI fetch hook ───────────────────────────────────────────────────────────

function useDashboardKpis(): {
  kpis: DashboardKpis;
  loading: boolean;
  error: string | null;
} {
  const [kpis, setKpis] = useState<DashboardKpis>({
    todayRevenue: null,
    yesterdayRevenue: null,
    pendingOrders: null,
    lowStockVariants: null,
    newCustomersThisWeek: null,
    weekOrders: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      const { from: todayStart } = getDateRange("Today");
      const { from: yesterdayStart, to: yesterdayEnd } = getDateRange("Yesterday");
      const { from: weekStart } = getDateRange("This Week");

      try {
        const [revToday, revYest, pending, stock, customers, weekOrders] =
          await Promise.all([
            supabase
              .from("orders")
              .select("total_amount")
              .neq("status", "cancelled")
              .gte("created_at", todayStart.toISOString())
              .is("deleted_at", null),
            supabase
              .from("orders")
              .select("total_amount")
              .neq("status", "cancelled")
              .gte("created_at", yesterdayStart.toISOString())
              .lte("created_at", yesterdayEnd.toISOString())
              .is("deleted_at", null),
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("status", "pending")
              .is("deleted_at", null),
            supabase
              .from("product_stock")
              .select("id", { count: "exact", head: true })
              .lt("count", 10),
            supabase
              .from("user_details")
              .select("id", { count: "exact", head: true })
              .gte("created_at", weekStart.toISOString()),
            supabase
              .from("orders")
              .select("id", { count: "exact", head: true })
              .neq("status", "cancelled")
              .gte("created_at", weekStart.toISOString())
              .is("deleted_at", null),
          ]);

        setKpis({
          todayRevenue: revToday.error ? 0 : sumAmounts(revToday.data ?? []),
          yesterdayRevenue: revYest.error ? null : sumAmounts(revYest.data ?? []),
          pendingOrders: pending.error ? 0 : (pending.count ?? 0),
          lowStockVariants: stock.error ? 0 : (stock.count ?? 0),
          newCustomersThisWeek: customers.error ? 0 : (customers.count ?? 0),
          weekOrders: weekOrders.error ? 0 : (weekOrders.count ?? 0),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "KPI加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { kpis, loading, error };
}

// ─── Manage section helpers ───────────────────────────────────────────────────

type ManageActionKey =
  | "orders" | "products" | "analytics" | "chat"
  | "posts" | "stocks"
  | "promotions" | "payments" | "users" | "locations";

/** Canonical definition for every possible manage action. */
const ACTION_DEFS: Readonly<Record<ManageActionKey, QuickActionDef>> = {
  orders:     { icon: "receipt-outline",     label: "订单",     href: "/(app)/(tabs)/orders" },
  products:   { icon: "cube-outline",         label: "商品",   href: "/(app)/(tabs)/products" },
  analytics:  { icon: "stats-chart-outline",  label: "数据分析",  href: "/(app)/(tabs)/analytics" },
  chat:       { icon: "chatbubbles-outline",  label: "聊天",       href: "/(app)/(tabs)/chat" },
  posts:      { icon: "newspaper-outline",    label: "帖子",      href: "/(app)/(tabs)/posts" },
  stocks:     { icon: "layers-outline",       label: "库存",     href: "/(app)/(tabs)/stocks" },
  promotions: { icon: "pricetag-outline",     label: "促销", href: "/(app)/promotions" },
  payments:   { icon: "card-outline",         label: "付款",   href: "/(app)/payments" },
  users:      { icon: "person-outline",       label: "用户",     href: "/(app)/users" },
  locations:  { icon: "location-outline",     label: "门店",     href: "/(app)/locations" },
};

/**
 * Explicit manage action list per role — easy to adjust without conditionals.
 * Owner sees everything. Other roles see only what is relevant to their work.
 */
const MANAGE_ACTIONS_BY_ROLE: Readonly<Record<string, ReadonlyArray<ManageActionKey>>> = {
  owner:     ["orders", "payments", "promotions", "products", "stocks", "analytics", "chat", "posts", "users", "locations"],
  manager:   ["orders", "payments", "promotions", "products", "analytics", "chat", "posts", "locations"],
  staff:     ["orders", "stocks", "chat"],
  warehouse: ["products", "stocks", "chat"],
  support:   ["orders", "chat"],
};

function buildManageActions(
  role: ReturnType<typeof useStaffRole>["role"],
): QuickActionDef[] {
  if (role === null) return [];
  const keys = MANAGE_ACTIONS_BY_ROLE[role] ?? [];
  return keys.map((key) => ACTION_DEFS[key]);
}

/** Maps the raw DB role slug to its UI display label. */
function roleBadgeLabel(role: string): string {
  const map: Record<string, string> = {
    owner:     "Director",
    manager:   "Manager",
    staff:     "Staff",
    warehouse: "Warehouse",
    support:   "Support",
  };
  return map[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

function resolveFirstName(
  userDetail: ReturnType<typeof useAuthContext>["user_detail"],
): string | null {
  if (typeof userDetail?.first_name !== "string") return null;
  if (userDetail.first_name.length === 0) return null;
  return userDetail.first_name;
}

function revenueDeltaText(delta: number | null): { label: string; color: string } {
  if (delta === null) return { label: "", color: C.labelSecondary };
  if (delta > 0) return { label: `+${formatRm(delta)} 较昨日`, color: C.success };
  if (delta < 0) return { label: `${formatRm(delta)} 较昨日`, color: C.danger };
  return { label: "与昨日持平", color: C.labelSecondary };
}

// ─── UI Components ────────────────────────────────────────────────────────────

function RevenueHero({
  today,
  yesterday,
  onPress,
}: Readonly<{
  today: number | null;
  yesterday: number | null;
  onPress: () => void;
}>): React.ReactElement {
  const delta = today !== null && yesterday !== null ? today - yesterday : null;
  const { label: deltaLabel, color: deltaColor } = revenueDeltaText(delta);

  return (
    <Pressable onPress={onPress} style={{ marginHorizontal: 20, marginBottom: 32 }}>
      {({ pressed }) => (
        <View style={{
          backgroundColor: C.label, // Deep charcoal black
          borderRadius: 20,
          padding: 28,
          opacity: pressed ? 0.85 : 1,
          shadowColor: C.gold,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 10,
        }}>
          {/* Label row */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: "700",
              color: C.gold,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}>
              今日营业额 / Today
            </Text>
            <Ionicons name="chevron-forward" size={16} color={C.gold} style={{ opacity: 0.5 }} />
          </View>

          {/* Value */}
          <Text style={{
            fontSize: 44,
            fontWeight: "800",
            color: C.onDark,
            letterSpacing: -1.5,
            marginBottom: 12,
          }}>
            {today === null ? "—" : formatRm(today)}
          </Text>

          {/* Delta */}
          {deltaLabel.length > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: deltaColor,
                }}>
                  {deltaLabel}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

function MetricRow({
  icon,
  label,
  value,
  urgent,
  isFirst,
  onPress,
}: Readonly<MetricRowDef>): React.ReactElement {
  const isUrgent = urgent === true;
  
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 18,
          paddingHorizontal: 20,
          backgroundColor: pressed ? C.pageBg : C.card,
          borderBottomWidth: 1,
          borderBottomColor: C.separator,
        }}>
          {/* Icon Container */}
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: isUrgent ? C.dangerTint : C.goldTint,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
            borderWidth: 1,
            borderColor: isUrgent ? "rgba(232,69,60,0.1)" : "rgba(201,169,110,0.2)",
          }}>
            <Ionicons
              name={icon.replace("-outline", "") as any}
              size={18}
              color={isUrgent ? C.danger : C.gold}
            />
          </View>
          
          <Text style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "500",
            color: C.label,
          }}>
            {label}
          </Text>
          
          <Text style={{
            fontSize: 18,
            fontWeight: "700",
            color: isUrgent ? C.danger : C.label,
            marginRight: 8,
          }}>
            {value}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={C.labelSecondary} />
        </View>
      )}
    </Pressable>
  );
}

function MetricGroupCard({
  rows,
}: Readonly<{ rows: ReadonlyArray<Omit<MetricRowDef, "isFirst">> }>): React.ReactElement {
  return (
    <View style={{
      marginHorizontal: 20,
      marginBottom: 32,
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.separator,
      overflow: "hidden",
    }}>
      {rows.map((row, i) => (
        <MetricRow key={row.label} {...row} isFirst={i === 0} />
      ))}
    </View>
  );
}

function SectionLabel({ text }: Readonly<{ text: string }>): React.ReactElement {
  return (
    <Text style={{
      fontSize: 11,
      fontWeight: "700",
      color: C.labelSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginHorizontal: 24,
      marginBottom: 10,
    }}>
      {text}
    </Text>
  );
}

function QuickActionTile({
  icon,
  label,
  href,
  router,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: Href;
  router: ReturnType<typeof useRouter>;
}>): React.ReactElement {
  return (
    <Pressable onPress={() => router.push(href)} style={{ flex: 1 }}>
      {({ pressed }) => (
        <View style={{
          flex: 1,
          backgroundColor: pressed ? C.pageBg : C.card,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 20,
          paddingHorizontal: 8,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.separator,
        }}>
          <Ionicons
            name={icon}
            size={24}
            color={C.gold}
            style={{ marginBottom: 12 }}
          />
          <Text style={{
            fontSize: 12,
            fontWeight: "600",
            color: C.label,
            textAlign: "center",
          }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Quick-actions helpers ────────────────────────────────────────────────────

function buildMetricRows(
  kpis: DashboardKpis,
  navigate: (href: Href) => void,
): {
  urgentRows: ReadonlyArray<Omit<MetricRowDef, "isFirst">>;
  weekRows: ReadonlyArray<Omit<MetricRowDef, "isFirst">>;
} {
  const pendingIsUrgent = kpis.pendingOrders !== null && kpis.pendingOrders > 0;
  const stockIsUrgent = kpis.lowStockVariants !== null && kpis.lowStockVariants > 0;

  return {
    urgentRows: [
      {
        icon: "receipt-outline",
        label: "待处理订单",
        value: (kpis.pendingOrders ?? 0).toLocaleString(),
        urgent: pendingIsUrgent,
        onPress: () => navigate("/(app)/(tabs)/orders" as Href),
      },
      {
        icon: "warning-outline",
        label: "低库存商品",
        value: (kpis.lowStockVariants ?? 0).toLocaleString(),
        urgent: stockIsUrgent,
        onPress: () => navigate("/(app)/(tabs)/stocks/all" as Href),
      },
    ],
    weekRows: [
      {
        icon: "people-outline",
        label: "新客户",
        value: (kpis.newCustomersThisWeek ?? 0).toLocaleString(),
        onPress: () => navigate("/(app)/users" as Href),
      },
      {
        icon: "bag-outline",
        label: "本周订单",
        value: (kpis.weekOrders ?? 0).toLocaleString(),
        onPress: () => navigate("/(app)/(tabs)/orders" as Href),
      },
    ],
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen(): React.ReactElement {
  const router = useRouter();
  const { kpis, loading, error } = useDashboardKpis();
  const { role } = useStaffRole();

  const manageActions = buildManageActions(role);
  const { urgentRows, weekRows } = buildMetricRows(kpis, (href) => router.push(href));

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.pageBg }}>
      
      {/* ── Minimalist Header ───────────────────────────────────────────────── */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <View>
          <Text style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.gold,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            {formatDateHeader()}
          </Text>
          <Text style={{
            fontSize: 28,
            fontWeight: "800",
            color: C.label,
            letterSpacing: -0.5,
          }}>
            首页
          </Text>
        </View>
        
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {role !== null && (
            <View style={{
              backgroundColor: C.goldTint,
              borderWidth: 1,
              borderColor: "rgba(201,169,110,0.3)",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: "700",
                color: C.gold,
                letterSpacing: 0.5,
              }}>
                {roleBadgeLabel(role)}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => router.push("/(app)/settings")}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? C.separator : C.card,
              borderWidth: 1,
              borderColor: C.separator,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Ionicons name="person" size={16} color={C.label} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      >
        {error !== null && (
          <Text style={{ fontSize: 13, color: C.danger, marginHorizontal: 24, marginBottom: 16 }}>
            {error}
          </Text>
        )}

        {loading ? (
          <View style={{ height: 220, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={C.gold} size="large" />
          </View>
        ) : (
          <>
            {/* ── Revenue Hero ─────────────────────────────────────────────── */}
            <RevenueHero
              today={kpis.todayRevenue}
              yesterday={kpis.yesterdayRevenue}
              onPress={() => router.push("/(app)/payments" as Href)}
            />

            {/* ── Needs Attention ──────────────────────────────────────────── */}
            <SectionLabel text="需要关注 / Urgent" />
            <MetricGroupCard rows={urgentRows} />

            {/* ── This Week ────────────────────────────────────────────────── */}
            <SectionLabel text="本周概况 / This Week" />
            <MetricGroupCard rows={weekRows} />
          </>
        )}

        {/* ── Manage Grid ──────────────────────────────────────────────────── */}
        <SectionLabel text="功能管理 / Manage" />
        
        <View style={{
          marginHorizontal: 16,
          flexDirection: "row",
          flexWrap: "wrap",
          marginBottom: 32,
        }}>
          {manageActions.map((action) => (
            <View
              key={action.label}
              style={{
                width: "33.33%",
                padding: 4,
              }}
            >
              <QuickActionTile
                icon={action.icon}
                label={action.label}
                href={action.href}
                router={router}
              />
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}