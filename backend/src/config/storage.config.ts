/**
 * RUANGAMAN — Storage Configuration
 *
 * Satu-satunya tempat yang mendefinisikan nama bucket Supabase Storage.
 * Import konstanta ini di mana pun bucket storage diakses agar tidak
 * ada duplikasi atau ketidakcocokan nama bucket.
 *
 * JANGAN gunakan string literal bucket name secara langsung di file lain.
 */

/**
 * Bucket private untuk menyimpan file bukti laporan.
 * Bucket ini harus dikonfigurasi sebagai PRIVATE di Supabase Dashboard.
 * Akses hanya melalui signed URL yang dibuat oleh backend (admin only).
 *
 * Nama bucket di Supabase: report-evidences
 */
export const EVIDENCE_BUCKET = 'report-evidences';

/**
 * Durasi signed URL dalam detik.
 * File bukti hanya dapat diakses dalam rentang waktu ini.
 */
export const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 jam

/**
 * Prefix untuk path file development (simulasi lokal).
 * File dengan prefix ini tidak ada di Supabase Storage.
 */
export const DEV_LOCAL_PATH_PREFIX = 'local/';
