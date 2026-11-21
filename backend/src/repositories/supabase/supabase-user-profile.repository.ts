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
      .single();
    if (error || !data) return null;
    return data as UserProfile;
  }

  async upsertProfile(
    authUserId: string,
    fullName?: string,
    avatarUrl?: string
  ): Promise<UserProfile> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          id: uuidv4(),
          auth_user_id: authUserId,
          full_name: fullName ?? null,
          avatar_url: avatarUrl ?? null,
        },
        { onConflict: 'auth_user_id' }
      )
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal menyimpan profil pengguna: ${error?.message}`);
    }
    return data as UserProfile;
  }
}
