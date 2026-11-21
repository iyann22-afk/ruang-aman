-- =====================================================================
-- RUANGAMAN - MIGRATION 0003: ADMIN SESSIONS & SESSION SECURITY
-- Jalankan setelah 0002_week3_additions.sql
-- =====================================================================

-- =====================================================================
-- 1. TABEL ADMIN_SESSIONS (Session Security: Idle 15 Menit & Invalidation)
-- =====================================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index untuk pencarian cepat berdasarkan hash token dan admin_id
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_activity ON admin_sessions(last_activity_at);

-- =====================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =====================================================================
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_sessions_no_public_access" ON admin_sessions;

-- admin_sessions hanya boleh diakses melalui backend (service role bypass RLS)
CREATE POLICY "admin_sessions_no_public_access" ON admin_sessions
    FOR ALL USING (false);

-- =====================================================================
-- 3. FUNCTION & RPC: TOUCH/CREATE ADMIN SESSION
-- =====================================================================
-- Membuat atau memperbarui waktu aktivitas sesi petugas (heartbeat/login awal).
-- Menolak pembaruan jika sesi telah idle > 15 menit atau telah di-revoke.
CREATE OR REPLACE FUNCTION touch_admin_session(
    p_admin_id           UUID,
    p_auth_user_id       UUID,
    p_token_hash         VARCHAR(64),
    p_ip_address         VARCHAR(45) DEFAULT NULL,
    p_user_agent         TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_session     RECORD;
    v_now         TIMESTAMPTZ := NOW();
    v_idle_limit  INTERVAL := INTERVAL '15 minutes';
    v_result      JSONB;
BEGIN
    -- Cari sesi aktif berdasarkan token_hash
    SELECT * INTO v_session
    FROM admin_sessions
    WHERE session_token_hash = p_token_hash
    FOR UPDATE;

    IF FOUND THEN
        -- Cek apakah sesi sudah dicabut
        IF v_session.is_revoked THEN
            RAISE EXCEPTION 'SESSION_REVOKED: Sesi petugas telah dicabut atau dinonaktifkan'
                USING ERRCODE = 'P0020';
        END IF;

        -- Cek apakah sesi sudah idle melebihi 15 menit
        IF (v_now - v_session.last_activity_at) > v_idle_limit THEN
            -- Tandai sesi sebagai revoked/expired
            UPDATE admin_sessions
            SET is_revoked = TRUE
            WHERE id = v_session.id;

            RAISE EXCEPTION 'SESSION_IDLE_TIMEOUT: Sesi berakhir karena tidak ada aktivitas selama 15 menit'
                USING ERRCODE = 'P0021';
        END IF;

        -- Perbarui last_activity_at dan perpanjang expires_at
        UPDATE admin_sessions
        SET
            last_activity_at = v_now,
            expires_at       = v_now + v_idle_limit,
            ip_address       = COALESCE(p_ip_address, ip_address),
            user_agent       = COALESCE(p_user_agent, user_agent)
        WHERE id = v_session.id;

        SELECT row_to_json(s)::JSONB INTO v_result
        FROM admin_sessions s
        WHERE s.id = v_session.id;

        RETURN v_result;
    ELSE
        -- Buat sesi baru
        INSERT INTO admin_sessions (
            admin_id,
            auth_user_id,
            session_token_hash,
            ip_address,
            user_agent,
            last_activity_at,
            created_at,
            expires_at,
            is_revoked
        ) VALUES (
            p_admin_id,
            p_auth_user_id,
            p_token_hash,
            p_ip_address,
            p_user_agent,
            v_now,
            v_now,
            v_now + v_idle_limit,
            FALSE
        )
        RETURNING row_to_json(admin_sessions)::JSONB INTO v_result;

        RETURN v_result;
    END IF;
END;
$$;

-- =====================================================================
-- 4. FUNCTION & RPC: VALIDATE ADMIN SESSION (READ-ONLY CHECK)
-- =====================================================================
-- Memvalidasi sesi pada request API biasa TANPA memperbarui waktu aktivitas.
CREATE OR REPLACE FUNCTION validate_admin_session(
    p_token_hash VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_session     RECORD;
    v_now         TIMESTAMPTZ := NOW();
    v_idle_limit  INTERVAL := INTERVAL '15 minutes';
BEGIN
    SELECT * INTO v_session
    FROM admin_sessions
    WHERE session_token_hash = p_token_hash;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SESSION_NOT_FOUND: Sesi petugas tidak ditemukan'
            USING ERRCODE = 'P0022';
    END IF;

    IF v_session.is_revoked THEN
        RAISE EXCEPTION 'SESSION_REVOKED: Sesi petugas telah dicabut atau dinonaktifkan'
            USING ERRCODE = 'P0020';
    END IF;

    IF (v_now - v_session.last_activity_at) > v_idle_limit THEN
        UPDATE admin_sessions
        SET is_revoked = TRUE
        WHERE id = v_session.id;

        RAISE EXCEPTION 'SESSION_IDLE_TIMEOUT: Sesi berakhir karena tidak ada aktivitas selama 15 menit'
            USING ERRCODE = 'P0021';
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'id', v_session.id,
        'admin_id', v_session.admin_id,
        'last_activity_at', v_session.last_activity_at
    );
END;
$$;

-- =====================================================================
-- 4. FUNCTION & RPC: REVOKE ADMIN SESSIONS ON DEACTIVATION
-- =====================================================================
CREATE OR REPLACE FUNCTION revoke_admin_sessions(
    p_admin_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE admin_sessions
    SET is_revoked = TRUE
    WHERE admin_id = p_admin_id AND is_revoked = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- =====================================================================
-- SELESAI
-- =====================================================================
SELECT 'Migration 0003 Admin Sessions & Management berhasil diterapkan.' AS status;
