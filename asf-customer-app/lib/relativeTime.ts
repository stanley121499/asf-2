import type { TranslateFn } from "@/i18n/types";

/**
 * Compact relative time string for notification rows.
 * Pass the active {@link TranslateFn} so all locales use JSON catalog strings.
 */
export function formatRelativeTime(iso: string, translate: TranslateFn): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffMs = Date.now() - timestamp;
  const sec = Math.floor(diffMs / 1000);

  if (sec < 60) {
    return translate("notifications.relative.justNow");
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return translate("notifications.relative.minutesAgo", { count: min });
  }

  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return translate("notifications.relative.hoursAgo", { count: hours });
  }

  const days = Math.floor(hours / 24);
  return translate("notifications.relative.daysAgo", { count: days });
}
