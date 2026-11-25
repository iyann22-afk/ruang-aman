-- =====================================================================
-- 0005_report_assignments.sql
-- TABEL AUDIT PENUGASAN LAPORAN (REPORT ASSIGNMENTS)
-- Menjamin akuntabilitas penugasan kasus dari Super Admin / Case Manager
-- ke Guru Bimbingan Konseling (Counselor).
-- =====================================================================

CREATE TABLE IF NOT EXISTS report_assignment_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    assigned_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    assigned_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks untuk pencarian cepat riwayat penugasan berdasarkan laporan dan petugas
CREATE INDEX IF NOT EXISTS idx_report_assignment_report_id ON report_assignment_histories(report_id);
CREATE INDEX IF NOT EXISTS idx_report_assignment_assigned_admin ON report_assignment_histories(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_report_assignment_assigned_by ON report_assignment_histories(assigned_by_admin_id);

-- Aktifkan RLS untuk tabel audit penugasan
ALTER TABLE report_assignment_histories ENABLE ROW LEVEL SECURITY;
