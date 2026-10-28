"use client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
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
import { CartButton } from "@/components/cart/CartButton";
import {
  HomeArrivalCeremony,
  useHomeCeremony,
} from "@/components/home/HomeArrivalCeremony";
import { CeremonySection, PressableScale } from "@/components/motion";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePostContext, type Post } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import type { Product } from "@/context/product/ProductContext";
import { useProductContext } from "@/context/product/ProductContext";
import {
  useOptionalPromotionContext,
  type Promotion,
} from "@/context/PromotionContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { formatRm } from "@/lib/formatCurrency";
import {
  HOME_ASPECT,
  HOME_NOIR_INFLOW_HEADER_ROW_HEIGHT,
  HOME_SPACE,
  frame1CoverMediaHeight,
  getHomeUsableHeight,
} from "@/lib/homeLayout";
import { motion } from "@/lib/motion";
import {
  filterActivePromotions,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";
import type { ThemeTokens } from "@/themes/types";
import { NoirFeaturedCard } from "@/themes/noir/components/NoirFeaturedCard";
import { NoirOffersChips } from "@/themes/noir/components/NoirOffersChips";

/**
 * Cap for Noir Home 1-col drop stream — Round 5 Home≠Shop.
 * Excludes the Frame 1 cover SKU (counted separately as the lead drop).
 */
const HOME_NOIR_STREAM_CAP = 7;

/**
 * Cap for Noir Home journal — ≤2 full-bleed posts only (no 2-col grid).
 */
const HOME_NOIR_POSTS_CAP = 2;

/**
 * Overlay commerce plate sits **inside** Frame 1 height (Noir skin).
 * Pass `0` to {@link frame1CoverMediaHeight} so cover ≈ full usable —
 * not R3 push-down chrome subtraction.
 */
const FRAME1_OVERLAY_CHROME_RESERVE = 0;

/**
 * Thin Frame 1 promo cue reserve — used only to gate cue readability
 * against {@link FRAME1_HERO_MEDIA_MIN} on the tall cover.
 */
const FRAME1_PROMO_CUE_RESERVE = 36;

/**
 * Minimum Frame 1 cover media height before dropping the optional promo cue.
 * Tall cover almost always clears this; kept as a safety gate.
 */
const FRAME1_HERO_MEDIA_MIN = 180;

/**
 * Snappy Noir settle — ~300–500ms feel, not Atelier long presence.
 */
const NOIR_SETTLE_MS = 340;
const NOIR_STAGGER_MS = 45;
const NOIR_BASE_DELAY_MS = 40;

/** Horizontal padding for Home section shells / headers. */
const HOME_HORIZONTAL_PADDING = 16;

/**
 * Formats a 1-based stream ordinal as a zero-padded label (`01`, `02`, …).
 *
 * @param index - Zero-based index in the drop stream.
 */
function formatStreamOrdinal(index: number): string {
  const n = Number.isFinite(index) ? Math.max(0, Math.floor(index)) + 1 : 1;
  return String(n).padStart(2, "0");
}

/**
 * Resolves the first product media URL, or an empty string when missing.
 *
 * @param product - Catalog product with medias array.
 */
function productThumb(product: Product): string {
  const first = product.medias[0];
  return typeof first?.media_url === "string" ? first.media_url : "";
}

/**
 * Picks Frame 1 primary product: newest with media, else newest overall.
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

/**
 * Curated 1-col stream: newest products excluding the cover SKU, capped.
 *
 * @param sortedNewestFirst - Products sorted by `created_at` descending.
 * @param coverProduct - Frame 1 drop product to exclude from the stream.
 * @param cap - Max stream cards ({@link HOME_NOIR_STREAM_CAP}).
 */
function pickStreamProducts(
  sortedNewestFirst: readonly Product[],
  coverProduct: Product | null,
  cap: number
): Product[] {
  const coverId = coverProduct !== null ? coverProduct.id : null;
  const safeCap =
    Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : HOME_NOIR_STREAM_CAP;
  const out: Product[] = [];
  for (const product of sortedNewestFirst) {
    if (coverId !== null && product.id === coverId) {
      continue;
    }
    out.push(product);
    if (out.length >= safeCap) {
      break;
    }
  }
  return out;
}

type DropHeroProps = {
  product: Product | null;
  tokens: ThemeTokens;
  /**
   * Frame 1 cover height ≈ full usable via
   * {@link frame1CoverMediaHeight} (overlay plate stays inside).
   */
  height: number;
  frame1Promo: Promotion | null;
  /** Whether to render the thin Frame 1 promo cue (media-gated). */
  showFrame1PromoCue: boolean;
};

/**
 * Tonight's lead drop frame — full-bleed media with dark overlay commerce
 * plate, CTA, and optional thin promo cue. Plate stays **inside** the tall
 * cover height; no stacked top scrims / wordmark.
 */
function NoirDropHero({
  product,
  tokens,
  height,
  frame1Promo,
  showFrame1PromoCue,
}: DropHeroProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { translateProduct } = useContentTranslation();
  const thumb = product !== null ? productThumb(product) : "";
  const name =
    product !== null
      ? translateProduct(product.id, "name", product.name ?? null)
      : "";
  const displayName =
    name.length > 0 ? name : product !== null ? t("common.product") : "";
  const promoCueTitle =
    frame1Promo !== null
      ? resolvePromotionDisplayTitle(frame1Promo, locale)
      : "";

  const openProduct = (): void => {
    if (product !== null) {
      openBrowseProduct(router, product.id, { returnTo: "home" });
      return;
    }
    router.push("/(tabs)/browse");
  };

  return (
    <View
      style={{
        height,
        marginHorizontal: 0,
        backgroundColor: tokens.panel,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={openProduct}
        accessibilityRole="button"
        accessibilityLabel={
          product !== null
            ? t("home.noirDropAria", { name: displayName })
            : t("home.productHeroAlt")
        }
        style={{ flex: 1 }}
      >
        {thumb.length > 0 ? (
          <Image
            source={{ uri: thumb }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            accessibilityLabel={t("home.productHeroAlt")}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: tokens.panel }} />
        )}
      </Pressable>

      {/* Dark commerce plate — inside tall cover; no top scrims */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: HOME_HORIZONTAL_PADDING,
          paddingTop: 28,
          paddingBottom: HOME_SPACE.md,
          backgroundColor: "rgba(10,10,10,0.72)",
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: tokens.muted,
            marginBottom: HOME_SPACE.xs,
          }}
        >
          {t("home.noirDropEyebrow")}
        </Text>

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
              marginBottom: HOME_SPACE.xs,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: tokens.accent,
              }}
              numberOfLines={1}
            >
              {t("home.frame1PromoCue", { name: promoCueTitle })}
            </Text>
          </Pressable>
        ) : null}

        {product !== null ? (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 22,
              fontWeight: "700",
              color: tokens.text,
              marginBottom: 4,
            }}
          >
            {formatRm(product.price)}
          </Text>
        ) : null}

        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            color: tokens.muted,
            marginBottom: HOME_SPACE.sm,
          }}
          numberOfLines={2}
        >
          {displayName.length > 0 ? displayName : t("home.newArrivals")}
        </Text>

        <PressableScale
          haptic="medium"
          onPress={openProduct}
          accessibilityRole="button"
          accessibilityLabel={
            product !== null
              ? t("home.heroCtaViewProduct")
              : t("home.heroCtaShop")
          }
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 18,
            height: 40,
            borderRadius: 4,
            backgroundColor: tokens.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: "600",
              color: tokens.bg,
            }}
          >
            {product !== null
              ? t("home.heroCtaViewProduct")
              : t("home.heroCtaShop")}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

