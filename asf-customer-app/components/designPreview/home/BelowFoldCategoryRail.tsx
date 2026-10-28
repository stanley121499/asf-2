import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import {
  StorefrontHomeCategoryRail,
  type StorefrontHomeCategoryRailProps,
} from "@/components/storefront/StorefrontHomeCategoryRail";
import { HERO_VARIANT_HORIZONTAL_PADDING } from "@/components/designPreview/home/heroVariantLayout";
import { HOME_SPACE } from "@/lib/homeLayout";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type BelowFoldCategoryRailProps = StorefrontHomeCategoryRailProps & {
  /** Outer shell style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Refined below-fold category rail for variant A (chips under a grand cover).
 * Soft panel band + gold underline selection from the shared Storefront rail.
 */
export function BelowFoldCategoryRail({
  style,
  ...railProps
}: BelowFoldCategoryRailProps): React.ReactElement {
  return (
    <View
      style={[
        {
          marginTop: HOME_SPACE.md,
          marginHorizontal: HERO_VARIANT_HORIZONTAL_PADDING,
          backgroundColor: tokens.panel,
          borderWidth: 1,
          borderColor: tokens.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <StorefrontHomeCategoryRail
        {...railProps}
        style={{
          backgroundColor: "transparent",
          borderBottomWidth: 0,
          borderBottomColor: "transparent",
        }}
      />
    </View>
  );
}
