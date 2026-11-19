-- =====================================================================
-- RUANGAMAN - MIGRATION 0001: INITIAL SCHEMA
-- Didesain untuk PostgreSQL 15+ / Supabase
-- =====================================================================

-- Aktifkan ekstensi UUID (jika belum aktif)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. TABEL ADMINS
-- =====================================================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Terhubung ke auth.users(id) Supabase Auth
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'case_manager' CHECK (role IN ('super_admin', 'case_manager', 'counselor')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 2. TABEL REPORT_CATEGORIES
-- =====================================================================
CREATE TABLE IF NOT EXISTS report_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 3. TABEL REPORTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code VARCHAR(32) NOT NULL UNIQUE,
    category_id UUID NOT NULL REFERENCES report_categories(id) ON DELETE RESTRICT,
    incident_date DATE NOT NULL,
    incident_location VARCHAR(255) NOT NULL,
    chronology TEXT NOT NULL,
    identity_mode VARCHAR(20) NOT NULL DEFAULT 'anonymous' CHECK (identity_mode IN ('anonymous', 'identified')),
    reporter_name VARCHAR(150),
    reporter_contact VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'need_more_info', 'referred', 'resolved', 'closed')),
    assigned_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    privacy_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- =====================================================================
-- 4. TABEL REPORT_EVIDENCES
-- =====================================================================
CREATE TABLE IF NOT EXISTS report_evidences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    storage_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 5. TABEL REPORT_STATUS_HISTORIES
-- =====================================================================
CREATE TABLE IF NOT EXISTS report_status_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    changed_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    public_message TEXT,
    internal_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 6. TABEL EDUCATION_MATERIALS
-- =====================================================================
CREATE TABLE IF NOT EXISTS education_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url VARCHAR(255),
    cover_path VARCHAR(255),
    reading_minutes INTEGER NOT NULL DEFAULT 5,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 7. TABEL SUPPORT_RESOURCES
-- =====================================================================
CREATE TABLE IF NOT EXISTS support_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    resource_type VARCHAR(50) NOT NULL DEFAULT 'hotline' CHECK (resource_type IN ('hotline', 'counselor', 'medical', 'legal', 'foundation')),
    description TEXT NOT NULL,
    contact_name VARCHAR(150),
    phone VARCHAR(50),
    website_url VARCHAR(255),
    operating_hours VARCHAR(100),
    location VARCHAR(255),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 8. TABEL COUNSELING_SLOTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS counseling_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    session_mode VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (session_mode IN ('offline', 'online')),
    location VARCHAR(255),
    meeting_link VARCHAR(255),
    capacity INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 9. TABEL COUNSELING_BOOKINGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS counseling_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES counseling_slots(id) ON DELETE CASCADE,
    booking_code VARCHAR(32) NOT NULL UNIQUE,
    student_name VARCHAR(150) NOT NULL,
    contact_method VARCHAR(30) NOT NULL DEFAULT 'whatsapp' CHECK (contact_method IN ('whatsapp', 'email', 'telegram')),
    contact_value VARCHAR(150) NOT NULL,
    booking_status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled', 'completed')),
    privacy_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- INDEKS PERFORMA & INTEGRITAS
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_reports_tracking_code ON reports(tracking_code);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_evidences_report_id ON report_evidences(report_id);
CREATE INDEX IF NOT EXISTS idx_report_histories_report_id ON report_status_histories(report_id);
CREATE INDEX IF NOT EXISTS idx_education_slug ON education_materials(slug);
CREATE INDEX IF NOT EXISTS idx_education_category ON education_materials(category);
CREATE INDEX IF NOT EXISTS idx_counseling_slots_start_at ON counseling_slots(start_at);
CREATE INDEX IF NOT EXISTS idx_counseling_slots_status ON counseling_slots(status);
CREATE INDEX IF NOT EXISTS idx_counseling_bookings_booking_code ON counseling_bookings(booking_code);
