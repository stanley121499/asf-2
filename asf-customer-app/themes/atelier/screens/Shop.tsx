import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ANCHORS, TourAnchor } from "@/components/guide";
import { CeremonySection, GoldSweep } from "@/components/motion";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import { useProductContext, type Product } from "@/context/product/ProductContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { formatRm } from "@/lib/formatCurrency";
import { hapticSelection } from "@/lib/haptics";
import { motion } from "@/lib/motion";
import {
  hasPlayedShopCeremony,
  markShopCeremonyPlayed,
} from "@/lib/shopSessionCeremony";
import { LookbookProductCard } from "@/themes/atelier/components/LookbookProductCard";

type SortMode = "newest" | "price_asc" | "price_desc";

/** Two-column archive index — scannable inventory, not Home chapters. */
const ARCHIVE_COLUMNS = 2;
/** Outer paper inset for the grid. */
const ARCHIVE_H_PAD = 12;
/** Hairline gutter between columns. */
const ARCHIVE_GUTTER = 8;
/** Vertical gap between grid rows. */
const ARCHIVE_ROW_GAP = 14;
/** Cap once-per-session row stagger so landings stay short (~6 cells). */
const ARCHIVE_STAGGER_ROW_CAP = 3;

type SheetOptionProps = Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>;

/**
 * Single selectable row inside the Atelier filter & sort bottom sheet.
 */
function SheetOption({ label, selected, onPress }: SheetOptionProps): React.ReactElement {
  const tokens = useThemeTokens();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontFamily: "Inter_400Regular",
          fontWeight: selected ? "600" : "400",
          color: selected ? tokens.text : tokens.muted,
          letterSpacing: selected ? 0.2 : 0,
        }}
      >
        {label}
      </Text>
      {selected ? (
        <Ionicons name="checkmark" size={18} color={tokens.accent} />
      ) : null}
    </Pressable>
  );
}

type FilterSortSheetProps = Readonly<{
  visible: boolean;
  onClose: () => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  categories: ReturnType<typeof useCategoryContext>["categories"];
  translateCategory: (id: string, name: string | null) => string;
}>;

/**
 * Calm bottom sheet with sort + category — replaces twin sticky filter strips.
 */
function FilterSortSheet({
  visible,
  onClose,
  sortMode,
  onSortChange,
  selectedCategoryId,
  onCategoryChange,
  categories,
  translateCategory,
}: FilterSortSheetProps): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(44,36,22,0.32)" }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        />
        <View
          style={{
            backgroundColor: tokens.bg,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderTopWidth: 1,
            borderColor: tokens.border,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: Math.max(insets.bottom, 20),
            maxHeight: "78%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 22,
                color: tokens.text,
              }}
            >
              {t("filter.filterAndSort")}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Ionicons name="close" size={22} color={tokens.muted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ flexGrow: 0, flexShrink: 1 }}
          >
            <Text
              style={{
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
                marginTop: 16,
                marginBottom: 4,
              }}
            >
              {t("filter.sortTitle")}
            </Text>
            <SheetOption
              label={t("filter.sortNewest")}
              selected={sortMode === "newest"}
              onPress={() => onSortChange("newest")}
            />
            <SheetOption
              label={t("filter.sortPriceLowHigh")}
              selected={sortMode === "price_asc"}
              onPress={() => onSortChange("price_asc")}
            />
            <SheetOption
              label={t("filter.sortPriceHighLow")}
              selected={sortMode === "price_desc"}
              onPress={() => onSortChange("price_desc")}
            />

            <Text
              style={{
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
                marginTop: 28,
                marginBottom: 4,
              }}
            >
              {t("filter.categoryTitle")}
            </Text>
            <SheetOption
              label={t("catalog.all")}
              selected={selectedCategoryId === null}
              onPress={() => onCategoryChange(null)}
            />
            {categories.map((category) => {
              const label = translateCategory(category.id, category.name ?? null);
              return (
                <SheetOption
                  key={category.id}
                  label={label.length > 0 ? label : t("catalog.categoryFallback")}
                  selected={selectedCategoryId === category.id}
                  onPress={() => onCategoryChange(category.id)}
                />
              );
            })}
          </ScrollView>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={{
              marginTop: 20,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
              borderTopWidth: 1,
              borderTopColor: tokens.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: tokens.text,
                fontFamily: "Inter_400Regular",
                letterSpacing: 0.4,
              }}
            >
              {t("filter.done")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Fixed column width for a 2-col paper grid (hairline gutters).
 */
function archiveColumnWidth(windowWidth: number): number {
  const inner = windowWidth - ARCHIVE_H_PAD * 2 - ARCHIVE_GUTTER * (ARCHIVE_COLUMNS - 1);
  return Math.floor(inner / ARCHIVE_COLUMNS);
}

/**
 * Atelier Shop — archive / lookbook **index** (Option A: 2-column grid).
 *
 * Sticky Archive masthead (eyebrow + title + count + search + Filter) stays
 * under the safe area while the inventory grid scrolls. Cards are compact
 * image-forward tiles ({@link LookbookProductCard}) so the silhouette diverges
 * from Home theater chapters even if chrome is cropped. Cart is the FAB
 * ({@link AtelierCartChrome}), not a header bag.
 */
export function AtelierShopScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { categories, loading: catLoading } = useCategoryContext();
  const { products, loading: prodLoading } = useProductContext();

  const loading = catLoading || prodLoading;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  }

  return <AtelierCatalogBody categories={categories} products={products} />;
}

