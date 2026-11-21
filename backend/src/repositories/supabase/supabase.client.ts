import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SUPABASE_URL dan SUPABASE_SECRET_KEY wajib diisi di environment production.'
    );
  }
  // Di development tanpa Supabase, biarkan null — factory akan gunakan mock
}

/**
 * Supabase Admin Client — menggunakan service role key.
 * Bypass RLS untuk semua operasi backend.
 * JANGAN gunakan di frontend atau expose ke client.
 */
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

/**
 * Verifikasi JWT token dari Supabase Auth.
 * Digunakan oleh auth middleware untuk memvalidasi user.
 */
export async function verifySupabaseToken(
  token: string
): Promise<{ id: string; email?: string } | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}
