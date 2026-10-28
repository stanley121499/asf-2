import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors as classicColors } from "@/constants/theme";
import { HOME_PROMO_BANNER_HEIGHT, HOME_SPACE } from "@/lib/homeLayout";

/**
 * Theme-flexible colors for a single {@link HomePromoBanner}.
 */
export type HomePromoBannerColors = {
  background: string;
  border: string;
  title: string;
  discount: string;
  code: string;
};

/**
 * Theme-flexible fonts for {@link HomePromoBanner}.
 */
export type HomePromoBannerFonts = {
  titleFamily: string;
  bodyFamily: string;
  titleSize?: number;
  bodySize?: number;
  codeSize?: number;
};

/**
 * Props for a single full-width fixed-height Home promo banner.
 */
export type HomePromoBannerProps = {
  /** Display title (locale-resolved). */
  title: string;
  /** Optional discount line (already localized). */
  discountLabel?: string | null;
  /** Optional code line (already localized, e.g. `Code: SUMMER`). */
  codeLabel?: string | null;
  /** Press handler (apply promo / navigate). */
  onPress: () => void;
  /** Accessibility label for the pressable. */
  accessibilityLabel: string;
  /**
   * Banner width. Use full content width (window − horizontal padding) for
   * a single stacked banner, or `snapToInterval` when inside a pager page.
   */
  width: number;
  /**
   * Fixed banner height. Defaults to {@link HOME_PROMO_BANNER_HEIGHT}.
   * Do not pass variable heights derived from copy length.
   */
  height?: number;
  /** Color override; defaults to Classic light tokens. */
  colors?: Partial<HomePromoBannerColors>;
  /** Font override; defaults to Classic Playfair / Inter. */
  fonts?: Partial<HomePromoBannerFonts>;
  /** Extra style on the outer pressable. */
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_COLORS: HomePromoBannerColors = {
  background: classicColors.panel,
  border: classicColors.border,
  title: classicColors.text,
  discount: classicColors.accent,
  code: classicColors.muted,
};

const DEFAULT_FONTS: HomePromoBannerFonts = {
  titleFamily: "PlayfairDisplay_400Regular",
  bodyFamily: "Inter_400Regular",
  titleSize: 16,
  bodySize: 14,
  codeSize: 12,
};

/**
 * Full-width, fixed-height promo banner for Round 2 Home.
 *
 * Replaces variable-height `HomeOffersStrip` cards on Home. Height is locked
 * via {@link HOME_PROMO_BANNER_HEIGHT} so every banner is identical.
 */
export function HomePromoBanner({
  title,
  discountLabel,
  codeLabel,
  onPress,
  accessibilityLabel,
  width,
  height = HOME_PROMO_BANNER_HEIGHT,
  colors: colorsOverride,
  fonts: fontsOverride,
  style,
}: HomePromoBannerProps): React.ReactElement {
  const palette: HomePromoBannerColors = {
    ...DEFAULT_COLORS,
    ...colorsOverride,
  };
  const type: HomePromoBannerFonts = {
    ...DEFAULT_FONTS,
    ...fontsOverride,
  };

  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeHeight =
    Number.isFinite(height) && height > 0 ? height : HOME_PROMO_BANNER_HEIGHT;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.banner,
        {
          width: safeWidth,
          height: safeHeight,
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        <Text
          style={{
            fontFamily: type.titleFamily,
            fontSize: type.titleSize ?? DEFAULT_FONTS.titleSize,
            color: palette.title,
            marginBottom: HOME_SPACE.xs,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {typeof discountLabel === "string" && discountLabel.length > 0 ? (
          <Text
            style={{
              fontFamily: type.bodyFamily,
              fontSize: type.bodySize ?? DEFAULT_FONTS.bodySize,
              color: palette.discount,
              fontWeight: "500",
              marginBottom:
                typeof codeLabel === "string" && codeLabel.length > 0
                  ? HOME_SPACE.xs
                  : 0,
            }}
            numberOfLines={1}
          >
            {discountLabel}
          </Text>
        ) : null}
        {typeof codeLabel === "string" && codeLabel.length > 0 ? (
          <Text
            style={{
              fontFamily: type.bodyFamily,
              fontSize: type.codeSize ?? DEFAULT_FONTS.codeSize,
              color: palette.code,
            }}
            numberOfLines={1}
          >
            {codeLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    overflow: "hidden",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: HOME_SPACE.md,
    paddingVertical: HOME_SPACE.sm,
  },
});
