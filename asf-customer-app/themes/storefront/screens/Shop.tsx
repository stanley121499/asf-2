import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CartButton } from "@/components/cart/CartButton";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { CeremonySection, GoldSweep, PressableScale } from "@/components/motion";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import { NotificationBellButton } from "@/components/storefront/NotificationBellButton";
import { StorefrontProductTile } from "@/components/storefront/StorefrontProductTile";
import { StorefrontTaxonomyTile } from "@/components/storefront/StorefrontTaxonomyTile";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useCategoryContext } from "@/context/product/CategoryContext";
import {
  useProductContext,
  type Product,
} from "@/context/product/ProductContext";
import { useRangeContext } from "@/context/product/RangeContext";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { hapticSelection } from "@/lib/haptics";
import { motion } from "@/lib/motion";
import { scheduleAfterIdle } from "@/lib/scheduleAfterIdle";
import {
  hasPlayedShopCeremony,
  markShopCeremonyPlayed,
} from "@/lib/shopSessionCeremony";
import {
  STOREFRONT_LIST_REMOVE_CLIPPED_SUBVIEWS,
  STOREFRONT_LIST_UPDATE_CELLS_MS,
  STOREFRONT_LIST_WINDOW_SIZE,
  STOREFRONT_SHOP_PRODUCT_INITIAL,
  STOREFRONT_SHOP_PRODUCT_MAX_BATCH,
  STOREFRONT_SHOP_SIDEBAR_INITIAL,
  STOREFRONT_SHOP_SIDEBAR_MAX_BATCH,
} from "@/lib/storefront/listWindowing";
import {
  buildOccupationSidebarItems,
  defaultOccupationSelection,
  filterOccupationShopProducts,
  hasMoreShopProducts,
  isComingSoonCategory,
  isShopVisibleCategoryKind,
  pageShopProducts,
  resolveOccupationCategoryTiles,
  SHOP_CATEGORY_TILE_COLUMNS,
  SHOP_PRODUCT_PAGE_SIZE,
  type ShopProduct,
  type StorefrontOccupationSelection,
  type StorefrontSidebarItem,
} from "@/lib/storefront/shopTaxonomy";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/** Left rail width percent (~22–28% per plan §3.3). */
const SIDEBAR_WIDTH_PERCENT = "26%" as const;

/** Gap between category tiles (3-across rows). */
const TILE_GAP = 8;

/** Horizontal padding inside the right pane. */
const RIGHT_PAD = 10;

/** Gap between product columns. */
const PRODUCT_GAP = 10;

/**
 * Chunks category tiles into fixed-width rows (3-across) so flexWrap cannot
 * collapse to 2 columns from fractional widths.
 */
function chunkCategoryTileRows(
  tiles: readonly StorefrontSidebarItem[],
  columns: number = SHOP_CATEGORY_TILE_COLUMNS
): StorefrontSidebarItem[][] {
  const cols =
    Number.isFinite(columns) && columns > 0 ? Math.floor(columns) : 1;
  const rows: StorefrontSidebarItem[][] = [];
  for (let i = 0; i < tiles.length; i += cols) {
    rows.push(tiles.slice(i, i + cols));
  }
  return rows;
}

/**
 * Maps a catalog {@link Product} into the Shop filter shape.
 */
function toShopProduct(product: Product): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    department_id: product.department_id,
    range_id: product.range_id,
    category_id: product.category_id,
    brand_id: product.brand_id,
    deleted_at: product.deleted_at,
    status: product.status,
    product_categories: product.product_categories,
  };
}

/**
 * Storefront Shop — occupation left rail + category tiles + lazy 2-col
 * products (plan §3.3).
 *
 * **Tiles:** 3-across × 2 rows (6 slots) — shoes only (bags/accessories
 * hidden in UI) plus Coming Soon placeholders (`shop.comingSoon`). Same
 * rule for every occupation.
 *
 * **Search:** free-text is AND-ed within the current occupation (and
 * category when a tile is selected). Empty query → selection-only filter.
 *
 * Does not alter Classic / Atelier / Noir Shop IA. Departments and brands
 * are not shown in the sidebar or tiles.
 */
