import type { Locale } from "./types";

/**
 * Formats an ISO date string for display in the given locale via `Intl`.
 * Invalid dates return the original `iso` string unchanged.
 */
export function formatDate(locale: Locale, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const intlLocale = locale === "zh-CN" ? "zh-CN" : "en";
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Formats a number for display in the given locale via `Intl`.
 */
export function formatNumber(locale: Locale, n: number): string {
  const intlLocale = locale === "zh-CN" ? "zh-CN" : "en";
  return new Intl.NumberFormat(intlLocale).format(n);
}
