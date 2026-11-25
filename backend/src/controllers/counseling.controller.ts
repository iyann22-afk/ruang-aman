import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { counselingService } from '../services/counseling.service.js';

export class CounselingController {
  async getSlots(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await counselingService.getSlots();
      res.status(200).json({
        success: true,
        message: 'Jadwal sesi konseling BK berhasil dimuat',
        data: slots,
      });
    } catch (err) { next(err); }
  }

  async getAdminSlots(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await counselingService.getAdminSlots(req.admin!);
      res.status(200).json({ success: true, message: 'Jadwal konseling petugas berhasil dimuat', data: slots });
    } catch (err) { next(err); }
  }

  async getActiveCounselors(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counselors = await counselingService.getActiveCounselors();
      res.status(200).json({ success: true, message: 'Daftar Guru BK aktif berhasil dimuat', data: counselors });
    } catch (err) { next(err); }
  }

  async createAdminSlot(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await counselingService.createAdminSlot(req.body, req.admin!);
      res.status(201).json({ success: true, message: 'Jadwal konseling berhasil dibuat dan dipublikasikan.', data: slot });
    } catch (err) { next(err); }
  }

  async bookSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await counselingService.bookSlot(req.body);
      res.status(201).json({
        success: true,
        message: 'Jadwal konseling berhasil diajukan (DATA SIMULASI)',
        data: result,
      });
    } catch (err) { next(err); }
  }

  async getSupportResources(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resources = await counselingService.getSupportResources();
      res.status(200).json({
        success: true,
        message: 'Daftar layanan pendampingan & hotline krisis berhasil dimuat',
        data: resources,
      });
    } catch (err) { next(err); }
  }
}

export const counselingController = new CounselingController();
