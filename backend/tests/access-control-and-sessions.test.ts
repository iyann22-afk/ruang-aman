import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { adminService, PRIMARY_SUPER_ADMIN_ID } from '../src/services/admin.service.js';
import { sessionService } from '../src/services/session.service.js';
import { getRepositoriesSync } from '../src/repositories/repository.factory.js';

describe('Access Control, Admin Management & Session Security Tests', () => {
  // Tokens demo standar
  const superAdminToken = 'demo-token-super_admin-a0000001-0000-0000-0000-000000000001';
  const caseManagerToken = 'demo-token-case_manager-a0000001-0000-0000-0000-000000000003';
  const counselorToken = 'demo-token-counselor-a0000001-0000-0000-0000-000000000002';

  beforeEach(async () => {
    // Reset session cache & state sebelum tiap test
    sessionService.clearMemoryCache();
  });

  // =========================================================================
  // 1. SISTEM AKSES WEBSITE PUBLIK (TANPA LOGIN)
  // =========================================================================
  describe('1. Akses Website Publik Tanpa Autentikasi', () => {
    it('Harus mengizinkan akses ke kategori laporan tanpa token', async () => {
      const res = await request(app).get('/api/v1/public/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Harus mengizinkan membaca materi edukasi tanpa token', async () => {
      const res = await request(app).get('/api/v1/public/education');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Harus mengizinkan pembuatan laporan anonim tanpa login', async () => {
      const res = await request(app)
        .post('/api/v1/public/reports')
        .send({
          category_id: 'c0000001-0000-0000-0000-000000000001',
          incident_date: '2026-11-15',
          incident_location: 'Kantin Sekolah Lantai 1 Dekat Musholla',
          chronology: 'Terjadi perundungan verbal saat jam istirahat sekolah.',
          identity_mode: 'anonymous',
          privacy_acknowledged: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tracking_code).toBeDefined();
      expect(res.body.data.status).toBeDefined();

      // Verifikasi di database repository bahwa identitas benar-benar null (anonim total)
      const reportRepo = getRepositoriesSync().reportRepository;
      const savedReport = await reportRepo.findByTrackingCode(res.body.data.tracking_code);
      expect(savedReport?.reporter_user_id).toBeNull();
      expect(savedReport?.reporter_name).toBeNull();
      expect(savedReport?.reporter_contact).toBeNull();
    });

    it('Pelacakan publik tidak boleh membocorkan lokasi detail laporan', async () => {
      // 1. Buat laporan
      const createRes = await request(app)
        .post('/api/v1/public/reports')
        .send({
          category_id: 'c0000001-0000-0000-0000-000000000001',
          incident_date: '2026-11-15',
          incident_location: 'Gedung C Lantai 3 Ruang Laboratorium Biologi',
          chronology: 'Uji pelacakan privasi lokasi.',
          identity_mode: 'anonymous',
          privacy_acknowledged: true,
        });

      const trackingCode = createRes.body.data.tracking_code;

      // 2. Lacak via endpoint publik
      const trackRes = await request(app)
        .post('/api/v1/public/reports/track')
        .send({ tracking_code: trackingCode });

      expect(trackRes.status).toBe(200);
      expect(trackRes.body.success).toBe(true);
      // Lokasi detail tidak boleh dibocorkan ke publik
      expect(trackRes.body.data.incident_location).not.toContain('Laboratorium Biologi');
      expect(trackRes.body.data.incident_location).toContain('Dirahasiakan demi perlindungan');
    });

    it('Kode pelacakan tidak valid harus mengembalikan pesan aman (anti-enumerasi)', async () => {
      const res = await request(app)
        .post('/api/v1/public/reports/track')
        .send({ tracking_code: 'RA-TIDAK-ADA' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tidak ditemukan');
    });
  });

  // =========================================================================
  // 2. VERIFIKASI & PENAUTAN AKUN GOOGLE OAUTH OTOMATIS
  // =========================================================================
  describe('2. Verifikasi & Penautan Akun Google Petugas', () => {
    it('Endpoint /admin/auth/verify berhasil memvalidasi token petugas aktif', async () => {
      const res = await request(app)
        .get('/api/v1/admin/auth/verify')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.admin.role).toBe('super_admin');
      expect(res.body.admin.email).toBe('admin@ruangaman.id');
    });

    it('Endpoint /admin/auth/verify menolak request tanpa token', async () => {
      const res = await request(app).get('/api/v1/admin/auth/verify');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('adminService.verifyAndLinkAdmin menautkan auth_user_id jika email cocok dengan admin terdaftar', async () => {
      const repo = getRepositoriesSync().adminRepository;

      // Buat admin pending (belum tertaut Google OAuth)
      const pending = await repo.createAdmin({
        full_name: 'Guru BK Uji Coba',
        email: 'guru.bk.uji@ruangaman.id',
        role: 'counselor',
        is_active: true,
      });

      expect(pending.auth_user_id).toBeNull();

      // Simulasikan Google OAuth login pertama kali dengan email yang sama
      const googleAuthUserId = '550e8400-e29b-41d4-a716-446655440000';
      const linked = await adminService.verifyAndLinkAdmin(
        googleAuthUserId,
        'guru.bk.uji@ruangaman.id'
      );

      expect(linked.id).toBe(pending.id);
      expect(linked.auth_user_id).toBe(googleAuthUserId);

      // Verifikasi ulang: sekarang harus langsung ditemukan berdasarkan auth_user_id
      const found = await repo.findByAuthUserId(googleAuthUserId);
      expect(found).not.toBeNull();
      expect(found?.email).toBe('guru.bk.uji@ruangaman.id');
    });

    it('adminService.verifyAndLinkAdmin menolak email yang tidak terdaftar', async () => {
      await expect(
        adminService.verifyAndLinkAdmin('random-uuid', 'bukan.petugas@gmail.com')
      ).rejects.toThrow('tidak memiliki hak akses sebagai petugas');
    });

    it('adminService.verifyAndLinkAdmin menolak akun Google yang mencoba membajak email admin yang sudah tertaut', async () => {
      // Admin a0000001 sudah tertaut dengan auth_user_id u0000001
      await expect(
        adminService.verifyAndLinkAdmin('hacker-google-id', 'admin@ruangaman.id')
      ).rejects.toThrow('sudah terhubung dengan akun Google lain');
    });
  });

  // =========================================================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & RECORD-LEVEL ISOLATION
  // =========================================================================
  describe('3. Role-Based Access Control (RBAC)', () => {
    it('Super Admin berwenang mengelola data petugas (/admin/petugas)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/petugas')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Case Manager TIDAK berwenang mengelola petugas (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/petugas')
        .set('Authorization', `Bearer ${caseManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Akses ditolak');
    });

    it('Guru BK / Counselor TIDAK berwenang mengelola petugas (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/petugas')
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Counselor hanya menerima laporan yang ditugaskan kepada dirinya pada list', async () => {
      const reportRepo = getRepositoriesSync().reportRepository;

      const listRes = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);

      // Verifikasi seluruh item yang dikembalikan adalah laporan miliknya (counselor a0000001-0000-0000-0000-000000000002)
      const items = listRes.body.data.items;
      for (const item of items) {
        const fullReport = await reportRepo.findById(item.id);
        expect(fullReport?.assigned_admin_id).toBe('a0000001-0000-0000-0000-000000000002');
      }
    });

    it('Counselor ditolak (403) jika mencoba membaca detail laporan yang ditugaskan ke petugas lain', async () => {
      // r0000001 ditugaskan ke a0000001-0000-0000-0000-000000000003 (Case Manager), bukan counselor
      const res = await request(app)
        .get('/api/v1/admin/reports/r0000001-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('hanya dapat mengakses laporan yang ditugaskan');
    });

    it('Counselor ditolak (403) jika mencoba mengakses signed URL bukti kasus petugas lain', async () => {
      // ev000001 milik r0000001 (bukan kasus counselor)
      const res = await request(app)
        .get('/api/v1/admin/reports/r0000001-0000-0000-0000-000000000001/evidences/ev000001-0000-0000-0000-000000000001/url')
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tidak memiliki wewenang');
    });

    it('Counselor TIDAK dapat membocorkan data kasus petugas lain melalui Dashboard API', async () => {
      // Counselor memanggil GET /admin/dashboard/summary
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const counselorId = 'a0000001-0000-0000-0000-000000000002';
      const recentReports = res.body.data.recent_reports;

      // Semua recent_reports di dashboard konselor WAJIB memiliki assigned_admin_id miliknya
      for (const r of recentReports) {
        expect(r.assigned_admin_id).toBe(counselorId);
      }

      // Pastikan kasus petugas lain (r0000001 & r0000003) TIDAK bocor ke dashboard konselor
      const reportIds = recentReports.map((r: any) => r.id);
      expect(reportIds).not.toContain('r0000001-0000-0000-0000-000000000001');
      expect(reportIds).not.toContain('r0000001-0000-0000-0000-000000000003');

      // Riwayat status aktivitas recent_activities juga hanya berisi riwayat kasus miliknya
      const reportRepo = getRepositoriesSync().reportRepository;
      for (const act of res.body.data.recent_activities) {
        const fullReport = await reportRepo.findById(act.report_id);
        expect(fullReport?.assigned_admin_id).toBe(counselorId);
      }
    });

    it('Super Admin dan Case Manager dapat melihat seluruh ringkasan kasus di Dashboard API', async () => {
      const [superRes, caseRes] = await Promise.all([
        request(app).get('/api/v1/admin/dashboard/summary').set('Authorization', `Bearer ${superAdminToken}`),
        request(app).get('/api/v1/admin/dashboard/summary').set('Authorization', `Bearer ${caseManagerToken}`),
      ]);

      expect(superRes.status).toBe(200);
      expect(superRes.body.data.total_reports).toBeGreaterThanOrEqual(3);

      expect(caseRes.status).toBe(200);
      expect(caseRes.body.data.total_reports).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // 4. SESSION SECURITY, SEPARATION OF TOUCH & IDLE TIMEOUT
  // =========================================================================
  describe('4. Session Security, Heartbeat & Idle Timeout', () => {
    it('Request API biasa HANYA memvalidasi sesi dan TIDAK memperpanjang idle timeout', async () => {
      const token = 'demo-token-case_manager-a0000001-0000-0000-0000-000000000003';
      const adminId = 'a0000001-0000-0000-0000-000000000003';

      // 1. Sentuh sesi awal pada waktu 5 menit yang lalu
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      sessionService.simulateLastActivity(token, fiveMinutesAgo, adminId);

      const beforeActivity = sessionService.getLastActivityForTest(token, adminId);
      expect(beforeActivity).toBe(fiveMinutesAgo);

      // 2. Lakukan request API biasa (GET /admin/reports)
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // 3. Waktu aktivitas HARUS TETAP 5 menit yang lalu (tidak ter-reset otomatis oleh request biasa)
      const afterActivity = sessionService.getLastActivityForTest(token, adminId);
      expect(afterActivity).toBe(fiveMinutesAgo);
    });

    it('POST /admin/auth/heartbeat adalah satu-satunya yang memperbarui last_activity_at', async () => {
      const token = 'demo-token-case_manager-a0000001-0000-0000-0000-000000000003';
      const adminId = 'a0000001-0000-0000-0000-000000000003';

      const pastTime = Date.now() - 6 * 60 * 1000;
      sessionService.simulateLastActivity(token, pastTime, adminId);

      // Panggil heartbeat
      const heartbeatRes = await request(app)
        .post('/api/v1/admin/auth/heartbeat')
        .set('Authorization', `Bearer ${token}`);

      expect(heartbeatRes.status).toBe(200);
      expect(heartbeatRes.body.success).toBe(true);

      // Waktu aktivitas sekarang harus terbarui ke waktu saat ini (> pastTime)
      const updatedActivity = sessionService.getLastActivityForTest(token, adminId);
      expect(updatedActivity).toBeGreaterThan(pastTime);
    });

    it('Perubahan access token Supabase dengan session_id sama tidak mereset idle timer', async () => {
      // Simulasikan 2 token JWT Supabase dengan payload session_id identik (misal access token refresh)
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload1 = Buffer.from(
        JSON.stringify({ session_id: 'sess-uuid-fixed-1234', sub: 'user-001', exp: 1999999999 })
      ).toString('base64');
      const payload2 = Buffer.from(
        JSON.stringify({ session_id: 'sess-uuid-fixed-1234', sub: 'user-001', exp: 2999999999, refreshed: true })
      ).toString('base64');

      const tokenOld = `${headerB64}.${payload1}.signature1`;
      const tokenRefreshed = `${headerB64}.${payload2}.signature2`;

      // Keduanya harus menghasilkan sessionKey stabil yang sama
      const key1 = sessionService.getSessionKey(tokenOld);
      const key2 = sessionService.getSessionKey(tokenRefreshed);
      expect(key1).toBe('sb-session-sess-uuid-fixed-1234');
      expect(key2).toBe('sb-session-sess-uuid-fixed-1234');

      // Set waktu aktivitas tokenOld menjadi 10 menit yang lalu
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      sessionService.simulateLastActivity(tokenOld, tenMinutesAgo, 'a0000001-0000-0000-0000-000000000001');

      // Validasi menggunakan tokenRefreshed
      const validateResult = await sessionService.validateSession(
        tokenRefreshed,
        'a0000001-0000-0000-0000-000000000001'
      );
      expect(validateResult.valid).toBe(true);

      // Waktu aktivitas sesi tidak ter-reset ke 0
      const activityFromToken2 = sessionService.getLastActivityForTest(tokenRefreshed, 'a0000001-0000-0000-0000-000000000001');
      expect(activityFromToken2).toBe(tenMinutesAgo);
    });

    it('Request protected ditolak dengan SESSION_IDLE_TIMEOUT jika idle melebihi 15 menit', async () => {
      const token = 'demo-token-super_admin-a0000001-0000-0000-0000-000000000001';
      const adminId = 'a0000001-0000-0000-0000-000000000001';

      // Manipulasi aktivitas terakhir menjadi 16 menit yang lalu (> 15 menit)
      const sixteenMinutesAgo = Date.now() - 16 * 60 * 1000;
      sessionService.simulateLastActivity(token, sixteenMinutesAgo, adminId);

      // Panggil endpoint yang dilindungi auth middleware
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('SESSION_IDLE_TIMEOUT');
    });

    it('POST /admin/auth/logout mencabut sesi aktif secara instan', async () => {
      const token = caseManagerToken;

      // 1. Sentuh sesi awal
      await sessionService.touchSession(token, 'a0000001-0000-0000-0000-000000000003');

      // 2. Panggil logout
      const logoutRes = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // 3. Request berikutnya harus ditolak (SESSION_REVOKED)
      const nextRes = await request(app)
        .get('/api/v1/admin/dashboard/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(nextRes.status).toBe(401);
      expect(nextRes.body.code).toBe('SESSION_REVOKED');
    });

    it('Mode production/USE_SUPABASE menolak sesi secara fail-closed jika Supabase client tidak tersedia', async () => {
      const originalEnv = process.env.USE_SUPABASE;
      process.env.USE_SUPABASE = 'true';

      try {
        const val = await sessionService.validateSession(
          'some-token',
          'a0000001-0000-0000-0000-000000000001'
        );
        // Harus fail-closed (valid: false) tanpa bocor credential
        expect(val.valid).toBe(false);
        expect(val.message).not.toContain('secret');
        expect(val.message).not.toContain('token');
      } finally {
        process.env.USE_SUPABASE = originalEnv;
      }
    });
  });

  // =========================================================================
  // 5. MANAJEMEN PETUGAS, SUPER ADMIN UTAMA & KONSISTENSI PERMISSION
  // =========================================================================
  describe('5. Manajemen Petugas, Super Admin Utama & Permission', () => {
    it('Super Admin dapat mendaftarkan petugas baru', async () => {
      const uniqueEmail = `petugas.${Date.now()}@ruangaman.id`;
      const res = await request(app)
        .post('/api/v1/admin/petugas')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          full_name: 'Petugas Satgas Baru',
          email: uniqueEmail,
          role: 'case_manager',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(uniqueEmail);
      expect(res.body.data.role).toBe('case_manager');
      expect(res.body.data.auth_user_id).toBeNull();
    });

    it('Super Admin dapat mengubah peran petugas lain', async () => {
      // Ubah a0000001-0000-0000-0000-000000000002 (Guru BK) menjadi case_manager
      const res = await request(app)
        .patch('/api/v1/admin/petugas/a0000001-0000-0000-0000-000000000002/role')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: 'case_manager' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('case_manager');

      // Kembalikan ke counselor agar test isolasi tetap terjaga
      await getRepositoriesSync().adminRepository.updateAdmin('a0000001-0000-0000-0000-000000000002', { role: 'counselor' });
    });

    it('Super Admin tidak boleh mendemosikan perannya sendiri', async () => {
      // a0000001 adalah Super Admin yang sedang login
      const res = await request(app)
        .patch('/api/v1/admin/petugas/a0000001-0000-0000-0000-000000000001/role')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: 'counselor' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Anda tidak dapat mencabut peran Super Admin');
    });

    it('Super Admin tidak boleh menonaktifkan akunnya sendiri', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/petugas/a0000001-0000-0000-0000-000000000001/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ is_active: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tidak dapat menonaktifkan akun Anda sendiri');
    });

    it('Super Admin Utama (7beabfb4-5d19-4c6a-85eb-ba5e8073675e) tidak dapat dinonaktifkan atau didemosikan', async () => {
      expect(PRIMARY_SUPER_ADMIN_ID).toBe('7beabfb4-5d19-4c6a-85eb-ba5e8073675e');

      // 1. Coba nonaktifkan Super Admin utama
      const deactivateRes = await request(app)
        .patch(`/api/v1/admin/petugas/${PRIMARY_SUPER_ADMIN_ID}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ is_active: false });

      expect(deactivateRes.status).toBe(400);
      expect(deactivateRes.body.message).toContain('Super Admin utama tidak dapat dinonaktifkan');

      // 2. Coba demote Super Admin utama
      const demoteRes = await request(app)
        .patch(`/api/v1/admin/petugas/${PRIMARY_SUPER_ADMIN_ID}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: 'counselor' });

      expect(demoteRes.status).toBe(400);
      expect(demoteRes.body.message).toContain('Super Admin utama tidak dapat diubah atau diturunkan');
    });

    it('Penonaktifan petugas mencabut seluruh sesi aktif petugas tersebut', async () => {
      const targetOfficerId = 'a0000001-0000-0000-0000-000000000003';
      const officerToken = 'demo-token-case_manager-a0000001-0000-0000-0000-000000000003';

      // 1. Aktifkan sesi petugas target
      await sessionService.touchSession(officerToken, targetOfficerId);

      // 2. Super Admin menonaktifkan akun petugas target
      const deactRes = await request(app)
        .patch(`/api/v1/admin/petugas/${targetOfficerId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ is_active: false });

      expect(deactRes.status).toBe(200);

      // 3. Request selanjutnya dari petugas tersebut harus ditolak (sesi dicabut / akun nonaktif)
      const testRes = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(testRes.status).toBe(401);

      // Pulihkan kembali akun untuk test lain
      await getRepositoriesSync().adminRepository.updateAdmin(targetOfficerId, { is_active: true });
    });

    it('Konsistensi Permission: Counselor hanya memiliki izin kasus ditugaskan dan konseling', async () => {
      const profile = await adminService.getProfile('a0000001-0000-0000-0000-000000000002');
      expect(profile.permissions).toContain('assigned_reports_read');
      expect(profile.permissions).toContain('assigned_reports_write');
      expect(profile.permissions).toContain('manage_counseling');

      // TIDAK boleh memiliki izin global
      expect(profile.permissions).not.toContain('all_reports_read');
      expect(profile.permissions).not.toContain('all_reports_write');
      expect(profile.permissions).not.toContain('manage_users');
      expect(profile.permissions).not.toContain('view_audit_trail');
    });

    it('Konsistensi Permission: Case Manager tidak memiliki izin manage_users', async () => {
      const profile = await adminService.getProfile('a0000001-0000-0000-0000-000000000003');
      expect(profile.permissions).toContain('all_reports_read');
      expect(profile.permissions).toContain('all_reports_write');
      expect(profile.permissions).toContain('view_audit_trail');
      expect(profile.permissions).not.toContain('manage_users');
    });

    it('Konsistensi Permission: Super Admin memiliki akses penuh termasuk manage_users', async () => {
      const profile = await adminService.getProfile('a0000001-0000-0000-0000-000000000001');
      expect(profile.permissions).toContain('all_reports_read');
      expect(profile.permissions).toContain('all_reports_write');
      expect(profile.permissions).toContain('manage_users');
      expect(profile.permissions).toContain('view_audit_trail');
    });
  });

  // =========================================================================
  // 6. FINAL SESSION SECURITY HARDENING: REVOCATION, CONCURRENCY & RPC
  // =========================================================================
  describe('6. Hardened Session Revocation, Concurrency & RPC Handling', () => {
    it('1. Logout gagal (HTTP 500) jika backend/database gagal mencabut sesi (fail-closed)', async () => {
      // Mock revokeSession untuk mensimulasikan kegagalan database
      const revokeSpy = vi.spyOn(sessionService, 'revokeSession').mockRejectedValueOnce(
        new Error('Database connection failed during session revocation')
      );

      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Gagal mencabut sesi keamanan');

      revokeSpy.mockRestore();
    });

    it('2. RPC revoke mengembalikan error dan error tersebut ditangani secara fail-closed', async () => {
      const originalEnv = process.env.USE_SUPABASE;
      process.env.USE_SUPABASE = 'true';

      try {
        // Pada mode enforce Supabase tanpa database terkoneksi, revokeAllSessionsForAdmin harus fail-closed (reject)
        await expect(sessionService.revokeAllSessionsForAdmin('test-admin-id')).rejects.toThrow();
      } finally {
        process.env.USE_SUPABASE = originalEnv;
      }
    });

    it('3. Penonaktifan petugas tidak mengizinkan petugas tetap menggunakan endpoint', async () => {
      const targetOfficerId = 'a0000001-0000-0000-0000-000000000002';
      const officerToken = counselorToken;

      // 1. Nonaktifkan petugas via Super Admin
      const deactRes = await request(app)
        .patch(`/api/v1/admin/petugas/${targetOfficerId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ is_active: false });

      expect(deactRes.status).toBe(200);

      // 2. Petugas mencoba mengakses endpoint yang dilindungi
      const accessRes = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(accessRes.status).toBe(401);
      expect(accessRes.body.success).toBe(false);
      expect(accessRes.body.message).toContain('tidak aktif');

      // 3. Pulihkan kembali akun petugas untuk test lain
      await getRepositoriesSync().adminRepository.updateAdmin(targetOfficerId, { is_active: true });
    });

    it('4. Dua request touch bersamaan tidak membuat duplicate session', async () => {
      sessionService.resetForTest();
      const concurrentToken = 'demo-token-counselor-concurrent-race-test';
      const adminId = 'a0000001-0000-0000-0000-000000000002';

      // Jalankan 2 request touch secara bersamaan
      const [res1, res2] = await Promise.all([
        sessionService.touchSession(concurrentToken, adminId),
        sessionService.touchSession(concurrentToken, adminId),
      ]);

      expect(res1.valid).toBe(true);
      expect(res2.valid).toBe(true);

      // Pastikan hanya 1 record sesi yang tersimpan untuk session_token_hash tersebut
      expect(sessionService.getSessionCountForTest()).toBe(1);
    });

    it('5. Session refresh tidak mengubah identitas sesi dan perangkat berbeda tidak tercampur', () => {
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');

      // Sesi Perangkat 1
      const p1 = Buffer.from(JSON.stringify({ session_id: 'session-dev-1', sub: 'user-uuid-common' })).toString('base64');
      const p1Refreshed = Buffer.from(JSON.stringify({ session_id: 'session-dev-1', sub: 'user-uuid-common', exp: 9999999 })).toString('base64');

      // Sesi Perangkat 2 (user sama, perangkat berbeda)
      const p2 = Buffer.from(JSON.stringify({ session_id: 'session-dev-2', sub: 'user-uuid-common' })).toString('base64');

      const tokenDev1 = `${headerB64}.${p1}.sig1`;
      const tokenDev1Refreshed = `${headerB64}.${p1Refreshed}.sig2`;
      const tokenDev2 = `${headerB64}.${p2}.sig3`;

      // 1. Refreshed token harus memiliki sessionKey identik dengan token asli
      expect(sessionService.getSessionKey(tokenDev1)).toBe('sb-session-session-dev-1');
      expect(sessionService.getSessionKey(tokenDev1Refreshed)).toBe('sb-session-session-dev-1');

      // 2. Perangkat 2 harus memiliki sessionKey berbeda meski authUserId (sub) sama
      expect(sessionService.getSessionKey(tokenDev2)).toBe('sb-session-session-dev-2');
      expect(sessionService.getSessionKey(tokenDev1)).not.toBe(sessionService.getSessionKey(tokenDev2));

      // 3. Token tanpa session_id tidak menggunakan sub sebagai fallback agar tidak tercampur
      const pNoSessionA = Buffer.from(JSON.stringify({ sub: 'user-uuid-common', nonce: 'A' })).toString('base64');
      const pNoSessionB = Buffer.from(JSON.stringify({ sub: 'user-uuid-common', nonce: 'B' })).toString('base64');
      const tokenNoSessA = `${headerB64}.${pNoSessionA}.sigA`;
      const tokenNoSessB = `${headerB64}.${pNoSessionB}.sigB`;

      const keyA = sessionService.getSessionKey(tokenNoSessA);
      const keyB = sessionService.getSessionKey(tokenNoSessB);
      expect(keyA).not.toBe(keyB);
      expect(keyA).not.toContain('user-uuid-common');
    });

    it('6. Sesi expired tetap ditolak dan statusnya konsisten tercatat revoked', async () => {
      const expiredToken = 'demo-token-expired-test-officer';
      const adminId = 'a0000001-0000-0000-0000-000000000003';

      // Sentuh sesi 20 menit yang lalu
      const twentyMinsAgo = Date.now() - 20 * 60 * 1000;
      sessionService.simulateLastActivity(expiredToken, twentyMinsAgo, adminId);

      // Validasi sesi
      const valResult = await sessionService.validateSession(expiredToken, adminId);
      expect(valResult.valid).toBe(false);
      expect(valResult.code).toBe('SESSION_IDLE_TIMEOUT');

      // Validasi berikutnya harus langsung ditolak sebagai SESSION_REVOKED
      const subsequentVal = await sessionService.validateSession(expiredToken, adminId);
      expect(subsequentVal.valid).toBe(false);
      expect(subsequentVal.code).toBe('SESSION_REVOKED');
    });

    it('7. Validasi biasa tidak memperpanjang idle time sedangkan heartbeat memperpanjang', async () => {
      const testToken = 'demo-token-idle-timer-comparison';
      const adminId = 'a0000001-0000-0000-0000-000000000001';

      // 1. Sentuh sesi pada T0 (7 menit lalu)
      const t0 = Date.now() - 7 * 60 * 1000;
      sessionService.simulateLastActivity(testToken, t0, adminId);
      expect(sessionService.getLastActivityForTest(testToken, adminId)).toBe(t0);

      // 2. Validasi sesi biasa -> lastActivityAt HARUS TETAP T0
      await sessionService.validateSession(testToken, adminId);
      expect(sessionService.getLastActivityForTest(testToken, adminId)).toBe(t0);

      // 3. Heartbeat / touch -> lastActivityAt HARUS DIPERBARUI (> T0)
      await sessionService.touchSession(testToken, adminId);
      const t1 = sessionService.getLastActivityForTest(testToken, adminId);
      expect(t1).toBeGreaterThan(t0);
    });
  });
});
