import { Admin } from '../../types/index.js';
import { IAdminRepository } from '../interfaces/admin.repository.interface.js';
import { supabaseAdmin } from './supabase.client.js';

export class SupabaseAdminRepository implements IAdminRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
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
      .eq('is_active', true)
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
      .eq('is_active', true)
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
}
