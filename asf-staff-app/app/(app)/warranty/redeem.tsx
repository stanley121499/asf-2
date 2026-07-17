import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmModal } from "@/components/ConfirmModal";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import {
  useStoreLocationContext,
  type StoreLocation,
} from "@/context/StoreLocationContext";
import {
  confirmWarrantyRedeem,
  parseRedemptionInput,
  previewWarrantyRedeem,
  redeemReasonLabel,
  type RedeemPreviewPayload,
  type WarrantyVoucherPayload,
} from "@/lib/warranty/warrantyRedeemApi";

/**
 * Feature flag: dedicated `warranty_registration` (same key as customer app).
 * Photo-based claims and card registration ship independently.
 */
const FEATURE_FLAG_KEY = "warranty_registration" as const;

const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  accentTint: "#FDFBF7",
  success: "#059669",
  successTint: "#D1FAE5",
  danger: "#DC2626",
  dangerTint: "#FEE2E2",
  warn: "#B45309",
  warnTint: "#FEF3C7",
} as const;

type ScreenPhase =
  | { kind: "idle" }
  | { kind: "preview"; preview: RedeemPreviewPayload }
  | { kind: "success"; voucher: WarrantyVoucherPayload; storeName: string };

/**
 * Formats a MYR amount for staff display.
 */
