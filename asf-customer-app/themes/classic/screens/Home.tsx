"use client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ANCHORS, TourAnchor, useGuide } from "@/components/guide";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import {
  hasAttemptedFirstLaunchTrigger,
  hasSeenFirstGuide,
  markFirstLaunchTriggerAttempted,
} from "@/lib/appGuide";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePostContext, type Post } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import { useCategoryContext, type Category } from "@/context/product/CategoryContext";
import type { Product } from "@/context/product/ProductContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useOptionalPromotionContext } from "@/context/PromotionContext";
import type { Promotion } from "@/context/PromotionContext";
import { colors } from "@/constants/theme";
import { formatRm } from "@/lib/formatCurrency";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { motion } from "@/lib/motion";
import {
  HOME_ASPECT,
  HOME_CLASSIC_OVERLAY_NAV_ROW_HEIGHT,
  HOME_GRID_COLUMNS,
  HOME_PRODUCT_GRID_CAP,
  HOME_SPACE,
  frame1CoverMediaHeight,
  getHomeGridMetrics,
  getHomeUsableHeight,
} from "@/lib/homeLayout";
import {
  filterActivePromotions,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";
import {
  HomeArrivalCeremony,
  useHomeCeremony,
} from "@/components/home/HomeArrivalCeremony";
import {
  HomeProductGrid,
  HomeProductGridMediaFrame,
} from "@/components/home/HomeProductGrid";
import { HomePromoBannerStack } from "@/components/home/HomePromoBannerStack";
import { CartButton } from "@/components/cart/CartButton";
import { CeremonySection, PressableScale } from "@/components/motion";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";

/**
 * Cap for Classic Home new-products grid — Round 4 Home≠Shop.
 * Prefer shared {@link HOME_PRODUCT_GRID_CAP}; headroom stays ≤14.
 */
const HOME_CLASSIC_ARRIVALS_CAP = HOME_PRODUCT_GRID_CAP;

/**
 * Cap for Classic Home journal posts — lead + grid (≥6 available; headroom 8).
 */
const HOME_CLASSIC_POSTS_CAP = 8;

/**
 * Classic in-flow top bar row height (search + bag), excluding safe-area top.
 * Reuses the Round 1 overlay-nav token — same row height, now push-down chrome.
 */
const HOME_CLASSIC_INFLOW_HEADER_ROW_HEIGHT =
  HOME_CLASSIC_OVERLAY_NAV_ROW_HEIGHT;

/**
 * In-flow Frame 1 commerce plate height (name + price + primary CTA + padding).
 * Passed as `commerceChrome` to {@link frame1CoverMediaHeight}.
 * Nav is subtracted via `inFlowHeaderHeight`, not here.
 */
const FRAME1_COMMERCE_RESERVE = 120;

/**
 * Thin Frame 1 promo cue reserve — only added when an active promo exists
 * and the tall cover still leaves readable hero media.
 */
const FRAME1_PROMO_CUE_RESERVE = 36;

/**
 * Minimum Frame 1 hero media height before dropping the optional promo cue.
 * Keeps the cover focal when commerce + cue would squash media.
 */
const FRAME1_HERO_MEDIA_MIN = 180;

/** Horizontal padding for Home section shells / headers. */
const HOME_HORIZONTAL_PADDING = 16;

/**
 * Returns the first product media URL, or an empty string when none.
 *
 * @param product - Catalog product with medias array.
 */
function productThumb(product: Product): string {
  const first = product.medias[0];
  return typeof first?.media_url === "string" ? first.media_url : "";
}

/**
 * Picks Frame 1 primary product: newest with media, else newest overall.
 * Never returns a half-empty broken frame — caller may still show a calm placeholder.
 *
 * @param sortedNewestFirst - Products sorted by `created_at` descending.
 */
function pickFrame1Product(sortedNewestFirst: readonly Product[]): Product | null {
  if (sortedNewestFirst.length === 0) {
    return null;
  }
  for (const product of sortedNewestFirst) {
    if (productThumb(product).length > 0) {
      return product;
    }
  }
  return sortedNewestFirst[0] ?? null;
}

interface SaveHeartButtonProps {
  /** Whether this is the first "new arrivals" card — the only one anchored for the guide. */
  isFirstCard: boolean;
  saved: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Heart toggle on a "new arrivals" product card. Only the first card's
 * heart is wrapped in `TourAnchor` — a single stable, realistic spotlight
 * target for the `saveFavourites` guide topic and the `firstLaunch`
 * orientation, without depending on any specific product existing.
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
        color={saved ? colors.accent : colors.muted}
      />
    </Pressable>
  );

  if (!isFirstCard) {
    return heart;
  }

  return <TourAnchor id={ANCHORS.home.saveHeart}>{heart}</TourAnchor>;
}

