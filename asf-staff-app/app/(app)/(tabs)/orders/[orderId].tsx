import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuthContext } from "@/context/AuthContext";
import { type OrderRow, useOrderContext } from "@/context/product/OrderContext";
import { apiFetch } from "@/lib/apiFetch";
import { supabase } from "@/lib/supabase";

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  danger: "#E8453C",
  success: "#22C55E",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusOption =
  | "pending"
  | "processing"
  | "awaiting_pickup"
  | "in_transit"
  | "delivered"
  | "cancelled";

interface RateOption {
  serviceCode: string;
  name: string;
  price: number;
  currency: string;
  etaDays: number | null;
}

interface EnrichedItem {
  id: string;
  productName: string;
  color: string | null;
  size: string | null;
  quantity: number;
  unitPrice: number;
}

interface StatusLog {
  id: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
}

interface TrackingEvent {
  id: string;
  summary: string;
  when: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { value: StatusOption; label: string }[] = [
  { value: "pending", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "awaiting_pickup", label: "等待取货" },
  { value: "in_transit", label: "运输中" },
  { value: "delivered", label: "已送达" },
  { value: "cancelled", label: "已取消" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatOrderNumber(id: string): string {
  return `#${id.substring(0, 8).toUpperCase()}`;
}

function statusBadgeStyle(status: string | null): { bg: string; color: string } {
  switch (status?.toLowerCase()) {
    case "completed":
    case "delivered":
      return { bg: "#D1FAE5", color: "#059669" };
    case "processing":
      return { bg: "#FEF3C7", color: "#D97706" };
    case "pending":
      return { bg: "#FDFBF7", color: "#C9A96E" };
    case "awaiting_pickup":
      return { bg: "#E0F2FE", color: "#2563EB" };
    case "in_transit":
      return { bg: "#F3E8FF", color: "#7C3AED" };
    case "cancelled":
      return { bg: "#FEE2E2", color: "#DC2626" };
    default:
      return { bg: "#F3F4F6", color: "#4B5563" };
  }
}

function statusLabel(status: string | null): string {
  if (status === null || status === undefined) return "—";
  const map: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    awaiting_pickup: "等待取货",
    in_transit: "运输中",
    delivered: "已送达",
    cancelled: "已取消",
    completed: "已完成",
  };
  return map[status] ?? status;
}

function parseRates(json: unknown): RateOption[] {
  if (typeof json !== "object" || json === null) return [];
  const rec = json as Record<string, unknown>;
  if (!Array.isArray(rec["rates"])) return [];
  const out: RateOption[] = [];
  for (const r of rec["rates"] as unknown[]) {
    if (typeof r !== "object" || r === null) continue;
    const o = r as Record<string, unknown>;
    const serviceCode = typeof o.serviceCode === "string" ? o.serviceCode : "";
    if (serviceCode.length === 0) continue;
    out.push({
      serviceCode,
      name: typeof o.name === "string" ? o.name : serviceCode,
      price: typeof o.price === "number" ? o.price : 0,
      currency: typeof o.currency === "string" ? o.currency : "MYR",
      etaDays: typeof o.etaDays === "number" ? o.etaDays : null,
    });
  }
  return out;
}

function parseTrackingEvents(json: unknown): TrackingEvent[] {
  if (typeof json !== "object" || json === null) return [];
  const rec = json as Record<string, unknown>;
  const raw = Array.isArray(rec["trackingEvents"]) ? rec["trackingEvents"] : [];
  const out: TrackingEvent[] = [];
  let idx = 0;
  for (const item of raw as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const summary =
      typeof o.description === "string"
        ? o.description
        : typeof o.message === "string"
          ? o.message
          : typeof o.status === "string"
            ? o.status
            : JSON.stringify(o);
    const when =
      typeof o.date === "string"
        ? o.date
        : typeof o.timestamp === "string"
          ? o.timestamp
          : null;
    out.push({ id: `ev-${idx}`, summary, when });
    idx += 1;
  }
  return out;
}

// ─── Section Card wrapper ─────────────────────────────────────────────────────
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
          {title}
        </Text>
      </View>
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: C.text }}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OrderDetailScreen(): React.ReactElement {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const { orders, updateOrderStatus, refreshOrders } = useOrderContext();

  const order: OrderRow | undefined = useMemo(
    () => orders.find((o) => o.id === orderId),
    [orders, orderId]
  );

  // Customer name
  const [customerName, setCustomerName] = useState("Loading…");
  // Enriched line items
  const [items, setItems] = useState<EnrichedItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  // Status logs
  const [logs, setLogs] = useState<StatusLog[]>([]);
  // Tracking
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StatusOption>("pending");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Ship modal
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [weightText, setWeightText] = useState("1");
  const [rates, setRates] = useState<RateOption[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [shipBusy, setShipBusy] = useState(false);

  // Sync pending status when order loads
  useEffect(() => {
    if (order?.status !== null && order?.status !== undefined) {
      setPendingStatus(order.status as StatusOption);
    }
  }, [order?.status]);

  // Load customer name
  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      if (order?.user_id === null || order?.user_id === undefined) {
        setCustomerName("访客");
        return;
      }
      const { data } = await supabase
        .from("user_details")
        .select("first_name, last_name")
        .eq("id", order.user_id)
        .single();
      if (cancelled) return;
      if (data) {
        const full = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
        setCustomerName(full.length > 0 ? full : `User ${order.user_id.slice(0, 8)}`);
      } else {
        setCustomerName(`User ${order.user_id.slice(0, 8)}`);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [order?.user_id]);

  // Load enriched items (with product name, color, size)
  useEffect(() => {
    if (typeof orderId !== "string" || orderId.length === 0) return;
    let cancelled = false;
    async function load(): Promise<void> {
      setItemsLoading(true);
      const { data } = await supabase
        .from("order_items")
        .select(`
          id, amount,
          product:products(id, name, price),
          color:product_colors(id, color),
          size:product_sizes(id, size)
        `)
        .eq("order_id", orderId as string)
        .is("deleted_at", null);
      if (cancelled) return;
      if (data) {
        const enriched: EnrichedItem[] = data.map((row) => {
          const prod = Array.isArray(row.product) ? row.product[0] : row.product;
          const col = Array.isArray(row.color) ? row.color[0] : row.color;
          const sz = Array.isArray(row.size) ? row.size[0] : row.size;
          return {
            id: row.id,
            productName:
              typeof prod?.name === "string" ? prod.name : "商品",
            color: typeof col?.color === "string" ? col.color : null,
            size: typeof sz?.size === "string" ? sz.size : null,
            quantity: row.amount ?? 0,
            unitPrice: typeof prod?.price === "number" ? prod.price : 0,
          };
        });
        setItems(enriched);
      }
      setItemsLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [orderId]);

  // Load status logs
  useEffect(() => {
    if (typeof orderId !== "string") return;
    let cancelled = false;
    async function load(): Promise<void> {
      const { data } = await supabase
        .from("order_status_logs")
        .select("id, old_status, new_status, created_at")
        .eq("order_id", orderId as string)
        .order("created_at", { ascending: false });
      if (!cancelled) setLogs(data ?? []);
    }
    void load();
    return () => { cancelled = true; };
  }, [orderId]);

  // Load tracking if tracking number present
  useEffect(() => {
    const tn = order?.tracking_number;
    if (typeof tn !== "string" || tn.length === 0) return;
    let cancelled = false;
    async function load(): Promise<void> {
      setTrackingLoading(true);
      setTrackingError(null);
      try {
        const res = await apiFetch(`/api/delivery/tracking/${encodeURIComponent(orderId as string)}`);
        const json: unknown = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setTrackingError("加载物流信息失败");
          return;
        }
        const rec = json as Record<string, unknown>;
        setTrackingStatus(typeof rec.status === "string" ? rec.status : null);
        setTrackingEvents(parseTrackingEvents(json));
      } catch {
        if (!cancelled) setTrackingError("加载物流信息失败");
      } finally {
        if (!cancelled) setTrackingLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [orderId, order?.tracking_number]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleUpdateStatus = useCallback(async (): Promise<void> => {
    if (order === undefined) return;
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(order.id, pendingStatus, user?.id);
      await refreshOrders();
      setStatusModalOpen(false);
    } finally {
      setUpdatingStatus(false);
    }
  }, [order, pendingStatus, updateOrderStatus, user?.id, refreshOrders]);

  const fetchRates = useCallback(async (): Promise<void> => {
    if (order === undefined) return;
    const w = Number.parseFloat(weightText);
    if (!Number.isFinite(w) || w <= 0) return;

    const structured = order.shipping_address_structured;
    let destination: Record<string, string> = {
      address1: "Unknown",
      city: "Unknown",
      state: "Unknown",
      postcode: "00000",
      country: "MY",
    };
    if (typeof structured === "object" && structured !== null && !Array.isArray(structured)) {
      const s = structured as Record<string, unknown>;
      destination = {
        address1: typeof s.address1 === "string" ? s.address1 : "",
        city: typeof s.city === "string" ? s.city : "",
        state: typeof s.state === "string" ? s.state : "",
        postcode: typeof s.postcode === "string" ? s.postcode : "",
        country: typeof s.country === "string" ? s.country : "MY",
      };
    }

    setRatesLoading(true);
    setRatesError(null);
    try {
      const res = await apiFetch("/api/delivery/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, weight: { unit: "kg", value: w } }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && typeof (json as Record<string, unknown>).error === "string"
            ? (json as { error: string }).error
            : "获取运费失败";
        setRatesError(msg);
        setRates([]);
        return;
      }
      const parsed = parseRates(json);
      setRates(parsed);
      if (parsed.length > 0) setSelectedService(parsed[0].serviceCode);
    } catch {
      setRatesError("获取运费失败");
      setRates([]);
    } finally {
      setRatesLoading(false);
    }
  }, [order, weightText]);

  const handleConfirmShip = useCallback(async (): Promise<void> => {
    if (order === undefined || selectedService.length === 0) return;
    const w = Number.parseFloat(weightText);
    if (!Number.isFinite(w) || w <= 0) return;
    setShipBusy(true);
    try {
      const res = await apiFetch("/api/delivery/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          serviceCode: selectedService,
          weight: { unit: "kg", value: w },
        }),
      });
      if (res.ok) {
        setShipModalOpen(false);
        await refreshOrders();
      }
    } finally {
      setShipBusy(false);
    }
  }, [order, selectedService, weightText, refreshOrders]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (typeof orderId !== "string" || orderId.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <Text style={{ color: C.danger }}>缺少订单ID</Text>
      </View>
    );
  }

  if (order === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg, padding: 24 }}>
        <ActivityIndicator color={C.accent} />
        <Text style={{ color: C.muted, marginTop: 12, textAlign: "center" }}>加载中…</Text>
      </View>
    );
  }

  const badge = statusBadgeStyle(order.status);
  const trackingNumber = typeof order.tracking_number === "string" ? order.tracking_number : "";
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const labelUrl = typeof order.shipping_label_url === "string" ? order.shipping_label_url : "";
  const date = new Date(order.created_at).toLocaleString("zh-CN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={18} color={C.text} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
              订单 {formatOrderNumber(order.id)}
            </Text>
            <View
              style={{
                backgroundColor: badge.bg,
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: badge.color }}>
                {statusLabel(order.status)}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setStatusModalOpen(true)}
            style={{
              backgroundColor: C.accent,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="pencil" size={12} color={C.panel} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.panel }}>
              状态
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* ── Order Details ──────────────────────────────────────────────── */}
        <SectionCard title="订单详情">
          <InfoRow label="订单ID" value={order.id} />
          <InfoRow label="创建时间" value={date} />
          <InfoRow label="客户" value={customerName} />
          {typeof order.shipping_address === "string" && order.shipping_address.length > 0 && (
            <InfoRow label="收货地址" value={order.shipping_address} />
          )}
        </SectionCard>

        {/* ── Items ─────────────────────────────────────────────────────── */}
        <SectionCard title={`商品 (${totalItems}件)`}>
          {itemsLoading ? (
            <ActivityIndicator color={C.accent} />
          ) : items.length === 0 ? (
            <Text style={{ color: C.muted, fontSize: 13 }}>暂无商品</Text>
          ) : (
            items.map((item, idx) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingVertical: 10,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: C.border,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: C.text, marginBottom: 2 }}>
                    {item.productName}
                  </Text>
                  {(item.color !== null || item.size !== null) && (
                    <Text style={{ fontSize: 11, color: C.muted }}>
                      {[item.color !== null ? `颜色: ${item.color}` : null, item.size !== null ? `尺寸: ${item.size}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {`数量 ${item.quantity} × RM${item.unitPrice.toFixed(2)}`}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
                  {`RM${(item.quantity * item.unitPrice).toFixed(2)}`}
                </Text>
              </View>
            ))
          )}
        </SectionCard>

        {/* ── Order Summary ─────────────────────────────────────────────── */}
        <SectionCard title="订单摘要">
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: C.muted }}>总金额</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
              RM{typeof order.total_amount === "number" ? order.total_amount.toFixed(2) : "0.00"}
            </Text>
          </View>
          {typeof order.discounted_amount === "number" && order.discounted_amount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: C.muted }}>折扣</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.danger }}>
                {`-RM${order.discounted_amount.toFixed(2)}`}
              </Text>
            </View>
          )}
          {typeof order.points_earned === "number" && order.points_earned > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: C.muted }}>获得积分</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.success }}>
                {`+${order.points_earned}`}
              </Text>
            </View>
          )}
          {typeof order.points_spent === "number" && order.points_spent > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, color: C.muted }}>使用积分</Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.danger }}>
                {`-${order.points_spent}`}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Status History ────────────────────────────────────────────── */}
        <SectionCard title="状态历史">
          {/* Current status */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#EFF6FF",
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#DBEAFE",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <View
                style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#3B82F6" }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
                {statusLabel(order.status)}
              </Text>
              <Text style={{ fontSize: 11, color: C.muted }}>当前状态</Text>
            </View>
            <View style={{ backgroundColor: badge.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: badge.color }}>
                {statusLabel(order.status)}
              </Text>
            </View>
          </View>

          {logs.length === 0 ? (
            <Text style={{ fontSize: 12, color: C.muted, textAlign: "center", paddingVertical: 8 }}>
              暂无状态变更记录
            </Text>
          ) : (
            logs.map((log) => (
              <View
                key={log.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <View
                    style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.muted }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: C.text }}>
                    {`"${log.old_status ?? "—"}" → "${log.new_status ?? "—"}"`}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>
                    {new Date(log.created_at).toLocaleString("zh-CN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </SectionCard>

        {/* ── Shipment ──────────────────────────────────────────────────── */}
        <SectionCard title="物流">
          {trackingNumber.length > 0 ? (
            <>
              <InfoRow label="快递商 (服务代码)" value={order.courier_code ?? "—"} />
              <InfoRow label="运单号" value={trackingNumber} />
              {labelUrl.length > 0 && (
                <Pressable
                  onPress={() => void Linking.openURL(labelUrl)}
                  style={{
                    backgroundColor: C.accent,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: "center",
                    marginTop: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: C.panel }}>
                    打印面单
                  </Text>
                </Pressable>
              )}
              {/* Tracking events */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 8 }}>
                物流动态
              </Text>
              {trackingLoading ? (
                <ActivityIndicator color={C.accent} />
              ) : trackingError !== null ? (
                <Text style={{ fontSize: 12, color: C.danger }}>{trackingError}</Text>
              ) : trackingEvents.length === 0 ? (
                <Text style={{ fontSize: 12, color: C.muted }}>暂无物流信息</Text>
              ) : (
                <>
                  {trackingStatus !== null && (
                    <Text style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                      {`状态: ${trackingStatus}`}
                    </Text>
                  )}
                  {trackingEvents.map((ev) => (
                    <View
                      key={ev.id}
                      style={{
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 6,
                      }}
                    >
                      {ev.when !== null && (
                        <Text style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                          {ev.when}
                        </Text>
                      )}
                      <Text style={{ fontSize: 12, color: C.text }}>{ev.summary}</Text>
                    </View>
                  ))}
                </>
              )}
            </>
          ) : order.status === "processing" ? (
            <>
              <Text style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
                包裹打包完成后，可预约快递上门取件。
              </Text>
              <Pressable
                onPress={() => {
                  setWeightText("1");
                  setRates([]);
                  setRatesError(null);
                  setShipModalOpen(true);
                  void fetchRates();
                }}
                style={{
                  backgroundColor: C.accent,
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.panel }}>
                  发货
                </Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ fontSize: 13, color: C.muted }}>
              订单状态为"处理中"时可安排发货。
            </Text>
          )}
        </SectionCard>
      </ScrollView>

      {/* ── Change Status Modal ───────────────────────────────────────────── */}
      <Modal
        visible={statusModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: C.panel,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>
                更新订单状态
              </Text>
              <Pressable onPress={() => setStatusModalOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </Pressable>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
                {`当前状态: ${statusLabel(order.status)}`}
              </Text>
              {STATUS_OPTIONS.map((opt) => {
                const active = opt.value === pendingStatus;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPendingStatus(opt.value)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: active ? C.accent : C.border,
                      backgroundColor: active ? "#F5F5F5" : C.panel,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: active ? C.accent : C.text, fontWeight: active ? "600" : "400" }}>
                      {opt.label}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color={C.accent} />}
                  </Pressable>
                );
              })}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <Pressable
                  onPress={() => setStatusModalOpen(false)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: C.border,
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, color: C.muted }}>取消</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleUpdateStatus()}
                  disabled={updatingStatus || pendingStatus === order.status}
                  style={{
                    flex: 1,
                    backgroundColor:
                      updatingStatus || pendingStatus === order.status ? "#D1D5DB" : C.accent,
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: C.panel }}>
                    {updatingStatus ? "更新中…" : "确认更新"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Ship Modal ────────────────────────────────────────────────────── */}
      <Modal
        visible={shipModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setShipModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: C.panel,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: C.text }}>
                发货
              </Text>
              <Pressable onPress={() => setShipModalOpen(false)}>
                <Ionicons name="close" size={20} color={C.muted} />
              </Pressable>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {/* Weight */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6 }}>
                包裹重量 (kg)
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  marginBottom: 12,
                  backgroundColor: C.bg,
                }}
              >
                <TextInput
                  value={weightText}
                  onChangeText={(v) => {
                    setWeightText(v);
                  }}
                  onEndEditing={() => void fetchRates()}
                  keyboardType="numeric"
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: C.text }}
                />
                <Text style={{ fontSize: 12, color: C.muted }}>kg</Text>
              </View>

              <Pressable
                onPress={() => void fetchRates()}
                style={{
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 8,
                  paddingVertical: 10,
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: C.text }}>
                  {ratesLoading ? "加载中…" : "刷新快递选项"}
                </Text>
              </Pressable>

              {ratesError !== null && (
                <Text style={{ fontSize: 12, color: C.danger, marginBottom: 12 }}>
                  {ratesError}
                </Text>
              )}

              {ratesLoading ? (
                <ActivityIndicator color={C.accent} />
              ) : (
                rates.map((r) => {
                  const active = r.serviceCode === selectedService;
                  return (
                    <Pressable
                      key={r.serviceCode}
                      onPress={() => setSelectedService(r.serviceCode)}
                      style={{
                        borderWidth: 1,
                        borderColor: active ? C.accent : C.border,
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 8,
                        backgroundColor: active ? "#F5F5F5" : C.panel,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "500", color: C.text }}>
                          {r.name}
                        </Text>
                        {r.etaDays !== null && (
                          <Text style={{ fontSize: 11, color: C.muted }}>
                            {`预计 ${r.etaDays} 天`}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>
                          {`${r.currency} ${r.price.toFixed(2)}`}
                        </Text>
                        {active && (
                          <Ionicons name="checkmark-circle" size={16} color={C.accent} />
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setShipModalOpen(false)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: C.border,
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, color: C.muted }}>取消</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleConfirmShip()}
                  disabled={
                    shipBusy ||
                    ratesLoading ||
                    selectedService.length === 0 ||
                    rates.length === 0 ||
                    ratesError !== null
                  }
                  style={({ pressed }) => ({
                    flex: 1,
                    opacity: pressed || shipBusy || ratesLoading || selectedService.length === 0 ? 0.7 : 1,
                  })}
                >
                  <View style={{ backgroundColor: "#0A0A0A", borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF", letterSpacing: 0.5 }}>
                      {shipBusy ? "创建中…" : "确认发货"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
