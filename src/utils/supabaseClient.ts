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
 *
 * `autoRefreshToken: false` is intentional and critical.
 *
 * When autoRefreshToken is true, every call to `supabase.auth.getSession()`
 * acquires an exclusive `navigator.locks` initialization lock.  If the stored
 * session is expired the client fires a network request to refresh the token
 * while holding that lock.  If the Supabase server is unreachable (paused
 * project, network outage, WebView network restrictions) that request hangs
 * indefinitely — deadlocking every subsequent auth operation that needs the
 * same lock (including sign-in itself).
 *
 * With autoRefreshToken: false, getSession() returns the session immediately
 * without any network round-trip.  AuthContext.fetchCurrentUser() checks
 * session expiry and treats expired sessions as "no session", prompting the
 * user to sign in again.  This matches the original developer intent described
 * in this comment.
 *
 * `persistSession: true` + `storageKey: "sb-app-session"` ensure that a
 * freshly acquired session (from signInWithPassword) survives page reloads.
 */
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // See comment above — must stay false
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
