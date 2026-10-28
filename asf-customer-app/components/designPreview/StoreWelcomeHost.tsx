/**
 * Store-welcome popup host + grand visual variants for Design Lab / nearby taps.
 *
 * Variant map (Simon 2026-09-28 pass — tiny card/sheet/banner removed):
 * - `1` Flagship cover — full-bleed mood image + large welcome + pill CTAs
 * - `2` Editorial split — tall store/mall media column + display typography plate
 * - `3` Ceremony arrival — dark brand plate, wordmark welcome, floating product motion
 * - `4` Full welcome moment — polished reference grandeur plate
 * - `5` Lookbook gate — full-viewport still, Enter store + View product
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/motion";
import { useStoreWelcome } from "@/context/StoreWelcomeContext";
import {
  useOptionalStoreLocationContext,
  type StoreLocation,
} from "@/context/StoreLocationContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { useProductData } from "@/context/product/ProductContext";
import { fonts } from "@/constants/theme";
import { hapticLight } from "@/lib/haptics";
import { motion, motionEasing } from "@/lib/motion";
import {
  STORE_WELCOME_DEMO_MALL_SHORT,
  STORE_WELCOME_DEMO_STORE_NAME,
  firstUsableStoreImageUri,
  type ActiveWelcomeVariantId,
} from "@/lib/storeWelcome";
import type { ThemeTokens } from "@/themes/types";

/** Stable empty catalog when StoreLocationProvider is gated off. */
const EMPTY_STORE_LOCATIONS: ReadonlyArray<StoreLocation> = [];

/** Shared resolved display fields for all welcome variants. */
type WelcomeDisplay = {
  mallShortName: string;
  storeFullName: string | null;
  productId: string | null;
  productName: string | null;
  productThumbUri: string | null;
  /** Store / mall photo for editorial media (variant 2). */
  storeImageUri: string | null;
};

type WelcomeActions = {
  onViewItem: () => void;
  onExploreStore: () => void;
  onDismiss: () => void;
};

/**
 * Picks the first usable media URL from a product medias list.
 *
 * @param medias - Product media rows (arrangement order preferred by caller)
 */
function firstMediaUri(
  medias: ReadonlyArray<{ media_url: string | null }>,
): string | null {
  for (const media of medias) {
    if (typeof media.media_url === "string" && media.media_url.trim().length > 0) {
      return media.media_url.trim();
    }
  }
  return null;
}

/**
 * Resolves a store / mall photo from loaded store locations.
 * Prefer exact `storeLocationId`, then Mid Valley demo name match.
 *
 * @param stores - Active store location rows (may be empty when P2 not retained)
 * @param storeLocationId - Payload store id when known
 */
function resolveStoreImageFromCatalog(
  stores: ReadonlyArray<StoreLocation>,
  storeLocationId: string | null,
): string | null {
  if (stores.length === 0) {
    return null;
  }

  if (storeLocationId !== null && storeLocationId.length > 0) {
    const byId = stores.find((row) => row.id === storeLocationId);
    if (byId !== undefined) {
      const fromId = firstUsableStoreImageUri(byId.image_urls);
      if (fromId !== null) {
        return fromId;
      }
    }
  }

  const midValley = stores.find(
    (row) =>
      row.name === STORE_WELCOME_DEMO_STORE_NAME ||
      (typeof row.mall_name === "string" &&
        row.mall_name.toLowerCase().includes("mid valley")),
  );
  if (midValley !== undefined) {
    return firstUsableStoreImageUri(midValley.image_urls);
  }

  return null;
}

/**
 * Brand plate / soft orbs when no store photo is available (editorial fallback).
 */
function StoreBrandPlate({
  tokens,
}: Readonly<{ tokens: ThemeTokens }>): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.text,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: "22%",
          left: "10%",
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: "rgba(201,169,110,0.14)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: "18%",
          right: "6%",
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "rgba(255,255,255,0.07)",
        }}
      />
      <Ionicons name="storefront-outline" size={42} color={tokens.accent} />
    </View>
  );
}

