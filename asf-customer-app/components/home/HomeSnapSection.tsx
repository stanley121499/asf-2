import React, { useCallback, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTranslation } from "@/context/LocaleContext";
import { HOME_SPACE } from "@/lib/homeLayout";

/**
 * Theme-flexible colors for {@link HomeSnapSection}.
 * Pass Classic (Playfair / muted) or Noir (uppercase / dark) tokens from the pack.
 */
export type HomeSnapSectionColors = {
  /** Section title color. */
  title: string;
  /** Trailing “Swipe” hint color (muted). */
  swipeHint: string;
  /** Active page-dot color. */
  dotActive: string;
  /** Inactive page-dot color. */
  dotInactive: string;
};

/**
 * Theme-flexible typography for {@link HomeSnapSection}.
 */
export type HomeSnapSectionFonts = {
  /** Title font family (e.g. Playfair / Inter). */
  titleFamily: string;
  /** Swipe-hint font family. */
  hintFamily: string;
  /** Title size in px. */
  titleSize: number;
  /** Hint size in px. */
  hintSize: number;
  /** Optional title letter-spacing (Noir often uses tracking). */
  titleLetterSpacing?: number;
  /** When true, title renders uppercase (Noir). */
  titleUppercase?: boolean;
};

/**
 * Props for {@link HomeSnapSection}.
 *
 * **Discoverability:** half-card peek is forbidden. When `pageCount > 1`, the
 * trailing swipe hint and/or page dots are the only “this slides” cues.
 */
export type HomeSnapSectionProps = {
  /** Left section title (already localized). */
  title: string;
  /**
   * Optional calm editorial subline under the title (Round 3 density voice).
   * Already localized by the caller. Keep short — one line.
   */
  subtitle?: string;
  /**
   * Total snap pages. Hint + dots show only when this is greater than 1.
   * Use {@link getHomeSnapPageCount} from `@/lib/homeLayout`.
   */
  pageCount: number;
  /**
   * Full-bleed page shell width from {@link getHomeSnapMetrics}
   * (`snapToInterval` === `windowWidth`). Children must be one page shell per
   * child with `width: snapToInterval` and **internal** `paddingHorizontal`
   * (do not pad the ScrollView content container — that breaks snap / peeks).
   */
  snapToInterval: number;
  /** Horizontal padding for the header row only (match page-shell padding). */
  contentPaddingHorizontal?: number;
  /** Color tokens from the active theme pack. */
  colors: HomeSnapSectionColors;
  /** Font tokens from the active theme pack. */
  fonts: HomeSnapSectionFonts;
  /**
   * When true (default), show `home.swipeHint` in the header when
   * `pageCount > 1`. Set false to rely on dots only.
   */
  showSwipeHint?: boolean;
  /**
   * When true (default), show page dots under the row when `pageCount > 1`.
   */
  showDots?: boolean;
  /** Optional trailing node (e.g. “See all →”) rendered before the swipe hint. */
  headerTrailing?: React.ReactNode;
  /** Extra styles for the outer section wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Extra styles for the title text. */
  titleStyle?: StyleProp<TextStyle>;
  /** Extra styles for the subtitle text. */
  subtitleStyle?: StyleProp<TextStyle>;
  /** Extra styles for the horizontal content container (avoid horizontal padding). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Horizontal page children. One full-bleed shell per page:
   * `width: snapToInterval`, internal padding, then a row of equal cards.
   */
  children: React.ReactNode;
  /** Optional a11y label for the horizontal scroller. */
  accessibilityLabel?: string;
  /** Called when the settled page index changes. */
  onPageChange?: (pageIndex: number) => void;
};

