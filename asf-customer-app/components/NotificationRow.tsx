import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useTranslation } from "@/context/LocaleContext";
import type { Tables } from "@/database.types";
import { formatRelativeTime } from "@/lib/relativeTime";

type NotificationRowType = Tables<"notifications">;

export interface NotificationRowProps {
  notification: NotificationRowType;
  onPress: (id: string) => void;
}

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  const lowered = type.toLowerCase();
  if (lowered.includes("order")) {
    return "bag-handle-outline";
  }
  if (lowered.includes("ticket")) {
    return "chatbubble-ellipses-outline";
  }
  return "notifications-outline";
}

/**
 * Single notification row with unread accent bar and relative timestamp.
 * Title/body stay as DB content; chrome fallback + relative time use i18n.
 */
export function NotificationRow({ notification, onPress }: NotificationRowProps): React.ReactElement {
  const { t } = useTranslation();
  const unread = notification.read_at === null;
  const title =
    typeof notification.title === "string" && notification.title.length > 0
      ? notification.title
      : t("notifications.title");
  const body =
    typeof notification.body === "string" && notification.body.length > 0 ? notification.body : "";
  const created =
    typeof notification.created_at === "string"
      ? formatRelativeTime(notification.created_at, t)
      : "";

  return (
    <Pressable
      className="mb-3 rounded-xl border border-border bg-panel overflow-hidden flex-row"
      onPress={() => onPress(notification.id)}
    >
      {unread ? <View className="w-1 bg-accent self-stretch" /> : null}
      <View className="flex-1 flex-row p-4">
        <View className="mr-3 pt-0.5">
          <Ionicons name={iconForType(notification.type)} size={22} color="#000000" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-accent">{title}</Text>
          <Text className="text-sm text-muted mt-1">{body}</Text>
          <Text className="text-xs text-muted mt-2">{created}</Text>
        </View>
      </View>
    </Pressable>
  );
}
