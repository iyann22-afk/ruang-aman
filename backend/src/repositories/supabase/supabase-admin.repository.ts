import { v4 as uuidv4 } from 'uuid';
import { Admin } from '../../types/index.js';
import {
  CreateAdminDTO,
  IAdminRepository,
  UpdateAdminDTO,
} from '../interfaces/admin.repository.interface.js';
import { supabaseAdmin } from './supabase.client.js';

export class SupabaseAdminRepository implements IAdminRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    return data as Admin;
  }

  async findById(id: string): Promise<Admin | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Admin;
  }

  async findByAuthUserId(authUserId: string): Promise<Admin | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Admin;
  }

  async listAdmins(): Promise<Admin[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Admin[];
  }

  async createAdmin(dto: CreateAdminDTO): Promise<Admin> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    const newId = uuidv4();
    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert({
        id: newId,
        full_name: dto.full_name.trim(),
        email: dto.email.trim().toLowerCase(),
        role: dto.role,
        is_active: dto.is_active ?? true,
        auth_user_id: null, // Disiapkan kosong sampai login pertama
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal mendaftarkan petugas: ${error?.message}`);
    }

    return data as Admin;
  }

  async updateAdmin(id: string, updates: UpdateAdminDTO): Promise<Admin> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.full_name !== undefined) updatePayload.full_name = updates.full_name.trim();
    if (updates.role !== undefined) updatePayload.role = updates.role;
    if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active;

    const { data, error } = await supabaseAdmin
      .from('admins')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal memperbarui data petugas: ${error?.message}`);
    }

    return data as Admin;
  }

  async linkAuthUserId(id: string, authUserId: string): Promise<Admin> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    // Tautkan secara atomik hanya jika auth_user_id masih kosong (mencegah account hijacking)
    const { data, error } = await supabaseAdmin
      .from('admins')
      .update({
        auth_user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('auth_user_id', null)
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        `Gagal menautkan akun Google ke petugas: ${error?.message || 'Akun sudah terhubung ke identitas lain'}`
      );
    }

    return data as Admin;
  }
}
