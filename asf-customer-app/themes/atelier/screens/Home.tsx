"use client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANCHORS, TourAnchor, useGuide } from "@/components/guide";
import {
  HomeArrivalCeremony,
  useHomeCeremony,
} from "@/components/home/HomeArrivalCeremony";
import { CeremonySection } from "@/components/motion";
import { useContentTranslation } from "@/context/ContentTranslationContext";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { usePostContext } from "@/context/post/PostContext";
import { usePostMediaContext } from "@/context/post/PostMediaContext";
import { useCategoryContext, type Category } from "@/context/product/CategoryContext";
import type { Product } from "@/context/product/ProductContext";
import { useProductContext } from "@/context/product/ProductContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { useWishlistContext } from "@/context/WishlistContext";
import {
  hasAttemptedFirstLaunchTrigger,
  hasSeenFirstGuide,
  markFirstLaunchTriggerAttempted,
} from "@/lib/appGuide";
import { openBrowseProduct } from "@/lib/browseNavigation";
import { formatRm } from "@/lib/formatCurrency";
import { motion } from "@/lib/motion";
import { tenantBrand } from "@/lib/tenantBrand";
import { AtelierEditorialCoverCopy } from "@/themes/atelier/components/EditorialCoverCopy";
import { AtelierHomeChromeReveal } from "@/themes/atelier/components/HomeChromeReveal";
import { AtelierHomeOffersInsert } from "@/themes/atelier/components/HomeOffersInsert";
import { atelierMotion } from "@/themes/atelier/motion";
import type { ThemeTokens } from "@/themes/types";

/** Max curated product chapters on Home — never a full catalog feed. */
const MAX_HOME_CHAPTERS = 3;

/** Editorial chapter layout role — same products, unequal silhouettes. */
type ChapterRole = "opener" | "variation" | "closing";

/**
 * First product media URL, or empty string when missing.
 */
function productThumb(product: Product): string {
  const first = product.medias[0];
  return typeof first?.media_url === "string" ? first.media_url : "";
}

/**
 * Zero-pad chapter index for editorial captions (`01`, `02`, …).
 */