/**
 * Resolves product display name with a fallback empty label.
 */
function productLabel(display: WelcomeDisplay, emptyLabel: string): string {
  if (display.productName !== null && display.productName.length > 0) {
    return display.productName;
  }
  return emptyLabel;
}

/**
 * Circular dismiss control for full-screen welcomes.
 */
function WelcomeCloseButton({
  onPress,
  label,
  light,
}: Readonly<{
  onPress: () => void;
  label: string;
  light: boolean;
}>): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: light
          ? "rgba(255,255,255,0.18)"
          : "rgba(10,10,10,0.08)",
      }}
    >
      <Ionicons
        name="close"
        size={22}
        color={light ? "#FFFFFF" : "#0A0A0A"}
      />
    </Pressable>
  );
}

/**
 * Soft stacked scrim approximating a bottom gradient without LinearGradient.
 */
function BottomScrim({
  height,
}: Readonly<{ height: number }>): React.ReactElement {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10,10,10,0.15)",
        }}
      />
      <View
        style={{
          flex: 1.2,
          backgroundColor: "rgba(10,10,10,0.45)",
        }}
      />
      <View
        style={{
          flex: 1.6,
          backgroundColor: "rgba(10,10,10,0.78)",
        }}
      />
      <View
        style={{
          flex: 1.4,
          backgroundColor: "rgba(10,10,10,0.92)",
        }}
      />
    </View>
  );
}

type PillCtaProps = Readonly<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Filled accent pill vs outline glass pill. */
  tone: "primary" | "ghost";
  haptic?: "light" | "medium";
}>;

type PillCtaFullProps = PillCtaProps & {
  /** Stretch in a horizontal dual-CTA row. */
  grow?: boolean;
};

/**
 * Elegant full-width or flex pill CTA for grand welcomes.
 */
