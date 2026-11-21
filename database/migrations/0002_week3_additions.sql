-- =====================================================================
-- RUANGAMAN - MIGRATION 0002: WEEK 3 ADDITIONS
-- Supabase + Google OAuth + RLS + Storage
-- Jalankan setelah 0001_initial_schema.sql
-- =====================================================================

-- =====================================================================
-- 1. TABEL USER_PROFILES (baru untuk Week 3)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- =====================================================================
-- 2. TAMBAH KOLOM reporter_user_id PADA TABEL REPORTS (Week 3)
-- =====================================================================
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS reporter_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Index untuk pencarian laporan berdasarkan user
CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON reports(reporter_user_id);

-- =====================================================================
-- 3. TRIGGER: auto-update updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS pada semua tabel
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_bookings ENABLE ROW LEVEL SECURITY;

-- ===== KEBIJAKAN: user_profiles =====
-- Pengguna hanya bisa baca/ubah profil sendiri
CREATE POLICY "user_profiles_own_read" ON user_profiles
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "user_profiles_own_update" ON user_profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "user_profiles_own_insert" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- ===== KEBIJAKAN: admins =====
-- Hanya service role (backend) yang bisa membaca tabel admins
-- Tidak ada akses langsung dari frontend
CREATE POLICY "admins_no_public_access" ON admins
    FOR ALL USING (false);

-- ===== KEBIJAKAN: reports =====
-- Tidak ada akses publik langsung; backend menggunakan service role (bypass RLS)
-- Ini memastikan semua validasi dilakukan di backend
CREATE POLICY "reports_no_public_access" ON reports
    FOR ALL USING (false);

-- ===== KEBIJAKAN: report_categories =====
-- Semua orang bisa membaca kategori aktif (diperlukan form pelaporan publik)
CREATE POLICY "report_categories_public_read" ON report_categories
    FOR SELECT USING (is_active = true);

-- ===== KEBIJAKAN: report_evidences =====
-- Tidak ada akses publik; hanya service role
CREATE POLICY "report_evidences_no_public_access" ON report_evidences
    FOR ALL USING (false);

-- ===== KEBIJAKAN: report_status_histories =====
-- Tidak ada akses publik
CREATE POLICY "report_status_histories_no_public_access" ON report_status_histories
    FOR ALL USING (false);

-- ===== KEBIJAKAN: education_materials =====
-- Semua orang bisa membaca materi yang dipublikasikan
CREATE POLICY "education_materials_public_read" ON education_materials
    FOR SELECT USING (is_published = true);

-- ===== KEBIJAKAN: support_resources =====
-- Semua orang bisa membaca sumber daya aktif
CREATE POLICY "support_resources_public_read" ON support_resources
    FOR SELECT USING (is_active = true);

-- ===== KEBIJAKAN: counseling_slots =====
-- Semua orang bisa membaca slot yang tersedia
CREATE POLICY "counseling_slots_public_read" ON counseling_slots
    FOR SELECT USING (status = 'available');

-- ===== KEBIJAKAN: counseling_bookings =====
-- Tidak ada akses publik; hanya service role
CREATE POLICY "counseling_bookings_no_public_access" ON counseling_bookings
    FOR ALL USING (false);

-- =====================================================================
-- 5. STORAGE BUCKET SETUP
-- (Jalankan via Supabase Dashboard atau Storage API — tidak bisa via SQL)
-- =====================================================================
-- Instruksi manual:
-- 1. Buka Supabase Dashboard → Storage
-- 2. Klik "New Bucket"
-- 3. Nama bucket: report-evidence-private
-- 4. Pastikan "Public bucket" TIDAK dicentang (harus private)
-- 5. Klik Create
--
-- Storage RLS Policy (jalankan setelah bucket dibuat):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('report-evidence-private', 'report-evidence-private', false);
--
-- Policy akses: Hanya service role yang bisa upload/download
-- (Backend menggunakan SUPABASE_SECRET_KEY yang bypass RLS storage)

-- =====================================================================
-- SELESAI
-- =====================================================================
SELECT 'Migration 0002 Week 3 berhasil diterapkan.' AS status;
