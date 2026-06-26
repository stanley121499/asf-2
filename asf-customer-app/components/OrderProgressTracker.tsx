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

import { colors } from "@/constants/theme";

/**
 * A single stage in the order lifecycle.
 */
interface OrderStage {
  /** Short Chinese label shown under the node. */
  label: string;
  /** Ionicons glyph representing the stage. */
  icon: keyof typeof Ionicons.glyphMap;
}

/**
 * Canonical fulfilment stages, in order. Maps to the `orders.status` column
 * values: pending → processing → shipped → delivered.
 */
const STAGES: readonly OrderStage[] = [
  { label: "已下单", icon: "receipt-outline" },
  { label: "处理中", icon: "cube-outline" },
  { label: "运输中", icon: "car-outline" },
  { label: "已送达", icon: "checkmark-done-outline" },
] as const;

const NODE_SIZE = 44;
const LINE_HEIGHT = 3;

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
function describeStage(stageIndex: number, cancelled: boolean): string {
  if (cancelled) {
    return "订单已取消";
  }
  switch (stageIndex) {
    case 0:
      return "订单已提交，等待确认";
    case 1:
      return "正在为您备货";
    case 2:
      return "包裹正在配送途中";
    case 3:
      return "包裹已送达，感谢惠顾";
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
function TrackerBody({ stageIndex }: Readonly<{ stageIndex: number }>): React.ReactElement {
  return (
    <View>
      {/* Headline */}
      <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 22, color: colors.text }}>
        {STAGES[stageIndex].label}
      </Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 24, fontFamily: "Inter_400Regular" }}>
        {describeStage(stageIndex, false)}
      </Text>

      {/* Stepper */}
      <View style={{ flexDirection: "row" }}>
        {STAGES.map((stage, idx) => {
          const completed = idx < stageIndex;
          const current = idx === stageIndex;
          const leftFilled = idx <= stageIndex && idx > 0;
          const rightFilled = idx < stageIndex;

          const nodeBg = completed ? colors.text : current ? colors.accent : colors.panel;
          const iconColor = completed || current ? "#FFFFFF" : colors.muted;
          const labelColor = current || completed ? colors.text : colors.muted;

          return (
            <View key={stage.label} style={{ flex: 1, alignItems: "center" }}>
              {/* Node row with connectors */}
              <View style={{ width: "100%", height: NODE_SIZE, alignItems: "center", justifyContent: "center" }}>
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
                {stage.label}
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
function CancelledBody(): React.ReactElement {
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
          订单已取消
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2, fontFamily: "Inter_400Regular" }}>
          如有疑问，请联系客服
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
  const stageIndex = statusToStageIndex(status);
  const cancelled = stageIndex === -1;
  const body = cancelled ? <CancelledBody /> : <TrackerBody stageIndex={stageIndex} />;

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
  const stageIndex = statusToStageIndex(status);
  const cancelled = stageIndex === -1;

  if (cancelled) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name="close-circle" size={14} color={colors.danger} />
        <Text style={{ fontSize: 12, color: colors.danger, fontFamily: "Inter_400Regular" }}>已取消</Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {STAGES.map((stage, idx) => {
        const reached = idx <= stageIndex;
        return (
          <View
            key={stage.label}
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
