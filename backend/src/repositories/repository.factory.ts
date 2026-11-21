/**
 * Repository Factory
 *
 * Menentukan implementasi repository yang digunakan:
 * - Production / USE_SUPABASE=true → Supabase repositories (PostgreSQL)
 * - Development (default) → Mock in-memory repositories
 *
 * Semua service harus menggunakan factory ini, bukan import langsung mock.
 */

import { IAdminRepository } from './interfaces/admin.repository.interface.js';
import { ICounselingRepository } from './interfaces/counseling.repository.interface.js';
import { IEducationRepository } from './interfaces/education.repository.interface.js';
import { IReportRepository } from './interfaces/report.repository.interface.js';
import { MockAdminRepository } from './mock/admin.repository.js';
import { MockCounselingRepository } from './mock/counseling.repository.js';
import { MockEducationRepository } from './mock/education.repository.js';
import { MockReportRepository } from './mock/report.repository.js';

const useSupabase =
  process.env.NODE_ENV === 'production' || process.env.USE_SUPABASE === 'true';

// ======= Lazy load Supabase repos hanya jika diperlukan =======
async function getSupabaseRepos() {
  const [
    { SupabaseReportRepository },
    { SupabaseEducationRepository },
    { SupabaseCounselingRepository },
    { SupabaseAdminRepository },
  ] = await Promise.all([
    import('./supabase/supabase-report.repository.js'),
    import('./supabase/supabase-education.repository.js'),
    import('./supabase/supabase-counseling.repository.js'),
    import('./supabase/supabase-admin.repository.js'),
  ]);

  return {
    reportRepository: new SupabaseReportRepository() as IReportRepository,
    educationRepository: new SupabaseEducationRepository() as IEducationRepository,
    counselingRepository: new SupabaseCounselingRepository() as ICounselingRepository,
    adminRepository: new SupabaseAdminRepository() as IAdminRepository,
  };
}

function getMockRepos() {
  return {
    reportRepository: new MockReportRepository() as IReportRepository,
    educationRepository: new MockEducationRepository() as IEducationRepository,
    counselingRepository: new MockCounselingRepository() as ICounselingRepository,
    adminRepository: new MockAdminRepository() as IAdminRepository,
  };
}

// Cache instance agar tidak dibuat ulang setiap request
let _repositories: {
  reportRepository: IReportRepository;
  educationRepository: IEducationRepository;
  counselingRepository: ICounselingRepository;
  adminRepository: IAdminRepository;
} | null = null;

export async function getRepositories() {
  if (_repositories) return _repositories;

  if (useSupabase) {
    _repositories = await getSupabaseRepos();
    console.info('[RepositoryFactory] Menggunakan Supabase repositories (production)');
  } else {
    _repositories = getMockRepos();
    console.info('[RepositoryFactory] Menggunakan Mock repositories (development)');
  }

  return _repositories;
}

// Synchronous getter (menggunakan cache) — gunakan setelah init
export function getRepositoriesSync() {
  if (!_repositories) {
    // Fallback ke mock jika belum diinisialisasi
    _repositories = getMockRepos();
  }
  return _repositories;
}

// Inisialisasi awal saat app start
export async function initRepositories(): Promise<void> {
  await getRepositories();
}
