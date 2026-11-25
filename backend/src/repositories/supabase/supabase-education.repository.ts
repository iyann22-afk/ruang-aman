import { EducationMaterial } from '../../types/index.js';
import { IEducationRepository } from '../interfaces/education.repository.interface.js';
import { supabaseAdmin } from './supabase.client.js';

export class SupabaseEducationRepository implements IEducationRepository {
  async listMaterials(search?: string, category?: string): Promise<EducationMaterial[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');

    let query = supabaseAdmin
      .from('education_materials')
      .select('*')
      .eq('is_published', true);

    if (search) {
      // Sesuai skema 0001: kolom adalah 'title' dan 'summary' (bukan description)
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }
    const normalizedCategory = category?.trim();
    if (normalizedCategory && !['semua', 'all'].includes(normalizedCategory.toLowerCase())) {
      query = query.eq('category', normalizedCategory);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Gagal memuat materi edukasi dari database: ${error.message}`);
    }
    return (data as EducationMaterial[]) ?? [];
  }

  async findBySlug(slug: string): Promise<EducationMaterial | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('education_materials')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error || !data) return null;
    return data as EducationMaterial;
  }

  async findById(id: string): Promise<EducationMaterial | null> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('education_materials')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as EducationMaterial;
  }

  async getCategories(): Promise<string[]> {
    if (!supabaseAdmin) throw new Error('Supabase client tidak tersedia');
    const { data, error } = await supabaseAdmin
      .from('education_materials')
      .select('category')
      .eq('is_published', true);
    if (error) {
      throw new Error(`Gagal memuat kategori edukasi: ${error.message}`);
    }
    const unique = [...new Set(((data as { category: string }[]) || []).map((d) => d.category))];
    return unique.filter(Boolean);
  }
}
