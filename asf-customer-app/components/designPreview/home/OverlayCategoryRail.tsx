import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import {
  StorefrontHomeCategoryRail,
  type StorefrontHomeCategoryRailProps,
} from "@/components/storefront/StorefrontHomeCategoryRail";
import {
  HERO_OVERLAY_SCRIM,
  HERO_OVERLAY_SCRIM_FADE,
  HERO_VARIANT_CATEGORY_RAIL_HEIGHT,
} from "@/components/designPreview/home/heroVariantLayout";

export type OverlayCategoryRailProps = StorefrontHomeCategoryRailProps & {
  /** Optional outer absolute-position style overrides. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Category chips overlaid on the lower edge of a tall hero (variant B).
 *
 * Uses a dark glass/scrim underlay so labels stay readable on light or dark
 * cover media. Selected chip state comes from {@link StorefrontHomeCategoryRail}.
 */
export function OverlayCategoryRail({
  containerStyle,
  style,
  ...railProps
}: OverlayCategoryRailProps): React.ReactElement {
  return (
    <View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
        },
        containerStyle,
      ]}
    >
      <View
        pointerEvents="none"
        style={{
          height: 28,
          backgroundColor: HERO_OVERLAY_SCRIM_FADE,
        }}
      />
      <View
        style={{
          backgroundColor: HERO_OVERLAY_SCRIM,
          minHeight: HERO_VARIANT_CATEGORY_RAIL_HEIGHT,
        }}
      >
        <StorefrontHomeCategoryRail
          {...railProps}
          style={[
            {
              backgroundColor: "transparent",
              borderBottomWidth: 0,
              borderBottomColor: "transparent",
            },
            style,
          ]}
        />
      </View>
    </View>
  );
}
