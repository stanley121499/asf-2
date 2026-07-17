import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/utils/supabase/server";

import type { User } from "@supabase/supabase-js";

/**
 * Returns the authenticated user from a Bearer JWT (Expo / mobile) or
 * session cookie (Next web), or a 401 response.
 *
 * Mobile clients cannot share Next cookies; they send
 * `Authorization: Bearer <supabase_access_token>` via `apiFetch`.
 */
export async function requireAuthenticatedUser(): Promise<
  { ok: true; user: User } | { ok: false; response: NextResponse }
> {
  const headerStore = headers();
  const authHeader = headerStore.get("authorization");
  if (typeof authHeader === "string") {
    const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
    const token = match !== null ? match[1]?.trim() : undefined;
    if (typeof token === "string" && token.length > 0) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (
        typeof url === "string" &&
        url.length > 0 &&
        typeof anonKey === "string" &&
        anonKey.length > 0
      ) {
        const bearerClient = createClient(url, anonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });
        const {
          data: { user },
          error,
        } = await bearerClient.auth.getUser(token);
        if (error === null && user !== null) {
          return { ok: true, user };
        }
      }
    }
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error !== null || user === null) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, user };
}

/**
 * Prototype staff check: any authenticated user may perform staff warranty actions.
 */
export async function requireStaffUser(): Promise<
  { ok: true; user: User } | { ok: false; response: NextResponse }
> {
  return requireAuthenticatedUser();
}
