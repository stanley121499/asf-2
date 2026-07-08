import React from "react";
import { Pressable, Text, View } from "react-native";

import { useAlertContext } from "@/context/AlertContext";
import { useTranslation } from "@/context/LocaleContext";

/**
 * Renders toast-style alerts from `AlertContext` (used by cart and other contexts).
 */
export function AlertBanner(): React.ReactElement | null {
  const { visible, message, type, hideAlert } = useAlertContext();
  const { t } = useTranslation();

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
    <View className={`absolute top-14 left-4 right-4 z-[100] rounded-xl border px-4 py-3 shadow-md ${bgClass}`}>
      <Pressable
        onPress={hideAlert}
        accessibilityRole="button"
        accessibilityLabel={t("alerts.dismiss")}
      >
        <Text className="text-sm text-accent">{message}</Text>
      </Pressable>
    </View>
  );
}
