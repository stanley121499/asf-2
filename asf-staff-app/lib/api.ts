/**
 * Builds an absolute URL for Next.js `/api/*` routes (same pattern as customer app).
 *
 * @param path - Path beginning with `/`, e.g. `/api/delivery/rates`.
 */
export function apiUrl(path: string): string {
  const base = trimBase(process.env.EXPO_PUBLIC_API_URL ?? "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function trimBase(raw: string): string {
  const t = raw.trim();
  return t.replace(/\/+$/, "");
}
