"use client";
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
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANCHORS, TourAnchor, useGuide } from "@/components/guide";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import {
  BelowFoldCategoryRail,
  CategoryMoodHero,
  CategoryProductPeek,
  CollapsingStickyHero,
  HeroCoverMedia,
  HERO_A_NAV_SCRIM,
  HERO_VARIANT_HORIZONTAL_PADDING,
  heroVariantBleedsUnderTopNav,
  heroVariantHidesFixedCategoryRail,
  heroVariantHidesHomeHeaderActions,
  OverlayCategoryRail,
  resolveHeroVariantMediaHeight,
  StrongSelectedCategoryRail,
} from "@/components/designPreview/home";
import {
  hasAttemptedFirstLaunchTrigger,
  hasSeenFirstGuide,
  markFirstLaunchTriggerAttempted,
} from "@/lib/appGuide";
import { useHomeHeroMediaUri } from "@/lib/homeHeroMedia";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useDesignPreview } from "@/context/DesignPreviewContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePostContext } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
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
import { useWishlistContext } from "@/context/WishlistContext";
import {
  HomeArrivalCeremony,
  useHomeCeremony,
} from "@/components/home/HomeArrivalCeremony";
import { HomeProductGrid } from "@/components/home/HomeProductGrid";
import { CeremonySection, PressableScale } from "@/components/motion";
import { StorefrontFeedBlock } from "@/components/storefront/StorefrontFeedBlock";
import { StorefrontHeaderActions } from "@/components/storefront/StorefrontHeaderActions";
import {
  STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT,
  StorefrontHomeCategoryRail,
} from "@/components/storefront/StorefrontHomeCategoryRail";
import { StorefrontProductTile } from "@/components/storefront/StorefrontProductTile";
import { StorefrontSeeAllButton } from "@/components/storefront/StorefrontSeeAllButton";
import {
  openBrowseProduct,
  openBrowseProductList,
  openLinkedProducts,
} from "@/lib/browseNavigation";
import type { HeroVariantId } from "@/lib/designPreview";
import {
  HOME_CLASSIC_OVERLAY_NAV_ROW_HEIGHT,
  HOME_GRID_COLUMNS,
  HOME_SPACE,
  getHomeGridMetrics,
} from "@/lib/homeLayout";
import {
  deferAfterPressFeedback,
  markInteractionBusy,
} from "@/lib/interactionBusy";
import { motion } from "@/lib/motion";
import {
  filterActivePromotions,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";
import {
  buildStorefrontFeedTimeline,
  STOREFRONT_FEED_PAGE_SIZE,
  type StorefrontFeedItem,
} from "@/lib/storefront/feedTimeline";
import {
  buildCategoriesById,
  filterProductsForHome,
  listKindKeys,
  pickLatestPostForHome,
  postMatchesHomeFilter,
  promotionMatchesHomeFilter,
  takeLatestArrivalProducts,
  type HomeFilterPost,
  type HomeFilterProduct,
  type HomeKindFilter,
} from "@/lib/storefront/homeCategoryFilter";
import {
  capLinkedProductIdsForFeed,
  buildEligibleLinkedProductIdSet,
  postHasLinkedProduct,
  promotionHasLinkedProduct,
  resolvePostLinkedProductIds,
  resolvePromotionLinkedProductIds,
  type LinkedCatalogProduct,
} from "@/lib/storefront/linkedProducts";
import {
  STOREFRONT_HOME_FEED_MAX_BATCH,
  STOREFRONT_LIST_REMOVE_CLIPPED_SUBVIEWS,
  STOREFRONT_LIST_UPDATE_CELLS_MS,
  STOREFRONT_LIST_WINDOW_SIZE,
} from "@/lib/storefront/listWindowing";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/**
 * Temporary Home section gates — flip any to `true` to restore that UI.
 * - Posts / promos: mixed timeline under Latest arrivals.
 * - Category bar: kind / occupation chips under search (fixed chrome +
 *   Design Lab alternate rails on Home). Shop / Categories tab is separate.
 * Hero + newest products stay independent of these flags.
 */
const SHOW_HOME_POSTS = false;
const SHOW_HOME_PROMOS = false;
const SHOW_HOME_CATEGORY_BAR = false;

/** Reanimated FlatList for variant C collapsing-hero scroll tracking. */
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<StorefrontFeedItem>);

/**
 * Storefront top bar row height (search + bell + bag), excluding the
 * top safe-area inset. Matches Classic chrome height for parity.
 */
const STOREFRONT_OVERLAY_NAV_ROW_HEIGHT = HOME_CLASSIC_OVERLAY_NAV_ROW_HEIGHT;

/**
 * In-flow chrome height under the status bar for the current category-rail
 * visibility and optional nav-row omission. Collapsed = nav row only (or
 * zero when the nav row is hidden) so list inset / hero usable height
 * shrink with the chrome instead of leaving a gap.
 *
 * @param categoriesVisible - Whether the fixed category rail is shown.
 * @param includeNavRow - When false (variant E), omit search/notif/cart row height.
 */
function storefrontInFlowChromeHeight(
  categoriesVisible: boolean,
  includeNavRow: boolean = true
): number {
  const nav = includeNavRow ? STOREFRONT_OVERLAY_NAV_ROW_HEIGHT : 0;
  const rail = categoriesVisible ? STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT : 0;
  return nav + rail;
}

/**
 * Fixed chrome stack under the status bar: optional nav row, optionally plus
 * the category rail. Search / bell / cart stay in the nav row when shown;
 * when the rail is shown, it sits immediately below the nav (or inset).
 *
 * @param topInset - Safe-area top inset.
 * @param categoriesVisible - Whether the category rail band is included.
 * @param includeNavRow - When false, chrome height excludes the action row.
 */
function storefrontFixedChromeHeight(
  topInset: number,
  categoriesVisible: boolean = true,
  includeNavRow: boolean = true
): number {
  const safeTop = Number.isFinite(topInset) ? Math.max(0, topInset) : 0;
  return safeTop + storefrontInFlowChromeHeight(categoriesVisible, includeNavRow);
}

/** Horizontal padding for Home section shells / headers. */
const HOME_HORIZONTAL_PADDING = HERO_VARIANT_HORIZONTAL_PADDING;

/**
 * Maps a catalog {@link Product} into the linked-products resolver shape.
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
 * Maps a post row into the Home kind-filter / hero picker shape.
 */
function toHomeFilterPost(post: {
  id: string;
  created_at: string;
  time_post: string | null;
  deleted_at?: string | null;
  active?: boolean | null;
  status?: string | null;
  department_id: string | null;
  range_id: string | null;
  category_id: string | null;
  brand_id: string | null;
  post_products: ReadonlyArray<{ product_id: string }>;
}): HomeFilterPost {
  return {
    id: post.id,
    created_at: post.created_at,
    time_post: post.time_post,
    deleted_at: post.deleted_at,
    active: post.active,
    status: post.status,
    department_id: post.department_id,
    range_id: post.range_id,
    category_id: post.category_id,
    brand_id: post.brand_id,
    explicitProductIds: post.post_products.map((row) => row.product_id),
  };
}

