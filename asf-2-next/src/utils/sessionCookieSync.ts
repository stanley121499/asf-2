/**
 * Mirrors the Supabase browser session from `localStorage` into a host cookie
 * named `sb-app-session` (same key as `storageKey` in supabaseClient.ts) so
 * Next.js middleware can perform a best-effort session read at the edge.
 *
 * **Cookie size (~4KB):** Large JWTs or user metadata can exceed browser cookie
 * limits; in that case the cookie may be truncated and middleware may treat the
 * user as unauthenticated until the payload fits. Client-side auth remains
 * authoritative.
 */

/** Must match `storageKey` on the browser Supabase client. */
export const SESSION_STORAGE_AND_COOKIE_KEY = "sb-app-session";

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Reads `expires_at` (Unix seconds) from the Supabase persisted session JSON
 * when present at the top level or under `currentSession`.
 */
function readExpiresAtFromPersistedJson(raw: string): number | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const obj = parsed as Record<string, unknown>;
    const top = obj["expires_at"];
    if (typeof top === "number") {
      return top;
    }
    const nested = obj["currentSession"];
    if (typeof nested === "object" && nested !== null) {
      const at = (nested as Record<string, unknown>)["expires_at"];
      if (typeof at === "number") {
        return at;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function computeMaxAgeSeconds(raw: string): number {
  const expiresAt = readExpiresAtFromPersistedJson(raw);
  if (typeof expiresAt !== "number") {
    return DEFAULT_MAX_AGE_SECONDS;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const delta = expiresAt - nowSec;
  /** At least one minute so the cookie is not immediately dropped. */
  return Math.max(60, Math.min(DEFAULT_MAX_AGE_SECONDS, delta));
}

function cookieSecureSuffix(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.isSecureContext ? "; Secure" : "";
}

/**
 * Writes `localStorage["sb-app-session"]` into document cookie `sb-app-session`,
 * URI-encoding the value for safe `Set-Cookie` semantics. No-ops on the server.
 */
export function syncSessionCookieFromStorage(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_AND_COOKIE_KEY);
  if (raw === null || raw.length === 0) {
    clearSessionCookie();
    return;
  }
  const maxAge = computeMaxAgeSeconds(raw);
  const encoded = encodeURIComponent(raw);
  document.cookie = [
    `${SESSION_STORAGE_AND_COOKIE_KEY}=${encoded}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${String(maxAge)}`,
    cookieSecureSuffix(),
  ]
    .filter((part) => part.length > 0)
    .join("; ");
}

/**
 * Removes the mirrored session cookie. No-ops on the server.
 */
export function clearSessionCookie(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  document.cookie = [
    `${SESSION_STORAGE_AND_COOKIE_KEY}=`,
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    cookieSecureSuffix(),
  ]
    .filter((part) => part.length > 0)
    .join("; ");
}
