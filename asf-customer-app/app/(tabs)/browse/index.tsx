import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryPill } from "@/components/CategoryPill";
import { ProductCard } from "@/components/ProductCard";
import { useCategoryContext } from "@/context/product/CategoryContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { colors } from "@/constants/theme";
import { formatRm } from "@/lib/formatCurrency";

const LABELS: Record<string, string> = {
  Handbag: "手袋",
  Streetwear: "街头服饰",
  "Spring Collection": "春季新品",
  Ladies: "女装",
  Men: "男装",
  Accessories: "配饰",
  Shoes: "鞋履",
  Beauty: "美妆",
  Pants: "长裤",
  Tops: "上衣",
  Bottoms: "下装",
};

function labelForCategory(name: string | null): string {
  if (name === null || name.length === 0) return "分类";
  return LABELS[name] ?? name;
}

type SortMode = "newest" | "price_asc" | "price_desc";

/**
 * Browse / product section screen — matches web product-section page.
 * All layout uses inline styles so nothing is clipped by NativeWind class conflicts.
 */
export default function BrowseIndexScreen(): React.ReactElement {
  const router = useRouter();
  const { categories, loading: catLoading } = useCategoryContext();
  const { products, loading: prodLoading } = useProductContext();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.arrangement !== null && b.arrangement !== null) return a.arrangement - b.arrangement;
      if (a.arrangement !== null) return -1;
      if (b.arrangement !== null) return 1;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      const inCat =
        selectedCategoryId === null ||
        p.product_categories.some((pc) => pc.category_id === selectedCategoryId);
      if (!inCat) return false;
      if (q.length === 0) return true;
      return (p.name ?? "").toLowerCase().includes(q);
    });
    list = [...list];
    if (sortMode === "newest") {
      list.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    } else if (sortMode === "price_asc") {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    return list;
  }, [products, query, selectedCategoryId, sortMode]);

  const loading = catLoading || prodLoading;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Pair products into rows for the 2-col grid
  const rows: Array<[typeof filtered[0], typeof filtered[0] | null]> = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push([filtered[i], filtered[i + 1] ?? null]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        {/* Search bar */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.panel,
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: colors.text, fontFamily: "Inter_400Regular" }}
              placeholder="搜索商品..."
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Sort pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
        >
          <CategoryPill label="最新" selected={sortMode === "newest"} onPress={() => setSortMode("newest")} />
          <CategoryPill label="价格 ↑" selected={sortMode === "price_asc"} onPress={() => setSortMode("price_asc")} />
          <CategoryPill label="价格 ↓" selected={sortMode === "price_desc"} onPress={() => setSortMode("price_desc")} />
        </ScrollView>

        {/* Category filter pills — no height constraint, free to show full text */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        >
          <CategoryPill label="全部" selected={selectedCategoryId === null} onPress={() => setSelectedCategoryId(null)} />
          {sortedCategories.map((c) => (
            <CategoryPill
              key={c.id}
              label={labelForCategory(c.name)}
              selected={selectedCategoryId === c.id}
              onPress={() => setSelectedCategoryId(c.id)}
            />
          ))}
        </ScrollView>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border }} />
      </SafeAreaView>

      {/* Product grid */}
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: colors.muted, paddingVertical: 64, fontFamily: "Inter_400Regular" }}>
            暂无相关商品
          </Text>
        }
        renderItem={({ item: [left, right] }) => (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <ProductCard
              product={left}
              imageUri={left.medias[0]?.media_url ?? ""}
              priceLabel={formatRm(left.price)}
              wishlisted={isInWishlist(left.id)}
              onPress={() => router.push(`/(tabs)/browse/${left.id}`)}
              onWishlistPress={() => void (isInWishlist(left.id) ? removeFromWishlist(left.id) : addToWishlist(left.id))}
            />
            {right !== null ? (
              <ProductCard
                product={right}
                imageUri={right.medias[0]?.media_url ?? ""}
                priceLabel={formatRm(right.price)}
                wishlisted={isInWishlist(right.id)}
                onPress={() => router.push(`/(tabs)/browse/${right.id}`)}
                onWishlistPress={() => void (isInWishlist(right.id) ? removeFromWishlist(right.id) : addToWishlist(right.id))}
              />
            ) : (
              <View style={{ width: "48%" }} />
            )}
          </View>
        )}
      />
    </View>
  );
}
