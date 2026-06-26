import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  usePromotionContext,
  type Promotion,
} from "@/context/PromotionContext";
import { useProductContext } from "@/context/product/ProductContext";
import { apiFetch } from "@/lib/apiFetch";
import {
  DateTimePickerModal,
  formatPickerDate,
} from "@/components/DateTimePickerModal";

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

type DiscountType = "percentage" | "fixed";
type PromoStatus = "生效中" | "已排期" | "已过期" | "未激活";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function promoStatusLabel(p: Promotion): PromoStatus {
  if (!p.active) return "未激活";
  const now = Date.now();
  if (p.start_date !== null && p.start_date.length > 0) {
    const start = new Date(p.start_date).getTime();
    if (Number.isFinite(start) && now < start) return "已排期";
  }
  if (p.end_date !== null && p.end_date.length > 0) {
    const end = new Date(p.end_date).getTime();
    if (Number.isFinite(end) && now > end) return "已过期";
  }
  return "生效中";
}

function statusBadge(label: PromoStatus): { bg: string; color: string } {
  switch (label) {
    case "生效中":
      return { bg: "#D1FAE5", color: "#059669" };
    case "已排期":
      return { bg: "#FEF3C7", color: "#D97706" };
    case "已过期":
      return { bg: "#FEE2E2", color: "#DC2626" };
    default:
      return { bg: "#F3F4F6", color: "#4B5563" };
  }
}

