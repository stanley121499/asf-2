import React from "react";
import { Text, View } from "react-native";

export interface OrderStatusBadgeProps {
  status: string;
}

/**
 * Colour-coded pill for order status labels.
 */
export function OrderStatusBadge({ status }: OrderStatusBadgeProps): React.ReactElement {
  const normalized = status.trim().toLowerCase();
  let tone = "bg-muted/20 text-text border-border";
  if (normalized.includes("deliver") || normalized.includes("送达")) {
    tone = "bg-success/15 text-success border-success/40";
  } else if (normalized.includes("cancel")) {
    tone = "bg-danger/10 text-danger border-danger/40";
  } else if (normalized.includes("process") || normalized.includes("paid")) {
    tone = "bg-accent/10 text-accent border-accent/30";
  }

  return (
    <View className={`self-start px-2 py-1 rounded-full border ${tone}`}>
      <Text className="text-xs font-medium capitalize">{status}</Text>
    </View>
  );
}
