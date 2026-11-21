import { config } from '../config/env.js';
import { IAdminRepository } from '../repositories/interfaces/admin.repository.interface.js';
import { getRepositoriesSync } from '../repositories/repository.factory.js';
import { Admin } from '../types/index.js';

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
