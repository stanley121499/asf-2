import * as SplashScreen from "expo-splash-screen";

let preventCalled = false;

/**
 * Keep the native Expo splash visible until the animated intro WebView is ready.
 */
export function preventNativeSplashAutoHide(): void {
  if (preventCalled) {
    return;
  }
  preventCalled = true;
  void SplashScreen.preventAutoHideAsync().catch(() => {
    /* noop — already prevented or unsupported */
  });
}
