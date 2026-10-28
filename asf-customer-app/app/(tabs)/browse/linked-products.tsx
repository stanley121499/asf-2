import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LinkedProductsAwardHost } from "@/components/motion/ContentViewAwardHost";
import { heroVariantShowsLinkedProductsCategoryRail } from "@/components/designPreview/home";
import { StorefrontHomeCategoryRail } from "@/components/storefront/StorefrontHomeCategoryRail";
import { StorefrontProductTile } from "@/components/storefront/StorefrontProductTile";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useDesignPreview } from "@/context/DesignPreviewContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePostContext } from "@/context/post/PostContext";
import {
  useCategoryContext,
  type Category,
} from "@/context/product/CategoryContext";
import type { Product } from "@/context/product/ProductContext";
import { useProductContext } from "@/context/product/ProductContext";
import {
  useOptionalPromotionContext,
  type Promotion,
} from "@/context/PromotionContext";
import {
  openBrowseProduct,
  resolveLinkedProductsId,
  resolveLinkedProductsKind,
} from "@/lib/browseNavigation";
import { HOME_SPACE } from "@/lib/homeLayout";
import { resolvePromotionDisplayTitle } from "@/lib/promotions/activePromotions";
import {
  buildCategoriesById,
  listKindKeys,
  productMatchesKindKey,
  type HomeFilterProduct,
  type HomeKindFilter,
} from "@/lib/storefront/homeCategoryFilter";
import {
  resolvePostLinkedProductIds,
  resolvePromotionLinkedProductIds,
  type LinkedCatalogProduct,
} from "@/lib/storefront/linkedProducts";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/** Horizontal padding for the 2-col linked product grid. */
const LINKED_LIST_PADDING = 16;

/** Gap between the two product columns. */
const LINKED_LIST_GAP = HOME_SPACE.sm;

/** Known `kind_key` values with UI fallback labels under `home.kind.*`. */
const KIND_I18N_FALLBACK_KEYS = new Set(["shoes", "bags", "accessories"]);

/**
 * Maps a catalog {@link Product} into the shape expected by linked resolvers.
 */
function toLinkedCatalogProduct(product: Product): LinkedCatalogProduct {
  return {
    id: product.id,
    department_id: product.department_id,
    range_id: product.range_id,
    category_id: product.category_id,
    brand_id: product.brand_id,
    deleted_at: product.deleted_at,
    product_categories: product.product_categories,
  };
}

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
 * Resolves a localized kind-chip label from categories sharing `kindKey`.
 *
 * Prefers ContentTranslation on the first matching category (stable by id),
 * then `home.kind.<kindKey>` for known mock kinds, then the raw slug.
 *
 * @param kindKey - Target `categories.kind_key`
 * @param categories - Active catalog categories
 * @param translateCategory - Content-translation resolver for category names
 * @param t - i18n lookup
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
 * Filters an already-resolved linked product list by the Home kind rail.
 *
 * - `All`: full linked set unchanged
 * - `kind`: keeps products whose `category_id` / `product_categories` match
 *   that `kind_key` (unassigned excluded). Does **not** re-apply newest /
 *   published eligibility — the linked resolver already chose the set.
 *
 * @param products - Full linked product rows for the route entity
 * @param filter - Active kind rail selection
 * @param categoriesById - Active categories keyed by id
 */
function filterLinkedProductsByKind(
  products: readonly Product[],
  filter: HomeKindFilter,
  categoriesById: ReturnType<typeof buildCategoriesById>
): Product[] {
  if (filter.type === "all") {
    return [...products];
  }
  return products.filter((product) =>
    productMatchesKindKey(
      toHomeFilterProduct(product),
      filter.kindKey,
      categoriesById
    )
  );
}

/**
 * Resolves the full (uncapped) linked product list for a post or promotion.
 *
 * @param kind - Entity kind from the route
 * @param entityId - Post or promotion uuid
 * @param posts - PostContext rows (taxonomy + `post_products`)
 * @param promotions - PromotionContext rows (`product_ids`)
 * @param products - Full catalog
 */
function resolveLinkedProductsForRoute(
  kind: "post" | "promotion",
  entityId: string,
  posts: ReadonlyArray<{
    id: string;
    department_id: string | null;
    range_id: string | null;
    category_id: string | null;
    brand_id: string | null;
    post_products: ReadonlyArray<{ product_id: string }>;
  }>,
  promotions: readonly Promotion[],
  products: readonly Product[]
): Product[] {
  const catalog = products.map(toLinkedCatalogProduct);
  const byId = new Map(products.map((p) => [p.id, p] as const));

  let ids: string[] = [];
  if (kind === "post") {
    const post = posts.find((p) => p.id === entityId);
    if (post === undefined) {
      return [];
    }
    ids = resolvePostLinkedProductIds(
      {
        id: post.id,
        department_id: post.department_id,
        range_id: post.range_id,
        category_id: post.category_id,
        brand_id: post.brand_id,
        explicitProductIds: post.post_products.map((row) => row.product_id),
      },
      catalog
    );
  } else {
    const promo = promotions.find((p) => p.id === entityId);
    if (promo === undefined) {
      return [];
    }
    ids = resolvePromotionLinkedProductIds(
      promo.id,
      promo.product_ids.map((productId) => ({
        promotion_id: promo.id,
        product_id: productId,
      })),
      catalog
    );
  }

  const resolved: Product[] = [];
  for (const id of ids) {
    const product = byId.get(id);
    if (product !== undefined) {
      resolved.push(product);
    }
  }
  return resolved;
}

