/**
 * Normalize Supabase / gateway error strings for alerts and logs.
 *
 * Cloudflare / intermittent gateway failures sometimes return an HTML
 * error page as `error.message` (e.g. HTTP 522). Dumping that into
 * `console.error` or `showAlert` floods Metro and can break alert UI.
 */

/** Max length for a safe, human-readable error line. */
const MAX_SAFE_MESSAGE_LENGTH = 180;

/**
 * True when a string looks like an HTML document rather than a short API message.
 *
 * @param value - Candidate error message.
 * @returns Whether the value should be replaced with a network fallback.
 */
function looksLikeHtmlDocument(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith("<!doctype") ||
    lower.startsWith("<html") ||
    lower.includes("<html") ||
    lower.includes("cf-error-details") ||
    lower.includes("error code 522") ||
    lower.includes("error code 502") ||
    lower.includes("error code 503") ||
    lower.includes("error code 504")
  );
}

/**
 * Extracts a short message from unknown error shapes (Error, Postgrest-like).
 *
 * @param error - Unknown thrown / returned error value.
 * @returns Raw message string, or empty when none is available.
 */
export function extractRawErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = Reflect.get(error, "message");
    if (typeof message === "string") {
      return message;
    }
  }
  return "";
}

/**
 * Returns a short, UI-safe error message. HTML gateway pages become a
 * stable network string so callers can map via {@link getErrorTranslationKey}.
 *
 * @param error - Unknown error or raw message string.
 * @returns Non-empty sanitized message suitable for logs and alerts.
 */
export function sanitizeSupabaseErrorMessage(error: unknown): string {
  const raw = extractRawErrorMessage(error).trim();
  if (raw.length === 0) {
    return "Network request failed";
  }
  if (looksLikeHtmlDocument(raw)) {
    return "Network request failed";
  }
  if (raw.length > MAX_SAFE_MESSAGE_LENGTH) {
    return `${raw.slice(0, MAX_SAFE_MESSAGE_LENGTH)}…`;
  }
  return raw;
}