/**
 * Noir Home — tonight's drop stream (Tier A), Round 5 curate silhouette.
 *
 * Round 2 tidy grammar kept: no peek, no MODEL MATCH wordmark, overlay
 * commerce plate (no stacked scrims), Home≠Shop cap.
 *
 * Round 5 vs Classic: tall cover → **chip offers** → **1-col large 3:4
 * stream** (~{@link HOME_NOIR_STREAM_CAP} excluding cover) → **≤2 full-bleed
 * journal posts** → optional Shop all. No categories, no
 * `HomeProductGrid` / `HomePromoBannerStack` / product snap.
 * Skin remains Inter / uppercase / dark tokens only.
 */
export function NoirHomeScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { products, loading: productsLoading } = useProductContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { isEnabled } = useFeatureFlags();
  const { startTour } = useGuide();
  const promoCtx = useOptionalPromotionContext();
  const promotionsEnabled = isEnabled("promotions");
  const insets = useSafeAreaInsets();

  /**
   * Triggers the first-launch App Guide once the home settle has finished.
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

  const activePromotions = useMemo((): Promotion[] => {
    if (promoCtx === null) {
      return [];
    }
    return filterActivePromotions(promoCtx.promotions);
  }, [promoCtx]);

  const activePromoCount = activePromotions.length;
  const frame1Promo =
    activePromoCount > 0 ? (activePromotions[0] ?? null) : null;

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

  const dropProduct = useMemo(
    () => pickFrame1Product(sortedProducts),
    [sortedProducts]
  );

  const streamProducts = useMemo(
    () =>
      pickStreamProducts(sortedProducts, dropProduct, HOME_NOIR_STREAM_CAP),
    [sortedProducts, dropProduct]
  );

  const journalPosts = useMemo(
    () => sortedPosts.slice(0, HOME_NOIR_POSTS_CAP),
    [sortedPosts]
  );

  const isLoading = productsLoading;

  const windowHeight = Dimensions.get("window").height;

  const usableHeight = getHomeUsableHeight({
    windowHeight,
    topInset: insets.top,
    bottomInset: insets.bottom,
    inFlowHeaderHeight: HOME_NOIR_INFLOW_HEADER_ROW_HEIGHT,
  });

  const hasOffers = promotionsEnabled && activePromoCount > 0;
  const hasPromoCue = frame1Promo !== null;

  /**
   * Overlay plate lives inside Frame 1 — chrome reserve stays 0.
   * Gate the thin promo cue only if the tall cover still leaves readable media.
   */
  const chromeWithCue =
    FRAME1_OVERLAY_CHROME_RESERVE + FRAME1_PROMO_CUE_RESERVE;
  const coverWithCueCheck = frame1CoverMediaHeight(
    usableHeight,
    chromeWithCue
  );
  const showFrame1PromoCue =
    hasPromoCue && coverWithCueCheck >= FRAME1_HERO_MEDIA_MIN;
  /**
   * Cover ≈ full usable. Overlay commerce does not push media down.
   */
  const dropHeight = frame1CoverMediaHeight(
    usableHeight,
    FRAME1_OVERLAY_CHROME_RESERVE
  );

  if (isLoading && products.length === 0) {
    return <PageLoadingSkeleton variant="home" />;
  }

  const hasStream = streamProducts.length > 0;
  const hasPosts = journalPosts.length > 0;

  // Ceremony indices stay coherent as optional sections appear / disappear.
  let sectionIndex = 0;
  const dropIndex = sectionIndex;
  sectionIndex += 1;
  const offersIndex = hasOffers ? sectionIndex : null;
  if (hasOffers) {
    sectionIndex += 1;
  }
  const streamIndex = hasStream ? sectionIndex : null;
  if (hasStream) {
    sectionIndex += 1;
  }
  const postsIndex = hasPosts ? sectionIndex : null;
  if (hasPosts) {
    sectionIndex += 1;
  }
  const shopAllIndex = sectionIndex;
  sectionIndex += 1;
  const lastContentIndex = Math.max(0, sectionIndex - 1);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <HomeArrivalCeremony
        lastContentIndex={lastContentIndex}
        style={{ flex: 1 }}
        onFinish={handleCeremonyFinish}
      >
        <NoirHomeBody
          tokens={tokens}
          dropIndex={dropIndex}
          offersIndex={offersIndex}
          streamIndex={streamIndex}
          postsIndex={postsIndex}
          shopAllIndex={shopAllIndex}
          dropProduct={dropProduct}
          dropHeight={dropHeight}
          showFrame1PromoCue={showFrame1PromoCue}
          frame1Promo={frame1Promo}
          streamProducts={streamProducts}
          journalPosts={journalPosts}
          postMediaMap={postMediaMap}
        />
      </HomeArrivalCeremony>
    </View>
  );
}

