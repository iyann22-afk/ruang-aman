import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('Health Check API', () => {
  it('should trust exactly one proxy hop only on Vercel', () => {
    expect(app.get('trust proxy')).toBe(process.env.VERCEL === '1' ? 1 : false);
  });

  it('GET /api/v1/health should return 200 OK with status message', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('RUANGAMAN API is running');
    expect(res.body.version).toBe('1.0.0');
  });
});
