import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/utils/supabase/server";

import type { User } from "@supabase/supabase-js";

/**
 * Reads the `Authorization` header from an optional Request, falling back to
 * Next.js `headers()`. Route handlers should pass `request` so Expo Bearer
 * tokens are not lost when the async headers store is incomplete.
 *
 * @param request - Incoming route `Request` when available
 */
function readAuthorizationHeader(request?: Request): string | null {
  if (request !== undefined) {
    const fromRequest = request.headers.get("authorization");
    if (typeof fromRequest === "string" && fromRequest.trim().length > 0) {
      return fromRequest;
    }
  }

  const headerStore = headers();
  const fromStore = headerStore.get("authorization");
  if (typeof fromStore === "string" && fromStore.trim().length > 0) {
    return fromStore;
  }

  return null;
}

/**
 * Extracts a non-empty Bearer access token from an Authorization header value.
 *
 * @param authHeader - Raw `Authorization` header
 */
function extractBearerToken(authHeader: string): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const token = match !== null ? match[1]?.trim() : undefined;
  if (typeof token === "string" && token.length > 0) {
    return token;
  }
  return null;
}

/**
 * Validates a Supabase access token via the Auth API and returns the user.
 *
 * @param token - JWT from `Authorization: Bearer …`
 */
async function userFromBearerToken(token: string): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    typeof url !== "string" ||
    url.length === 0 ||
    typeof anonKey !== "string" ||
    anonKey.length === 0
  ) {
    console.error(
      "requireAuthenticatedUser: missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY"
    );
    return null;
  }

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

  if (error !== null) {
    console.warn(
      "requireAuthenticatedUser: Bearer getUser failed",
      error.message
    );
    return null;
  }

  return user;
}

/**
 * Returns the authenticated user from a Bearer JWT (Expo / mobile) or
 * session cookie (Next web), or a 401 response.
 *
 * Mobile clients cannot share Next cookies; they send
 * `Authorization: Bearer <supabase_access_token>` via `apiFetch`.
 * Pass the route `request` so the Bearer header is read reliably.
 *
 * @param request - Optional route `Request` (preferred for Expo / API callers)
 */
export async function requireAuthenticatedUser(
  request?: Request
): Promise<{ ok: true; user: User } | { ok: false; response: NextResponse }> {
  const authHeader = readAuthorizationHeader(request);
  if (authHeader !== null) {
    const token = extractBearerToken(authHeader);
    if (token !== null) {
      const bearerUser = await userFromBearerToken(token);
      if (bearerUser !== null) {
        return { ok: true, user: bearerUser };
      }
      // Bearer was presented but invalid/expired — do not silently fall through
      // to cookie auth (Expo has no cookies; a stale cookie must not win).
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
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
 *
 * @param request - Optional route `Request` for Bearer support
 */
export async function requireStaffUser(
  request?: Request
): Promise<{ ok: true; user: User } | { ok: false; response: NextResponse }> {
  return requireAuthenticatedUser(request);
}
