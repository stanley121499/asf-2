import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import type { Tables } from "@/database.types";
import { formatRelativeTimeZh } from "@/lib/relativeTime";

type NotificationRowType = Tables<"notifications">;

export interface NotificationRowProps {
  notification: NotificationRowType;
  onPress: (id: string) => void;
}

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  const t = type.toLowerCase();
  if (t.includes("order")) {
    return "bag-handle-outline";
  }
  if (t.includes("ticket")) {
    return "chatbubble-ellipses-outline";
  }
  return "notifications-outline";
}

/**
 * Single notification row with unread accent bar and relative timestamp.
 */
export function NotificationRow({ notification, onPress }: NotificationRowProps): React.ReactElement {
  const unread = notification.read_at === null;
  const title =
    typeof notification.title === "string" && notification.title.length > 0
      ? notification.title
      : "通知";
  const body =
    typeof notification.body === "string" && notification.body.length > 0 ? notification.body : "";
  const created =
    typeof notification.created_at === "string" ? formatRelativeTimeZh(notification.created_at) : "";

  return (
    <Pressable
      className={`mb-3 rounded-xl border border-border bg-panel overflow-hidden flex-row`}
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
