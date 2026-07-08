import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import type { AnnouncementRow } from "@/context/AnnouncementContext";
import { useTranslation } from "@/context/LocaleContext";

export interface AnnouncementBannerProps {
  announcement: AnnouncementRow;
  onDismiss: (id: string) => void;
}

/**
 * Full-width strip for an active announcement (title + message + dismiss).
 * Title/message remain DB content; only chrome (close a11y) is translated here.
 */
export function AnnouncementBanner({
  announcement,
  onDismiss,
}: AnnouncementBannerProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <View className="bg-accent px-4 py-3 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-bg font-semibold text-sm">{announcement.title}</Text>
        <Text className="text-bg/90 text-xs mt-1" numberOfLines={3}>
          {announcement.message}
        </Text>
      </View>
      <Pressable
        onPress={() => onDismiss(announcement.id)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t("announcement.closeAria")}
      >
        <Ionicons name="close" size={22} color="#FAF9F6" />
      </Pressable>
    </View>
  );
}
