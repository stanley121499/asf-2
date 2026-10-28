import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import {
  StorefrontHomeCategoryRail,
  type StorefrontHomeCategoryRailProps,
} from "@/components/storefront/StorefrontHomeCategoryRail";
import { HOME_SPACE } from "@/lib/homeLayout";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type StrongSelectedCategoryRailProps = StorefrontHomeCategoryRailProps & {
  /** Outer shell style. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Strong selected-chip category rail for variant D (mood switch).
 * Accent top rule + panel band make the active kind read as intentional.
 */
export function StrongSelectedCategoryRail({
  style,
  ...railProps
}: StrongSelectedCategoryRailProps): React.ReactElement {
  return (
    <View
      style={[
        {
          marginTop: HOME_SPACE.sm,
          borderTopWidth: 3,
          borderTopColor: tokens.accent,
          backgroundColor: tokens.bg,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border,
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
