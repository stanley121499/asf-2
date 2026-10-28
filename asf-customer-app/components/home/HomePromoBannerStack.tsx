import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import {
  HomePromoBanner,
  type HomePromoBannerColors,
  type HomePromoBannerFonts,
} from "@/components/home/HomePromoBanner";
import { colors as classicColors } from "@/constants/theme";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePromotionContext } from "@/context/PromotionContext";
import {
  HOME_PROMO_BANNER_HEIGHT,
  HOME_SPACE,
  getHomeGridMetrics,
} from "@/lib/homeLayout";
import {
  filterActivePromotions,
  formatPromotionDiscountLabel,
  getPromotionCode,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";

/**
 * Props for {@link HomePromoBannerStack}.
 *
 * Round 4 preferred Home offers module: **vertical** stack of fixed-height
 * {@link HomePromoBanner}s (length + purpose). Prefer this over
 * {@link HomePromoBannerPager} on Home.
 */
export type HomePromoBannerStackProps = {
  /** Section title; defaults to `t("home.offers")`. */
  title?: string;
  /**
   * Optional calm editorial subline under the offers title.
   * Already localized by the caller.
   */
  subtitle?: string;
  /** Horizontal padding for header + banners (default `16`). */
  contentPaddingHorizontal?: number;
  /** Banner height; defaults to {@link HOME_PROMO_BANNER_HEIGHT}. */
  bannerHeight?: number;
  /** Vertical gap between stacked banners; defaults to {@link HOME_SPACE.md}. */
  bannerGap?: number;
  /** Banner color override (Noir passes dark tokens). */
  bannerColors?: Partial<HomePromoBannerColors>;
  /** Banner font override. */
  bannerFonts?: Partial<HomePromoBannerFonts>;
  /** Section title color. */
  titleColor?: string;
  /** Subline / muted color. */
  subtitleColor?: string;
  /** Title font family. */
  titleFamily?: string;
  /** Subline font family. */
  subtitleFamily?: string;
  /** Title size in px. */
  titleSize?: number;
  /** Subline size in px. */
  subtitleSize?: number;
  /** Optional title letter-spacing (Noir). */
  titleLetterSpacing?: number;
  /** When true, title renders uppercase (Noir). */
  titleUppercase?: boolean;
  /** Extra style on the title text. */
  titleStyle?: StyleProp<TextStyle>;
  /** Extra style on the subtitle text. */
  subtitleStyle?: StyleProp<TextStyle>;
  /**
   * Outer section style. Defaults to Round 4 denser top spacing
   * (`HOME_SPACE.md`). Themes may override.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Home promo module: fixed-height full-width banners stacked vertically.
 *
 * Must only mount when the `promotions` feature flag is on (`PromotionProvider`
 * present). Renders `null` when the filtered active list is empty.
 *
 * **Round 4:** preferred over {@link HomePromoBannerPager} for Home — stack
 * adds vertical scroll length and a clear “offers” beat below the cover.
 */
export function HomePromoBannerStack({
  title,
  subtitle,
  contentPaddingHorizontal = 16,
  bannerHeight = HOME_PROMO_BANNER_HEIGHT,
  bannerGap = HOME_SPACE.md,
  bannerColors,
  bannerFonts,
  titleColor = classicColors.text,
  subtitleColor = classicColors.muted,
  titleFamily = "PlayfairDisplay_400Regular",
  subtitleFamily = "Inter_400Regular",
  titleSize = 24,
  subtitleSize = 13,
  titleLetterSpacing,
  titleUppercase,
  titleStyle,
  subtitleStyle,
  style,
}: HomePromoBannerStackProps): React.ReactElement | null {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { promotions } = usePromotionContext();
  const { width: windowWidth } = useWindowDimensions();

  const activePromos = useMemo(
    () => filterActivePromotions(promotions),
    [promotions]
  );

  /**
   * One-column grid metrics reuse the same padding/width math as product
   * grids so banner width matches body content width.
   */
  const metrics = useMemo(
    () =>
      getHomeGridMetrics({
        windowWidth,
        horizontalPadding: contentPaddingHorizontal,
        gap: 0,
        columns: 1,
      }),
    [contentPaddingHorizontal, windowWidth]
  );

  if (activePromos.length === 0) {
    return null;
  }

  const sectionTitle = title ?? t("home.offers");
  const hasSubtitle =
    typeof subtitle === "string" && subtitle.trim().length > 0;
  const safeGap =
    Number.isFinite(bannerGap) ? Math.max(0, bannerGap) : HOME_SPACE.md;

  return (
    <View style={[{ marginTop: HOME_SPACE.md }, style]}>
      <View
        style={{
          paddingHorizontal: contentPaddingHorizontal,
          marginBottom: HOME_SPACE.md,
        }}
      >
        <Text
          style={[
            {
              fontFamily: titleFamily,
              fontSize: titleSize,
              color: titleColor,
              letterSpacing: titleLetterSpacing,
              textTransform: titleUppercase === true ? "uppercase" : "none",
            },
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {sectionTitle}
        </Text>
        {hasSubtitle ? (
          <Text
            style={[
              {
                fontFamily: subtitleFamily,
                fontSize: Math.max(11, subtitleSize - 1),
                color: subtitleColor,
                marginTop: HOME_SPACE.xs,
                lineHeight: 16,
              },
              subtitleStyle,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: contentPaddingHorizontal }}>
        {activePromos.map((promo, index) => {
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
                marginBottom:
                  index < activePromos.length - 1 ? safeGap : 0,
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
      </View>
    </View>
  );
}