function WelcomePillCta({
  label,
  onPress,
  disabled,
  tone,
  haptic,
  grow,
}: PillCtaFullProps): React.ReactElement {
  const isDisabled = disabled === true;
  const isPrimary = tone === "primary";
  const shouldGrow = grow === true;

  return (
    <PressableScale
      onPress={onPress}
      haptic={haptic ?? (isPrimary ? "medium" : "light")}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      style={{
        flex: shouldGrow ? 1 : undefined,
        alignSelf: shouldGrow ? undefined : "stretch",
        borderRadius: 999,
        paddingVertical: 15,
        paddingHorizontal: 18,
        alignItems: "center",
        justifyContent: "center",
        opacity: isDisabled ? 0.45 : 1,
        backgroundColor: isPrimary
          ? isDisabled
            ? "rgba(201,169,110,0.35)"
            : "#C9A96E"
          : "rgba(255,255,255,0.12)",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: "rgba(255,255,255,0.32)",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          letterSpacing: 0.2,
          color: isPrimary ? "#0A0A0A" : "#FFFFFF",
          fontFamily: fonts.sans,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

/**
 * Dual elegant pill row used across grand variants.
 */
function WelcomePillRow({
  viewLabel,
  exploreLabel,
  viewDisabled,
  onViewItem,
  onExploreStore,
  stacked,
}: Readonly<{
  viewLabel: string;
  exploreLabel: string;
  viewDisabled: boolean;
  onViewItem: () => void;
  onExploreStore: () => void;
  stacked?: boolean;
}>): React.ReactElement {
  const isStacked = stacked === true;
  const grow = !isStacked;

  return (
    <View
      style={{
        gap: 10,
        flexDirection: isStacked ? "column" : "row",
      }}
    >
      <WelcomePillCta
        label={viewLabel}
        onPress={onViewItem}
        disabled={viewDisabled}
        tone="primary"
        grow={grow}
      />
      <WelcomePillCta
        label={exploreLabel}
        onPress={onExploreStore}
        tone="ghost"
        grow={grow}
      />
    </View>
  );
}

/**
 * Full-bleed mood image or solid brand fallback.
 */
function MoodBackdrop({
  uri,
  tokens,
}: Readonly<{
  uri: string | null;
  tokens: ThemeTokens;
}>): React.ReactElement {
  if (uri !== null && uri.length > 0) {
    return (
      <Image
        source={{ uri }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: tokens.text,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: "18%",
          left: "12%",
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "rgba(201,169,110,0.12)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: "22%",
          right: "8%",
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      />
    </View>
  );
}

/**
 * Variant 1 — Flagship cover: near-full-screen mood + large welcome + pill CTAs.
 */
function WelcomeVariantFlagshipCover({
  display,
  tokens,
  insetsTop,
  insetsBottom,
  windowHeight,
  headline,
  supporting,
  viewLabel,
  exploreLabel,
  dismissLabel,
  actions,
}: Readonly<{
  display: WelcomeDisplay;
  tokens: ThemeTokens;
  insetsTop: number;
  insetsBottom: number;
  windowHeight: number;
  headline: string;
  supporting: string;
  viewLabel: string;
  exploreLabel: string;
  dismissLabel: string;
  actions: WelcomeActions;
}>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = reducedMotion === true;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    void hapticLight();
    if (skipAnimation) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = 0;
    translateY.value = 18;
    opacity.value = withTiming(1, {
      duration: motion.duration.dailyEntrance,
      easing: motionEasing,
    });
    translateY.value = withTiming(0, {
      duration: motion.duration.dailyEntrance,
      easing: motionEasing,
    });
  }, [skipAnimation, opacity, translateY]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const scrimHeight = Math.max(windowHeight * 0.52, 340);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={actions.onDismiss}
    >
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        <MoodBackdrop uri={display.productThumbUri} tokens={tokens} />
        <BottomScrim height={scrimHeight} />

        <View
          style={{
            flex: 1,
            paddingTop: Math.max(insetsTop, 16),
            paddingBottom: Math.max(insetsBottom, 24),
            paddingHorizontal: 24,
            justifyContent: "space-between",
          }}
        >
          <View style={{ alignItems: "flex-end" }}>
            <WelcomeCloseButton
              onPress={actions.onDismiss}
              label={dismissLabel}
              light
            />
          </View>

          <Animated.View style={contentStyle}>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 11,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                color: tokens.accent,
                fontWeight: "600",
                marginBottom: 14,
              }}
            >
              {display.storeFullName ?? display.mallShortName}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 44,
                lineHeight: 50,
                color: "#FFFFFF",
                maxWidth: 340,
              }}
            >
              {headline}
            </Text>
            <Text
              style={{
                marginTop: 14,
                marginBottom: 28,
                fontSize: 16,
                lineHeight: 24,
                color: "rgba(255,255,255,0.78)",
                fontFamily: fonts.sans,
                maxWidth: 300,
              }}
            >
              {supporting}
            </Text>
            <WelcomePillRow
              viewLabel={viewLabel}
              exploreLabel={exploreLabel}
              viewDisabled={display.productId === null}
              onViewItem={actions.onViewItem}
              onExploreStore={actions.onExploreStore}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Variant 2 — Editorial split: tall store/mall media column + typography plate.
 * Product name + CTAs stay on the copy side; primary image is store imagery.
 */
function WelcomeVariantEditorialSplit({
  display,
  tokens,
  insetsTop,
  insetsBottom,
  windowWidth,
  headline,
  supporting,
  emptyProduct,
  viewLabel,
  exploreLabel,
  dismissLabel,
  actions,
}: Readonly<{
  display: WelcomeDisplay;
  tokens: ThemeTokens;
  insetsTop: number;
  insetsBottom: number;
  windowWidth: number;
  headline: string;
  supporting: string;
  emptyProduct: string;
  viewLabel: string;
  exploreLabel: string;
  dismissLabel: string;
  actions: WelcomeActions;
}>): React.ReactElement {
  const mediaWidth = Math.round(windowWidth * 0.46);
  const name = productLabel(display, emptyProduct);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={actions.onDismiss}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          backgroundColor: tokens.bg,
        }}
      >
        <View
          style={{
            width: mediaWidth,
            backgroundColor: tokens.text,
            overflow: "hidden",
          }}
        >
          {display.storeImageUri !== null && display.storeImageUri.length > 0 ? (
            <Image
              source={{ uri: display.storeImageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <StoreBrandPlate tokens={tokens} />
          )}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 4,
              backgroundColor: tokens.accent,
            }}
          />
        </View>

        <View
          style={{
            flex: 1,
            paddingTop: Math.max(insetsTop, 16),
            paddingBottom: Math.max(insetsBottom, 24),
            paddingHorizontal: 20,
            justifyContent: "space-between",
            backgroundColor: tokens.panel,
          }}
        >
          <View style={{ alignItems: "flex-end" }}>
            <WelcomeCloseButton
              onPress={actions.onDismiss}
              label={dismissLabel}
              light={false}
            />
          </View>

          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                width: 28,
                height: 2,
                backgroundColor: tokens.accent,
                marginBottom: 18,
              }}
            />
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: tokens.muted,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              {display.storeFullName ?? display.mallShortName}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 32,
                lineHeight: 38,
                color: tokens.text,
              }}
            >
              {headline}
            </Text>
            <Text
              style={{
                marginTop: 12,
                fontSize: 14,
                lineHeight: 21,
                color: tokens.muted,
                fontFamily: fonts.sans,
              }}
            >
              {supporting}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                marginTop: 22,
                fontSize: 13,
                lineHeight: 18,
                color: tokens.text,
                fontFamily: fonts.sans,
                fontWeight: "500",
              }}
            >
              {name}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <PressableScale
              onPress={actions.onViewItem}
              haptic="medium"
              disabled={display.productId === null}
              accessibilityRole="button"
              accessibilityLabel={viewLabel}
              accessibilityState={{ disabled: display.productId === null }}
              style={{
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor:
                  display.productId === null ? tokens.border : tokens.text,
                opacity: display.productId === null ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: tokens.bg,
                  fontFamily: fonts.sans,
                }}
              >
                {viewLabel}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={actions.onExploreStore}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={exploreLabel}
              style={{
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: tokens.border,
                backgroundColor: tokens.bg,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: tokens.text,
                  fontFamily: fonts.sans,
                }}
              >
                {exploreLabel}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Variant 3 — Ceremony arrival: dark plate, wordmark welcome, floating product.
 */
