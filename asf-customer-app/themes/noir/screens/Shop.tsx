import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

import { CartButton } from "@/components/cart/CartButton";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { CeremonySection, GoldSweep, PressableScale } from "@/components/motion";
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
import { NoirProductCard } from "@/themes/noir/components/NoirProductCard";
import type { ThemeTokens } from "@/themes/types";

type SortMode = "newest" | "price_asc" | "price_desc";

/**
 * Compact dark sheet option row for sort / category picks.
 */
function NoirSheetOption({
  label,
  selected,
  onPress,
  tokens,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
  tokens: ThemeTokens;
}>): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Inter_400Regular",
          color: selected ? tokens.text : tokens.muted,
          fontWeight: selected ? "600" : "400",
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

type NoirFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  selectedCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  categories: Array<{ id: string; name: string | null }>;
  tokens: ThemeTokens;
};

/**
 * Dark bottom sheet — sort + category in one place (one control → sheet).
 */
function NoirFilterSheet({
  visible,
  onClose,
  sortMode,
  onSortChange,
  selectedCategoryId,
  onCategoryChange,
  categories,
  tokens,
}: NoirFilterSheetProps): React.ReactElement {
  const { t } = useTranslation();
  const { translateCategory } = useContentTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)" }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("common.close")}
      />
      <View
        style={{
          backgroundColor: tokens.panel,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          borderTopWidth: 1,
          borderColor: tokens.border,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 20),
          maxHeight: "72%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              fontWeight: "600",
              letterSpacing: 0.4,
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

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              marginTop: 12,
              marginBottom: 4,
            }}
          >
            {t("filter.sortTitle")}
          </Text>
          <NoirSheetOption
            label={t("filter.sortNewest")}
            selected={sortMode === "newest"}
            onPress={() => onSortChange("newest")}
            tokens={tokens}
          />
          <NoirSheetOption
            label={t("filter.sortPriceLowHigh")}
            selected={sortMode === "price_asc"}
            onPress={() => onSortChange("price_asc")}
            tokens={tokens}
          />
          <NoirSheetOption
            label={t("filter.sortPriceHighLow")}
            selected={sortMode === "price_desc"}
            onPress={() => onSortChange("price_desc")}
            tokens={tokens}
          />

          <Text
            style={{
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              marginTop: 20,
              marginBottom: 4,
            }}
          >
            {t("filter.categoryTitle")}
          </Text>
          <NoirSheetOption
            label={t("catalog.all")}
            selected={selectedCategoryId === null}
            onPress={() => onCategoryChange(null)}
            tokens={tokens}
          />
          {categories.map((c) => {
            const label = translateCategory(c.id, c.name ?? null);
            return (
              <NoirSheetOption
                key={c.id}
                label={label.length > 0 ? label : t("catalog.categoryFallback")}
                selected={selectedCategoryId === c.id}
                onPress={() => onCategoryChange(c.id)}
                tokens={tokens}
              />
            );
          })}
        </ScrollView>

        <PressableScale
          onPress={onClose}
          haptic="light"
          centerContent
          accessibilityRole="button"
          accessibilityLabel={t("filter.done")}
          style={{
            marginTop: 16,
            height: 48,
            backgroundColor: tokens.accent,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: tokens.bg,
              fontSize: 14,
              fontWeight: "700",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("filter.done")}
          </Text>
        </PressableScale>
      </View>
    </Modal>
  );
}

type NoirCatalogEmptyProps = {
  mode: "empty" | "noResults";
  query: string;
  filtersActive: boolean;
  onClear: () => void;
  tokens: ThemeTokens;
};

/**
 * Designed empty / no-results plate — inventory machine, not a blank list.
 */
