import dotenv from 'dotenv';

dotenv.config();

/**
 * Konfigurasi aplikasi RUANGAMAN Backend.
 *
 * Nama environment variable backend yang digunakan:
 *   - SUPABASE_URL            : URL project Supabase
 *   - SUPABASE_PUBLISHABLE_KEY: Anon/public key (digunakan auth client)
 *   - SUPABASE_SECRET_KEY     : Service role key (RAHASIA — hanya backend)
 *
 * PENTING: SUPABASE_SECRET_KEY tidak boleh pernah dikirim ke frontend,
 * muncul di response API, atau dicatat di log yang dapat diakses publik.
 */
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  demoAdmin: {
    email: process.env.DEMO_ADMIN_EMAIL || 'admin@ruangaman.id',
    password: process.env.DEMO_ADMIN_PASSWORD || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    // Kunci publik (anon key) — aman untuk Supabase Auth client
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
    // Service role key — RAHASIA, hanya digunakan supabaseAdmin di backend
    // Tidak boleh dikirim ke frontend atau dicatat di log
    secretKey: process.env.SUPABASE_SECRET_KEY || '',
  },
};
