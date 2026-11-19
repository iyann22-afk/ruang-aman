import { IEducationRepository } from '../repositories/interfaces/education.repository.interface.js';
import { educationRepository } from '../repositories/mock/education.repository.js';

export class EducationService {
  constructor(private repo: IEducationRepository = educationRepository) {}

  async getMaterials(search?: string, category?: string) {
    return this.repo.listMaterials(search, category);
  }

  async getMaterialBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async getCategories() {
    return this.repo.getCategories();
  }
}

export const educationService = new EducationService();
