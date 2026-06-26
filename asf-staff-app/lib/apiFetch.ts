import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

/**
 * Fetches the Next.js API (`EXPO_PUBLIC_API_URL`) with optional Supabase bearer token.
 *
 * @param path - Absolute path beginning with `/`, e.g. `/api/promotions`.
 * @param init - Same as global `fetch` init; headers are merged with Authorization when session exists.
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

  const url = apiUrl(path);

  return fetch(url, {
    ...init,
    headers,
  });
}
