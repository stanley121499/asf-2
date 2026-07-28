import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { AnimatedBadge, PressableScale } from "@/components/motion";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { useAddToCartContext } from "@/context/product/CartContext";

export type CartButtonProps = {
  /**
   * Icon / badge accent color. Defaults to theme text token.
   * Pass white on Classic Home overlay navbar when scrolled over hero media.
   */
  color?: string;
  /** Hit target size (default 44). */
  size?: number;
  /** Icon glyph size (default 22). */
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  /** Optional accessibility override (defaults to `nav.openCart`). */
  accessibilityLabel?: string;
  /**
   * Badge position relative to the hit target (top-right corner).
   * Defaults keep the count readable on header bags and the Atelier FAB.
   */
  badgeOffset?: { top: number; right: number };
};

/** Default badge nudge: sits on the top-right rim of the press target. */
const DEFAULT_BADGE_OFFSET = { top: 2, right: 2 } as const;

/**
 * Shared bag icon + animated badge that navigates to `/cart`.
 * Badge count is the signed-in user's `add_to_carts` quantity sum.
 * Used by Classic/Noir header bags and the Atelier floating FAB.
 *
 * Uses {@link PressableScale} `centerContent` plus a fixed `size`×`size` slot so
 * the bag glyph is centered — Pressable `alignItems`/`justifyContent` alone do
 * not center children (they live in an inner stretched Animated.View).
 */
export function CartButton({
  color,
  size = 44,
  iconSize = 22,
  style,
  accessibilityLabel,
  badgeOffset = DEFAULT_BADGE_OFFSET,
}: CartButtonProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const tokens = useThemeTokens();
  const { user } = useAuthContext();
  const { add_to_carts } = useAddToCartContext();

  const iconColor = color ?? tokens.text;
  const label = accessibilityLabel ?? t("nav.openCart");

  const cartCount = useMemo(() => {
    if (user === null) {
      return 0;
    }
    return add_to_carts
      .filter((row) => row.user_id === user.id)
      .reduce((sum, row) => sum + row.amount, 0);
  }, [add_to_carts, user]);

  return (
    <PressableScale
      haptic="light"
      centerContent
      style={[
        {
          width: size,
          height: size,
          overflow: "visible",
        },
        style,
      ]}
      onPress={() => {
        router.push("/cart");
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {/*
        Explicit slot matches the hit target so the icon centers and the badge
        anchors to the FAB/header corner — not a shrink-wrapped glyph box.
      */}
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="bag-outline" size={iconSize} color={iconColor} />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: badgeOffset.top,
            right: badgeOffset.right,
          }}
        >
          <AnimatedBadge count={cartCount} accessibilityLabel={label} />
        </View>
      </View>
    </PressableScale>
  );
}
