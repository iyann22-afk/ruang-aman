import { NextFunction, Request, Response } from 'express';
import { educationService } from '../services/education.service.js';

export class EducationController {
  async getMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, category } = req.query;
      const materials = await educationService.getMaterials(
        search as string,
        category as string
      );

      res.status(200).json({
        success: true,
        message: 'Daftar materi edukasi berhasil dimuat',
        data: materials,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMaterialBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const material = await educationService.getMaterialBySlug(slug);

      if (!material) {
        res.status(404).json({
          success: false,
          message: 'Materi edukasi tidak ditemukan',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Materi edukasi berhasil dimuat',
        data: material,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const educationController = new EducationController();
