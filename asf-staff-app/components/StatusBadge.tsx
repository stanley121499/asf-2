import React from "react";
import { Text, View } from "react-native";

type StatusBadgeProps = {
  status: string;
};

/**
 * Neutral pill for order/ticket-style status strings.
 */
export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const normalized =
    typeof status === "string" && status.trim().length > 0 ? status.trim() : "—";

  return (
    <View className="self-start rounded-full border border-border bg-bg px-3 py-1">
      <Text className="text-xs font-medium capitalize text-text">{normalized}</Text>
    </View>
  );
}
