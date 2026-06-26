import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export interface StampGridProps {
  stamps: boolean[];
  loading: boolean;
  onSlotPress: (index: number) => void;
}

/**
 * 3×3 rewards stamp grid (scratch-card style interaction).
 */
export function StampGrid({ stamps, loading, onSlotPress }: StampGridProps): React.ReactElement {
  if (loading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator color="#000000" />
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap justify-between">
      {stamps.map((filled, idx) => (
        <Pressable
          key={idx}
          className="w-[30%] aspect-square mb-3 rounded-xl border border-border bg-panel items-center justify-center active:opacity-80"
          onPress={() => onSlotPress(idx)}
          accessibilityRole="button"
          accessibilityLabel={filled ? `Stamp ${idx + 1} filled` : `Stamp ${idx + 1} empty`}
        >
          <Text className="text-2xl text-accent">{filled ? "✓" : "○"}</Text>
        </Pressable>
      ))}
    </View>
  );
}
