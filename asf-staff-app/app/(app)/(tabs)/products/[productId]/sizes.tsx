import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useProductSizeContext } from "@/context/product/ProductSizeContext";

const C = {
  bg: "#FAF9F6", panel: "#FFFFFF", border: "#E5E7EB",
  text: "#1A1A1A", muted: "#6B7280", accent: "#000000", danger: "#EF4444",
};

export default function ProductSizesScreen(): React.ReactElement {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();
  const { productSizes, createProductSize, deleteProductSize, loading } = useProductSizeContext();

  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sizes = useMemo(
    () => productSizes.filter((s) => s.product_id === productId),
    [productSizes, productId]
  );

  const handleAdd = async (): Promise<void> => {
    const v = input.trim();
    if (v.length === 0 || typeof productId !== "string") return;
    setSaving(true);
    await createProductSize({ product_id: productId, size: v });
    setInput("");
    setSaving(false);
  };

  const handleDelete = async (id: string): Promise<void> => {
    setDeletingId(id);
    await deleteProductSize(id);
    setDeletingId(null);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.panel, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="arrow-back" size={18} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>尺寸</Text>
      </View>

      {/* Add input */}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => void handleAdd()}
            placeholder="例: XS, S, M, L, XL, 均码…"
            placeholderTextColor={C.muted}
            returnKeyType="done"
            style={{ flex: 1, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text }}
          />
          <Pressable
            onPress={() => void handleAdd()}
            disabled={saving || input.trim().length === 0}
            style={{ backgroundColor: saving ? "#D1D5DB" : C.accent, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}
          >
            {saving ? <ActivityIndicator size="small" color={C.panel} /> : <Ionicons name="add" size={20} color={C.panel} />}
          </Pressable>
        </View>
      </View>

      {/* Size list */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={sizes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="resize-outline" size={36} color={C.border} />
              <Text style={{ color: C.muted, marginTop: 10, fontSize: 14 }}>暂无尺寸</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.panel, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.text }}>{item.size}</Text>
                </View>
                <Text style={{ fontSize: 14, color: C.text }}>{item.size}</Text>
              </View>
              <Pressable onPress={() => void handleDelete(item.id)} hitSlop={8} disabled={deletingId === item.id}>
                {deletingId === item.id
                  ? <ActivityIndicator size="small" color={C.danger} />
                  : <Ionicons name="trash-outline" size={18} color={C.danger} />}
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
