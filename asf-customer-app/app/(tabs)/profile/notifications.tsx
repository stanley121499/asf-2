import React from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

import { SubPageHeader } from "@/components/SubPageHeader";
import { NotificationRow } from "@/components/NotificationRow";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useNotificationContext } from "@/context/NotificationContext";
import { colors } from "@/constants/theme";

/**
 * Notifications — sticky header, mark-all button, notification rows.
 */
export default function NotificationsScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotificationContext();

  const markAllButton = unreadCount > 0 ? (
    <TouchableOpacity onPress={() => void markAllAsRead()} hitSlop={8}>
      <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "Inter_400Regular" }}>
        {t("notifications.markAllRead")}
      </Text>
    </TouchableOpacity>
  ) : undefined;

  if (user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title={t("notifications.title")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("notifications.loginRequired")}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SubPageHeader title={t("notifications.title")} right={markAllButton} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SubPageHeader title={t("notifications.title")} right={markAllButton} />

      {notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: colors.text, marginBottom: 8 }}>
            {t("notifications.empty")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, fontFamily: "Inter_400Regular" }}>
            {t("notifications.emptyHint")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: n }) => (
            <NotificationRow key={n.id} notification={n} onPress={(id) => void markAsRead(id)} />
          )}
        />
      )}
    </View>
  );
}
