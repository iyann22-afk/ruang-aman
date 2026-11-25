import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('Public API Endpoints', () => {
  let createdTrackingCode = '';
  let categoryId = '';

  it('GET /api/v1/public/categories should return available categories', async () => {
    const res = await request(app).get('/api/v1/public/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    categoryId = res.body.data[0].id;
  });

  it('POST /api/v1/public/reports should reject invalid payload without required fields', async () => {
    const res = await request(app)
      .post('/api/v1/public/reports')
      .send({ incident_location: 'Kantin' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/v1/public/reports should successfully create an anonymous report', async () => {
    const res = await request(app)
      .post('/api/v1/public/reports')
      .send({
        category_id: categoryId,
        incident_date: '2026-11-18',
        incident_location: 'Koridor Depan Kelas 10-A',
        chronology: 'Terjadi intimidasi secara terus menerus oleh sekelompok teman sekolah.',
        identity_mode: 'anonymous',
        privacy_acknowledged: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tracking_code).toMatch(/^RA-\d{4}-[A-Z0-9]{6}$/);
    expect(res.body.data.status).toBe('submitted');

    createdTrackingCode = res.body.data.tracking_code;
  });

  it('POST /api/v1/public/reports/track should return tracking details for valid code', async () => {
    const res = await request(app)
      .post('/api/v1/public/reports/track')
      .send({ tracking_code: createdTrackingCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tracking_code).toBe(createdTrackingCode);
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.timeline).toBeDefined();
    // Security check: No sensitive PII or full chronology exposed
    expect(res.body.data.chronology).toBeUndefined();
    expect(res.body.data.reporter_name).toBeUndefined();
    expect(res.body.data.reporter_contact).toBeUndefined();
  });

  it('POST /api/v1/public/reports/track should return 404 for unknown tracking code', async () => {
    const res = await request(app)
      .post('/api/v1/public/reports/track')
      .send({ tracking_code: 'RA-9999-NOTFOUND' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/public/education should return materials with filtering', async () => {
    const res = await request(app).get('/api/v1/public/education?search=definisi');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].slug).toBe('mengenal-definisi-perundungan');
  });

  it('GET /api/v1/public/education/categories should return the available education categories', async () => {
    const res = await request(app).get('/api/v1/public/education/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/public/education?category=Semua should return all published materials', async () => {
    const res = await request(app).get('/api/v1/public/education?category=Semua');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/public/counseling-slots should return available slots', async () => {
    const res = await request(app).get('/api/v1/public/counseling-slots');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].status).toBe('available');
    // Public schedule must never reveal private online meeting URLs before booking.
    expect(res.body.data.every((slot: { meeting_link?: string | null }) => slot.meeting_link == null)).toBe(true);
  });

  it('POST /api/v1/public/counseling-bookings should book a counseling session', async () => {
    const slotsRes = await request(app).get('/api/v1/public/counseling-slots');
    const slotId = slotsRes.body.data[0].id;

    const res = await request(app)
      .post('/api/v1/public/counseling-bookings')
      .send({
        slot_id: slotId,
        student_name: 'Budi Test Siswa',
        contact_method: 'whatsapp',
        contact_value: '081234567890',
        privacy_acknowledged: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking_code).toMatch(/^BK-\d{4}-[A-Z0-9]{6}$/);
    expect(res.body.data.booking_status).toBe('confirmed');
    expect(res.body.data).toHaveProperty('meeting_link');
  });
});
