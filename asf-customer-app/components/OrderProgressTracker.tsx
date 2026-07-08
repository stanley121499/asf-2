import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTranslation } from "@/context/LocaleContext";
import { colors } from "@/constants/theme";

/**
 * A single stage in the order lifecycle (label resolved via i18n at render time).
 */
interface OrderStage {
  /** Translation key under `orders.timeline.*`. */
  labelKey: "ordered" | "processing" | "inTransit" | "delivered";
  /** Stable id for list keys (independent of translated label). */
  id: string;
  /** Ionicons glyph representing the stage. */
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Canonical fulfilment stages, in order. Maps to the `orders.status` column
 * values: pending → processing → shipped → delivered.
 */
const STAGES: readonly OrderStage[] = [
  { id: "ordered", labelKey: "ordered", icon: "receipt-outline" },
  { id: "processing", labelKey: "processing", icon: "cube-outline" },
  { id: "inTransit", labelKey: "inTransit", icon: "car-outline" },
  { id: "delivered", labelKey: "delivered", icon: "checkmark-done-outline" },
] as const;

const NODE_SIZE = 44;
const LINE_HEIGHT = 3;

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * Maps a raw order status string to its stage index (0-3).
 * Returns -1 for cancelled and any unknown status.
 */
function statusToStageIndex(status: string | null | undefined): number {
  const s = (status ?? "").trim().toLowerCase();
  if (s.includes("cancel") || s.includes("取消")) {
    return -1;
  }
  if (s.includes("deliver") || s.includes("送达") || s.includes("complete")) {
    return 3;
  }
  if (s.includes("ship") || s.includes("transit") || s.includes("发货") || s.includes("运输")) {
    return 2;
  }
  if (s.includes("process") || s.includes("paid") || s.includes("处理")) {
    return 1;
  }
  // pending / placed / awaiting payment all map to the first stage.
  return 0;
}

/**
 * Short human description of the current stage, shown under the headline.
 */
function describeStage(stageIndex: number, cancelled: boolean, t: TranslateFn): string {
  if (cancelled) {
    return t("orders.timeline.cancelled");
  }
  switch (stageIndex) {
    case 0:
      return t("orders.progress.submitted");
    case 1:
      return t("orders.progress.preparing");
    case 2:
      return t("orders.progress.inTransit");
    case 3:
      return t("orders.progress.deliveredThanks");
    default:
      return "";
  }
}

/**
 * Animated pulsing halo rendered behind the current stage node.
 */
function PulseRing({ color }: Readonly<{ color: string }>): React.ReactElement {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.6 }],
    opacity: 0.45 * (1 - progress.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: NODE_SIZE / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Connector half-segment drawn to the left or right of a node.
 */
function Connector({
  filled,
  side,
}: Readonly<{ filled: boolean; side: "left" | "right" }>): React.ReactElement {
  return (
    <View
      style={{
        position: "absolute",
        top: NODE_SIZE / 2 - LINE_HEIGHT / 2,
        height: LINE_HEIGHT,
        backgroundColor: filled ? colors.text : colors.border,
        left: side === "left" ? 0 : "50%",
        right: side === "left" ? "50%" : 0,
      }}
    />
  );
}

/**
 * Props for {@link OrderProgressTracker}.
 */
export interface OrderProgressTrackerProps {
  /** Raw `orders.status` value. */
  status: string | null | undefined;
  /**
   * When true, renders only the inner content (headline + stepper) without the
   * surrounding card, so it can be composed inside a custom container.
   */
  embedded?: boolean;
}

/**
 * Inner content: status headline + horizontal stepper.
 */
function TrackerBody({
  stageIndex,
  t,
}: Readonly<{ stageIndex: number; t: TranslateFn }>): React.ReactElement {
  const activeStage = STAGES[stageIndex];
  const headline =
    activeStage !== undefined
      ? t(`orders.timeline.${activeStage.labelKey}`)
      : t("orders.timeline.ordered");

  return (
    <View>
      {/* Headline */}
      <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 22, color: colors.text }}>
        {headline}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.muted,
          marginTop: 4,
          marginBottom: 24,
          fontFamily: "Inter_400Regular",
        }}
      >
        {describeStage(stageIndex, false, t)}
      </Text>

      {/* Stepper */}
      <View style={{ flexDirection: "row" }}>
        {STAGES.map((stage, idx) => {
          const completed = idx < stageIndex;
          const current = idx === stageIndex;
          const leftFilled = idx <= stageIndex && idx > 0;
          const rightFilled = idx < stageIndex;
          const label = t(`orders.timeline.${stage.labelKey}`);

          const nodeBg = completed ? colors.text : current ? colors.accent : colors.panel;
          const iconColor = completed || current ? "#FFFFFF" : colors.muted;
          const labelColor = current || completed ? colors.text : colors.muted;

          return (
            <View key={stage.id} style={{ flex: 1, alignItems: "center" }}>
              {/* Node row with connectors */}
              <View
                style={{
                  width: "100%",
                  height: NODE_SIZE,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {idx > 0 ? <Connector filled={leftFilled} side="left" /> : null}
                {idx < STAGES.length - 1 ? <Connector filled={rightFilled} side="right" /> : null}

                {current ? <PulseRing color={colors.accent} /> : null}

                <View
                  style={{
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    borderRadius: NODE_SIZE / 2,
                    backgroundColor: nodeBg,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: current || completed ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons
                    name={completed ? "checkmark" : stage.icon}
                    size={completed ? 22 : 20}
                    color={iconColor}
                  />
                </View>
              </View>

              {/* Label */}
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: labelColor,
                  fontWeight: current ? "600" : "400",
                  fontFamily: "Inter_400Regular",
                  textAlign: "center",
                }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Inner content for a cancelled order.
 */
function CancelledBody({ t }: Readonly<{ t: TranslateFn }>): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#FCEDEC",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close-circle-outline" size={26} color={colors.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text }}>
          {t("orders.timeline.cancelled")}
        </Text>
        <Text
          style={{ fontSize: 13, color: colors.muted, marginTop: 2, fontFamily: "Inter_400Regular" }}
        >
          {t("orders.progress.cancelledHelp")}
        </Text>
      </View>
    </View>
  );
}

/**
 * Premium order fulfilment tracker: a horizontal stepper with completed,
 * current (pulsing), and upcoming nodes plus a status headline. Renders a
 * distinct cancelled treatment when the order is cancelled. Pass `embedded`
 * to drop the card chrome and compose it inside a custom container.
 */
export function OrderProgressTracker({
  status,
  embedded = false,
}: Readonly<OrderProgressTrackerProps>): React.ReactElement {
  const { t } = useTranslation();
  const stageIndex = statusToStageIndex(status);
  const cancelled = stageIndex === -1;
  const body = cancelled ? (
    <CancelledBody t={t} />
  ) : (
    <TrackerBody stageIndex={stageIndex} t={t} />
  );

  if (embedded) {
    return body;
  }

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        padding: 20,
      }}
    >
      {body}
    </View>
  );
}

/**
 * Compact 4-dot progress indicator for order list cards.
 */
export function OrderProgressDots({
  status,
}: Readonly<OrderProgressTrackerProps>): React.ReactElement {
  const { t } = useTranslation();
  const stageIndex = statusToStageIndex(status);
  const cancelled = stageIndex === -1;

  if (cancelled) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="close-circle" size={14} color={colors.danger} />
        <Text style={{ fontSize: 12, color: colors.danger, fontFamily: "Inter_400Regular" }}>
          {t("orders.status.cancelled")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {STAGES.map((stage, idx) => {
        const reached = idx <= stageIndex;
        return (
          <View
            key={stage.id}
            style={{
              width: idx === stageIndex ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: reached ? colors.text : colors.border,
            }}
          />
        );
      })}
    </View>
  );
}
