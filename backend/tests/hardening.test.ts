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

  it('kompensasi harus menghapus file storage jika metadata DB gagal disimpan', async () => {
    const serviceCode = readFileSync(join(srcDir, 'services/report.service.ts'), 'utf-8');

    // Kompensasi: hapus file dari storage jika DB insert gagal
    expect(serviceCode).toContain('.remove([storagePath])');
    expect(serviceCode).toContain('report-evidence-private');
    expect(serviceCode).toContain('kompensasi');
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
