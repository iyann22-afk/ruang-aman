import { IEducationRepository } from '../repositories/interfaces/education.repository.interface.js';
import { getRepositoriesSync } from '../repositories/repository.factory.js';

export class EducationService {
  constructor(private repo?: IEducationRepository) {}

  private getRepository(): IEducationRepository {
    if (this.repo) return this.repo;
    return getRepositoriesSync().educationRepository;
  }

  async getMaterials(search?: string, category?: string) {
    return this.getRepository().listMaterials(search, category);
  }

  async getMaterialBySlug(slug: string) {
    return this.getRepository().findBySlug(slug);
  }

  async getCategories() {
    return this.getRepository().getCategories();
  }
}

export const educationService = new EducationService();
