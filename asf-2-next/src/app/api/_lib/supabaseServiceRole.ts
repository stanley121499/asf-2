import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/database.types";

/**
 * Returns a Supabase client authenticated with the service role key.
 * Used only in trusted server Route Handlers (Stripe webhook, delivery APIs).
 */
export function createServiceRoleClient(): ReturnType<typeof createClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url.length === 0) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (key === undefined || key.length === 0) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