function chapterOrdinal(index: number): string {
  const n = index + 1;
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Maps chapter index → unequal layout role. Single piece = opener only;
 * two pieces = opener + closing; three = opener + variation + closing.
 */
function chapterRoleForIndex(index: number, total: number): ChapterRole {
  if (index === 0) {
    return "opener";
  }
  if (total >= 2 && index === total - 1) {
    return "closing";
  }
  return "variation";
}

/**
 * First sentence of an editorial description for chapter captions.
 * Returns empty string when missing so callers can fall back to i18n.
 */
function firstEditorialSentence(raw: string | null): string {
  if (typeof raw !== "string") {
    return "";
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const match = /^[^.!?]+[.!?]*/.exec(trimmed);
  const sentence = (match !== null ? match[0] : trimmed).trim();
  if (sentence.length > 140) {
    return `${sentence.slice(0, 137).trim()}…`;
  }
  return sentence;
}

interface SaveHeartButtonProps {
  /** Whether this is the first save target — guide-anchored. */
  isFirstCard: boolean;
  saved: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accentColor: string;
  mutedColor: string;
}

/**
 * Heart toggle for editorial product chapters. Only the first card anchors
 * `home.saveHeart` so App Guide still works without a Classic arrivals row.
 */
function SaveHeartButton({
  isFirstCard,
  saved,
  onPress,
  accessibilityLabel,
  accentColor,
  mutedColor,
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
        color={saved ? accentColor : mutedColor}
      />
    </Pressable>
  );

  if (!isFirstCard) {
    return heart;
  }

  return <TourAnchor id={ANCHORS.home.saveHeart}>{heart}</TourAnchor>;
}

type ChapterSharedProps = {
  product: Product;
  name: string;
  caption: string;
  ordinal: string;
  thumb: string;
  saved: boolean;
  isFirstCard: boolean;
  imageHeight: number;
  tokens: ThemeTokens;
  t: (key: string, params?: Record<string, string | number>) => string;
  router: ReturnType<typeof useRouter>;
  onToggleSave: () => void;
};

/**
 * Chapter 01 opener — full-bleed frame with type on the image (cover-like).
 */
function OpenerChapter({
  product,
  name,
  caption,
  ordinal,
  thumb,
  saved,
  isFirstCard,
  imageHeight,
  tokens,
  t,
  router,
  onToggleSave,
}: ChapterSharedProps): React.ReactElement {
  return (
    <Pressable
      onPress={() =>
        openBrowseProduct(router, product.id, {
          returnTo: "home",
        })
      }
      accessibilityRole="button"
      accessibilityLabel={name}
      style={{ marginTop: 8 }}
    >
      <View
        style={{
          width: "100%",
          height: imageHeight,
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
        ) : null}
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: "flex-end",
            paddingBottom: 28,
            paddingHorizontal: 24,
            backgroundColor: "rgba(44,36,22,0.32)",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(246,241,232,0.78)",
              marginBottom: 10,
            }}
          >
            {t("home.atelierChapterLabel", { n: ordinal })}
          </Text>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 30,
              lineHeight: 36,
              color: "#F6F1E8",
              marginBottom: 10,
              maxWidth: 320,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              lineHeight: 21,
              color: "rgba(246,241,232,0.88)",
              marginBottom: 14,
              maxWidth: 300,
            }}
            numberOfLines={3}
          >
            {caption}
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
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                letterSpacing: 0.4,
                color: "rgba(246,241,232,0.75)",
              }}
            >
              {formatRm(product.price)}
            </Text>
            <SaveHeartButton
              isFirstCard={isFirstCard}
              saved={saved}
              onPress={onToggleSave}
              accessibilityLabel={
                saved ? t("home.cardUnsaveAria") : t("home.cardSaveAria")
              }
              accentColor="#F6F1E8"
              mutedColor="rgba(246,241,232,0.7)"
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Chapter 02 variation — shorter inset frame, caption above, type below.
 * Mobile stacked layout (not a fragile desktop two-column).
 */
function VariationChapter({
  product,
  name,
  caption,
  ordinal,
  thumb,
  saved,
  isFirstCard,
  imageHeight,
  tokens,
  t,
  router,
  onToggleSave,
}: ChapterSharedProps): React.ReactElement {
  const shortHeight = Math.round(imageHeight * 0.72);

  return (
    <Pressable
      onPress={() =>
        openBrowseProduct(router, product.id, {
          returnTo: "home",
        })
      }
      accessibilityRole="button"
      accessibilityLabel={name}
      style={{ marginTop: 48 }}
    >
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: tokens.muted,
            marginBottom: 8,
          }}
        >
          {t("home.atelierChapterLabel", { n: ordinal })}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            lineHeight: 21,
            color: tokens.text,
            maxWidth: 340,
          }}
          numberOfLines={3}
        >
          {caption}
        </Text>
      </View>
      <View
        style={{
          marginHorizontal: 24,
          height: shortHeight,
          backgroundColor: tokens.panel,
          overflow: "hidden",
          marginBottom: 18,
        }}
      >
        {thumb.length > 0 ? (
          <Image
            source={{ uri: thumb }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            accessibilityLabel={t("home.productAlt")}
          />
        ) : null}
      </View>
      <View
        style={{
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 24,
              lineHeight: 30,
              color: tokens.text,
              marginBottom: 8,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              letterSpacing: 0.4,
              color: tokens.muted,
            }}
          >
            {formatRm(product.price)}
          </Text>
        </View>
        <SaveHeartButton
          isFirstCard={isFirstCard}
          saved={saved}
          onPress={onToggleSave}
          accessibilityLabel={
            saved ? t("home.cardUnsaveAria") : t("home.cardSaveAria")
          }
          accentColor={tokens.accent}
          mutedColor={tokens.muted}
        />
      </View>
    </Pressable>
  );
}