/**
 * Storefront linked-products list route (plan §3.3 / R12).
 *
 * Query: `kind=post|promotion&id=<uuid>`. Shows the **full** linked set
 * (no 6-cap). Empty / invalid id → calm empty state.
 *
 * Design Lab variant E adds a Home-style kind category rail that filters
 * the linked set in place via `category_id` / `product_categories`.
 */
export default function LinkedProductsScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{
    kind?: string | string[];
    id?: string | string[];
  }>();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { translatePost, translateCategory } = useContentTranslation();
  const { products, loading: productsLoading } = useProductContext();
  const { posts, loading: postsLoading } = usePostContext();
  const { categories } = useCategoryContext();
  const promoCtx = useOptionalPromotionContext();
  const { heroVariant } = useDesignPreview();

  const kind = resolveLinkedProductsKind(params.kind);
  const entityId = resolveLinkedProductsId(params.id);

  const promotions = promoCtx?.promotions ?? [];
  const promotionsLoading = promoCtx?.loading === true;

  /**
   * Variant E only: show Home-style kind chips and filter the linked list
   * in place. Other variants keep the uncapped linked list unchanged.
   */
  const showCategoryRail =
    heroVariantShowsLinkedProductsCategoryRail(heroVariant);

  const [kindFilter, setKindFilter] = useState<HomeKindFilter>({
    type: "all",
  });

  const kindKeys = useMemo(() => listKindKeys(categories), [categories]);

  const categoriesById = useMemo(
    () => buildCategoriesById(categories),
    [categories]
  );

  const resolveKindLabel = useCallback(
    (kindKey: string): string =>
      resolveKindChipLabel(kindKey, categories, translateCategory, t),
    [categories, translateCategory, t]
  );

  const title = useMemo((): string => {
    if (kind === null || entityId === null) {
      return t("browse.linkedProductsTitle");
    }
    if (kind === "post") {
      const post = posts.find((p) => p.id === entityId);
      if (post === undefined) {
        return t("browse.linkedProductsTitle");
      }
      const translated = translatePost(post.id, "name", post.name ?? null);
      return translated.length > 0
        ? translated
        : t("browse.linkedProductsTitle");
    }
    const promo = promotions.find((p) => p.id === entityId);
    if (promo === undefined) {
      return t("browse.linkedProductsTitle");
    }
    const display = resolvePromotionDisplayTitle(promo, locale);
    return display.length > 0
      ? display
      : t("browse.linkedProductsTitle");
  }, [
    kind,
    entityId,
    posts,
    promotions,
    translatePost,
    locale,
    t,
  ]);

  const linkedProducts = useMemo((): Product[] => {
    if (kind === null || entityId === null) {
      return [];
    }
    return resolveLinkedProductsForRoute(
      kind,
      entityId,
      posts,
      promotions,
      products
    );
  }, [kind, entityId, posts, promotions, products]);

  const displayedProducts = useMemo((): Product[] => {
    if (!showCategoryRail) {
      return linkedProducts;
    }
    return filterLinkedProductsByKind(
      linkedProducts,
      kindFilter,
      categoriesById
    );
  }, [showCategoryRail, linkedProducts, kindFilter, categoriesById]);

  const isLoading =
    productsLoading ||
    postsLoading ||
    (kind === "promotion" && promotionsLoading);

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
        onSelect={setKindFilter}
        resolveKindLabel={resolveKindLabel}
        allLabel={t("home.categoryFilterAll")}
        style={{
          backgroundColor: tokens.bg,
          borderBottomColor: tokens.border,
        }}
      />
    ) : null;

  let body: React.ReactElement;
  if (isLoading) {
    body = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  } else if (displayedProducts.length === 0) {
    body = (
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
          {t("browse.linkedProductsEmpty")}
        </Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          gap: LINKED_LIST_GAP,
          paddingHorizontal: LINKED_LIST_PADDING,
          marginBottom: LINKED_LIST_GAP,
        }}
        contentContainerStyle={{
          paddingTop: HOME_SPACE.md,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
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
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: tokens.bg }}
    >
      {header}
      {categoryRail}
      {body}
      <LinkedProductsAwardHost kind={kind} entityId={entityId} />
    </SafeAreaView>
  );
}
