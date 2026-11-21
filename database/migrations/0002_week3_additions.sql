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
-- 2. PENYESUAIAN SKEMA & RELASI (Week 3)
-- =====================================================================

-- Tambah kolom reporter_user_id pada tabel reports
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS reporter_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON reports(reporter_user_id);

-- Ubah counselor_admin_id pada counseling_slots agar bisa nullable
-- Memungkinkan seed slot awal sebelum akun admin petugas dibuat/disetujui
ALTER TABLE counseling_slots
    ALTER COLUMN counselor_admin_id DROP NOT NULL;

-- Tambah unique constraint pada support_resources(title) agar seed idempotent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'support_resources_title_key'
    ) THEN
        ALTER TABLE support_resources ADD CONSTRAINT support_resources_title_key UNIQUE (title);
    END IF;
END $$;

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

-- Drop existing policies if exists to allow re-running migration cleanly
DROP POLICY IF EXISTS "user_profiles_own_read" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_update" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_own_insert" ON user_profiles;
DROP POLICY IF EXISTS "admins_no_public_access" ON admins;
DROP POLICY IF EXISTS "reports_no_public_access" ON reports;
DROP POLICY IF EXISTS "report_categories_public_read" ON report_categories;
DROP POLICY IF EXISTS "report_evidences_no_public_access" ON report_evidences;
DROP POLICY IF EXISTS "report_status_histories_no_public_access" ON report_status_histories;
DROP POLICY IF EXISTS "education_materials_public_read" ON education_materials;
DROP POLICY IF EXISTS "support_resources_public_read" ON support_resources;
DROP POLICY IF EXISTS "counseling_slots_public_read" ON counseling_slots;
DROP POLICY IF EXISTS "counseling_bookings_no_public_access" ON counseling_bookings;

-- ===== KEBIJAKAN: user_profiles =====
-- Pengguna hanya bisa membaca dan mengubah profil mereka sendiri
CREATE POLICY "user_profiles_own_read" ON user_profiles
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "user_profiles_own_update" ON user_profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "user_profiles_own_insert" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- ===== KEBIJAKAN: admins =====
-- Akses hanya melalui backend (service role bypass RLS)
CREATE POLICY "admins_no_public_access" ON admins
    FOR ALL USING (false);

-- ===== KEBIJAKAN: reports =====
-- Akses hanya melalui backend (service role bypass RLS)
CREATE POLICY "reports_no_public_access" ON reports
    FOR ALL USING (false);

-- ===== KEBIJAKAN: report_categories =====
-- Kategori aktif dapat dibaca publik untuk form pelaporan
CREATE POLICY "report_categories_public_read" ON report_categories
    FOR SELECT USING (is_active = true);

-- ===== KEBIJAKAN: report_evidences =====
-- Akses bukti terbatas pada backend (service role)
CREATE POLICY "report_evidences_no_public_access" ON report_evidences
    FOR ALL USING (false);

-- ===== KEBIJAKAN: report_status_histories =====
-- Riwayat status hanya diakses melalui backend
CREATE POLICY "report_status_histories_no_public_access" ON report_status_histories
    FOR ALL USING (false);

-- ===== KEBIJAKAN: education_materials =====
-- Materi edukasi yang dipublikasikan dapat dibaca oleh publik
CREATE POLICY "education_materials_public_read" ON education_materials
    FOR SELECT USING (is_published = true);

-- ===== KEBIJAKAN: support_resources =====
-- Sumber daya pendampingan yang dipublikasikan dapat dibaca oleh publik
-- Kolom aktual skema 0001: is_published (bukan is_active)
CREATE POLICY "support_resources_public_read" ON support_resources
    FOR SELECT USING (is_published = true);

-- ===== KEBIJAKAN: counseling_slots =====
-- Slot konseling yang dipublikasikan dan berstatus 'available' dapat dibaca oleh publik
CREATE POLICY "counseling_slots_public_read" ON counseling_slots
    FOR SELECT USING (is_published = true AND status = 'available');

-- ===== KEBIJAKAN: counseling_bookings =====
-- Booking hanya diakses melalui backend (service role)
CREATE POLICY "counseling_bookings_no_public_access" ON counseling_bookings
    FOR ALL USING (false);

-- =====================================================================
-- SELESAI
-- =====================================================================
SELECT 'Migration 0002 Week 3 berhasil diterapkan.' AS status;

-- =====================================================================
-- 5. RPC: ATOMIC SLOT BOOKING (mencegah double booking)
-- =====================================================================
CREATE OR REPLACE FUNCTION book_counseling_slot(
    p_slot_id              UUID,
    p_booking_code         TEXT,
    p_student_name         TEXT,
    p_contact_method       TEXT,
    p_contact_value        TEXT,
    p_privacy_acknowledged BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_slot       RECORD;
    v_booking_id UUID := gen_random_uuid();
    v_result     JSONB;
BEGIN
    SELECT * INTO v_slot FROM counseling_slots WHERE id = p_slot_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND: Slot konseling tidak ditemukan' USING ERRCODE = 'P0001';
    END IF;

    IF v_slot.status <> 'available' THEN
        RAISE EXCEPTION 'SLOT_UNAVAILABLE: Slot konseling sudah tidak tersedia' USING ERRCODE = 'P0002';
    END IF;

    IF NOT v_slot.is_published THEN
        RAISE EXCEPTION 'SLOT_NOT_PUBLISHED: Slot konseling tidak dipublikasikan' USING ERRCODE = 'P0003';
    END IF;

    INSERT INTO counseling_bookings (id, slot_id, booking_code, student_name, contact_method, contact_value, privacy_acknowledged, booking_status)
    VALUES (v_booking_id, p_slot_id, p_booking_code, p_student_name, p_contact_method, p_contact_value, p_privacy_acknowledged, 'confirmed');

    UPDATE counseling_slots SET status = 'booked' WHERE id = p_slot_id;

    SELECT row_to_json(b)::JSONB INTO v_result FROM counseling_bookings b WHERE b.id = v_booking_id;
    RETURN v_result;
END;
$$;

-- =====================================================================
-- 6. RPC: ATOMIC STATUS UPDATE + AUDIT TRAIL
-- =====================================================================
CREATE OR REPLACE FUNCTION update_report_status_with_history(
    p_report_id           UUID,
    p_new_status          TEXT,
    p_changed_by_admin_id UUID DEFAULT NULL,
    p_public_message      TEXT DEFAULT NULL,
    p_internal_note       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_report          RECORD;
    v_previous_status TEXT;
    v_history_id      UUID := gen_random_uuid();
    v_result          JSONB;
BEGIN
    SELECT * INTO v_report FROM reports WHERE id = p_report_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'REPORT_NOT_FOUND: Laporan tidak ditemukan' USING ERRCODE = 'P0010';
    END IF;

    v_previous_status := v_report.status;

    UPDATE reports
    SET status = p_new_status, updated_at = NOW(),
        assigned_admin_id = COALESCE(p_changed_by_admin_id, assigned_admin_id),
        resolved_at = CASE WHEN p_new_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
    WHERE id = p_report_id;

    INSERT INTO report_status_histories (id, report_id, changed_by_admin_id, previous_status, new_status, public_message, internal_note, created_at)
    VALUES (v_history_id, p_report_id, p_changed_by_admin_id, v_previous_status, p_new_status, p_public_message, p_internal_note, NOW());

    SELECT row_to_json(r)::JSONB INTO v_result FROM reports r WHERE r.id = p_report_id;
    RETURN v_result;
END;
$$;
