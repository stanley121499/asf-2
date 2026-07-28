import type { ComponentType } from "react";

/**
 * Stable theme identifiers for the customer app multi-skin system.
 * Exactly three themes ship in v1.
 */
export type ThemeId = "classic" | "atelier" | "noir";

/**
 * Visual design tokens shared across Tier A layouts and Tier B shells.
 * Prefer these via `useThemeTokens()` over hardcoded Classic colors.
 */
export type ThemeTokens = {
  accent: string;
  bg: string;
  panel: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  success: string;
  /**
   * Expo StatusBar `style` prop: `"dark"` = dark icons (light ground),
   * `"light"` = light icons (dark ground).
   */
  statusBarStyle: "light" | "dark";
};

/**
 * Bottom tab bar chrome owned by each theme pack.
 */
export type TabBarTheme = {
  backgroundColor: string;
  borderTopColor: string;
  activeTintColor: string;
  inactiveTintColor: string;
  /** Optional row height tweak; default keeps current 60 + safe area. */
  minHeight?: number;
};

/**
 * Full theme skin pack: tokens, tab bar, Tier A screens, and cart chrome.
 */
export type ThemePack = {
  id: ThemeId;
  tokens: ThemeTokens;
  tabBar: TabBarTheme;
  screens: {
    Home: ComponentType;
    Shop: ComponentType;
    /** Product inner page (PDP). */
    ProductDetail: ComponentType;
    Highlights: ComponentType;
    ProfileHub: ComponentType;
    /** Optional; if omitted, route uses a token-shell of Locations. */
    Locations?: ComponentType;
  };
  CartChrome: ComponentType;
};

/** Ordered list of valid theme ids (cycle order for staff switcher). */
export const THEME_IDS: readonly ThemeId[] = ["classic", "atelier", "noir"] as const;

/** Default theme when storage is empty or invalid. */
export const DEFAULT_THEME_ID: ThemeId = "classic";

/** AsyncStorage key for persisted theme preference. */
export const THEME_STORAGE_KEY = "asf_theme";

/**
 * Type guard for values read from AsyncStorage.
 */
export function isThemeId(value: unknown): value is ThemeId {
  return value === "classic" || value === "atelier" || value === "noir";
}
