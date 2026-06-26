import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
  DateTimePickerModal,
  formatPickerDate,
} from "@/components/DateTimePickerModal";
import { usePromotionContext } from "@/context/PromotionContext";
import { useProductContext } from "@/context/product/ProductContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F2F2F7",
  panel: "#FFFFFF",
  border: "#D1D5DB",
  text: "#1C1C1E",
  muted: "#8E8E93",
  accent: "#000000",
  danger: "#EF4444",
} as const;

type DiscountType = "percentage" | "fixed";

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
          {/* Header */}
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

          {/* Search */}
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
export default function PromotionCreateScreen(): React.ReactElement {
  const router = useRouter();
  const { createPromotion } = usePromotionContext();
  const { products } = useProductContext();

  // Form state
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

  const [saving, setSaving] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  const toggleProduct = (id: string): void => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async (): Promise<void> => {
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
      const created = await createPromotion({
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
      if (created === undefined) {
        Alert.alert("错误", "无法创建促销，促销代码可能已被使用。");
        return;
      }
      router.replace(`/(app)/promotions/${created.id}` as never);
    } catch (err: unknown) {
      Alert.alert("错误", err instanceof Error ? err.message : "操作失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

  const selectedProductNames = useMemo(() => {
    if (selectedProductIds.size === 0) return "全部商品";
    const names = products
      .filter((p) => selectedProductIds.has(p.id))
      .map((p) => p.name);
    if (names.length <= 2) return names.join("、");
    return `${names[0]}、${names[1]} 等${names.length - 2}件`;
  }, [selectedProductIds, products]);

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text, flex: 1 }}>
          新建促销
        </Text>
        <Pressable onPress={() => void handleCreate()} disabled={saving}>
          <View
            style={{
              backgroundColor: saving ? "#D1D5DB" : C.accent,
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 8,
              minWidth: 70,
              alignItems: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                创建
              </Text>
            )}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 60 }}>

          {/* ── Basic Info ── */}
          <SectionLabel text="基本信息" />
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
            <FieldRow label="名称" first>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="例: 夏日特惠"
                placeholderTextColor={C.muted}
                style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
              />
            </FieldRow>
            <FieldRow label="促销代码">
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                placeholder="例: SUMMER20（可选）"
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
                placeholder="仅供员工参考的可选说明…"
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
            {/* Type toggle */}
            <View
              style={{
                backgroundColor: C.panel,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 15, color: C.text, marginBottom: 10 }}>类型</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["percentage", "fixed"] as DiscountType[]).map((dt) => {
                  const active_dt = discountType === dt;
                  return (
                    <Pressable
                      key={dt}
                      onPress={() => setDiscountType(dt)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: active_dt ? C.accent : C.border,
                        backgroundColor: active_dt ? C.accent : C.panel,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: active_dt ? "#FFFFFF" : C.text,
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
                placeholder={discountType === "percentage" ? "例: 10" : "例: 5.00"}
                placeholderTextColor={C.muted}
                keyboardType="decimal-pad"
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
            <Pressable onPress={() => setProductPickerOpen(true)}>
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
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </View>
            </Pressable>
          </View>

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
