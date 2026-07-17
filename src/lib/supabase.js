import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variabel lingkungan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi di file .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
