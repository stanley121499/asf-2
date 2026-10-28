import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

import type { Database } from "@/database.types";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/**
 * True when both public Supabase env vars were baked into the JS bundle.
 * Missing vars are a common EAS/dev-client misconfig that used to crash on import
 * via `createClient("", "")`.
 */
export const isSupabaseConfigured: boolean =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

/**
 * Placeholder credentials so `createClient` never throws at module load.
 * Requests against this host fail network-side; callers should treat the app as
 * degraded when {@link isSupabaseConfigured} is false.
 */
const PLACEHOLDER_SUPABASE_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.placeholder";

if (!isSupabaseConfigured) {
  console.error(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY are missing. " +
      "Set them in .env for local runs, or as EAS environment variables for production/dev-client builds. " +
      "The app will start, but auth and data will not work.",
  );
}

/**
 * Customer app Supabase client — anon key + AsyncStorage session persistence.
 * RLS applies as the signed-in user.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_SUPABASE_URL,
  isSupabaseConfigured ? supabaseAnonKey : PLACEHOLDER_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
