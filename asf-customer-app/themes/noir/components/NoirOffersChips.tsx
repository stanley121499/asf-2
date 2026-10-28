import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useLocale, useTranslation } from "@/context/LocaleContext";
import {
  useOptionalPromotionContext,
  type Promotion,
} from "@/context/PromotionContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { HOME_SPACE } from "@/lib/homeLayout";
import {
  filterActivePromotions,
  formatPromotionDiscountLabel,
  getPromotionCode,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";

/** Equal compact chip height — title + discount fit without variable stretch. */
const NOIR_OFFER_CHIP_HEIGHT = 56;

/** Fixed chip width so the rail reads as equal units (no mid-glyph edge clip). */
const NOIR_OFFER_CHIP_WIDTH = 148;

/** Horizontal page padding echoed on the chip ScrollView edges. */
const NOIR_OFFERS_EDGE_PAD = 16;

export type NoirOffersChipsProps = {
  /** Section title (e.g. `home.offers`). */
  title: string;
  /** Quiet subline under the title. */
  subtitle: string;
  /** Optional top margin for ceremony section spacing. */
  style?: { marginTop?: number };
};

/**
 * Noir Home offers — compact equal-height chip rail (Round 5).
 *
 * Horizontal scroll with edge padding so chips are never cut mid-glyph at rest.
 * Not a Classic-style stacked banner band.
 *
 * @returns Chip rail, or `null` when there are no active promotions.
 */
export function NoirOffersChips({
  title,
  subtitle,
  style,
}: NoirOffersChipsProps): React.ReactElement | null {
  const tokens = useThemeTokens();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const promoCtx = useOptionalPromotionContext();

  const activePromos = useMemo((): Promotion[] => {
    if (promoCtx === null) {
      return [];
    }
    return filterActivePromotions(promoCtx.promotions);
  }, [promoCtx]);

  if (activePromos.length === 0) {
    return null;
  }

  return (
    <View style={[{ marginTop: HOME_SPACE.md }, style]}>
      <View
        style={{
          paddingHorizontal: NOIR_OFFERS_EDGE_PAD,
          marginBottom: HOME_SPACE.sm,
        }}
      >
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
          {title}
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
          {subtitle}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: NOIR_OFFERS_EDGE_PAD,
          gap: HOME_SPACE.xs,
        }}
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
                  router.push({
                    pathname: "/cart",
                    params: { promoCode: code },
                  });
                  return;
                }
                router.push("/(tabs)/browse");
              }}
              accessibilityRole="button"
              accessibilityLabel={t("home.offerTapAria", {
                name: displayTitle,
              })}
              style={{
                width: NOIR_OFFER_CHIP_WIDTH,
                height: NOIR_OFFER_CHIP_HEIGHT,
                paddingHorizontal: HOME_SPACE.sm,
                paddingVertical: HOME_SPACE.xs,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: tokens.border,
                backgroundColor: tokens.panel,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: tokens.text,
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {displayTitle}
              </Text>
              {discountLabel !== null ? (
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    fontWeight: "600",
                    color: tokens.accent,
                  }}
                  numberOfLines={1}
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
