import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Static Expo config from `app.json` (safe defaults: no TaskManager plugin,
 * foreground-only location — matches the Sep 5 SDK 57 rollback binary shape).
 */
type AppJson = {
  expo: ExpoConfig;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo config loads JSON at eval time
const appJson = require("./app.json") as AppJson;

/**
 * Expo config plugin entry (string name or [name, options] tuple).
 */
type ExpoPluginEntry = NonNullable<ExpoConfig["plugins"]>[number];

/**
 * Foreground-only location plugin options (store distance / map — no Always / FGS).
 */
const LOCATION_FOREGROUND_ONLY = {
  locationWhenInUsePermission: "Allow ASF to show nearby stores and distance.",
} as const;

/**
 * Background Always + Android foreground-service options used only when nearby
 * native support is explicitly enabled for a rebuild.
 */
const LOCATION_WITH_NEARBY_BACKGROUND = {
  ...LOCATION_FOREGROUND_ONLY,
  locationAlwaysAndWhenInUsePermission:
    "Allow ASF to notify you when wishlist items are in stock at nearby stores.",
  locationAlwaysPermission:
    "Allow ASF to notify you when wishlist items are in stock at nearby stores.",
  isIosBackgroundLocationEnabled: true,
  isAndroidBackgroundLocationEnabled: true,
  isAndroidForegroundServiceEnabled: true,
} as const;

/**
 * Reads whether nearby native plugins should be linked into the binary.
 * Same contract as `NEARBY_STOCK_ALERTS_ENABLED` in JS: only exact `"true"`.
 *
 * @returns Whether TaskManager + background location config plugins are enabled
 */
function readNearbyNativePluginsEnabled(): boolean {
  const raw = (process.env.EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED ?? "")
    .trim()
    .toLowerCase();
  return raw === "true";
}

/**
 * Returns true when the plugin entry refers to `expo-location`.
 *
 * @param entry - Plugin string or tuple from Expo config
 */
function isExpoLocationPlugin(entry: ExpoPluginEntry): boolean {
  if (typeof entry === "string") {
    return entry === "expo-location";
  }
  if (Array.isArray(entry) && typeof entry[0] === "string") {
    return entry[0] === "expo-location";
  }
  return false;
}

/**
 * Returns true when the plugin entry refers to `expo-task-manager`.
 *
 * @param entry - Plugin string or tuple from Expo config
 */
function isExpoTaskManagerPlugin(entry: ExpoPluginEntry): boolean {
  if (typeof entry === "string") {
    return entry === "expo-task-manager";
  }
  if (Array.isArray(entry) && typeof entry[0] === "string") {
    return entry[0] === "expo-task-manager";
  }
  return false;
}

/**
 * Builds the plugins array with location / TaskManager gated on the nearby flag.
 * Default (flag unset/false) strips background location FGS + TaskManager so the
 * next APK native fingerprint can match the known-good Sep 5 shape for those
 * pieces — JS kill-switches alone cannot unlink plugins already baked in.
 *
 * Re-enable only after `expo-task-manager` is back in package.json (`npx expo
 * install expo-task-manager`); otherwise the plugin name alone will not link
 * native code and nearby background registration will soft-fail.
 *
 * @param basePlugins - Plugins from `app.json`
 * @param nearbyNativeEnabled - Whether to link nearby background native support
 * @returns Plugins safe for cold start when nearby is off
 */
function buildPlugins(
  basePlugins: ExpoPluginEntry[] | undefined,
  nearbyNativeEnabled: boolean,
): ExpoPluginEntry[] {
  const withoutNearbyNative = (basePlugins ?? []).filter(
    (entry) => !isExpoTaskManagerPlugin(entry),
  );

  const withLocation: ExpoPluginEntry[] = withoutNearbyNative.map((entry) => {
    if (!isExpoLocationPlugin(entry)) {
      return entry;
    }
    return [
      "expo-location",
      nearbyNativeEnabled
        ? { ...LOCATION_WITH_NEARBY_BACKGROUND }
        : { ...LOCATION_FOREGROUND_ONLY },
    ];
  });

  if (!nearbyNativeEnabled) {
    return withLocation;
  }

  const hasTaskManager = withLocation.some(isExpoTaskManagerPlugin);
  if (hasTaskManager) {
    return withLocation;
  }

  const locationIndex = withLocation.findIndex(isExpoLocationPlugin);
  if (locationIndex < 0) {
    return [...withLocation, "expo-task-manager"];
  }

  const next = [...withLocation];
  next.splice(locationIndex + 1, 0, "expo-task-manager");
  return next;
}

/**
 * Expo app config. Prefer this over editing `app.json` plugins by hand — nearby
 * background native linkage follows `EXPO_PUBLIC_NEARBY_STOCK_ALERTS_ENABLED`.
 *
 * @param context - Expo config context (spread preserves CLI overrides)
 * @returns Final Expo config for prebuild / EAS
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const nearbyNativeEnabled = readNearbyNativePluginsEnabled();
  const baseExpo = appJson.expo;

  return {
    ...config,
    ...baseExpo,
    plugins: buildPlugins(baseExpo.plugins, nearbyNativeEnabled),
    extra: {
      ...(typeof baseExpo.extra === "object" && baseExpo.extra !== null
        ? baseExpo.extra
        : {}),
      nearbyNativePluginsEnabled: nearbyNativeEnabled,
    },
  };
};
