/**
 * Returns the Next.js app base URL (no trailing slash) used for `/api/*` routes.
 *
 * @example http://192.168.1.10:3000 or https://your-app.vercel.app
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? "";
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Add it to .env (e.g. http://192.168.x.x:3000)."
    );
  }
  return trimmed.replace(/\/+$/, "");
}
