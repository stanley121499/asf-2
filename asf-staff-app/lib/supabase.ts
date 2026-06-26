import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

import type { Database } from "@/database.types";

/**
 * Reads Expo public env with trimming; empty string when unset.
 */
function trimEnv(value: string | undefined): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

const supabaseUrl = trimEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
const anonKey = trimEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Shared Supabase browserless client — anon key + persisted session (AsyncStorage).
 */
export const supabase = createClient<Database>(supabaseUrl, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
