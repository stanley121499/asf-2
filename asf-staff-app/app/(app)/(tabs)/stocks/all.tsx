import { useRouter } from "expo-router";
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

import { useProductStockContext } from "@/context/product/ProductStockContext";
import { useProductContext } from "@/context/product/ProductContext";
import { C, stockCountColor } from "./_lib/stockTokens";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StockRow {
  productId: string;
  productName: string;
  totalUnits: number;
  skuCount: number;
  lowestCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Derives a user-facing label for the overall stock health of a product. */
function stockLabel(lowestCount: number): { text: string; color: string } {
  if (lowestCount <= 0) return { text: "缺货", color: "#E8453C" };
  if (lowestCount <= 5)  return { text: "库存不足",   color: "#D97706" };
  return { text: "库存充足", color: "#22C55E" };
}

// ─── Row Card ─────────────────────────────────────────────────────────────────
function StockRowCard({
  row,
  onPress,
}: Readonly<{ row: StockRow; onPress: () => void }>): React.ReactElement {
  const badge = stockLabel(row.lowestCount);
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          backgroundColor: C.panel,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.border,
          marginHorizontal: 16,
          marginBottom: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Colour dot */}
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: stockCountColor(row.lowestCount),
            flexShrink: 0,
          }}
        />

        {/* Name + meta */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 4 }}
            numberOfLines={1}
          >
            {row.productName}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Status badge */}
            <View
              style={{
                backgroundColor: `${badge.color}18`,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: badge.color }}>
                {badge.text}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: C.muted }}>
              {row.totalUnits.toLocaleString()} 件 · {row.skuCount} SKU
            </Text>
          </View>
        </View>

        {/* Total units pill */}
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: stockCountColor(row.lowestCount),
            }}
          >
            {row.totalUnits}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={14} color={C.muted} />
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AllStockScreen(): React.ReactElement {
  const router = useRouter();
  const { productStocks, loading: stockLoading } = useProductStockContext();
  const { products, loading: prodLoading } = useProductContext();

  const [search, setSearch] = useState("");

  const loading = stockLoading || prodLoading;

  /** Build a lookup map: productId → product name */
  const productNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      map.set(p.id, p.name);
    }
    return map;
  }, [products]);

  /** Aggregate productStocks by product_id */
  const rows = useMemo<StockRow[]>(() => {
    const byProduct = new Map<string, { total: number; skus: number; lowest: number }>();

    for (const s of productStocks) {
      const existing = byProduct.get(s.product_id);
      if (existing === undefined) {
        byProduct.set(s.product_id, { total: s.count, skus: 1, lowest: s.count });
      } else {
        existing.total += s.count;
        existing.skus += 1;
        existing.lowest = Math.min(existing.lowest, s.count);
      }
    }

    const result: StockRow[] = [];
    for (const [productId, agg] of byProduct.entries()) {
      result.push({
        productId,
        productName: productNameMap.get(productId) ?? productId,
        totalUnits: agg.total,
        skuCount: agg.skus,
        lowestCount: agg.lowest,
      });
    }

    return result.sort((a, b) => a.lowestCount - b.lowestCount);
  }, [productStocks, productNameMap]);

  const filtered = useMemo(() => {
    if (search.trim().length === 0) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.productName.toLowerCase().includes(q));
  }, [rows, search]);

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
          全部库存
        </Text>
        <Text style={{ fontSize: 13, color: C.muted }}>{rows.length} 个商品</Text>
      </View>

      {/* ── Search ── */}
      <View
        style={{
          backgroundColor: C.panel,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
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
          <Ionicons name="search-outline" size={16} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="搜索商品…"
            placeholderTextColor={C.muted}
            style={{ flex: 1, fontSize: 15, color: C.text, paddingVertical: 8 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <StockRowCard
              row={item}
              onPress={() =>
                router.push(`/(app)/(tabs)/stocks/product-stock/${item.productId}` as never)
              }
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 56 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="cube-outline" size={30} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>
                暂无库存记录
              </Text>
              <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                每个商品单独管理库存
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
