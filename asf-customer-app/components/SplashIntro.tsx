import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactElement } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { bootLog } from "@/lib/bootLog";
import { isExpoGoRuntime } from "@/lib/expoRuntime";
import { hapticLight } from "@/lib/haptics";
import { preloadSplashIntroAsset } from "@/lib/splashScreen";

/**
 * Effective animation length in ms after the mobile playback-rate slow-down.
 * Base cascade is 1500ms played at 0.5x ≈ 3000ms (see splash-intro.html).
 */
const SPLASH_DURATION_MS = 3000;

/** Extra hold after the last keyframe before handing off to the app. */
const SPLASH_HOLD_MS = 120;

/**
 * Additional dwell time the finished logo is held on screen before hand-off.
 * Applied to both completion paths (the WebView "complete" message and the
 * timeout fallback) so the splash always lingers this much longer.
 */
const SPLASH_EXTRA_HOLD_MS = 2000;

/** Cross-fade length when dismissing the splash overlay into the app. */
const SPLASH_FADE_MS = 450;

/**
 * Hide the native Expo splash even if the WebView never posts `p2m:ready`
 * (common when file:// HTML stalls on some Android WebViews).
 */
const NATIVE_SPLASH_SOFT_HIDE_MS = 2500;

/**
 * Soft-skip the custom intro and enter the app when WebView never loads or
 * never finishes — keeps a blank overlay from blocking home indefinitely.
 */
const SPLASH_SOFT_SKIP_MS = 4000;

/** White surface — matches native splash + forced light HTML embed. */
const SPLASH_SURFACE = "#ffffff";

/** WebView message fired after the first painted animation frame. */
const P2M_READY_MESSAGE = "p2m:ready";

/**
 * Expo Go cannot reliably host the HTML WebView ceremony (missing / stub native
 * binary). Skip the intro instantly — no soft-timeout wait, no fade, no asset
 * download. Dev builds and release APKs still play the full ceremony.
 *
 * Prefer {@link shouldSkipSplashCeremony} at call sites: a frozen module const
 * can lie across Fast Refresh if Constants were unread when the module first
 * evaluated. AppShell also skips Expo Go before this file is ever required.
 */
function shouldSkipSplashCeremony(): boolean {
  return isExpoGoRuntime();
}

export type SplashIntroTheme = "light" | "dark";

export interface SplashIntroProps {
  /** Called when the intro animation finishes (or is skipped for reduced motion). */
  onComplete: () => void;
  /** Override system theme for the logo colours. */
  theme?: SplashIntroTheme;
}

type WebViewMessageEvent = {
  nativeEvent: {
    data: string;
  };
};

type WebViewProps = {
  source: { uri: string };
  style: object;
  containerStyle: object;
  pointerEvents: "none";
  scrollEnabled: boolean;
  bounces: boolean;
  overScrollMode: "never";
  showsHorizontalScrollIndicator: boolean;
  showsVerticalScrollIndicator: boolean;
  originWhitelist: string[];
  allowFileAccess: boolean;
  allowFileAccessFromFileURLs: boolean;
  javaScriptEnabled: boolean;
  domStorageEnabled: boolean;
  injectedJavaScriptBeforeContentLoaded: string;
  onLoadEnd: () => void;
  onError: () => void;
  onHttpError?: () => void;
  onMessage: (event: WebViewMessageEvent) => void;
};

type WebViewModuleShape = {
  WebView?: ComponentType<WebViewProps>;
  default?: ComponentType<WebViewProps>;
};

/**
 * Lazily loads `react-native-webview` so a missing native binary cannot crash
 * splash mount — we skip straight into the app instead.
 */