/**
 * Chapter 03 closing plate — paper-led type, underline CTA toward Shop archive.
 */
function ClosingChapter({
  product,
  name,
  caption,
  ordinal,
  thumb,
  saved,
  isFirstCard,
  imageHeight,
  tokens,
  t,
  router,
  onToggleSave,
}: ChapterSharedProps): React.ReactElement {
  const plateHeight = Math.round(imageHeight * 0.9);

  return (
    <View style={{ marginTop: 56 }}>
      <Pressable
        onPress={() =>
          openBrowseProduct(router, product.id, {
            returnTo: "home",
          })
        }
        accessibilityRole="button"
        accessibilityLabel={name}
      >
        <View style={{ paddingHorizontal: 24, marginBottom: 14 }}>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: tokens.muted,
              marginBottom: 6,
            }}
          >
            {t("home.atelierChapterLabel", { n: ordinal })}
          </Text>
          <View
            style={{
              height: 1,
              width: 32,
              backgroundColor: tokens.accent,
              marginBottom: 14,
            }}
          />
          <Text
            style={{
              fontFamily: "PlayfairDisplay_400Regular",
              fontSize: 28,
              lineHeight: 34,
              color: tokens.text,
              marginBottom: 10,
            }}
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              lineHeight: 21,
              color: tokens.muted,
              marginBottom: 8,
              maxWidth: 320,
            }}
            numberOfLines={3}
          >
            {caption}
          </Text>
        </View>
        <View
          style={{
            width: "100%",
            height: plateHeight,
            backgroundColor: tokens.panel,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          {thumb.length > 0 ? (
            <Image
              source={{ uri: thumb }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              accessibilityLabel={t("home.productAlt")}
            />
          ) : null}
        </View>
        <View
          style={{
            paddingHorizontal: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              letterSpacing: 0.4,
              color: tokens.muted,
            }}
          >
            {formatRm(product.price)}
          </Text>
          <SaveHeartButton
            isFirstCard={isFirstCard}
            saved={saved}
            onPress={onToggleSave}
            accessibilityLabel={
              saved ? t("home.cardUnsaveAria") : t("home.cardSaveAria")
            }
            accentColor={tokens.accent}
            mutedColor={tokens.muted}
          />
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push("/(tabs)/browse")}
        accessibilityRole="button"
        accessibilityLabel={t("home.atelierViewLookbook")}
        hitSlop={8}
        style={{
          marginTop: 22,
          paddingHorizontal: 24,
          alignSelf: "flex-start",
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            letterSpacing: 0.6,
            color: tokens.text,
            textDecorationLine: "underline",
            textDecorationColor: tokens.accent,
          }}
        >
          {t("home.atelierViewLookbook")}
        </Text>
      </Pressable>
    </View>
  );
}

type JournalTeaserProps = {
  uri: string;
  title: string;
  eyebrow: string;
  cta: string;
  postAlt: string;
  frameHeight: number;
  tokens: ThemeTokens;
  onPress: () => void;
};

/**
 * One editorial "From the journal" frame — peeks Highlights without a feed.
 */
function JournalTeaser({
  uri,
  title,
  eyebrow,
  cta,
  postAlt,
  frameHeight,
  tokens,
  onPress,
}: JournalTeaserProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={cta}
      style={{ marginTop: 56, paddingHorizontal: 24 }}
    >
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 11,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          color: tokens.muted,
          marginBottom: 14,
        }}
      >
        {eyebrow}
      </Text>
      <View
        style={{
          width: "100%",
          height: frameHeight,
          backgroundColor: tokens.panel,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          accessibilityLabel={postAlt}
        />
      </View>
      <Text
        style={{
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 22,
          lineHeight: 28,
          color: tokens.text,
          marginBottom: 8,
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 13,
          letterSpacing: 0.4,
          color: tokens.accent,
          textDecorationLine: "underline",
          textDecorationColor: tokens.border,
        }}
      >
        {cta}
      </Text>
    </Pressable>
  );
}

