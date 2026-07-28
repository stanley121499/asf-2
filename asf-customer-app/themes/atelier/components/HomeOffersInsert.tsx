"use client";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useLocale, useTranslation } from "@/context/LocaleContext";
import { usePromotionContext } from "@/context/PromotionContext";
import { useThemeTokens } from "@/context/ThemeContext";
import {
  filterActivePromotions,
  formatPromotionDiscountLabel,
  getPromotionCode,
  resolvePromotionDisplayTitle,
} from "@/lib/promotions/activePromotions";

/**
 * Quiet typography-led paper "Insert" for Atelier Home — one promo plate,
 * not Classic horizontal retail cards. Renders nothing when the filtered
 * list is empty. Mount only when the `promotions` feature flag is on.
 */
export function AtelierHomeOffersInsert(): React.ReactElement | null {
  const router = useRouter();
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { promotions } = usePromotionContext();

  const featuredPromo = useMemo(() => {
    const active = filterActivePromotions(promotions);
    return active.length > 0 ? active[0] : null;
  }, [promotions]);

  if (featuredPromo === null) {
    return null;
  }

  const discountLabel = formatPromotionDiscountLabel(featuredPromo);
  const code = getPromotionCode(featuredPromo);
  const displayTitle = resolvePromotionDisplayTitle(featuredPromo, locale);
  const showCodeLine = code !== null && displayTitle !== code;

  return (
    <View
      style={{
        marginTop: 36,
        marginHorizontal: 24,
        paddingVertical: 28,
        paddingHorizontal: 22,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.panel,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 10,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          color: tokens.muted,
          marginBottom: 14,
        }}
      >
        {t("home.atelierInsertLabel")}
      </Text>
      <Pressable
        onPress={() => {
          if (code !== null) {
            router.push({ pathname: "/cart", params: { promoCode: code } });
            return;
          }
          router.push("/(tabs)/browse");
        }}
        accessibilityRole="button"
        accessibilityLabel={t("home.offerTapAria", { name: displayTitle })}
      >
        <Text
          style={{
            fontFamily: "PlayfairDisplay_400Regular",
            fontSize: 24,
            lineHeight: 30,
            color: tokens.text,
            marginBottom: 10,
          }}
          numberOfLines={3}
        >
          {displayTitle}
        </Text>
        {discountLabel !== null ? (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              letterSpacing: 0.3,
              color: tokens.accent,
              marginBottom: showCodeLine ? 8 : 0,
            }}
          >
            {t(discountLabel.key, { value: discountLabel.value })}
          </Text>
        ) : null}
        {showCodeLine && code !== null ? (
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: tokens.muted,
              marginTop: 4,
            }}
            numberOfLines={1}
          >
            {t("home.offerCode", { code })}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}
