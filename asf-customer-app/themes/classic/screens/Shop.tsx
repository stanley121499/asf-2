import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryPill } from "@/components/CategoryPill";
import { CartButton } from "@/components/cart/CartButton";
import { ProductCard } from "@/components/ProductCard";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { CeremonySection, GoldSweep } from "@/components/motion";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import { useProductContext, type Product } from "@/context/product/ProductContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { colors } from "@/constants/theme";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { formatRm } from "@/lib/formatCurrency";
import { hapticSelection } from "@/lib/haptics";
import { motion } from "@/lib/motion";
import {
  hasPlayedShopCeremony,
  markShopCeremonyPlayed,
} from "@/lib/shopSessionCeremony";

type SortMode = "newest" | "price_asc" | "price_desc";

/**
 * Classic Shop skin — sticky search + filters + 2-column product grid (Tier A).
 * First catalog mount this session plays a short header + grid entrance.
 */
export function ClassicShopScreen(): React.ReactElement {
  const { categories, loading: catLoading } = useCategoryContext();
  const { products, loading: prodLoading } = useProductContext();

  const loading = catLoading || prodLoading;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <BrowseCatalogBody categories={categories} products={products} />;
}

type BrowseCatalogBodyProps = {
  categories: ReturnType<typeof useCategoryContext>["categories"];
  products: Product[];
};

/**
 * Catalog chrome + grid. Mounts only after loading so the once-per-session
 * Shop first-land ceremony is not consumed by the spinner frame.
 */
function BrowseCatalogBody({
  categories,
  products,
}: BrowseCatalogBodyProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { translateCategory, translateProduct } = useContentTranslation();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const reducedMotion = useReducedMotion();

  const alreadyPlayed = hasPlayedShopCeremony();
  const play = !alreadyPlayed && reducedMotion !== true;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    if (alreadyPlayed) {
      return;
    }

    // Gate remounts immediately; this mount still animates via `play` snapshot.
    markShopCeremonyPlayed();

    if (reducedMotion === true) {
      return;
    }

    void hapticSelection();
  }, [alreadyPlayed, reducedMotion]);

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
      const displayName = translateProduct(p.id, "name", p.name ?? null);
      return displayName.toLowerCase().includes(q);
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
  }, [products, query, selectedCategoryId, sortMode, translateProduct]);

  // Pair products into rows for the 2-col grid
  const rows: Array<[typeof filtered[0], typeof filtered[0] | null]> = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push([filtered[i], filtered[i + 1] ?? null]);
  }

  const entranceBaseDelayMs = 0;
  const entranceDurationMs = motion.duration.dailyEntrance;
  const entranceStaggerMs = motion.delay.dailyStagger;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.bg }}>
        {/* Search bar — ceremony index 0 */}
        <CeremonySection
          index={0}
          play={play}
          baseDelayMs={entranceBaseDelayMs}
          durationMs={entranceDurationMs}
          staggerMs={entranceStaggerMs}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
              gap: 8,
            }}
          >
            <View
              style={{
                flex: 1,
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
                placeholder={t("search.placeholder")}
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <CartButton accessibilityLabel={t("nav.openCart")} />
          </View>
          {play ? (
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              <GoldSweep
                play={play}
                delayMs={entranceBaseDelayMs + 100}
                height={1.5}
              />
            </View>
          ) : null}
        </CeremonySection>

        {/* Sort + category filters — ceremony index 1 */}
        <CeremonySection
          index={1}
          play={play}
          baseDelayMs={entranceBaseDelayMs}
          durationMs={entranceDurationMs}
          staggerMs={entranceStaggerMs}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}
          >
            <CategoryPill
              label={t("filter.sortNewest")}
              selected={sortMode === "newest"}
              onPress={() => setSortMode("newest")}
            />
            <CategoryPill
              label={t("filter.sortPriceAsc")}
              selected={sortMode === "price_asc"}
              onPress={() => setSortMode("price_asc")}
            />
            <CategoryPill
              label={t("filter.sortPriceDesc")}
              selected={sortMode === "price_desc"}
              onPress={() => setSortMode("price_desc")}
            />
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
          >
            <CategoryPill
              label={t("catalog.all")}
              selected={selectedCategoryId === null}
              onPress={() => setSelectedCategoryId(null)}
            />
            {sortedCategories.map((c) => {
              const label = translateCategory(c.id, c.name ?? null);
              return (
                <CategoryPill
                  key={c.id}
                  label={label.length > 0 ? label : t("catalog.categoryFallback")}
                  selected={selectedCategoryId === c.id}
                  onPress={() => setSelectedCategoryId(c.id)}
                />
              );
            })}
          </ScrollView>
        </CeremonySection>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border }} />
      </SafeAreaView>

      {/* Product grid wrapper fade — ceremony index 2 (not per-card) */}
      <TourAnchor id={ANCHORS.shop.grid} style={{ flex: 1 }}>
        <CeremonySection
          index={2}
          play={play}
          baseDelayMs={entranceBaseDelayMs}
          durationMs={entranceDurationMs}
          staggerMs={entranceStaggerMs}
          style={{ flex: 1 }}
        >
          <FlatList
            data={rows}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: colors.muted, paddingVertical: 64, fontFamily: "Inter_400Regular" }}>
                {t("catalog.emptyTitle")}
              </Text>
            }
            renderItem={({ item: [left, right] }) => (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <ProductCard
                  product={left}
                  imageUri={left.medias[0]?.media_url ?? ""}
                  priceLabel={formatRm(left.price)}
                  wishlisted={isInWishlist(left.id)}
                  onPress={() => openBrowseProduct(router, left.id)}
                  onWishlistPress={() => void (isInWishlist(left.id) ? removeFromWishlist(left.id) : addToWishlist(left.id))}
                />
                {right !== null ? (
                  <ProductCard
                    product={right}
                    imageUri={right.medias[0]?.media_url ?? ""}
                    priceLabel={formatRm(right.price)}
                    wishlisted={isInWishlist(right.id)}
                    onPress={() => openBrowseProduct(router, right.id)}
                    onWishlistPress={() => void (isInWishlist(right.id) ? removeFromWishlist(right.id) : addToWishlist(right.id))}
                  />
                ) : (
                  <View style={{ width: "48%" }} />
                )}
              </View>
            )}
          />
        </CeremonySection>
      </TourAnchor>
    </View>
  );
}