/**
 * Atelier Home — seasonal edit / theater (Tier A).
 *
 * **Silhouette (vs Shop):** chrome-free first paint (no sticky brand+search bar),
 * one cover moment, bridge line, then at most {@link MAX_HOME_CHAPTERS} unequal
 * editorial chapters with captions — not denser archive cards. Optional paper
 * Insert + journal peek; end CTA + slim category text-index → Shop archive.
 *
 * **Chrome:** Scroll-reveal minimal brand + search after leaving the cover
 * ({@link atelierMotion.chromeRevealCoverFraction}). Reduced motion gets a
 * short timed reveal. Cart remains the FAB.
 *
 * **Motion:** Once-per-session entrance — cover type stagger → chapters
 * (~1–1.5s presence) with role-specific fade vs rise. Reuses
 * {@link HomeArrivalCeremony}; does not block interaction for seconds.
 */
export function AtelierHomeScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { products, loading: productsLoading } = useProductContext();
  const { categories, loading: categoriesLoading } = useCategoryContext();
  const { posts } = usePostContext();
  const { postMedias } = usePostMediaContext();
  const { isEnabled } = useFeatureFlags();
  const { startTour } = useGuide();
  const promotionsEnabled = isEnabled("promotions");
  const highlightsEnabled = isEnabled("highlights");

  /**
   * First-launch guide after arrival ceremony — same contract as Classic Home.
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
    for (const media of postMedias) {
      if (typeof media.post_id === "string" && !map.has(media.post_id)) {
        map.set(media.post_id, media.media_url ?? "");
      }
    }
    return map;
  }, [postMedias]);

  const sortedPosts = useMemo(() => {
    return [...posts]
      .filter((post) => post.id.length > 0)
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      );
  }, [posts]);

  /** Prefer a framed post with media for the journal peek; soft-fail otherwise. */
  const journalPost = useMemo(() => {
    if (!highlightsEnabled) {
      return null;
    }
    for (const post of sortedPosts) {
      const uri = postMediaMap.get(post.id) ?? "";
      if (uri.length > 0) {
        return { post, uri };
      }
    }
    return null;
  }, [highlightsEnabled, sortedPosts, postMediaMap]);

  const isLoading = productsLoading || categoriesLoading;
  const brandTagline =
    typeof tenantBrand.tagline === "string" && tenantBrand.tagline.length > 0
      ? tenantBrand.tagline
      : null;

  if (isLoading) {
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

  const chapterProducts = sortedProducts.slice(0, MAX_HOME_CHAPTERS);
  const coverPost = sortedPosts[0];
  const coverUriFromPost =
    coverPost !== undefined ? (postMediaMap.get(coverPost.id) ?? "") : "";
  const firstChapter = chapterProducts[0];
  const coverUriFromProduct =
    firstChapter !== undefined ? productThumb(firstChapter) : "";
  const coverUri =
    coverUriFromPost.length > 0 ? coverUriFromPost : coverUriFromProduct;

  const hasOffers = promotionsEnabled;
  const hasCategories = sortedCategories.length > 0;
  const hasChapters = chapterProducts.length > 0;
  const hasCover = coverUri.length > 0 || brandTagline !== null;
  const hasBridge = hasChapters;
  const hasJournal = journalPost !== null;
  const hasLookbookCta = hasChapters || hasCategories;

  /**
   * Section indices for ceremony finish haptic — cover → bridge → optional
   * insert → each chapter → optional journal → lookbook CTA / categories.
   */
  let sectionIndex = 0;
  const coverIndex = sectionIndex;
  sectionIndex += 1;
  const bridgeIndex = hasBridge ? sectionIndex : null;
  if (hasBridge) {
    sectionIndex += 1;
  }
  const offersIndex = hasOffers ? sectionIndex : null;
  if (hasOffers) {
    sectionIndex += 1;
  }
  const chapterStartIndex = hasChapters ? sectionIndex : null;
  if (hasChapters) {
    sectionIndex += chapterProducts.length;
  }
  const journalIndex = hasJournal ? sectionIndex : null;
  if (hasJournal) {
    sectionIndex += 1;
  }
  const lookbookCtaIndex = hasLookbookCta ? sectionIndex : null;
  if (hasLookbookCta) {
    sectionIndex += 1;
  }
  const categoriesIndex = hasCategories ? sectionIndex : null;
  if (hasCategories) {
    sectionIndex += 1;
  }
  const lastContentIndex = Math.max(0, sectionIndex - 1);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <HomeArrivalCeremony
        lastContentIndex={lastContentIndex}
        style={{ flex: 1 }}
        onFinish={handleCeremonyFinish}
      >
        <AtelierHomeBody
          coverIndex={coverIndex}
          bridgeIndex={bridgeIndex}
          offersIndex={offersIndex}
          chapterStartIndex={chapterStartIndex}
          journalIndex={journalIndex}
          lookbookCtaIndex={lookbookCtaIndex}
          categoriesIndex={categoriesIndex}
          brandTagline={brandTagline}
          coverUri={coverUri}
          hasCover={hasCover}
          chapterProducts={chapterProducts}
          sortedCategories={sortedCategories}
          journalPost={journalPost}
        />
      </HomeArrivalCeremony>
    </View>
  );
}

