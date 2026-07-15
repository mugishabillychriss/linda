// Browser-side Supabase client -- uses the public anon key only.
// Set these in Vercel > Project > Settings > Environment Variables.
// NEXT_PUBLIC_ vars are safe to expose to the browser; the service_role
// key (used by the backend) must never appear here.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
