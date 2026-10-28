import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  HOME_ASPECT,
  HOME_GRID_COLUMNS,
  HOME_SPACE,
  chunkHomeGridRows,
  type HomeGridMetrics,
} from "@/lib/homeLayout";

/**
 * Props for {@link HomeProductGrid}.
 *
 * Presentational 2-column (or N-column) equal-card grid for Round 4 Home
 * product / post body sections. Themes pass card chrome via `renderItem`
 * (fonts, save heart, price, etc.); this component only owns row geometry.
 */
export type HomeProductGridProps<T> = {
  /** Flat list of items (already capped Home≠Shop by the caller). */
  items: readonly T[];
  /**
   * From {@link getHomeGridMetrics}. Drives `cardWidth`, `gap`, and `columns`.
   */
  metrics: HomeGridMetrics;
  /** Stable key for each item. */
  keyExtractor: (item: T, index: number) => string;
  /**
   * Renders one card. `cardWidth` matches `metrics.cardWidth`; wrap media in
   * `aspectRatio: HOME_ASPECT.productCard` (or use
   * {@link HomeProductGridMediaFrame}).
   */
  renderItem: (
    item: T,
    index: number,
    cardWidth: number
  ) => React.ReactNode;
  /** Outer grid wrapper style. */
  style?: StyleProp<ViewStyle>;
  /** Per-row style (row already sets `flexDirection: "row"` + gap). */
  rowStyle?: StyleProp<ViewStyle>;
};

/**
 * Props for {@link HomeProductGridMediaFrame} — equal 3:4 media box.
 */
export type HomeProductGridMediaFrameProps = {
  /** Card width from grid metrics (also sets frame width). */
  width: number;
  /** Aspect ratio; defaults to {@link HOME_ASPECT.productCard}. */
  aspectRatio?: number;
  /** Fill / panel background behind the image. */
  backgroundColor?: string;
  /** Extra style on the media box. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Equal-aspect media frame for Round 4 Home grid tiles.
 *
 * Use inside `HomeProductGrid` `renderItem` so Classic/Noir share the same
 * `HOME_ASPECT.productCard` box (products === posts tile geometry).
 */
export function HomeProductGridMediaFrame({
  width,
  aspectRatio = HOME_ASPECT.productCard,
  backgroundColor,
  style,
  children,
}: HomeProductGridMediaFrameProps): React.ReactElement {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeAspect =
    Number.isFinite(aspectRatio) && aspectRatio > 0
      ? aspectRatio
      : HOME_ASPECT.productCard;

  return (
    <View
      style={[
        {
          width: safeWidth,
          aspectRatio: safeAspect,
          backgroundColor,
          overflow: "hidden",
          marginBottom: HOME_SPACE.xs,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Vertical 2-column Home product / post grid (Round 4 editorial body).
 *
 * Replaces horizontal {@link HomeSnapSection} product/post pages on Home.
 * Does **not** peek or snap — rows scroll with the page.
 *
 * **Agent 2/3 wiring:**
 * ```
 * const grid = getHomeGridMetrics({
 *   windowWidth,
 *   horizontalPadding: 16,
 *   gap: HOME_SPACE.sm,
 *   columns: HOME_GRID_COLUMNS,
 * });
 * <HomeProductGrid
 *   items={cappedProducts}
 *   metrics={grid}
 *   keyExtractor={(p) => p.id}
 *   renderItem={(product, index, cardWidth) => (
 *     <Pressable style={{ width: cardWidth }}>...</Pressable>
 *   )}
 * />
 * ```
 */
export function HomeProductGrid<T>({
  items,
  metrics,
  keyExtractor,
  renderItem,
  style,
  rowStyle,
}: HomeProductGridProps<T>): React.ReactElement | null {
  const columns =
    Number.isFinite(metrics.columns) && metrics.columns > 0
      ? Math.floor(metrics.columns)
      : HOME_GRID_COLUMNS;
  const gap =
    Number.isFinite(metrics.gap) ? Math.max(0, metrics.gap) : HOME_SPACE.sm;
  const cardWidth =
    Number.isFinite(metrics.cardWidth) ? Math.max(0, metrics.cardWidth) : 0;

  const rows = useMemo(
    () => chunkHomeGridRows(items, columns),
    [items, columns]
  );

  if (items.length === 0 || cardWidth <= 0) {
    return null;
  }

  return (
    <View style={[styles.grid, style]}>
      {rows.map((rowItems, rowIndex) => {
        const rowStartIndex = rowIndex * columns;
        return (
          <View
            key={`home-grid-row-${rowIndex}`}
            style={[
              styles.row,
              {
                gap,
                marginBottom: rowIndex < rows.length - 1 ? gap : 0,
              },
              rowStyle,
            ]}
          >
            {rowItems.map((item, colIndex) => {
              const index = rowStartIndex + colIndex;
              return (
                <View
                  key={keyExtractor(item, index)}
                  style={{ width: cardWidth }}
                >
                  {renderItem(item, index, cardWidth)}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
});