function WelcomeVariantCeremonyArrival({
  display,
  tokens,
  insetsTop,
  insetsBottom,
  headline,
  supporting,
  emptyProduct,
  viewLabel,
  exploreLabel,
  dismissLabel,
  actions,
}: Readonly<{
  display: WelcomeDisplay;
  tokens: ThemeTokens;
  insetsTop: number;
  insetsBottom: number;
  headline: string;
  supporting: string;
  emptyProduct: string;
  viewLabel: string;
  exploreLabel: string;
  dismissLabel: string;
  actions: WelcomeActions;
}>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = reducedMotion === true;

  const plateOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(28);
  const productOpacity = useSharedValue(0);
  const productScale = useSharedValue(0.86);
  const productY = useSharedValue(36);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    void hapticLight();
    if (skipAnimation) {
      plateOpacity.value = 1;
      titleOpacity.value = 1;
      titleY.value = 0;
      productOpacity.value = 1;
      productScale.value = 1;
      productY.value = 0;
      ctaOpacity.value = 1;
      return;
    }

    const step = motion.duration.ceremonyStep;
    const stagger = motion.delay.stagger;

    plateOpacity.value = withTiming(1, {
      duration: motion.duration.fast,
      easing: motionEasing,
    });
    titleOpacity.value = withDelay(
      stagger,
      withTiming(1, { duration: step, easing: motionEasing }),
    );
    titleY.value = withDelay(
      stagger,
      withTiming(0, { duration: step, easing: motionEasing }),
    );
    productOpacity.value = withDelay(
      stagger * 2,
      withTiming(1, { duration: step, easing: motionEasing }),
    );
    productScale.value = withDelay(
      stagger * 2,
      withTiming(1, { duration: step, easing: motionEasing }),
    );
    productY.value = withDelay(
      stagger * 2,
      withTiming(0, { duration: step, easing: motionEasing }),
    );
    ctaOpacity.value = withDelay(
      stagger * 4,
      withTiming(1, {
        duration: motion.duration.dailyEntrance,
        easing: motionEasing,
      }),
    );
  }, [
    skipAnimation,
    plateOpacity,
    titleOpacity,
    titleY,
    productOpacity,
    productScale,
    productY,
    ctaOpacity,
  ]);

  const plateStyle = useAnimatedStyle(() => ({
    opacity: plateOpacity.value,
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const productStyle = useAnimatedStyle(() => ({
    opacity: productOpacity.value,
    transform: [
      { translateY: productY.value },
      { scale: productScale.value },
    ],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const name = productLabel(display, emptyProduct);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={actions.onDismiss}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: tokens.text,
            paddingTop: Math.max(insetsTop, 16),
            paddingBottom: Math.max(insetsBottom, 24),
            paddingHorizontal: 24,
          },
          plateStyle,
        ]}
      >
        <View style={{ alignItems: "flex-end" }}>
          <WelcomeCloseButton
            onPress={actions.onDismiss}
            label={dismissLabel}
            light
          />
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.View style={[{ alignItems: "center" }, titleStyle]}>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: tokens.accent,
                fontWeight: "600",
                marginBottom: 16,
              }}
            >
              {display.storeFullName ?? display.mallShortName}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 48,
                lineHeight: 54,
                color: tokens.bg,
                textAlign: "center",
                maxWidth: 340,
              }}
            >
              {headline}
            </Text>
            <Text
              style={{
                marginTop: 16,
                fontSize: 15,
                lineHeight: 22,
                color: "rgba(255,255,255,0.68)",
                fontFamily: fonts.sans,
                textAlign: "center",
                maxWidth: 280,
              }}
            >
              {supporting}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              {
                marginTop: 36,
                alignItems: "center",
              },
              productStyle,
            ]}
          >
            <View
              style={{
                width: 168,
                height: 210,
                borderRadius: 4,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(201,169,110,0.35)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#C9A96E",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.22,
                shadowRadius: 24,
                elevation: 10,
              }}
            >
              {display.productThumbUri !== null ? (
                <Image
                  source={{ uri: display.productThumbUri }}
                  style={{ width: 168, height: 210 }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Ionicons name="shirt-outline" size={42} color={tokens.accent} />
              )}
            </View>
            <Text
              numberOfLines={2}
              style={{
                marginTop: 14,
                fontSize: 14,
                lineHeight: 20,
                color: "rgba(255,255,255,0.82)",
                fontFamily: fonts.sans,
                textAlign: "center",
                maxWidth: 220,
              }}
            >
              {name}
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={ctaStyle}>
          <WelcomePillRow
            viewLabel={viewLabel}
            exploreLabel={exploreLabel}
            viewDisabled={display.productId === null}
            onViewItem={actions.onViewItem}
            onExploreStore={actions.onExploreStore}
            stacked
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * Variant 4 — Full welcome moment (reference grandeur, polished).
 */
function WelcomeVariantFullMoment({
  display,
  tokens,
  windowHeight,
  insetsTop,
  insetsBottom,
  headline,
  supporting,
  emptyProduct,
  viewLabel,
  exploreLabel,
  dismissLabel,
  actions,
}: Readonly<{
  display: WelcomeDisplay;
  tokens: ThemeTokens;
  windowHeight: number;
  insetsTop: number;
  insetsBottom: number;
  headline: string;
  supporting: string;
  emptyProduct: string;
  viewLabel: string;
  exploreLabel: string;
  dismissLabel: string;
  actions: WelcomeActions;
}>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = reducedMotion === true;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    void hapticLight();
    if (skipAnimation) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withTiming(1, {
      duration: motion.duration.entrance,
      easing: motionEasing,
    });
    translateY.value = withTiming(0, {
      duration: motion.duration.entrance,
      easing: motionEasing,
    });
  }, [skipAnimation, opacity, translateY]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const plateMinHeight = Math.max(windowHeight * 0.92, 560);
  const name = productLabel(display, emptyProduct);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={actions.onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.text,
          paddingTop: Math.max(insetsTop, 16),
          paddingBottom: Math.max(insetsBottom, 24),
          paddingHorizontal: 28,
          minHeight: plateMinHeight,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              width: 36,
              height: 2,
              backgroundColor: tokens.accent,
            }}
          />
          <WelcomeCloseButton
            onPress={actions.onDismiss}
            label={dismissLabel}
            light
          />
        </View>

        <Animated.View style={[{ flex: 1, justifyContent: "center" }, contentStyle]}>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: tokens.accent,
              fontWeight: "600",
              marginBottom: 14,
            }}
          >
            {display.storeFullName ?? display.mallShortName}
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 44,
              lineHeight: 50,
              color: tokens.bg,
            }}
          >
            {headline}
          </Text>
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              lineHeight: 24,
              color: "rgba(255,255,255,0.72)",
              fontFamily: fonts.sans,
              maxWidth: 320,
            }}
          >
            {supporting}
          </Text>

          <View
            style={{
              marginTop: 36,
              flexDirection: "row",
              alignItems: "center",
              gap: 18,
            }}
          >
            <View
              style={{
                width: 112,
                height: 140,
                borderRadius: 6,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                borderColor: "rgba(201,169,110,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {display.productThumbUri !== null ? (
                <Image
                  source={{ uri: display.productThumbUri }}
                  style={{ width: 112, height: 140 }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Ionicons name="shirt-outline" size={36} color={tokens.accent} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 10,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 6,
                }}
              >
                {emptyProduct}
              </Text>
              <Text
                numberOfLines={3}
                style={{
                  fontSize: 17,
                  lineHeight: 24,
                  color: tokens.bg,
                  fontFamily: fonts.display,
                }}
              >
                {name}
              </Text>
            </View>
          </View>
        </Animated.View>

        <WelcomePillRow
          viewLabel={viewLabel}
          exploreLabel={exploreLabel}
          viewDisabled={display.productId === null}
          onViewItem={actions.onViewItem}
          onExploreStore={actions.onExploreStore}
          stacked
        />
      </View>
    </Modal>
  );
}