type NoirHomeBodyProps = {
  tokens: ThemeTokens;
  dropIndex: number;
  offersIndex: number | null;
  streamIndex: number | null;
  postsIndex: number | null;
  shopAllIndex: number;
  dropProduct: Product | null;
  /** Frame 1 cover height ≈ full usable (overlay plate inside). */
  dropHeight: number;
  showFrame1PromoCue: boolean;
  frame1Promo: Promotion | null;
  /** 1-col stream products (cover SKU already excluded). */
  streamProducts: Product[];
  /** Up to {@link HOME_NOIR_POSTS_CAP} journal posts. */
  journalPosts: Post[];
  postMediaMap: Map<string, string>;
};

/**
 * Tonight's drop content under {@link HomeArrivalCeremony}.
 * Overrides ceremony delays for a snappy Noir settle.
 */
function NoirHomeBody({
  tokens,
  dropIndex,
  offersIndex,
  streamIndex,
  postsIndex,
  shopAllIndex,
  dropProduct,
  dropHeight,
  showFrame1PromoCue,
  frame1Promo,
  streamProducts,
  journalPosts,
  postMediaMap,
}: NoirHomeBodyProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { play } = useHomeCeremony();
  const { translatePost } = useContentTranslation();
  const { isInWishlist, addToWishlist, removeFromWishlist } =
    useWishlistContext();

  return (
    <>
      {/* In-flow top bar: search + bag only (no MODEL MATCH wordmark) */}
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: tokens.bg,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
          zIndex: 40,
        }}
      >
        <View
          style={{
            height: HOME_NOIR_INFLOW_HEADER_ROW_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingHorizontal: HOME_HORIZONTAL_PADDING,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
            <TourAnchor id={ANCHORS.home.search}>
              <PressableScale
                haptic="light"
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => router.push("/(tabs)/browse")}
                accessibilityRole="button"
                accessibilityLabel={t("nav.openSearch")}
              >
                <Ionicons name="search-outline" size={20} color={tokens.text} />
              </PressableScale>
            </TourAnchor>
            <TourAnchor id={ANCHORS.home.bag}>
              <CartButton
                color={tokens.text}
                size={40}
                iconSize={20}
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
        {/* ── Frame 1 — tall full-usable cover (overlay plate inside) ── */}
        <CeremonySection
          index={dropIndex}
          play={play}
          baseDelayMs={NOIR_BASE_DELAY_MS}
          durationMs={NOIR_SETTLE_MS}
          staggerMs={NOIR_STAGGER_MS}
          translateFrom={8}
          scaleFrom={motion.scale.heroStart}
        >
          <NoirDropHero
            product={dropProduct}
            tokens={tokens}
            height={dropHeight}
            frame1Promo={frame1Promo}
            showFrame1PromoCue={showFrame1PromoCue}
          />
        </CeremonySection>

        {/* ── Offers — compact chip rail (not stacked banners) ── */}
        {offersIndex !== null ? (
          <CeremonySection
            index={offersIndex}
            play={play}
            baseDelayMs={NOIR_BASE_DELAY_MS}
            durationMs={NOIR_SETTLE_MS}
            staggerMs={NOIR_STAGGER_MS}
            translateFrom={6}
          >
            <NoirOffersChips
              title={t("home.offers")}
              subtitle={t("home.noirOffersHint")}
            />
          </CeremonySection>
        ) : null}

        {/* ── Tonight stream — 1-col large 3:4 cards ── */}
        {streamIndex !== null ? (
          <CeremonySection
            index={streamIndex}
            play={play}
            baseDelayMs={NOIR_BASE_DELAY_MS}
            durationMs={NOIR_SETTLE_MS}
            staggerMs={NOIR_STAGGER_MS}
            translateFrom={8}
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
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: tokens.text,
                  }}
                  numberOfLines={1}
                >
                  {t("home.noirFeedTitle")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: tokens.muted,
                    marginTop: HOME_SPACE.xs,
                    lineHeight: 16,
                  }}
                  numberOfLines={1}
                >
                  {t("home.noirFeedHint")}
                </Text>
              </View>

              <View style={{ gap: HOME_SPACE.md }}>
                {streamProducts.map((product, index) => {
                  const saved = isInWishlist(product.id);
                  return (
                    <NoirFeaturedCard
                      key={product.id}
                      product={product}
                      imageUri={productThumb(product)}
                      priceLabel={formatRm(product.price)}
                      indexLabel={formatStreamOrdinal(index)}
                      guideHeart={index === 0}
                      wishlisted={saved}
                      onWishlistPress={() => {
                        void (saved
                          ? removeFromWishlist(product.id)
                          : addToWishlist(product.id));
                      }}
                      onPress={() =>
                        openBrowseProduct(router, product.id, {
                          returnTo: "home",
                        })
                      }
                    />
                  );
                })}
              </View>
            </View>
          </CeremonySection>
        ) : null}

        {/* ── Journal — ≤2 full-bleed posts (no 2-col grid) ── */}
        {postsIndex !== null && journalPosts.length > 0 ? (
          <CeremonySection
            index={postsIndex}
            play={play}
            baseDelayMs={NOIR_BASE_DELAY_MS}
            durationMs={NOIR_SETTLE_MS}
            staggerMs={NOIR_STAGGER_MS}
            translateFrom={6}
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
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: tokens.text,
                  }}
                  numberOfLines={1}
                >
                  {t("home.latestPosts")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    color: tokens.muted,
                    marginTop: HOME_SPACE.xs,
                    lineHeight: 16,
                  }}
                  numberOfLines={1}
                >
                  {t("home.postsSubline")}
                </Text>
              </View>

              <View style={{ gap: HOME_SPACE.md }}>
                {journalPosts.map((post) => {
                  const uri = postMediaMap.get(post.id) ?? "";
                  const caption = translatePost(
                    post.id,
                    "caption",
                    post.caption
                  );
                  return (
                    <Pressable
                      key={post.id}
                      onPress={() =>
                        router.push("/(tabs)/profile/highlights")
                      }
                      style={{
                        width: "100%",
                        aspectRatio: HOME_ASPECT.productCard,
                        backgroundColor: tokens.panel,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: tokens.border,
                      }}
                      accessibilityLabel={t("home.postAlt")}
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
                            backgroundColor: "rgba(10,10,10,0.72)",
                            padding: HOME_SPACE.sm,
                          }}
                        >
                          <Text
                            style={{
                              color: tokens.text,
                              fontSize: 13,
                              fontFamily: "Inter_400Regular",
                              letterSpacing: 0.3,
                            }}
                            numberOfLines={2}
                          >
                            {caption}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </CeremonySection>
        ) : null}

        {/* ── Calm Shop all text link ── */}
        <CeremonySection
          index={shopAllIndex}
          play={play}
          baseDelayMs={NOIR_BASE_DELAY_MS}
          durationMs={NOIR_SETTLE_MS}
          staggerMs={NOIR_STAGGER_MS}
          translateFrom={4}
        >
          <Pressable
            onPress={() => router.push("/(tabs)/browse")}
            hitSlop={8}
            style={{
              marginTop: HOME_SPACE.md,
              marginBottom: HOME_SPACE.sm,
              paddingHorizontal: HOME_HORIZONTAL_PADDING,
              alignItems: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("home.noirShopAll")}
          >
            <Text
              style={{
                fontSize: 12,
                color: tokens.muted,
                fontFamily: "Inter_400Regular",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              {t("home.noirShopAll")}
            </Text>
          </Pressable>
        </CeremonySection>

        {/* Calm empty state when catalog has nothing */}
        {dropProduct === null && streamProducts.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: tokens.muted,
              paddingVertical: HOME_SPACE.lg * 2,
              paddingHorizontal: HOME_HORIZONTAL_PADDING,
              fontFamily: "Inter_400Regular",
              fontSize: 13,
            }}
          >
            {t("home.emptyProducts")}
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}
