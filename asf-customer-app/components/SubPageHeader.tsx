import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CartButton } from "@/components/cart/CartButton";
import { PressableScale } from "@/components/motion";
import { useTheme, useThemeTokens } from "@/context/ThemeContext";

interface SubPageHeaderProps {
  title: string;
  /** Optional right-side element (e.g. "mark all read" button). */
  right?: React.ReactNode;
  /**
   * When true, renders a trailing {@link CartButton} (Classic/Noir header-bag
   * rules). Ignored when `right` is provided — pass cart inside `right` instead.
   * Default false so auth/checkout/subpages stay bag-free unless opted in.
   */
  showCart?: boolean;
}

/**
 * Reusable sticky header for push screens inside the profile stack.
 *
 * Classic: 56px centered Playfair title + back arrow.
 * Atelier: 52px colophon bar — uppercase Inter eyebrow, muted, paper language.
 * Noir: 48px night-settings bar — uppercase Inter label, matches ProfileHub.
 */
export function SubPageHeader({
  title,
  right,
  showCart = false,
}: SubPageHeaderProps): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isAtelier = themeId === "atelier";
  const isNoir = themeId === "noir";

  /**
   * Pop within the profile stack when possible. When this screen was entered
   * directly via `router.replace` (e.g. order detail from checkout success), the
   * profile stack only holds this one screen (local index 0). In that case
   * `router.back()` bubbles up to the Tabs navigator and lands on the home tab,
   * so we explicitly route to the profile home to avoid locking the user out.
   * `router.canGoBack()` cannot be used here because it returns true thanks to
   * the parent navigators even when the local stack has nothing to pop.
   */
  const handleBack = (): void => {
    const state = navigation.getState();
    const localIndex = typeof state?.index === "number" ? state.index : 0;
    if (localIndex > 0) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  };

  const trailing =
    right !== undefined ? (
      right
    ) : showCart ? (
      <CartButton color={tokens.text} />
    ) : null;

  /** Compact chrome height: Noir 48 · Atelier 52 · Classic 56. */
  const headerHeight = isNoir ? 48 : isAtelier ? 52 : 56;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        backgroundColor: tokens.bg,
        borderBottomWidth: 1,
        borderBottomColor: tokens.border,
      }}
    >
      <View
        style={{
          height: headerHeight,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          paddingHorizontal: 56,
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 16,
            width: 44,
            height: 44,
          }}
        >
          <PressableScale
            onPress={handleBack}
            haptic="light"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="arrow-back"
              size={isAtelier || isNoir ? 18 : 22}
              color={isAtelier ? tokens.muted : tokens.text}
            />
          </PressableScale>
        </View>

        <Text
          style={
            isAtelier
              ? {
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: tokens.muted,
                }
              : isNoir
                ? {
                    fontFamily: "Inter_400Regular",
                    fontSize: 13,
                    fontWeight: "600",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: tokens.text,
                  }
                : {
                    fontFamily: "PlayfairDisplay_400Regular",
                    fontSize: 18,
                    color: tokens.text,
                  }
          }
          numberOfLines={1}
        >
          {title}
        </Text>

        {trailing !== null && (
          <View style={{ position: "absolute", right: 8 }}>{trailing}</View>
        )}
      </View>
    </SafeAreaView>
  );
}
