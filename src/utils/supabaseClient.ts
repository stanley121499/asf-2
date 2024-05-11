import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://gswszoljvafugtdikimn.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd3N6b2xqdmFmdWd0ZGlraW1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMTc0MTA3OSwiZXhwIjoyMDE3MzE3MDc5fQ.MG8C8G69ArDou5hnAjip848052-xtd3mIa7Hp7jlq60"

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

export { supabase }
