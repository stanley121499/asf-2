import type { Locale } from "./types";

/**
 * Resolves a display field from base-table and translation-table values.
 * `zh-CN` uses the canonical base value; `en` and `ms` prefer the translation with fallback.
 */
export function resolveField(
  locale: Locale,
  base: string | null,
  translated: string | null | undefined,
): string {
  if (locale === "zh-CN") {
    return base ?? "";
  }
  return translated ?? base ?? "";
}
