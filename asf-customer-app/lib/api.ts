import Constants from "expo-constants";

type ExpoConstantsHostShape = {
  expoConfig?: {
    hostUri?: string | null;
  } | null;
  expoGoConfig?: {
    debuggerHost?: string | null;
  } | null;
  experienceUrl?: string | null;
  linkingUri?: string | null;
  manifest?: {
    debuggerHost?: string | null;
    hostUri?: string | null;
  } | null;
};

/**
 * Returns true when `hostname` looks like localhost or a private LAN address.
 */
function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
    return true;
  }
  if (host.startsWith("192.168.")) {
    return true;
  }
  if (host.startsWith("10.")) {
    return true;
  }
  return /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
}

/**
 * Normalizes Expo packager host strings (`host:port` or full URL) into `host:port`.
 *
 * @param value - Candidate hostUri / debuggerHost / experience URL
 */
function normalizePackagerHostCandidate(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const withScheme = trimmed.includes("://") ? trimmed : `http://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.hostname.length === 0) {
      return null;
    }
    if (parsed.port.length > 0) {
      return `${parsed.hostname}:${parsed.port}`;
    }
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Reads Expo's live Metro / packager host from several Constants fields.
 * `expoConfig.hostUri` is preferred; Expo Go also exposes `debuggerHost`.
 */
function readExpoPackagerHostUri(): string | null {
  const constants = Constants as ExpoConstantsHostShape;
  const candidates: Array<string | null | undefined> = [
    constants.expoConfig?.hostUri,
    constants.expoGoConfig?.debuggerHost,
    constants.manifest?.debuggerHost,
    constants.manifest?.hostUri,
    constants.experienceUrl,
    constants.linkingUri,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const normalized = normalizePackagerHostCandidate(candidate);
    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

/**
 * Converts Expo's dev-server host into the sibling Next.js API host.
 *
 * Expo usually serves from `192.168.x.x:8081`; during local development the
 * Next app runs on the same machine (port from `preferredPort` or 3000).
 *
 * @param preferredPort - Port from `EXPO_PUBLIC_API_URL` when set
 */
function inferLocalApiBaseUrl(preferredPort?: string): string | null {
  const hostUri = readExpoPackagerHostUri();
  if (hostUri === null) {
    return null;
  }

  const urlText = hostUri.includes("://") ? hostUri : `http://${hostUri}`;

  try {
    const parsed = new URL(urlText);
    parsed.protocol = "http:";
    const port =
      typeof preferredPort === "string" && preferredPort.trim().length > 0
        ? preferredPort.trim()
        : "3000";
    parsed.port = port;
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function isLoopbackUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Parses a configured API base URL, returning null when invalid.
 */
function parseConfiguredApiUrl(value: string): URL | null {
  const withScheme = value.includes("://") ? value : `http://${value}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

/**
 * Returns the Next.js app base URL (no trailing slash) used for `/api/*` routes.
 *
 * In `__DEV__`, stale LAN IPs in `EXPO_PUBLIC_API_URL` (common when Wi‑Fi changes)
 * are replaced with Expo’s current packager host while keeping the configured port.
 * Public HTTPS URLs (e.g. Vercel) are left unchanged.
 *
 * @example http://192.168.1.10:3000 or https://your-app.vercel.app
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? "";
  const trimmed = raw.trim();
  const configured = trimmed.length > 0 ? parseConfiguredApiUrl(trimmed) : null;
  const preferredPort =
    configured !== null && configured.port.length > 0
      ? configured.port
      : undefined;
  const inferred = inferLocalApiBaseUrl(preferredPort);

  if (trimmed.length === 0) {
    if (inferred !== null) {
      return inferred;
    }

    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Add it to .env (e.g. http://192.168.x.x:3000)."
    );
  }

  if (inferred !== null && isLoopbackUrl(trimmed)) {
    return inferred;
  }

  /**
   * Physical-device footgun: `.env` still has yesterday’s `192.168.0.x` while
   * Metro (and the phone) are on `192.168.100.x`. Prefer Expo’s live host for
   * private LAN targets in development only.
   */
  if (
    __DEV__ &&
    inferred !== null &&
    configured !== null &&
    isPrivateOrLocalHostname(configured.hostname)
  ) {
    try {
      const inferredUrl = new URL(inferred);
      if (configured.hostname !== inferredUrl.hostname) {
        console.warn(
          "[api] EXPO_PUBLIC_API_URL host differs from Expo packager host; using Expo LAN host",
          {
            configured: trimmed.replace(/\/+$/, ""),
            resolved: inferred,
          }
        );
        return inferred;
      }
    } catch {
      // Fall through to configured URL.
    }
  }

  return trimmed.replace(/\/+$/, "");
}
