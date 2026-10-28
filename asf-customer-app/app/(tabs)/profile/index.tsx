import React from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/context/ThemeContext";
import { useNotificationP2Focus } from "@/context/NotificationContext";
import { useTranslation } from "@/context/LocaleContext";

/**
 * Thin Profile hub route — mounts the active theme pack's ProfileHub skin.
 * P2: notifications (unread badge) hydrate when Profile is focused.
 * Theme Appearance is SUPERADMIN-only at `profile/appearance`.
 */
export default function ProfileHubRoute(): React.ReactElement {
  useNotificationP2Focus("notifications:profile");
  const { pack, tokens } = useTheme();
  const { t } = useTranslation();
  const Screen = pack.screens.ProfileHub;

  /**
   * Defensive: a stale theme-pack HMR / incomplete pack export must not throw
   * `Element type is invalid` and kill the Profile tab.
   */
  if (typeof Screen !== "function") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.bg,
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ color: tokens.muted, fontSize: 14, textAlign: "center" }}>
          {t("settings.title")}
        </Text>
      </View>
    );
  }

  return <Screen />;
}
