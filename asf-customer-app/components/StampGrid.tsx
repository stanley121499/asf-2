import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useTheme, useThemeTokens } from "@/context/ThemeContext";

export interface StampGridProps {
  stamps: boolean[];
  loading: boolean;
  onSlotPress: (index: number) => void;
}

/**
 * 3×3 rewards stamp grid (scratch-card style interaction).
 * Uses theme tokens so Noir slots stay dark-native (NativeWind palette is Classic-locked).
 */
export function StampGrid({ stamps, loading, onSlotPress }: StampGridProps): React.ReactElement {
  const tokens = useThemeTokens();
  const { themeId } = useTheme();
  const isNoir = themeId === "noir";
  /** Inset fill: panel on Classic white card; darker bg on Noir panel card. */
  const slotBg = isNoir ? tokens.bg : tokens.panel;

  if (loading) {
    return (
      <View style={{ paddingVertical: 32, alignItems: "center" }}>
        <ActivityIndicator color={tokens.accent} />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
      {stamps.map((filled, idx) => (
        <Pressable
          key={idx}
          style={{
            width: "30%",
            aspectRatio: 1,
            marginBottom: 12,
            borderRadius: isNoir ? 2 : 12,
            borderWidth: 1,
            borderColor: tokens.border,
            backgroundColor: slotBg,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => onSlotPress(idx)}
          accessibilityRole="button"
          accessibilityLabel={filled ? `Stamp ${idx + 1} filled` : `Stamp ${idx + 1} empty`}
        >
          <Text style={{ fontSize: 24, color: tokens.accent }}>{filled ? "✓" : "○"}</Text>
        </Pressable>
      ))}
    </View>
  );
}
