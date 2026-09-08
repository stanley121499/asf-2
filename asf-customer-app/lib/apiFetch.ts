import { getApiBaseUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

/**
 * True when the session JWT is missing or expires within `skewSeconds`.
 *
 * @param expiresAt - Unix seconds from Supabase session, if present
 * @param skewSeconds - Refresh early window (default 60s)
 */
function sessionNeedsRefresh(
  expiresAt: number | undefined,
  skewSeconds = 60
): boolean {
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
    return true;
  }
  return expiresAt < Date.now() / 1000 + skewSeconds;
}

/**
 * Resolves a usable Supabase access token for Next.js `/api/*` calls.
 * Prefers the current session; refreshes when missing or near expiry
 * (common after backgrounding the app on iOS).
 */
async function resolveAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const existing = session?.access_token;

  if (
    typeof existing === "string" &&
    existing.trim().length > 0 &&
    !sessionNeedsRefresh(session?.expires_at)
  ) {
    return existing.trim();
  }

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error !== null) {
    console.warn("[apiFetch] refreshSession failed", error.message);
    // Fall back to whatever we still have — server will 401 if unusable.
    if (typeof existing === "string" && existing.trim().length > 0) {
      return existing.trim();
    }
    return null;
  }

  const token = refreshed.session?.access_token;
  if (typeof token === "string" && token.trim().length > 0) {
    return token.trim();
  }

  return null;
}

/**
 * Fetches a Next.js `/api/*` route with the customer's Supabase access token.
 *
 * Expo has no shared session cookies with the Next app, so authenticated
 * warranty (and similar) routes expect `Authorization: Bearer <access_token>`.
 * Base URL comes from `EXPO_PUBLIC_API_URL` via {@link getApiBaseUrl}.
 *
 * @param path - Absolute path beginning with `/`, e.g. `/api/warranty/registrations`.
 * @param init - Same as global `fetch` init; Authorization is merged when a session exists.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await resolveAccessToken();

  const headers = new Headers(init?.headers ?? undefined);
  if (token !== null && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && init?.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getApiBaseUrl()}${normalizedPath}`;

  if (__DEV__ && token === null) {
    console.warn("[apiFetch] no access token for", normalizedPath);
  }

  return fetch(url, {
    ...init,
    headers,
  });
}
