/**
 * Repository Factory
 *
 * Menentukan implementasi repository yang digunakan:
 * - Production (NODE_ENV=production atau USE_SUPABASE=true) -> Supabase Repositories (PostgreSQL)
 * - Development (default) -> Mock In-Memory Repositories
 *
 * KEAMANAN PRODUCTION:
 * Dilarang keras melakukan silent fallback ke Mock Repository pada lingkungan produksi.
 */

import { IAdminRepository } from './interfaces/admin.repository.interface.js';
import { ICounselingRepository } from './interfaces/counseling.repository.interface.js';
import { IEducationRepository } from './interfaces/education.repository.interface.js';
import { IReportRepository } from './interfaces/report.repository.interface.js';
import { MockAdminRepository } from './mock/admin.repository.js';
import { MockCounselingRepository } from './mock/counseling.repository.js';
import { MockEducationRepository } from './mock/education.repository.js';
import { MockReportRepository } from './mock/report.repository.js';
import { SupabaseAdminRepository } from './supabase/supabase-admin.repository.js';
import { SupabaseCounselingRepository } from './supabase/supabase-counseling.repository.js';
import { SupabaseEducationRepository } from './supabase/supabase-education.repository.js';
import { SupabaseReportRepository } from './supabase/supabase-report.repository.js';
import {
  IUserProfileRepository,
  SupabaseUserProfileRepository,
} from './supabase/supabase-user-profile.repository.js';

export interface RepositoryContainer {
  reportRepository: IReportRepository;
  educationRepository: IEducationRepository;
  counselingRepository: ICounselingRepository;
  adminRepository: IAdminRepository;
  userProfileRepository?: IUserProfileRepository;
  isSupabase: boolean;
}

export function isProductionOrSupabase(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.USE_SUPABASE === 'true';
}

function createSupabaseRepos(): RepositoryContainer {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      '[CRITICAL_SECURITY] Mode production atau USE_SUPABASE=true terdeteksi, namun SUPABASE_URL atau SUPABASE_SECRET_KEY tidak terkonfigurasi. Sistem menolak fallback ke Mock Repository demi integritas data.'
    );
  }

  return {
    reportRepository: new SupabaseReportRepository(),
    educationRepository: new SupabaseEducationRepository(),
    counselingRepository: new SupabaseCounselingRepository(),
    adminRepository: new SupabaseAdminRepository(),
    userProfileRepository: new SupabaseUserProfileRepository(),
    isSupabase: true,
  };
}

function createMockRepos(): RepositoryContainer {
  return {
    reportRepository: new MockReportRepository(),
    educationRepository: new MockEducationRepository(),
    counselingRepository: new MockCounselingRepository(),
    adminRepository: new MockAdminRepository(),
    isSupabase: false,
  };
}

let _repositories: RepositoryContainer | null = null;

/**
 * Inisialisasi repositories secara asinkron atau sinkron.
 */
export async function getRepositories(): Promise<RepositoryContainer> {
  if (_repositories) return _repositories;

  if (isProductionOrSupabase()) {
    _repositories = createSupabaseRepos();
    console.info('[RepositoryFactory] Menggunakan Supabase Repositories (PostgreSQL / Production)');
  } else {
    _repositories = createMockRepos();
    console.info('[RepositoryFactory] Menggunakan Mock Repositories (In-Memory / Development)');
  }

  return _repositories;
}

/**
 * Pengambilan repositori secara sinkron (dengan proteksi ketat agar tidak ada fallback ke mock di production).
 */
export function getRepositoriesSync(): RepositoryContainer {
  if (!_repositories) {
    if (isProductionOrSupabase()) {
      _repositories = createSupabaseRepos();
    } else {
      _repositories = createMockRepos();
    }
  }
  return _repositories;
}

export async function initRepositories(): Promise<void> {
  await getRepositories();
}

/**
 * Hanya untuk keperluan unit test: mereset instance repository singleton.
 */
export function resetRepositoriesForTest(): void {
  _repositories = null;
}
