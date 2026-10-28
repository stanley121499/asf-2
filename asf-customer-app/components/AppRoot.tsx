/**
 * Deferred app shell loaded from root `_layout` on first RootLayout render.
 *
 * Kept out of `app/_layout.tsx` so Metro / expo-router can finish the root
 * layout module (splash + boot clock) without pulling Google Fonts, Providers,
 * or AppShell chrome into the pre-render require graph.
 */

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
/**
 * `expo-status-bar` only — not the Metro / Expo Go bottom-left “Bundling…”
 * DevLoadingView. That chrome is injected by Expo’s DEV runtime
 * (`react-native/Libraries/Utilities/DevLoadingView` via Metro HMR) and is
 * stripped from release / production APKs. There is no supported app-level
 * switch to hide it without patching Expo (would risk breaking Fast Refresh).
 */
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ComponentType, ReactElement } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { AppProviders } from "@/components/Providers";
import { NavigationPerfProbe } from "@/components/NavigationPerfProbe";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { useFeatureFlags } from "@/context/FeatureFlagsContext";
import { useTranslation } from "@/context/LocaleContext";
import { useThemeTokens } from "@/context/ThemeContext";
import { colors } from "@/constants/theme";
import { bootLog } from "@/lib/bootLog";
import { isExpoGoRuntime } from "@/lib/expoRuntime";
import { motion } from "@/lib/motion";

/**
 * Max wait for Google Fonts before proceeding with system fallbacks.
 * Only applies to dev builds / APK — Expo Go skips downloads entirely (0ms).
 */
const FONT_LOAD_TIMEOUT_MS = 2500;

/**
 * Expo Go (esp. Android) can stall for tens of seconds on Google Fonts CDN.
 * Skip remote font download and use system fallbacks so AppShell mounts immediately.
 */
const SKIP_GOOGLE_FONTS = isExpoGoRuntime();

/**
 * Absolute safety net: never leave the native Expo splash forever if SplashIntro
 * fails to mount (fonts hang, provider crash, etc.).
 */
const NATIVE_SPLASH_ROOT_SAFETY_MS = 4000;

type SplashIntroProps = {
  onComplete: () => void;
};

type GuideModule = {
  GuideProvider: ComponentType<{ children: React.ReactNode }>;
  GuideOverlay: ComponentType;
};

type GoogleFontMap = Record<string, number>;

/** Stable empty map for Expo Go so `useFonts` does not see a new object each render. */
const EMPTY_FONT_MAP: GoogleFontMap = {};

/** Cached font asset map so `useFonts` sees a stable reference across renders. */
let cachedGoogleFontMap: GoogleFontMap | null = null;

/**
 * Lazily requires Playfair + Inter Regular only when not on Expo Go. Avoids the
 * package root barrel (every weight ≈ multi-MB) and skips Metro TTF transfer on
 * Expo Go entirely when `SKIP_GOOGLE_FONTS` is set.
 */
function getGoogleFontMap(): GoogleFontMap {
  if (SKIP_GOOGLE_FONTS) {
    return EMPTY_FONT_MAP;
  }
  if (cachedGoogleFontMap !== null) {
    return cachedGoogleFontMap;
  }

  bootLog("google fonts require start");
  const startedAt = Date.now();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- single-weight paths only
    const interMod = require("@expo-google-fonts/inter/400Regular") as {
      Inter_400Regular?: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- single-weight paths only
    const playfairMod = require("@expo-google-fonts/playfair-display/400Regular") as {
      PlayfairDisplay_400Regular?: number;
    };
    const inter = interMod.Inter_400Regular;
    const playfair = playfairMod.PlayfairDisplay_400Regular;
    if (typeof inter !== "number" || typeof playfair !== "number") {
      bootLog("google fonts require missing export — using empty map");
      cachedGoogleFontMap = EMPTY_FONT_MAP;
      return cachedGoogleFontMap;
    }
    bootLog(`google fonts require done (+${String(Date.now() - startedAt)}ms)`);
    cachedGoogleFontMap = {
      PlayfairDisplay_400Regular: playfair,
      Inter_400Regular: inter,
    };
    return cachedGoogleFontMap;
  } catch (err) {
    bootLog(
      "google fonts require failed",
      err instanceof Error ? err.message : err,
    );
    cachedGoogleFontMap = EMPTY_FONT_MAP;
    return cachedGoogleFontMap;
  }
}

