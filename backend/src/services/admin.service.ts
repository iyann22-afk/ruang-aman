import { config } from '../config/env.js';
import {
  CreateAdminDTO,
  IAdminRepository,
  UpdateAdminDTO,
} from '../repositories/interfaces/admin.repository.interface.js';
import { getRepositoriesSync } from '../repositories/repository.factory.js';
import { Admin, AdminRole } from '../types/index.js';

export class AdminService {
  constructor(private repo?: IAdminRepository) {}

  private getRepository(): IAdminRepository {
    if (this.repo) return this.repo;
    return getRepositoriesSync().adminRepository;
  }

  async login(email: string, password: string): Promise<{ token: string; admin: Admin }> {
    // Demo login HANYA diizinkan di development atau ketika ENABLE_DEMO_AUTH=true
    const isDemoAllowed =
      process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_AUTH === 'true';

    if (!isDemoAllowed) {
      throw Object.assign(new Error('Login demo tidak tersedia di production'), { statusCode: 403 });
    }

    const repo = this.getRepository();
    const admin = await repo.findByEmail(email);
    if (!admin) {
      throw new Error('Kredensial tidak valid: Akun petugas tidak ditemukan');
    }

    if (!admin.is_active) {
      throw new Error('Akun petugas tidak aktif');
    }

    // Hanya gunakan password dari config — hapus fallback hardcoded
    const validPassword = config.demoAdmin.password;
    if (!validPassword || password !== validPassword) {
      throw new Error('Kredensial tidak valid: Password demo salah');
    }

    // Issue demo Bearer token format: demo-token-<role>-<id>
    const token = `demo-token-${admin.role}-${admin.id}`;

    return {
      token,
      admin,
    };
  }

  /**
   * Memverifikasi dan menautkan akun Google OAuth ke record petugas di tabel admins.
   * Dipanggil saat Google OAuth login berhasil.
   */
  async verifyAndLinkAdmin(authUserId: string, email: string): Promise<Admin> {
    const repo = this.getRepository();

    // 1. Cari berdasarkan auth_user_id yang sudah terhubung
    let admin = await repo.findByAuthUserId(authUserId);

    // 2. Jika belum terhubung, cari akun aktif berdasarkan email yang terverifikasi
    if (!admin && email) {
      const pendingAdmin = await repo.findByEmail(email.trim().toLowerCase());
      if (pendingAdmin) {
        // Keamanan: Pastikan akun belum terhubung dengan akun Google lain
        if (pendingAdmin.auth_user_id && pendingAdmin.auth_user_id !== authUserId) {
          const err = new Error('Akun petugas ini sudah terhubung dengan akun Google lain.');
          (err as any).statusCode = 403;
          throw err;
        }

        if (!pendingAdmin.is_active) {
          const err = new Error('Akun petugas ini telah dinonaktifkan. Hubungi Super Admin.');
          (err as any).statusCode = 403;
          throw err;
        }

        // Tautkan auth_user_id secara atomik
        admin = await repo.linkAuthUserId(pendingAdmin.id, authUserId);
      }
    }

    if (!admin || !admin.is_active) {
      const err = new Error('Akun ini tidak memiliki hak akses sebagai petugas RUANGAMAN.');
      (err as any).statusCode = 403;
      throw err;
    }

    return admin;
  }

  async listAdmins(): Promise<Admin[]> {
    const repo = this.getRepository();
    return repo.listAdmins();
  }

  async createAdmin(dto: CreateAdminDTO): Promise<Admin> {
    const repo = this.getRepository();
    const existing = await repo.findByEmail(dto.email.trim().toLowerCase());
    if (existing) {
      const err = new Error(`Email ${dto.email} sudah terdaftar sebagai petugas.`);
      (err as any).statusCode = 400;
      throw err;
    }

    return repo.createAdmin(dto);
  }

  async updateAdminRole(targetAdminId: string, newRole: AdminRole, currentAdmin: Admin): Promise<Admin> {
    const repo = this.getRepository();
    const target = await repo.findById(targetAdminId);
    if (!target) {
      const err = new Error('Petugas tidak ditemukan.');
      (err as any).statusCode = 404;
      throw err;
    }

    // Proteksi: Super admin utama (Yandri Utama) atau diri sendiri tidak boleh didemote secara sembarangan
    if (target.email.toLowerCase().includes('yandri') && newRole !== 'super_admin') {
      const err = new Error('Kewenangan Super Admin utama tidak dapat diubah.');
      (err as any).statusCode = 400;
      throw err;
    }

    if (target.id === currentAdmin.id && newRole !== 'super_admin') {
      const err = new Error('Anda tidak dapat mencabut peran Super Admin dari akun Anda sendiri.');
      (err as any).statusCode = 400;
      throw err;
    }

    return repo.updateAdmin(targetAdminId, { role: newRole });
  }

  async toggleAdminStatus(targetAdminId: string, is_active: boolean, currentAdmin: Admin): Promise<Admin> {
    const repo = this.getRepository();
    const target = await repo.findById(targetAdminId);
    if (!target) {
      const err = new Error('Petugas tidak ditemukan.');
      (err as any).statusCode = 404;
      throw err;
    }

    // Proteksi: Tidak boleh menonaktifkan akun sendiri atau Yandri Utama
    if (target.id === currentAdmin.id && !is_active) {
      const err = new Error('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      (err as any).statusCode = 400;
      throw err;
    }

    if (target.email.toLowerCase().includes('yandri') && !is_active) {
      const err = new Error('Super Admin utama tidak dapat dinonaktifkan.');
      (err as any).statusCode = 400;
      throw err;
    }

    const updated = await repo.updateAdmin(targetAdminId, { is_active });

    // Jika dinonaktifkan, cabut seluruh sesi aktifnya secara instan
    if (!is_active) {
      const { sessionService } = await import('./session.service.js');
      await sessionService.revokeAllSessionsForAdmin(targetAdminId);
    }

    return updated;
  }

  async getProfile(adminId: string) {
    const repo = this.getRepository();
    const admin = await repo.findById(adminId);
    if (!admin) {
      throw new Error('Profil petugas tidak ditemukan');
    }

    const permissions = this.getRolePermissions(admin.role);

    return {
      ...admin,
      permissions,
    };
  }

  private getRolePermissions(role: string): string[] {
    switch (role) {
      case 'super_admin':
        return [
          'all_reports_read',
          'all_reports_write',
          'manage_users',
          'view_audit_trail',
          'manage_education',
          'manage_counseling',
        ];
      case 'case_manager':
        return [
          'all_reports_read',
          'all_reports_write',
          'view_audit_trail',
          'manage_counseling',
        ];
      case 'counselor':
        return [
          'all_reports_read',
          'view_audit_trail',
          'manage_counseling',
        ];
      default:
        return [];
    }
  }
}

export const adminService = new AdminService();
