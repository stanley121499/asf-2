import * as SplashScreen from "expo-splash-screen";

import { bootLog } from "@/lib/bootLog";

/**
 * Expo Asset type shape used by splash preload (avoids a cold-start import of
 * `expo-asset`, which calls `requireNativeModule("ExpoAsset")` at module eval
 * and redboxes with `[runtime not ready]` on Expo Go / Hermes before native
 * modules are registered).
 */
type SplashAsset = {
  localUri: string | null;
  uri: string;
  downloadAsync: () => Promise<SplashAsset | null | undefined>;
};

/**
 * Minimal `expo-asset` surface needed for splash HTML resolution.
 */
type ExpoAssetModule = {
  Asset: {
    fromModule: (moduleId: number) => SplashAsset;
  };
};

/** Bundled letter-cascade splash (Variation 7). Regenerate via `npm run build:splash`. */
const SPLASH_HTML_ASSET = require("@/assets/splash/intro/splash-intro.html") as number;

/**
 * Cap how long boot waits on `Asset.downloadAsync`. Expo Go Android can take
 * ~10s packing the HTML over Metro; SplashIntro soft-skips if we return null.
 */
const SPLASH_ASSET_DOWNLOAD_TIMEOUT_MS = 500;

let preventCalled = false;
let preloadPromise: Promise<string | null> | null = null;

/**
 * Lazily loads `expo-asset` so `_layout` → `preventNativeSplashAutoHide` never
 * touches `requireNativeModule("ExpoAsset")` during cold-start module eval.
 *
 * @returns The expo-asset module, or null when the native module is unavailable
 */
function loadExpoAsset(): ExpoAssetModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional deferred require past runtime-ready
    const mod = require("expo-asset") as ExpoAssetModule;
    if (typeof mod.Asset?.fromModule !== "function") {
      return null;
    }
    return mod;
  } catch (err) {
    bootLog(
      "expo-asset unavailable",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Builds the WebView URI from a resolved asset path, appending the theme query.
 *
 * @param fileUri - Local or Metro URI for the splash HTML
 * @param theme - Splash colour scheme query param (`light` | `dark`)
 */
function withThemeQuery(fileUri: string, theme: "light" | "dark"): string {
  const separator = fileUri.includes("?") ? "&" : "?";
  return `${fileUri}${separator}theme=${theme}`;
}

/**
 * Resolves a usable URI without awaiting a slow download when Expo already
 * stamped `localUri` / `uri` on the module asset.
 *
 * @param asset - Expo Asset for the splash HTML
 */
function resolvedAssetUri(asset: SplashAsset): string | null {
  if (typeof asset.localUri === "string" && asset.localUri.length > 0) {
    return asset.localUri;
  }
  if (typeof asset.uri === "string" && asset.uri.length > 0) {
    return asset.uri;
  }
  return null;
}

/**
 * Races `downloadAsync` against a short timeout so Expo Go never blocks boot
 * for multi-second Metro asset packing.
 *
 * @param asset - Expo Asset to download into the local cache
 */
async function downloadWithTimeout(asset: SplashAsset): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const downloaded: boolean = await Promise.race([
      asset.downloadAsync().then((): boolean => true),
      new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(false);
        }, SPLASH_ASSET_DOWNLOAD_TIMEOUT_MS);
      }),
    ]);
    return downloaded;
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Resolve the bundled splash HTML asset to a URI for the WebView.
 * Cached after the first attempt. Never blocks the cold-start critical path —
 * callers must not await this before first paint / Providers mount.
 *
 * Strategy (fast → slow):
 * 1. Reuse an already-resolved `localUri` / `uri`
 * 2. Attempt `downloadAsync` with a 500ms cap
 * 3. Fall back to Metro `uri` if download timed out (Expo Go WebView can load it)
 * 4. Return null so SplashIntro soft-skips
 *
 * @param theme - Splash colour scheme query param (`light` | `dark`)
 */
export function preloadSplashIntroAsset(
  theme: "light" | "dark" = "light",
): Promise<string | null> {
  if (preloadPromise !== null) {
    bootLog("splash asset preload cache hit");
    return preloadPromise;
  }

  bootLog("splash asset preload start");
  preloadPromise = (async (): Promise<string | null> => {
    try {
      const expoAsset = loadExpoAsset();
      if (expoAsset === null) {
        bootLog("splash asset preload skipped (expo-asset native missing)");
        return null;
      }

      const asset = expoAsset.Asset.fromModule(SPLASH_HTML_ASSET);
      const existing = resolvedAssetUri(asset);
      if (existing !== null) {
        bootLog("splash asset preload done (cached uri)");
        return withThemeQuery(existing, theme);
      }

      const downloaded = await downloadWithTimeout(asset);
      if (!downloaded) {
        bootLog(
          `splash asset preload timed out after ${SPLASH_ASSET_DOWNLOAD_TIMEOUT_MS}ms`,
        );
        const fallback = resolvedAssetUri(asset);
        if (fallback !== null) {
          bootLog("splash asset preload using Metro uri fallback");
          return withThemeQuery(fallback, theme);
        }
        return null;
      }

      const afterDownload = resolvedAssetUri(asset);
      if (afterDownload === null) {
        bootLog("splash asset preload returned null uri");
        return null;
      }
      bootLog("splash asset preload done");
      return withThemeQuery(afterDownload, theme);
    } catch (err) {
      bootLog(
        "splash asset preload failed",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  })();

  return preloadPromise;
}

/**
 * Keep the native Expo splash visible until the animated intro WebView is ready.
 *
 * Intentionally does **not** kick off `Asset.downloadAsync` here — on Expo Go
 * Android that call can monopolize the JS bridge for ~10s and delay Providers
 * mount. SplashIntro loads the HTML URI when it mounts instead.
 */
export function preventNativeSplashAutoHide(): void {
  if (preventCalled) {
    return;
  }
  preventCalled = true;
  bootLog("SplashScreen.preventAutoHideAsync");
  void SplashScreen.preventAutoHideAsync().catch(() => {
    /* noop — already prevented or unsupported */
  });
  bootLog("splash asset early preload skipped (deferred to SplashIntro)");
}
