import React from "react";
import { Pressable, Text, View } from "react-native";

type KpiCardProps = {
  title: string;
  value: string;
  /** Optional hint shown under the title */
  subtitle?: string;
  onPress?: () => void;
};

/**
 * Dashboard metric tile — tap navigates when `onPress` is provided.
 */
export function KpiCard({
  title,
  value,
  subtitle,
  onPress,
}: KpiCardProps): React.ReactElement {
  const inner = (
    <>
      <Text className="text-xs uppercase tracking-wide text-muted">{title}</Text>
      {subtitle !== undefined ? (
        <Text className="mt-1 text-xs text-muted">{subtitle}</Text>
      ) : null}
      <Text className="mt-3 text-3xl font-semibold text-accent">{value}</Text>
    </>
  );

  if (onPress !== undefined) {
    return (
      <Pressable
        onPress={onPress}
        className="rounded-2xl border border-border bg-panel p-5 active:opacity-90"
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View className="rounded-2xl border border-border bg-panel p-5">{inner}</View>
  );
}
