import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useProductPurchaseOrderContext } from "@/context/product/ProductPurchaseOrderContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useProductColorContext } from "@/context/product/ProductColorContext";
import { useProductSizeContext } from "@/context/product/ProductSizeContext";
import { C, poBadge, PO_STATUSES } from "../_lib/stockTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
type PoStatus = (typeof PO_STATUSES)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ text }: Readonly<{ text: string }>): React.ReactElement {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: C.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 8,
      }}
    >
      {text}
    </Text>
  );
}

interface InfoRowProps {
  label: string;
  value: string | null;
  first?: boolean;
}

function InfoRow({ label, value, first = false }: Readonly<InfoRowProps>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 14, color: C.muted, flexShrink: 0 }}>{label}</Text>
      <Text
        style={{ fontSize: 14, color: C.text, fontWeight: "500", flex: 1, textAlign: "right" }}
        numberOfLines={2}
      >
        {value !== null && value.length > 0 ? value : "—"}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PurchaseOrderDetailScreen(): React.ReactElement {
  const { purchaseOrderId } = useLocalSearchParams<{ purchaseOrderId: string }>();
  const router = useRouter();

  const { product_purchase_orders, updateProductPurchaseOrder, deleteProductPurchaseOrder, loading } =
    useProductPurchaseOrderContext();
  const { products } = useProductContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  const po = useMemo(
    () => product_purchase_orders.find((o) => o.id === purchaseOrderId) ?? null,
    [product_purchase_orders, purchaseOrderId]
  );

  const [status, setStatus] = useState<PoStatus>("pending");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (po === null) return;
    const raw = po.status;
    setStatus(
      PO_STATUSES.includes(raw as PoStatus) ? (raw as PoStatus) : "pending"
    );
  }, [po]);

  const productName = useMemo(() => {
    if (po === null) return "";
    return products.find((p) => p.id === po.product_id)?.name ?? po.product_id;
  }, [po, products]);

  const colorNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of productColors) m.set(c.id, c.color);
    return m;
  }, [productColors]);

  const sizeNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of productSizes) m.set(s.id, s.size);
    return m;
  }, [productSizes]);

  const isDirty = po !== null && status !== po.status;
  const badge = poBadge(status);

  const handleSave = useCallback(async (): Promise<void> => {
    if (po === null || purchaseOrderId === undefined) return;
    setSaving(true);
    try {
      await updateProductPurchaseOrder({ id: purchaseOrderId, status });
    } finally {
      setSaving(false);
    }
  }, [po, purchaseOrderId, status, updateProductPurchaseOrder]);

  const handleDelete = useCallback((): void => {
    if (purchaseOrderId === undefined) return;
    Alert.alert(
      "删除采购单",
      "确定要永久删除此采购单吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            setDeleting(true);
            void deleteProductPurchaseOrder(purchaseOrderId).finally(() => {
              setDeleting(false);
              router.back();
            });
          },
        },
      ]
    );
  }, [purchaseOrderId, deleteProductPurchaseOrder, router]);

  if (loading && po === null) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator color={C.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (po === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 17, color: C.text }}>采购单不存在。</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: C.accent, fontSize: 15 }}>返回</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /** Extract entries from the RPC `items` field */
  const items = Array.isArray(po.items) ? po.items : [];

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text, flex: 1 }} numberOfLines={1}>
          {po.purchase_order_no !== null && po.purchase_order_no.length > 0
            ? po.purchase_order_no
            : "采购单"}
        </Text>
        {isDirty && (
          <Pressable onPress={() => void handleSave()} disabled={saving}>
            <View
              style={{
                backgroundColor: C.accent,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>保存</Text>
              )}
            </View>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Status chip row ── */}
        <View
          style={{
            backgroundColor: C.panel,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {PO_STATUSES.map((s) => {
            const active = status === s;
            const b = poBadge(s);
            return (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: active ? b.bg : "#F3F4F6",
                  borderWidth: active ? 1 : 0,
                  borderColor: active ? b.color : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: active ? b.color : C.muted,
                  }}
                >
                  {b.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Summary ── */}
        <SectionLabel text="概要" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <InfoRow label="商品" value={productName} first />
          <InfoRow label="状态" value={badge.label} />
          <InfoRow label="采购单号" value={po.purchase_order_no} />
          <InfoRow label="订单编号" value={po.order_no} />
          <InfoRow label="品牌" value={po.brand} />
          <InfoRow label="业务员编号" value={po.salesman_no} />
        </View>

        {/* ── Dates ── */}
        <SectionLabel text="日期" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <InfoRow label="下单日期" value={po.order_date} first />
          <InfoRow label="送货日期" value={po.delivery_date} />
          <InfoRow label="发货日期" value={po.shipping_date} />
          <InfoRow label="截止日期" value={po.cancel_date} />
        </View>

        {/* ── Logistics ── */}
        <SectionLabel text="物流" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <InfoRow label="收货地址" value={po.delivery_address} first />
          <InfoRow
            label="付款期限"
            value={po.terms === null ? null : `${po.terms} 天`}
          />
        </View>

        {/* ── Entries ── */}
        <SectionLabel text={items.length > 0 ? `条目 · ${items.length}` : "条目"} />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          {items.length === 0 ? (
            <View style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ fontSize: 14, color: C.muted }}>此订单暂无条目。</Text>
            </View>
          ) : (
            items.map((item: Record<string, unknown>, idx: number) => {
              const colorId = typeof item.color_id === "string" ? item.color_id : "";
              const sizeId = typeof item.size_id === "string" ? item.size_id : "";
              const qty = item.quantity ?? item.qty ?? 0;
              const price = item.unit_price ?? item.unitPrice ?? null;
              return (
                <View
                  key={`${colorId}-${sizeId}-${idx}`}
                  style={{
                    backgroundColor: C.panel,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: C.border,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                      {colorNameMap.get(colorId) ?? colorId} — {sizeNameMap.get(sizeId) ?? sizeId}
                    </Text>
                    {price !== null && (
                      <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        RM {Number(price).toFixed(2)} / 件
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>
                      ×{Number(qty)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Info ── */}
        <SectionLabel text="信息" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <InfoRow
            label="创建时间"
            first
            value={new Date(po.created_at).toLocaleDateString("zh-CN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
          <View
            style={{
              backgroundColor: C.panel,
              borderTopWidth: 1,
              borderTopColor: C.border,
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <Text style={{ fontSize: 12, color: C.muted }}>采购单ID</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{po.id}</Text>
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <SectionLabel text="危险操作" />
        <Pressable onPress={handleDelete} disabled={deleting} style={({ pressed }) => ({ opacity: pressed || deleting ? 0.7 : 1 })}>
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: C.danger,
              borderRadius: 14,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                  删除采购单
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
