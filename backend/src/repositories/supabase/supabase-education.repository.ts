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
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return [];
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
    if (error || !data) return [];
    const unique = [...new Set((data as { category: string }[]).map((d) => d.category))];
    return unique.filter(Boolean);
  }
}
