import { DEFAULT_LOCALE, type Locale } from "@/i18n/types";

/**
 * Compact relative time string for notification rows.
 * Accepts the active UI {@link Locale} so EN / zh-CN format correctly.
 */
export function formatRelativeTime(iso: string, locale: Locale = DEFAULT_LOCALE): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffMs = Date.now() - timestamp;
  const sec = Math.floor(diffMs / 1000);

  if (sec < 60) {
    return locale === "en" ? "Just now" : "刚刚";
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return locale === "en" ? `${min} min ago` : `${min}分钟前`;
  }

  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return locale === "en" ? `${hours} hr ago` : `${hours}小时前`;
  }

  const days = Math.floor(hours / 24);
  return locale === "en" ? `${days} days ago` : `${days}天前`;
}

/**
 * @deprecated Prefer {@link formatRelativeTime} with an explicit locale.
 * Kept so older call sites compile until callers migrate.
 */
export function formatRelativeTimeZh(iso: string): string {
  return formatRelativeTime(iso, "zh-CN");
}
