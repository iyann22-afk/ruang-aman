import { Admin } from '../../types/index.js';

export interface IAdminRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: string): Promise<Admin | null>;
  listAdmins(): Promise<Admin[]>;
}
