import React from "react";
import { Pressable, Text, View } from "react-native";

import { useAlertContext } from "@/context/AlertContext";

/**
 * Toast-style alerts driven by `AlertContext`.
 */
export function AlertBanner() {
  const { visible, message, type, hideAlert } = useAlertContext();

  if (!visible || message.length === 0) {
    return null;
  }

  const bgClass =
    type === "error"
      ? "bg-red-50 border-red-200"
      : type === "warning"
        ? "bg-amber-50 border-amber-200"
        : type === "success"
          ? "bg-green-50 border-green-200"
          : "bg-white border-border";

  return (
    <View
      className={`absolute left-4 right-4 top-14 z-[100] rounded-xl border px-4 py-3 shadow-md ${bgClass}`}
    >
      <Pressable onPress={hideAlert} accessibilityRole="button">
        <Text className="text-sm text-accent">{message}</Text>
      </Pressable>
    </View>
  );
}
