import React, { useCallback, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { HomeKindFilter } from "@/lib/storefront/homeCategoryFilter";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/** How many equal-width chips fit in one visible "page". */
const CHIPS_PER_PAGE = 4;

/**
 * Vertical size of the rail row (padding + label + underline).
 * Home uses this when reserving fixed chrome below the overlay nav.
 */
export const STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT = 48;

/** Inactive label — darker than token muted so chips stay readable. */
const INACTIVE_LABEL = "#3F3F3F";

export type StorefrontHomeCategoryRailProps = {
  /** Distinct `kind_key` values (All is synthetic and always first). */
  kindKeys: readonly string[];
  /** Active Home kind filter. */
  selected: HomeKindFilter;
  /** Called when the user selects All or a kind chip. */
  onSelect: (filter: HomeKindFilter) => void;
  /**
   * Localized label for a `kind_key` (category translation preferred).
   * Falls back to the raw key when empty.
   */
  resolveKindLabel: (kindKey: string) => string;
  /** Localized label for the synthetic All chip. */
  allLabel: string;
  /** Outer wrapper style. */
  style?: StyleProp<ViewStyle>;
};

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Equal slot width for the 4-up (or ≤4 fill) layout. */
  width: number;
};

/**
 * Text tab chip with a clear gold underline when active.
 * Equal-width slots — not rounded-full pills.
 */
function KindChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  width,
}: ChipProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={{
        width,
        height: STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderBottomWidth: selected ? 3 : 0,
        borderBottomColor: selected ? tokens.accent : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          fontWeight: selected ? "700" : "500",
          fontSize: selected ? 15 : 14,
          color: selected ? tokens.text : INACTIVE_LABEL,
          letterSpacing: 0.25,
          textAlign: "center",
          /**
           * Soft halo keeps labels readable when the rail sits on the shared
           * translucent hero scrim (same opacity as the nav — not a thicker fill).
           */
          textShadowColor: "rgba(255,255,255,0.9)",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type ChipDescriptor = {
  key: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Storefront Home category-type filter rail.
 *
 * Chips = synthetic **All** + one chip per distinct `kind_key`.
 * Layout: equal-width slots — ≤4 fill the row; >4 size to ¼ of the rail and
 * snap-scroll by pages of 4.
 */
export function StorefrontHomeCategoryRail({
  kindKeys,
  selected,
  onSelect,
  resolveKindLabel,
  allLabel,
  style,
}: Readonly<StorefrontHomeCategoryRailProps>): React.ReactElement {
  const [railWidth, setRailWidth] = useState(0);

  const isAllSelected = selected.type === "all";

  const handleSelectAll = useCallback((): void => {
    onSelect({ type: "all" });
  }, [onSelect]);

  const handleSelectKind = useCallback(
    (kindKey: string): void => {
      onSelect({ type: "kind", kindKey });
    },
    [onSelect]
  );

  const chips: ChipDescriptor[] = useMemo(() => {
    const rows: ChipDescriptor[] = [
      {
        key: "__all__",
        label: allLabel,
        selected: isAllSelected,
        onPress: handleSelectAll,
      },
    ];
    for (const kindKey of kindKeys) {
      const label = resolveKindLabel(kindKey);
      const displayLabel =
        label.trim().length > 0 ? label.trim() : kindKey;
      rows.push({
        key: kindKey,
        label: displayLabel,
        selected:
          selected.type === "kind" && selected.kindKey === kindKey,
        onPress: () => {
          handleSelectKind(kindKey);
        },
      });
    }
    return rows;
  }, [
    allLabel,
    handleSelectAll,
    handleSelectKind,
    isAllSelected,
    kindKeys,
    resolveKindLabel,
    selected,
  ]);

  const chipCount = chips.length;
  const measuredWidth = Math.max(0, Math.floor(railWidth));

  /**
   * ≤4 chips: equal widths that fill the rail (no leftover gap).
   * >4 chips: each slot is ¼ of the visible rail so ~4 show at a time.
   */
  const chipWidth =
    measuredWidth <= 0 || chipCount <= 0
      ? 0
      : chipCount <= CHIPS_PER_PAGE
        ? Math.floor(measuredWidth / chipCount)
        : Math.floor(measuredWidth / CHIPS_PER_PAGE);

  /**
   * Distribute any floor remainder across the first chips so ≤4 fills edge-to-edge.
   */
  const widths: number[] = useMemo(() => {
    if (chipWidth <= 0 || chipCount <= 0 || measuredWidth <= 0) {
      return chips.map(() => 0);
    }
    if (chipCount <= CHIPS_PER_PAGE) {
      const base = Math.floor(measuredWidth / chipCount);
      const remainder = measuredWidth - base * chipCount;
      return chips.map((_, index) =>
        index < remainder ? base + 1 : base
      );
    }
    return chips.map(() => chipWidth);
  }, [chipCount, chipWidth, chips, measuredWidth]);

  const snapToInterval =
    chipCount > CHIPS_PER_PAGE && chipWidth > 0
      ? chipWidth * CHIPS_PER_PAGE
      : undefined;

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    const nextWidth = event.nativeEvent.layout.width;
    if (
      Number.isFinite(nextWidth) &&
      nextWidth > 0 &&
      Math.floor(nextWidth) !== railWidth
    ) {
      setRailWidth(Math.floor(nextWidth));
    }
  }, [railWidth, chipCount]);

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          height: STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT,
          width: "100%",
          /**
           * Transparent by default — Home fixed chrome owns the shared
           * opaque / scrim background behind nav + rail.
           */
          backgroundColor: "transparent",
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
          /**
           * Defensive clip: guarantees this rail can never visually bleed
           * above (into the nav row) or below (into scrolled content) its
           * own fixed band, regardless of any child measurement drift.
           */
          overflow: "hidden",
        },
        style,
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={allLabel}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={chipCount > CHIPS_PER_PAGE}
        snapToInterval={snapToInterval}
        decelerationRate={
          snapToInterval !== undefined ? "fast" : "normal"
        }
        disableIntervalMomentum={snapToInterval !== undefined}
        bounces={chipCount > CHIPS_PER_PAGE}
        /**
         * Explicit, static cross-axis size (not auto-fit) so this row is
         * never left to engine-specific intrinsic-height guessing — the
         * exact class of layout timing issue that can otherwise make a
         * horizontal ScrollView's row collapse/mis-measure and appear to
         * wrap or render at the wrong position.
         */
        style={{
          flexGrow: 0,
          flexShrink: 0,
          height: STOREFRONT_HOME_CATEGORY_RAIL_HEIGHT,
          width: "100%",
        }}
        contentContainerStyle={{
          /**
           * Explicit row + nowrap — never rely on ScrollView's internal
           * default merge behavior alone to keep chips on a single line.
           */
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "stretch",
          flexGrow: chipCount <= CHIPS_PER_PAGE ? 1 : undefined,
        }}
      >
        {chips.map((chip, index) => (
          <KindChip
            key={chip.key}
            label={chip.label}
            selected={chip.selected}
            onPress={chip.onPress}
            accessibilityLabel={chip.label}
            width={widths[index] ?? chipWidth}
          />
        ))}
      </ScrollView>
    </View>
  );
}
