import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePromotionContext } from "@/context/PromotionContext";
import {
  filterActivePromotions,
  formatPromotionDiscountLabel,
  getPromotionCode,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";

/**
 * Horizontal strip of currently active promotions for the home screen.
 * Must only mount when the `promotions` feature flag is on (PromotionProvider present).
 * Renders nothing when the filtered list is empty.
 *
 * Promo `name` values in DB are Chinese-canonical. For en/ms the card title uses
 * the promo code (locale-agnostic); discount / section chrome stay on `t()`.
 */
export function HomeOffersStrip(): React.ReactElement | null {
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
    <View style={{ marginTop: 28 }}>
      <Text
        style={{
          fontFamily: "PlayfairDisplay_400Regular",
          fontSize: 24,
          color: colors.text,
          paddingHorizontal: 16,
          marginBottom: 16,
        }}
      >
        {t("home.offers")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {activePromos.map((promo) => {
          const discountLabel = formatPromotionDiscountLabel(promo);
          const code = getPromotionCode(promo);
          const displayTitle = resolvePromotionDisplayTitle(promo, locale);
          /** Avoid duplicating "Code: X" when the title is already the code (en/ms). */
          const showCodeLine = code !== null && displayTitle !== code;

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
                width: 200,
                padding: 16,
                backgroundColor: colors.panel,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_400Regular",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {displayTitle}
              </Text>
              {discountLabel !== null && (
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    color: colors.accent,
                    fontWeight: "500",
                    marginBottom: showCodeLine ? 8 : 0,
                  }}
                >
                  {t(discountLabel.key, { value: discountLabel.value })}
                </Text>
              )}
              {showCodeLine && code !== null ? (
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: colors.muted,
                  }}
                  numberOfLines={1}
                >
                  {t("home.offerCode", { code })}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