/** Known `kind_key` values with UI fallback labels under `home.kind.*`. */
const KIND_I18N_FALLBACK_KEYS = new Set(["shoes", "bags", "accessories"]);

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

/** Post shape needed to resolve linked product ids for a feed block. */
type FeedBlockPostSource = {
  id: string;
  department_id: string | null;
  range_id: string | null;
  category_id: string | null;
  brand_id: string | null;
  post_products: ReadonlyArray<{ product_id: string }>;
};

/**
 * Resolves uncapped linked product ids for a Home feed timeline item.
 * Uses a pre-built linked catalog (callers must memoize it — do not map
 * `products` per item on the unfreeze hot path).
 */
function resolveFeedItemLinkedProductIds(
  item: StorefrontFeedItem,
  posts: ReadonlyArray<FeedBlockPostSource>,
  promotions: readonly Promotion[],
  catalog: readonly LinkedCatalogProduct[]
): string[] {
  if (item.kind === "post") {
    const post = posts.find((p) => p.id === item.id);
    if (post === undefined) {
      return [];
    }
    return resolvePostLinkedProductIds(
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
  }

  const promo = promotions.find((p) => p.id === item.id);
  if (promo === undefined) {
    return [];
  }
  return resolvePromotionLinkedProductIds(
    promo.id,
    promo.product_ids.map((productId) => ({
      promotion_id: promo.id,
      product_id: productId,
    })),
    catalog
  );
}

/**
 * True when a feed timeline item has ≥1 linked product (early-exit).
 * Used to drop empty image + See all blocks without building full id lists.
 *
 * @param eligibleProductIds - Precomputed eligible catalog ids (promotions path)
 */
function feedItemHasLinkedProducts(
  item: StorefrontFeedItem,
  posts: ReadonlyArray<FeedBlockPostSource>,
  promotions: readonly Promotion[],
  catalog: readonly LinkedCatalogProduct[],
  eligibleProductIds: ReadonlySet<string>
): boolean {
  if (item.kind === "post") {
    const post = posts.find((p) => p.id === item.id);
    if (post === undefined) {
      return false;
    }
    return postHasLinkedProduct(
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
  }

  const promo = promotions.find((p) => p.id === item.id);
  if (promo === undefined) {
    return false;
  }
  return promotionHasLinkedProduct(
    promo.id,
    promo.product_ids.map((productId) => ({
      promotion_id: promo.id,
      product_id: productId,
    })),
    eligibleProductIds
  );
}

/**
 * Resolves up to six linked products for a Home feed block (plan §3.1 B).
 */
function resolveFeedBlockProducts(
  item: StorefrontFeedItem,
  posts: ReadonlyArray<FeedBlockPostSource>,
  promotions: readonly Promotion[],
  products: readonly Product[],
  catalog: readonly LinkedCatalogProduct[]
): Product[] {
  const byId = new Map(products.map((p) => [p.id, p] as const));
  const ids = resolveFeedItemLinkedProductIds(
    item,
    posts,
    promotions,
    catalog
  );
  const capped = capLinkedProductIdsForFeed(ids, 6);
  const resolved: Product[] = [];
  for (const id of capped) {
    const product = byId.get(id);
    if (product !== undefined) {
      resolved.push(product);
    }
  }
  return resolved;
}

interface SaveHeartButtonProps {
  /** Whether this is the first grid card — the only one anchored for the guide. */
  isFirstCard: boolean;
  saved: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Heart toggle on the first newest-grid tile — preserves `ANCHORS.home.saveHeart`
 * for App Guide tours without requiring Classic card chrome.
 */
function SaveHeartButton({
  isFirstCard,
  saved,
  onPress,
  accessibilityLabel,
}: SaveHeartButtonProps): React.ReactElement {
  const heart = (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{ padding: 4 }}
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons
        name={saved ? "heart" : "heart-outline"}
        size={18}
        color={saved ? tokens.accent : tokens.muted}
      />
    </Pressable>
  );

  if (!isFirstCard) {
    return heart;
  }

  return <TourAnchor id={ANCHORS.home.saveHeart}>{heart}</TourAnchor>;
}

/**
 * Storefront Home — category-type rail + filtered post hero / arrivals / feed
 * (occupation taxonomy plan §§3.4–3.5).
 *
 * Chrome: opaque fixed stack (status / category toggle · search · bell · cart /
 * optional category rail) for `current`, B, and C. Design Lab variants **A**
 * and **D** use transparent chrome + zero list `paddingTop` while a hero is
 * present so cover / mood media bleeds under the nav (lookbook under chrome);
 * a light frosted scrim keeps icons legible. Category rail defaults to shown;
 * the nav toggle collapses it and shrinks chrome height / list inset. Top rail
 * chips: All + `kind_key`; changing chip refilters hero, arrivals, and feed.
 *
 * Hero: latest matching post with ≥1 linked product via
 * {@link pickLatestPostForHome}; tap → linked-products. Null candidate → omit
 * hero (no product fallback).
 *
 * Arrivals: top 6 under filter via {@link takeLatestArrivalProducts}
 * (All includes unassigned; kind excludes them). Title `home.latestProducts`.
 * **See all** → {@link openBrowseProductList} (All vs kind from filter).
 *
 * Section B: mixed chronological posts ∪ promotions on the **filtered** stream
 * ({@link buildStorefrontFeedTimeline}), then drop items with zero linked
 * products; each remaining 2×3 has **See all** → linked list.
 * Page size {@link STOREFRONT_FEED_PAGE_SIZE}.
 * Gated by {@link SHOW_HOME_POSTS} / {@link SHOW_HOME_PROMOS} (both false → omit).
 */
export function StorefrontHomeScreen(): React.ReactElement {
  const { products, loading: productsLoading } = useProductContext();
  const { categories } = useCategoryContext();
  const { posts, loading: postsLoading, refreshPosts } = usePostContext();
  const { startTour } = useGuide();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { translateCategory } = useContentTranslation();
  const { heroVariant } = useDesignPreview();

  /**
   * If a gateway blip left posts empty after the provider's own retries,
   * schedule one quiet recovery refresh so the bleed hero can return without
   * requiring a full app restart (common after Metro HMR during outages).
   */
  const emptyPostsRecoveryAttemptedRef = useRef(false);
  useEffect(() => {
    if (postsLoading) {
      return;
    }
    if (posts.length > 0) {
      emptyPostsRecoveryAttemptedRef.current = false;
      return;
    }
    if (emptyPostsRecoveryAttemptedRef.current) {
      return;
    }
    emptyPostsRecoveryAttemptedRef.current = true;
    const timer = setTimeout(() => {
      void refreshPosts();
    }, 2500);
    return () => {
      clearTimeout(timer);
    };
  }, [posts.length, postsLoading, refreshPosts]);

  /** Home kind rail filter — default All (mixed catalog including unassigned). */
  const [kindFilter, setKindFilter] = useState<HomeKindFilter>({
    type: "all",
  });

  /**
   * Category selection bar (全部 / kind chips) visibility — default shown.
   * When hidden, fixed chrome and FlatList paddingTop shrink to the nav row
   * only so the hero sits flush under remaining chrome.
   * Design Lab variants A–D place categories elsewhere; fixed rail stays off.
   */
  const [categoriesVisible, setCategoriesVisible] = useState(true);

  const hideFixedCategoryRail = heroVariantHidesFixedCategoryRail(heroVariant);
  const hideHomeHeaderActions = heroVariantHidesHomeHeaderActions(heroVariant);
  /**
   * A–D place categories elsewhere (fixed rail off). Variant E keeps the
   * production rail always on (nav chrome / toggle are removed).
   * {@link SHOW_HOME_CATEGORY_BAR} forces the fixed rail + toggle off for
   * the shoes-only catalog without removing the code path.
   */
  const effectiveCategoriesVisible = !SHOW_HOME_CATEGORY_BAR
    ? false
    : hideFixedCategoryRail
      ? false
      : hideHomeHeaderActions
        ? true
        : categoriesVisible;

  const handleToggleCategoriesVisible = useCallback((): void => {
    if (
      !SHOW_HOME_CATEGORY_BAR ||
      hideFixedCategoryRail ||
      hideHomeHeaderActions
    ) {
      return;
    }
    setCategoriesVisible((previous) => !previous);
  }, [hideFixedCategoryRail, hideHomeHeaderActions]);

  /**
   * Stable string key for the active chip (object identity alone is fine for
   * memos after setState, but this documents the filter for body pagination).
   */
  const kindFilterKey =
    kindFilter.type === "all" ? "all" : `kind:${kindFilter.kindKey}`;

  /**
   * Triggers the first-launch App Guide once the home arrival ceremony has
   * settled. Guarded by session + persisted flags (same as Classic).
   */
  const handleCeremonyFinish = useCallback((): void => {
    if (hasAttemptedFirstLaunchTrigger()) {
      return;
    }
    markFirstLaunchTriggerAttempted();
    void (async (): Promise<void> => {
      const seen = await hasSeenFirstGuide();
      if (!seen) {
        startTour("firstLaunch");
      }
    })();
  }, [startTour]);

  const categoriesById = useMemo(
    () => buildCategoriesById(categories),
    [categories]
  );

  const kindKeys = useMemo(() => listKindKeys(categories), [categories]);

  const homeFilterProducts = useMemo(
    () => products.map(toHomeFilterProduct),
    [products]
  );

  /**
   * Products eligible under the active kind chip (All includes unassigned).
   */
  const filteredHomeProducts = useMemo(
    () =>
      filterProductsForHome(homeFilterProducts, kindFilter, categoriesById),
    [homeFilterProducts, kindFilter, categoriesById]
  );

  /**
   * Latest arrivals 2×3 — top 6 under filter (no product-hero split).
   * Order preserved from {@link takeLatestArrivalProducts} (newest first).
   */
  const arrivalsGrid = useMemo((): Product[] => {
    const newest = takeLatestArrivalProducts(filteredHomeProducts, 6);
    const byId = new Map(products.map((product) => [product.id, product]));
    const ordered: Product[] = [];
    for (const row of newest) {
      const match = byId.get(row.id);
      if (match !== undefined) {
        ordered.push(match);
      }
    }
    return ordered;
  }, [filteredHomeProducts, products]);

  /**
   * Full Product rows under the active kind filter (mood peek / URI fallback).
   * Capped so variant D never walks the full catalog on the Home hot path.
   */
  const filteredProductsForMood = useMemo((): Product[] => {
    const byId = new Map(products.map((product) => [product.id, product]));
    const ordered: Product[] = [];
    for (const row of filteredHomeProducts) {
      if (ordered.length >= 12) {
        break;
      }
      const match = byId.get(row.id);
      if (match !== undefined) {
        ordered.push(match);
      }
    }
    return ordered;
  }, [filteredHomeProducts, products]);

  /**
   * Post hero candidate under the active filter (plan §3.4 B).
   * Null → omit hero (no product fallback).
   */
  const heroPostCandidate = useMemo(() => {
    const filterPosts = posts.map(toHomeFilterPost);
    return pickLatestPostForHome(
      filterPosts,
      kindFilter,
      homeFilterProducts,
      categoriesById
    );
  }, [posts, kindFilter, homeFilterProducts, categoriesById]);

  const heroPostCandidateId =
    heroPostCandidate !== null ? heroPostCandidate.id : null;

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  /**
   * Hero media height for the active Design Lab variant. `current` / `e` use
   * ~¾ usable (1.5× prior ½-usable production band); C maximizes Round 4
   * cover; A uses ~0.8× of that cover (+ bleed). Variants A / D / E with a
   * hero add the under-nav bleed band so media can start at y=0.
   */
  const hasHero = heroPostCandidateId !== null;
  const includeNavRow = !hideHomeHeaderActions;
  const heroHeight = resolveHeroVariantMediaHeight({
    variant: heroVariant,
    windowHeight,
    topInset: insets.top,
    bottomInset: insets.bottom,
    inFlowHeaderHeight: storefrontInFlowChromeHeight(
      effectiveCategoriesVisible,
      includeNavRow
    ),
    hasHero,
    bleedUnderTopNav: heroVariantBleedsUnderTopNav(heroVariant) && hasHero,
  });

  const gridMetrics = useMemo(
    () =>
      getHomeGridMetrics({
        windowWidth,
        horizontalPadding: HOME_HORIZONTAL_PADDING,
        gap: HOME_SPACE.sm,
        columns: HOME_GRID_COLUMNS,
      }),
    [windowWidth]
  );

  const resolveKindLabel = useCallback(
    (kindKey: string): string =>
      resolveKindChipLabel(kindKey, categories, translateCategory, t),
    [categories, translateCategory, t]
  );

  /** Skeleton only while the catalog is empty — never flash over hydrated rows. */
  if (productsLoading && products.length === 0) {
    return <PageLoadingSkeleton variant="home" />;
  }

  let sectionIndex = 0;
  const heroIndex = hasHero ? sectionIndex : null;
  if (hasHero) {
    sectionIndex += 1;
  }
  /** Always show Latest arrivals under the rail (empty state when filter has none). */
  const latestIndex = sectionIndex;
  sectionIndex += 1;
  const lastContentIndex = Math.max(0, sectionIndex - 1);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <HomeArrivalCeremony
        lastContentIndex={lastContentIndex}
        style={{ flex: 1 }}
        onFinish={handleCeremonyFinish}
      >
        <StorefrontHomeBody
          heroVariant={heroVariant}
          kindFilter={kindFilter}
          kindFilterKey={kindFilterKey}
          onKindFilterChange={setKindFilter}
          kindKeys={kindKeys}
          resolveKindLabel={resolveKindLabel}
          categories={categories}
          categoriesById={categoriesById}
          heroPostCandidateId={heroPostCandidateId}
          grid={arrivalsGrid}
          filteredProductsForMood={filteredProductsForMood}
          heroHeight={heroHeight}
          gridMetrics={gridMetrics}
          heroIndex={heroIndex}
          latestIndex={latestIndex}
          topInset={insets.top}
          categoriesVisible={effectiveCategoriesVisible}
          showCategoryToggle={
            SHOW_HOME_CATEGORY_BAR &&
            !hideFixedCategoryRail &&
            !hideHomeHeaderActions
          }
          hideHeaderActions={hideHomeHeaderActions}
          onToggleCategoriesVisible={handleToggleCategoriesVisible}
        />
      </HomeArrivalCeremony>
    </View>
  );
}

type StorefrontHomeBodyProps = {
  /** Design Lab hero / category layout variant. */
  heroVariant: HeroVariantId;
  /** Active kind rail filter. */
  kindFilter: HomeKindFilter;
  /** Stable string form of {@link kindFilter} for pagination / list keys. */
  kindFilterKey: string;
  /** Updates the kind rail selection. */
  onKindFilterChange: (filter: HomeKindFilter) => void;
  /** Distinct kind keys for chips. */
  kindKeys: readonly string[];
  /** Localized label resolver for a kind chip. */
  resolveKindLabel: (kindKey: string) => string;
  /** Active categories (mood URI for variant D). */
  categories: readonly Category[];
  /** Active categories keyed by id (kind matching). */
  categoriesById: ReturnType<typeof buildCategoriesById>;
  /**
   * Latest matching post id for the active filter (plan §3.4 B).
   * Null when no eligible post — omit hero (no product fallback).
   */
  heroPostCandidateId: string | null;
  /** Latest arrivals under filter (up to 6). */
  grid: Product[];
  /** Capped filtered products for variant D mood / peek. */
  filteredProductsForMood: readonly Product[];
  /** Hero media height (below fixed chrome, or under-nav bleed for A / D). */
  heroHeight: number;
  /** 2-col grid metrics for newest tiles. */
  gridMetrics: ReturnType<typeof getHomeGridMetrics>;
  heroIndex: number | null;
  latestIndex: number | null;
  /** Top safe-area inset for fixed chrome positioning. */
  topInset: number;
  /** Whether the category selection rail is shown (default true from parent). */
  categoriesVisible: boolean;
  /** When false, hides the nav chevron (variants A–D own category placement). */
  showCategoryToggle: boolean;
  /**
   * When true (variant E), Home omits search / notification / cart chrome.
   * Other tabs keep {@link StorefrontHeaderActions} unchanged.
   */
  hideHeaderActions: boolean;
  /** Toggles category rail visibility from the nav chrome control. */
  onToggleCategoriesVisible: () => void;
};

interface StorefrontHomeFixedChromeProps {
  /** Top safe-area inset from `useSafeAreaInsets()`. */
  topInset: number;
  /** Active kind rail filter. */
  kindFilter: HomeKindFilter;
  /** Updates the kind rail selection. */
  onKindFilterChange: (filter: HomeKindFilter) => void;
  /** Distinct kind keys for chips. */
  kindKeys: readonly string[];
  /** Localized label resolver for a kind chip. */
  resolveKindLabel: (kindKey: string) => string;
  /** Localized label for the All chip. */
  allLabel: string;
  /** Whether the category selection rail is rendered under the nav row. */
  categoriesVisible: boolean;
  /** When false, omit the category show/hide chevron. */
  showCategoryToggle: boolean;
  /**
   * When true (Design Lab variant E), omit search / notification / cart and
   * collapse the nav action row so only safe-area + optional category rail remain.
   */
  hideHeaderActions: boolean;
  /** Toggles category rail visibility. */
  onToggleCategoriesVisible: () => void;
  /** Accessibility label for the category show/hide control. */
  categoriesToggleLabel: string;
  /**
   * Reports the chrome's actual rendered height from a real `onLayout`
   * measurement (not just the computed `chromeHeight` value). The caller
   * uses this to drive the scroll content's `paddingTop` so content is
   * guaranteed to start below whatever height this chrome *actually*
   * painted at — self-correcting even if some device/engine measurement
   * quirk ever makes the live layout diverge from the computed number.
   */
  onMeasuredHeight?: (height: number) => void;
  /**
   * Variants A / D / E immersive mode: transparent chrome so cover / mood media
   * shows through under the nav, with one uniform frosted scrim for icon legibility.
   */
  overlayOnHero?: boolean;
}

/**
 * Fixed Home chrome — category toggle · search · bell · cart, then the
 * optional category rail pinned directly underneath. Stays put while Home
 * content scrolls beneath.
 *
 * Default: opaque `tokens.bg` so feed/hero never shows through the nav.
 * When {@link StorefrontHomeFixedChromeProps.overlayOnHero} is true (variants
 * A / D / E), chrome is transparent with one uniform frosted scrim so cover
 * media bleeds under the nav while controls stay tappable and readable.
 * Variant E sets {@link StorefrontHomeFixedChromeProps.hideHeaderActions} so
 * the search / notification / cart row is omitted on Home only.
 */
function StorefrontHomeFixedChrome({
  topInset,
  kindFilter,
  onKindFilterChange,
  kindKeys,
  resolveKindLabel,
  allLabel,
  categoriesVisible,
  showCategoryToggle,
  hideHeaderActions,
  onToggleCategoriesVisible,
  categoriesToggleLabel,
  onMeasuredHeight,
  overlayOnHero = false,
}: StorefrontHomeFixedChromeProps): React.ReactElement {
  const includeNavRow = !hideHeaderActions;
  const chromeHeight = storefrontFixedChromeHeight(
    topInset,
    categoriesVisible,
    includeNavRow
  );

  return (
    <View
      onLayout={(event) => {
        const measured = event.nativeEvent.layout.height;
        if (
          typeof onMeasuredHeight === "function" &&
          Number.isFinite(measured) &&
          measured > 0
        ) {
          onMeasuredHeight(measured);
        }
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        height: chromeHeight,
        backgroundColor: overlayOnHero ? "transparent" : tokens.bg,
        /**
         * Explicit, never-wrapping vertical stack: nav row then optional rail,
         * each pinned to its own slice of `chromeHeight`. `overflow: "hidden"`
         * guarantees neither child can ever paint outside this fixed band —
         * i.e. the rail can never bleed upward over the nav icons, and the
         * nav row can never bleed downward into content, regardless of any
         * font-metric or measurement drift on a given device/engine.
         */
        flexDirection: "column",
        overflow: "hidden",
      }}
      pointerEvents="box-none"
    >
      {overlayOnHero ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: chromeHeight,
            backgroundColor: HERO_A_NAV_SCRIM,
          }}
        />
      ) : null}
      <View
        style={{
          paddingTop: topInset,
          paddingHorizontal: HOME_HORIZONTAL_PADDING,
          backgroundColor: "transparent",
          /** Never shrink below `topInset` (+ nav when shown). */
          flexGrow: 0,
          flexShrink: 0,
        }}
      >
        {includeNavRow ? (
          <View
            style={{
              height: STOREFRONT_OVERLAY_NAV_ROW_HEIGHT,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              {showCategoryToggle ? (
                <PressableScale
                  haptic="light"
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={onToggleCategoriesVisible}
                  accessibilityRole="button"
                  accessibilityLabel={categoriesToggleLabel}
                  accessibilityState={{ expanded: categoriesVisible }}
                >
                  <Ionicons
                    name={
                      categoriesVisible
                        ? "chevron-up-outline"
                        : "chevron-down-outline"
                    }
                    size={22}
                    color={tokens.text}
                  />
                </PressableScale>
              ) : null}
              <StorefrontHeaderActions color={tokens.text} />
            </View>
          </View>
        ) : null}
      </View>
      {categoriesVisible ? (
        <StorefrontHomeCategoryRail
          kindKeys={kindKeys}
          selected={kindFilter}
          onSelect={onKindFilterChange}
          resolveKindLabel={resolveKindLabel}
          allLabel={allLabel}
          style={{
            backgroundColor: "transparent",
            borderBottomColor: tokens.border,
            /** Never shrink/grow below its fixed band — see chrome comment above. */
            flexGrow: 0,
            flexShrink: 0,
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * Storefront Home content under {@link HomeArrivalCeremony}.
 */
function StorefrontHomeBody({
  heroVariant,
  kindFilter,
  kindFilterKey,
  onKindFilterChange,
  kindKeys,
  resolveKindLabel,
  categories,
  categoriesById,
  heroPostCandidateId,
  grid,
  filteredProductsForMood,
  heroHeight,
  gridMetrics,
  heroIndex,
  latestIndex,
  topInset,
  categoriesVisible,
  showCategoryToggle,
  hideHeaderActions,
  onToggleCategoriesVisible,
}: StorefrontHomeBodyProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { translatePost } = useContentTranslation();
  const { isInWishlist, addToWishlist, removeFromWishlist } =
    useWishlistContext();
  const { play, contentBaseDelayMs } = useHomeCeremony();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { products } = useProductContext();
  const promoCtx = useOptionalPromotionContext();
  const promotionRows = promoCtx !== null ? promoCtx.promotions : null;
  /** DB cover via `homepage_elements` type=hero → post media; constant fallback. */
  const { heroPostId: dbHeroPostId, heroUri: dbHeroUri } =
    useHomeHeroMediaUri(postMedias);

  const [feedPageCount, setFeedPageCount] = useState(1);
  const scrollY = useSharedValue(0);

  /**
   * Variant C reserves the *expanded* collapsing-header band in list
   * padding (constant). The absolute header shrinks visually on scroll;
   * mutating paddingTop would jump content.
   */
  const collapseRailHeight = SHOW_HOME_CATEGORY_BAR
    ? STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT
    : 0;
  const collapseExpandedBand =
    heroVariant === "c"
      ? heroPostCandidateId !== null && heroHeight > 0
        ? heroHeight + collapseRailHeight
        : collapseRailHeight
      : 0;

  /**
   * Reset feed pagination when the kind chip changes so page 1 reflects
   * the filtered stream (hero candidate tracks the same filter change).
   */
  useEffect(() => {
    setFeedPageCount(1);
  }, [kindFilterKey]);

  const activePromotions = useMemo(
    () =>
      SHOW_HOME_PROMOS && promotionRows !== null
        ? filterActivePromotions(promotionRows)
        : [],
    [promotionRows]
  );

  const homeFilterProducts = useMemo(
    () => products.map(toHomeFilterProduct),
    [products]
  );

  /**
   * Catalog projection for linked-product resolution — built once per products
   * identity so feed filter / renderItem do not remap the full list per row
   * (was the main JS cost when Home unfroze after Shop page appends).
   * Skipped while the Home post/promo feed is fully gated off.
   */
  const linkedCatalog = useMemo(
    () =>
      SHOW_HOME_POSTS || SHOW_HOME_PROMOS
        ? products.map(toLinkedCatalogProduct)
        : [],
    [products]
  );

  const eligibleLinkedProductIds = useMemo(
    () =>
      SHOW_HOME_POSTS || SHOW_HOME_PROMOS
        ? buildEligibleLinkedProductIdSet(linkedCatalog)
        : new Set<string>(),
    [linkedCatalog]
  );

  /**
   * Posts remaining under the active kind filter (plan §3.5).
   * Skipped while {@link SHOW_HOME_POSTS} is false.
   */
  const filteredPosts = useMemo(() => {
    if (!SHOW_HOME_POSTS) {
      return [];
    }
    return posts.filter((post) =>
      postMatchesHomeFilter(
        toHomeFilterPost(post),
        kindFilter,
        homeFilterProducts,
        categoriesById
      )
    );
  }, [posts, kindFilter, homeFilterProducts, categoriesById]);

  /**
   * Promotions remaining under the active kind filter (plan §3.5).
   * Skipped while {@link SHOW_HOME_PROMOS} is false.
   */
  const filteredPromotions = useMemo(() => {
    if (!SHOW_HOME_PROMOS) {
      return [];
    }
    return activePromotions.filter((promo) =>
      promotionMatchesHomeFilter(
        {
          id: promo.id,
          created_at: promo.created_at,
          start_date: promo.start_date,
          deleted_at: promo.deleted_at,
          active: promo.active,
          status: promo.status,
        },
        kindFilter,
        promo.product_ids.map((productId) => ({
          promotion_id: promo.id,
          product_id: productId,
        })),
        homeFilterProducts,
        categoriesById
      )
    );
  }, [activePromotions, kindFilter, homeFilterProducts, categoriesById]);

  /**
   * First media URL per post (lowest arrangement first when available).
   * Skipped while {@link SHOW_HOME_POSTS} is false (feed blocks only).
   */
  const postMediaMap = useMemo(() => {
    if (!SHOW_HOME_POSTS) {
      return new Map<string, string>();
    }
    const sorted = [...postMedias].sort((a, b) => {
      const aArr = a.arrangement ?? Number.MAX_SAFE_INTEGER;
      const bArr = b.arrangement ?? Number.MAX_SAFE_INTEGER;
      if (aArr !== bArr) {
        return aArr - bArr;
      }
      return a.id - b.id;
    });
    const map = new Map<string, string>();
    for (const media of sorted) {
      if (map.has(media.post_id)) {
        continue;
      }
      if (typeof media.media_url === "string" && media.media_url.length > 0) {
        map.set(media.post_id, media.media_url);
      }
    }
    return map;
  }, [postMedias]);

  /**
   * Mixed chronological feed (newest first) on the **filtered** post/promo set.
   * Sort key: post = coalesce(time_post, created_at); promo = coalesce(start_date, created_at).
   * Drops entities with zero linked products so empty image + See all blocks never render.
   * Uses early-exit link checks + a memoized catalog (see {@link linkedCatalog}).
   * Empty while both {@link SHOW_HOME_POSTS} and {@link SHOW_HOME_PROMOS} are false.
   */
  const feedTimeline = useMemo(() => {
    if (!SHOW_HOME_POSTS && !SHOW_HOME_PROMOS) {
      return [];
    }
    const startedAt = __DEV__ ? Date.now() : 0;
    const timeline = buildStorefrontFeedTimeline(
      filteredPosts,
      filteredPromotions
    );
    const filtered = timeline.filter((item) =>
      feedItemHasLinkedProducts(
        item,
        filteredPosts,
        filteredPromotions,
        linkedCatalog,
        eligibleLinkedProductIds
      )
    );
    if (__DEV__) {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= 50) {
        console.log(
          `[nav] home feedTimeline ${String(elapsed)}ms items=${String(timeline.length)}→${String(filtered.length)} catalog=${String(linkedCatalog.length)}`
        );
      }
    }
    return filtered;
  }, [
    eligibleLinkedProductIds,
    filteredPosts,
    filteredPromotions,
    linkedCatalog,
  ]);

  const visibleFeedItems = useMemo(
    () =>
      feedTimeline.slice(0, feedPageCount * STOREFRONT_FEED_PAGE_SIZE),
    [feedTimeline, feedPageCount]
  );

  const feedHasMore =
    visibleFeedItems.length < feedTimeline.length;

  const handleLoadMore = useCallback((): void => {
    if (!feedHasMore) {
      return;
    }
    setFeedPageCount((prev) => prev + 1);
  }, [feedHasMore]);

  /**
   * Prefer DB-designated hero post for label/tap when that post is loaded;
   * else the filter-eligible candidate (visibility still requires a candidate).
   */
  const heroTapPostId =
    dbHeroPostId !== null && posts.some((post) => post.id === dbHeroPostId)
      ? dbHeroPostId
      : heroPostCandidateId;

  const heroPost =
    heroTapPostId !== null
      ? (posts.find((post) => post.id === heroTapPostId) ?? null)
      : null;

  /**
   * DB-controlled Home cover URI (`homepage_elements` type=hero).
   * Design Lab variants do not rotate cover from category/product mood.
   */
  const heroUri = dbHeroUri;

  const heroName =
    heroPost !== null
      ? translatePost(heroPost.id, "name", heroPost.name ?? null)
      : "";

  /** Variant D uses the same DB cover (no category/product mood swap). */
  const moodUri = dbHeroUri;

  const categoryRailProps = useMemo(
    () => ({
      kindKeys,
      selected: kindFilter,
      onSelect: onKindFilterChange,
      resolveKindLabel,
      allLabel: t("home.categoryFilterAll"),
    }),
    [kindKeys, kindFilter, onKindFilterChange, resolveKindLabel, t]
  );

  /** Hero tap → designated (or eligible) post linked-products (never PDP). */
  const openHero = (): void => {
    if (heroTapPostId === null) {
      return;
    }
    const postId = heroTapPostId;
    deferAfterPressFeedback(() => {
      startTransition(() => {
        openLinkedProducts(router, "post", postId);
      });
    });
  };

  /** Arrivals See all → product-list scoped to the active kind filter. */
  const openArrivalsSeeAll = (): void => {
    deferAfterPressFeedback(() => {
      startTransition(() => {
        if (kindFilter.type === "kind") {
          openBrowseProductList(router, {
            scope: "kind",
            kindKey: kindFilter.kindKey,
          });
          return;
        }
        openBrowseProductList(router, { scope: "all" });
      });
    });
  };

  /**
   * Pause heavy list work while the user scrolls Home — large product commits
   * during scroll are a common cause of 1–2s tap lag on mid-range Android.
   */
  const handleScrollInteraction = useCallback((): void => {
    markInteractionBusy(1200);
  }, []);

  const animatedScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const fixedChromeHeight = storefrontFixedChromeHeight(
    topInset,
    categoriesVisible,
    !hideHeaderActions
  );

  /**
   * Actual on-device measured height of {@link StorefrontHomeFixedChrome},
   * reported via `onLayout`. Scroll content's `paddingTop` uses this measured
   * value once available, falling back to the computed {@link fixedChromeHeight}
   * only for the very first frame before layout has run. This removes the
   * fragile "two independently computed numbers must happen to match" contract
   * — the offset is always driven by what the chrome truly rendered at.
   *
   * Cleared when category visibility toggles so paddingTop immediately tracks
   * the recomputed chrome height instead of lagging on a stale measurement.
   */
  const [measuredChromeHeight, setMeasuredChromeHeight] = useState<
    number | null
  >(null);
  useEffect(() => {
    setMeasuredChromeHeight(null);
  }, [categoriesVisible, heroVariant]);
  const handleChromeMeasuredHeight = useCallback((height: number): void => {
    setMeasuredChromeHeight((previous) =>
      previous !== null && Math.abs(previous - height) < 1 ? previous : height
    );
  }, []);
  const effectiveChromeHeight =
    measuredChromeHeight !== null ? measuredChromeHeight : fixedChromeHeight;

  const listPaddingTop =
    heroVariant === "c"
      ? effectiveChromeHeight + collapseExpandedBand
      : heroVariantBleedsUnderTopNav(heroVariant) &&
          heroPostCandidateId !== null
        ? 0
        : effectiveChromeHeight;

  const heroAccessibilityLabel =
    heroName.length > 0 ? heroName : t("home.heroAlt");

  const heroMediaKey = `hero-media:${heroUri}`;

  /**
   * Hero + category composition for the active Design Lab variant, then
   * arrivals. Variant C mounts the collapsing hero outside the list;
   * media is pointer-events none so an in-list hit target under the
   * padding band owns hero press without blocking scroll.
   */
  const listHeader = (
    <>
      {heroVariant === "c" &&
      heroPostCandidateId !== null &&
      heroHeight > 0 ? (
        <Pressable
          onPress={openHero}
          accessibilityRole="button"
          accessibilityLabel={heroAccessibilityLabel}
          style={{
            height: heroHeight,
            /**
             * Pull into the constant collapsing-header padding band so taps
             * on the visible grand hero hit this target (absolute media is
             * pointer-events none). Leave rail-height margin so arrivals
             * still start below the sticky chips.
             */
            marginTop: -(heroHeight + STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT),
            marginBottom: STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT,
          }}
        />
      ) : null}

      {(heroVariant === "current" || heroVariant === "e") &&
      heroIndex !== null &&
      heroPostCandidateId !== null ? (
        <CeremonySection
          index={heroIndex}
          play={play}
          baseDelayMs={contentBaseDelayMs}
          durationMs={motion.duration.dailyEntrance}
          scaleFrom={motion.scale.heroStartBold}
        >
          <HeroCoverMedia
            uri={heroUri}
            height={heroHeight}
            onPress={openHero}
            accessibilityLabel={heroAccessibilityLabel}
            mediaKey={heroMediaKey}
            recyclingKey="home-hero:fixed"
          />
        </CeremonySection>
      ) : null}

      {heroVariant === "a" &&
      heroIndex !== null &&
      heroPostCandidateId !== null ? (
        <CeremonySection
          index={heroIndex}
          play={play}
          baseDelayMs={contentBaseDelayMs}
          durationMs={motion.duration.dailyEntrance}
          scaleFrom={motion.scale.heroStartBold}
        >
          <HeroCoverMedia
            uri={heroUri}
            height={heroHeight}
            onPress={openHero}
            accessibilityLabel={heroAccessibilityLabel}
            mediaKey={heroMediaKey}
            recyclingKey="home-hero-a:fixed"
          />
          {SHOW_HOME_CATEGORY_BAR ? (
            <BelowFoldCategoryRail {...categoryRailProps} />
          ) : null}
        </CeremonySection>
      ) : null}

      {heroVariant === "b" &&
      heroIndex !== null &&
      heroPostCandidateId !== null ? (
        <CeremonySection
          index={heroIndex}
          play={play}
          baseDelayMs={contentBaseDelayMs}
          durationMs={motion.duration.dailyEntrance}
          scaleFrom={motion.scale.heroStartBold}
        >
          <View style={{ width: "100%", height: heroHeight }}>
            <HeroCoverMedia
              uri={heroUri}
              height={heroHeight}
              onPress={openHero}
              accessibilityLabel={heroAccessibilityLabel}
              mediaKey={heroMediaKey}
              recyclingKey="home-hero-b:fixed"
            />
            {SHOW_HOME_CATEGORY_BAR ? (
              <OverlayCategoryRail {...categoryRailProps} />
            ) : null}
          </View>
        </CeremonySection>
      ) : null}

      {heroVariant === "d" &&
      heroIndex !== null &&
      heroPostCandidateId !== null ? (
        <CeremonySection
          index={heroIndex}
          play={play}
          baseDelayMs={contentBaseDelayMs}
          durationMs={motion.duration.dailyEntrance}
          scaleFrom={motion.scale.heroStartBold}
        >
          <CategoryMoodHero
            uri={moodUri}
            height={heroHeight}
            mediaKey="hero-mood:fixed"
            onPress={openHero}
            accessibilityLabel={heroAccessibilityLabel}
          />
          {SHOW_HOME_CATEGORY_BAR ? (
            <StrongSelectedCategoryRail {...categoryRailProps} />
          ) : null}
          {SHOW_HOME_CATEGORY_BAR && kindFilter.type === "kind" ? (
            <CategoryProductPeek
              products={filteredProductsForMood}
              title={resolveKindLabel(kindFilter.kindKey)}
            />
          ) : null}
        </CeremonySection>
      ) : null}

      {/* Variants A–D with no hero still need category chrome in-flow. */}
      {SHOW_HOME_CATEGORY_BAR &&
      heroVariant === "a" &&
      heroPostCandidateId === null ? (
        <BelowFoldCategoryRail {...categoryRailProps} />
      ) : null}
      {SHOW_HOME_CATEGORY_BAR &&
      heroVariant === "b" &&
      heroPostCandidateId === null ? (
        <View
          style={{
            marginTop: HOME_SPACE.sm,
            backgroundColor: "rgba(10, 10, 10, 0.06)",
          }}
        >
          <StorefrontHomeCategoryRail {...categoryRailProps} />
        </View>
      ) : null}
      {SHOW_HOME_CATEGORY_BAR &&
      heroVariant === "d" &&
      heroPostCandidateId === null ? (
        <>
          <StrongSelectedCategoryRail {...categoryRailProps} />
          {kindFilter.type === "kind" ? (
            <CategoryProductPeek
              products={filteredProductsForMood}
              title={resolveKindLabel(kindFilter.kindKey)}
            />
          ) : null}
        </>
      ) : null}

      {/* ── Latest arrivals 2×3 + See all under filter ── */}
      {latestIndex !== null ? (
        <CeremonySection
          index={latestIndex}
          play={play}
          baseDelayMs={contentBaseDelayMs}
        >
          <View
            style={{
              marginTop: HOME_SPACE.md,
              paddingHorizontal: HOME_HORIZONTAL_PADDING,
              alignSelf: "stretch",
              width: "100%",
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_400Regular",
                fontSize: 24,
                color: tokens.text,
                marginBottom: HOME_SPACE.md,
              }}
              numberOfLines={1}
            >
              {t("home.latestProducts")}
            </Text>

            {grid.length > 0 ? (
              <>
                <HomeProductGrid
                  items={grid}
                  metrics={gridMetrics}
                  keyExtractor={(product) => product.id}
                  renderItem={(product, index, cardWidth) => {
                    const saved = isInWishlist(product.id);
                    return (
                      <View style={{ width: cardWidth }}>
                        <StorefrontProductTile
                          product={product}
                          style={{ width: cardWidth }}
                          imagePriority={index < 4}
                          onPress={(colorId) => {
                            startTransition(() => {
                              openBrowseProduct(router, product.id, {
                                returnTo: "home",
                                ...(colorId !== null
                                  ? { colorId }
                                  : {}),
                              });
                            });
                          }}
                        />
                        {index === 0 ? (
                          <View
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: "rgba(255,255,255,0.9)",
                              borderRadius: 99,
                            }}
                          >
                            <SaveHeartButton
                              isFirstCard
                              saved={saved}
                              onPress={() => {
                                void (saved
                                  ? removeFromWishlist(product.id)
                                  : addToWishlist(product.id));
                              }}
                              accessibilityLabel={
                                saved
                                  ? t("home.cardUnsaveAria")
                                  : t("home.cardSaveAria")
                              }
                            />
                          </View>
                        ) : null}
                      </View>
                    );
                  }}
                />
                <View
                  style={{
                    marginTop: HOME_SPACE.sm,
                    alignSelf: "stretch",
                    width: "100%",
                  }}
                >
                  <StorefrontSeeAllButton
                    label={t("home.seeAll")}
                    onPress={openArrivalsSeeAll}
                    accessibilityLabel={t("home.seeAll")}
                  />
                </View>
              </>
            ) : (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: tokens.muted,
                }}
              >
                {t("home.emptyProducts")}
              </Text>
            )}
          </View>
        </CeremonySection>
      ) : null}
    </>
  );

  /**
   * Renders one filtered feed timeline block (post or promotion).
   */
  const renderFeedItem = useCallback(
    ({ item }: ListRenderItemInfo<StorefrontFeedItem>): React.ReactElement | null => {
      const blockProducts = resolveFeedBlockProducts(
        item,
        filteredPosts,
        filteredPromotions,
        products,
        linkedCatalog
      );

      if (item.kind === "post") {
        const post = filteredPosts.find((p) => p.id === item.id);
        if (post === undefined) {
          return null;
        }
        const imageUrl = postMediaMap.get(post.id) ?? null;
        const title = translatePost(
          post.id,
          "name",
          post.name ?? null
        );
        return (
          <StorefrontFeedBlock
            imageUrl={imageUrl}
            title={title.length > 0 ? title : null}
            products={blockProducts}
            photoSize={post.photo_size}
            imageAccessibilityLabel={
              title.length > 0 ? title : t("home.postAlt")
            }
            onImagePress={() => {
              startTransition(() => {
                openLinkedProducts(router, "post", post.id);
              });
            }}
            onSeeAll={() => {
              startTransition(() => {
                openLinkedProducts(router, "post", post.id);
              });
            }}
            seeAllLabel={t("home.seeAll")}
            onProductPress={(productId, colorId) => {
              startTransition(() => {
                openBrowseProduct(router, productId, {
                  returnTo: "home",
                  ...(colorId !== null ? { colorId } : {}),
                });
              });
            }}
          />
        );
      }

      const promo = filteredPromotions.find((p) => p.id === item.id);
      if (promo === undefined) {
        return null;
      }
      const promoTitle = resolvePromotionDisplayTitle(promo, locale);
      const promoImage =
        typeof promo.image_url === "string" &&
        promo.image_url.trim().length > 0
          ? promo.image_url.trim()
          : null;
      return (
        <StorefrontFeedBlock
          imageUrl={promoImage}
          title={promoTitle.length > 0 ? promoTitle : null}
          products={blockProducts}
          imageAccessibilityLabel={
            promoTitle.length > 0
              ? promoTitle
              : t("home.offerTapAria", { name: promo.name ?? "" })
          }
          onImagePress={() => {
            startTransition(() => {
              openLinkedProducts(router, "promotion", promo.id);
            });
          }}
          onSeeAll={() => {
            startTransition(() => {
              openLinkedProducts(router, "promotion", promo.id);
            });
          }}
          seeAllLabel={t("home.seeAll")}
          onProductPress={(productId, colorId) => {
            startTransition(() => {
              openBrowseProduct(router, productId, {
                returnTo: "home",
                ...(colorId !== null ? { colorId } : {}),
              });
            });
          }}
        />
      );
    },
    [
      filteredPosts,
      filteredPromotions,
      linkedCatalog,
      locale,
      postMediaMap,
      products,
      router,
      t,
      translatePost,
    ]
  );

  /**
   * Stable feed row key scoped by active kind chip.
   */
  const feedKeyExtractor = useCallback(
    (item: StorefrontFeedItem): string =>
      `${kindFilterKey}:${item.kind}:${item.id}`,
    [kindFilterKey]
  );

  const listFooter =
    feedTimeline.length > 0 ? (
      <View
        style={{
          marginTop: HOME_SPACE.lg,
          marginBottom: HOME_SPACE.md,
          paddingHorizontal: HOME_HORIZONTAL_PADDING,
          alignItems: "center",
        }}
      >
        {feedHasMore ? (
          <PressableScale
            haptic="light"
            onPress={handleLoadMore}
            accessibilityRole="button"
            accessibilityLabel={t("home.loadMore")}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderWidth: 1,
              borderColor: tokens.border,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: tokens.text,
              }}
            >
              {t("home.loadMore")}
            </Text>
          </PressableScale>
        ) : (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              color: tokens.muted,
            }}
          >
            {t("home.feedEnd")}
          </Text>
        )}
      </View>
    ) : null;

  const listSharedProps = {
    style: { flex: 1 } as const,
    data: visibleFeedItems,
    keyExtractor: feedKeyExtractor,
    renderItem: renderFeedItem,
    ListHeaderComponent: listHeader,
    ListFooterComponent: listFooter,
    contentContainerStyle: {
      paddingBottom: 100,
      alignItems: "stretch" as const,
      /**
       * Inset under fixed chrome for `current` / B (and variant C collapsing
       * header). Variants A / D / E with a hero use `0` so cover / mood media
       * starts at the screen top and bleeds under transparent nav chrome.
       */
      paddingTop: listPaddingTop,
    },
    showsVerticalScrollIndicator: false,
    initialNumToRender: STOREFRONT_FEED_PAGE_SIZE,
    maxToRenderPerBatch: STOREFRONT_HOME_FEED_MAX_BATCH,
    windowSize: STOREFRONT_LIST_WINDOW_SIZE,
    updateCellsBatchingPeriod: STOREFRONT_LIST_UPDATE_CELLS_MS,
    removeClippedSubviews: STOREFRONT_LIST_REMOVE_CLIPPED_SUBVIEWS,
    onEndReached: handleLoadMore,
    onEndReachedThreshold: 0.4,
    onScrollBeginDrag: handleScrollInteraction,
    onMomentumScrollBegin: handleScrollInteraction,
    onTouchStart: handleScrollInteraction,
  };

  return (
    <View style={{ flex: 1 }}>
      {heroVariant === "c" ? (
        <AnimatedFlatList
          {...listSharedProps}
          onScroll={animatedScrollHandler}
          scrollEventThrottle={16}
        />
      ) : (
        <FlatList {...listSharedProps} />
      )}

      {heroVariant === "c" && heroPostCandidateId !== null && heroHeight > 0 ? (
        <CollapsingStickyHero
          expandedHeight={heroHeight}
          uri={heroUri}
          mediaKey={heroMediaKey}
          onPress={openHero}
          accessibilityLabel={heroAccessibilityLabel}
          scrollY={scrollY}
          topOffset={effectiveChromeHeight}
          categoryRail={
            SHOW_HOME_CATEGORY_BAR ? categoryRailProps : undefined
          }
        />
      ) : null}

      {SHOW_HOME_CATEGORY_BAR &&
      heroVariant === "c" &&
      heroPostCandidateId === null ? (
        <View
          style={{
            position: "absolute",
            top: effectiveChromeHeight,
            left: 0,
            right: 0,
            zIndex: 30,
            backgroundColor: tokens.bg,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border,
          }}
        >
          <StorefrontHomeCategoryRail {...categoryRailProps} />
        </View>
      ) : null}

      <StorefrontHomeFixedChrome
        topInset={topInset}
        kindFilter={kindFilter}
        onKindFilterChange={onKindFilterChange}
        kindKeys={kindKeys}
        resolveKindLabel={resolveKindLabel}
        allLabel={t("home.categoryFilterAll")}
        categoriesVisible={categoriesVisible}
        showCategoryToggle={showCategoryToggle}
        hideHeaderActions={hideHeaderActions}
        onToggleCategoriesVisible={onToggleCategoriesVisible}
        categoriesToggleLabel={
          categoriesVisible
            ? t("home.hideCategories")
            : t("home.showCategories")
        }
        onMeasuredHeight={handleChromeMeasuredHeight}
        overlayOnHero={
          heroVariantBleedsUnderTopNav(heroVariant) &&
          heroPostCandidateId !== null
        }
      />
    </View>
  );
}
