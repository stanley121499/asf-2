/**
 * Supported customer app locales and storage constants.
 * Preference is persisted in AsyncStorage under {@link LOCALE_STORAGE_KEY}.
 */

export type Locale = "zh-CN" | "en" | "ms";

/** Default UI locale when nothing is stored or the stored value is invalid. */
export const DEFAULT_LOCALE: Locale = "zh-CN";

/** AsyncStorage key for the user's language preference. */
export const LOCALE_STORAGE_KEY = "asf_locale";

/** Locales the app ships message catalogs for. */
export const SUPPORTED_LOCALES: readonly Locale[] = ["zh-CN", "en", "ms"];

/**
 * Type guard: returns true when `value` is a supported {@link Locale}.
 */
export function isSupportedLocale(value: string): value is Locale {
  return value === "zh-CN" || value === "en" || value === "ms";
}

/** Callback matching {@link useTranslation}'s `t` for i18n message keys. */
export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;
