import type { ComponentType } from "react";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * Shared props for theme-specific discovery-points pop-in ceremonies.
 * Call sites pass i18n labels; each theme owns layout, motion, and chrome.
 *
 * Implementations must not use RN `Modal` or capture touches — render as a
 * decorative absolute overlay with `pointerEvents="none"` so PDP scroll and
 * gallery pans keep working while the +N toast plays.
 */
export type PointsCeremonyProps = {
  /** When true, plays the ceremony and starts the hold → dismiss cycle. */
  visible: boolean;
  /** Points awarded (shown as +N). Must be > 0 for a meaningful pop-in. */
  points: number;
  /**
   * Uppercase or editorial eyebrow above the points line
   * (e.g. i18n “Points earned”). Defaults to English when omitted.
   */
  titleLabel?: string;
  /**
   * Primary body. Prefer i18n `+{n} points` / `+{n} 积分`.
   * When omitted, falls back to `+{points}`.
   */
  pointsLabel?: string;
  /** Called when the ceremony finishes exiting (auto-dismiss or manual). */
  onDismiss: () => void;
  /**
   * Milliseconds the ceremony stays fully visible before exit.
   * Theme components may fall back to `motion.delay.achievementHold`.
   */
  holdMs?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Theme-resolved ceremony component type. */
export type PointsCeremonyComponent = ComponentType<PointsCeremonyProps>;
