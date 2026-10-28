import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { AnimatedBadge, PressableScale } from "@/components/motion";
import { useTranslation } from "@/context/LocaleContext";
import { useNotificationContext } from "@/context/NotificationContext";
import {
  openNotificationInbox,
  type NotificationInboxReturnTo,
} from "@/lib/notificationNavigation";
import { storefrontTokens as tokens } from "@/themes/storefront/tokens";

/** Unread counts above this display as `99+`. */
const UNREAD_BADGE_CAP = 99;

export type NotificationBellButtonProps = {
  /** Icon / badge accent color. Defaults to Storefront text token. */
  color?: string;
  /** Hit target size (default 44). */
  size?: number;
  /** Icon glyph size (default 22). */
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Badge position relative to the hit target (top-right corner).
   * Matches {@link CartButton} defaults so chrome stays aligned.
   */
  badgeOffset?: { top: number; right: number };
  /**
   * When set, inbox back restores this tab/screen instead of popping the Profile
   * stack (required when the bell is shown outside the Profile tab).
   */
  returnTo?: NotificationInboxReturnTo;
};

/** Default badge nudge: sits on the top-right rim of the press target. */
const DEFAULT_BADGE_OFFSET = { top: 2, right: 2 } as const;

/**
 * Formats unread count for the badge pill: hidden at 0, capped at `99+`.
 */
function formatUnreadBadgeCount(unreadCount: number): number | string {
  if (!Number.isFinite(unreadCount) || unreadCount <= 0) {
    return 0;
  }
  const floored = Math.floor(unreadCount);
  if (floored > UNREAD_BADGE_CAP) {
    return "99+";
  }
  return floored;
}

/**
 * Storefront notification bell with unread badge → existing inbox.
 *
 * Reuses {@link useNotificationContext} `unreadCount` and navigates to
 * `/(tabs)/profile/notifications` (logged-out users see the inbox login gate).
 * Placed beside cart on Home, Shop, and Highlights (plan §3.5–3.6 / R15).
 */
export function NotificationBellButton({
  color = tokens.text,
  size = 44,
  iconSize = 22,
  style,
  badgeOffset = DEFAULT_BADGE_OFFSET,
  returnTo,
}: NotificationBellButtonProps): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();
  const { unreadCount } = useNotificationContext();

  const label = t("notifications.openInbox");
  const badgeCount = formatUnreadBadgeCount(unreadCount);

  return (
    <PressableScale
      haptic="light"
      centerContent
      style={[
        {
          width: size,
          height: size,
          overflow: "visible",
        },
        style,
      ]}
      onPress={() => {
        openNotificationInbox(router, returnTo !== undefined ? { returnTo } : undefined);
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="notifications-outline" size={iconSize} color={color} />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: badgeOffset.top,
            right: badgeOffset.right,
          }}
        >
          <AnimatedBadge count={badgeCount} accessibilityLabel={label} />
        </View>
      </View>
    </PressableScale>
  );
}