/** Normalises a date to minute-precision string for dirty checking. */
function normDate(d: Date | null): string {
  if (d === null) return "";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${Math.floor(d.getMinutes() / 5) * 5}`;
}

/** Parses an ISO string to a Date, rounding minutes to nearest 5 for picker compatibility. */
function isoToPickerDate(iso: string | null): Date | null {
  if (iso === null || iso.length === 0) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0);
  return d;
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

interface FieldRowProps {
  label: string;
  first?: boolean;
  children: React.ReactNode;
}

function FieldRow({
  label,
  first = false,
  children,
}: Readonly<FieldRowProps>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 15, color: C.text, minWidth: 110, flexShrink: 0 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

// ─── Date Picker Row ──────────────────────────────────────────────────────────
interface DatePickerRowProps {
  label: string;
  value: Date | null;
  first?: boolean;
  onPress: () => void;
}

function DatePickerRow({
  label,
  value,
  first = false,
  onPress,
}: Readonly<DatePickerRowProps>): React.ReactElement {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          backgroundColor: C.panel,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 15, color: C.text, minWidth: 90, flexShrink: 0 }}>
          {label}
        </Text>
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            color: value === null ? C.muted : C.text,
            textAlign: "right",
          }}
          numberOfLines={1}
        >
          {value === null ? "未设置" : formatPickerDate(value)}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={C.muted} />
      </View>
    </Pressable>
  );
}

// ─── Product Picker Modal ─────────────────────────────────────────────────────
interface ProductPickerModalProps {
  visible: boolean;
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onDismiss: () => void;
}

function ProductPickerModal({
  visible,
  selectedIds,
  onToggle,
  onDismiss,
}: Readonly<ProductPickerModalProps>): React.ReactElement {
  const { products } = useProductContext();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const active = products.filter((p) => {
      const deleted = (p as Record<string, unknown>)["deleted_at"];
      return deleted === null || deleted === undefined;
    });
    if (q.trim().length === 0) return active;
    const lower = q.toLowerCase();
    return active.filter((p) => p.name.toLowerCase().includes(lower));
  }, [products, q]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={onDismiss}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: C.panel,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "75%",
            paddingBottom: 36,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
                选择商品
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                不选则适用于全部商品
              </Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <Ionicons name="close" size={22} color={C.muted} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <View
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <Ionicons name="search-outline" size={15} color={C.muted} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="搜索商品…"
                placeholderTextColor={C.muted}
                style={{ flex: 1, fontSize: 14, color: C.text, paddingVertical: 8 }}
              />
            </View>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = selectedIds.has(item.id);
              return (
                <Pressable onPress={() => onToggle(item.id)}>
                  <View
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: C.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: selected ? C.accent : C.text,
                        fontWeight: selected ? "600" : "400",
                        flex: 1,
                      }}
                    >
                      {item.name}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={20} color={C.accent} />
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PromotionEditScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { promotions, updatePromotion, deletePromotion } = usePromotionContext();
  const { products } = useProductContext();

  const promotion = useMemo(
    () => promotions.find((p) => p.id === id) ?? null,
    [promotions, id]
  );

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [maxUses, setMaxUses] = useState("");
  const [active, setActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const [loadingProductIds, setLoadingProductIds] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  /** Seed form fields from the promotion once available */
  useEffect(() => {
    if (promotion === null) return;
    setName(promotion.name);
    setDescription(promotion.description ?? "");
    setCode(promotion.code ?? "");
    setDiscountType(promotion.discount_type === "fixed" ? "fixed" : "percentage");
    setDiscountValue(String(promotion.discount_value));
    setStartDate(isoToPickerDate(promotion.start_date));
    setEndDate(isoToPickerDate(promotion.end_date));
    setMaxUses(promotion.max_uses === null ? "" : String(promotion.max_uses));
    setActive(promotion.active);
  }, [promotion]);

  /** Fetch the linked product IDs from the API (not in the bulk list payload) */
  useEffect(() => {
    if (id === undefined || id.length === 0) return;
    setLoadingProductIds(true);
    apiFetch(`/api/promotions/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (typeof json !== "object" || json === null) return;
        const rec = json as Record<string, unknown>;
        const pids = rec["productIds"];
        if (!Array.isArray(pids)) return;
        const ids = new Set<string>();
        for (const x of pids) {
          if (typeof x === "string") ids.add(x);
        }
        setSelectedProductIds(ids);
      })
      .catch(() => { /* silently ignore */ })
      .finally(() => setLoadingProductIds(false));
  }, [id]);

  const isDirty = useMemo(() => {
    if (promotion === null) return false;
    return (
      name !== promotion.name ||
      description !== (promotion.description ?? "") ||
      code !== (promotion.code ?? "") ||
      discountType !== (promotion.discount_type === "fixed" ? "fixed" : "percentage") ||
      discountValue !== String(promotion.discount_value) ||
      normDate(startDate) !== normDate(isoToPickerDate(promotion.start_date)) ||
      normDate(endDate) !== normDate(isoToPickerDate(promotion.end_date)) ||
      maxUses !== (promotion.max_uses === null ? "" : String(promotion.max_uses)) ||
      active !== promotion.active
    );
  }, [promotion, name, description, code, discountType, discountValue, startDate, endDate, maxUses, active]);

  const toggleProduct = (pid: string): void => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  const handleSave = useCallback(async (): Promise<void> => {
    if (id === undefined || promotion === null) return;
    if (name.trim().length === 0) {
      Alert.alert("验证", "请输入促销名称。");
      return;
    }
    const dv = Number.parseFloat(discountValue);
    if (!Number.isFinite(dv) || dv < 0) {
      Alert.alert("验证", "请输入有效的折扣值。");
      return;
    }
    if (discountType === "percentage" && dv > 100) {
      Alert.alert("验证", "百分比折扣不能超过 100。");
      return;
    }
    let maxUsesVal: number | null = null;
    if (maxUses.trim().length > 0) {
      const m = Number.parseInt(maxUses, 10);
      if (!Number.isInteger(m) || m <= 0) {
        Alert.alert("验证", "最大使用次数必须为正整数。");
        return;
      }
      maxUsesVal = m;
    }
    setSaving(true);
    try {
      const updated = await updatePromotion(id, {
        name: name.trim(),
        description: description.trim().length > 0 ? description.trim() : null,
        code: code.trim().length > 0 ? code.trim().toUpperCase() : null,
        discount_type: discountType,
        discount_value: dv,
        start_date: startDate === null ? null : startDate.toISOString(),
        end_date: endDate === null ? null : endDate.toISOString(),
        active,
        max_uses: maxUsesVal,
        product_ids: Array.from(selectedProductIds),
      });
      if (updated === undefined) {
        Alert.alert("错误", "无法保存更改。");
      }
    } finally {
      setSaving(false);
    }
  }, [id, promotion, name, description, code, discountType, discountValue, startDate, endDate, active, maxUses, selectedProductIds, updatePromotion]);

  const handleDelete = useCallback((): void => {
    if (id === undefined) return;
    Alert.alert(
      "删除促销",
      "此操作将停用该促销，新订单将不再享受此优惠。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            setDeleting(true);
            void deletePromotion(id).finally(() => {
              setDeleting(false);
              router.back();
            });
          },
        },
      ]
    );
  }, [id, deletePromotion, router]);

  if (promotion === null) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = promoStatusLabel(promotion);
  const badge = statusBadge(statusLabel);
  const selectedProductNames = (() => {
    if (selectedProductIds.size === 0) return "全部商品";
    const names = products.filter((p) => selectedProductIds.has(p.id)).map((p) => p.name);
    if (names.length <= 2) return names.join("、");
    return `${names[0]}、${names[1]} 等${names.length - 2}件`;
  })();

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
        <Text
          style={{ fontSize: 17, fontWeight: "600", color: C.text, flex: 1 }}
          numberOfLines={1}
        >
          {promotion.name}
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
          gap: 10,
        }}
      >
        <View
          style={{
            backgroundColor: badge.bg,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: badge.color }}>
            {statusLabel}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: C.muted }}>
          已使用 {promotion.uses_count} 次
          {promotion.max_uses === null ? "" : ` / 最多 ${promotion.max_uses} 次`}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          <SectionLabel text="基本信息" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <FieldRow label="名称" first>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholderTextColor={C.muted}
                style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
              />
            </FieldRow>
            <FieldRow label="促销代码">
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                placeholder="无"
                placeholderTextColor={C.muted}
                autoCapitalize="characters"
                style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
              />
            </FieldRow>
          </View>

          <SectionLabel text="描述" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <View style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 12 }}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="可选说明…"
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={3}
                style={{
                  fontSize: 15,
                  color: C.text,
                  minHeight: 72,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </View>

          <SectionLabel text="折扣" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <View style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ fontSize: 15, color: C.text, marginBottom: 10 }}>类型</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["percentage", "fixed"] as DiscountType[]).map((dt) => {
                  const activeType = discountType === dt;
                  return (
                    <Pressable
                      key={dt}
                      onPress={() => setDiscountType(dt)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: activeType ? C.accent : C.border,
                        backgroundColor: activeType ? C.accent : C.panel,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: activeType ? "#FFFFFF" : C.text,
                        }}
                      >
                        {dt === "percentage" ? "百分比 %" : "固定金额 RM"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <FieldRow label={discountType === "percentage" ? "折扣值 (%)" : "折扣值 (RM)"}>
              <TextInput
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="decimal-pad"
                placeholderTextColor={C.muted}
                style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
              />
            </FieldRow>
          </View>

          <SectionLabel text="排期" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <DatePickerRow
              label="开始日期"
              value={startDate}
              first
              onPress={() => setStartPickerOpen(true)}
            />
            <DatePickerRow
              label="结束日期"
              value={endDate}
              onPress={() => setEndPickerOpen(true)}
            />
          </View>

          <SectionLabel text="设置" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <FieldRow label="激活" first>
              <Switch
                value={active}
                onValueChange={setActive}
                trackColor={{ false: "#D1D5DB", true: "#000000" }}
                thumbColor="#FFFFFF"
              />
            </FieldRow>
            <FieldRow label="最大使用次数">
              <TextInput
                value={maxUses}
                onChangeText={setMaxUses}
                placeholder="不限"
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
              />
            </FieldRow>
          </View>

          <SectionLabel text="适用商品" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <Pressable
              onPress={() => setProductPickerOpen(true)}
              disabled={loadingProductIds}
            >
              <View
                style={{
                  backgroundColor: C.panel,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 15, color: C.text, flexShrink: 0, minWidth: 80 }}>
                  商品
                </Text>
                {loadingProductIds ? (
                  <ActivityIndicator size="small" color={C.muted} />
                ) : (
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: selectedProductIds.size === 0 ? C.muted : C.text,
                      textAlign: "right",
                    }}
                    numberOfLines={1}
                  >
                    {selectedProductNames}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </View>
            </Pressable>
          </View>

          <SectionLabel text="信息" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <View style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 13 }}>
              <Text style={{ fontSize: 12, color: C.muted }}>促销ID</Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{promotion.id}</Text>
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
                {new Date(promotion.created_at).toLocaleDateString("zh-CN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

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
                    删除促销
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <ProductPickerModal
        visible={productPickerOpen}
        selectedIds={selectedProductIds}
        onToggle={toggleProduct}
        onDismiss={() => setProductPickerOpen(false)}
      />

      <DateTimePickerModal
        visible={startPickerOpen}
        initial={startDate}
        title="开始日期"
        confirmLabel="设置开始日期"
        warnPast={false}
        onConfirm={(d) => { setStartDate(d); setStartPickerOpen(false); }}
        onClear={() => { setStartDate(null); setStartPickerOpen(false); }}
        onDismiss={() => setStartPickerOpen(false)}
      />
      <DateTimePickerModal
        visible={endPickerOpen}
        initial={endDate}
        title="结束日期"
        confirmLabel="设置结束日期"
        warnPast={false}
        onConfirm={(d) => { setEndDate(d); setEndPickerOpen(false); }}
        onClear={() => { setEndDate(null); setEndPickerOpen(false); }}
        onDismiss={() => setEndPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
