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

import type { ThemeId, ThemePack, ThemeTokens } from "@/themes/types";
import {
  DEFAULT_THEME_ID,
  THEME_STORAGE_KEY,
  isThemeId,
} from "@/themes/types";

type ThemeContextValue = {
  themeId: ThemeId;
  pack: ThemePack;
  tokens: ThemeTokens;
  setTheme: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Resolves a theme pack without a static import of `@/themes/registry`.
 *
 * Theme packs import `useTheme` / `useThemeTokens` from this module. A top-level
 * `import { getThemePack } from "@/themes/registry"` creates a Metro cycle
 * (`ThemeContext` → registry → pack screens → `ThemeContext`) that throws
 * `Property 'useTheme' doesn't exist` on thin routes such as Stores.
 */
function resolveThemePack(themeId: ThemeId): ThemePack {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional lazy require to break the cycle
  const registry = require("@/themes/registry") as {
    getThemePack: (id: ThemeId) => ThemePack;
  };
  return registry.getThemePack(themeId);
}

/**
 * Loads the persisted theme id from AsyncStorage, falling back to Classic.
 * Invalid stored values are rewritten to the default.
 */
async function readStoredThemeId(): Promise<ThemeId> {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) {
      return stored;
    }
    if (stored !== null) {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    }
  } catch (error: unknown) {
    console.warn("[theme] Failed to read theme from AsyncStorage:", error);
  }
  return DEFAULT_THEME_ID;
}

/**
 * Provides app-wide theme state persisted in AsyncStorage (`asf_theme`).
 * Default theme is Classic. Atelier/Noir packs may still look Classic until later agents.
 */
export function ThemeProvider({ children }: PropsWithChildren): React.ReactElement {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const hydrate = async (): Promise<void> => {
      const next = await readStoredThemeId();
      if (!isActive) {
        return;
      }
      setThemeIdState(next);
      setHydrated(true);
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  /**
   * Updates the active theme and persists it to AsyncStorage immediately.
   */
  const setTheme = useCallback((nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextThemeId).catch((error: unknown) => {
      console.warn("[theme] Failed to persist theme to AsyncStorage:", error);
    });
  }, []);

  const activeThemeId = hydrated ? themeId : DEFAULT_THEME_ID;
  const pack = resolveThemePack(activeThemeId);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: activeThemeId,
      pack,
      tokens: pack.tokens,
      setTheme,
    }),
    [activeThemeId, pack, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to read / write the active theme pack.
 * Must be used inside {@link ThemeProvider}.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Convenience hook for visual tokens only.
 * Must be used inside {@link ThemeProvider}.
 */
export function useThemeTokens(): ThemeTokens {
  return useTheme().tokens;
}
