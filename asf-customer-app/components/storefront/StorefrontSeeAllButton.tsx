import React from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type StorefrontSeeAllButtonProps = {
  /** Visible button label (e.g. translated `home.seeAll`). */
  label: string;
  /** Opens the linked list / product list for this section. */
  onPress: () => void;
  /**
   * Accessibility label. Defaults to {@link label} when omitted.
   */
  accessibilityLabel?: string;
  /** Outer pressable style (width is always full of the parent column). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Full-width outline **See all** control for Storefront Home.
 *
 * Transparent fill with a gold accent border + label so the CTA reads as a
 * real button (not a text link). Spans the padded content column; label is
 * centered. Border width is 2 (not a hairline) so the outline stays clearly
 * visible on device regardless of pixel density. `minHeight` guarantees a
 * real rectangle even if a caller's `style` override changes padding.
 *
 * **Rendering note:** the border box is owned by a plain, static `<View>`
 * — never by a `Pressable`'s dynamic `style` function. On some iOS/Fabric
 * (React Native New Architecture) builds, a `Pressable`'s `style={(state) =>
 * ...}` callback can fail to reliably paint `borderWidth` / `borderColor` /
 * `borderRadius`, even though the same static style object paints correctly
 * on a plain `View`. Splitting the visual box (static `View`) from the
 * touch target (`Pressable` filling it, only toggling background tint) is
 * a known-robust workaround for that quirk.
 */
export function StorefrontSeeAllButton({
  label,
  onPress,
  accessibilityLabel,
  style,
}: Readonly<StorefrontSeeAllButtonProps>): React.ReactElement {
  const a11yLabel =
    typeof accessibilityLabel === "string" &&
    accessibilityLabel.trim().length > 0
      ? accessibilityLabel.trim()
      : label;

  return (
    <View
      style={[
        {
          alignSelf: "stretch",
          width: "100%",
          minHeight: 46,
          borderWidth: 2,
          borderColor: tokens.accent,
          borderStyle: "solid",
          borderRadius: 10,
          backgroundColor: "transparent",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        /**
         * Static object — not a `(state) => {...}` callback. Runtime logs
         * proved the function form drops layout props (`flex`, `minHeight`,
         * `paddingVertical`) on this Fabric build, not just border paint as
         * previously documented. `pressed` tint now comes from the
         * `children` render-prop below instead, which is a plain per-render
         * child (unaffected by Pressable's own style-callback resolution).
         */
        style={{
          flex: 1,
          width: "100%",
          minHeight: 46,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        {({ pressed }) => (
          <>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: pressed
                  ? "rgba(201,169,110,0.12)"
                  : "transparent",
              }}
            />
            <Text
              style={{
                width: "100%",
                fontFamily: "Inter_400Regular",
                fontWeight: "500",
                fontSize: 15,
                letterSpacing: 0.2,
                color: tokens.accent,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
