import { config } from '../config/env.js';
import { IAdminRepository } from '../repositories/interfaces/admin.repository.interface.js';
import { adminRepository } from '../repositories/mock/admin.repository.js';
import { Admin } from '../types/index.js';

export class AdminService {
  constructor(private repo: IAdminRepository = adminRepository) {}

  async login(email: string, password: string):Promise<{ token: string; admin: Admin }> {
    // Check credentials against demo admin or any of the 3 mock accounts with password
    const admin = await this.repo.findByEmail(email);
    if (!admin) {
      throw new Error('Kredensial tidak valid: Akun petugas tidak ditemukan');
    }

    // Demo password check
    const validPassword = config.demoAdmin.password;
    if (password !== validPassword && password !== 'PasswordDemo123!') {
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
    const admin = await this.repo.findById(adminId);
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
        ];
      case 'counselor':
        return [
          'assigned_reports_read',
          'counseling_referrals_write',
          'manage_counseling',
        ];
      default:
        return ['reports_read'];
    }
  }
}

export const adminService = new AdminService();