/**
 * Classic Home skin — boutique landing (Tier A), Round 4 cover + editorial body.
 *
 * Round 2 tidy grammar kept: no peek, no MODEL MATCH wordmark, fixed promo
 * banners, push-down commerce (no stacked scrims), Home≠Shop cap.
 *
 * Round 4: Frame 1 = tall full-usable cover via {@link frame1CoverMediaHeight}
 * (not R3 {@link getHomeAboveFoldBudget} packing). Below fold = stacked
 * promos → 2-col product grid → journal lead + grid → quiet wrap chips.
 * Products/posts no longer use {@link HomeSnapSection}.
 */
export function ClassicHomeScreen(): React.ReactElement {
  const { products, loading: productsLoading } = useProductContext();
  const { categories, loading: categoriesLoading } = useCategoryContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { isEnabled } = useFeatureFlags();
  const { startTour } = useGuide();
  const promotionsEnabled = isEnabled("promotions");
  const promoCtx = useOptionalPromotionContext();
  const insets = useSafeAreaInsets();

  const activePromotions = useMemo((): Promotion[] => {
    if (promoCtx === null) {
      return [];
    }
    return filterActivePromotions(promoCtx.promotions);
  }, [promoCtx]);

  const activePromoCount = activePromotions.length;
  const frame1Promo =
    activePromoCount > 0 ? (activePromotions[0] ?? null) : null;

  /**
   * Triggers the first-launch App Guide once the home arrival ceremony has
   * settled (see `HomeArrivalCeremony`'s `onFinish`). Guarded by a
   * once-per-session attempt flag so remounting Home (e.g. switching tabs)
   * never re-checks or re-starts the tour, and by the persisted
   * `hasSeenFirstGuide()` flag so it only ever runs once per install.
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

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const da = new Date(a.created_at ?? 0).getTime();
      const db = new Date(b.created_at ?? 0).getTime();
      return db - da;
    });
  }, [products]);

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

  const postMediaMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of postMedias) {
      if (typeof m.post_id === "string" && !map.has(m.post_id)) {
        map.set(m.post_id, m.media_url ?? "");
      }
    }
    return map;
  }, [postMedias]);

  const sortedPosts = useMemo(() => {
    return [...posts]
      .filter((p) => p.id.length > 0)
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      );
  }, [posts]);

  const frame1Product = useMemo(
    () => pickFrame1Product(sortedProducts),
    [sortedProducts]
  );

  const isLoading = productsLoading || categoriesLoading;

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  const usableHeight = getHomeUsableHeight({
    windowHeight,
    topInset: insets.top,
    bottomInset: insets.bottom,
    inFlowHeaderHeight: HOME_CLASSIC_INFLOW_HEADER_ROW_HEIGHT,
  });

  const hasOffers = promotionsEnabled && activePromoCount > 0;
  const hasPromoCue = frame1Promo !== null;

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

  /**
   * Prefer full commerce + optional promo cue when the tall cover still leaves
   * readable hero media. Drop the cue only if it would squash the focal point.
   */
  const chromeWithCue =
    FRAME1_COMMERCE_RESERVE + FRAME1_PROMO_CUE_RESERVE;
  const heroWithFullChrome = frame1CoverMediaHeight(
    usableHeight,
    chromeWithCue
  );
  const showFrame1PromoCue =
    hasPromoCue && heroWithFullChrome >= FRAME1_HERO_MEDIA_MIN;
  const chromeBudget =
    FRAME1_COMMERCE_RESERVE +
    (showFrame1PromoCue ? FRAME1_PROMO_CUE_RESERVE : 0);
  const heroHeight = frame1CoverMediaHeight(usableHeight, chromeBudget);

  if (isLoading && products.length === 0) {
    return <PageLoadingSkeleton variant="home" />;
  }

  const hasCategories = sortedCategories.length > 0;
  const hasPosts = sortedPosts.length > 0;
  const hasArrivals = sortedProducts.length > 0;

  // Ceremony indices stay coherent as optional sections appear / disappear.
  let sectionIndex = 0;
  const heroIndex = sectionIndex;
  sectionIndex += 1;
  const offersIndex = hasOffers ? sectionIndex : null;
  if (hasOffers) {
    sectionIndex += 1;
  }
  const arrivalsIndex = hasArrivals ? sectionIndex : null;
  if (hasArrivals) {
    sectionIndex += 1;
  }
  const postsIndex = hasPosts ? sectionIndex : null;
  if (hasPosts) {
    sectionIndex += 1;
  }
  const categoriesIndex = hasCategories ? sectionIndex : null;
  if (hasCategories) {
    sectionIndex += 1;
  }
  const lastContentIndex = Math.max(0, sectionIndex - 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HomeArrivalCeremony
        lastContentIndex={lastContentIndex}
        style={{ flex: 1 }}
        onFinish={handleCeremonyFinish}
      >
        <HomeCeremonyBody
          usableHeight={usableHeight}
          heroHeight={heroHeight}
          showFrame1PromoCue={showFrame1PromoCue}
          gridMetrics={gridMetrics}
          frame1Product={frame1Product}
          frame1Promo={frame1Promo}
          heroIndex={heroIndex}
          offersIndex={offersIndex}
          arrivalsIndex={arrivalsIndex}
          postsIndex={postsIndex}
          categoriesIndex={categoriesIndex}
          sortedProducts={sortedProducts}
          sortedCategories={sortedCategories}
          sortedPosts={sortedPosts}
          postMediaMap={postMediaMap}
        />
      </HomeArrivalCeremony>
    </View>
  );
}

