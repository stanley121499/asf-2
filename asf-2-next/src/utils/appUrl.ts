/**
 * Returns the configured public app base URL without a trailing slash, or null if unset.
 */
export function normalizeAppBaseUrl(raw: string | undefined): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }
  return raw.replace(/\/+$/, "");
}

/**
 * Full URL for Supabase `resetPasswordForEmail` redirect (must match Supabase allowed redirect URLs).
 */
export function buildPasswordResetRedirectUrl(): string | null {
  const base = normalizeAppBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (base === null) {
    return null;
  }
  return `${base}/authentication/reset-password`;
}