/**
 * Variant 5 — Lookbook gate: full-viewport still, Enter store + View product.
 */
function WelcomeVariantLookbookGate({
  display,
  tokens,
  insetsTop,
  insetsBottom,
  windowHeight,
  eyebrow,
  headline,
  enterLabel,
  viewProductLabel,
  dismissLabel,
  actions,
}: Readonly<{
  display: WelcomeDisplay;
  tokens: ThemeTokens;
  insetsTop: number;
  insetsBottom: number;
  windowHeight: number;
  eyebrow: string;
  headline: string;
  enterLabel: string;
  viewProductLabel: string;
  dismissLabel: string;
  actions: WelcomeActions;
}>): React.ReactElement {
  const reducedMotion = useReducedMotion();
  const skipAnimation = reducedMotion === true;
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.04);

  useEffect(() => {
    void hapticLight();
    if (skipAnimation) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    opacity.value = withTiming(1, {
      duration: motion.duration.dailyEntrance,
      easing: motionEasing,
    });
    scale.value = withTiming(1, {
      duration: motion.duration.lightSweep,
      easing: motionEasing,
    });
  }, [skipAnimation, opacity, scale]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const scrimHeight = Math.max(windowHeight * 0.42, 280);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={actions.onDismiss}
    >
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", overflow: "hidden" }}>
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
            imageStyle,
          ]}
        >
          <MoodBackdrop uri={display.productThumbUri} tokens={tokens} />
        </Animated.View>
        <BottomScrim height={scrimHeight} />

        <Animated.View
          style={[
            {
              flex: 1,
              paddingTop: Math.max(insetsTop, 16),
              paddingBottom: Math.max(insetsBottom, 28),
              paddingHorizontal: 28,
              justifyContent: "space-between",
            },
            chromeStyle,
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 11,
                letterSpacing: 2.4,
                textTransform: "uppercase",
                color: tokens.accent,
                fontWeight: "600",
              }}
            >
              {eyebrow}
            </Text>
            <WelcomeCloseButton
              onPress={actions.onDismiss}
              label={dismissLabel}
              light
            />
          </View>

          <View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 40,
                lineHeight: 46,
                color: "#FFFFFF",
                maxWidth: 320,
                marginBottom: 28,
              }}
            >
              {headline}
            </Text>

            <PressableScale
              onPress={actions.onExploreStore}
              haptic="medium"
              accessibilityRole="button"
              accessibilityLabel={enterLabel}
              style={{
                borderRadius: 999,
                paddingVertical: 16,
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#0A0A0A",
                  fontFamily: fonts.sans,
                  letterSpacing: 0.3,
                }}
              >
                {enterLabel}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={actions.onViewItem}
              haptic="light"
              disabled={display.productId === null}
              accessibilityRole="button"
              accessibilityLabel={viewProductLabel}
              accessibilityState={{ disabled: display.productId === null }}
              style={{
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: "center",
                opacity: display.productId === null ? 0.4 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "rgba(255,255,255,0.88)",
                  fontFamily: fonts.sans,
                  textDecorationLine: "underline",
                  textDecorationColor: "rgba(255,255,255,0.4)",
                }}
              >
                {viewProductLabel}
              </Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Renders the active store-welcome variant when {@link useStoreWelcome} has a payload.
 * Mount inside `RouteContextBundle` so product + store catalogs are available.
 */
