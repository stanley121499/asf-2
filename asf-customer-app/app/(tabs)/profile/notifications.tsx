import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { usePreventRemove } from "expo-router/react-navigation";

import { SubPageHeader } from "@/components/SubPageHeader";
import { NotificationRow } from "@/components/NotificationRow";
import { useAuthContext } from "@/context/AuthContext";
import { useTranslation } from "@/context/LocaleContext";
import { useNotificationContext } from "@/context/NotificationContext";
import { useThemeTokens } from "@/context/ThemeContext";
import type { Tables } from "@/database.types";
import {
  leaveNotificationInbox,
  resolveNotificationHref,
  resolveNotificationInboxReturnTo,
} from "@/lib/notificationNavigation";

type NotificationRowType = Tables<"notifications">;

/**
 * Notifications — sticky header, mark-all, settings link, deep-link rows.
 */
export default function NotificationsScreen(): React.ReactElement {
  const tokens = useThemeTokens();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = resolveNotificationInboxReturnTo(params.returnTo);
  const { user } = useAuthContext();
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotificationContext();

  /**
   * When opened from Storefront chrome, restore Home / Shop / Highlights instead
   * of popping stale Profile stack entries (e.g. Theme / Appearance).
   */
  const handleBack = useCallback((): void => {
    if (returnTo !== null) {
      leaveNotificationInbox(router, returnTo);
      return;
    }
    const state = navigation.getState();
    const localIndex = typeof state?.index === "number" ? state.index : 0;
    if (localIndex > 0) {
      router.back();
    } else {
      router.replace("/(tabs)/profile");
    }
  }, [navigation, returnTo, router]);

  usePreventRemove(returnTo !== null, ({ data }) => {
    const actionType = data.action.type;
    if (actionType === "GO_BACK" || actionType === "POP") {
      if (returnTo !== null) {
        leaveNotificationInbox(router, returnTo);
      }
      return;
    }
    navigation.dispatch(data.action);
  });

  /**
   * Marks the row read, then navigates from metadata when a safe href exists.
   */
  const handlePress = useCallback(
    (notification: NotificationRowType): void => {
      void markAsRead(notification.id);
      const href = resolveNotificationHref(notification.metadata);
      if (href !== null) {
        router.push(href);
      }
    },
    [markAsRead, router],
  );

  const headerRight = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/profile/notification-settings")}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("notifications.settingsLink")}
      >
        <Text style={{ fontSize: 13, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
          {t("notifications.settingsLink")}
        </Text>
      </TouchableOpacity>
      {unreadCount > 0 ? (
        <TouchableOpacity onPress={() => void markAllAsRead()} hitSlop={8}>
          <Text style={{ fontSize: 13, color: tokens.accent, fontFamily: "Inter_400Regular" }}>
            {t("notifications.markAllRead")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (user === null) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("notifications.title")} onBack={handleBack} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("notifications.loginRequired")}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <SubPageHeader title={t("notifications.title")} right={headerRight} onBack={handleBack} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <SubPageHeader title={t("notifications.title")} right={headerRight} onBack={handleBack} />

      {notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontFamily: "PlayfairDisplay_400Regular", fontSize: 20, color: tokens.text, marginBottom: 8 }}>
            {t("notifications.empty")}
          </Text>
          <Text style={{ fontSize: 14, color: tokens.muted, fontFamily: "Inter_400Regular" }}>
            {t("notifications.emptyHint")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: 48, paddingHorizontal: 16, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: n }) => (
            <NotificationRow notification={n} onPress={handlePress} />
          )}
        />
      )}
    </View>
  );
}