type AtelierCatalogBodyProps = {
  categories: ReturnType<typeof useCategoryContext>["categories"];
  products: Product[];
};

/**
 * Sticky Archive chrome + 2-column inventory grid. Mounts after loading so the
 * once-per-session Shop ceremony is not consumed by the spinner frame.
 */
function AtelierCatalogBody({
  categories,
  products,
}: AtelierCatalogBodyProps): React.ReactElement {
  const tokens = useThemeTokens();
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const columnWidth = useMemo(
    () => archiveColumnWidth(Dimensions.get("window").width),
    []
  );

  useEffect(() => {
    if (alreadyPlayed) {
      return;
    }

    markShopCeremonyPlayed();

    if (reducedMotion === true) {
      return;
    }

    void hapticSelection();
  }, [alreadyPlayed, reducedMotion]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.arrangement !== null && b.arrangement !== null) {
        return a.arrangement - b.arrangement;
      }
      if (a.arrangement !== null) {
        return -1;
      }
      if (b.arrangement !== null) {
        return 1;
      }
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  }, [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      const inCat =
        selectedCategoryId === null ||
        p.product_categories.some((pc) => pc.category_id === selectedCategoryId);
      if (!inCat) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      const displayName = translateProduct(p.id, "name", p.name ?? null);
      return displayName.toLowerCase().includes(q);
    });
    list = [...list];
    if (sortMode === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      );
    } else if (sortMode === "price_asc") {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    return list;
  }, [products, query, selectedCategoryId, sortMode, translateProduct]);

  const filterSummary = useMemo((): string => {
    const sortLabel =
      sortMode === "newest"
        ? t("filter.sortNewest")
        : sortMode === "price_asc"
          ? t("filter.sortPriceAsc")
          : t("filter.sortPriceDesc");

    if (selectedCategoryId === null) {
      return sortLabel;
    }

    const match = sortedCategories.find((c) => c.id === selectedCategoryId);
    const categoryLabel =
      match !== undefined
        ? translateCategory(match.id, match.name ?? null)
        : t("catalog.categoryFallback");
    const safeCategory =
      categoryLabel.length > 0 ? categoryLabel : t("catalog.categoryFallback");
    return `${sortLabel} · ${safeCategory}`;
  }, [sortMode, selectedCategoryId, sortedCategories, t, translateCategory]);

  const entranceBaseDelayMs = 0;
  const entranceDurationMs = motion.duration.dailyEntrance;
  const entranceStaggerMs = motion.delay.dailyStagger;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/*
        Sticky Archive masthead — lives outside FlatList so eyebrow, title,
        count, search, and Filter stay pinned under the safe area while the
        2-col inventory scrolls.
      */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: tokens.bg }}>
        <CeremonySection
          index={0}
          play={play}
          baseDelayMs={entranceBaseDelayMs}
          durationMs={entranceDurationMs}
          staggerMs={entranceStaggerMs}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                letterSpacing: 2.2,
                textTransform: "uppercase",
                color: tokens.muted,
                marginBottom: 4,
              }}
            >
              {t("catalog.atelierArchiveEyebrow")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 24,
                  color: tokens.text,
                  flexShrink: 1,
                }}
              >
                {t("catalog.atelierTitle")}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: tokens.muted,
                }}
              >
                {t("catalog.atelierCount", { count: filtered.length })}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                height: 36,
                borderBottomWidth: 1,
                borderBottomColor: tokens.border,
                gap: 10,
              }}
            >
              <Ionicons name="search-outline" size={16} color={tokens.muted} />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: tokens.text,
                  fontFamily: "Inter_400Regular",
                  paddingVertical: 4,
                }}
                placeholder={t("search.placeholder")}
                placeholderTextColor={tokens.muted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          {play ? (
            <View style={{ paddingHorizontal: 20, marginTop: 2 }}>
              <GoldSweep
                play={play}
                delayMs={entranceBaseDelayMs + 100}
                height={1.5}
              />
            </View>
          ) : null}
        </CeremonySection>

        <CeremonySection
          index={1}
          play={play}
          baseDelayMs={entranceBaseDelayMs}
          durationMs={entranceDurationMs}
          staggerMs={entranceStaggerMs}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 12,
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <Pressable
              onPress={() => setFilterSheetOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("filter.filterAndSort")}
              style={{ flexShrink: 0 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  fontWeight: "500",
                  color: tokens.text,
                  letterSpacing: 0.3,
                  textDecorationLine: "underline",
                  textDecorationColor: tokens.accent,
                }}
              >
                {t("filter.filterAndSort")}
              </Text>
            </Pressable>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                textAlign: "right",
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: tokens.muted,
              }}
            >
              {filterSummary}
            </Text>
          </View>
        </CeremonySection>

        <View style={{ height: 1, backgroundColor: tokens.border }} />
      </SafeAreaView>

      <TourAnchor id={ANCHORS.shop.grid} style={{ flex: 1 }}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={ARCHIVE_COLUMNS}
          columnWrapperStyle={{
            gap: ARCHIVE_GUTTER,
            paddingHorizontal: ARCHIVE_H_PAD,
            marginBottom: ARCHIVE_ROW_GAP,
            // Keep image tops (and heart chips) on one horizontal baseline
            // even when caption line-count differs between left/right cells.
            alignItems: "flex-start",
          }}
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: tokens.muted,
                paddingVertical: 64,
                fontFamily: "Inter_400Regular",
              }}
            >
              {t("catalog.emptyTitle")}
            </Text>
          }
          renderItem={({ item, index }) => {
            // Stagger by ROW, not by cell — per-index translateY made left
            // hearts settle before right ones and read as a stair-step.
            const rowIndex = Math.floor(index / ARCHIVE_COLUMNS);
            const cellPlay = play && rowIndex < ARCHIVE_STAGGER_ROW_CAP;
            return (
              <View style={{ width: columnWidth, alignSelf: "flex-start" }}>
                <CeremonySection
                  index={rowIndex}
                  play={cellPlay}
                  baseDelayMs={entranceBaseDelayMs + entranceStaggerMs * 2}
                  durationMs={entranceDurationMs}
                  staggerMs={Math.max(40, Math.floor(entranceStaggerMs * 0.75))}
                >
                  <LookbookProductCard
                    product={item}
                    imageUri={item.medias[0]?.media_url ?? ""}
                    priceLabel={formatRm(item.price)}
                    wishlisted={isInWishlist(item.id)}
                    onPress={() => openBrowseProduct(router, item.id)}
                    onWishlistPress={() =>
                      void (isInWishlist(item.id)
                        ? removeFromWishlist(item.id)
                        : addToWishlist(item.id))
                    }
                  />
                </CeremonySection>
              </View>
            );
          }}
        />
      </TourAnchor>

      <FilterSortSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sortMode={sortMode}
        onSortChange={setSortMode}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        categories={sortedCategories}
        translateCategory={translateCategory}
      />
    </View>
  );
}
