"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

let browser: SupabaseClient | null = null;

/** One client per tab; the session lives in localStorage and refreshes itself. */
export function getBrowserClient() {
  if (!browser) browser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return browser;
}
