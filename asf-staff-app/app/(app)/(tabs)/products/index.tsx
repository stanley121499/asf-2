import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useProductContext } from "@/context/product/ProductContext";
import { useProductMediaContext } from "@/context/product/ProductMediaContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F5F3",
  panel: "#FFFFFF",
  border: "#E5E5E3",
  text: "#0A0A0A",
  muted: "#6B7280",
  accent: "#C9A96E",
  danger: "#E8453C",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusFilter = "all" | "PUBLISH" | "DRAFT" | "UNPUBLISHED";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "全部", value: "all" },
  { label: "已发布", value: "PUBLISH" },
  { label: "草稿", value: "DRAFT" },
  { label: "未发布", value: "UNPUBLISHED" },
];

function statusBadge(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case "PUBLISH":
      return { bg: "#D1FAE5", color: "#059669", label: "已发布" };
    case "DRAFT":
      return { bg: "#FDFBF7", color: "#C9A96E", label: "草稿" };
    case "UNPUBLISHED":
      return { bg: "#FEE2E2", color: "#DC2626", label: "未发布" };
    default:
      return { bg: "#F3F4F6", color: "#4B5563", label: status };
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductsListScreen(): React.ReactElement {
  const router = useRouter();
  const { products, loading, deleteProduct } = useProductContext();
  const { productMedias } = useProductMediaContext();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** First media URL per product. */
  const thumbMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of productMedias) {
      if (!map.has(m.product_id) && typeof m.media_url === "string") {
        map.set(m.product_id, m.media_url);
      }
    }
    return map;
  }, [productMedias]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q.length === 0) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [products, query, statusFilter]);

  const handleDelete = async (): Promise<void> => {
    if (deleteTarget === null) return;
    setDeleting(true);
    await deleteProduct(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.text }}>
          商品
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/products/create")}
          style={{
            backgroundColor: C.accent,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="add" size={16} color={C.panel} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: C.panel }}>
            新建商品
          </Text>
        </Pressable>
      </View>

      {/* ── Search + Filter ─────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: C.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.panel,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 12,
            marginBottom: 10,
          }}
        >
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜索商品…"
            placeholderTextColor={C.muted}
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: C.text }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          {STATUS_FILTERS.map((f) => {
            const active = f.value === statusFilter;
            return (
              <Pressable
                key={f.value}
                onPress={() => setStatusFilter(f.value)}
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: active ? C.accent : C.border,
                  backgroundColor: active ? C.accent : C.panel,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "500", color: active ? C.panel : C.text }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Product Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 10 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Ionicons name="cube-outline" size={40} color={C.border} />
              <Text style={{ color: C.muted, marginTop: 12, fontSize: 14 }}>
                暂无商品
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const thumb = thumbMap.get(item.id);
            const badge = statusBadge(item.status);
            return (
              <Pressable
                onPress={() => router.push(`/(app)/(tabs)/products/${item.id}`)}
                onLongPress={() => setDeleteTarget({ id: item.id, name: item.name })}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: C.panel,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  overflow: "hidden",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                {/* Thumbnail */}
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 1,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {thumb !== undefined ? (
                    <Image
                      source={{ uri: thumb }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="image-outline" size={32} color={C.border} />
                  )}
                </View>

                {/* Info */}
                <View style={{ padding: 10 }}>
                  <View
                    style={{
                      backgroundColor: badge.bg,
                      borderRadius: 20,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      alignSelf: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "600", color: badge.color }}>
                      {badge.label}
                    </Text>
                  </View>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 2 }}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: C.muted }}>
                    {`RM ${typeof item.price === "number" ? item.price.toFixed(2) : "0.00"}`}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: C.panel,
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 360,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 8 }}>
              删除商品？
            </Text>
            <Text style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
              {`"${deleteTarget?.name ?? ""}" 将被移入回收站，可在删除列表中恢复。`}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setDeleteTarget(null)}
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
                onPress={() => void handleDelete()}
                disabled={deleting}
                style={{
                  flex: 1,
                  backgroundColor: C.danger,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: C.panel }}>
                  {deleting ? "删除中…" : "删除"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
