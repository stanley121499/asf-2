import React from "react";
import { Text, View } from "react-native";

import { useTranslation } from "@/context/LocaleContext";

export interface OrderStatusBadgeProps {
  status: string;
}

/**
 * Maps a raw `orders.status` value to an `orders.status.*` translation key suffix.
 */
function statusKeySuffix(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized.includes("cancel") || normalized.includes("取消")) {
    return "cancelled";
  }
  if (normalized.includes("deliver") || normalized.includes("送达") || normalized.includes("complete")) {
    return "delivered";
  }
  if (normalized.includes("ship") || normalized.includes("发货") || normalized.includes("运输")) {
    return "shipped";
  }
  if (normalized.includes("pickup") || normalized.includes("取件")) {
    return "awaitingPickup";
  }
  if (normalized.includes("process") || normalized.includes("paid") || normalized.includes("处理")) {
    return "processing";
  }
  return "pending";
}

/**
 * Colour-coded pill for order status labels.
 */
export function OrderStatusBadge({ status }: OrderStatusBadgeProps): React.ReactElement {
  const { t } = useTranslation();
  const normalized = status.trim().toLowerCase();
  const suffix = statusKeySuffix(status);
  const label = t(`orders.status.${suffix}`);

  let tone = "bg-muted/20 text-text border-border";
  if (normalized.includes("deliver") || normalized.includes("送达")) {
    tone = "bg-success/15 text-success border-success/40";
  } else if (normalized.includes("cancel") || normalized.includes("取消")) {
    tone = "bg-danger/10 text-danger border-danger/40";
  } else if (normalized.includes("process") || normalized.includes("paid") || normalized.includes("处理")) {
    tone = "bg-accent/10 text-accent border-accent/30";
  }

  return (
    <View className={`self-start px-2 py-1 rounded-full border ${tone}`}>
      <Text className="text-xs font-medium">{label}</Text>
    </View>
  );
}
