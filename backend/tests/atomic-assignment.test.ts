import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';
import { MockReportRepository } from '../src/repositories/mock/report.repository.js';
import { SupabaseReportRepository } from '../src/repositories/supabase/supabase-report.repository.js';
import { supabaseAdmin } from '../src/repositories/supabase/supabase.client.js';
import { reportService } from '../src/services/report.service.js';
import { Admin, Report } from '../src/types/index.js';

describe('Audit & Integritas Penugasan Laporan (Atomic Report Assignment & RBAC)', () => {
  let superAdminToken = '';
  let caseManagerToken = '';
  let counselorToken = '';

  const superAdminId = 'a0000001-0000-0000-0000-000000000001';
  const counselorId = 'a0000001-0000-0000-0000-000000000002';
  const caseManagerId = 'a0000001-0000-0000-0000-000000000003';

  let testReportId = '';

  beforeAll(async () => {
    // 1. Login Super Admin
    const superRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@ruangaman.id', password: 'PasswordDemo123!' });
    expect(superRes.status).toBe(200);
    superAdminToken = superRes.body.data.token;

    // 2. Login Case Manager
    const caseRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'casemanager@ruangaman.id', password: 'PasswordDemo123!' });
    expect(caseRes.status).toBe(200);
    caseManagerToken = caseRes.body.data.token;

    // 3. Login Counselor
    const counRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'counselor@ruangaman.id', password: 'PasswordDemo123!' });
    expect(counRes.status).toBe(200);
    counselorToken = counRes.body.data.token;

    // Ambil sample laporan untuk pengujian
    const listRes = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);
    testReportId = listRes.body.data.items[0].id;
  });

  // =========================================================================
  // 1. Penugasan baru menyimpan assigned_admin_id dan histori
  // =========================================================================
  it('1. Penugasan baru menyimpan assigned_admin_id dan histori audit', async () => {
    const notes = 'Penugasan awal untuk pendampingan konseling korban.';
    const res = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        assigned_admin_id: counselorId,
        notes,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assigned_admin_id).toBe(counselorId);

    // Verifikasi histori penugasan tersimpan
    const histories = await reportService.getAssignmentHistories(testReportId);
    expect(histories.length).toBeGreaterThanOrEqual(1);
    const latestHistory = histories[0];
    expect(latestHistory.report_id).toBe(testReportId);
    expect(latestHistory.assigned_admin_id).toBe(counselorId);
    expect(latestHistory.notes).toBe(notes);
    expect(latestHistory.created_at).toBeDefined();
  });

  // =========================================================================
  // 2. Reassignment mencatat perubahan penanggung jawab
  // =========================================================================
  it('2. Reassignment mencatat perubahan penanggung jawab pada histori audit', async () => {
    // Buat counselor kedua untuk pengujian reassignment
    const newCounselorRes = await request(app)
      .post('/api/v1/admin/petugas')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        full_name: 'Dra. Endang Sulastri, M.Pd.',
        email: 'endang.counselor@ruangaman.id',
        role: 'counselor',
        is_active: true,
      });
    expect(newCounselorRes.status).toBe(201);
    const secondCounselorId = newCounselorRes.body.data.id;

    // Case Manager melakukan reassignment ke counselor kedua
    const reassignNotes = 'Pengalihan penanganan kasus ke Guru BK kedua karena spesialisasi.';
    const res = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${caseManagerToken}`)
      .send({
        assigned_admin_id: secondCounselorId,
        notes: reassignNotes,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assigned_admin_id).toBe(secondCounselorId);

    // Periksa riwayat audit: harus ada entri baru dengan secondCounselorId
    const histories = await reportService.getAssignmentHistories(testReportId);
    expect(histories.length).toBeGreaterThanOrEqual(2);
    expect(histories[0].assigned_admin_id).toBe(secondCounselorId);
    expect(histories[0].notes).toBe(reassignNotes);
  });

  // =========================================================================
  // 3. Pencabutan penugasan mencatat assigned_admin_id null
  // =========================================================================
  it('3. Pencabutan penugasan mencatat assigned_admin_id null pada laporan dan histori audit', async () => {
    const unassignNotes = 'Pencabutan penugasan karena kasus memasuki evaluasi bersama.';
    const res = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        assigned_admin_id: null,
        notes: unassignNotes,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assigned_admin_id).toBeNull();

    // Verifikasi histori mencatat pencabutan (assigned_admin_id null)
    const histories = await reportService.getAssignmentHistories(testReportId);
    expect(histories[0].assigned_admin_id).toBeNull();
    expect(histories[0].notes).toBe(unassignNotes);

    // Kembalikan ke counselorId pertama untuk konsistensi
    await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ assigned_admin_id: counselorId });
  });

  // =========================================================================
  // 4. Gagal menyimpan histori harus menggagalkan seluruh transaksi (Atomisitas)
  // =========================================================================
  it('4. Gagal menyimpan histori / RPC error menggagalkan seluruh transaksi secara fail-closed', async () => {
    const supabaseRepo = new SupabaseReportRepository();

    if (supabaseAdmin) {
      // Simulasikan kegagalan transaksi PostgreSQL pada RPC assign_report_with_history
      const rpcSpy = vi.spyOn(supabaseAdmin, 'rpc').mockResolvedValueOnce({
        data: null,
        error: {
          message: 'DATABASE_ERROR: Gagal menyimpan histori audit transaksi',
          code: '42000',
          details: null,
          hint: null,
        },
      } as any);

      try {
        await expect(
          supabaseRepo.assignReport(testReportId, counselorId, superAdminId, 'Catatan')
        ).rejects.toThrow('Gagal menugaskan laporan: DATABASE_ERROR');
      } finally {
        rpcSpy.mockRestore();
      }
    }
  });

  // =========================================================================
  // 5. Jika transaksi gagal, assigned_admin_id tidak boleh berubah
  // =========================================================================
  it('5. Jika operasi penugasan gagal, assigned_admin_id tidak boleh berubah', async () => {
    // Ambil kondisi sebelum transaksi gagal
    const beforeRes = await request(app)
      .get(`/api/v1/admin/reports/${testReportId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(beforeRes.status).toBe(200);
    const initialAssignedAdminId = beforeRes.body.data.assigned_admin_id;

    // Lakukan request penugasan yang gagal (ID petugas tidak valid)
    const failRes = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        assigned_admin_id: '00000000-0000-0000-0000-000000000099', // id fiktif
      });
    expect(failRes.status).toBe(404);

    // Verifikasi bahwa status penugasan laporan tidak berubah sama sekali
    const afterRes = await request(app)
      .get(`/api/v1/admin/reports/${testReportId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(afterRes.status).toBe(200);
    expect(afterRes.body.data.assigned_admin_id).toBe(initialAssignedAdminId);
  });

  // =========================================================================
  // 6. Counselor tidak boleh melakukan penugasan (HTTP 403)
  // =========================================================================
  it('6. Counselor DITOLAK (HTTP 403) saat mencoba menugaskan laporan', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${counselorToken}`)
      .send({
        assigned_admin_id: counselorId,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Akses ditolak');
  });

  // =========================================================================
  // 7. Petugas nonaktif tidak boleh ditugaskan (HTTP 400)
  // =========================================================================
  it('7. Petugas nonaktif tidak boleh ditugaskan (HTTP 400)', async () => {
    // Buat counselor berstatus tidak aktif
    const inactiveRes = await request(app)
      .post('/api/v1/admin/petugas')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        full_name: 'Konselor Pensiun, S.Psi.',
        email: 'pensiun.counselor@ruangaman.id',
        role: 'counselor',
        is_active: false,
      });
    expect(inactiveRes.status).toBe(201);
    const inactiveId = inactiveRes.body.data.id;

    const assignRes = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        assigned_admin_id: inactiveId,
      });

    expect(assignRes.status).toBe(400);
    expect(assignRes.body.success).toBe(false);
    expect(assignRes.body.message).toContain('tidak aktif');
  });

  // =========================================================================
  // 8. Hanya Super Admin dan Case Manager yang dapat menjalankan operasi ini
  // =========================================================================
  it('8. Matriks RBAC penugasan: Super Admin (200), Case Manager (200), Counselor (403), Non-admin (401)', async () => {
    // 8a. Super Admin -> Berhasil (HTTP 200)
    const superRes = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ assigned_admin_id: counselorId });
    expect(superRes.status).toBe(200);

    // 8b. Case Manager -> Berhasil (HTTP 200)
    const caseRes = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${caseManagerToken}`)
      .send({ assigned_admin_id: counselorId });
    expect(caseRes.status).toBe(200);

    // 8c. Counselor -> Ditolak (HTTP 403)
    const counRes = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .set('Authorization', `Bearer ${counselorToken}`)
      .send({ assigned_admin_id: counselorId });
    expect(counRes.status).toBe(403);

    // 8d. Tanpa Autentikasi -> Ditolak (HTTP 401)
    const anonRes = await request(app)
      .patch(`/api/v1/admin/reports/${testReportId}/assign`)
      .send({ assigned_admin_id: counselorId });
    expect(anonRes.status).toBe(401);
  });
});
