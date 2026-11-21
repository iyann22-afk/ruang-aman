import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { adminService } from '../services/admin.service.js';
import { sessionService } from '../services/session.service.js';

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

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
      return;
    }
    const token = authHeader.split(' ')[1];

    const shouldInit = req.query.init === 'true' || req.method === 'POST';

    try {
      // 1. Jika demo token di development
      if (token.startsWith('demo-token-')) {
        const { getRepositoriesSync } = await import('../repositories/repository.factory.js');
        const parts = token.split('-');
        const adminId = parts.slice(3).join('-');
        const admin = await getRepositoriesSync().adminRepository.findById(adminId);
        if (!admin || !admin.is_active) {
          res.status(403).json({ success: false, message: 'Bukan petugas terdaftar atau akun nonaktif' });
          return;
        }

        // HANYA perbarui/inisialisasi sesi jika shouldInit
        if (shouldInit) {
          await sessionService.touchSession(token, admin.id, undefined, req.ip, req.headers['user-agent'] as string);
        } else {
          // Validasi read-only tanpa memperpanjang idle timer
          const val = await sessionService.validateSession(token, admin.id);
          if (!val.valid) {
            res.status(401).json({ success: false, code: val.code, message: val.message });
            return;
          }
        }

        res.json({
          success: true,
          admin: {
            id: admin.id,
            full_name: admin.full_name,
            role: admin.role,
            email: admin.email,
            is_active: admin.is_active,
          },
        });
        return;
      }

      // 2. Verifikasi token Supabase
      const { verifySupabaseToken } = await import('../repositories/supabase/supabase.client.js');
      const user = await verifySupabaseToken(token);
      if (!user) {
        res.status(401).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa' });
        return;
      }

      // 3. Verifikasi hak akses admin & tautkan akun jika email cocok (Account Linking aman)
      const admin = await adminService.verifyAndLinkAdmin(user.id, user.email || '');

      // 4. Inisialisasi sesi atau validasi read-only
      if (shouldInit) {
        const sessionResult = await sessionService.touchSession(
          token,
          admin.id,
          user.id,
          req.ip,
          req.headers['user-agent'] as string
        );

        if (!sessionResult.valid) {
          res.status(401).json({
            success: false,
            code: sessionResult.code,
            message: sessionResult.message || 'Sesi tidak valid',
          });
          return;
        }
      } else {
        const sessionResult = await sessionService.validateSession(token, admin.id, user.id);
        if (!sessionResult.valid) {
          res.status(401).json({
            success: false,
            code: sessionResult.code,
            message: sessionResult.message || 'Sesi tidak valid',
          });
          return;
        }
      }

      res.json({
        success: true,
        admin: {
          id: admin.id,
          full_name: admin.full_name,
          role: admin.role,
          email: admin.email,
          is_active: admin.is_active,
        },
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 403;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Verifikasi petugas gagal',
      });
    }
  }

  async initSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    req.query.init = 'true';
    return this.verify(req, res, next);
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

  // ===== MANAJEMEN PETUGAS (SUPER ADMIN) =====

  async listPetugas(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await adminService.listAdmins();
      res.status(200).json({
        success: true,
        message: 'Daftar petugas berhasil dimuat',
        data: list,
      });
    } catch (err) {
      next(err);
    }
  }

  async createPetugas(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await adminService.createAdmin(req.body);
      res.status(201).json({
        success: true,
        message: `Petugas ${created.full_name} (${created.email}) berhasil didaftarkan.`,
        data: created,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Gagal mendaftarkan petugas baru',
      });
    }
  }

  async updatePetugasRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { role } = req.body;
      const updated = await adminService.updateAdminRole(targetId, role, req.admin!);

      res.status(200).json({
        success: true,
        message: `Peran petugas ${updated.full_name} berhasil diperbarui menjadi ${updated.role}.`,
        data: updated,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Gagal memperbarui peran petugas',
      });
    }
  }

  async updatePetugasStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { is_active } = req.body;
      const updated = await adminService.toggleAdminStatus(targetId, is_active, req.admin!);

      res.status(200).json({
        success: true,
        message: `Status akun petugas ${updated.full_name} berhasil diubah menjadi ${
          updated.is_active ? 'Aktif' : 'Nonaktif'
        }.`,
        data: updated,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Gagal mengubah status aktif petugas',
      });
    }
  }

  // ===== SESSION & HEARTBEAT =====

  async heartbeat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';

      if (token && req.admin) {
        const result = await sessionService.touchSession(
          token,
          req.admin.id,
          req.admin.auth_user_id || undefined,
          req.ip,
          req.headers['user-agent'] as string
        );

        if (!result.valid) {
          res.status(401).json({
            success: false,
            code: result.code,
            message: result.message || 'Sesi tidak valid',
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: 'Sesi aktif diperbarui',
          data: {
            last_activity_at: result.lastActivityAt || new Date().toISOString(),
          },
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Token atau data admin tidak valid',
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';

      if (token) {
        await sessionService.revokeSession(token, req.admin?.id, req.admin?.auth_user_id || undefined);
      }

      res.status(200).json({
        success: true,
        message: 'Sesi petugas berhasil diakhiri dengan aman.',
      });
    } catch (err: any) {
      console.error('[AdminController] Gagal mencabut sesi saat logout:', err?.message);
      res.status(500).json({
        success: false,
        message: 'Gagal mencabut sesi keamanan. Silakan coba lagi.',
      });
    }
  }
}

export const adminController = new AdminController();
