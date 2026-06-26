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
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useProductReportContext } from "@/context/product/ProductReportContext";
import { useProductContext, type Product } from "@/context/product/ProductContext";
import { C, REPORT_STATUSES } from "../_lib/stockTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportStatus = (typeof REPORT_STATUSES)[number];

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

function FieldRow({ label, first = false, children }: Readonly<FieldRowProps>): React.ReactElement {
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

// ─── Product Picker Modal ─────────────────────────────────────────────────────
interface ProductPickerModalProps {
  visible: boolean;
  products: ReadonlyArray<Product>;
  onSelect: (product: Product) => void;
  onDismiss: () => void;
}

function ProductPickerModal({
  visible,
  products,
  onSelect,
  onDismiss,
}: Readonly<ProductPickerModalProps>): React.ReactElement {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (q.trim().length === 0) return products;
    const lower = q.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(lower));
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
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
            选择商品
            </Text>
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
                autoFocus
                style={{ flex: 1, fontSize: 14, color: C.text, paddingVertical: 8 }}
              />
            </View>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  setQ("");
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: C.border,
                  }}
                >
                  <Text style={{ fontSize: 15, color: C.text }}>{item.name}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StockReportCreateScreen(): React.ReactElement {
  const router = useRouter();
  const { createProductReport } = useProductReportContext();
  const { products } = useProductContext();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [personInCharge, setPersonInCharge] = useState("");
  const [reason, setReason] = useState("");
  const [ocName, setOcName] = useState("");
  const [ocDepartment, setOcDepartment] = useState("");

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const canCreate = selectedProduct !== null;

  const handleCreate = async (): Promise<void> => {
    if (selectedProduct === null) {
      Alert.alert("验证", "请先选择商品。");
      return;
    }
    setSaving(true);
    try {
      const created = await createProductReport({
        product_id: selectedProduct.id,
        product_event: selectedProduct.id,
        status,
        company: company.trim().length > 0 ? company.trim() : null,
        department: department.trim().length > 0 ? department.trim() : null,
        person_in_charge: personInCharge.trim().length > 0 ? personInCharge.trim() : null,
        reason: reason.trim().length > 0 ? reason.trim() : null,
        oc_name: ocName.trim().length > 0 ? ocName.trim() : null,
        oc_department: ocDepartment.trim().length > 0 ? ocDepartment.trim() : null,
      });

      if (created !== undefined) {
        router.replace(`/(app)/(tabs)/stocks/reports/${created.id}` as never);
      }
    } catch (err: unknown) {
      Alert.alert("错误", err instanceof Error ? err.message : "操作失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  };

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
          新建报告
        </Text>
        <Pressable onPress={() => void handleCreate()} disabled={!canCreate || saving}>
          <View
            style={{
              backgroundColor: canCreate ? C.accent : "#E5E7EB",
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
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: canCreate ? "#FFFFFF" : C.muted,
                }}
              >
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
        {/* ── Product ── */}
        <SectionLabel text="商品" />
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
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: selectedProduct === null ? C.muted : C.text,
                  flex: 1,
                }}
              >
                {selectedProduct === null ? "选择商品…" : selectedProduct.name}
              </Text>
              <Ionicons name="chevron-down" size={16} color={C.muted} />
            </View>
          </Pressable>
        </View>

        {/* ── Status ── */}
        <SectionLabel text="状态" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          {REPORT_STATUSES.map((s, idx) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              style={{
                backgroundColor: C.panel,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: C.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: status === s ? "600" : "400",
                  color: status === s ? C.accent : C.text,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
              {status === s ? (
                <Ionicons name="checkmark-circle" size={20} color={C.accent} />
              ) : (
                <Ionicons name="ellipse-outline" size={20} color={C.border} />
              )}
            </Pressable>
          ))}
        </View>

        {/* ── Organisation ── */}
        <SectionLabel text="机构信息" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <FieldRow label="公司" first>
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder="公司名称"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="部门">
            <TextInput
              value={department}
              onChangeText={setDepartment}
              placeholder="部门"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="负责人">
            <TextInput
              value={personInCharge}
              onChangeText={setPersonInCharge}
              placeholder="全名"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
        </View>

        {/* ── OC Info ── */}
        <SectionLabel text="OC信息" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <FieldRow label="OC姓名" first>
            <TextInput
              value={ocName}
              onChangeText={setOcName}
              placeholder="OC全名"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="OC部门">
            <TextInput
              value={ocDepartment}
              onChangeText={setOcDepartment}
              placeholder="OC部门"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
        </View>

        {/* ── Reason ── */}
        <SectionLabel text="原因" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <View style={{ backgroundColor: C.panel, paddingHorizontal: 16, paddingVertical: 12 }}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="说明此次报告的原因…"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={4}
              style={{
                fontSize: 15,
                color: C.text,
                minHeight: 88,
                textAlignVertical: "top",
              }}
            />
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Product Picker Modal ── */}
      <ProductPickerModal
        visible={productPickerOpen}
        products={products}
        onSelect={(p) => {
          setSelectedProduct(p);
          setProductPickerOpen(false);
        }}
        onDismiss={() => setProductPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
