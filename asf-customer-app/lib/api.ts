import Constants from "expo-constants";

type ExpoConstantsHostShape = {
  expoConfig?: {
    hostUri?: string | null;
  } | null;
};

/**
 * Converts Expo's dev-server host into the sibling Next.js API host.
 *
 * Expo usually serves from `192.168.x.x:8081`; during local development the
 * Next app runs on the same machine at port 3000.
 */
function inferLocalApiBaseUrl(): string | null {
  const hostUri = (Constants as ExpoConstantsHostShape).expoConfig?.hostUri;
  if (typeof hostUri !== "string" || hostUri.trim().length === 0) {
    return null;
  }

  const trimmed = hostUri.trim();
  const urlText = trimmed.includes("://") ? trimmed : `http://${trimmed}`;

  try {
    const parsed = new URL(urlText);
    parsed.protocol = "http:";
    parsed.port = "3000";
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
 * Returns the Next.js app base URL (no trailing slash) used for `/api/*` routes.
 *
 * @example http://192.168.1.10:3000 or https://your-app.vercel.app
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? "";
  const trimmed = raw.trim();
  const inferred = inferLocalApiBaseUrl();

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

  return trimmed.replace(/\/+$/, "");
}