/**
 * Lazy-requires shell chrome that is not needed until AppShell paints.
 * Keeps AppRoot evaluation off AlertBanner / Guide / SplashIntro /
 * NavigationSync (and their transitive native deps).
 */
function useDeferredAppShellChrome(): {
  AlertBanner: ComponentType | null;
  GuideProvider: GuideModule["GuideProvider"] | null;
  GuideOverlay: GuideModule["GuideOverlay"] | null;
  NavigationSync: ComponentType | null;
  SplashIntro: ComponentType<SplashIntroProps> | null;
} {
  const [AlertBanner, setAlertBanner] = useState<ComponentType | null>(null);
  const [GuideProvider, setGuideProvider] = useState<
    GuideModule["GuideProvider"] | null
  >(null);
  const [GuideOverlay, setGuideOverlay] = useState<
    GuideModule["GuideOverlay"] | null
  >(null);
  const [NavigationSync, setNavigationSync] = useState<ComponentType | null>(
    null,
  );
  const [SplashIntro, setSplashIntro] = useState<
    ComponentType<SplashIntroProps> | null
  >(null);

  useEffect(() => {
    bootLog("AppShell chrome require start");
    const startedAt = Date.now();
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferred shell chrome
      const alertMod = require("@/components/AlertBanner") as {
        AlertBanner?: ComponentType;
      };
      const alertCandidate = alertMod.AlertBanner;
      if (typeof alertCandidate === "function") {
        setAlertBanner(() => alertCandidate);
      }
    } catch (err) {
      bootLog(
        "AlertBanner require failed",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferred shell chrome
      const guideMod = require("@/components/guide") as GuideModule;
      const guideProviderCandidate = guideMod.GuideProvider;
      const guideOverlayCandidate = guideMod.GuideOverlay;
      if (typeof guideProviderCandidate === "function") {
        setGuideProvider(() => guideProviderCandidate);
      }
      if (typeof guideOverlayCandidate === "function") {
        setGuideOverlay(() => guideOverlayCandidate);
      }
    } catch (err) {
      bootLog(
        "guide require failed",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferred shell chrome
      const navMod = require("@/components/NavigationSync") as {
        NavigationSync?: ComponentType;
      };
      const navCandidate = navMod.NavigationSync;
      if (typeof navCandidate === "function") {
        setNavigationSync(() => navCandidate);
      }
    } catch (err) {
      bootLog(
        "NavigationSync require failed",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferred shell chrome
      const splashMod = require("@/components/SplashIntro") as {
        SplashIntro?: ComponentType<SplashIntroProps>;
      };
      const splashCandidate = splashMod.SplashIntro;
      if (typeof splashCandidate === "function") {
        setSplashIntro(() => splashCandidate);
      }
    } catch (err) {
      bootLog(
        "SplashIntro require failed",
        err instanceof Error ? err.message : err,
      );
    }

    bootLog(
      `AppShell chrome require done (+${String(Date.now() - startedAt)}ms)`,
    );
  }, []);

  return {
    AlertBanner,
    GuideProvider,
    GuideOverlay,
    NavigationSync,
    SplashIntro,
  };
}

/**
 * Inner shell rendered inside AppProviders so it has access to all context hooks.
 * Checks the `maintenance` feature flag and shows a maintenance screen when on.
 */
function AppShell(): ReactElement {
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();
  const tokens = useThemeTokens();
  const [introComplete, setIntroComplete] = useState(false);
  const chrome = useDeferredAppShellChrome();

  const handleIntroComplete = useCallback(() => {
    bootLog("home visible (milestone)");
    setIntroComplete(true);
  }, []);

  useEffect(() => {
    bootLog("AppShell mount");
  }, []);

  useEffect(() => {
    if (isEnabled("maintenance")) {
      bootLog("maintenance mode — skipping SplashIntro");
      setIntroComplete(true);
      void SplashScreen.hideAsync().then(() => {
        bootLog("SplashScreen.hideAsync (maintenance)");
      });
    }
  }, [isEnabled]);

  if (isEnabled("maintenance")) {
    return (
      <SafeAreaProvider>
        <StatusBar style={tokens.statusBarStyle} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tokens.bg,
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontFamily: "PlayfairDisplay_400Regular",
              color: tokens.text,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {t("common.maintenanceTitle")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: tokens.muted,
              textAlign: "center",
            }}
          >
            {t("common.maintenanceBody")}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  const GuideProvider = chrome.GuideProvider;
  const GuideOverlay = chrome.GuideOverlay;
  const NavigationSync = chrome.NavigationSync;
  const AlertBanner = chrome.AlertBanner;
  const SplashIntro = chrome.SplashIntro;

  /**
   * Until deferred chrome modules resolve, keep a minimal safe-area shell so
   * Providers can stay mounted without blocking on Guide/Splash require graphs.
   */
  if (
    GuideProvider === null ||
    GuideOverlay === null ||
    NavigationSync === null ||
    AlertBanner === null
  ) {
    return (
      <SafeAreaProvider>
        <StatusBar style={tokens.statusBarStyle} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tokens.bg,
          }}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GuideProvider>
        <NavigationSync />
        <NavigationPerfProbe />
        <StatusBar style={tokens.statusBarStyle} />
        <AlertBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: motion.duration.base,
          }}
        >
          {/* Auth flow — softer fade + gentle rise, slightly longer. */}
          <Stack.Screen
            name="(auth)"
            options={{ animation: "fade_from_bottom", animationDuration: 320 }}
          />
          {/* Sheet-like layers rise from the bottom to read as modal surfaces. */}
          <Stack.Screen name="cart" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="wishlist" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="checkout" options={{ animation: "slide_from_bottom" }} />
        </Stack>
        <GuideOverlay />
        {!introComplete && SplashIntro !== null ? (
          <SplashIntro onComplete={handleIntroComplete} />
        ) : null}
      </GuideProvider>
    </SafeAreaProvider>
  );
}

