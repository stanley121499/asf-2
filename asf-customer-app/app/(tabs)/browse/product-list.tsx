import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { heroVariantShowsLinkedProductsCategoryRail } from "@/components/designPreview/home";
import { StorefrontHomeCategoryRail } from "@/components/storefront/StorefrontHomeCategoryRail";
import { StorefrontProductTile } from "@/components/storefront/StorefrontProductTile";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useDesignPreview } from "@/context/DesignPreviewContext";
import { useTranslation } from "@/context/LocaleContext";
import {
  useCategoryContext,
  type Category,
} from "@/context/product/CategoryContext";
import {
  useProductContext,
  type Product,
} from "@/context/product/ProductContext";
import {
  openBrowseProduct,
  resolveBrowseProductListKindKey,
  resolveBrowseProductListScope,
} from "@/lib/browseNavigation";
import { HOME_SPACE } from "@/lib/homeLayout";
import {
  buildCategoriesById,
  filterProductsForHome,
  listKindKeys,
  type HomeFilterProduct,
  type HomeKindFilter,
} from "@/lib/storefront/homeCategoryFilter";
import { sortProductsNewestFirst } from "@/lib/storefront/newestProducts";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/** Horizontal padding for the 2-col product grid. */
const PRODUCT_LIST_PADDING = 16;

/** Gap between the two product columns. */
const PRODUCT_LIST_GAP = HOME_SPACE.sm;

/** Known `kind_key` values with UI fallback labels under `home.kind.*`. */
const KIND_I18N_FALLBACK_KEYS = new Set(["shoes", "bags", "accessories"]);

/**
 * Maps a catalog {@link Product} into the Home kind-filter product shape.
 */
function toHomeFilterProduct(product: Product): HomeFilterProduct {
  return {
    id: product.id,
    name: product.name,
    created_at: product.created_at,
    deleted_at: product.deleted_at,
    status: product.status,
    department_id: product.department_id,
    range_id: product.range_id,
    category_id: product.category_id,
    brand_id: product.brand_id,
    product_categories: product.product_categories,
  };
}

/**
 * Resolves a localized kind label from categories sharing `kindKey`.
 *
 * Prefers ContentTranslation on the first matching category (stable by id),
 * then `home.kind.<kindKey>` for known mock kinds, then `browse.kindProducts`.
 */
