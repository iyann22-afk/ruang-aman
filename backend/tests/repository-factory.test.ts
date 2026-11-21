import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getRepositories,
  getRepositoriesSync,
  resetRepositoriesForTest,
} from '../src/repositories/repository.factory.js';
import { SupabaseReportRepository } from '../src/repositories/supabase/supabase-report.repository.js';
import { TrackingService } from '../src/services/tracking.service.js';

describe('Repository Factory & Production Integrity Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    resetRepositoriesForTest();
  });

  it('Development mode: should load Mock Repository by default', async () => {
    delete process.env.USE_SUPABASE;
    process.env.NODE_ENV = 'development';

    const repos = await getRepositories();
    expect(repos.isSupabase).toBe(false);

    const syncRepos = getRepositoriesSync();
    expect(syncRepos.isSupabase).toBe(false);
  });

  it('Production mode: MUST NEVER silently fallback to Mock Repository if Supabase credentials are missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.USE_SUPABASE;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;

    // Both async and sync getters must reject/throw
    await expect(getRepositories()).rejects.toThrow(
      /Mode production atau USE_SUPABASE=true terdeteksi/
    );

    expect(() => getRepositoriesSync()).toThrow(
      /Mode production atau USE_SUPABASE=true terdeteksi/
    );
  });

  it('Production mode: with valid credentials should initialize Supabase Repositories', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test-service-key-token';

    const repos = await getRepositories();
    expect(repos.isSupabase).toBe(true);
    expect(repos.reportRepository).toBeInstanceOf(SupabaseReportRepository);

    const syncRepos = getRepositoriesSync();
    expect(syncRepos.isSupabase).toBe(true);
  });

  it('USE_SUPABASE flag: should activate Supabase Repositories even in non-production', async () => {
    process.env.NODE_ENV = 'development';
    process.env.USE_SUPABASE = 'true';
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test-service-key-token';

    const repos = await getRepositories();
    expect(repos.isSupabase).toBe(true);
  });
});

describe('TrackingService Privacy Protection Tests', () => {
  it('Public tracking MUST NOT reveal detailed sensitive incident location', async () => {
    const mockRepo: any = {
      findByTrackingCode: vi.fn().mockResolvedValue({
        id: 'r1',
        tracking_code: 'RA-TEST-1234',
        category_id: 'c1',
        incident_date: '2026-11-20',
        incident_location: 'Gudang Belakang Lantai 3 Dekat Toilet Siswa (Sensitif)',
        chronology: 'Kronologi sangat rahasia yang tidak boleh bocor',
        status: 'under_review',
        created_at: '2026-11-20T10:00:00.000Z',
        updated_at: '2026-11-20T11:00:00.000Z',
        resolved_at: null,
      }),
      getCategoryById: vi.fn().mockResolvedValue({ id: 'c1', name: 'Perundungan Fisik' }),
      getHistoriesByReportId: vi.fn().mockResolvedValue([
        {
          id: 'h1',
          report_id: 'r1',
          new_status: 'submitted',
          public_message: 'Laporan diterima tim',
          internal_note: 'Investigasi internal sangat rahasia',
          created_at: '2026-11-20T10:00:00.000Z',
        },
      ]),
    };

    const trackingService = new TrackingService(mockRepo);
    const result = await trackingService.trackReport('RA-TEST-1234');

    expect(result).not.toBeNull();
    // Validasi lokasi detail disamarkan
    expect(result!.incident_location).not.toContain('Gudang Belakang Lantai 3');
    expect(result!.incident_location).toContain('Dirahasiakan');

    // Validasi data sensitif tidak terekspos
    expect((result as any).chronology).toBeUndefined();
    expect(result!.timeline[0].public_message).toBe('Laporan diterima tim');
    expect((result!.timeline[0] as any).internal_note).toBeUndefined();
  });
});
