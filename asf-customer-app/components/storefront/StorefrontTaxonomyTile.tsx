import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type StorefrontTaxonomyTileProps = {
  /** Tile label (already translated by the caller). */
  label: string;
  /** Optional thumbnail URL. */
  mediaUrl?: string | null;
  /** Tap handler (narrows Shop selection). Ignored when `disabled`. */
  onPress: () => void;
  /** When true, tile shows selected accent (occupation category highlight). */
  selected?: boolean;
  /**
   * Non-navigating Coming Soon cell — muted chrome, no press action.
   * Label should already be localized (e.g. `shop.comingSoon`).
   */
  disabled?: boolean;
  /** Outer cell style (e.g. fixed width in the horizontal tile row). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Next-level taxonomy tile for Storefront Shop (image + label).
 *
 * Used in the right-pane horizontal category row above the product grid
 * (plan §3.3).
 */
export function StorefrontTaxonomyTile({
  label,
  mediaUrl,
  onPress,
  selected = false,
  disabled = false,
  style,
}: Readonly<StorefrontTaxonomyTileProps>): React.ReactElement {
  const displayLabel = label.trim().length > 0 ? label : "—";
  const uri =
    !disabled &&
    typeof mediaUrl === "string" &&
    mediaUrl.trim().length > 0
      ? mediaUrl.trim()
      : null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole={disabled ? "text" : "button"}
      accessibilityState={{ selected: disabled ? false : selected, disabled }}
      accessibilityLabel={displayLabel}
      style={[{ alignItems: "center", opacity: disabled ? 0.72 : 1 }, style]}
    >
      <View
        style={{
          width: "100%",
          aspectRatio: 1,
          backgroundColor: tokens.panel,
          overflow: "hidden",
          borderRadius: 4,
          borderWidth: !disabled && selected ? 1.5 : 0,
          borderColor: !disabled && selected ? tokens.accent : "transparent",
        }}
      >
        {uri !== null ? (
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            accessibilityLabel={displayLabel}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={disabled ? "time-outline" : "grid-outline"}
              size={22}
              color={tokens.muted}
            />
          </View>
        )}
      </View>
      <Text
        numberOfLines={2}
        style={{
          marginTop: 6,
          fontSize: 11,
          lineHeight: 14,
          textAlign: "center",
          color: disabled
            ? tokens.muted
            : selected
              ? tokens.accent
              : tokens.text,
          fontWeight: !disabled && selected ? "600" : "400",
          fontFamily: "Inter_400Regular",
        }}
      >
        {displayLabel}
      </Text>
    </Pressable>
  );
}