function resolveProductListKindTitle(
  kindKey: string,
  categories: readonly Category[],
  translateCategory: (id: string, baseName: string | null) => string,
  t: (key: string) => string
): string {
  const target = kindKey.trim();
  if (target.length === 0) {
    return t("browse.kindProducts");
  }

  const matches = categories
    .filter((category) => {
      const key = category.kind_key;
      return typeof key === "string" && key.trim() === target;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const first = matches[0];
  const categoryLabel =
    first !== undefined
      ? translateCategory(first.id, first.name ?? null).trim()
      : "";

  // Prefer a real display name over the raw kind_key slug.
  if (
    categoryLabel.length > 0 &&
    categoryLabel.toLowerCase() !== target.toLowerCase()
  ) {
    return categoryLabel;
  }

  if (KIND_I18N_FALLBACK_KEYS.has(target)) {
    return t(`home.kind.${target}`);
  }

  if (categoryLabel.length > 0) {
    return categoryLabel;
  }

  return t("browse.kindProducts");
}

/**
 * Resolves a localized kind-chip label from categories sharing `kindKey`.
 *
 * Prefers ContentTranslation on the first matching category (stable by id),
 * then `home.kind.<kindKey>` for known mock kinds, then the raw slug.
 */
function resolveKindChipLabel(
  kindKey: string,
  categories: readonly Category[],
  translateCategory: (id: string, baseName: string | null) => string,
  t: (key: string) => string
): string {
  const target = kindKey.trim();
  if (target.length === 0) {
    return kindKey;
  }
  const matches = categories
    .filter((category) => {
      const key = category.kind_key;
      return typeof key === "string" && key.trim() === target;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const first = matches[0];
  const categoryLabel =
    first !== undefined
      ? translateCategory(first.id, first.name ?? null).trim()
      : "";

  if (
    categoryLabel.length > 0 &&
    categoryLabel.toLowerCase() !== target.toLowerCase()
  ) {
    return categoryLabel;
  }

  if (KIND_I18N_FALLBACK_KEYS.has(target)) {
    return t(`home.kind.${target}`);
  }

  if (categoryLabel.length > 0) {
    return categoryLabel;
  }

  return target;
}

/**
 * Builds the route-derived kind filter from product-list query params.
 */
function routeKindFilter(
  scope: ReturnType<typeof resolveBrowseProductListScope>,
  kindKey: string | null
): HomeKindFilter {
  if (scope === "kind" && kindKey !== null) {
    return { type: "kind", kindKey };
  }
  return { type: "all" };
}

/**
 * Storefront uncapped product-list route for Home arrivals **See all** (plan §3.6).
 *
 * Query: `scope=all|kind` + optional `kindKey` when `scope=kind`.
 * Filtering matches Home arrivals: All includes unassigned; kind excludes them.
 *
 * Design Lab variant E adds a Home-style kind category rail that filters the
 * catalog list in place via `category_id` / `product_categories` (same gate
 * as linked-products).
 */
export default function ProductListScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{
    scope?: string | string[];
    kindKey?: string | string[];
  }>();
  const { t } = useTranslation();
  const { translateCategory } = useContentTranslation();
  const { heroVariant } = useDesignPreview();
  const {
    products,
    loading: productsLoading,
    hasMore,
    loadingMore,
    loadMoreProducts,
  } = useProductContext();
  const { categories, loading: categoriesLoading } = useCategoryContext();

  const scope = resolveBrowseProductListScope(params.scope);
  const kindKey = resolveBrowseProductListKindKey(params.kindKey);

  /** Params are usable when scope is all, or kind with a non-empty kindKey. */
  const paramsValid =
    scope === "all" || (scope === "kind" && kindKey !== null);

  /**
   * Variant E only: show Home-style kind chips and filter the catalog list
   * in place. Other variants keep route-scoped filtering only.
   */
  const showCategoryRail =
    heroVariantShowsLinkedProductsCategoryRail(heroVariant);

  const routeFilter = useMemo(
    (): HomeKindFilter => routeKindFilter(scope, kindKey),
    [scope, kindKey]
  );

  /**
   * Rail selection override. `null` means “follow the route filter” so
   * arriving from Home with a kind chip still opens that kind selected.
   */
  const [railOverride, setRailOverride] = useState<HomeKindFilter | null>(
    null
  );

  // Reset rail override when route params change (new See all push).
  useEffect(() => {
    setRailOverride(null);
  }, [scope, kindKey]);

  const kindFilter: HomeKindFilter =
    showCategoryRail && railOverride !== null ? railOverride : routeFilter;

  const kindKeys = useMemo(() => listKindKeys(categories), [categories]);

  const resolveKindLabel = useCallback(
    (key: string): string =>
      resolveKindChipLabel(key, categories, translateCategory, t),
    [categories, translateCategory, t]
  );

  const title = useMemo((): string => {
    if (!paramsValid) {
      return t("browse.allProducts");
    }
    if (scope === "kind" && kindKey !== null) {
      return resolveProductListKindTitle(
        kindKey,
        categories,
        translateCategory,
        t
      );
    }
    return t("browse.allProducts");
  }, [paramsValid, scope, kindKey, categories, translateCategory, t]);

  const listedProducts = useMemo((): Product[] => {
    if (!paramsValid || scope === null) {
      return [];
    }

    /**
     * With the category rail, filter against the full eligible catalog so
     * chips can switch All ↔ kinds freely. Without the rail, honor the
     * route scope only (prior See all behavior).
     */
    const filter: HomeKindFilter = showCategoryRail
      ? kindFilter
      : routeFilter;

    const categoriesById = buildCategoriesById(categories);
    const filterRows = products.map(toHomeFilterProduct);
    const filtered = filterProductsForHome(
      filterRows,
      filter,
      categoriesById
    );
    const ranked = sortProductsNewestFirst(filtered);
    const byId = new Map(products.map((product) => [product.id, product]));
    const ordered: Product[] = [];
    for (const row of ranked) {
      const match = byId.get(row.id);
      if (match !== undefined) {
        ordered.push(match);
      }
    }
    return ordered;
  }, [
    paramsValid,
    scope,
    showCategoryRail,
    kindFilter,
    routeFilter,
    products,
    categories,
  ]);

  const isLoading = productsLoading || categoriesLoading;

  /**
   * Kind/all lists may match nothing in P0 — keep paging until matches appear
   * or the catalog is exhausted before treating the screen as empty.
   */
  useEffect(() => {
    if (!paramsValid || isLoading || loadingMore || !hasMore) {
      return;
    }
    if (listedProducts.length > 0) {
      return;
    }
    void loadMoreProducts();
  }, [
    paramsValid,
    isLoading,
    loadingMore,
    hasMore,
    listedProducts.length,
    loadMoreProducts,
  ]);

  const header = (
    <View
      style={{
        height: 56,
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
        backgroundColor: tokens.bg,
        flexDirection: "row",
        paddingHorizontal: 48,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/");
          }
        }}
        hitSlop={12}
        style={{ position: "absolute", left: 12, padding: 4 }}
        accessibilityRole="button"
        accessibilityLabel={t("common.close")}
      >
        <Ionicons name="chevron-back" size={24} color={tokens.text} />
      </TouchableOpacity>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 18,
          color: tokens.text,
        }}
      >
        {title}
      </Text>
    </View>
  );

  const categoryRail =
    showCategoryRail ? (
      <StorefrontHomeCategoryRail
        kindKeys={kindKeys}
        selected={kindFilter}
        onSelect={setRailOverride}
        resolveKindLabel={resolveKindLabel}
        allLabel={t("home.categoryFilterAll")}
        style={{
          backgroundColor: tokens.bg,
          borderBottomColor: tokens.border,
        }}
      />
    ) : null;

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: tokens.bg }}
      >
        {header}
        {categoryRail}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!paramsValid || (listedProducts.length === 0 && !hasMore && !loadingMore)) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: tokens.bg }}
      >
        {header}
        {categoryRail}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="cube-outline" size={40} color={tokens.muted} />
          <Text
            style={{
              marginTop: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: tokens.muted,
              textAlign: "center",
            }}
          >
            {t("browse.productListEmpty")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (listedProducts.length === 0 && (hasMore || loadingMore)) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: tokens.bg }}
      >
        {header}
        {categoryRail}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: tokens.bg }}
    >
      {header}
      {categoryRail}
      <FlatList
        data={listedProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          gap: PRODUCT_LIST_GAP,
          paddingHorizontal: PRODUCT_LIST_PADDING,
          marginBottom: PRODUCT_LIST_GAP,
        }}
        contentContainerStyle={{
          paddingTop: HOME_SPACE.md,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            void loadMoreProducts();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color={tokens.accent} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <StorefrontProductTile
              product={item}
              onPress={(colorId) => {
                openBrowseProduct(router, item.id, {
                  returnTo: "home",
                  ...(colorId !== null ? { colorId } : {}),
                });
              }}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
