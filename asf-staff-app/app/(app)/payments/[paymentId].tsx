import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  usePaymentContext,
  type PaymentEventRow,
  type PaymentWithDetails,
} from "@/context/PaymentContext";
import { type Database } from "@/database.types";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  danger: "#E8453C",
  dangerDark: "#DC2626",
} as const;

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type RefundStatus = Database["public"]["Enums"]["refund_status"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function paymentBadge(status: PaymentStatus): { label: string; bg: string; color: string } {
  switch (status) {
    case "succeeded":
      return { label: "已成功", bg: "#D1FAE5", color: "#059669" };
    case "processing":
      return { label: "处理中", bg: "#E0F2FE", color: "#2563EB" };
    case "canceled":
      return { label: "已取消", bg: "#FEE2E2", color: "#DC2626" };
    case "failed":
      return { label: "已失败", bg: "#FEE2E2", color: "#DC2626" };
    case "expired":
      return { label: "已过期", bg: "#FEE2E2", color: "#DC2626" };
    case "requires_payment_method":
      return { label: "需支付方式", bg: "#FEF3C7", color: "#D97706" };
    case "requires_action":
      return { label: "需操作", bg: "#FEF3C7", color: "#D97706" };
    default:
      return { label: "已创建", bg: "#F3F4F6", color: "#4B5563" };
  }
}

function refundBadge(status: RefundStatus): { label: string; bg: string; color: string } {
  switch (status) {
    case "partially_refunded":
      return { label: "部分退款", bg: "#FEF3C7", color: "#D97706" };
    case "refunded":
      return { label: "已退款", bg: "#FEE2E2", color: "#DC2626" };
    default:
      return { label: "未退款", bg: "#F3F4F6", color: "#4B5563" };
  }
}

/** Formats a currency amount — RM for MYR, otherwise shows the code. */
function fmtAmt(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  const code = currency.toUpperCase();
  const sym = code === "MYR" || code === "RM" ? "RM" : code;
  return `${sym} ${amount.toFixed(2)}`;
}

/** Formats an ISO string to a full locale datetime. */
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Converts a stripe_event_type string into a human-friendly label,
 * e.g. "payment_intent.succeeded" → "Payment Intent Succeeded".
 */
function fmtEventType(raw: string): string {
  return raw
    .split(".")
    .map((part) =>
      part
        .split("_")
        .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
        .join(" ")
    )
    .join(" · ");
}

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
  mono?: boolean;
}

function InfoRow({
  label,
  value,
  first = false,
  mono = false,
}: Readonly<InfoRowProps>): React.ReactElement {
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
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 15, color: C.muted, flexShrink: 0, minWidth: 100 }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: mono ? 12 : 15,
          color: value === null ? C.muted : C.text,
          textAlign: "right",
          flex: 1,
          fontFamily: mono ? "monospace" : undefined,
        }}
        numberOfLines={mono ? 2 : 1}
        selectable
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

// ─── Payment Events Timeline ──────────────────────────────────────────────────
function EventRow({
  event,
  isLast,
}: Readonly<{ event: PaymentEventRow; isLast: boolean }>): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: isLast ? 0 : 4 }}>
      {/* Timeline line + dot */}
      <View style={{ width: 24, alignItems: "center", paddingTop: 4 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#6B7280",
            borderWidth: 2,
            borderColor: C.panel,
          }}
        />
        {!isLast && (
          <View style={{ width: 2, flex: 1, backgroundColor: C.border, marginTop: 2 }} />
        )}
      </View>

      {/* Event content */}
      <View style={{ flex: 1, paddingLeft: 10, paddingBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
          {fmtEventType(event.stripe_event_type)}
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
          {fmtDateTime(event.created_at)}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: C.muted,
            marginTop: 2,
            fontFamily: "monospace",
          }}
          numberOfLines={1}
        >
          {event.stripe_event_id}
        </Text>
      </View>
    </View>
  );
}

