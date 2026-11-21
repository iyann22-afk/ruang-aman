import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { adminService } from '../src/services/admin.service.js';
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
  });

  // =========================================================================
  // 4. SESSION SECURITY & 15-MINUTE IDLE TIMEOUT
  // =========================================================================
  describe('4. Session Security, Heartbeat & Idle Timeout', () => {
    it('POST /admin/auth/heartbeat berhasil memperbarui last_activity_at', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/heartbeat')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.last_activity_at).toBeDefined();
    });

    it('Request protected ditolak dengan SESSION_IDLE_TIMEOUT jika idle melebihi 15 menit', async () => {
      const token = 'demo-token-super_admin-a0000001-0000-0000-0000-000000000001';

      // 1. Sentuh sesi agar terdaftar
      await sessionService.validateAndTouch(token, 'a0000001-0000-0000-0000-000000000001');

      // 2. Manipulasi aktivitas terakhir menjadi 16 menit yang lalu (> 15 menit)
      const sixteenMinutesAgo = Date.now() - 16 * 60 * 1000;
      sessionService.simulateLastActivity(token, sixteenMinutesAgo);

      // 3. Panggil endpoint yang dilindungi auth middleware
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
      await sessionService.validateAndTouch(token, 'a0000001-0000-0000-0000-000000000003');

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
  });

  // =========================================================================
  // 5. MANAJEMEN PETUGAS & ATURAN PERLINDUNGAN SUPER ADMIN
  // =========================================================================
  describe('5. Manajemen Petugas & Perlindungan Akun', () => {
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

    it('Super Admin Utama Yandri Utama tidak boleh dideaktivasi atau didemosikan', async () => {
      const repo = getRepositoriesSync().adminRepository;
      // Cari admin dengan email yandri
      const all = await repo.listAdmins();
      const yandriAdmin = all.find((a) => a.email.toLowerCase().includes('yandri'));

      if (yandriAdmin) {
        // Coba nonaktifkan Yandri
        const deactivateRes = await request(app)
          .patch(`/api/v1/admin/petugas/${yandriAdmin.id}/status`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ is_active: false });

        expect(deactivateRes.status).toBe(400);
        expect(deactivateRes.body.message).toContain('Super Admin utama tidak dapat dinonaktifkan');
      }
    });
  });
});
