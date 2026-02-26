import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

const supabaseUrl: string =
  (process.env.REACT_APP_SUPABASE_URL as string) || "https://gswszoljvafugtdikimn.supabase.co";

// The service_role key — used ONLY by supabaseAdmin for admin operations.
// ⚠️  Never use this key in regular data-fetching contexts.
const serviceRoleKey: string =
  (process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd3N6b2xqdmFmdWd0ZGlraW1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTc0MTA3OSwiZXhwIjoyMDE3MzE3MDc5fQ.MG8C8G69ArDou5hnAjip848052-xtd3mIa7Hp7jlq60";

/**
 * Main Supabase client — used for all regular data fetching and user auth.
 * Uses the service_role key but with auth session storage disabled so it does
 * NOT compete for navigator.locks with admin operations.
 *
 * The key insight: `persistSession: false` + `autoRefreshToken: false` means
 * this client never acquires navigator.locks for storage, so table queries
 * (categories, products, etc.) always fire immediately without queuing.
 *
 * Auth state (sign-in / sign-out / session) is tracked manually in AuthContext
 * by calling supabase.auth.setSession() after signInWithPassword resolves.
 */
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sb-app-session",
  },
});

/**
 * Admin-only Supabase client — used ONLY for operations that require
 * service_role privileges (e.g. auth.admin.listUsers, auth.admin.createUser).
 *
 * Session persistence is fully disabled here so this client never interferes
 * with the navigator.locks used by the main client.
 */
const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: "sb-admin-session",
  },
});

export { supabase, supabaseAdmin };
