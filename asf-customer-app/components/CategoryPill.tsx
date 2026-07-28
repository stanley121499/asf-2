import React from "react";
import { Text } from "react-native";

import { PressableScale } from "@/components/motion";
import { colors } from "@/constants/theme";

export interface CategoryPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Horizontal chip for category / sort filters.
 * Uses inline styles (not NativeWind) so flexShrink: 0 is enforced
 * and text is never clipped inside a horizontal ScrollView.
 */
export function CategoryPill({ label, selected, onPress }: CategoryPillProps): React.ReactElement {
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flexShrink: 0,
        flexGrow: 0,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? "rgba(201,169,110,0.12)" : "#FFFFFF",
        marginRight: 10,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Inter_400Regular",
          color: selected ? colors.accent : colors.text,
          fontWeight: selected ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
