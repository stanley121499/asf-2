/**
 * Session mirror for edge middleware: Supabase persists a large JSON blob in
 * `localStorage` under `sb-app-session`. Mirroring that entire string into one
 * `document.cookie` often exceeds per-cookie browser limits (~4KB), so the
 * cookie is dropped and middleware treats the user as logged out.
 *
 * This module defines a **chunked base64url** mirror format. It must stay free
 * of `window` / `NextRequest` imports so both the browser bundle and Edge
 * middleware can import it.
 */

/** Same key as Supabase browser `storageKey` / `localStorage`. */
export const SESSION_MIRROR_MAIN_COOKIE = "sb-app-session";

/** Number of `SESSION_MIRROR_CHUNK_PREFIX{n}` cookies when using chunks. */
export const SESSION_MIRROR_COUNT_COOKIE = "sb-app-session-cnt";

export const SESSION_MIRROR_CHUNK_PREFIX = "sb-app-session-ch-";

/** Safe upper bound for a single URI-encoded cookie value. */
export const SESSION_MIRROR_SINGLE_MAX_ENCODED_CHARS = 3600;

export const SESSION_MIRROR_MAX_CHUNKS = 32;

export const SESSION_MIRROR_CHUNK_VALUE_MAX_CHARS = 3500;

/**
 * Builds the cookie name for chunk index `n` (e.g. `sb-app-session-ch-0`).
 */
export function sessionMirrorChunkCookieName(index: number): string {
  return `${SESSION_MIRROR_CHUNK_PREFIX}${String(index)}`;
}

/**
 * Encodes a UTF-8 string to base64url (no `+`, `/`, or padding) for cookie-safe ASCII.
 */
export function utf8ToBase64Url(utf8: string): string {
  const bytes = new TextEncoder().encode(utf8);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decodes base64url (from {@link utf8ToBase64Url}) back to a UTF-8 string.
 */
export function base64UrlToUtf8(b64url: string): string {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) {
    b64 += "=";
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Splits a string into segments no longer than {@link SESSION_MIRROR_CHUNK_VALUE_MAX_CHARS}.
 */
export function splitForCookieChunks(value: string): string[] {
  const max = SESSION_MIRROR_CHUNK_VALUE_MAX_CHARS;
  if (value.length <= max) {
    return [value];
  }
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += max) {
    parts.push(value.slice(i, i + max));
  }
  return parts;
}
