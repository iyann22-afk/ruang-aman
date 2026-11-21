import { NextFunction, Request, Response } from 'express';
import { trackingService } from '../services/tracking.service.js';

export class TrackingController {
  async trackReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tracking_code } = req.body;
      const result = await trackingService.trackReport(tracking_code);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Kode pelacakan tidak ditemukan atau belum terdaftar dalam sistem.',
          errors: [{ field: 'tracking_code', message: 'Laporan tidak ditemukan' }],
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Status laporan berhasil ditemukan',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const trackingController = new TrackingController();