export function StoreWelcomeHost(): React.ReactElement | null {
  const { t } = useTranslation();
  const tokens = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const { payload, variant, dismissWelcome } = useStoreWelcome();
  const { products } = useProductData();
  const storeLocationCtx = useOptionalStoreLocationContext();
  const storeLocations = storeLocationCtx?.storeLocations ?? EMPTY_STORE_LOCATIONS;

  const display = useMemo<WelcomeDisplay | null>(() => {
    if (payload === null) {
      return null;
    }

    let productId = payload.productId;
    let productName = payload.productNameHint;
    let productThumbUri: string | null = null;

    if (productId !== null) {
      const matched = products.find((row) => row.id === productId);
      if (matched !== undefined) {
        productName =
          productName !== null && productName.length > 0
            ? productName
            : matched.name;
        productThumbUri = firstMediaUri(matched.medias);
      }
    } else if (products.length > 0) {
      const demoProduct = products[0];
      if (demoProduct !== undefined) {
        productId = demoProduct.id;
        productName = demoProduct.name;
        productThumbUri = firstMediaUri(demoProduct.medias);
      }
    }

    const mallShortName =
      payload.mallShortName.length > 0
        ? payload.mallShortName
        : STORE_WELCOME_DEMO_MALL_SHORT;

    const storeFullName =
      payload.storeFullName !== null && payload.storeFullName.length > 0
        ? payload.storeFullName
        : STORE_WELCOME_DEMO_STORE_NAME;

    /**
     * Prefer payload store photo when present. Guard with `typeof` so a stale
     * in-memory payload missing `storeImageUri` cannot throw on `.trim()`.
     */
    const rawStoreImage = payload.storeImageUri;
    const payloadStoreImage =
      typeof rawStoreImage === "string" && rawStoreImage.trim().length > 0
        ? rawStoreImage.trim()
        : null;

    const catalogStoreImage = resolveStoreImageFromCatalog(
      storeLocations,
      payload.storeLocationId,
    );

    return {
      mallShortName,
      storeFullName,
      productId,
      productName,
      productThumbUri,
      storeImageUri: payloadStoreImage ?? catalogStoreImage,
    };
  }, [payload, products, storeLocations]);

  const handleDismiss = useCallback((): void => {
    dismissWelcome();
  }, [dismissWelcome]);

  const handleViewItem = useCallback((): void => {
    if (display === null || display.productId === null) {
      return;
    }
    const productId = display.productId;
    dismissWelcome();
    router.push(`/(tabs)/browse/${productId}` as Href);
  }, [display, dismissWelcome, router]);

  /**
   * Explore store → Locations tab (maps live on that screen). Avoids depending
   * on the gated StoreLocationProvider and keeps Design Lab Preview GPS-free.
   */
  const handleExploreStore = useCallback((): void => {
    dismissWelcome();
    router.push("/(tabs)/locations" as Href);
  }, [dismissWelcome, router]);

  if (payload === null || display === null) {
    return null;
  }

  const headline = t("storeWelcome.headline", { mall: display.mallShortName });
  const supporting = t("storeWelcome.supporting");
  const emptyProduct = t("storeWelcome.productUnavailable");
  const viewLabel = t("storeWelcome.viewItem");
  const exploreLabel = t("storeWelcome.exploreStore");
  const enterLabel = t("storeWelcome.enterStore");
  const dismissLabel = t("storeWelcome.dismiss");
  const lookbookEyebrow = t("storeWelcome.lookbookEyebrow");
  const viewProductLabel =
    display.productName !== null && display.productName.length > 0
      ? t("storeWelcome.viewProductNamed", { product: display.productName })
      : viewLabel;

  const actions: WelcomeActions = {
    onViewItem: handleViewItem,
    onExploreStore: handleExploreStore,
    onDismiss: handleDismiss,
  };

  const activeVariant: ActiveWelcomeVariantId = variant;

  if (activeVariant === "1") {
    return (
      <WelcomeVariantFlagshipCover
        display={display}
        tokens={tokens}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        windowHeight={windowHeight}
        headline={headline}
        supporting={supporting}
        viewLabel={viewLabel}
        exploreLabel={exploreLabel}
        dismissLabel={dismissLabel}
        actions={actions}
      />
    );
  }

  if (activeVariant === "2") {
    return (
      <WelcomeVariantEditorialSplit
        display={display}
        tokens={tokens}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        windowWidth={windowWidth}
        headline={headline}
        supporting={supporting}
        emptyProduct={emptyProduct}
        viewLabel={viewLabel}
        exploreLabel={exploreLabel}
        dismissLabel={dismissLabel}
        actions={actions}
      />
    );
  }

  if (activeVariant === "3") {
    return (
      <WelcomeVariantCeremonyArrival
        display={display}
        tokens={tokens}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        headline={headline}
        supporting={supporting}
        emptyProduct={emptyProduct}
        viewLabel={viewLabel}
        exploreLabel={exploreLabel}
        dismissLabel={dismissLabel}
        actions={actions}
      />
    );
  }

  if (activeVariant === "5") {
    return (
      <WelcomeVariantLookbookGate
        display={display}
        tokens={tokens}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        windowHeight={windowHeight}
        eyebrow={lookbookEyebrow}
        headline={headline}
        enterLabel={enterLabel}
        viewProductLabel={viewProductLabel}
        dismissLabel={dismissLabel}
        actions={actions}
      />
    );
  }

  return (
    <WelcomeVariantFullMoment
      display={display}
      tokens={tokens}
      windowHeight={windowHeight}
      insetsTop={insets.top}
      insetsBottom={insets.bottom}
      headline={headline}
      supporting={supporting}
      emptyProduct={emptyProduct}
      viewLabel={viewLabel}
      exploreLabel={exploreLabel}
      dismissLabel={dismissLabel}
      actions={actions}
    />
  );
}
