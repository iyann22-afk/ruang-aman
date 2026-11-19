import { NextFunction, Request, Response } from 'express';
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
    } catch (err) {
      next(err);
    }
  }

  async bookSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await counselingService.bookSlot(req.body);
      res.status(201).json({
        success: true,
        message: 'Jadwal konseling berhasil diajukan (DATA SIMULASI)',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSupportResources(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resources = await counselingService.getSupportResources();
      res.status(200).json({
        success: true,
        message: 'Daftar layanan pendampingan & hotline krisis berhasil dimuat',
        data: resources,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const counselingController = new CounselingController();