// ─── Amount Breakdown Row ─────────────────────────────────────────────────────
function AmountRow({
  label,
  value,
  bold = false,
  first = false,
  color,
}: Readonly<{
  label: string;
  value: string;
  bold?: boolean;
  first?: boolean;
  color?: string;
}>): React.ReactElement {
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
      }}
    >
      <Text style={{ fontSize: 15, color: bold ? C.text : C.muted }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: bold ? 17 : 15,
          fontWeight: bold ? "700" : "400",
          color: color ?? (bold ? C.text : C.muted),
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PaymentDetailScreen(): React.ReactElement {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const router = useRouter();
  const { payments, updatePaymentStatus, updateRefundStatus } = usePaymentContext();

  const payment = useMemo(
    (): PaymentWithDetails | null =>
      payments.find((p) => p.id === paymentId) ?? null,
    [payments, paymentId]
  );

  const [savingStatus, setSavingStatus] = useState(false);
  const [savingRefund, setSavingRefund] = useState(false);
  const [refundAmountText, setRefundAmountText] = useState("");

  /** Update payment_status with a confirmation dialog. */
  const handleStatusChange = useCallback(
    (newStatus: PaymentStatus): void => {
      if (payment === null) return;
      Alert.alert(
        "更新支付状态",
        `将状态改为"${newStatus}"？该操作通常应由 Stripe 管理。`,
        [
          { text: "取消", style: "cancel" },
          {
            text: "更新",
            style: "destructive",
            onPress: () => {
              setSavingStatus(true);
              void updatePaymentStatus(payment.id, newStatus).finally(() =>
                setSavingStatus(false)
              );
            },
          },
        ]
      );
    },
    [payment, updatePaymentStatus]
  );

  /** Update refund status, requiring an amount for partial refunds. */
  const handleRefundChange = useCallback(
    (newRefundStatus: RefundStatus): void => {
      if (payment === null) return;

      const currentAmount = payment.refunded_amount;
      const inputAmount =
        refundAmountText.trim().length > 0
          ? Number.parseFloat(refundAmountText)
          : currentAmount;

      if (!Number.isFinite(inputAmount) || inputAmount < 0) {
        Alert.alert("验证", "请输入有效的退款金额。");
        return;
      }

      if (newRefundStatus === "partially_refunded" && inputAmount <= 0) {
        Alert.alert("验证", "请输入部分退款金额（需大于 0）。");
        return;
      }

      const displayAmount = `RM ${inputAmount.toFixed(2)}`;
      Alert.alert(
        "更新退款",
        `将退款状态设为"${newRefundStatus}"，金额 ${displayAmount}？`,
        [
          { text: "取消", style: "cancel" },
          {
            text: "确认",
            onPress: () => {
              setSavingRefund(true);
              void updateRefundStatus(payment.id, newRefundStatus, inputAmount).finally(() =>
                setSavingRefund(false)
              );
            },
          },
        ]
      );
    },
    [payment, updateRefundStatus, refundAmountText]
  );

  const handleOpenReceipt = useCallback((): void => {
    if (payment?.receipt_url === null || payment?.receipt_url === undefined) return;
    void Linking.openURL(payment.receipt_url);
  }, [payment]);

  if (payment === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = paymentBadge(payment.status);
  const refundInfo = refundBadge(payment.refund_status);
  const events = (payment.payment_events ?? [])
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const REFUND_STATUSES: RefundStatus[] = ["not_refunded", "partially_refunded", "refunded"];

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
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: C.text }}>
            {fmtAmt(payment.amount_total, payment.currency)}
          </Text>
          <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
            {payment.user_name ?? "未知"} · {fmtDateTime(payment.created_at)}
          </Text>
        </View>
      </View>

      {/* ── Status bar ── */}
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
        <View
          style={{
            backgroundColor: statusInfo.bg,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: statusInfo.color }}>
            {statusInfo.label}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: refundInfo.bg,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: refundInfo.color }}>
            {refundInfo.label}
          </Text>
        </View>
        {payment.receipt_url !== null && (
          <Pressable
            onPress={handleOpenReceipt}
            style={{ marginLeft: "auto" }}
            hitSlop={8}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <Ionicons name="receipt-outline" size={13} color={C.text} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>
                收据
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          <SectionLabel text="客户" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <InfoRow label="姓名" value={payment.name ?? payment.user_name ?? null} first />
            <InfoRow label="邮箱" value={payment.user_email ?? payment.email ?? null} />
            <InfoRow label="电话" value={payment.phone ?? null} />
          </View>

          <SectionLabel text="支付详情" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <InfoRow label="渠道" value={payment.provider} first />
            <InfoRow label="方式" value={payment.payment_method_type ?? null} />
            <InfoRow label="货币" value={payment.currency.toUpperCase()} />
            <InfoRow label="尝试次数" value={String(payment.attempt_count)} />
            <InfoRow label="正式模式" value={payment.livemode ? "是" : "否"} />
            {payment.order_id !== null && (
              <InfoRow label="订单ID" value={payment.order_id} mono />
            )}
            {payment.stripe_payment_intent_id !== null && (
              <InfoRow label="支付意图" value={payment.stripe_payment_intent_id} mono />
            )}
            {payment.latest_charge_id !== null && (
              <InfoRow label="扣款ID" value={payment.latest_charge_id} mono />
            )}
          </View>

          <SectionLabel text="金额明细" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <AmountRow
              label="小计"
              value={fmtAmt(payment.amount_subtotal, payment.currency)}
              first
            />
            {payment.amount_discount !== null && payment.amount_discount > 0 && (
              <AmountRow
                label="折扣"
                value={`− ${fmtAmt(payment.amount_discount, payment.currency)}`}
                color="#15803D"
              />
            )}
            {payment.amount_tax !== null && (
              <AmountRow
                label="税费"
                value={fmtAmt(payment.amount_tax, payment.currency)}
              />
            )}
            {payment.amount_shipping !== null && (
              <AmountRow
                label="运费"
                value={fmtAmt(payment.amount_shipping, payment.currency)}
              />
            )}
            <AmountRow
              label="合计"
              value={fmtAmt(payment.amount_total, payment.currency)}
              bold
            />
            {payment.refunded_amount > 0 && (
              <AmountRow
                label="已退款"
                value={`− ${fmtAmt(payment.refunded_amount, payment.currency)}`}
                color="#B91C1C"
              />
            )}
          </View>

          {payment.failure_message !== null && (
            <>
              <SectionLabel text="失败信息" />
              <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
                <InfoRow label="代码" value={payment.failure_code ?? null} first />
                <InfoRow label="消息" value={payment.failure_message} />
              </View>
            </>
          )}

          <SectionLabel text="支付状态" />
          <View
            style={{
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: C.border,
              backgroundColor: C.panel,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
              状态由 Stripe 管理，请谨慎覆盖。
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(
                [
                  "succeeded",
                  "processing",
                  "canceled",
                  "failed",
                ] as PaymentStatus[]
              ).map((s) => {
                const isActive = payment.status === s;
                const b = paymentBadge(s);
                return (
                  <Pressable
                    key={s}
                    onPress={() => handleStatusChange(s)}
                    disabled={isActive || savingStatus}
                  >
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: isActive ? b.color : C.border,
                        backgroundColor: isActive ? b.bg : C.panel,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {isActive && savingStatus && (
                        <ActivityIndicator size="small" color={b.color} />
                      )}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? "700" : "400",
                          color: isActive ? b.color : C.muted,
                        }}
                      >
                        {b.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <SectionLabel text="退款" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            {/* Refund amount input */}
            <View
              style={{
                backgroundColor: C.panel,
                paddingHorizontal: 16,
                paddingVertical: 13,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 15, color: C.text, minWidth: 110, flexShrink: 0 }}>
                退款金额
              </Text>
              <TextInput
                value={refundAmountText}
                onChangeText={setRefundAmountText}
                placeholder={`当前 ${fmtAmt(payment.refunded_amount, payment.currency)}`}
                placeholderTextColor={C.muted}
                keyboardType="decimal-pad"
                style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
              />
            </View>

            {/* Refund status chips */}
            <View
              style={{
                backgroundColor: C.panel,
                borderTopWidth: 1,
                borderTopColor: C.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
                更新退款状态
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {REFUND_STATUSES.map((rs) => {
                  const isActive = payment.refund_status === rs;
                  const b = refundBadge(rs);
                  return (
                    <Pressable
                      key={rs}
                      onPress={() => handleRefundChange(rs)}
                      disabled={isActive || savingRefund}
                    >
                      <View
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1.5,
                          borderColor: isActive ? b.color : C.border,
                          backgroundColor: isActive ? b.bg : C.panel,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {isActive && savingRefund && (
                          <ActivityIndicator size="small" color={b.color} />
                        )}
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? "700" : "400",
                            color: isActive ? b.color : C.muted,
                          }}
                        >
                          {b.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {events.length > 0 && (
            <>
              <SectionLabel text={`事件 (${events.length})`} />
              <View
                style={{
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.panel,
                  paddingTop: 16,
                  paddingBottom: 4,
                }}
              >
                {events.map((ev, idx) => (
                  <EventRow key={ev.id} event={ev} isLast={idx === events.length - 1} />
                ))}
              </View>
            </>
          )}

          <SectionLabel text="信息" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <View style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 13 }}>
              <Text style={{ fontSize: 12, color: C.muted }}>支付ID</Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2, fontFamily: "monospace" }} selectable>
                {payment.id}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: C.panel,
                borderTopWidth: 1,
                borderTopColor: C.border,
                paddingHorizontal: 16,
                paddingVertical: 13,
              }}
            >
              <Text style={{ fontSize: 12, color: C.muted }}>创建时间</Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {fmtDateTime(payment.created_at)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