export function StorefrontShopScreen(): React.ReactElement {
  const { ranges, loading: rangeLoading } = useRangeContext();
  const { categories, loading: catLoading } = useCategoryContext();
  const {
    products,
    loading: prodLoading,
    hasMore,
    loadingMore,
    loadMoreProducts,
  } = useProductContext();

  const catalogLoading = rangeLoading || catLoading || prodLoading;
  /**
   * Keep the Shop body mounted after the first successful catalog hydrate.
   * Swapping spinner ↔ body remounted both FlatLists and re-ran taxonomy
   * selection effects — a major revisit cost under freezeOnBlur unfreeze.
   */
  const [hasHydratedCatalog, setHasHydratedCatalog] = useState(
    () => !catalogLoading
  );

  useEffect(() => {
    if (!catalogLoading) {
      setHasHydratedCatalog(true);
    }
  }, [catalogLoading]);

  if (!hasHydratedCatalog) {
    return <PageLoadingSkeleton variant="shop" />;
  }

  return (
    <StorefrontShopBody
      ranges={ranges}
      categories={categories}
      products={products}
      hasMore={hasMore}
      loadingMore={loadingMore}
      loadMoreProducts={loadMoreProducts}
    />
  );
}

type StorefrontShopBodyProps = {
  ranges: ReturnType<typeof useRangeContext>["ranges"];
  categories: ReturnType<typeof useCategoryContext>["categories"];
  products: Product[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreProducts: () => Promise<void>;
};

/**
 * Shop chrome + occupation layout. Mounts after catalog contexts finish
 * loading so the once-per-session ceremony is not consumed by the spinner.
 */
function StorefrontShopBody({
  ranges,
  categories,
  products,
  hasMore,
  loadingMore,
  loadMoreProducts,
}: StorefrontShopBodyProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { translateRange, translateCategory, translateProduct } =
    useContentTranslation();
  const reducedMotion = useReducedMotion();

  const alreadyPlayed = hasPlayedShopCeremony();
  const play = !alreadyPlayed && reducedMotion !== true;

  const [query, setQuery] = useState("");
  const [selection, setSelection] =
    useState<StorefrontOccupationSelection | null>(null);
  const [visibleCount, setVisibleCount] = useState(SHOP_PRODUCT_PAGE_SIZE);
  const [rightPaneWidth, setRightPaneWidth] = useState(0);

  const sidebarListRef = useRef<FlatList<StorefrontSidebarItem>>(null);

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

  /** Left rail: active occupation ranges only. */
  const sidebarItems = useMemo(
    () => buildOccupationSidebarItems(ranges),
    [ranges]
  );

  // Default: first occupation; keep selection if occupation still present.
  useEffect(() => {
    setSelection((prev) => {
      if (prev !== null) {
        const occupationStillPresent = sidebarItems.some(
          (item) => item.kind === "range" && item.id === prev.occupationId
        );
        if (occupationStillPresent) {
          if (prev.categoryId === null) {
            return prev;
          }
          // Bags / accessories stay in DB but are hidden from the tile grid.
          const categoryStillUnderOccupation = categories.some(
            (category) =>
              category.id === prev.categoryId &&
              category.range_id === prev.occupationId &&
              isShopVisibleCategoryKind(category.kind_key) &&
              (category.deleted_at === null ||
                category.deleted_at === undefined ||
                category.deleted_at.length === 0)
          );
          if (categoryStillUnderOccupation) {
            return prev;
          }
          return { occupationId: prev.occupationId, categoryId: null };
        }
      }
      return defaultOccupationSelection(sidebarItems);
    });
  }, [sidebarItems, categories]);

  const shopProducts = useMemo(
    () => products.map(toShopProduct),
    [products]
  );

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) {
      map.set(product.id, product);
    }
    return map;
  }, [products]);

  /** 3-across × 2 rows: shoes + Coming Soon placeholders for the occupation. */
  const categoryTiles = useMemo(() => {
    if (selection === null) {
      return [];
    }
    return resolveOccupationCategoryTiles(selection.occupationId, categories);
  }, [selection, categories]);

  /**
   * Products in the current occupation (+ category when selected), with
   * search AND-ed within that selection.
   */
  const filteredProducts = useMemo(() => {
    // Empty query: selection-only filter (skip translation resolver work).
    if (query.trim().length === 0) {
      return filterOccupationShopProducts(shopProducts, selection, "");
    }
    return filterOccupationShopProducts(shopProducts, selection, query, {
      resolveDisplayName: (product) => {
        const full = productById.get(product.id);
        const baseName = full?.name ?? product.name;
        return translateProduct(product.id, "name", baseName);
      },
    });
  }, [shopProducts, selection, query, productById, translateProduct]);

  const showComingSoon = useMemo(() => {
    if (selection === null || selection.categoryId === null) {
      return false;
    }
    return isComingSoonCategory(
      selection.occupationId,
      selection.categoryId,
      shopProducts
    );
  }, [selection, shopProducts]);

  // Reset paging when selection or search changes.
  useEffect(() => {
    setVisibleCount(SHOP_PRODUCT_PAGE_SIZE);
  }, [selection?.occupationId, selection?.categoryId, query]);

  const visibleProducts = useMemo(
    () => pageShopProducts(filteredProducts, visibleCount),
    [filteredProducts, visibleCount]
  );

  const canRevealMoreLoaded =
    !showComingSoon &&
    hasMoreShopProducts(filteredProducts.length, visibleCount);

  /**
   * When the current occupation/filter has fewer matches than one Shop page
   * but the server still has catalog pages, keep fetching until the window
   * fills or the catalog is exhausted (infinite-query style).
   *
   * Deferred past the current frame so P1 page appends do not compete with
   * browse tab focus paint (Metro: P1 page N lined up with +631–900ms focus).
   */
  useEffect(() => {
    if (showComingSoon || loadingMore || !hasMore) {
      return;
    }
    if (filteredProducts.length >= SHOP_PRODUCT_PAGE_SIZE) {
      return;
    }
    const idle = scheduleAfterIdle(() => {
      void loadMoreProducts();
    }, 48);
    return () => {
      idle.cancel();
    };
  }, [
    showComingSoon,
    loadingMore,
    hasMore,
    filteredProducts.length,
    loadMoreProducts,
  ]);

  /**
   * Resolves a translated sidebar / tile label for a taxonomy item.
   * Sidebar = occupations (ranges); tiles = categories.
   */
  const resolveItemLabel = useCallback(
    (item: StorefrontSidebarItem): string => {
      if (item.kind === "range") {
        return translateRange(item.id, item.label);
      }
      return translateCategory(item.id, item.label);
    },
    [translateRange, translateCategory]
  );

  const handleSidebarPress = useCallback(
    (item: StorefrontSidebarItem): void => {
      setSelection({ occupationId: item.id, categoryId: null });
      void hapticSelection();
    },
    []
  );

  const handleTilePress = useCallback(
    (item: StorefrontSidebarItem): void => {
      if (item.placeholder === true) {
        return;
      }
      setSelection((prev) => {
        if (prev === null) {
          return null;
        }
        // Toggle off when tapping the already-selected category.
        if (prev.categoryId === item.id) {
          return { occupationId: prev.occupationId, categoryId: null };
        }
        return { occupationId: prev.occupationId, categoryId: item.id };
      });
      void hapticSelection();
    },
    []
  );

  /**
   * Client window first; when the loaded filtered set is exhausted, request
   * the next server page instead of assuming the full catalog is in memory.
   */
  const handleEndReached = useCallback((): void => {
    if (showComingSoon) {
      return;
    }
    if (canRevealMoreLoaded) {
      setVisibleCount((prev) =>
        Math.min(prev + SHOP_PRODUCT_PAGE_SIZE, filteredProducts.length)
      );
      return;
    }
    if (hasMore && !loadingMore) {
      void loadMoreProducts();
    }
  }, [
    showComingSoon,
    canRevealMoreLoaded,
    filteredProducts.length,
    hasMore,
    loadingMore,
    loadMoreProducts,
  ]);

  const handleProductPress = useCallback(
    (product: Product, colorId: string | null): void => {
      startTransition(() => {
        openBrowseProduct(router, product.id, {
          returnTo: "catalog",
          colorId: colorId ?? undefined,
        });
      });
    },
    [router]
  );

  const productColumnWidth = useMemo(() => {
    if (rightPaneWidth <= 0) {
      return 0;
    }
    const inner = rightPaneWidth - RIGHT_PAD * 2;
    return (inner - PRODUCT_GAP) / 2;
  }, [rightPaneWidth]);

  const entranceBaseDelayMs = 0;
  const entranceDurationMs = motion.duration.dailyEntrance;
  const entranceStaggerMs = motion.delay.dailyStagger;

  const renderSidebarItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<StorefrontSidebarItem>): React.ReactElement => {
      const selected =
        selection !== null && selection.occupationId === item.id;
      const label = resolveItemLabel(item);
      const display =
        label.trim().length > 0 ? label : t("catalog.categoryFallback");

      return (
        <PressableScale
          haptic="none"
          onPress={() => handleSidebarPress(item)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={display}
          style={{
            flexDirection: "row",
            alignItems: "stretch",
            minHeight: 48,
            backgroundColor: selected ? tokens.panel : tokens.bg,
          }}
        >
          <View
            style={{
              width: 3,
              backgroundColor: selected ? tokens.accent : "transparent",
            }}
          />
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingVertical: 12,
              paddingHorizontal: 8,
            }}
          >
            <Text
              numberOfLines={2}
              style={{
                fontSize: 12,
                lineHeight: 16,
                color: selected ? tokens.accent : tokens.text,
                fontWeight: selected ? "600" : "400",
                fontFamily: "Inter_400Regular",
              }}
            >
              {display}
            </Text>
          </View>
        </PressableScale>
      );
    },
    [selection, resolveItemLabel, handleSidebarPress, t]
  );

  /**
   * Stable product cell renderer — inline `renderItem` forced FlatList to
   * rebind every Shop re-render (catalog page appends / unfreeze).
   */
  const renderProductItem = useCallback(
    ({ item }: ListRenderItemInfo<ShopProduct>): React.ReactElement => {
      const full = productById.get(item.id);
      if (full === undefined) {
        return <View style={{ flex: 1 }} />;
      }
      return (
        <View
          style={{
            width: productColumnWidth > 0 ? productColumnWidth : undefined,
            flex: productColumnWidth > 0 ? undefined : 1,
          }}
        >
          <StorefrontProductTile
            product={full}
            onPress={(colorId) => handleProductPress(full, colorId)}
          />
        </View>
      );
    },
    [productById, productColumnWidth, handleProductPress]
  );

  const listHeader = useMemo((): React.ReactElement | null => {
    if (selection === null) {
      return null;
    }

    if (categoryTiles.length === 0) {
      return (
        <View style={{ paddingHorizontal: RIGHT_PAD, paddingBottom: 12 }}>
          <Text
            style={{
              fontSize: 13,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("shop.emptyTiles")}
          </Text>
        </View>
      );
    }

    const comingSoonLabel = t("shop.comingSoon");
    const tileRows = chunkCategoryTileRows(
      categoryTiles,
      SHOP_CATEGORY_TILE_COLUMNS
    );

    return (
      <View
        style={{
          gap: TILE_GAP,
          paddingHorizontal: RIGHT_PAD,
          paddingBottom: 14,
        }}
      >
        {tileRows.map((row, rowIndex) => (
          <View
            key={`tile-row-${rowIndex}`}
            style={{ flexDirection: "row", gap: TILE_GAP }}
          >
            {row.map((tile) => {
              const isPlaceholder = tile.placeholder === true;
              const isSelected =
                !isPlaceholder &&
                selection.categoryId !== null &&
                selection.categoryId === tile.id;
              return (
                <StorefrontTaxonomyTile
                  key={`${tile.kind}:${tile.id}`}
                  label={
                    isPlaceholder ? comingSoonLabel : resolveItemLabel(tile)
                  }
                  mediaUrl={isPlaceholder ? null : tile.mediaUrl}
                  selected={isSelected}
                  disabled={isPlaceholder}
                  onPress={() => handleTilePress(tile)}
                  style={{ flex: 1, minWidth: 0 }}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  }, [
    selection,
    categoryTiles,
    resolveItemLabel,
    handleTilePress,
    t,
  ]);

  const listEmpty = useMemo((): React.ReactElement => {
    if (showComingSoon) {
      return (
        <View
          style={{
            paddingVertical: 56,
            paddingHorizontal: 24,
            alignItems: "center",
          }}
          accessibilityRole="text"
          accessibilityLabel={t("shop.comingSoon")}
        >
          <Ionicons name="time-outline" size={28} color={tokens.muted} />
          <Text
            style={{
              marginTop: 12,
              textAlign: "center",
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              letterSpacing: 0.2,
            }}
          >
            {t("shop.comingSoon")}
          </Text>
        </View>
      );
    }
    // Occupation overview already shows the 3-across Coming Soon grid —
    // avoid a redundant "no products" line under the placeholders.
    if (selection === null || selection.categoryId === null) {
      return <View style={{ height: 8 }} />;
    }
    return (
      <Text
        style={{
          textAlign: "center",
          color: tokens.muted,
          paddingVertical: 48,
          paddingHorizontal: 16,
          fontFamily: "Inter_400Regular",
          fontSize: 14,
        }}
      >
        {t("shop.emptyProducts")}
      </Text>
    );
  }, [showComingSoon, selection, t]);

  const listFooter = useMemo((): React.ReactElement => {
    if (
      (canRevealMoreLoaded || loadingMore || hasMore) &&
      visibleProducts.length > 0
    ) {
      return (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <ActivityIndicator size="small" color={tokens.accent} />
          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              color: tokens.muted,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("shop.loadingMore")}
          </Text>
        </View>
      );
    }
    return <View style={{ height: 24 }} />;
  }, [
    canRevealMoreLoaded,
    loadingMore,
    hasMore,
    visibleProducts.length,
    t,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: tokens.bg }}>
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
              paddingHorizontal: 12,
              paddingTop: 10,
              paddingBottom: 8,
              gap: 6,
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
                borderColor: tokens.border,
                backgroundColor: tokens.panel,
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={tokens.muted}
              />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: tokens.text,
                  fontFamily: "Inter_400Regular",
                }}
                placeholder={t("search.placeholder")}
                placeholderTextColor={tokens.muted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t("shop.searchAria")}
              />
            </View>

            <NotificationBellButton color={tokens.text} returnTo="shop" />

            <TourAnchor id={ANCHORS.home.bag}>
              <CartButton
                color={tokens.text}
                accessibilityLabel={t("nav.openCart")}
              />
            </TourAnchor>
          </View>
          {play ? (
            <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
              <GoldSweep
                play={play}
                delayMs={entranceBaseDelayMs + 100}
                height={1.5}
              />
            </View>
          ) : null}
        </CeremonySection>
        <View style={{ height: 1, backgroundColor: tokens.border }} />
      </SafeAreaView>

      <TourAnchor id={ANCHORS.shop.grid} style={{ flex: 1 }}>
        <CeremonySection
          index={1}
          play={play}
          baseDelayMs={entranceBaseDelayMs}
          durationMs={entranceDurationMs}
          staggerMs={entranceStaggerMs}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, flexDirection: "row" }}>
            {/* Left: occupations only */}
            <View
              style={{
                width: SIDEBAR_WIDTH_PERCENT,
                borderRightWidth: 1,
                borderRightColor: tokens.border,
                backgroundColor: tokens.bg,
              }}
            >
              <FlatList
                ref={sidebarListRef}
                data={sidebarItems}
                keyExtractor={(item) => `${item.kind}:${item.id}`}
                renderItem={renderSidebarItem}
                showsVerticalScrollIndicator={false}
                initialNumToRender={STOREFRONT_SHOP_SIDEBAR_INITIAL}
                maxToRenderPerBatch={STOREFRONT_SHOP_SIDEBAR_MAX_BATCH}
                windowSize={STOREFRONT_LIST_WINDOW_SIZE}
                updateCellsBatchingPeriod={STOREFRONT_LIST_UPDATE_CELLS_MS}
                removeClippedSubviews={STOREFRONT_LIST_REMOVE_CLIPPED_SUBVIEWS}
                onScrollToIndexFailed={(info) => {
                  sidebarListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }}
                ListEmptyComponent={
                  <Text
                    style={{
                      padding: 12,
                      fontSize: 12,
                      color: tokens.muted,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {t("shop.sidebarEmpty")}
                  </Text>
                }
              />
            </View>

            {/* Right: category tiles + 2-col lazy products */}
            <View
              style={{ flex: 1 }}
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                setRightPaneWidth((prev) => (prev === width ? prev : width));
              }}
            >
              <FlatList
                data={showComingSoon ? [] : visibleProducts}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{
                  paddingHorizontal: RIGHT_PAD,
                  gap: PRODUCT_GAP,
                  marginBottom: PRODUCT_GAP,
                }}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={listEmpty}
                ListFooterComponent={listFooter}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4}
                showsVerticalScrollIndicator={false}
                initialNumToRender={STOREFRONT_SHOP_PRODUCT_INITIAL}
                maxToRenderPerBatch={STOREFRONT_SHOP_PRODUCT_MAX_BATCH}
                windowSize={STOREFRONT_LIST_WINDOW_SIZE}
                updateCellsBatchingPeriod={STOREFRONT_LIST_UPDATE_CELLS_MS}
                removeClippedSubviews={STOREFRONT_LIST_REMOVE_CLIPPED_SUBVIEWS}
                contentContainerStyle={{
                  paddingTop: 10,
                  paddingBottom: 100,
                  flexGrow: 1,
                }}
                renderItem={renderProductItem}
              />
            </View>
          </View>
        </CeremonySection>
      </TourAnchor>
    </View>
  );
}
