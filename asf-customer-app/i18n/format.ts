import type { Locale } from "./types";

/**
 * Maps app locale codes to BCP 47 tags for `Intl` formatters.
 */
function resolveIntlLocale(locale: Locale): string {
  if (locale === "zh-CN") {
    return "zh-CN";
  }
  if (locale === "ms") {
    return "ms-MY";
  }
  return "en";
}

/**
 * Formats an ISO date string for display in the given locale via `Intl`.
 * Invalid dates return the original `iso` string unchanged.
 */
export function formatDate(locale: Locale, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Formats a number for display in the given locale via `Intl`.
 */
export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale)).format(n);
}
