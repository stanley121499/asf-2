import "react-native-gesture-handler";
import "../global.css";

import { useRef } from "react";
import type { ReactElement } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { bootLog, resetBootClock } from "@/lib/bootLog";
import { installEarlyCrashLog } from "@/lib/earlyCrashLog";
import { startDevMemorySampling } from "@/lib/memoryLog";
import { preventNativeSplashAutoHide } from "@/lib/splashScreen";

/** New reload / Fast Refresh cycle — elapsed ms in `[boot]` logs restart here. */
resetBootClock();
bootLog("_layout module load");

/** __DEV__ only: ~5s heap samples for the first ~30s so Metro shows growth. */
startDevMemorySampling();

/** Catch fatals before providers mount; persist last reason for next open. */
installEarlyCrashLog();
preventNativeSplashAutoHide();
bootLog("_layout module eval complete — awaiting RootLayout render");

type AppRootComponent = () => ReactElement;

/** Cached after first RootLayout render so Fast Refresh does not re-require. */
let cachedAppRoot: AppRootComponent | null = null;

/**
 * Sync-requires the heavy fonts/providers/shell graph only when React actually
 * invokes RootLayout — not while expo-router walks the rest of `app/` during
 * cold-reload route-tree setup.
 */
function getAppRoot(): AppRootComponent {
  if (cachedAppRoot !== null) {
    return cachedAppRoot;
  }

  bootLog("AppRoot require start");
  const startedAt = Date.now();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferred past route-tree walk
    const mod = require("@/components/AppRoot") as {
      AppRoot?: AppRootComponent;
    };
    const candidate = mod.AppRoot;
    if (typeof candidate !== "function") {
      throw new Error("AppRoot export missing");
    }
    bootLog(`AppRoot require done (+${String(Date.now() - startedAt)}ms)`);
    cachedAppRoot = candidate;
    return candidate;
  } catch (err) {
    bootLog(
      "AppRoot require failed",
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}

/**
 * Thin root layout: splash + boot clock only.
 *
 * Heavy work (Providers, fonts, AppShell, Stack) lives in `components/AppRoot`
 * and is required on first render. Combined with expo-router `asyncRoutes`,
 * this avoids the ~14s silent gap where DEV sync mode eagerly `loadRoute()`s
 * every file under `app/` before React can call RootLayout.
 */
export default function RootLayout(): ReactElement {
  const loggedRenderRef = useRef(false);

  /** Sync breadcrumb before any child work / deferred requires. */
  if (!loggedRenderRef.current) {
    loggedRenderRef.current = true;
    bootLog("RootLayout render (sync)");
  }

  const AppRoot = getAppRoot();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppRoot />
    </GestureHandlerRootView>
  );
}
