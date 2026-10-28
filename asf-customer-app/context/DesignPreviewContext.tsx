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

import {
  DEFAULT_HERO_VARIANT,
  DEFAULT_WELCOME_VARIANT,
  DESIGN_PREVIEW_HERO_KEY,
  DESIGN_PREVIEW_WELCOME_KEY,
  isHeroVariantId,
  isWelcomeVariantId,
  type HeroVariantId,
  type WelcomeVariantId,
} from "@/lib/designPreview";

type DesignPreviewContextValue = {
  heroVariant: HeroVariantId;
  welcomeVariant: WelcomeVariantId;
  setHeroVariant: (variant: HeroVariantId) => void;
  setWelcomeVariant: (variant: WelcomeVariantId) => void;
  /** True after the first AsyncStorage hydrate completes. */
  hydrated: boolean;
};

/**
 * Production defaults used when no provider is present (or Fast Refresh
 * temporarily splits context module identity). Setters are intentional no-ops
 * so Home / product-list / linked-products keep rendering instead of redboxing.
 *
 * IMPORTANT: This hook must NEVER throw. A prior throw + RootErrorBoundary
 * persistence left Stanley stuck on a stale redbox after the fix landed.
 */
const DESIGN_PREVIEW_FALLBACK: DesignPreviewContextValue = {
  heroVariant: DEFAULT_HERO_VARIANT,
  welcomeVariant: DEFAULT_WELCOME_VARIANT,
  setHeroVariant: (): void => {
    if (__DEV__) {
      console.warn(
        "[designPreview] setHeroVariant called outside DesignPreviewProvider",
      );
    }
  },
  setWelcomeVariant: (): void => {
    if (__DEV__) {
      console.warn(
        "[designPreview] setWelcomeVariant called outside DesignPreviewProvider",
      );
    }
  },
  hydrated: false,
};

/**
 * Default value is always the fallback object (never `undefined`), so
 * `useContext` cannot return a missing-provider signal that older code threw on.
 */
const DesignPreviewContext =
  createContext<DesignPreviewContextValue>(DESIGN_PREVIEW_FALLBACK);

/**
 * Loads the persisted hero variant, rewriting invalid values to the default.
 */
async function readStoredHeroVariant(): Promise<HeroVariantId> {
  try {
    const stored = await AsyncStorage.getItem(DESIGN_PREVIEW_HERO_KEY);
    if (isHeroVariantId(stored)) {
      return stored;
    }
    if (stored !== null) {
      await AsyncStorage.setItem(DESIGN_PREVIEW_HERO_KEY, DEFAULT_HERO_VARIANT);
    }
  } catch (error: unknown) {
    console.warn("[designPreview] Failed to read hero variant:", error);
  }
  return DEFAULT_HERO_VARIANT;
}

/**
 * Loads the persisted welcome variant, rewriting invalid values to the default.
 */
async function readStoredWelcomeVariant(): Promise<WelcomeVariantId> {
  try {
    const stored = await AsyncStorage.getItem(DESIGN_PREVIEW_WELCOME_KEY);
    if (isWelcomeVariantId(stored)) {
      return stored;
    }
    if (stored !== null) {
      await AsyncStorage.setItem(
        DESIGN_PREVIEW_WELCOME_KEY,
        DEFAULT_WELCOME_VARIANT,
      );
    }
  } catch (error: unknown) {
    console.warn("[designPreview] Failed to read welcome variant:", error);
  }
  return DEFAULT_WELCOME_VARIANT;
}

/**
 * Provides staff Design Lab preview selections (Home hero + store welcome).
 * Persists to AsyncStorage keys `asf_design_preview_hero` and
 * `asf_design_preview_welcome`. Defaults leave production behavior unchanged.
 */
export function DesignPreviewProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  const [heroVariant, setHeroVariantState] =
    useState<HeroVariantId>(DEFAULT_HERO_VARIANT);
  const [welcomeVariant, setWelcomeVariantState] =
    useState<WelcomeVariantId>(DEFAULT_WELCOME_VARIANT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const hydrate = async (): Promise<void> => {
      const [nextHero, nextWelcome] = await Promise.all([
        readStoredHeroVariant(),
        readStoredWelcomeVariant(),
      ]);
      if (!isActive) {
        return;
      }
      setHeroVariantState(nextHero);
      setWelcomeVariantState(nextWelcome);
      setHydrated(true);
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  /**
   * Updates the Home hero preview variant and persists immediately.
   */
  const setHeroVariant = useCallback((next: HeroVariantId): void => {
    setHeroVariantState(next);
    void AsyncStorage.setItem(DESIGN_PREVIEW_HERO_KEY, next).catch(
      (error: unknown) => {
        console.warn("[designPreview] Failed to persist hero variant:", error);
      },
    );
  }, []);

  /**
   * Updates the store-welcome preview variant and persists immediately.
   */
  const setWelcomeVariant = useCallback((next: WelcomeVariantId): void => {
    setWelcomeVariantState(next);
    void AsyncStorage.setItem(DESIGN_PREVIEW_WELCOME_KEY, next).catch(
      (error: unknown) => {
        console.warn(
          "[designPreview] Failed to persist welcome variant:",
          error,
        );
      },
    );
  }, []);

  const activeHero = hydrated ? heroVariant : DEFAULT_HERO_VARIANT;
  const activeWelcome = hydrated ? welcomeVariant : DEFAULT_WELCOME_VARIANT;

  const value = useMemo<DesignPreviewContextValue>(
    () => ({
      heroVariant: activeHero,
      welcomeVariant: activeWelcome,
      setHeroVariant,
      setWelcomeVariant,
      hydrated,
    }),
    [activeHero, activeWelcome, setHeroVariant, setWelcomeVariant, hydrated],
  );

  return (
    <DesignPreviewContext.Provider value={value}>
      {children}
    </DesignPreviewContext.Provider>
  );
}

/**
 * True when the context value looks like a real provider payload (not missing /
 * malformed after a Fast Refresh identity split).
 */
function isDesignPreviewValue(
  value: DesignPreviewContextValue | null | undefined,
): value is DesignPreviewContextValue {
  if (value === null || value === undefined) {
    return false;
  }
  return (
    typeof value.heroVariant === "string" &&
    typeof value.welcomeVariant === "string" &&
    typeof value.setHeroVariant === "function" &&
    typeof value.setWelcomeVariant === "function" &&
    typeof value.hydrated === "boolean"
  );
}

/**
 * Hook to read / write Design Lab preview selections.
 *
 * Prefer use inside {@link DesignPreviewProvider}. Never throws — always returns
 * production defaults if the provider is missing or Fast Refresh splits the
 * context module identity. Optional `__DEV__` warn only.
 */
export function useDesignPreview(): DesignPreviewContextValue {
  // Never throw: older builds threw when `context === undefined`. That message
  // was persisted by RootErrorBoundary and kept blocking Expo Go after reloads.
  const context = useContext(DesignPreviewContext);

  if (!isDesignPreviewValue(context)) {
    if (__DEV__) {
      console.warn(
        "[designPreview] missing DesignPreviewProvider — using production defaults",
      );
    }
    return DESIGN_PREVIEW_FALLBACK;
  }

  return context;
}
