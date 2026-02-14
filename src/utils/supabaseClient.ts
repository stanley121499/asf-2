import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

// Create a strictly typed Supabase client bound to our Database types.
// Values are read from environment; fall back to existing literals for local dev only.
const supabaseUrl: string =
  (process.env.REACT_APP_SUPABASE_URL as string) || "https://gswszoljvafugtdikimn.supabase.co";
const supabaseKey: string =
  (process.env.REACT_APP_SUPABASE_ANON_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd3N6b2xqdmFmdWd0ZGlraW1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTc0MTA3OSwiZXhwIjoyMDE3MzE3MDc5fQ.MG8C8G69ArDou5hnAjip848052-xtd3mIa7Hp7jlq60";

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export { supabase };
