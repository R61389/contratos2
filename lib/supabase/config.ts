/**
 * Supabase se activa cuando existen estas dos variables (ver .env.example y docs/backend.md).
 * Sin ellas, el sitio usa los datos del código y el panel funciona en modo demostración.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const MEDIA_BUCKET = "provider-media";
