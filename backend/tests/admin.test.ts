import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('Admin API Endpoints', () => {
  let authToken = '';
  let sampleReportId = '';

  it('POST /api/v1/admin/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@ruangaman.id', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/admin/auth/login should succeed with demo admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@ruangaman.id', password: 'PasswordDemo123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.admin.email).toBe('admin@ruangaman.id');
    authToken = res.body.data.token;
  });

  it('GET /api/v1/admin/dashboard/summary should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/admin/dashboard/summary should return summary metrics with token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total_reports).toBeGreaterThanOrEqual(1);
    expect(res.body.data.category_breakdown).toBeDefined();
  });

  it('GET /api/v1/admin/reports should return report list and filter', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    sampleReportId = res.body.data.items[0].id;
  });

  it('GET /api/v1/admin/reports/:id should return complete report details', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/reports/${sampleReportId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(sampleReportId);
    expect(res.body.data.chronology).toBeDefined();
    expect(res.body.data.histories).toBeDefined();
  });

  it('PATCH /api/v1/admin/reports/:id/status should update report status and log note', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/reports/${sampleReportId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'referred',
        public_message: 'Kasus telah dirujuk untuk pendampingan.',
        internal_note: 'Catatan koordinasi internal tim BK.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('referred');
  });

  it('GET /api/v1/admin/status-history should return audit trail logs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/status-history')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/admin/profile should return authenticated admin profile', async () => {
    const res = await request(app)
      .get('/api/v1/admin/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@ruangaman.id');
    expect(res.body.data.permissions).toBeDefined();
  });
 
  it('GET /api/v1/admin/counseling-counselors should list active counselors for managers', async () => {
    const res = await request(app)
      .get('/api/v1/admin/counseling-counselors')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'a0000001-0000-0000-0000-000000000002',
        full_name: 'Budi Santoso, S.Psi., M.Psi.',
      }),
    ]));
    expect(res.body.data[0].email).toBeUndefined();
  });

  it('GET /api/v1/admin/counseling-slots should return the admin schedule list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/counseling-slots')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/v1/admin/counseling-slots should create a future slot for the selected counselor', async () => {
    const start = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    start.setUTCMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const payload = {
      counselor_admin_id: 'a0000001-0000-0000-0000-000000000002',
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      session_mode: 'offline',
      location: 'Ruang BK Pengujian',
    };

    const res = await request(app)
      .post('/api/v1/admin/counseling-slots')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counselor_admin_id).toBe(payload.counselor_admin_id);
    expect(res.body.data.status).toBe('available');
    expect(res.body.data.is_published).toBe(true);
  });

  it('POST /api/v1/admin/counseling-slots should reject an overlapping slot', async () => {
    const start = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    start.setUTCMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const res = await request(app)
      .post('/api/v1/admin/counseling-slots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        counselor_admin_id: 'a0000001-0000-0000-0000-000000000002',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        session_mode: 'offline',
        location: 'Ruang BK Pengujian',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('bertabrakan');
  });

  it('POST /api/v1/admin/counseling-slots should force a counselor to schedule only for their own account', async () => {
    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'counselor@ruangaman.id', password: 'PasswordDemo123!' });
    expect(login.status).toBe(200);

    const start = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000);
    start.setUTCMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const res = await request(app)
      .post('/api/v1/admin/counseling-slots')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .send({
        counselor_admin_id: 'a0000001-0000-0000-0000-000000000001',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        session_mode: 'online',
        meeting_link: 'https://meet.google.com/ruangaman-test',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.counselor_admin_id).toBe('a0000001-0000-0000-0000-000000000002');
  });

  it('GET /api/v1/admin/counseling-counselors should reject a counselor role', async () => {
    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'counselor@ruangaman.id', password: 'PasswordDemo123!' });
    const res = await request(app)
      .get('/api/v1/admin/counseling-counselors')
      .set('Authorization', `Bearer ${login.body.data.token}`);
    expect(res.status).toBe(403);
  });
});
