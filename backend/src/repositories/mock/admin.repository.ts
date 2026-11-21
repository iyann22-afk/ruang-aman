import { v4 as uuidv4 } from 'uuid';
import { Admin } from '../../types/index.js';
import {
  CreateAdminDTO,
  IAdminRepository,
  UpdateAdminDTO,
} from '../interfaces/admin.repository.interface.js';

export class MockAdminRepository implements IAdminRepository {
  private admins: Admin[] = [
    {
      id: '7beabfb4-5d19-4c6a-85eb-ba5e8073675e',
      auth_user_id: 'u0000000-0000-0000-0000-000000000001',
      full_name: 'Yandri Utama',
      email: 'yandri.utama@ruangaman.id',
      role: 'super_admin',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
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
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );
    return admin ? { ...admin } : null;
  }

  async findById(id: string): Promise<Admin | null> {
    const admin = this.admins.find((a) => a.id === id);
    return admin ? { ...admin } : null;
  }

  async findByAuthUserId(authUserId: string): Promise<Admin | null> {
    const admin = this.admins.find((a) => a.auth_user_id === authUserId);
    return admin ? { ...admin } : null;
  }

  async listAdmins(): Promise<Admin[]> {
    return this.admins.map((a) => ({ ...a }));
  }

  async createAdmin(dto: CreateAdminDTO): Promise<Admin> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new Error(`Email ${dto.email} sudah terdaftar sebagai petugas`);
    }

    const newAdmin: Admin = {
      id: uuidv4(),
      auth_user_id: null,
      full_name: dto.full_name.trim(),
      email: dto.email.trim().toLowerCase(),
      role: dto.role,
      is_active: dto.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.admins.unshift(newAdmin);
    return { ...newAdmin };
  }

  async updateAdmin(id: string, updates: UpdateAdminDTO): Promise<Admin> {
    const index = this.admins.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Petugas tidak ditemukan');
    }

    const current = this.admins[index];
    const updated: Admin = {
      ...current,
      full_name: updates.full_name !== undefined ? updates.full_name.trim() : current.full_name,
      role: updates.role !== undefined ? updates.role : current.role,
      is_active: updates.is_active !== undefined ? updates.is_active : current.is_active,
      updated_at: new Date().toISOString(),
    };

    this.admins[index] = updated;
    return { ...updated };
  }

  async linkAuthUserId(id: string, authUserId: string): Promise<Admin> {
    const index = this.admins.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Petugas tidak ditemukan');
    }

    const current = this.admins[index];
    if (current.auth_user_id && current.auth_user_id !== authUserId) {
      throw new Error('Akun petugas sudah terhubung ke identitas lain');
    }

    const updated: Admin = {
      ...current,
      auth_user_id: authUserId,
      updated_at: new Date().toISOString(),
    };

    this.admins[index] = updated;
    return { ...updated };
  }
}

export const adminRepository = new MockAdminRepository();
