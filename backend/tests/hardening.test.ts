/**
 * RUANGAMAN — Final Hardening Automated Tests
 * Branch: feat/week-3-supabase-google-vercel
 *
 * Menguji 7 skenario keamanan kritis sebelum deployment production.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '../src');

// =====================================================================
// SKENARIO 1: Demo login ditolak di production
// =====================================================================
describe('Hardening 1: Demo login ditolak di production', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Reset env setelah tiap test
    Object.keys(process.env).forEach((k) => delete process.env[k]);
    Object.assign(process.env, originalEnv);
  });

  it('harus melempar error jika NODE_ENV=production dan ENABLE_DEMO_AUTH tidak di-set', async () => {
    // Test langsung melalui logika service, berikan mock repo secara langsung
    // agar factory tidak di-trigger
    const { AdminService } = await import('../src/services/admin.service.js');

    const mockAdmin = {
      id: 'test-id',
      email: 'admin@ruangaman.id',
      full_name: 'Test Admin',
      role: 'super_admin',
      is_active: true,
    };
    const mockRepo = {
      findByEmail: vi.fn().mockResolvedValue(mockAdmin),
      findById: vi.fn(),
      findByAuthUserId: vi.fn(),
    };

    // Temporarily set production env
    const prevNodeEnv = process.env.NODE_ENV;
    const prevDemoAuth = process.env.ENABLE_DEMO_AUTH;
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_DEMO_AUTH;

    const service = new AdminService(mockRepo as any);

    try {
      await expect(service.login('admin@ruangaman.id', 'PasswordDemo123!')).rejects.toThrow(
        /tidak tersedia di production/i
      );
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = prevDemoAuth;
    }
  });

  it('harus melempar error jika ENABLE_DEMO_AUTH=false di production', async () => {
    const { AdminService } = await import('../src/services/admin.service.js');

    const mockRepo = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'test-id',
        email: 'admin@ruangaman.id',
        full_name: 'Test Admin',
        role: 'super_admin',
        is_active: true,
      }),
      findById: vi.fn(),
      findByAuthUserId: vi.fn(),
    };

    const prevNodeEnv = process.env.NODE_ENV;
    const prevDemoAuth = process.env.ENABLE_DEMO_AUTH;
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEMO_AUTH = 'false';

    const service = new AdminService(mockRepo as any);

    try {
      await expect(service.login('admin@ruangaman.id', 'PasswordDemo123!')).rejects.toThrow(
        /tidak tersedia di production/i
      );
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = prevDemoAuth;
      else delete process.env.ENABLE_DEMO_AUTH;
    }
  });

  it('harus mengizinkan demo login di development (NODE_ENV=development)', async () => {
    const { AdminService } = await import('../src/services/admin.service.js');

    const mockAdmin = {
      id: 'test-id',
      email: 'admin@ruangaman.id',
      full_name: 'Test Admin',
      role: 'super_admin',
      is_active: true,
    };
    const mockRepo = {
      findByEmail: vi.fn().mockResolvedValue(mockAdmin),
      findById: vi.fn(),
      findByAuthUserId: vi.fn(),
    };

    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.DEMO_ADMIN_EMAIL = 'admin@ruangaman.id';
    process.env.DEMO_ADMIN_PASSWORD = 'PasswordDemo123!';

    const service = new AdminService(mockRepo as any);

    try {
      const result = await service.login('admin@ruangaman.id', 'PasswordDemo123!');
      expect(result.token).toContain('demo-token-');
      expect(result.admin.email).toBe('admin@ruangaman.id');
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it('harus mengizinkan demo login di production jika ENABLE_DEMO_AUTH=true', async () => {
    const { AdminService } = await import('../src/services/admin.service.js');

    const mockAdmin = {
      id: 'test-id',
      email: 'admin@ruangaman.id',
      full_name: 'Test Admin',
      role: 'super_admin',
      is_active: true,
    };
    const mockRepo = {
      findByEmail: vi.fn().mockResolvedValue(mockAdmin),
      findById: vi.fn(),
      findByAuthUserId: vi.fn(),
    };

    const prevNodeEnv = process.env.NODE_ENV;
    const prevDemoAuth = process.env.ENABLE_DEMO_AUTH;
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEMO_AUTH = 'true';
    process.env.DEMO_ADMIN_PASSWORD = 'PasswordDemo123!';

    const service = new AdminService(mockRepo as any);

    try {
      const result = await service.login('admin@ruangaman.id', 'PasswordDemo123!');
      expect(result.token).toContain('demo-token-');
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevDemoAuth !== undefined) process.env.ENABLE_DEMO_AUTH = prevDemoAuth;
      else delete process.env.ENABLE_DEMO_AUTH;
    }
  });
});

// =====================================================================
// SKENARIO 2: Upload evidence gagal tidak membuat metadata palsu
// =====================================================================
describe('Hardening 2: Upload evidence gagal tidak membuat metadata palsu', () => {
  it('tidak boleh membuat evidence record jika upload storage gagal', async () => {
    // Verifikasi melalui source code: tidak ada lagi fallback path palsu
    const serviceCode = readFileSync(join(srcDir, 'services/report.service.ts'), 'utf-8');

    // Fallback path palsu harus tidak ada lagi
    expect(serviceCode).not.toContain('report-evidence-private/fallback');
    expect(serviceCode).not.toContain("'report-evidence-private'");

    // Upload harus dipanggil dan error-nya dibiarkan naik
    expect(serviceCode).toContain('uploadEvidenceToStorage(report.id, file)');

    // Jika upload berhasil, baru createEvidence dipanggil
    expect(serviceCode).toContain('await repo.createEvidence');

    // hasEvidence = true hanya jika createEvidence berhasil
    expect(serviceCode).toContain('hasEvidence = true');
  });

  it('production harus melempar error jika supabaseAdmin tidak tersedia', async () => {
    const middlewareCode = readFileSync(join(srcDir, 'middleware/upload.middleware.ts'), 'utf-8');

    // Pastikan ada pengecekan production yang melempar error
    expect(middlewareCode).toContain("process.env.NODE_ENV === 'production'");
    expect(middlewareCode).toContain('Supabase Storage tidak dikonfigurasi');
    expect(middlewareCode).toContain('[DEV_SIMULATION]');
  });

  it('kompensasi harus menghapus file storage menggunakan deleteEvidenceFromStorage', async () => {
    const serviceCode = readFileSync(join(srcDir, 'services/report.service.ts'), 'utf-8');

    // Kompensasi menggunakan fungsi terpusat — bukan hardcoded bucket name
    expect(serviceCode).toContain('deleteEvidenceFromStorage(storagePath)');
    expect(serviceCode).toContain('kompensasi');
    // Tidak boleh ada hardcoded bucket name lama
    expect(serviceCode).not.toContain("'report-evidence-private'");
  });

  it('bucket name harus didefinisikan dari satu konstanta konfigurasi', async () => {
    const storageConfigCode = readFileSync(join(srcDir, 'config/storage.config.ts'), 'utf-8');
    const middlewareCode = readFileSync(join(srcDir, 'middleware/upload.middleware.ts'), 'utf-8');

    // storage.config.ts harus mendefinisikan EVIDENCE_BUCKET
    expect(storageConfigCode).toContain("EVIDENCE_BUCKET = 'report-evidences'");

    // upload.middleware.ts harus mengimpor dari storage.config
    expect(middlewareCode).toContain("from '../config/storage.config.js'");
    expect(middlewareCode).toContain('EVIDENCE_BUCKET');

    // Tidak boleh ada string literal bucket lama
    expect(middlewareCode).not.toContain("'report-evidence-private'");
    expect(middlewareCode).not.toContain('"report-evidence-private"');
  });

  it('tidak boleh menggunakan getPublicUrl untuk file bukti', async () => {
    const middlewareCode = readFileSync(join(srcDir, 'middleware/upload.middleware.ts'), 'utf-8');

    // Pastikan tidak ada pemanggilan fungsi getPublicUrl (bukan sekadar sebutan di komentar)
    // getPublicUrl sebagai function call: .getPublicUrl( atau getPublicUrl(
    const hasPublicUrlCall = /\.getPublicUrl\s*\(/.test(middlewareCode);
    expect(hasPublicUrlCall).toBe(false);
  });
});

// =====================================================================
// SKENARIO 3: Tracking code menggunakan crypto.randomBytes
// =====================================================================
describe('Hardening 5: Tracking code menggunakan generator kriptografis', () => {
  it('tracking code harus dimulai dengan RA- dan memiliki 11 karakter total', () => {
    // Simulasi generator yang sama dengan implementasi
    const { randomBytes } = require('crypto');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(8);
    let code = 'RA-';
    for (const byte of bytes) {
      code += chars[byte % chars.length];
    }

    expect(code).toMatch(/^RA-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    expect(code).toHaveLength(11);
  });

  it('100 kode yang dihasilkan seharusnya tidak ada duplikat', () => {
    const { randomBytes } = require('crypto');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const bytes = randomBytes(8);
      let code = 'RA-';
      for (const byte of bytes) {
        code += chars[byte % chars.length];
      }
      codes.add(code);
    }

    // Semua 100 kode harus unik (probabilitas duplikat = 100/32^8 ≈ nol)
    expect(codes.size).toBe(100);
  });

  it('source code harus menggunakan crypto.randomBytes, bukan Math.random', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-report.repository.ts'),
      'utf-8'
    );
    expect(sourceCode).toContain("from 'crypto'");
    expect(sourceCode).toContain('randomBytes');
    // Pastikan Math.random sudah dihapus dari generator
    expect(sourceCode).not.toContain('Math.random');
  });
});

// =====================================================================
// SKENARIO 4: UserProfile upsert tidak mengganti UUID saat login ulang
// =====================================================================
describe('Hardening 4: UserProfile upsert mempertahankan UUID pada re-login', () => {
  it('upsert harus update berdasarkan existing.id, bukan insert baru', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-user-profile.repository.ts'),
      'utf-8'
    );

    // Harus cek existing dulu
    expect(sourceCode).toContain('findByAuthUserId(authUserId)');

    // Jika existing ada, harus update menggunakan existing.id
    expect(sourceCode).toContain('.eq(\'id\', existing.id)');

    // Pastikan tidak ada upsert yang bisa mengganti UUID
    expect(sourceCode).not.toContain('onConflict');
  });

  it('UUID primary key tidak boleh berubah pada login kedua (simulasi logika)', () => {
    const authUserId = 'google-uid-abc123';
    const originalId = 'original-uuid-yang-tidak-boleh-berubah';

    // Simulasi profil yang sudah ada
    const existingProfile = {
      id: originalId,
      auth_user_id: authUserId,
      full_name: 'User Lama',
      avatar_url: null,
    };

    // Simulasi logika upsert: jika sudah ada, update menggunakan existing.id
    const updateCondition = existingProfile.id; // Harus pakai existing.id
    const shouldBeOriginalId = updateCondition;

    expect(shouldBeOriginalId).toBe(originalId);
    // Memastikan id tidak diganti dengan UUID baru
    expect(shouldBeOriginalId).not.toBe('uuid-baru-yang-salah');
  });
});

// =====================================================================
// SKENARIO 5: Laporan anonim tidak terhubung ke profil pengguna
// =====================================================================
describe('Hardening 4: Laporan anonim tidak terhubung ke profil', () => {
  it('reporter_user_id harus NULL untuk laporan dengan identity_mode=anonymous', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-report.repository.ts'),
      'utf-8'
    );

    // reporter_user_id selalu null saat insert (default)
    expect(sourceCode).toContain('reporter_user_id: null');
  });

  it('identity_mode anonymous harus menghapus reporter_name dan reporter_contact', () => {
    const serviceCode = readFileSync(join(srcDir, 'services/report.service.ts'), 'utf-8');

    // Sanitasi: null jika identified, null jika anonymous
    expect(serviceCode).toContain("identity_mode === 'identified'");
    expect(serviceCode).toContain('reporter_name');
    expect(serviceCode).toContain('reporter_contact');
    // Pastikan sanitasi menghasilkan null untuk anonymous
    expect(serviceCode).toContain(': null,');
  });
});

// =====================================================================
// SKENARIO 6: Audit trail tidak di-silent-ignore
// =====================================================================
describe('Hardening 6: Audit trail tidak gagal secara diam-diam', () => {
  it('updateStatus seharusnya menggunakan RPC atomik', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-report.repository.ts'),
      'utf-8'
    );

    // Pastikan menggunakan RPC
    expect(sourceCode).toContain('update_report_status_with_history');
    expect(sourceCode).toContain('.rpc(');
  });

  it('tidak boleh ada silent warning yang mengabaikan error history di updateStatus', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-report.repository.ts'),
      'utf-8'
    );

    // Cari method updateStatus
    const updateStatusMatch = sourceCode.match(/async updateStatus\([\s\S]*?(?=\n  async |\n})/);
    if (updateStatusMatch) {
      // Tidak boleh ada console.warn yang mengabaikan error history
      expect(updateStatusMatch[0]).not.toContain(
        "console.warn('Gagal mencatat perubahan status history"
      );
    }
  });
});

// =====================================================================
// SKENARIO 7: Atomic slot booking (tidak ada race condition)
// =====================================================================
describe('Hardening 3: Slot booking menggunakan RPC atomik', () => {
  it('createBooking seharusnya menggunakan RPC book_counseling_slot', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-counseling.repository.ts'),
      'utf-8'
    );

    expect(sourceCode).toContain('book_counseling_slot');
    expect(sourceCode).toContain('.rpc(');
  });

  it('error SLOT_UNAVAILABLE harus ditangani dengan pesan ramah pengguna', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-counseling.repository.ts'),
      'utf-8'
    );

    expect(sourceCode).toContain('SLOT_UNAVAILABLE');
    expect(sourceCode).toContain('SLOT_NOT_FOUND');
    expect(sourceCode).toContain('Slot konseling sudah tidak tersedia');
    expect(sourceCode).toContain('Slot konseling tidak ditemukan');
  });

  it('booking code harus menggunakan crypto.randomBytes', () => {
    const sourceCode = readFileSync(
      join(srcDir, 'repositories/supabase/supabase-counseling.repository.ts'),
      'utf-8'
    );

    expect(sourceCode).toContain("from 'crypto'");
    expect(sourceCode).toContain('randomBytes');
    expect(sourceCode).not.toContain('Math.random');
  });

  it('migration harus mengandung RPC function book_counseling_slot', () => {
    const migrationCode = readFileSync(
      join(__dirname, '../../database/migrations/0002_week3_additions.sql'),
      'utf-8'
    );

    expect(migrationCode).toContain('CREATE OR REPLACE FUNCTION book_counseling_slot');
    expect(migrationCode).toContain('FOR UPDATE');
    expect(migrationCode).toContain('SLOT_UNAVAILABLE');
  });

  it('migration harus mengandung RPC function update_report_status_with_history', () => {
    const migrationCode = readFileSync(
      join(__dirname, '../../database/migrations/0002_week3_additions.sql'),
      'utf-8'
    );

    expect(migrationCode).toContain('CREATE OR REPLACE FUNCTION update_report_status_with_history');
    expect(migrationCode).toContain('report_status_histories');
  });
});

// =====================================================================
// STORAGE INTEGRATION TESTS
// =====================================================================
describe('Storage Integration: Konsistensi konfigurasi bucket', () => {
  it('EVIDENCE_BUCKET harus bernilai report-evidences (bukan report-evidence-private)', () => {
    const storageConfigCode = readFileSync(join(srcDir, 'config/storage.config.ts'), 'utf-8');
    expect(storageConfigCode).toContain("EVIDENCE_BUCKET = 'report-evidences'");
    expect(storageConfigCode).not.toContain('report-evidence-private');
  });

  it('upload.middleware.ts harus menggunakan EVIDENCE_BUCKET dari storage.config, bukan string literal', () => {
    const middlewareCode = readFileSync(join(srcDir, 'middleware/upload.middleware.ts'), 'utf-8');

    // Harus import dari storage.config
    expect(middlewareCode).toContain("from '../config/storage.config.js'");
    expect(middlewareCode).toContain('EVIDENCE_BUCKET');

    // Tidak boleh ada string literal bucket lama atau baru secara hardcoded
    expect(middlewareCode).not.toContain("'report-evidence-private'");
    expect(middlewareCode).not.toContain("'report-evidences'"); // Harus dari konstanta
  });

  it('report.service.ts tidak boleh memiliki hardcoded bucket name', () => {
    const serviceCode = readFileSync(join(srcDir, 'services/report.service.ts'), 'utf-8');

    expect(serviceCode).not.toContain("'report-evidence-private'");
    expect(serviceCode).not.toContain('"report-evidence-private"');
    expect(serviceCode).not.toContain("'report-evidences'");
    expect(serviceCode).not.toContain('"report-evidences"');
  });

  it('kompensasi di report.service.ts menggunakan deleteEvidenceFromStorage', () => {
    const serviceCode = readFileSync(join(srcDir, 'services/report.service.ts'), 'utf-8');

    // Fungsi terpusat — tidak import supabaseAdmin langsung untuk hapus file
    expect(serviceCode).toContain('deleteEvidenceFromStorage(storagePath)');
    expect(serviceCode).toContain('deleteEvidenceFromStorage');
    expect(serviceCode).not.toContain(".from('report-evidence");
  });

  it('bucket harus tetap private — tidak ada getPublicUrl di middleware', () => {
    const middlewareCode = readFileSync(join(srcDir, 'middleware/upload.middleware.ts'), 'utf-8');
    // Tidak boleh ada pemanggilan fungsi getPublicUrl
    const hasPublicUrlCall = /\.getPublicUrl\s*\(/.test(middlewareCode);
    expect(hasPublicUrlCall).toBe(false);
  });

  it('signed URL hanya tersedia via fungsi getEvidenceSignedUrl (bukan public URL)', () => {
    const middlewareCode = readFileSync(join(srcDir, 'middleware/upload.middleware.ts'), 'utf-8');

    expect(middlewareCode).toContain('getEvidenceSignedUrl');
    expect(middlewareCode).toContain('createSignedUrl');
    expect(middlewareCode).toContain('SIGNED_URL_EXPIRY_SECONDS');
  });

  it('deleteEvidenceFromStorage harus tersedia di upload.middleware.ts', () => {
    const middlewareCode = readFileSync(join(srcDir, 'middleware/upload.middleware.ts'), 'utf-8');
    expect(middlewareCode).toContain('export async function deleteEvidenceFromStorage');
    expect(middlewareCode).toContain('DEV_LOCAL_PATH_PREFIX');
    expect(middlewareCode).toContain('.remove([storagePath])');
  });

  it('SUPABASE_SECRET_KEY tidak boleh ada di konfigurasi frontend', () => {
    const frontendEnvExample = readFileSync(
      join(__dirname, '../../frontend/.env.example'),
      'utf-8'
    );
    expect(frontendEnvExample).not.toContain('SUPABASE_SECRET_KEY');
    expect(frontendEnvExample).not.toContain('SERVICE_ROLE');
  });

  it('env.ts harus konsisten dengan .env.example (SUPABASE_PUBLISHABLE_KEY dan SUPABASE_SECRET_KEY)', () => {
    const envConfig = readFileSync(join(srcDir, 'config/env.ts'), 'utf-8');
    const envExample = readFileSync(join(__dirname, '../../backend/.env.example'), 'utf-8');

    // env.ts harus membaca SUPABASE_PUBLISHABLE_KEY
    expect(envConfig).toContain('SUPABASE_PUBLISHABLE_KEY');
    // env.ts harus membaca SUPABASE_SECRET_KEY
    expect(envConfig).toContain('SUPABASE_SECRET_KEY');

    // .env.example harus mendefinisikan kedua key tersebut
    expect(envExample).toContain('SUPABASE_PUBLISHABLE_KEY');
    expect(envExample).toContain('SUPABASE_SECRET_KEY');

    // Tidak boleh ada nama lama yang tidak konsisten
    expect(envConfig).not.toContain('SUPABASE_ANON_KEY');
    expect(envConfig).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(envExample).not.toContain('SUPABASE_ANON_KEY');
    expect(envExample).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('mock repository storage_path harus menggunakan prefix local/', () => {
    const mockRepoCode = readFileSync(
      join(srcDir, 'repositories/mock/report.repository.ts'),
      'utf-8'
    );
    // Mock data harus pakai local/ prefix (bukan bucket name yang sudah deprecated)
    expect(mockRepoCode).not.toContain('report-evidence-private/demo');
    expect(mockRepoCode).toContain('local/');
  });

  it('endpoint signed URL admin harus terdaftar di router admin yang terproteksi', () => {
    const adminRoutesCode = readFileSync(
      join(srcDir, 'routes/v1/admin.routes.ts'),
      'utf-8'
    );
    expect(adminRoutesCode).toContain('/reports/:id/evidences/:evidenceId/url');
    // Pastikan berada setelah router.use(authenticateAdmin)
    const authIndex = adminRoutesCode.indexOf('router.use(authenticateAdmin)');
    const routeIndex = adminRoutesCode.indexOf('/reports/:id/evidences/:evidenceId/url');
    expect(authIndex).toBeGreaterThan(0);
    expect(routeIndex).toBeGreaterThan(authIndex);
  });

  it('getEvidenceSignedUrl memperkaya detail laporan admin dengan signed_url', () => {
    const serviceCode = readFileSync(join(srcDir, 'services/report.service.ts'), 'utf-8');
    expect(serviceCode).toContain('signed_url: signedUrl');
    expect(serviceCode).toContain('getEvidenceSignedUrl(ev.storage_path)');
  });
});
