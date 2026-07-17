import { getApiBaseUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

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
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init?.headers ?? undefined);
  if (
    typeof token === "string" &&
    token.trim().length > 0 &&
    !headers.has("Authorization")
  ) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && init?.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getApiBaseUrl()}${normalizedPath}`;

  return fetch(url, {
    ...init,
    headers,
  });
}
