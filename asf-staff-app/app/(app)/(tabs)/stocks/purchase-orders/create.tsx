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

import { useProductPurchaseOrderContext } from "@/context/product/ProductPurchaseOrderContext";
import { useProductContext, type Product } from "@/context/product/ProductContext";
import { useProductColorContext } from "@/context/product/ProductColorContext";
import { useProductSizeContext } from "@/context/product/ProductSizeContext";
import { C, PO_STATUSES } from "../_lib/stockTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
type PoStatus = (typeof PO_STATUSES)[number];

interface EntryRow {
  /** Local id for list key */
  localId: string;
  colorId: string;
  sizeId: string;
  quantity: string;
  unitPrice: string;
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
      <Text style={{ fontSize: 15, color: C.text, minWidth: 100, flexShrink: 0 }}>
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
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
            选择商品
            </Text>
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

// ─── Entry Row ────────────────────────────────────────────────────────────────
interface EntryRowCardProps {
  entry: EntryRow;
  colorName: string;
  sizeName: string;
  onRemove: () => void;
  onChangeQty: (val: string) => void;
  onChangePrice: (val: string) => void;
}

function EntryRowCard({
  entry,
  colorName,
  sizeName,
  onRemove,
  onChangeQty,
  onChangePrice,
}: Readonly<EntryRowCardProps>): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: C.panel,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
          {colorName} — {sizeName}
        </Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={C.danger} />
        </Pressable>
      </View>
      {/* Inputs */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>数量</Text>
          <TextInput
            value={entry.quantity}
            onChangeText={onChangeQty}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={C.muted}
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 15,
              color: C.text,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>单价 (RM)</Text>
          <TextInput
            value={entry.unitPrice}
            onChangeText={onChangePrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={C.muted}
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 15,
              color: C.text,
            }}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Add Entry Modal ──────────────────────────────────────────────────────────
interface AddEntryModalProps {
  visible: boolean;
  productId: string;
  onAdd: (colorId: string, sizeId: string) => void;
  onDismiss: () => void;
}

function AddEntryModal({
  visible,
  productId,
  onAdd,
  onDismiss,
}: Readonly<AddEntryModalProps>): React.ReactElement {
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  const colors = useMemo(
    () => productColors.filter((c) => c.product_id === productId),
    [productColors, productId]
  );
  const sizes = useMemo(
    () => productSizes.filter((s) => s.product_id === productId),
    [productSizes, productId]
  );

  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");

  /** Require selection only when the product actually has options */
  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const canAdd = (hasColors ? colorId.length > 0 : true) && (hasSizes ? sizeId.length > 0 : true);

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
            paddingBottom: 40,
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
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>
              添加条目
            </Text>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <Ionicons name="close" size={22} color={C.muted} />
            </Pressable>
          </View>

          <ScrollView style={{ padding: 16 }}>
            {/* Colour */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>
              颜色
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {colors.length === 0 ? (
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: C.border,
                    backgroundColor: "#F3F4F6",
                  }}
                >
          <Text style={{ fontSize: 13, color: C.muted }}>无颜色 — 将被跳过</Text>
                </View>
              ) : (
                colors.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setColorId(c.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: colorId === c.id ? C.accent : C.border,
                      backgroundColor: colorId === c.id ? C.accent : C.panel,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colorId === c.id ? "#FFFFFF" : C.text,
                      }}
                    >
                      {c.color}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            {/* Size */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>
              尺寸
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {sizes.length === 0 ? (
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: C.border,
                    backgroundColor: "#F3F4F6",
                  }}
                >
                  <Text style={{ fontSize: 13, color: C.muted }}>无尺寸 — 将被跳过</Text>
                </View>
              ) : (
                sizes.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSizeId(s.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: sizeId === s.id ? C.accent : C.border,
                      backgroundColor: sizeId === s.id ? C.accent : C.panel,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: sizeId === s.id ? "#FFFFFF" : C.text,
                      }}
                    >
                      {s.size}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <Pressable
              onPress={() => {
                if (canAdd) {
                  onAdd(colorId, sizeId);
                  setColorId("");
                  setSizeId("");
                  onDismiss();
                }
              }}
              disabled={!canAdd}
            >
              <View
                style={{
                  backgroundColor: canAdd ? C.accent : "#E5E7EB",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: canAdd ? "#FFFFFF" : C.muted,
                  }}
                >
                  添加条目
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PurchaseOrderCreateScreen(): React.ReactElement {
  const router = useRouter();
  const { createProductPurchaseOrder } = useProductPurchaseOrderContext();
  const { products } = useProductContext();
  const { productColors } = useProductColorContext();
  const { productSizes } = useProductSizeContext();

  // Header fields
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [poNo, setPoNo] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [brand, setBrand] = useState("");
  const [salesmanNo, setSalesmanNo] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [shippingDate, setShippingDate] = useState("");
  const [cancelDate, setCancelDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [terms, setTerms] = useState("");
  const [status, setStatus] = useState<PoStatus>("pending");

  // Entries
  const [entries, setEntries] = useState<EntryRow[]>([]);

  // Modal states
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const canCreate = selectedProduct !== null;

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

  const handleAddEntry = (colorId: string, sizeId: string): void => {
    setEntries((prev) => [
      ...prev,
      {
        localId: `${colorId || "no-color"}-${sizeId || "no-size"}-${Date.now()}`,
        colorId,
        sizeId,
        quantity: "",
        unitPrice: "",
      },
    ]);
  };

  const handleRemoveEntry = (localId: string): void => {
    setEntries((prev) => prev.filter((e) => e.localId !== localId));
  };

  const handleUpdateEntryQty = (localId: string, val: string): void => {
    setEntries((prev) =>
      prev.map((e) => (e.localId === localId ? { ...e, quantity: val } : e))
    );
  };

  const handleUpdateEntryPrice = (localId: string, val: string): void => {
    setEntries((prev) =>
      prev.map((e) => (e.localId === localId ? { ...e, unitPrice: val } : e))
    );
  };

  const handleCreate = async (): Promise<void> => {
    if (selectedProduct === null) {
      Alert.alert("验证", "请先选择商品。");
      return;
    }
    setSaving(true);
    try {
      const header = {
        product_id: selectedProduct.id,
        product_event: selectedProduct.id,
        purchase_order_no: poNo.trim().length > 0 ? poNo.trim() : null,
        order_no: orderNo.trim().length > 0 ? orderNo.trim() : null,
        brand: brand.trim().length > 0 ? brand.trim() : null,
        salesman_no: salesmanNo.trim().length > 0 ? salesmanNo.trim() : null,
        order_date: orderDate.trim().length > 0 ? orderDate.trim() : null,
        delivery_date: deliveryDate.trim().length > 0 ? deliveryDate.trim() : null,
        shipping_date: shippingDate.trim().length > 0 ? shippingDate.trim() : null,
        cancel_date: cancelDate.trim().length > 0 ? cancelDate.trim() : null,
        delivery_address: deliveryAddress.trim().length > 0 ? deliveryAddress.trim() : null,
        terms: terms.trim().length > 0 ? Number.parseInt(terms.trim(), 10) : null,
        status,
      };

      const entryPayloads = entries.map((e) => ({
        color_id: e.colorId.length > 0 ? e.colorId : null,
        sizes: [
          {
            size: e.sizeId.length > 0 ? e.sizeId : null,
            quantity: Number.parseInt(e.quantity, 10) || 0,
          },
        ],
        unit_price: Number.parseFloat(e.unitPrice) || 0,
      }));

      const created = await createProductPurchaseOrder(header, entryPayloads);
      if (created !== undefined) {
        router.replace(
          `/(app)/(tabs)/stocks/purchase-orders/${created.id}` as never
        );
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
          新建采购单
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

        {/* ── Order Details ── */}
        <SectionLabel text="订单详情" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          <FieldRow label="采购单号" first>
            <TextInput
              value={poNo}
              onChangeText={setPoNo}
              placeholder="e.g. PO-2026-001"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="订单编号">
            <TextInput
              value={orderNo}
              onChangeText={setOrderNo}
              placeholder="内部订单编号"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="品牌">
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="供应商品牌"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="业务员编号">
            <TextInput
              value={salesmanNo}
              onChangeText={setSalesmanNo}
              placeholder="业务员ID"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="下单日期">
            <TextInput
              value={orderDate}
              onChangeText={setOrderDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="送货日期">
            <TextInput
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="发货日期">
            <TextInput
              value={shippingDate}
              onChangeText={setShippingDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="截止日期">
            <TextInput
              value={cancelDate}
              onChangeText={setCancelDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="付款期限 (天)">
            <TextInput
              value={terms}
              onChangeText={setTerms}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={C.muted}
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
          <FieldRow label="收货地址">
            <TextInput
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="完整收货地址"
              placeholderTextColor={C.muted}
              multiline
              style={{ flex: 1, fontSize: 15, color: C.text, textAlign: "right" }}
            />
          </FieldRow>
        </View>

        {/* ── Status ── */}
        <SectionLabel text="状态" />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          {PO_STATUSES.map((s, idx) => (
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
              <Text style={{ fontSize: 15, color: status === s ? C.accent : C.text, fontWeight: status === s ? "600" : "400" }}>
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

        {/* ── Entries ── */}
        <SectionLabel text={entries.length > 0 ? `条目 · ${entries.length}` : "条目"} />
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border }}>
          {entries.map((entry) => (
            <EntryRowCard
              key={entry.localId}
              entry={entry}
              colorName={colorNameMap.get(entry.colorId) ?? (entry.colorId.length === 0 ? "无颜色" : entry.colorId)}
              sizeName={sizeNameMap.get(entry.sizeId) ?? (entry.sizeId.length === 0 ? "无尺寸" : entry.sizeId)}
              onRemove={() => handleRemoveEntry(entry.localId)}
              onChangeQty={(val) => handleUpdateEntryQty(entry.localId, val)}
              onChangePrice={(val) => handleUpdateEntryPrice(entry.localId, val)}
            />
          ))}

          {/* Add entry button */}
          <Pressable
            onPress={() => {
              if (selectedProduct === null) {
                Alert.alert("选择商品", "请先选择商品。");
                return;
              }
              setAddEntryOpen(true);
            }}
          >
            <View
              style={{
                backgroundColor: C.panel,
                borderTopWidth: entries.length > 0 ? 1 : 0,
                borderTopColor: C.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={C.accent} />
              <Text style={{ fontSize: 15, color: C.accent, fontWeight: "600" }}>
                添加条目
              </Text>
            </View>
          </Pressable>

          {entries.length === 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
              <Text style={{ fontSize: 13, color: C.muted }}>
                暂无条目，点击上方添加颜色/尺寸行。
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modals ── */}
      <ProductPickerModal
        visible={productPickerOpen}
        products={products}
        onSelect={(p) => {
          setSelectedProduct(p);
          setEntries([]);
          setProductPickerOpen(false);
        }}
        onDismiss={() => setProductPickerOpen(false)}
      />

      {selectedProduct !== null && (
        <AddEntryModal
          visible={addEntryOpen}
          productId={selectedProduct.id}
          onAdd={handleAddEntry}
          onDismiss={() => setAddEntryOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
