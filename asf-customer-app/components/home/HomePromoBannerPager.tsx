import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  HomePromoBanner,
  type HomePromoBannerColors,
  type HomePromoBannerFonts,
} from "@/components/home/HomePromoBanner";
import { HomeSnapSection } from "@/components/home/HomeSnapSection";
import { colors as classicColors } from "@/constants/theme";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePromotionContext } from "@/context/PromotionContext";
import {
  HOME_PROMO_BANNER_HEIGHT,
  HOME_SPACE,
  getHomeSnapMetrics,
  getHomeSnapPageCount,
} from "@/lib/homeLayout";
import {
  filterActivePromotions,
  formatPromotionDiscountLabel,
  getPromotionCode,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";

/**
 * Props for {@link HomePromoBannerPager}.
 *
 * Multiple promos page horizontally — **one full banner per snap page**, no
 * peek.
 *
 * **Round 4 Home:** prefer {@link HomePromoBannerStack} (vertical stack) for
 * offers length + purpose. This pager is demoted for Home — keep only if a
 * single-visible / rare paged treatment is explicitly needed.
 */
export type HomePromoBannerPagerProps = {
  /** Section title; defaults to `t("home.offers")`. */
  title?: string;
  /** Horizontal padding shared by header + banner pages (default `16`). */
  contentPaddingHorizontal?: number;
  /** Banner height; defaults to {@link HOME_PROMO_BANNER_HEIGHT}. */
  bannerHeight?: number;
  /** Banner color override (Noir passes dark tokens). */
  bannerColors?: Partial<HomePromoBannerColors>;
  /** Banner font override. */
  bannerFonts?: Partial<HomePromoBannerFonts>;
  /** Snap section header/dot colors; Classic defaults when omitted. */
  sectionTitleColor?: string;
  sectionHintColor?: string;
  sectionDotActiveColor?: string;
  sectionDotInactiveColor?: string;
  /** Snap section title font family. */
  sectionTitleFamily?: string;
  sectionHintFamily?: string;
  sectionTitleSize?: number;
  sectionHintSize?: number;
  sectionTitleLetterSpacing?: number;
  sectionTitleUppercase?: boolean;
  /**
   * Optional calm editorial subline under the offers title (Round 3).
   * Already localized by the caller.
   */
  subtitle?: string;
  /**
   * Outer section style. Defaults to Round 3 denser top spacing
   * (`HOME_SPACE.md`). Themes may override.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Home promo module: fixed-height full-width banners in a no-peek snap pager.
 *
 * Must only mount when the `promotions` feature flag is on (`PromotionProvider`
 * present). Renders `null` when the filtered active list is empty.
 *
 * **Round 4:** demoted for Home — Agents 2–3 should use
 * {@link HomePromoBannerStack} instead so offers add vertical scroll length.
 * This pager may remain for rare non-Home or single-page experiments.
 *
 * Does **not** revive variable-height `HomeOffersStrip` cards.
 */
export function HomePromoBannerPager({
  title,
  contentPaddingHorizontal = 16,
  bannerHeight = HOME_PROMO_BANNER_HEIGHT,
  bannerColors,
  bannerFonts,
  sectionTitleColor = classicColors.text,
  sectionHintColor = classicColors.muted,
  sectionDotActiveColor = classicColors.text,
  sectionDotInactiveColor = classicColors.border,
  sectionTitleFamily = "PlayfairDisplay_400Regular",
  sectionHintFamily = "Inter_400Regular",
  sectionTitleSize = 24,
  sectionHintSize = 13,
  sectionTitleLetterSpacing,
  sectionTitleUppercase,
  subtitle,
  style,
}: HomePromoBannerPagerProps): React.ReactElement | null {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { promotions } = usePromotionContext();
  const { width: windowWidth } = useWindowDimensions();

  const activePromos = useMemo(
    () => filterActivePromotions(promotions),
    [promotions]
  );

  const metrics = useMemo(
    () =>
      getHomeSnapMetrics({
        windowWidth,
        horizontalPadding: contentPaddingHorizontal,
        gap: 0,
        cardsPerPage: 1,
      }),
    [contentPaddingHorizontal, windowWidth]
  );

  const pageCount = getHomeSnapPageCount(activePromos.length, 1);

  if (activePromos.length === 0) {
    return null;
  }

  const sectionTitle = title ?? t("home.offers");

  return (
    <HomeSnapSection
      title={sectionTitle}
      subtitle={subtitle}
      pageCount={pageCount}
      snapToInterval={metrics.snapToInterval}
      contentPaddingHorizontal={contentPaddingHorizontal}
      style={[{ marginTop: HOME_SPACE.md }, style]}
      colors={{
        title: sectionTitleColor,
        swipeHint: sectionHintColor,
        dotActive: sectionDotActiveColor,
        dotInactive: sectionDotInactiveColor,
      }}
      fonts={{
        titleFamily: sectionTitleFamily,
        hintFamily: sectionHintFamily,
        titleSize: sectionTitleSize,
        hintSize: sectionHintSize,
        titleLetterSpacing: sectionTitleLetterSpacing,
        titleUppercase: sectionTitleUppercase,
      }}
    >
      {activePromos.map((promo) => {
        const discountParams = formatPromotionDiscountLabel(promo);
        const code = getPromotionCode(promo);
        const displayTitle = resolvePromotionDisplayTitle(promo, locale);
        const showCodeLine = code !== null && displayTitle !== code;
        const discountLabel =
          discountParams !== null
            ? t(discountParams.key, { value: discountParams.value })
            : null;
        const codeLabel =
          showCodeLine && code !== null
            ? t("home.offerCode", { code })
            : null;

        return (
          <View
            key={promo.id}
            style={{
              width: metrics.snapToInterval,
              paddingHorizontal: metrics.horizontalPadding,
            }}
          >
            <HomePromoBanner
              title={displayTitle}
              discountLabel={discountLabel}
              codeLabel={codeLabel}
              width={metrics.cardWidth}
              height={bannerHeight}
              colors={bannerColors}
              fonts={bannerFonts}
              accessibilityLabel={t("home.offerTapAria", {
                name: displayTitle,
              })}
              onPress={() => {
                if (code !== null) {
                  router.push({
                    pathname: "/cart",
                    params: { promoCode: code },
                  });
                  return;
                }
                router.push("/(tabs)/browse");
              }}
            />
          </View>
        );
      })}
    </HomeSnapSection>
  );
}
