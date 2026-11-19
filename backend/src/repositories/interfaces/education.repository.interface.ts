import { EducationMaterial } from '../../types/index.js';

export interface IEducationRepository {
  listMaterials(search?: string, category?: string): Promise<EducationMaterial[]>;
  findBySlug(slug: string): Promise<EducationMaterial | null>;
  findById(id: string): Promise<EducationMaterial | null>;
  getCategories(): Promise<string[]>;
}
