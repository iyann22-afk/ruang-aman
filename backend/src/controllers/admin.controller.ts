import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { adminService } from '../services/admin.service.js';

export class AdminController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await adminService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login petugas berhasil (Sesi Demo Minggu 2)',
        data: result,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: err.message || 'Kredensial login tidak valid',
        errors: [{ message: err.message }],
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({
          success: false,
          message: 'Autentikasi diperlukan',
        });
        return;
      }

      const profile = await adminService.getProfile(req.admin.id);
      res.status(200).json({
        success: true,
        message: 'Profil petugas berhasil dimuat',
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