/**
 * Lightweight placeholder while fonts resolve (non–Expo Go only).
 */
function FontsPendingSpinner(): ReactElement {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

bootLog("AppRoot module load");

/**
 * Fonts + providers + navigation shell. Mounted from thin root `_layout`
 * after expo-router invokes RootLayout (not during route-tree validation).
 */
export function AppRoot(): ReactElement {
  const loggedRenderRef = useRef(false);

  if (!loggedRenderRef.current) {
    loggedRenderRef.current = true;
    bootLog("AppRoot render (sync)");
  }

  /**
   * Empty map on Expo Go: `useFonts` resolves immediately with no CDN fetch.
   * Dev builds / APK still load Playfair + Inter, capped by FONT_LOAD_TIMEOUT_MS.
   */
  const [fontsLoaded, fontError] = useFonts(getGoogleFontMap());
  const [fontsTimedOut, setFontsTimedOut] = useState(false);

  useEffect(() => {
    bootLog("AppRoot mount");
    if (SKIP_GOOGLE_FONTS) {
      bootLog("fonts skipped (Expo Go) — system fallbacks, 0ms");
    }
  }, []);

  useEffect(() => {
    if (SKIP_GOOGLE_FONTS) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setFontsTimedOut((prev) => {
        if (!prev) {
          bootLog("fonts timed out — proceeding with system fallbacks");
        }
        return true;
      });
    }, FONT_LOAD_TIMEOUT_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (SKIP_GOOGLE_FONTS) {
      return;
    }
    if (fontsLoaded) {
      bootLog("fonts loaded");
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontError !== null && fontError !== undefined) {
      bootLog("fonts error — proceeding", fontError.message);
    }
  }, [fontError]);

  /** Last-resort hide so Expo Go never sits on the icon splash indefinitely. */
  useEffect(() => {
    const safetyId = setTimeout(() => {
      bootLog("SplashScreen.hideAsync (root safety)");
      void SplashScreen.hideAsync().catch(() => {
        /* already hidden or unsupported */
      });
    }, NATIVE_SPLASH_ROOT_SAFETY_MS);
    return () => {
      clearTimeout(safetyId);
    };
  }, []);

  const fontsReady =
    SKIP_GOOGLE_FONTS ||
    fontsLoaded ||
    fontsTimedOut ||
    (fontError !== null && fontError !== undefined);

  useEffect(() => {
    if (!fontsReady) {
      bootLog("fonts pending — spinner behind native splash");
      return;
    }
    if (!SKIP_GOOGLE_FONTS && fontsTimedOut && !fontsLoaded) {
      bootLog("fonts skipped");
      return;
    }
    bootLog("fonts ready — mounting AppShell (milestone)");
  }, [fontsReady, fontsTimedOut, fontsLoaded]);

  return (
    <RootErrorBoundary>
      <AppProviders>
        {fontsReady ? <AppShell /> : <FontsPendingSpinner />}
      </AppProviders>
    </RootErrorBoundary>
  );
}