type HomeCeremonyBodyProps = {
  /**
   * Usable Home height below the in-flow bar — Round 4 cover driver
   * ({@link getHomeUsableHeight}).
   */
  usableHeight: number;
  /** Initial Frame 1 media height from token commerce chrome reserves. */
  heroHeight: number;
  /** Whether to render the thin Frame 1 promo cue (media-gated). */
  showFrame1PromoCue: boolean;
  /** Round 4 2-col grid metrics for products + journal rest. */
  gridMetrics: ReturnType<typeof getHomeGridMetrics>;
  frame1Product: Product | null;
  frame1Promo: Promotion | null;
  heroIndex: number;
  offersIndex: number | null;
  arrivalsIndex: number | null;
  postsIndex: number | null;
  categoriesIndex: number | null;
  sortedProducts: Product[];
  sortedCategories: Category[];
  sortedPosts: Post[];
  postMediaMap: Map<string, string>;
};

/**
 * Home content under {@link HomeArrivalCeremony} — uses ceremony context for stagger.
 */
function HomeCeremonyBody({
  usableHeight,
  heroHeight,
  showFrame1PromoCue,
  gridMetrics,
  frame1Product,
  frame1Promo,
  heroIndex,
  offersIndex,
  arrivalsIndex,
  postsIndex,
  categoriesIndex,
  sortedProducts,
  sortedCategories,
  sortedPosts,
  postMediaMap,
}: HomeCeremonyBodyProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { translateCategory, translateProduct, translatePost } =
    useContentTranslation();
  const { isInWishlist, addToWishlist, removeFromWishlist } =
    useWishlistContext();
  const { play, contentBaseDelayMs } = useHomeCeremony();

  const [commerceHeight, setCommerceHeight] = useState(0);

  const frame1Thumb =
    frame1Product !== null ? productThumb(frame1Product) : "";
  const frame1Name =
    frame1Product !== null
      ? translateProduct(
          frame1Product.id,
          "name",
          frame1Product.name ?? null
        )
      : "";
  const promoCueTitle =
    frame1Promo !== null
      ? resolvePromotionDisplayTitle(frame1Promo, locale)
      : "";

  const arrivalProducts = useMemo(
    () => sortedProducts.slice(0, HOME_CLASSIC_ARRIVALS_CAP),
    [sortedProducts]
  );

  const latestPosts = useMemo(
    () => sortedPosts.slice(0, HOME_CLASSIC_POSTS_CAP),
    [sortedPosts]
  );

  /**
   * Journal split: one full-width lead when ≥1 post; remaining posts in the
   * 2-col grid. Single post → lead only (no empty grid).
   */
  const leadPost = latestPosts.length > 0 ? (latestPosts[0] ?? null) : null;
  const journalGridPosts = useMemo(
    () => (latestPosts.length > 1 ? latestPosts.slice(1) : []),
    [latestPosts]
  );

  const openFrame1Product = (): void => {
    if (frame1Product !== null) {
      openBrowseProduct(router, frame1Product.id, { returnTo: "home" });
      return;
    }
    router.push("/(tabs)/browse");
  };

  /**
   * Prefer measured commerce plate height so Frame 1 cover ≈ full usable
   * (media = usable − commerce). Fall back to token heroHeight before first layout.
   */
  const mediaHeight =
    commerceHeight > 0
      ? frame1CoverMediaHeight(usableHeight, commerceHeight)
      : heroHeight;

  const leadUri =
    leadPost !== null ? (postMediaMap.get(leadPost.id) ?? "") : "";
  const leadCaption =
    leadPost !== null
      ? translatePost(leadPost.id, "caption", leadPost.caption)
      : "";

  return (
    <>
      {/* ── In-flow top bar: search + bag only (no MODEL MATCH wordmark) ── */}
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            height: HOME_CLASSIC_INFLOW_HEADER_ROW_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingHorizontal: HOME_HORIZONTAL_PADDING,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TourAnchor id={ANCHORS.home.search}>
              <PressableScale
                haptic="light"
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => router.push("/(tabs)/browse")}
                accessibilityRole="button"
                accessibilityLabel={t("nav.openSearch")}
              >
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={colors.text}
                />
              </PressableScale>
            </TourAnchor>
            <TourAnchor id={ANCHORS.home.bag}>
              <CartButton
                color={colors.text}
                accessibilityLabel={t("nav.openCart")}
              />
            </TourAnchor>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Frame 1 — tall full-usable cover (no stacked scrims) ── */}
        <CeremonySection
          index={heroIndex}
          play={play}
          baseDelayMs={contentBaseDelayMs}
          durationMs={motion.duration.dailyEntrance}
          scaleFrom={motion.scale.heroStartBold}
        >
          <View>
            <Pressable
              onPress={openFrame1Product}
              style={{ width: "100%", height: mediaHeight }}
              accessibilityLabel={t("home.productHeroAlt")}
            >
              {frame1Thumb.length > 0 ? (
                <Image
                  source={{ uri: frame1Thumb }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                  }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: colors.panel,
                  }}
                />
              )}
            </Pressable>

            {/* Push-down commerce plate — below media, no scrims. */}
            <View
              onLayout={(event) => {
                const next = Math.round(event.nativeEvent.layout.height);
                if (next > 0 && next !== commerceHeight) {
                  setCommerceHeight(next);
                }
              }}
              style={{
                paddingHorizontal: HOME_HORIZONTAL_PADDING,
                paddingTop: HOME_SPACE.md,
                paddingBottom: HOME_SPACE.sm,
                backgroundColor: colors.bg,
              }}
            >
              {showFrame1PromoCue &&
              frame1Promo !== null &&
              promoCueTitle.length > 0 ? (
                <Pressable
                  onPress={() => router.push("/(tabs)/browse")}
                  accessibilityRole="button"
                  accessibilityLabel={t("home.frame1PromoCueAria", {
                    name: promoCueTitle,
                  })}
                  style={{
                    marginBottom: HOME_SPACE.sm,
                    paddingVertical: HOME_SPACE.xs,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      color: colors.accent,
                      letterSpacing: 0.4,
                    }}
                    numberOfLines={1}
                  >
                    {t("home.frame1PromoCue", { name: promoCueTitle })}
                  </Text>
                </Pressable>
              ) : null}

              {frame1Name.length > 0 ? (
                <Text
                  style={{
                    fontFamily: "PlayfairDisplay_400Regular",
                    color: colors.text,
                    fontSize: 22,
                    lineHeight: 28,
                    marginBottom: HOME_SPACE.xs,
                  }}
                  numberOfLines={2}
                >
                  {frame1Name}
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: "PlayfairDisplay_400Regular",
                    color: colors.text,
                    fontSize: 22,
                    lineHeight: 28,
                    marginBottom: HOME_SPACE.xs,
                  }}
                  numberOfLines={1}
                >
                  {t("home.newArrivals")}
                </Text>
              )}

              {frame1Product !== null ? (
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    color: colors.accent,
                    fontWeight: "500",
                    marginBottom: HOME_SPACE.md,
                  }}
                >
                  {formatRm(frame1Product.price)}
                </Text>
              ) : (
                <View style={{ height: HOME_SPACE.md }} />
              )}

              <PressableScale
                haptic="medium"
                onPress={openFrame1Product}
                accessibilityRole="button"
                accessibilityLabel={
                  frame1Product !== null
                    ? t("home.heroCtaViewProduct")
                    : t("home.heroCtaShop")
                }
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 22,
                  height: 44,
                  borderRadius: 99,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: "600",
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {frame1Product !== null
                    ? t("home.heroCtaViewProduct")
                    : t("home.heroCtaShop")}
                </Text>
              </PressableScale>
            </View>
          </View>
        </CeremonySection>

        {/* ── Offers — stacked fixed banners (below fold) ── */}
        {offersIndex !== null ? (
          <CeremonySection
            index={offersIndex}
            play={play}
            baseDelayMs={contentBaseDelayMs}
          >
            <HomePromoBannerStack
              subtitle={t("home.offersSubline")}
              contentPaddingHorizontal={HOME_HORIZONTAL_PADDING}
              style={{ marginTop: HOME_SPACE.md }}
            />
          </CeremonySection>
        ) : null}

        {/* ── The edit — vertical 2-col product grid (no snap) ── */}
        {arrivalsIndex !== null ? (
          <CeremonySection
            index={arrivalsIndex}
            play={play}
            baseDelayMs={contentBaseDelayMs}
          >
            <View
              style={{
                marginTop: HOME_SPACE.md,
                paddingHorizontal: HOME_HORIZONTAL_PADDING,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: HOME_SPACE.md,
                }}
              >
                <View style={{ flex: 1, paddingRight: HOME_SPACE.sm }}>
                  <Text
                    style={{
                      fontFamily: "PlayfairDisplay_400Regular",
                      fontSize: 24,
                      color: colors.text,
                    }}
                    numberOfLines={1}
                  >
                    {t("home.newArrivals")}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      color: colors.muted,
                      marginTop: HOME_SPACE.xs,
                      lineHeight: 16,
                    }}
                    numberOfLines={1}
                  >
                    {t("home.arrivalsSubline")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/(tabs)/browse")}
                  hitSlop={8}
                  style={{ paddingTop: 4 }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.accent,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {t("home.seeAllArrivals")}
                  </Text>
                </Pressable>
              </View>

              <HomeProductGrid
                items={arrivalProducts}
                metrics={gridMetrics}
                keyExtractor={(product) => product.id}
                renderItem={(product, index, cardWidth) => {
                  const thumb = productThumb(product);
                  const saved = isInWishlist(product.id);
                  return (
                    <Pressable
                      style={{ width: cardWidth }}
                      onPress={() =>
                        openBrowseProduct(router, product.id, {
                          returnTo: "home",
                        })
                      }
                    >
                      <HomeProductGridMediaFrame
                        width={cardWidth}
                        backgroundColor={colors.panel}
                      >
                        {thumb.length > 0 ? (
                          <Image
                            source={{ uri: thumb }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            accessibilityLabel={t("home.productAlt")}
                          />
                        ) : (
                          <View
                            style={{ flex: 1, backgroundColor: colors.panel }}
                          />
                        )}
                      </HomeProductGridMediaFrame>
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.text,
                          fontFamily: "Inter_400Regular",
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {translateProduct(
                          product.id,
                          "name",
                          product.name ?? null
                        )}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.accent,
                            fontWeight: "500",
                            fontFamily: "Inter_400Regular",
                          }}
                        >
                          {formatRm(product.price)}
                        </Text>
                        <SaveHeartButton
                          isFirstCard={index === 0}
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
                    </Pressable>
                  );
                }}
              />
            </View>
          </CeremonySection>
        ) : null}

        {/* ── Journal — full-width lead + 2-col grid (no snap) ── */}
        {postsIndex !== null && leadPost !== null ? (
          <CeremonySection
            index={postsIndex}
            play={play}
            baseDelayMs={contentBaseDelayMs}
          >
            <View
              style={{
                marginTop: HOME_SPACE.md,
                paddingHorizontal: HOME_HORIZONTAL_PADDING,
              }}
            >
              <View style={{ marginBottom: HOME_SPACE.md }}>
                <Text
                  style={{
                    fontFamily: "PlayfairDisplay_400Regular",
                    fontSize: 24,
                    color: colors.text,
                  }}
                  numberOfLines={1}
                >
                  {t("home.latestPosts")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: colors.muted,
                    marginTop: HOME_SPACE.xs,
                    lineHeight: 16,
                  }}
                  numberOfLines={1}
                >
                  {t("home.postsSubline")}
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/(tabs)/profile/highlights")}
                style={{
                  width: "100%",
                  aspectRatio: HOME_ASPECT.productCard,
                  backgroundColor: colors.panel,
                  overflow: "hidden",
                  marginBottom:
                    journalGridPosts.length > 0 ? HOME_SPACE.sm : 0,
                }}
                accessibilityLabel={t("home.postAlt")}
              >
                {leadUri.length > 0 ? (
                  <Image
                    source={{ uri: leadUri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : null}
                {leadCaption.length > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: "rgba(0,0,0,0.45)",
                      padding: HOME_SPACE.sm,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontFamily: "Inter_400Regular",
                      }}
                      numberOfLines={2}
                    >
                      {leadCaption}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              {journalGridPosts.length > 0 ? (
                <HomeProductGrid
                  items={journalGridPosts}
                  metrics={gridMetrics}
                  keyExtractor={(post) => post.id}
                  renderItem={(post, _index, cardWidth) => {
                    const uri = postMediaMap.get(post.id) ?? "";
                    const caption = translatePost(
                      post.id,
                      "caption",
                      post.caption
                    );
                    return (
                      <Pressable
                        onPress={() =>
                          router.push("/(tabs)/profile/highlights")
                        }
                        style={{ width: cardWidth }}
                        accessibilityLabel={t("home.postAlt")}
                      >
                        <HomeProductGridMediaFrame
                          width={cardWidth}
                          aspectRatio={HOME_ASPECT.productCard}
                          backgroundColor={colors.panel}
                          style={{ marginBottom: 0 }}
                        >
                          {uri.length > 0 ? (
                            <Image
                              source={{ uri }}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          ) : null}
                          {caption.length > 0 ? (
                            <View
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: "rgba(0,0,0,0.45)",
                                padding: HOME_SPACE.xs,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: 11,
                                  fontFamily: "Inter_400Regular",
                                }}
                                numberOfLines={2}
                              >
                                {caption}
                              </Text>
                            </View>
                          ) : null}
                        </HomeProductGridMediaFrame>
                      </Pressable>
                    );
                  }}
                />
              ) : null}
            </View>
          </CeremonySection>
        ) : null}

        {/* ── Categories — quiet equal wrap chips ── */}
        {categoriesIndex !== null ? (
          <CeremonySection
            index={categoriesIndex}
            play={play}
            baseDelayMs={contentBaseDelayMs}
          >
            <View
              style={{
                marginTop: HOME_SPACE.md,
                marginBottom: HOME_SPACE.sm,
                paddingHorizontal: HOME_HORIZONTAL_PADDING,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: colors.muted,
                  letterSpacing: 0.6,
                  marginBottom: HOME_SPACE.md,
                }}
                numberOfLines={1}
              >
                {t("home.categories")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: HOME_SPACE.xs,
                }}
              >
                {sortedCategories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => router.push("/(tabs)/browse")}
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: HOME_SPACE.sm,
                      borderRadius: 99,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        fontFamily: "Inter_400Regular",
                      }}
                      numberOfLines={1}
                    >
                      {translateCategory(cat.id, cat.name ?? null)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </CeremonySection>
        ) : null}
      </ScrollView>
    </>
  );
}