function loadWebViewComponent(): ComponentType<WebViewProps> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional soft-fail require
    const mod: WebViewModuleShape = require("react-native-webview");
    if (typeof mod.WebView === "function") {
      return mod.WebView;
    }
    if (typeof mod.default === "function") {
      return mod.default;
    }
    return null;
  } catch (err) {
    console.warn(
      "[splash] react-native-webview unavailable",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Full-screen WebView that plays the MODEL MATCH letter-cascade splash once.
 * Keeps the native Expo splash visible until the WebView posts `p2m:ready`.
 * Soft-fails (skips intro) when WebView or the HTML asset is unavailable,
 * and always soft-skips within {@link SPLASH_SOFT_SKIP_MS} if the WebView hangs.
 * Expo Go skips the ceremony entirely on the first layout pass.
 */
export function SplashIntro({ onComplete, theme }: SplashIntroProps): ReactElement | null {
  // Intentionally ignore the device colour scheme: the app shell is a light
  // (white) experience, so the splash is forced to light to avoid a black
  // "video box" flash before hand-off. Pass `theme` explicitly to override.
  const resolvedTheme: SplashIntroTheme = theme ?? "light";

  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [webLoaded, setWebLoaded] = useState(false);
  const [WebViewComponent, setWebViewComponent] = useState<ComponentType<WebViewProps> | null>(
    null,
  );
  const skipCeremony = shouldSkipSplashCeremony();
  /** False on Expo Go from first render so we never paint a blank white overlay. */
  const [showOverlay, setShowOverlay] = useState(() => !skipCeremony);
  const completedRef = useRef(false);
  const nativeSplashHiddenRef = useRef(false);
  const holdScheduledRef = useRef(false);
  const fadeHapticFiredRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  const hideNativeSplash = useCallback(() => {
    if (nativeSplashHiddenRef.current) {
      return;
    }
    nativeSplashHiddenRef.current = true;
    bootLog("SplashScreen.hideAsync (milestone)");
    void SplashScreen.hideAsync().catch(() => {
      /* already hidden or unsupported */
    });
  }, []);

  /**
   * Instant hand-off used when the ceremony cannot run (Expo Go / missing
   * WebView / asset failure). No fade, no extra hold, no haptic — home must
   * become visible on the same tick as the skip decision.
   */
  const skipIntroImmediately = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    setShowOverlay(false);
    bootLog("SplashIntro done (milestone)");
    hideNativeSplash();
    onComplete();
  }, [hideNativeSplash, onComplete]);

  /**
   * Ceremony completion: fade the overlay out before unmounting so a healthy
   * intro does not snap into home.
   */
  const finishIntro = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    bootLog("SplashIntro done (milestone)");
    hideNativeSplash();
    // Light bridge haptic once when fade-out starts (not per-frame).
    if (!fadeHapticFiredRef.current) {
      fadeHapticFiredRef.current = true;
      void hapticLight();
    }
    Animated.timing(opacity, {
      toValue: 0,
      duration: SPLASH_FADE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowOverlay(false);
        onComplete();
      }
    });
  }, [hideNativeSplash, onComplete, opacity]);

  /**
   * Holds the finished logo for {@link SPLASH_EXTRA_HOLD_MS} before fading out.
   * Guarded so repeated triggers (e.g. duplicate WebView messages) schedule the
   * hand-off only once.
   */
  const scheduleFinishWithHold = useCallback(() => {
    if (holdScheduledRef.current) {
      return;
    }
    holdScheduledRef.current = true;
    holdTimerRef.current = setTimeout(() => {
      finishIntro();
    }, SPLASH_EXTRA_HOLD_MS);
  }, [finishIntro]);

  // Clear any pending hold timer on unmount.
  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  /**
   * Resolve skip vs ceremony before paint. Expo Go and missing WebView call
   * {@link skipIntroImmediately} so AppShell is never blocked by soft timers.
   */
  useLayoutEffect(() => {
    bootLog("SplashIntro mount");

    if (skipCeremony) {
      bootLog("SplashIntro Expo Go — instant skip");
      skipIntroImmediately();
      return;
    }

    const loaded = loadWebViewComponent();
    if (loaded === null) {
      bootLog("SplashIntro WebView missing — skip");
      skipIntroImmediately();
      return;
    }

    bootLog("SplashIntro WebView ready");
    setWebViewComponent(() => loaded);
  }, [skipCeremony, skipIntroImmediately]);

  /**
   * Soft-skip only while the ceremony WebView is stuck (never `onLoadEnd`).
   * Skipped entirely on Expo Go / missing-WebView paths.
   */
  useEffect(() => {
    if (skipCeremony || WebViewComponent === null || webLoaded) {
      return undefined;
    }
    const softSkipId = setTimeout(() => {
      bootLog("SplashIntro soft-skip timeout");
      skipIntroImmediately();
    }, SPLASH_SOFT_SKIP_MS);
    return () => {
      clearTimeout(softSkipId);
    };
  }, [skipCeremony, webLoaded, WebViewComponent, skipIntroImmediately]);

  /**
   * Always peel the native icon splash after a short wait during ceremony —
   * do not gate on WebView `onLoadEnd` / `p2m:ready`.
   */
  useEffect(() => {
    if (skipCeremony || WebViewComponent === null) {
      return undefined;
    }
    const softHideId = setTimeout(() => {
      bootLog("SplashScreen.hideAsync (soft timeout)");
      hideNativeSplash();
    }, NATIVE_SPLASH_SOFT_HIDE_MS);
    return () => {
      clearTimeout(softHideId);
    };
  }, [skipCeremony, hideNativeSplash, WebViewComponent]);

  /**
   * Seed light theme and white surface before HTML runs.
   * Android file:// URLs may drop query params; inline CSS avoids the black WebView flash.
   */
  const themeBootstrapScript = useMemo(
    () =>
      `(function(){try{localStorage.setItem("p2m-splash-theme","${resolvedTheme}");document.documentElement.dataset.p2mTheme="${resolvedTheme}";document.documentElement.style.setProperty("--bg","${SPLASH_SURFACE}");document.documentElement.style.backgroundColor="${SPLASH_SURFACE}";if(document.body){document.body.style.backgroundColor="${SPLASH_SURFACE}";}}catch(e){}})();true;`,
    [resolvedTheme],
  );

  /**
   * Load the splash HTML only when a real WebView will play it — never on the
   * Expo Go / missing-WebView instant-skip paths.
   */
  useEffect(() => {
    if (skipCeremony || WebViewComponent === null) {
      return undefined;
    }

    let cancelled = false;

    async function loadSplashAsset(): Promise<void> {
      try {
        const uri = await preloadSplashIntroAsset(resolvedTheme);
        if (cancelled) {
          return;
        }
        if (uri === null) {
          bootLog("SplashIntro asset null — skip");
          skipIntroImmediately();
          return;
        }
        bootLog("SplashIntro asset uri set");
        setSourceUri(uri);
      } catch (err) {
        console.warn(
          "[splash] asset preload soft-failed",
          err instanceof Error ? err.message : err,
        );
        if (!cancelled) {
          skipIntroImmediately();
        }
      }
    }

    void loadSplashAsset();

    return () => {
      cancelled = true;
    };
  }, [skipCeremony, resolvedTheme, skipIntroImmediately, WebViewComponent]);

  useEffect(() => {
    if (!webLoaded) {
      return undefined;
    }
    bootLog("SplashIntro WebView onLoadEnd — animation timer started");
    const timeoutId = setTimeout(() => {
      finishIntro();
    }, SPLASH_DURATION_MS + SPLASH_HOLD_MS + 400 + SPLASH_EXTRA_HOLD_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [webLoaded, finishIntro]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const parsed: unknown = JSON.parse(event.nativeEvent.data);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          return;
        }
        const typeValue = Reflect.get(parsed, "type");
        if (typeValue === P2M_READY_MESSAGE) {
          bootLog("SplashIntro p2m:ready");
          hideNativeSplash();
          return;
        }
        if (typeValue === "p2m:complete") {
          bootLog("SplashIntro p2m:complete");
          scheduleFinishWithHold();
        }
      } catch {
        /* non-JSON messages ignored */
      }
    },
    [hideNativeSplash, scheduleFinishWithHold],
  );

  const webViewSource = useMemo(() => {
    if (sourceUri === null) {
      return undefined;
    }
    return { uri: sourceUri };
  }, [sourceUri]);

  if (!showOverlay) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: SPLASH_SURFACE, opacity }]}
      accessibilityLabel="App intro"
    >
      {WebViewComponent !== null && webViewSource !== undefined ? (
        <WebViewComponent
          source={webViewSource}
          style={styles.webview}
          containerStyle={styles.webview}
          /**
           * Block touches so preview HTML click→replay handlers cannot restart
           * playback. Parent overlay still fills the screen and absorbs taps.
           */
          pointerEvents="none"
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={["*"]}
          allowFileAccess
          allowFileAccessFromFileURLs
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScriptBeforeContentLoaded={themeBootstrapScript}
          onLoadEnd={() => {
            setWebLoaded(true);
          }}
          onError={() => {
            bootLog("SplashIntro WebView onError — skip");
            skipIntroImmediately();
          }}
          onHttpError={() => {
            bootLog("SplashIntro WebView onHttpError — skip");
            skipIntroImmediately();
          }}
          onMessage={handleMessage}
        />
      ) : (
        <View style={[styles.webview, { backgroundColor: SPLASH_SURFACE }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  webview: {
    flex: 1,
    backgroundColor: SPLASH_SURFACE,
  },
});
