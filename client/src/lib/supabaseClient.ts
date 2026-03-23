import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded values — these are public/publishable keys, safe to expose
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'REDACTED';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'REDACTED';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