/**
 * Reusable Home horizontal snap section: title + optional editorial subtitle,
 * swipe hint, paging ScrollView, and page dots.
 *
 * Round 2: **no peek** — snap pages of full cards only; dots/hint teach swipe.
 * Round 3: optional calm `subtitle` under the title for editorial density.
 *
 * **Round 4 Home:** do **not** use for products/posts (or as the primary promo
 * pattern). Prefer vertical {@link HomeProductGrid} +
 * `HomePromoBannerStack`. File may remain for rare non-Home paged use.
 */
export function HomeSnapSection({
  title,
  subtitle,
  pageCount,
  snapToInterval,
  contentPaddingHorizontal = 16,
  colors,
  fonts,
  showSwipeHint = true,
  showDots = true,
  headerTrailing,
  style,
  titleStyle,
  subtitleStyle,
  contentContainerStyle,
  children,
  accessibilityLabel,
  onPageChange,
}: HomeSnapSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState(0);
  const activePageRef = useRef(0);

  const multiPage = pageCount > 1;
  const hintVisible = multiPage && showSwipeHint;
  const dotsVisible = multiPage && showDots;
  const hasSubtitle =
    typeof subtitle === "string" && subtitle.trim().length > 0;

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (snapToInterval <= 0 || pageCount < 1) {
        return;
      }
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextPage = Math.round(offsetX / snapToInterval);
      const clamped = Math.max(0, Math.min(pageCount - 1, nextPage));
      if (clamped === activePageRef.current) {
        return;
      }
      activePageRef.current = clamped;
      setActivePage(clamped);
      if (onPageChange !== undefined) {
        onPageChange(clamped);
      }
    },
    [onPageChange, pageCount, snapToInterval]
  );

  const titleTextStyle: TextStyle = {
    fontFamily: fonts.titleFamily,
    fontSize: fonts.titleSize,
    color: colors.title,
    letterSpacing: fonts.titleLetterSpacing,
    textTransform: fonts.titleUppercase === true ? "uppercase" : "none",
    flexShrink: 1,
  };

  const pageAnnouncement =
    multiPage
      ? t("home.pageIndicator", {
          current: activePage + 1,
          total: pageCount,
        })
      : undefined;

  return (
    <View style={style}>
      <View
        style={{
          paddingHorizontal: contentPaddingHorizontal,
          marginBottom: HOME_SPACE.md,
        }}
      >
        <View style={styles.header}>
          <Text style={[titleTextStyle, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headerTrailing}>
            {headerTrailing}
            {hintVisible ? (
              <Text
                style={{
                  fontFamily: fonts.hintFamily,
                  fontSize: fonts.hintSize,
                  color: colors.swipeHint,
                }}
                accessibilityRole="text"
                accessibilityLabel={t("home.swipeHint")}
              >
                {t("home.swipeHint")}
              </Text>
            ) : null}
          </View>
        </View>
        {hasSubtitle ? (
          <Text
            style={[
              {
                fontFamily: fonts.hintFamily,
                fontSize: Math.max(11, fonts.hintSize - 1),
                color: colors.swipeHint,
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapToInterval > 0 ? snapToInterval : undefined}
        snapToAlignment="start"
        disableIntervalMomentum
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={contentContainerStyle}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={
          multiPage ? t("home.swipeHint") : undefined
        }
        accessibilityValue={
          pageAnnouncement !== undefined
            ? { text: pageAnnouncement }
            : undefined
        }
      >
        {children}
      </ScrollView>

      {dotsVisible ? (
        <View
          style={styles.dotsRow}
          accessibilityRole="adjustable"
          accessibilityLabel={pageAnnouncement}
        >
          {Array.from({ length: pageCount }, (_, index) => {
            const isActive = index === activePage;
            return (
              <View
                key={`home-snap-dot-${index}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive
                      ? colors.dotActive
                      : colors.dotInactive,
                    opacity: isActive ? 1 : 0.45,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: HOME_SPACE.sm,
  },
  headerTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: HOME_SPACE.sm,
    flexShrink: 0,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: HOME_SPACE.xs,
    marginTop: HOME_SPACE.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
