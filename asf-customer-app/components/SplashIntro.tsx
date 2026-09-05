import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

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

/** Fallback if the WebView never posts {@link P2M_READY_MESSAGE}. */
const NATIVE_SPLASH_FALLBACK_HIDE_MS = 3000;

/** White surface — matches native splash + forced light HTML embed. */
const SPLASH_SURFACE = "#ffffff";

/** WebView message fired after the first painted animation frame. */
const P2M_READY_MESSAGE = "p2m:ready";

export type SplashIntroTheme = "light" | "dark";

export interface SplashIntroProps {
  /** Called when the intro animation finishes (or is skipped for reduced motion). */
  onComplete: () => void;
  /** Override system theme for the logo colours. */
  theme?: SplashIntroTheme;
}

/**
 * Full-screen WebView that plays the MODEL MATCH letter-cascade splash once.
 * Keeps the native Expo splash visible until the WebView posts `p2m:ready`.
 */
export function SplashIntro({ onComplete, theme }: SplashIntroProps): ReactElement {
  // Intentionally ignore the device colour scheme: the app shell is a light
  // (white) experience, so the splash is forced to light to avoid a black
  // "video box" flash before hand-off. Pass `theme` explicitly to override.
  const resolvedTheme: SplashIntroTheme = theme ?? "light";

  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [webLoaded, setWebLoaded] = useState(false);
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
    void SplashScreen.hideAsync();
  }, []);

  const finishIntro = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    hideNativeSplash();
    // Light bridge haptic once when fade-out starts (not per-frame).
    if (!fadeHapticFiredRef.current) {
      fadeHapticFiredRef.current = true;
      void hapticLight();
    }
    // Fade the overlay out before unmounting so the home screen does not snap in.
    Animated.timing(opacity, {
      toValue: 0,
      duration: SPLASH_FADE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
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
   * Seed light theme and white surface before HTML runs.
   * Android file:// URLs may drop query params; inline CSS avoids the black WebView flash.
   */
  const themeBootstrapScript = useMemo(
    () =>
      `(function(){try{localStorage.setItem("p2m-splash-theme","${resolvedTheme}");document.documentElement.dataset.p2mTheme="${resolvedTheme}";document.documentElement.style.setProperty("--bg","${SPLASH_SURFACE}");document.documentElement.style.backgroundColor="${SPLASH_SURFACE}";if(document.body){document.body.style.backgroundColor="${SPLASH_SURFACE}";}}catch(e){}})();true;`,
    [resolvedTheme],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSplashAsset(): Promise<void> {
      const uri = await preloadSplashIntroAsset(resolvedTheme);
      if (cancelled) {
        return;
      }
      if (uri === null) {
        finishIntro();
        return;
      }
      setSourceUri(uri);
    }

    void loadSplashAsset();

    return () => {
      cancelled = true;
    };
  }, [resolvedTheme, finishIntro]);

  useEffect(() => {
    if (!webLoaded) {
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      finishIntro();
    }, SPLASH_DURATION_MS + SPLASH_HOLD_MS + 400 + SPLASH_EXTRA_HOLD_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [webLoaded, finishIntro]);

  /** Safety net: never leave the native splash stuck if `p2m:ready` is missed. */
  useEffect(() => {
    if (!webLoaded) {
      return undefined;
    }
    const fallbackHideId = setTimeout(() => {
      hideNativeSplash();
    }, NATIVE_SPLASH_FALLBACK_HIDE_MS);
    return () => {
      clearTimeout(fallbackHideId);
    };
  }, [webLoaded, hideNativeSplash]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as { type?: string };
        if (data.type === P2M_READY_MESSAGE) {
          hideNativeSplash();
          return;
        }
        if (data.type === "p2m:complete") {
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

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: SPLASH_SURFACE, opacity }]}
      accessibilityLabel="App intro"
    >
      {webViewSource !== undefined ? (
        <WebView
          source={webViewSource}
          style={styles.webview}
          containerStyle={styles.webview}
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
            finishIntro();
          }}
          onMessage={handleMessage}
        />
      ) : null}
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
