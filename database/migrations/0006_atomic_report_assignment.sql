-- =====================================================================
-- 0006_atomic_report_assignment.sql
-- FUNGSI ATOMIK PENUGASAN LAPORAN + RIWAYAT AUDIT (SECURITY INVOKER)
-- Menjamin pembaruan penugasan laporan dan pencatatan histori penugasan
-- dieksekusi dalam satu transaksi atomik konsisten (ACID).
-- =====================================================================

-- Pastikan policy perlindungan publik pada report_assignment_histories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'report_assignment_histories' 
        AND policyname = 'report_assignment_histories_no_public_access'
    ) THEN
        CREATE POLICY "report_assignment_histories_no_public_access" ON report_assignment_histories
            FOR ALL USING (false);
    END IF;
END $$;

-- =====================================================================
-- RPC ATOMIK: assign_report_with_history
-- Update penugasan laporan dan catat riwayat audit dalam satu transaksi.
-- Menggunakan SECURITY INVOKER (bukan DEFINER) dan hanya diizinkan
-- untuk dieksekusi oleh service_role backend.
-- =====================================================================
CREATE OR REPLACE FUNCTION assign_report_with_history(
    p_report_id           UUID,
    p_assigned_admin_id   UUID DEFAULT NULL,
    p_assigned_by_admin_id UUID DEFAULT NULL,
    p_notes               TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_report RECORD;
    v_result JSONB;
BEGIN
    -- 1. Validasi keberadaan laporan dan kunci baris untuk konsistensi transaksi (FOR UPDATE)
    SELECT * INTO v_report FROM reports WHERE id = p_report_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'REPORT_NOT_FOUND: Laporan tidak ditemukan' USING ERRCODE = 'P0010';
    END IF;

    -- 2. Validasi petugas yang ditugaskan jika ada (harus terdaftar dan aktif)
    IF p_assigned_admin_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM admins WHERE id = p_assigned_admin_id AND is_active = true) THEN
            RAISE EXCEPTION 'ADMIN_NOT_FOUND_OR_INACTIVE: Petugas yang ditugaskan tidak ditemukan atau tidak aktif' USING ERRCODE = 'P0011';
        END IF;
    END IF;

    -- 3. Validasi petugas penugas jika ada (harus terdaftar dan aktif)
    IF p_assigned_by_admin_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM admins WHERE id = p_assigned_by_admin_id AND is_active = true) THEN
            RAISE EXCEPTION 'ASSIGNER_NOT_FOUND_OR_INACTIVE: Petugas penugasan tidak ditemukan atau tidak aktif' USING ERRCODE = 'P0012';
        END IF;
    END IF;

    -- 4. Perbarui laporan dengan petugas baru (atau NULL untuk pencabutan)
    UPDATE reports
    SET assigned_admin_id = p_assigned_admin_id,
        updated_at = NOW()
    WHERE id = p_report_id;

    -- 5. Masukkan catatan ke riwayat audit penugasan
    INSERT INTO report_assignment_histories (
        id,
        report_id,
        assigned_admin_id,
        assigned_by_admin_id,
        notes,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_report_id,
        p_assigned_admin_id,
        p_assigned_by_admin_id,
        p_notes,
        NOW()
    );

    -- 6. Kembalikan data baris laporan terbaru sebagai JSONB
    SELECT row_to_json(r)::JSONB INTO v_result FROM reports r WHERE r.id = p_report_id;
    RETURN v_result;
END;
$$;

-- Cabut seluruh hak eksekusi dari publik dan role anon/authenticated
REVOKE ALL ON FUNCTION assign_report_with_history(UUID, UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION assign_report_with_history(UUID, UUID, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION assign_report_with_history(UUID, UUID, UUID, TEXT) FROM authenticated;

-- Berikan izin eksekusi hanya ke service_role sesuai kebutuhan backend
GRANT EXECUTE ON FUNCTION assign_report_with_history(UUID, UUID, UUID, TEXT) TO service_role;