function NoirCatalogEmpty({
  mode,
  query,
  filtersActive,
  onClear,
  tokens,
}: NoirCatalogEmptyProps): React.ReactElement {
  const { t } = useTranslation();
  const trimmed = query.trim();
  const showClear = mode === "noResults" && (trimmed.length > 0 || filtersActive);

  const title =
    mode === "noResults"
      ? trimmed.length > 0
        ? t("search.noResults", { query: trimmed })
        : t("catalog.noirNoResultsTitle")
      : t("catalog.noirEmptyTitle");

  const hint =
    mode === "noResults"
      ? t("catalog.noirNoResultsHint")
      : t("catalog.noirEmptyHint");

  return (
    <View
      style={{
        paddingHorizontal: 28,
        paddingTop: 56,
        paddingBottom: 80,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.panel,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons
          name={mode === "noResults" ? "search-outline" : "cube-outline"}
          size={22}
          color={tokens.muted}
        />
      </View>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 16,
          fontWeight: "600",
          color: tokens.text,
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: 0.2,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 13,
          lineHeight: 19,
          color: tokens.muted,
          textAlign: "center",
          maxWidth: 280,
        }}
      >
        {hint}
      </Text>
      {showClear ? (
        <PressableScale
          onPress={onClear}
          haptic="light"
          centerContent
          accessibilityRole="button"
          accessibilityLabel={t("catalog.noirClearTools")}
          style={{
            marginTop: 24,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: tokens.border,
            backgroundColor: tokens.panel,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Ionicons name="close-circle-outline" size={16} color={tokens.text} />
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                fontWeight: "600",
                color: tokens.text,
                letterSpacing: 0.3,
              }}
            >
              {t("catalog.noirClearTools")}
            </Text>
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

/**
 * Noir Shop — intentional catalog machine (Tier A).
 *
 * Sticky tools masthead (search + filter summary + result count + bag) over a
 * dense price-forward LIST. Silhouette must not match Home’s large featured stream.
 */
export function NoirShopScreen(): React.ReactElement {
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

  return <NoirBrowseCatalogBody categories={categories} products={products} />;
}

type NoirBrowseCatalogBodyProps = {
  categories: ReturnType<typeof useCategoryContext>["categories"];
  products: Product[];
};

/**
 * Catalog chrome + price-forward list. Mounts only after loading so the
 * once-per-session Shop first-land ceremony is not consumed by the spinner.
 */
function NoirBrowseCatalogBody({
  categories,
  products,
}: NoirBrowseCatalogBodyProps): React.ReactElement {
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
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );
    } else if (sortMode === "price_asc") {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else {
      list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    return list;
  }, [products, query, selectedCategoryId, sortMode, translateProduct]);

  const sortLabel = useMemo((): string => {
    if (sortMode === "price_asc") {
      return t("filter.sortPriceAsc");
    }
    if (sortMode === "price_desc") {
      return t("filter.sortPriceDesc");
    }
    return t("filter.sortNewest");
  }, [sortMode, t]);

  const categoryLabel = useMemo((): string => {
    if (selectedCategoryId === null) {
      return t("catalog.all");
    }
    const match = sortedCategories.find((c) => c.id === selectedCategoryId);
    if (match === undefined) {
      return t("catalog.all");
    }
    const label = translateCategory(match.id, match.name ?? null);
    return label.length > 0 ? label : t("catalog.categoryFallback");
  }, [selectedCategoryId, sortedCategories, t, translateCategory]);

  const filterSummary = t("filter.summary", {
    sort: sortLabel,
    category: categoryLabel,
  });

  const filtersActive =
    selectedCategoryId !== null || sortMode !== "newest";
  const queryActive = query.trim().length > 0;
  const toolsNarrowed = filtersActive || queryActive;

  const clearTools = (): void => {
    setQuery("");
    setSelectedCategoryId(null);
    setSortMode("newest");
  };

  const emptyMode: "empty" | "noResults" =
    products.length === 0 && !toolsNarrowed ? "empty" : "noResults";

  const entranceBaseDelayMs = 0;
  const entranceDurationMs = motion.duration.dailyEntrance;
  const entranceStaggerMs = motion.delay.dailyStagger;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Sticky tools masthead — inventory chrome, not Home drop bar */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: tokens.bg }}>
        <CeremonySection
          index={0}
          play={play}
          baseDelayMs={entranceBaseDelayMs}
          durationMs={entranceDurationMs}
          staggerMs={entranceStaggerMs}
        >
          {/* Title band: Inventory + live count + bag */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 8,
              gap: 12,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: tokens.muted,
                  fontWeight: "500",
                  marginBottom: 2,
                }}
              >
                {t("catalog.noirEyebrow")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 22,
                    fontWeight: "700",
                    color: tokens.text,
                    letterSpacing: 0.2,
                  }}
                >
                  {t("catalog.noirInventoryTitle")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    letterSpacing: 0.4,
                    color: tokens.muted,
                  }}
                  accessibilityLabel={t("catalog.noirCount", {
                    count: filtered.length,
                  })}
                >
                  {t("catalog.noirCount", { count: filtered.length })}
                </Text>
              </View>
            </View>
            <CartButton
              color={tokens.text}
              size={40}
              iconSize={20}
              accessibilityLabel={t("nav.openCart")}
            />
          </View>

          {/* Search — primary find tool */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                height: 42,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: queryActive ? tokens.text : tokens.border,
                backgroundColor: tokens.panel,
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <Ionicons name="search-outline" size={16} color={tokens.muted} />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: tokens.text,
                  fontFamily: "Inter_400Regular",
                  paddingVertical: 0,
                }}
                placeholder={t("search.placeholder")}
                placeholderTextColor={tokens.muted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {queryActive ? (
                <Pressable
                  onPress={() => setQuery("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("catalog.noirClearSearch")}
                >
                  <Ionicons name="close-circle" size={18} color={tokens.muted} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {play ? (
            <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
              <GoldSweep
                play={play}
                delayMs={entranceBaseDelayMs + 100}
                height={1.5}
              />
            </View>
          ) : null}
        </CeremonySection>

        {/* Filter summary + results — tools row */}
        <CeremonySection
          index={1}
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
              paddingBottom: 12,
              paddingTop: 2,
              gap: 10,
            }}
          >
            {/*
              Row chrome on an inner View — PressableScale styles the outer
              Pressable only; children sit in a column Animated.View by default.
            */}
            <PressableScale
              onPress={() => setFilterSheetOpen(true)}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={t("filter.openAria")}
              style={{
                borderRadius: 6,
                borderWidth: 1,
                borderColor: filtersActive ? tokens.accent : tokens.border,
                backgroundColor: tokens.panel,
                flexShrink: 1,
                maxWidth: "72%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Ionicons
                  name="options-outline"
                  size={15}
                  color={filtersActive ? tokens.accent : tokens.muted}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: filtersActive ? tokens.text : tokens.muted,
                    fontWeight: filtersActive ? "600" : "400",
                    flexShrink: 1,
                    letterSpacing: 0.2,
                  }}
                  numberOfLines={1}
                >
                  {filterSummary}
                </Text>
              </View>
            </PressableScale>

            <Text
              style={{
                flex: 1,
                textAlign: "right",
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tokens.muted,
              }}
              numberOfLines={1}
            >
              {t("catalog.noirResults", { count: filtered.length })}
            </Text>
          </View>
        </CeremonySection>

        <View style={{ height: 1, backgroundColor: tokens.border }} />
      </SafeAreaView>

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
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 100,
              flexGrow: filtered.length === 0 ? 1 : undefined,
            }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            ListEmptyComponent={
              <NoirCatalogEmpty
                mode={emptyMode}
                query={query}
                filtersActive={filtersActive}
                onClear={clearTools}
                tokens={tokens}
              />
            }
            renderItem={({ item, index }) => {
              const mediaUrl = item.medias[0]?.media_url;
              const imageUri =
                typeof mediaUrl === "string" ? mediaUrl : "";
              return (
                <NoirProductCard
                  product={item}
                  imageUri={imageUri}
                  priceLabel={formatRm(item.price)}
                  indexLabel={String(index + 1).padStart(2, "0")}
                  wishlisted={isInWishlist(item.id)}
                  onPress={() => openBrowseProduct(router, item.id)}
                  onWishlistPress={() =>
                    void (isInWishlist(item.id)
                      ? removeFromWishlist(item.id)
                      : addToWishlist(item.id))
                  }
                />
              );
            }}
          />
        </CeremonySection>
      </TourAnchor>

      <NoirFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sortMode={sortMode}
        onSortChange={setSortMode}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        categories={sortedCategories}
        tokens={tokens}
      />
    </View>
  );
}
