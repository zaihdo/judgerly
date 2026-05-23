import { createClient } from '@supabase/supabase-js'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, key)
