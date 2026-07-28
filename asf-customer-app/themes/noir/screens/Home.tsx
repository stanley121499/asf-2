"use client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ANCHORS, TourAnchor, useGuide } from "@/components/guide";
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
import type { Product } from "@/context/product/ProductContext";
import { useProductContext } from "@/context/product/ProductContext";
import { usePromotionContext } from "@/context/PromotionContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { formatRm } from "@/lib/formatCurrency";
import { motion } from "@/lib/motion";
import {
  filterActivePromotions,
  formatPromotionDiscountLabel,
  getPromotionCode,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";
import { tenantBrand } from "@/lib/tenantBrand";
import { NoirFeaturedCard } from "@/themes/noir/components/NoirFeaturedCard";
import type { ThemeTokens } from "@/themes/types";

/**
 * Max products in the curated Home stream after the drop hero.
 * Drop + stream ≤ 8 SKUs total — never a Shop-sized catalog dump.
 */
const HOME_STREAM_CAP = 7;

/**
 * Snappy Noir settle — ~300–500ms feel, not Atelier long presence.
 */
const NOIR_SETTLE_MS = 340;
const NOIR_STAGGER_MS = 45;
const NOIR_BASE_DELAY_MS = 40;

/**
 * Resolves the first product media URL, or an empty string when missing.
 */
function productThumb(product: Product): string {
  const first = product.medias[0];
  return typeof first?.media_url === "string" ? first.media_url : "";
}

/**
 * Formats a zero-padded ordinal for stream cards (e.g. "01").
 */
function streamIndexLabel(index: number): string {
  const n = index + 1;
  return n < 10 ? `0${String(n)}` : String(n);
}

/**
 * Compact offer chips — the sole secondary strip on Noir Home.
 * Mount only when the promotions feature flag is on and promos exist.
 * Tightened vs Classic tall strip: no hint copy, smaller chips.
 */
function NoirOffersChips({ tokens }: { tokens: ThemeTokens }): React.ReactElement | null {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { promotions } = usePromotionContext();

  const activePromos = useMemo(
    () => filterActivePromotions(promotions),
    [promotions]
  );

  if (activePromos.length === 0) {
    return null;
  }

  return (
    <View style={{ marginTop: 2, marginBottom: 4 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
      >
        {activePromos.map((promo) => {
          const discountLabel = formatPromotionDiscountLabel(promo);
          const code = getPromotionCode(promo);
          const displayTitle = resolvePromotionDisplayTitle(promo, locale);

          return (
            <Pressable
              key={promo.id}
              onPress={() => {
                if (code !== null) {
                  router.push({ pathname: "/cart", params: { promoCode: code } });
                  return;
                }
                router.push("/(tabs)/browse");
              }}
              accessibilityLabel={t("home.offerTapAria", { name: displayTitle })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                backgroundColor: tokens.panel,
                borderWidth: 1,
                borderColor: tokens.border,
                borderRadius: 4,
                maxWidth: 180,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: tokens.text,
                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                {displayTitle}
              </Text>
              {discountLabel !== null ? (
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    color: tokens.accent,
                    fontWeight: "600",
                  }}
                >
                  {t(discountLabel.key, { value: discountLabel.value })}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type DropHeroProps = {
  product: Product;
  tokens: ThemeTokens;
  height: number;
};

/**
 * Tonight's lead drop frame — large commerce hero with price + name.
 * Not an Atelier magazine essay / Playfair season cover.
 */
function NoirDropHero({
  product,
  tokens,
  height,
}: DropHeroProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { translateProduct } = useContentTranslation();
  const thumb = productThumb(product);
  const name = translateProduct(product.id, "name", product.name ?? null);
  const displayName = name.length > 0 ? name : t("common.product");

  return (
    <Pressable
      onPress={() => openBrowseProduct(router, product.id, { returnTo: "home" })}
      accessibilityRole="button"
      accessibilityLabel={t("home.noirDropAria", { name: displayName })}
      style={{
        height,
        marginHorizontal: 0,
        backgroundColor: tokens.panel,
        overflow: "hidden",
      }}
    >
      {thumb.length > 0 ? (
        <Image
          source={{ uri: thumb }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          accessibilityLabel={t("home.productAlt")}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: tokens.panel }} />
      )}
      {/* Commerce meta plate — price forward, no season essay */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 36,
          paddingBottom: 18,
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
            marginBottom: 8,
          }}
        >
          {t("home.noirDropEyebrow")}
        </Text>
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
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            color: tokens.muted,
          }}
          numberOfLines={2}
        >
          {displayName}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Noir Home — tonight's drop (Tier A). Curate, not catalog.
 *
 * Composition (intentionally ≠ Shop inventory machine, ≠ Classic stack, ≠ Atelier chapters):
 * 1. Compact solid top bar (brand + search + bag) — always on
 * 2. Strong drop / featured frame (~55% viewport)
 * 3. Optional ONE secondary: tight offer chips (when flag + promos)
 * 4. Masthead (Tonight / Drop + quiet Shop all) + ≤7 LARGE single-column moments
 *
 * Total curated SKUs ≤ 8 (drop + stream). Never a 24-cell Shop twin.
 * Motion: snappy settle (~300–500ms). `useReducedMotion` → instant via ceremony.
 */
export function NoirHomeScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { products, loading: productsLoading } = useProductContext();
  const { isEnabled } = useFeatureFlags();
  const { startTour } = useGuide();
  const { promotions } = usePromotionContext();
  const promotionsEnabled = isEnabled("promotions");

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

  const activePromoCount = useMemo(
    () => filterActivePromotions(promotions).length,
    [promotions]
  );

  const showOffersStrip = promotionsEnabled && activePromoCount > 0;
  const dropProduct: Product | null = sortedProducts[0] ?? null;
  const streamProducts = useMemo(() => {
    // Drop is featured separately; stream continues with a short curated cut.
    const start = dropProduct !== null ? 1 : 0;
    return sortedProducts.slice(start, start + HOME_STREAM_CAP);
  }, [sortedProducts, dropProduct]);

  if (productsLoading) {
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

  let sectionIndex = 0;
  const dropIndex = dropProduct !== null ? sectionIndex++ : null;
  const offersIndex = showOffersStrip ? sectionIndex++ : null;
  const feedIndex = sectionIndex;
  sectionIndex += 1;
  const lastContentIndex = Math.max(0, sectionIndex - 1);

  const windowHeight = Dimensions.get("window").height;
  const dropHeight = Math.round(windowHeight * 0.55);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <HomeArrivalCeremony
        lastContentIndex={lastContentIndex}
        style={{ flex: 1 }}
        onFinish={handleCeremonyFinish}
      >
        <NoirHomeBody
          tokens={tokens}
          feedIndex={feedIndex}
          dropIndex={dropIndex}
          offersIndex={offersIndex}
          dropProduct={dropProduct}
          dropHeight={dropHeight}
          streamProducts={streamProducts}
          showOffersStrip={showOffersStrip}
        />
      </HomeArrivalCeremony>
    </View>
  );
}

type NoirHomeBodyProps = {
  tokens: ThemeTokens;
  feedIndex: number;
  dropIndex: number | null;
  offersIndex: number | null;
  dropProduct: Product | null;
  dropHeight: number;
  streamProducts: Product[];
  showOffersStrip: boolean;
};

/**
 * Tonight's drop content under {@link HomeArrivalCeremony}.
 * Overrides ceremony delays for a snappy Noir settle.
 */
function NoirHomeBody({
  tokens,
  feedIndex,
  dropIndex,
  offersIndex,
  dropProduct,
  dropHeight,
  streamProducts,
  showOffersStrip,
}: NoirHomeBodyProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { play } = useHomeCeremony();
  const { isInWishlist, addToWishlist, removeFromWishlist } =
    useWishlistContext();

  return (
    <>
      {/* Compact solid top bar — brand + search + bag (always on) */}
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
            height: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              letterSpacing: 2.4,
              fontWeight: "600",
              color: tokens.text,
              textTransform: "uppercase",
            }}
            numberOfLines={1}
          >
            {tenantBrand.displayName}
          </Text>
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
        {/* ── Strong drop / featured frame ── */}
        {dropIndex !== null && dropProduct !== null ? (
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
            />
          </CeremonySection>
        ) : null}

        {/* ── ONE secondary: tight offer chips ── */}
        {offersIndex !== null && showOffersStrip ? (
          <CeremonySection
            index={offersIndex}
            play={play}
            baseDelayMs={NOIR_BASE_DELAY_MS}
            durationMs={NOIR_SETTLE_MS}
            staggerMs={NOIR_STAGGER_MS}
            translateFrom={6}
          >
            <View style={{ marginTop: 12 }}>
              <NoirOffersChips tokens={tokens} />
            </View>
          </CeremonySection>
        ) : null}

        {/* ── Curated stream: ≤7 large single-column moments ── */}
        <CeremonySection
          index={feedIndex}
          play={play}
          baseDelayMs={NOIR_BASE_DELAY_MS}
          durationMs={NOIR_SETTLE_MS}
          staggerMs={NOIR_STAGGER_MS}
          translateFrom={8}
        >
          <View
            style={{
              marginTop: showOffersStrip || dropProduct !== null ? 20 : 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: tokens.text,
                    fontWeight: "600",
                  }}
                >
                  {t("home.noirFeedTitle")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 11,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: tokens.muted,
                  }}
                >
                  {t("home.noirNewLabel")}
                </Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/browse")} hitSlop={8}>
                <Text
                  style={{
                    fontSize: 12,
                    color: tokens.muted,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  {t("home.noirShopAll")}
                </Text>
              </Pressable>
            </View>

            {streamProducts.length > 0 ? (
              <View style={{ gap: 10 }}>
                {streamProducts.map((product, productIndex) => {
                  const thumb = productThumb(product);
                  return (
                    <NoirFeaturedCard
                      key={product.id}
                      product={product}
                      imageUri={thumb}
                      priceLabel={formatRm(product.price)}
                      indexLabel={streamIndexLabel(productIndex)}
                      guideHeart={productIndex === 0}
                      wishlisted={isInWishlist(product.id)}
                      onPress={() =>
                        openBrowseProduct(router, product.id, {
                          returnTo: "home",
                        })
                      }
                      onWishlistPress={() => {
                        void (isInWishlist(product.id)
                          ? removeFromWishlist(product.id)
                          : addToWishlist(product.id));
                      }}
                    />
                  );
                })}
              </View>
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: tokens.muted,
                  paddingVertical: 32,
                  paddingHorizontal: 16,
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                }}
              >
                {t("home.emptyProducts")}
              </Text>
            )}

            {/* Quiet door into the catalog machine — Home ends the drop here */}
            {streamProducts.length > 0 ? (
              <Pressable
                onPress={() => router.push("/(tabs)/browse")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("home.noirShopAll")}
                style={{
                  marginTop: 24,
                  marginBottom: 8,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    color: tokens.muted,
                  }}
                >
                  {t("home.noirShopAll")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </CeremonySection>
      </ScrollView>
    </>
  );
}
