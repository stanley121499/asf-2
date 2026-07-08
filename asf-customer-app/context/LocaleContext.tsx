import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import enMessages from "@/i18n/locales/en.json";
import zhCnMessages from "@/i18n/locales/zh-CN.json";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isSupportedLocale,
  type Locale,
} from "@/i18n/types";

/** Named placeholders for `{param}` interpolation inside message templates. */
type MessageParams = Record<string, string | number>;

/** Shape of each locale JSON message catalog. */
type Messages = typeof zhCnMessages;

const MESSAGES: Record<Locale, Messages> = {
  "zh-CN": zhCnMessages,
  en: enMessages,
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

/**
 * Narrows unknown JSON-like values to plain objects (not arrays).
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Walks a dotted key path (e.g. `nav.home`) through the message tree.
 * Returns the leaf string, or `undefined` when the path is missing / not a string.
 */
function getNestedMessage(
  messages: Messages,
  key: string,
): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Replaces `{param}` tokens in a template with values from `params`.
 * Unknown tokens are left as-is.
 */
function interpolate(template: string, params?: MessageParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, paramKey: string) => {
    const value = params[paramKey];
    if (value === undefined) {
      return match;
    }
    return String(value);
  });
}

/**
 * Loads the persisted locale from AsyncStorage, falling back to {@link DEFAULT_LOCALE}.
 * Invalid stored values are rewritten to the default.
 */
async function readStoredLocale(): Promise<Locale> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) {
      return stored;
    }
    if (stored) {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, DEFAULT_LOCALE);
    }
  } catch (error) {
    console.warn("[i18n] Failed to read locale from AsyncStorage:", error);
  }
  return DEFAULT_LOCALE;
}

/**
 * Provides app-wide locale state persisted in AsyncStorage (`asf_locale`).
 */
export function LocaleProvider({ children }: PropsWithChildren): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const hydrate = async (): Promise<void> => {
      const next = await readStoredLocale();
      if (!isActive) {
        return;
      }
      setLocaleState(next);
      setHydrated(true);
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  /**
   * Updates the active locale and persists it to AsyncStorage.
   */
  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    void AsyncStorage.setItem(LOCALE_STORAGE_KEY, nextLocale).catch((error: unknown) => {
      console.warn("[i18n] Failed to persist locale to AsyncStorage:", error);
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: hydrated ? locale : DEFAULT_LOCALE,
      setLocale,
    }),
    [hydrated, locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/**
 * Hook to read / write the active UI locale.
 * Must be used inside {@link LocaleProvider}.
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

/**
 * Hook for translating dotted keys with optional `{param}` interpolation.
 * Missing keys log a `__DEV__` warning and return the key string.
 */
export function useTranslation(): {
  t: (key: string, params?: MessageParams) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
} {
  const { locale, setLocale } = useLocale();

  const t = useCallback(
    (key: string, params?: MessageParams): string => {
      const messages = MESSAGES[locale];
      const message = getNestedMessage(messages, key);

      if (message === undefined) {
        if (__DEV__) {
          console.warn(`[i18n] Missing translation key: "${key}" (${locale})`);
        }
        return key;
      }

      return interpolate(message, params);
    },
    [locale],
  );

  return { t, locale, setLocale };
}
