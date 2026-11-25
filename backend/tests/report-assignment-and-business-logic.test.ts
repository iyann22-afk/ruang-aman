import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { generateTrackingCode } from '../src/utils/entropy.js';

describe('RUANGAMAN Business Logic, Report Assignment & Security Tests', () => {
  let superAdminToken = '';
  let caseManagerToken = '';
  let counselorToken = '';

  const counselorId = 'a0000001-0000-0000-0000-000000000002'; // Budi Santoso, counselor
  let assignedReportId = '';
  let unassignedReportId = '';
  let createdTrackingCode = '';

  beforeAll(async () => {
    // 1. Login as Super Admin (Dra. Hj. Nurul Hidayati)
    const superRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@ruangaman.id', password: 'PasswordDemo123!' });
    expect(superRes.status).toBe(200);
    superAdminToken = superRes.body.data.token;

    // 2. Login as Case Manager (Siti Rahmawati)
    const caseRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'casemanager@ruangaman.id', password: 'PasswordDemo123!' });
    expect(caseRes.status).toBe(200);
    caseManagerToken = caseRes.body.data.token;

    // 3. Login as Counselor (Budi Santoso)
    const counRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'counselor@ruangaman.id', password: 'PasswordDemo123!' });
    expect(counRes.status).toBe(200);
    counselorToken = counRes.body.data.token;
  });

  // =========================================================================
  // SECTION 1: Tracking Code Format Consistency & Cryptographic Generator
  // =========================================================================
  describe('1. Tracking Code Format & Public Roundtrip', () => {
    it('generateTrackingCode() harus menghasilkan format RA-YYYY-[A-Z0-9]{6}', () => {
      const code = generateTrackingCode();
      const year = new Date().getFullYear();
      expect(code).toMatch(new RegExp(`^RA-${year}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$`));
      expect(code.length).toBe(14);
    });

    it('Submit report via public API harus menghasilkan tracking code RA-YYYY-XXXXXX', async () => {
      // Dapatkan salah satu kategori yang valid
      const catRes = await request(app).get('/api/v1/public/categories');
      expect(catRes.status).toBe(200);
      const categoryId = catRes.body.data[0].id;

      const res = await request(app)
        .post('/api/v1/public/reports')
        .send({
          category_id: categoryId,
          incident_date: '2026-11-20',
          incident_location: 'Gedung Olahraga Sekolah',
          chronology: 'Terjadi pemalakan dan ancaman kekerasan saat jam istirahat kedua.',
          identity_mode: 'anonymous',
          privacy_acknowledged: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tracking_code).toBeDefined();

      const year = new Date().getFullYear();
      expect(res.body.data.tracking_code).toMatch(
        new RegExp(`^RA-${year}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$`)
      );

      createdTrackingCode = res.body.data.tracking_code;
    });

    it('Public tracking dengan kode pelacakan yang baru dibuat berhasil dan TIDAK membocorkan privasi', async () => {
      const res = await request(app)
        .post('/api/v1/public/reports/track')
        .send({ tracking_code: createdTrackingCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const tracked = res.body.data;
      expect(tracked.tracking_code).toBe(createdTrackingCode);
      expect(tracked.status).toBe('submitted');
      expect(tracked.category_name).toBeDefined();
      expect(tracked.created_at).toBeDefined();
      expect(Array.isArray(tracked.timeline)).toBe(true);

      // VERIFIKASI KEAMANAN: Field rahasia DILARANG ada pada respons publik
      expect(tracked.reporter_name).toBeUndefined();
      expect(tracked.reporter_contact).toBeUndefined();
      expect(tracked.chronology).toBeUndefined();
      expect(tracked.internal_note).toBeUndefined();
      expect(tracked.assigned_admin_id).toBeUndefined();
      expect(tracked.evidences).toBeUndefined();

      // Timeline publik hanya memuat public_message, bukan internal_note
      tracked.timeline.forEach((item: any) => {
        expect(item.internal_note).toBeUndefined();
      });
    });

    it('Public tracking dengan kode yang tidak ditemukan mengembalikan HTTP 404', async () => {
      const res = await request(app)
        .post('/api/v1/public/reports/track')
        .send({ tracking_code: 'RA-2026-NOTFOUND' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('tidak ditemukan');
    });
  });

  // =========================================================================
  // SECTION 2: Report Assignment to Guru BK (Counselor)
  // =========================================================================
  describe('2. Logika Penugasan Laporan ke Guru BK', () => {
    beforeAll(async () => {
      // Ambil daftar laporan untuk mendapatkan sample IDs
      const listRes = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(2);

      assignedReportId = listRes.body.data.items[0].id;
      unassignedReportId = listRes.body.data.items[1].id;
    });

    it('Super Admin berhasil menugaskan laporan ke Guru BK aktif', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          assigned_admin_id: counselorId,
          notes: 'Tolong dampingi korban saat konseling awal.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assigned_admin_id).toBe(counselorId);

      // Verifikasi detail laporan mencerminkan penugasan dan nama petugas
      const detailRes = await request(app)
        .get(`/api/v1/admin/reports/${assignedReportId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.assigned_admin_id).toBe(counselorId);
      expect(detailRes.body.data.assigned_admin).toBeDefined();
      expect(detailRes.body.data.assigned_admin.id).toBe(counselorId);
    });

    it('Case Manager berhasil melakukan penugasan ulang (reassignment) laporan', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${caseManagerToken}`)
        .send({
          assigned_admin_id: counselorId,
          notes: 'Konfirmasi penugasan oleh Case Manager.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assigned_admin_id).toBe(counselorId);
    });

    it('Counselor DITOLAK (HTTP 403) saat mencoba menugaskan laporan', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          assigned_admin_id: counselorId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Penugasan ke petugas yang tidak aktif DITOLAK (HTTP 400)', async () => {
      // Buat akun petugas counselor nonaktif
      const inactiveRes = await request(app)
        .post('/api/v1/admin/petugas')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          full_name: 'Konselor Nonaktif, M.Pd.',
          email: 'nonaktif.counselor@ruangaman.id',
          role: 'counselor',
          is_active: false,
        });
      expect(inactiveRes.status).toBe(201);
      const inactiveCounselorId = inactiveRes.body.data.id;

      // Coba tugaskan ke counselor nonaktif
      const assignRes = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          assigned_admin_id: inactiveCounselorId,
        });

      expect(assignRes.status).toBe(400);
      expect(assignRes.body.success).toBe(false);
      expect(assignRes.body.message).toContain('tidak aktif');
    });

    it('Penugasan ke petugas yang BUKAN counselor DITOLAK (HTTP 400)', async () => {
      // ID milik Case Manager (a0000001-0000-0000-0000-000000000003)
      const caseManagerId = 'a0000001-0000-0000-0000-000000000003';
      const assignRes = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          assigned_admin_id: caseManagerId,
        });

      expect(assignRes.status).toBe(400);
      expect(assignRes.body.success).toBe(false);
      expect(assignRes.body.message).toContain('Guru BK');
    });

    it('Penugasan ke ID admin yang tidak ada DITOLAK (HTTP 404)', async () => {
      const nonExistentAdminId = '99999999-9999-4999-8999-999999999999';
      const assignRes = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          assigned_admin_id: nonExistentAdminId,
        });

      expect(assignRes.status).toBe(404);
      expect(assignRes.body.success).toBe(false);
    });

    it('Super Admin dapat mencabut penugasan (assigned_admin_id: null)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          assigned_admin_id: null,
          notes: 'Mencabut penugasan sementara.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assigned_admin_id).toBeNull();

      // Kembalikan penugasan ke counselor untuk tes isolasi berikutnya
      await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          assigned_admin_id: counselorId,
        });
    });
  });

  // =========================================================================
  // SECTION 3: Counselor Report Isolation & Access Control
  // =========================================================================
  describe('3. Hak Akses & Isolasi Laporan Guru BK (Counselor)', () => {
    it('Counselor hanya menerima daftar laporan yang ditugaskan ke dirinya', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Semua laporan dalam daftar harus memiliki assigned_admin_id sama dengan counselorId
      res.body.data.items.forEach((item: any) => {
        expect(item.assigned_admin_id).toBe(counselorId);
      });
    });

    it('Counselor dapat membuka detail laporan yang ditugaskan ke dirinya', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/reports/${assignedReportId}`)
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(assignedReportId);
    });

    it('Counselor DITOLAK (HTTP 403) saat mengakses detail laporan yang TIDAK ditugaskan ke dirinya', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/reports/${unassignedReportId}`)
        .set('Authorization', `Bearer ${counselorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Akses ditolak');
    });

    it('Counselor DITOLAK (HTTP 403) saat memperbarui status laporan yang TIDAK ditugaskan ke dirinya', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${unassignedReportId}/status`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          status: 'under_review',
          internal_note: 'Mencoba akses tidak sah.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Counselor berhasil memperbarui status laporan yang memang ditugaskan ke dirinya', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${assignedReportId}/status`)
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          status: 'referred',
          public_message: 'Kasus dalam penanganan Guru BK.',
          internal_note: 'Sesi konseling individual dijadwalkan.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('referred');
    });
  });

  // =========================================================================
  // SECTION 4: Pusat Edukasi API, Search & Category Filters
  // =========================================================================
  describe('4. Pusat Edukasi (Filter Kategori & Pencarian)', () => {
    it('GET /api/v1/public/education tanpa parameter mengembalikan seluruh materi terpublikasi', async () => {
      const res = await request(app).get('/api/v1/public/education');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      res.body.data.forEach((item: any) => {
        expect(item.is_published).toBe(true);
        expect(item.title).toBeDefined();
        expect(item.slug).toBeDefined();
        expect(item.summary).toBeDefined();
      });
    });

    it('Filter berdasarkan kategori mengembalikan materi yang sesuai', async () => {
      const res = await request(app).get('/api/v1/public/education?category=Pemahaman Dasar');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.forEach((item: any) => {
        expect(item.category.toLowerCase()).toBe('pemahaman dasar');
      });
    });

    it('Pencarian dengan kata kunci (search) bekerja pada title/summary', async () => {
      const res = await request(app).get('/api/v1/public/education?search=fisik');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.some(
        (m: any) =>
          m.title.toLowerCase().includes('fisik') ||
          m.summary.toLowerCase().includes('fisik') ||
          m.content.toLowerCase().includes('fisik')
      );
      expect(found).toBe(true);
    });

    it('Kombinasi kategori dan kata kunci search bekerja bersamaan', async () => {
      const res = await request(app).get(
        '/api/v1/public/education?category=Jenis Perundungan&search=verbal'
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.forEach((item: any) => {
        expect(item.category.toLowerCase()).toBe('jenis perundungan');
      });
    });

    it('GET /api/v1/public/education/:slug mengembalikan detail artikel sebenarnya', async () => {
      const res = await request(app).get('/api/v1/public/education/mengenal-definisi-perundungan');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('mengenal-definisi-perundungan');
      expect(res.body.data.content).toContain('Apa Itu Perundungan');
    });

    it('GET /api/v1/public/education/:slug untuk artikel tidak ada mengembalikan HTTP 404', async () => {
      const res = await request(app).get('/api/v1/public/education/slug-tidak-pernah-ada');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // SECTION 5: Counseling Rules & Privacy Protection
  // =========================================================================
  describe('5. Aturan Konseling & Perlindungan Tautan Rapat', () => {
    it('Daftar jadwal konseling publik DILARANG menampilkan meeting_link (harus null)', async () => {
      const res = await request(app).get('/api/v1/public/counseling-slots');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      res.body.data.forEach((slot: any) => {
        expect(slot.meeting_link).toBeNull();
      });
    });

    it('Booking slot berhasil mengembalikan meeting_link untuk sesi online', async () => {
      const res = await request(app)
        .post('/api/v1/public/counseling-bookings')
        .send({
          slot_id: 'sl000001-0000-0000-0000-000000000002',
          student_name: 'Siswa Percobaan',
          contact_method: 'whatsapp',
          contact_value: '08123456789',
          privacy_acknowledged: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meeting_link).toContain('https://meet.google.com');
      expect(res.body.data.booking_code).toMatch(/^BK-\d{4}-[A-Z0-9]{6}$/);
    });

    it('Jadwal yang sudah dipesan tidak boleh bisa dipesan ulang (HTTP 409)', async () => {
      const res = await request(app)
        .post('/api/v1/public/counseling-bookings')
        .send({
          slot_id: 'sl000001-0000-0000-0000-000000000002', // Sudah dibooking
          student_name: 'Siswa Lain',
          contact_method: 'whatsapp',
          contact_value: '081299998888',
          privacy_acknowledged: true,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('sudah tidak tersedia');
    });

    it('Counselor tidak boleh membuat jadwal untuk orang lain tanpa izin', async () => {
      const futureStart = new Date(Date.now() + 86400000 * 5).toISOString();
      const futureEnd = new Date(Date.now() + 86400000 * 5 + 3600000).toISOString();

      // Counselor mencoba membuat slot dengan counselor_admin_id milik petugas lain
      const res = await request(app)
        .post('/api/v1/admin/counseling-slots')
        .set('Authorization', `Bearer ${counselorToken}`)
        .send({
          start_at: futureStart,
          end_at: futureEnd,
          session_mode: 'online',
          meeting_link: 'https://meet.google.com/test-counselor',
          counselor_admin_id: 'a0000001-0000-0000-0000-000000000001', // Super admin
        });

      // Logika backend menetapkan counselorAdminId = currentAdmin.id jika role === 'counselor',
      // sehingga counselor tidak dapat memanipulasi slot milik orang lain
      expect(res.status).toBe(201);
      expect(res.body.data.counselor_admin_id).toBe(counselorId);
    });
  });
});
