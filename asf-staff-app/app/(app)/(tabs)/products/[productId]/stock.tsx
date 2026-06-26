import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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

import { useProductContext } from "@/context/product/ProductContext";
import { useProductStockContext } from "@/context/product/ProductStockContext";

const C = {
  bg: "#FAF9F6", panel: "#FFFFFF", border: "#E5E7EB",
  text: "#1A1A1A", muted: "#6B7280", accent: "#000000",
  danger: "#EF4444", success: "#22C55E",
};

export default function ProductStockScreen(): React.ReactElement {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { products } = useProductContext();
  const { productStocks, createProductStock, updateProductStock, loading } = useProductStockContext();

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const stocks = useMemo(
    () => productStocks.filter((s) => s.product_id === productId),
    [productStocks, productId]
  );
  const totalStock = stocks.reduce((sum, s) => sum + (s.count ?? 0), 0);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [qtyText, setQtyText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddStock = async (): Promise<void> => {
    const qty = Number.parseInt(qtyText, 10);
    if (!Number.isFinite(qty) || qty <= 0 || typeof productId !== "string") return;
    setSaving(true);
    await createProductStock({ product_id: productId, count: qty });
    setQtyText("");
    setAddModalOpen(false);
    setSaving(false);
  };

  const handleAdjustStock = async (): Promise<void> => {
    const qty = Number.parseInt(qtyText, 10);
    if (!Number.isFinite(qty) || qty < 0 || stocks.length === 0 || typeof productId !== "string") return;
    const first = stocks[0];
    if (first === undefined) return;
    setSaving(true);
    await updateProductStock({ id: first.id, count: qty });
    setQtyText("");
    setAdjustModalOpen(false);
    setSaving(false);
  };

  const stockStatusColor = totalStock === 0 ? C.danger : totalStock < 5 ? "#D97706" : C.success;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>库存</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => { setQtyText(""); setAdjustModalOpen(true); }}
            style={{ borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>调整</Text>
          </Pressable>
          <Pressable
            onPress={() => { setQtyText(""); setAddModalOpen(true); }}
            style={{ backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="add" size={14} color={C.panel} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.panel }}>补货</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Summary Card */}
        <View style={{ backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 20, marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>库存总量</Text>
            <Text style={{ fontSize: 40, fontWeight: "800", color: stockStatusColor }}>{totalStock}</Text>
            <Text style={{ fontSize: 12, color: C.muted }}>{product?.name ?? ""}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${stockStatusColor}20`, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="layers-outline" size={26} color={stockStatusColor} />
            </View>
            <Text style={{ fontSize: 11, color: stockStatusColor, marginTop: 4, fontWeight: "600" }}>
              {totalStock === 0 ? "缺货" : totalStock < 5 ? "库存不足" : "库存充足"}
            </Text>
          </View>
        </View>

        {/* Stock Entries */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          库存记录 ({stocks.length})
        </Text>

        {loading ? (
          <ActivityIndicator color={C.accent} />
        ) : stocks.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="layers-outline" size={36} color={C.border} />
            <Text style={{ color: C.muted, marginTop: 10, fontSize: 14 }}>暂无库存记录</Text>
            <Pressable onPress={() => { setQtyText(""); setAddModalOpen(true); }} style={{ backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.panel }}>添加首条库存记录</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={stocks}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View style={{ backgroundColor: C.panel, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{`记录 #${index + 1}`}</Text>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>{item.count ?? 0}</Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>
                    {new Date(item.created_at).toLocaleDateString("zh-CN", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
                <View                   style={{ backgroundColor: (item.count ?? 0) > 0 ? "#DCFCE7" : "#FEE2E2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: (item.count ?? 0) > 0 ? "#15803D" : C.danger }}>
                    {(item.count ?? 0) > 0 ? "有货" : "无货"}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* Add Stock Modal */}
      <Modal visible={addModalOpen} transparent animationType="slide" onRequestClose={() => setAddModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setAddModalOpen(false)}>
            <Pressable style={{ backgroundColor: C.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>补货</Text>
                <Pressable onPress={() => setAddModalOpen(false)}><Ionicons name="close" size={20} color={C.muted} /></Pressable>
              </View>
              <Text style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>添加数量</Text>
              <TextInput
                value={qtyText}
                onChangeText={setQtyText}
                placeholder="例: 50"
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                autoFocus
                style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: C.text, marginBottom: 20 }}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setAddModalOpen(false)} style={{ flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: C.muted }}>取消</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleAddStock()}
                  disabled={saving || qtyText.trim().length === 0}
                  style={{ flex: 1, backgroundColor: saving ? "#D1D5DB" : C.accent, borderRadius: 8, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: C.panel }}>{saving ? "添加中…" : "补货"}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal visible={adjustModalOpen} transparent animationType="slide" onRequestClose={() => setAdjustModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setAdjustModalOpen(false)}>
            <Pressable style={{ backgroundColor: C.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>调整库存</Text>
                <Pressable onPress={() => setAdjustModalOpen(false)}><Ionicons name="close" size={20} color={C.muted} /></Pressable>
              </View>
              <Text style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                {`当前总库存: ${totalStock} 件。请输入第一条库存记录的新数量。`}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>新数量</Text>
              <TextInput
                value={qtyText}
                onChangeText={setQtyText}
                placeholder="例: 30"
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                autoFocus
                style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, color: C.text, marginBottom: 20 }}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setAdjustModalOpen(false)} style={{ flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: C.muted }}>取消</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleAdjustStock()}
                  disabled={saving || qtyText.trim().length === 0 || stocks.length === 0}
                  style={{ flex: 1, backgroundColor: saving ? "#D1D5DB" : C.accent, borderRadius: 8, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: C.panel }}>{saving ? "保存中…" : "确认"}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
