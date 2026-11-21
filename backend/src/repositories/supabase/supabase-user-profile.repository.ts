import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './supabase.client.js';

export interface UserProfile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface IUserProfileRepository {
  findByAuthUserId(authUserId: string): Promise<UserProfile | null>;
  upsertProfile(authUserId: string, fullName?: string, avatarUrl?: string): Promise<UserProfile>;
}

export class SupabaseUserProfileRepository implements IUserProfileRepository {
  async findByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal memuat profil pengguna: ${error.message}`);
    }
    return (data as UserProfile) || null;
  }

  async upsertProfile(
    authUserId: string,
    fullName?: string,
    avatarUrl?: string
  ): Promise<UserProfile> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    // Cek apakah profil sudah terdaftar berdasarkan auth_user_id
    const existing = await this.findByAuthUserId(authUserId);

    if (existing) {
      // Pertahankan primary key (id UUID) asli yang sudah ada.
      // Jangan pernah generate id baru saat login ulang agar relasi foreign key tetap utuh.
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (fullName !== undefined) updatePayload.full_name = fullName ?? null;
      if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl ?? null;

      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Gagal memperbarui profil pengguna: ${error?.message}`);
      }
      return data as UserProfile;
    }

    // Buat profil baru untuk pengguna pertama kali
    const newId = uuidv4();
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: newId,
        auth_user_id: authUserId,
        full_name: fullName ?? null,
        avatar_url: avatarUrl ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal membuat profil pengguna baru: ${error?.message}`);
    }
    return data as UserProfile;
  }
}
