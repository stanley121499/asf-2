import React, { useEffect } from "react";
import { Text, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { motion } from "@/lib/motion";

/**
 * Layout presets for empty-while-loading surfaces.
 * Prefer matching the destination screen so the first paint feels intentional.
 */
export type PageLoadingVariant =
  | "home"
  | "shop"
  | "profile"
  | "highlights"
  | "list"
  | "spinner";

export type PageLoadingSkeletonProps = {
  /** Visual layout to approximate while data loads. Defaults to `"spinner"`. */
  variant?: PageLoadingVariant;
  /**
   * When false, hides the `common.loading` caption under the skeleton.
   * Defaults to true.
   */
  showLabel?: boolean;
};

/**
 * Single shimmer bone used by {@link PageLoadingSkeleton} layouts.
 *
 * @param width - CSS-like width (`number` px or percentage string)
 * @param height - Height in px
 * @param boneColor - Fill color from theme tokens
 * @param style - Optional extra layout styles
 * @param opacityStyle - Shared animated opacity from the parent pulse
 */
function SkeletonBone({
  width,
  height,
  boneColor,
  style,
  opacityStyle,
}: Readonly<{
  width: number | `${number}%`;
  height: number;
  boneColor: string;
  style?: ViewStyle;
  opacityStyle: ReturnType<typeof useAnimatedStyle>;
}>): React.ReactElement {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: boneColor,
          borderRadius: 4,
        },
        style,
        opacityStyle,
      ]}
    />
  );
}

/**
 * Lightweight empty-while-loading UI: shimmer bones or a compact spinner row.
 *
 * Use when `loading === true` and the primary list is still empty so populated
 * content is never covered by a flash. Theme tokens drive colors; copy uses
 * `t("common.loading")`.
 */
export function PageLoadingSkeleton({
  variant = "spinner",
  showLabel = true,
}: PageLoadingSkeletonProps): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    if (reducedMotion === true) {
      pulse.value = 0.7;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: motion.duration.entrance,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [pulse, reducedMotion]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const boneColor = tokens.panel;
  const label =
    showLabel === true ? (
      <Text
        style={{
          marginTop: 16,
          fontSize: 14,
          color: tokens.muted,
          fontFamily: "Inter_400Regular",
          textAlign: "center",
        }}
      >
        {t("common.loading")}
      </Text>
    ) : null;

  if (variant === "home") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          paddingHorizontal: 16,
          paddingTop: 24,
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={t("common.loading")}
      >
        <SkeletonBone
          width="100%"
          height={180}
          boneColor={boneColor}
          style={{ marginBottom: 20 }}
          opacityStyle={opacityStyle}
        />
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: 12,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <View key={key} style={{ width: "48%" }}>
              <SkeletonBone
                width="100%"
                height={140}
                boneColor={boneColor}
                opacityStyle={opacityStyle}
              />
              <SkeletonBone
                width="70%"
                height={12}
                boneColor={boneColor}
                style={{ marginTop: 8 }}
                opacityStyle={opacityStyle}
              />
              <SkeletonBone
                width="40%"
                height={10}
                boneColor={boneColor}
                style={{ marginTop: 6 }}
                opacityStyle={opacityStyle}
              />
            </View>
          ))}
        </View>
        {label}
      </View>
    );
  }

  if (variant === "shop") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          flexDirection: "row",
          paddingTop: 12,
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={t("common.loading")}
      >
        <View style={{ width: 88, paddingHorizontal: 8, gap: 10 }}>
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <SkeletonBone
              key={key}
              width="100%"
              height={28}
              boneColor={boneColor}
              opacityStyle={opacityStyle}
            />
          ))}
        </View>
        <View style={{ flex: 1, paddingHorizontal: 12, gap: 12 }}>
          <SkeletonBone
            width="100%"
            height={40}
            boneColor={boneColor}
            opacityStyle={opacityStyle}
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: 12,
            }}
          >
            {[0, 1, 2, 3].map((key) => (
              <SkeletonBone
                key={key}
                width="48%"
                height={160}
                boneColor={boneColor}
                opacityStyle={opacityStyle}
              />
            ))}
          </View>
          {label}
        </View>
      </View>
    );
  }

  if (variant === "profile") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          paddingHorizontal: 16,
          paddingTop: 32,
          alignItems: "center",
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={t("common.loading")}
      >
        <SkeletonBone
          width={72}
          height={72}
          boneColor={boneColor}
          style={{ borderRadius: 36, marginBottom: 16 }}
          opacityStyle={opacityStyle}
        />
        <SkeletonBone
          width={140}
          height={14}
          boneColor={boneColor}
          style={{ marginBottom: 8 }}
          opacityStyle={opacityStyle}
        />
        <SkeletonBone
          width={100}
          height={12}
          boneColor={boneColor}
          style={{ marginBottom: 28 }}
          opacityStyle={opacityStyle}
        />
        {[0, 1, 2, 3, 4].map((key) => (
          <SkeletonBone
            key={key}
            width="100%"
            height={48}
            boneColor={boneColor}
            style={{ marginBottom: 10 }}
            opacityStyle={opacityStyle}
          />
        ))}
        {label}
      </View>
    );
  }

  if (variant === "highlights") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          paddingHorizontal: 16,
          paddingTop: 24,
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={t("common.loading")}
      >
        <SkeletonBone
          width="100%"
          height={420}
          boneColor={boneColor}
          style={{ marginBottom: 16 }}
          opacityStyle={opacityStyle}
        />
        <SkeletonBone
          width="55%"
          height={14}
          boneColor={boneColor}
          style={{ marginBottom: 8 }}
          opacityStyle={opacityStyle}
        />
        <SkeletonBone
          width="80%"
          height={12}
          boneColor={boneColor}
          opacityStyle={opacityStyle}
        />
        {label}
      </View>
    );
  }

  if (variant === "list") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={t("common.loading")}
      >
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <View
            key={key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
              gap: 12,
            }}
          >
            <SkeletonBone
              width={56}
              height={56}
              boneColor={boneColor}
              opacityStyle={opacityStyle}
            />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonBone
                width="70%"
                height={12}
                boneColor={boneColor}
                opacityStyle={opacityStyle}
              />
              <SkeletonBone
                width="45%"
                height={10}
                boneColor={boneColor}
                opacityStyle={opacityStyle}
              />
            </View>
          </View>
        ))}
        {label}
      </View>
    );
  }

  /** Compact centered pulse + caption (fallback / auth gates). */
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
      accessibilityRole="progressbar"
      accessibilityLabel={t("common.loading")}
    >
      <SkeletonBone
        width={48}
        height={48}
        boneColor={boneColor}
        style={{ borderRadius: 24 }}
        opacityStyle={opacityStyle}
      />
      {label}
    </View>
  );
}
