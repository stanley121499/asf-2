import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/utils/supabase/server";

import type { User } from "@supabase/supabase-js";

/**
 * Returns the authenticated user from the session cookie, or a 401 response.
 */
export async function requireAuthenticatedUser(): Promise<
  { ok: true; user: User } | { ok: false; response: NextResponse }
> {
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