type JournalPeek = {
  post: { id: string; caption: string | null; name: string };
  uri: string;
};

type AtelierHomeBodyProps = {
  coverIndex: number;
  bridgeIndex: number | null;
  offersIndex: number | null;
  /** First chapter CeremonySection index; following chapters use +1, +2, … */
  chapterStartIndex: number | null;
  journalIndex: number | null;
  lookbookCtaIndex: number | null;
  categoriesIndex: number | null;
  brandTagline: string | null;
  coverUri: string;
  hasCover: boolean;
  chapterProducts: Product[];
  sortedCategories: Category[];
  journalPost: JournalPeek | null;
};

/**
 * Scroll body under {@link HomeArrivalCeremony} for Atelier Home.
 *
 * Cover → bridge → unequal chapters → optional insert/journal → archive door.
 */
function AtelierHomeBody({
  coverIndex,
  bridgeIndex,
  offersIndex,
  chapterStartIndex,
  journalIndex,
  lookbookCtaIndex,
  categoriesIndex,
  brandTagline,
  coverUri,
  hasCover,
  chapterProducts,
  sortedCategories,
  journalPost,
}: AtelierHomeBodyProps): React.ReactElement {
  const router = useRouter();
  const tokens = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { translateCategory, translateProduct, translatePost } =
    useContentTranslation();
  const { isInWishlist, addToWishlist, removeFromWishlist } =
    useWishlistContext();
  const { play } = useHomeCeremony();
  const reducedMotion = useReducedMotion();

  const windowWidth = Dimensions.get("window").width;
  /** Theater crop — taller than Shop archive cards so silhouettes diverge. */
  const coverHeight = Math.round(windowWidth * 1.35);
  const chapterImageHeight = Math.round(windowWidth * 1.25);

  const [chromeRevealed, setChromeRevealed] = useState(false);
  const [reducedRevealReady, setReducedRevealReady] = useState(false);

  /**
   * Reduced-motion shortcut: timed post-cover chrome so search is reachable
   * without requiring a scroll (still no multi-second blocker).
   */
  useEffect(() => {
    if (reducedMotion !== true) {
      setReducedRevealReady(false);
      return;
    }
    const timerId = setTimeout(() => {
      setReducedRevealReady(true);
    }, atelierMotion.delay.chromeReducedRevealMs);
    return () => {
      clearTimeout(timerId);
    };
  }, [reducedMotion]);

  const revealThreshold = coverHeight * atelierMotion.chromeRevealCoverFraction;
  const hideThreshold = coverHeight * atelierMotion.chromeHideCoverFraction;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      const y = event.nativeEvent.contentOffset.y;
      setChromeRevealed((prev) => {
        if (y >= revealThreshold) {
          return true;
        }
        if (y <= hideThreshold) {
          return false;
        }
        return prev;
      });
    },
    [revealThreshold, hideThreshold]
  );

  const showChrome =
    chromeRevealed || (reducedMotion === true && reducedRevealReady);

  const coverEyebrow =
    brandTagline !== null ? brandTagline : t("home.atelierCoverEyebrow");
  const coverTitle = t("home.atelierIntroTitle");
  const coverBody = t("home.atelierIntroBody");
  const coverBaseDelayMs = atelierMotion.delay.coverBaseMs;
  const chapterBaseDelayMs =
    atelierMotion.delay.coverBaseMs + atelierMotion.duration.coverEntranceMs * 0.35;

  const openSearch = useCallback((): void => {
    router.push("/(tabs)/browse");
  }, [router]);

  const openShop = useCallback((): void => {
    router.push("/(tabs)/browse");
  }, [router]);

  const openHighlights = useCallback((): void => {
    router.push("/(tabs)/highlights");
  }, [router]);

  const captionFallbackForRole = useCallback(
    (role: ChapterRole): string => {
      if (role === "opener") {
        return t("home.atelierChapterCaptionOpener");
      }
      if (role === "closing") {
        return t("home.atelierChapterCaptionClosing");
      }
      return t("home.atelierChapterCaptionVariation");
    },
    [t]
  );

  const journalTitle = useMemo(() => {
    if (journalPost === null) {
      return "";
    }
    const caption = translatePost(
      journalPost.post.id,
      "caption",
      journalPost.post.caption
    );
    return caption.length > 0 ? caption : journalPost.post.name;
  }, [journalPost, translatePost]);

  return (
    <>
      <AtelierHomeChromeReveal
        revealed={showChrome}
        onSearchPress={openSearch}
        searchAccessibilityLabel={t("nav.openSearch")}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Cover / season moment — full-bleed, no competing sticky nav */}
        {hasCover ? (
          <View>
            {coverUri.length > 0 ? (
              <View
                style={{
                  width: "100%",
                  height: coverHeight,
                  backgroundColor: tokens.panel,
                  overflow: "hidden",
                }}
              >
                <CeremonySection
                  index={coverIndex}
                  play={play}
                  baseDelayMs={coverBaseDelayMs}
                  staggerMs={atelierMotion.delay.chapterStaggerMs}
                  durationMs={atelierMotion.duration.coverEntranceMs}
                  scaleFrom={motion.scale.heroStartBold}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Image
                    source={{ uri: coverUri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    accessibilityLabel={t("home.productAlt")}
                  />
                </CeremonySection>
                <View
                  pointerEvents="box-none"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    top: 0,
                    justifyContent: "flex-end",
                    paddingBottom: 28,
                    paddingHorizontal: 24,
                    backgroundColor: "rgba(44,36,22,0.28)",
                  }}
                >
                  <AtelierEditorialCoverCopy
                    play={play}
                    baseDelayMs={coverBaseDelayMs + 40}
                    eyebrow={coverEyebrow}
                    title={coverTitle}
                    body={coverBody}
                    tone="onImage"
                  />
                </View>
              </View>
            ) : (
              <CeremonySection
                index={coverIndex}
                play={play}
                baseDelayMs={coverBaseDelayMs}
                staggerMs={atelierMotion.delay.chapterStaggerMs}
                durationMs={atelierMotion.duration.coverEntranceMs}
              >
                <View
                  style={{
                    paddingTop: insets.top + 48,
                    paddingHorizontal: 24,
                    paddingBottom: 32,
                    backgroundColor: tokens.bg,
                  }}
                >
                  {/*
                    Section owns the fade — copy stays static so opacities
                    do not multiply (image cover uses sibling type stagger).
                  */}
                  <AtelierEditorialCoverCopy
                    play={false}
                    baseDelayMs={0}
                    eyebrow={coverEyebrow}
                    title={coverTitle}
                    body={coverBody}
                    tone="onPaper"
                    bodyMaxWidth={320}
                  />
                </View>
              </CeremonySection>
            )}
          </View>
        ) : (
          <CeremonySection
            index={coverIndex}
            play={play}
            baseDelayMs={coverBaseDelayMs}
            staggerMs={atelierMotion.delay.chapterStaggerMs}
            durationMs={atelierMotion.duration.coverEntranceMs}
          >
            <View
              style={{
                paddingTop: insets.top + 48,
                paddingHorizontal: 24,
                paddingBottom: 24,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 36,
                  lineHeight: 44,
                  color: tokens.text,
                }}
              >
                {coverTitle}
              </Text>
            </View>
          </CeremonySection>
        )}

        {/* Cover → chapters bridge — magazine structure signal */}
        {bridgeIndex !== null ? (
          <CeremonySection
            index={bridgeIndex}
            play={play}
            baseDelayMs={chapterBaseDelayMs}
            staggerMs={atelierMotion.delay.chapterStaggerMs}
            durationMs={atelierMotion.duration.chapterStepMs}
            translateFrom={0}
          >
            <View
              style={{
                marginTop: 36,
                marginHorizontal: 24,
                paddingTop: 20,
                borderTopWidth: 1,
                borderColor: tokens.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                  color: tokens.muted,
                }}
              >
                {t("home.atelierBridgeLabel")}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 11,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                  color: tokens.muted,
                }}
              >
                {t("home.atelierBridgeLooks", {
                  count: chapterProducts.length,
                })}
              </Text>
            </View>
          </CeremonySection>
        ) : null}

        {/* Quiet paper Insert — not Classic horizontal retail strip */}
        {offersIndex !== null ? (
          <CeremonySection
            index={offersIndex}
            play={play}
            baseDelayMs={chapterBaseDelayMs}
            staggerMs={atelierMotion.delay.chapterStaggerMs}
            durationMs={atelierMotion.duration.chapterStepMs}
            translateFrom={0}
          >
            <AtelierHomeOffersInsert />
          </CeremonySection>
        ) : null}

        {/* Unequal editorial chapters — opener / variation / closing */}
        {chapterStartIndex !== null
          ? chapterProducts.map((product, productIndex) => {
              const thumb = productThumb(product);
              const name = translateProduct(
                product.id,
                "name",
                product.name ?? null
              );
              const description = translateProduct(
                product.id,
                "description",
                product.description ?? null
              );
              const role = chapterRoleForIndex(
                productIndex,
                chapterProducts.length
              );
              const fromDescription = firstEditorialSentence(description);
              const caption =
                fromDescription.length > 0
                  ? fromDescription
                  : captionFallbackForRole(role);
              const saved = isInWishlist(product.id);
              const ordinal = chapterOrdinal(productIndex);
              const sectionIdx = chapterStartIndex + productIndex;
              const onToggleSave = (): void => {
                void (saved
                  ? removeFromWishlist(product.id)
                  : addToWishlist(product.id));
              };
              const shared: ChapterSharedProps = {
                product,
                name,
                caption,
                ordinal,
                thumb,
                saved,
                isFirstCard: productIndex === 0,
                imageHeight: chapterImageHeight,
                tokens,
                t,
                router,
                onToggleSave,
              };

              /** Role-specific entrance: rise+scale / fade / stronger rise. */
              const translateFrom =
                role === "variation" ? 0 : role === "closing" ? 18 : 12;
              const scaleFrom =
                role === "opener" ? motion.scale.heroStart : undefined;

              return (
                <CeremonySection
                  key={product.id}
                  index={sectionIdx}
                  play={play}
                  baseDelayMs={chapterBaseDelayMs}
                  staggerMs={atelierMotion.delay.chapterStaggerMs}
                  durationMs={atelierMotion.duration.chapterStepMs}
                  translateFrom={translateFrom}
                  scaleFrom={scaleFrom}
                >
                  {role === "opener" ? (
                    <OpenerChapter {...shared} />
                  ) : null}
                  {role === "variation" ? (
                    <VariationChapter {...shared} />
                  ) : null}
                  {role === "closing" ? (
                    <ClosingChapter {...shared} />
                  ) : null}
                </CeremonySection>
              );
            })
          : null}

        {/* Optional journal teaser — one editorial frame → Highlights */}
        {journalIndex !== null && journalPost !== null ? (
          <CeremonySection
            index={journalIndex}
            play={play}
            baseDelayMs={chapterBaseDelayMs}
            staggerMs={atelierMotion.delay.chapterStaggerMs}
            durationMs={atelierMotion.duration.chapterStepMs}
            translateFrom={10}
          >
            <JournalTeaser
              uri={journalPost.uri}
              title={journalTitle}
              eyebrow={t("home.atelierJournalEyebrow")}
              cta={t("home.atelierJournalCta")}
              postAlt={t("home.postAlt")}
              frameHeight={Math.round(windowWidth * 0.85)}
              tokens={tokens}
              onPress={openHighlights}
            />
          </CeremonySection>
        ) : null}

        {/* Archive door — Home ends the edit; Shop holds the lookbook */}
        {lookbookCtaIndex !== null ? (
          <CeremonySection
            index={lookbookCtaIndex}
            play={play}
            baseDelayMs={chapterBaseDelayMs}
            staggerMs={atelierMotion.delay.chapterStaggerMs}
            durationMs={atelierMotion.duration.chapterStepMs}
          >
            <Pressable
              onPress={openShop}
              accessibilityRole="button"
              accessibilityLabel={t("home.atelierBrowseLookbook")}
              style={{
                marginTop: 56,
                marginHorizontal: 24,
                paddingVertical: 22,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: tokens.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  letterSpacing: 2.2,
                  textTransform: "uppercase",
                  color: tokens.text,
                }}
              >
                {t("home.atelierBrowseLookbook")}
              </Text>
            </Pressable>
          </CeremonySection>
        ) : null}

        {/* Slim secondary: text category index → Shop */}
        {categoriesIndex !== null ? (
          <CeremonySection
            index={categoriesIndex}
            play={play}
            baseDelayMs={chapterBaseDelayMs}
            staggerMs={atelierMotion.delay.chapterStaggerMs}
            durationMs={atelierMotion.duration.chapterStepMs}
          >
            <View
              style={{ marginTop: 40, paddingHorizontal: 24, marginBottom: 16 }}
            >
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 22,
                  color: tokens.text,
                  marginBottom: 8,
                }}
              >
                {t("home.atelierIndexTitle")}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: tokens.muted,
                  marginBottom: 20,
                }}
              >
                {t("home.atelierIndexHint")}
              </Text>
              {sortedCategories.map((cat, catIndex) => (
                <Pressable
                  key={cat.id}
                  onPress={openShop}
                  accessibilityRole="button"
                  accessibilityLabel={translateCategory(
                    cat.id,
                    cat.name ?? null
                  )}
                  style={{
                    paddingVertical: 14,
                    borderTopWidth: catIndex === 0 ? 1 : 0,
                    borderBottomWidth: 1,
                    borderColor: tokens.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 16,
                      color: tokens.text,
                    }}
                  >
                    {translateCategory(cat.id, cat.name ?? null)}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={tokens.muted}
                  />
                </Pressable>
              ))}
            </View>
          </CeremonySection>
        ) : null}

        {chapterProducts.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: tokens.muted,
              paddingVertical: 48,
              paddingHorizontal: 24,
              fontFamily: "Inter_400Regular",
            }}
          >
            {t("home.emptyProducts")}
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}
