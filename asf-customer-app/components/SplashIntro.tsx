import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { hapticLight } from "@/lib/haptics";

/** Bundled letter-cascade splash (Variation 7). Regenerate via `npm run build:splash`. */
const SPLASH_HTML_ASSET = require("@/assets/splash/intro/splash-intro.html");

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

export type SplashIntroTheme = "light" | "dark";

export interface SplashIntroProps {
  /** Called when the intro animation finishes (or is skipped for reduced motion). */
  onComplete: () => void;
  /** Override system theme for the logo colours. */
  theme?: SplashIntroTheme;
}

/**
 * Full-screen WebView that plays the MODEL MATCH letter-cascade splash once.
 * Hides the native Expo splash when the WebView is ready.
 */
export function SplashIntro({ onComplete, theme }: SplashIntroProps): ReactElement {
  // Intentionally ignore the device colour scheme: the app shell is a light
  // (white) experience, so the splash is forced to light to avoid a black
  // "video box" flash before hand-off. Pass `theme` explicitly to override.
  const resolvedTheme: SplashIntroTheme = theme ?? "light";

  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [webReady, setWebReady] = useState(false);
  const completedRef = useRef(false);
  const holdScheduledRef = useRef(false);
  const fadeHapticFiredRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  const backgroundColor = resolvedTheme === "dark" ? "#000000" : "#ffffff";

  const finishIntro = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
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
  }, [onComplete, opacity]);

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

  /** Seed theme before HTML runs (Android file:// URLs may drop query params). */
  const themeBootstrapScript = useMemo(
    () =>
      `(function(){try{localStorage.setItem("p2m-splash-theme","${resolvedTheme}");document.documentElement.dataset.p2mTheme="${resolvedTheme}";}catch(e){}})();true;`,
    [resolvedTheme],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSplashAsset(): Promise<void> {
      try {
        const asset = Asset.fromModule(SPLASH_HTML_ASSET);
        await asset.downloadAsync();
        if (cancelled || asset.localUri === null || asset.localUri === undefined) {
          return;
        }
        const uri = `${asset.localUri}?theme=${resolvedTheme}`;
        setSourceUri(uri);
      } catch {
        finishIntro();
      }
    }

    void loadSplashAsset();

    return () => {
      cancelled = true;
    };
  }, [resolvedTheme, finishIntro]);

  useEffect(() => {
    if (!webReady) {
      return undefined;
    }
    const timeoutId = setTimeout(() => {
      finishIntro();
    }, SPLASH_DURATION_MS + SPLASH_HOLD_MS + 400 + SPLASH_EXTRA_HOLD_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [webReady, finishIntro]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as { type?: string };
        if (data.type === "p2m:complete") {
          scheduleFinishWithHold();
        }
      } catch {
        /* non-JSON messages ignored */
      }
    },
    [scheduleFinishWithHold],
  );

  const webViewSource = useMemo(() => {
    if (sourceUri === null) {
      return undefined;
    }
    return { uri: sourceUri };
  }, [sourceUri]);

  return (
    <Animated.View
      style={[styles.container, { backgroundColor, opacity }]}
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
            setWebReady(true);
            void SplashScreen.hideAsync();
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
