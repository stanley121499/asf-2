/**
 * Mirrors the Supabase browser session from `localStorage` into host cookies
 * so Next.js middleware can read a best-effort session at the edge.
 *
 * When the URI-encoded JSON exceeds browser per-cookie limits (~4KB), the
 * payload is stored as base64url in multiple `sb-app-session-ch-N` cookies plus
 * `sb-app-session-cnt`; see {@link ../utils/sessionMirrorEncoding}.
 */

import {
  SESSION_MIRROR_COUNT_COOKIE,
  SESSION_MIRROR_MAIN_COOKIE,
  SESSION_MIRROR_MAX_CHUNKS,
  SESSION_MIRROR_SINGLE_MAX_ENCODED_CHARS,
  sessionMirrorChunkCookieName,
  splitForCookieChunks,
  utf8ToBase64Url,
} from "./sessionMirrorEncoding";

/** Must match `storageKey` on the browser Supabase client. */
export const SESSION_STORAGE_AND_COOKIE_KEY = SESSION_MIRROR_MAIN_COOKIE;

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

function buildCookiePair(name: string, value: string, maxAge: number): string {
  return [
    `${name}=${value}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${String(maxAge)}`,
    cookieSecureSuffix(),
  ]
    .filter((part) => part.length > 0)
    .join("; ");
}

function expireCookiePair(name: string): string {
  return [
    `${name}=`,
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    cookieSecureSuffix(),
  ]
    .filter((part) => part.length > 0)
    .join("; ");
}

/**
 * Clears chunked mirror cookies (`sb-app-session-cnt`, `sb-app-session-ch-*`).
 */
function clearChunkMirrorCookies(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = expireCookiePair(SESSION_MIRROR_COUNT_COOKIE);
  for (let i = 0; i < SESSION_MIRROR_MAX_CHUNKS; i += 1) {
    document.cookie = expireCookiePair(sessionMirrorChunkCookieName(i));
  }
}

/**
 * Writes `localStorage["sb-app-session"]` into host cookies so middleware can
 * read the session. Uses a single cookie when small enough; otherwise chunked
 * base64url cookies (see `sessionMirrorEncoding.ts`).
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

  if (encoded.length <= SESSION_MIRROR_SINGLE_MAX_ENCODED_CHARS) {
    clearChunkMirrorCookies();
    document.cookie = buildCookiePair(SESSION_MIRROR_MAIN_COOKIE, encoded, maxAge);
    return;
  }

  const b64 = utf8ToBase64Url(raw);
  const parts = splitForCookieChunks(b64);
  if (parts.length > SESSION_MIRROR_MAX_CHUNKS) {
    clearSessionCookie();
    return;
  }

  document.cookie = expireCookiePair(SESSION_MIRROR_MAIN_COOKIE);
  clearChunkMirrorCookies();

  document.cookie = buildCookiePair(
    SESSION_MIRROR_COUNT_COOKIE,
    encodeURIComponent(String(parts.length)),
    maxAge
  );
  for (let i = 0; i < parts.length; i += 1) {
    document.cookie = buildCookiePair(sessionMirrorChunkCookieName(i), parts[i] ?? "", maxAge);
  }
}

/**
 * Removes the mirrored session cookies (single, count, and all chunk slots).
 */
export function clearSessionCookie(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  document.cookie = expireCookiePair(SESSION_MIRROR_MAIN_COOKIE);
  document.cookie = expireCookiePair(SESSION_MIRROR_COUNT_COOKIE);
  for (let i = 0; i < SESSION_MIRROR_MAX_CHUNKS; i += 1) {
    document.cookie = expireCookiePair(sessionMirrorChunkCookieName(i));
  }
}
