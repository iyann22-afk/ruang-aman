import { Admin, AdminRole } from '../../types/index.js';

export interface CreateAdminDTO {
  full_name: string;
  email: string;
  role: AdminRole;
  is_active?: boolean;
}

export interface UpdateAdminDTO {
  full_name?: string;
  role?: AdminRole;
  is_active?: boolean;
}

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: string): Promise<Admin | null>;
  findByAuthUserId(authUserId: string): Promise<Admin | null>;
  listAdmins(): Promise<Admin[]>;
  createAdmin(dto: CreateAdminDTO): Promise<Admin>;
  updateAdmin(id: string, updates: UpdateAdminDTO): Promise<Admin>;
  linkAuthUserId(id: string, authUserId: string): Promise<Admin>;
}