function formatRm(value: number): string {
  return `RM ${value.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats an ISO timestamp for staff display (local zh-CN).
 */
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Status badge colours for preview / success cards.
 */
function statusBadgeColors(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "active":
      return { bg: C.successTint, text: C.success, label: "有效" };
    case "used":
      return { bg: C.warnTint, text: C.warn, label: "已核销" };
    case "expired":
      return { bg: C.dangerTint, text: C.danger, label: "已过期" };
    case "revoked":
      return { bg: "#F3F4F6", text: "#4B5563", label: "已作废" };
    default:
      return { bg: "#F3F4F6", text: "#4B5563", label: status };
  }
}

/**
 * Staff in-store warranty voucher redeem screen.
 *
 * Flow: type/paste redemption code (or QR JSON) → preview → pick store → confirm.
 * Till discount remains manual (no POS).
 */
export default function WarrantyRedeemScreen(): React.ReactElement {
  const router = useRouter();
  const { isEnabled } = useFeatureFlags();
  const { storeLocations, loading: storesLoading } = useStoreLocationContext();

  const [codeInput, setCodeInput] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScreenPhase>({ kind: "idle" });
  const [previewBusy, setPreviewBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const activeStores = useMemo(
    () =>
      [...storeLocations]
        .filter((s) => s.active === true)
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.name.localeCompare(b.name);
        }),
    [storeLocations]
  );

  if (!isEnabled(FEATURE_FLAG_KEY)) {
    return <Redirect href="/(app)/(tabs)/dashboard" />;
  }

  const selectedStore: StoreLocation | null =
    selectedStoreId === null
      ? null
      : (activeStores.find((s) => s.id === selectedStoreId) ?? null);

  const onCodeChange = (value: string): void => {
    setCodeInput(value);
    setFormError(null);
    if (phase.kind !== "idle") {
      setPhase({ kind: "idle" });
    }
  };

  const onPreview = async (): Promise<void> => {
    setFormError(null);
    const parsed = parseRedemptionInput(codeInput);
    if (parsed.redemptionCode === null && parsed.creditId === null) {
      setFormError("请输入或粘贴兑换码");
      return;
    }

    setPreviewBusy(true);
    try {
      const result = await previewWarrantyRedeem({
        redemptionCode: parsed.redemptionCode ?? undefined,
        creditId: parsed.creditId ?? undefined,
      });
      if (result.ok === false) {
        setPhase({ kind: "idle" });
        setFormError(
          result.message.length > 0
            ? result.message
            : redeemReasonLabel(result.error)
        );
        return;
      }
      setPhase({ kind: "preview", preview: result.preview });
      // Prefer showing the canonical code from the server in the input.
      if (
        result.preview.redemptionCode !== null &&
        result.preview.redemptionCode.length > 0
      ) {
        setCodeInput(result.preview.redemptionCode);
      }
    } finally {
      setPreviewBusy(false);
    }
  };

  const onConfirmPress = (): void => {
    if (phase.kind !== "preview" || phase.preview.redeemable === false) {
      return;
    }
    if (selectedStore === null) {
      setFormError("请选择核销门店");
      return;
    }
    const code = phase.preview.redemptionCode;
    if (code === null || code.trim().length === 0) {
      setFormError("此凭证缺少兑换码，无法核销");
      return;
    }
    setFormError(null);
    setConfirmVisible(true);
  };

  const onConfirmRedeem = async (): Promise<void> => {
    setConfirmVisible(false);
    if (phase.kind !== "preview" || selectedStore === null) {
      return;
    }
    const code = phase.preview.redemptionCode;
    if (code === null || code.trim().length === 0) {
      setFormError("此凭证缺少兑换码，无法核销");
      return;
    }

    setConfirmBusy(true);
    try {
      const result = await confirmWarrantyRedeem({
        redemptionCode: code,
        redeemedStoreId: selectedStore.id,
      });
      if (result.ok === false) {
        setFormError(
          result.message.length > 0
            ? result.message
            : redeemReasonLabel(result.error)
        );
        // Refresh preview so UI reflects used / expired after a race.
        const refreshed = await previewWarrantyRedeem({
          redemptionCode: code,
        });
        if (refreshed.ok === true) {
          setPhase({ kind: "preview", preview: refreshed.preview });
        }
        return;
      }
      setPhase({
        kind: "success",
        voucher: result.voucher,
        storeName: selectedStore.name,
      });
    } finally {
      setConfirmBusy(false);
    }
  };

  const onReset = (): void => {
    setCodeInput("");
    setSelectedStoreId(null);
    setPhase({ kind: "idle" });
    setFormError(null);
  };

  const preview =
    phase.kind === "preview" ? phase.preview : null;
  const success =
    phase.kind === "success" ? phase : null;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
          核销保修凭证
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13, color: C.muted, lineHeight: 20 }}>
          输入或粘贴顾客兑换码（也可粘贴二维码 JSON）。先预览再确认核销；收银折扣请在柜台手动处理。
        </Text>

        {/* Code input */}
        <View
          style={{
            backgroundColor: C.panel,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            padding: 16,
            gap: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: C.muted,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            兑换码
          </Text>
          <TextInput
            value={codeInput}
            onChangeText={onCodeChange}
            placeholder="例如 K7M2P9QX 或粘贴 QR JSON"
            placeholderTextColor={C.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={success === null && previewBusy === false && confirmBusy === false}
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: C.text,
              letterSpacing: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 10,
              backgroundColor: C.bg,
            }}
          />
          {success === null ? (
            <Pressable
              disabled={previewBusy || confirmBusy}
              onPress={() => void onPreview()}
              style={({ pressed }) => ({
                opacity: pressed || previewBusy ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: C.text,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {previewBusy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={18} color="#FFFFFF" />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                    >
                      预览凭证
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          ) : null}
        </View>

        {formError !== null ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              backgroundColor: C.dangerTint,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Ionicons name="alert-circle" size={18} color={C.danger} />
            <Text style={{ flex: 1, fontSize: 13, color: C.danger, lineHeight: 18 }}>
              {formError}
            </Text>
          </View>
        ) : null}

        {/* Success state */}
        {success !== null ? (
          <View
            style={{
              backgroundColor: C.panel,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.success,
              padding: 20,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: C.successTint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="checkmark" size={22} color={C.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
                  核销成功
                </Text>
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  请在柜台手动减免 {formatRm(success.voucher.amountMyr)}
                </Text>
              </View>
            </View>
            <Row label="金额" value={formatRm(success.voucher.amountMyr)} emphasize />
            <Row label="兑换码" value={success.voucher.redemptionCode} />
            <Row label="门店" value={success.storeName} />
            {success.voucher.usedAt !== null ? (
              <Row label="核销时间" value={formatDateTime(success.voucher.usedAt)} />
            ) : null}
            <Pressable onPress={onReset} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View
                style={{
                  marginTop: 4,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>
                  核销下一张
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Preview card */}
        {preview !== null && success === null ? (
          <PreviewCard preview={preview} />
        ) : null}

        {/* Store selector — only when redeemable preview */}
        {preview !== null && preview.redeemable === true && success === null ? (
          <View
            style={{
              backgroundColor: C.panel,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              padding: 16,
              gap: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: C.muted,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              核销门店
            </Text>
            {storesLoading ? (
              <ActivityIndicator color={C.accent} />
            ) : activeStores.length === 0 ? (
              <Text style={{ fontSize: 13, color: C.danger }}>
                没有可用门店。请先在「门店」启用门店位置。
              </Text>
            ) : (
              activeStores.map((store) => {
                const selected = selectedStoreId === store.id;
                return (
                  <Pressable
                    key={store.id}
                    onPress={() => {
                      setSelectedStoreId(store.id);
                      setFormError(null);
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: selected ? C.accent : C.border,
                        backgroundColor: selected ? C.accentTint : C.bg,
                      }}
                    >
                      <Ionicons
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={selected ? C.accent : C.muted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 15, fontWeight: "600", color: C.text }}
                          numberOfLines={1}
                        >
                          {store.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {store.mall_name}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}

            <Pressable
              disabled={confirmBusy || selectedStore === null}
              onPress={onConfirmPress}
              style={({ pressed }) => ({
                opacity:
                  pressed || confirmBusy || selectedStore === null ? 0.55 : 1,
              })}
            >
              <View
                style={{
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: C.accent,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {confirmBusy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                    >
                      确认核销
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="确认核销？"
        message={
          preview !== null && selectedStore !== null
            ? `将核销 ${formatRm(preview.amountMyr)}（码 ${preview.redemptionCode ?? "—"}）于「${selectedStore.name}」。此操作不可撤销。`
            : "确认核销此凭证？"
        }
        confirmLabel="确认核销"
        cancelLabel="取消"
        onConfirm={() => void onConfirmRedeem()}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

/**
 * Label / value row inside preview and success cards.
 */
function Row({
  label,
  value,
  emphasize,
}: Readonly<{
  label: string;
  value: string;
  emphasize?: boolean;
}>): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 13, color: C.muted }}>{label}</Text>
      <Text
        style={{
          flex: 1,
          textAlign: "right",
          fontSize: emphasize === true ? 20 : 14,
          fontWeight: emphasize === true ? "800" : "600",
          color: C.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Preview card showing redeemable vs blocked states without confirming.
 */
function PreviewCard({
  preview,
}: Readonly<{ preview: RedeemPreviewPayload }>): React.ReactElement {
  const badge = statusBadgeColors(preview.status);
  const blocked = preview.redeemable === false;
  const reason =
    preview.reasonMessage !== null && preview.reasonMessage.length > 0
      ? preview.reasonMessage
      : redeemReasonLabel(preview.reasonCode);

  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: blocked ? C.danger : C.border,
        padding: 16,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
          凭证预览
        </Text>
        <View
          style={{
            backgroundColor: badge.bg,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: badge.text }}>
            {badge.label}
          </Text>
        </View>
      </View>

      <Row label="金额" value={formatRm(preview.amountMyr)} emphasize />
      <Row
        label="折扣档"
        value={`${preview.approvedPercent.toLocaleString("zh-CN")}%`}
      />
      {preview.redemptionCode !== null ? (
        <Row label="兑换码" value={preview.redemptionCode} />
      ) : null}
      {preview.customerName !== null ? (
        <Row label="顾客" value={preview.customerName} />
      ) : null}
      {preview.productName !== null ? (
        <Row label="商品" value={preview.productName} />
      ) : null}
      <Row label="到期" value={formatDateTime(preview.expiresAt)} />
      {preview.redemptionChannel !== null ? (
        <Row
          label="渠道"
          value={
            preview.redemptionChannel === "in_store"
              ? "门店"
              : preview.redemptionChannel === "online"
                ? "线上"
                : preview.redemptionChannel
          }
        />
      ) : null}

      {blocked ? (
        <View
          style={{
            marginTop: 4,
            backgroundColor:
              preview.reasonCode === "CREDIT_USED" ? C.warnTint : C.dangerTint,
            borderRadius: 10,
            padding: 12,
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <Ionicons
            name={preview.reasonCode === "CREDIT_USED" ? "ban-outline" : "time-outline"}
            size={18}
            color={preview.reasonCode === "CREDIT_USED" ? C.warn : C.danger}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color:
                  preview.reasonCode === "CREDIT_USED" ? C.warn : C.danger,
              }}
            >
              {preview.reasonCode === "CREDIT_USED"
                ? "已核销"
                : preview.reasonCode === "CREDIT_EXPIRED"
                  ? "已过期"
                  : "不可核销"}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color:
                  preview.reasonCode === "CREDIT_USED" ? C.warn : C.danger,
                marginTop: 2,
                lineHeight: 18,
              }}
            >
              {reason}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={{
            marginTop: 4,
            backgroundColor: C.successTint,
            borderRadius: 10,
            padding: 12,
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={C.success} />
          <Text style={{ flex: 1, fontSize: 13, color: C.success, fontWeight: "600" }}>
            可核销 — 选择门店后确认
          </Text>
        </View>
      )}
    </View>
  );
}
