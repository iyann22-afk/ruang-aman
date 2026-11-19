import { Admin } from '../../types/index.js';
import { IAdminRepository } from '../interfaces/admin.repository.interface.js';

export class MockAdminRepository implements IAdminRepository {
  private admins: Admin[] = [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      auth_user_id: 'u0000001-0000-0000-0000-000000000001',
      full_name: 'Dra. Hj. Nurul Hidayati, M.Pd.',
      email: 'admin@ruangaman.id',
      role: 'super_admin',
      is_active: true,
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-01-01T08:00:00.000Z',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000002',
      auth_user_id: 'u0000001-0000-0000-0000-000000000002',
      full_name: 'Budi Santoso, S.Psi., M.Psi.',
      email: 'counselor@ruangaman.id',
      role: 'counselor',
      is_active: true,
      created_at: '2026-01-02T08:00:00.000Z',
      updated_at: '2026-01-02T08:00:00.000Z',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000003',
      auth_user_id: 'u0000001-0000-0000-0000-000000000003',
      full_name: 'Siti Rahmawati, S.Sos.',
      email: 'casemanager@ruangaman.id',
      role: 'case_manager',
      is_active: true,
      created_at: '2026-01-03T08:00:00.000Z',
      updated_at: '2026-01-03T08:00:00.000Z',
    },
  ];

  async findByEmail(email: string): Promise<Admin | null> {
    const admin = this.admins.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.is_active
    );
    return admin ? { ...admin } : null;
  }

  async findById(id: string): Promise<Admin | null> {
    const admin = this.admins.find((a) => a.id === id && a.is_active);
    return admin ? { ...admin } : null;
  }

  async listAdmins(): Promise<Admin[]> {
    return this.admins.map((a) => ({ ...a }));
  }
}

export const adminRepository = new MockAdminRepository();
