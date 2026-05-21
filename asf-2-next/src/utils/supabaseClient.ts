import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

function trimEnv(value: string | undefined): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

const supabaseUrl: string =
  trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  trimEnv(process.env.REACT_APP_SUPABASE_URL as string | undefined) ||
  "https://gswszoljvafugtdikimn.supabase.co";

/**
 * Public anon key — **required** for the browser client and must match
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` used in `middlewareAuth` session reads.
 * Never use `service_role` here: JWTs from service-role sign-in are not valid
 * for `getSession()` when the edge uses the anon key → middleware redirect loops.
 */
const anonPublicKey: string = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (anonPublicKey.length === 0) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Copy .env.example to .env.local and set the anon key from Supabase → Project Settings → API."
  );
}

/**
 * Main browser Supabase client — anon key + user session + RLS.
 *
 * `autoRefreshToken: false` is intentional (see prior comments in git history):
 * avoids navigator.locks deadlocks when refresh hangs offline.
 *
 * `persistSession: true` + `storageKey: "sb-app-session"` match `sessionCookieSync`
 * and edge middleware.
 */
const supabase = createClient<Database>(supabaseUrl, anonPublicKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: true,
    storageKey: "sb-app-session",
  },
});

/**
 * Alias of {@link supabase} so existing imports keep working without creating a
 * second GoTrueClient (same `storageKey` would warn: "Multiple GoTrueClient instances").
 */
const supabaseAnon = supabase;

/**
 * Service role key — **server / admin only**. Read from env; never hardcode.
 * If unset, `supabaseAdmin` falls back to the anon key so the module still loads
 * in dev; `auth.admin.*` and RLS-bypassing calls will fail until the key is set.
 */
const serviceRoleKey: string =
  trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
  trimEnv(process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY as string | undefined);

const adminApiKey: string = serviceRoleKey.length > 0 ? serviceRoleKey : anonPublicKey;

const supabaseAdmin = createClient<Database>(supabaseUrl, adminApiKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: "sb-admin-session",
  },
});

export { supabase, supabaseAdmin, supabaseAnon };
