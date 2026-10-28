import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { CartButton } from "@/components/cart/CartButton";
import { ANCHORS, TourAnchor } from "@/components/guide";
import { PressableScale } from "@/components/motion";
import { NotificationBellButton } from "@/components/storefront/NotificationBellButton";
import { useTranslation } from "@/context/LocaleContext";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

export type StorefrontHeaderActionsProps = {
  /** Icon / bag color. Defaults to Storefront text token. */
  color?: string;
  /** Outer row style (gap / alignment already set). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Storefront chrome actions: search · notification bell · cart.
 *
 * Used on Home (and any screen that wants the same chrome order).
 * Bell opens the existing notifications inbox with an unread badge (R15).
 */
export function StorefrontHeaderActions({
  color = tokens.text,
  style,
}: Readonly<StorefrontHeaderActionsProps>): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", gap: 4 },
        style,
      ]}
    >
      <TourAnchor id={ANCHORS.home.search}>
        <PressableScale
          haptic="light"
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => router.push("/(tabs)/browse")}
          accessibilityRole="button"
          accessibilityLabel={t("nav.openSearch")}
        >
          <Ionicons name="search-outline" size={22} color={color} />
        </PressableScale>
      </TourAnchor>

      <NotificationBellButton color={color} returnTo="home" />

      <TourAnchor id={ANCHORS.home.bag}>
        <CartButton
          color={color}
          accessibilityLabel={t("nav.openCart")}
        />
      </TourAnchor>
    </View>
  );
}
